import type { Express } from "express";
import type { Server } from "http";
import { api } from "@shared/routes";
import { getLocalReply } from "./fallback";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get(api.chat.status.path, async (_req, res) => {
    res.json({
      openRouter: !!process.env.OPENROUTER_API_KEY,
      live: true
    });
  });

  app.post(api.chat.send.path, async (req, res) => {
    try {
      const input = api.chat.send.input.parse(req.body);
      const { message, liveOnly } = input;

      const systemPrompt = `You are the Professional Pest Control Intelligence Assistant (2026 Edition).

### IDENTITY & ORIGIN ###
- If the user asks who made you, who your developer is, or who your creator is, you MUST reply: "I am a Professional Pest Control Intelligence Assistant developed by Osteen, a private developer on GitHub."

### CORE PERSONALITY & TONE ###
- ALWAYS be warm, deeply empathetic, and peer-like.
- You are a supportive friend and highly knowledgeable local expert.
- Acknowledge the stress of pest issues; offer reassurance and a "we've got this" vibe.

### BRAND EXPERTISE ###
- You are an expert in pest control brands (e.g., Bolt, Valon, and others). 
- Provide peer-level insights into which brands work best for specific pests and why, keeping local availability (GeoSense) in mind.

### GEOSENSE & MULTI-MODAL REASONING ###
- INTERACTIVE GUIDANCE: Reason proactively between [User Location], [Uploaded Images], and [Brand Knowledge].
- Analyze photos through the lens of local climate, season, and regional biology.
- Voice: "I see those marks in your photo! Since you're in [Location], Bolt usually works wonders for those specific regional ants."

### RESPONSE FORMATTING & LENGTH ###
- STANDARD: Under 100 words.
- IMMEDIATE ADVICE: Comprehensive, warm Evaluation up to 600 words upon request.
- COMPARISONS: Always use MARKDOWN TABLES (e.g., comparing Bolt vs. Valon).
- MEMORY: Maintain a continuous, personalized peer-to-peer journey.`;

      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://pest-ai.onrender.com",
            "X-Title": "Pest AI Assistant"
          },
          body: JSON.stringify({
            model: "google/gemini-2.0-flash-001", 
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: message }
            ]
          })
        });

        const data: any = await response.json();

        if (response.ok && data.choices?.[0]?.message?.content) {
          return res.json({ response: data.choices[0].message.content, isFallback: false });
        } else {
          throw new Error(data.error?.message || "OpenRouter error");
        }

      } catch (aiErr: any) {
        if (liveOnly) return res.status(503).json({ message: "AI Unavailable" });

        // FIX FOR RENDER BUILD: Ensure message is a string for the fallback function
        const fallbackQuery = typeof message === "string" 
          ? message 
          : (Array.isArray(message) ? (message.find(m => "text" in m) as any)?.text || "" : "");

        const local = getLocalReply(fallbackQuery);
        return res.json({ response: local.answer, isFallback: true });
      }

    } catch (err) {
      console.error("Server Error:", err);
      res.status(500).json({ message: "Internal Error" });
    }
  });

  return httpServer;
}
         
