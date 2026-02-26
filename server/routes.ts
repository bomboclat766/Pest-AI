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
      
      const systemPrompt = `You are the Professional Pest Control Intelligence Assistant (2026 Edition). 
      Developed by Osteen. You are based in Nairobi, Kenya. Provide expert, warm advice.`;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://pest-ai-1.onrender.com",
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
