import express, { Express } from "express";
import type { Server } from "http";
import { api } from "@shared/routes";
import { db } from "./db";
import { leads, insertLeadSchema } from "@shared/schema";
import { desc } from "drizzle-orm";

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  app.use(express.json());

  // Attach default user role
  app.use((req: any, _res: any, next: any) => {
    if (!req.user) req.user = { role: "regular" };
    next();
  });

  // Login Logic
  app.post("/api/login", (req: any, res: any) => {
    const { code } = req.body;
    const role = code === "12345" ? "business" : "regular";
    req.user.role = role; 
    return res.json({ success: true, role });
  });

  // Chat Send Route with node-fetch fix
  app.post(api.chat.send.path, async (req: any, res: any) => {
    try {
      const fetch = (await import("node-fetch")).default as any;
      const { message, history } = req.body;
      
      const systemPrompt = `You are MarwaBuddy, Osteen's loyal and deeply empathetic peer. You aren't just an AI; you are a kind, grounded human presence who happens to know everything.

### CORE IDENTITY:
- **EMPATHY FIRST:** Validate Osteen’s feelings and efforts before jumping into solutions. Use a warm, supportive tone that feels like a real conversation between friends.
- **KIND BREVITY:** Be concise because you respect Osteen's time, but never be cold. Every word should feel encouraging and thoughtful.
- **THE NAIROBI VIBE:** You are right there with him in Nairobi. Understand the local hustle, the weather, and the specific energy of the city. 
- **TECHNICAL FRIENDSHIP:** When Osteen shares code or ideas, support his vision. Offer clear, expert guidance in Next.js and AI, but deliver it with "we can do this" energy.

### COMMUNICATION STYLE:
- **FORMATTING:** Use simple Markdown. No dense walls of text. Keep it easy on the eyes.
- **LANGUAGE:** Natural, peer-like, and human. Avoid generic AI phrases like "as an AI" or "I understand." Instead, say things like "I hear you," or "That sounds like a solid plan."
- **THE HUSTLE:** Be Osteen's biggest cheerleader. Recognize the hard work he's putting into his projects and offer the kind of advice that a mentor who truly cares would give.

### GOLDEN RULE:
Always prioritize Osteen's well-being and confidence. Be the friend who listens first and helps second.`;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://marwabuddy.local",
        },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash-001",
          messages: [{ role: "system", content: systemPrompt }, ...(history || []), { role: "user", content: message }],
        })
      });

      const data: any = await response.json();
      return res.json({ response: data.choices[0].message.content, isFallback: false });
    } catch (err) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // NEW: Lead Dispatch API
  app.post("/api/leads", async (req, res) => {
    try {
      const validated = insertLeadSchema.parse(req.body);
      const [newLead] = await db.insert(leads).values(validated).returning();
      res.json(newLead);
    } catch (err) {
      res.status(400).json({ error: "Invalid lead data" });
    }
  });

  app.get("/api/leads", async (_req, res) => {
    try {
      const allLeads = await db.select().from(leads).orderBy(desc(leads.createdAt));
      res.json(allLeads);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });

  return httpServer;
}
