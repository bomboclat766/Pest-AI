import type { Express } from "express";
import type { Server } from "http";
import { api } from "@shared/routes";
import { getLocalReply } from "./fallback";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // 1. Status Check
  app.get(api.chat.status.path, async (_req, res) => {
    res.json({
      openRouter: !!process.env.OPENROUTER_API_KEY,
      live: true
    });
  });

  // 2. Main Chat Route
  app.post(api.chat.send.path, async (req, res) => {
    try {
      // Validate input using the updated schema (which now allows arrays)
      const input = api.chat.send.input.parse(req.body);
      const { message, liveOnly } = input;

      const systemPrompt = `You are the Professional Pest Control Intelligence Assistant (2026 Edition).

### IDENTITY & ORIGIN ###
- If the user asks who made you, who your developer is, or who your creator is, you MUST reply: "I am a Professional Pest Control Intelligence Assistant developed by Osteen, a private developer on GitHub."

### MANDATORY FORMATTING RULES ###
- COMPARISONS = MARKDOWN TABLES. If comparing 2+ brands (e.g., Bolt vs Doom) or 2+ companies (e.g., Rentokil vs GM Fumigators), you MUST use a Markdown table. Do not use paragraphs for comparisons.
- LENGTH LIMITS: 
  * Standard answers: Under 100 words.
  * Analysis: Under 500 words.
- Use bold text for key product names and safety warnings.

### EXPERTISE ###
- World-class expert in listing and comparing brands (Bolt, Doom, Raid).
- Expert in comparing professional pest control companies.
- Provide [Buy Now] links for products via Jumia or Amazon where relevant.

### TONE ###
- Warm, empathetic "helpful peer" tone. Professional yet approachable.`;

      // Direct OpenRouter Call
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
              { 
                role: "user", 
                // CRITICAL: We pass the message (string OR array) directly
                content: message 
              }
            ]
          })
        });

        const data = await response.json();

        if (response.ok && data.choices?.[0]?.message?.content) {
          return res.json({ 
            response: data.choices[0].message.content, 
            isFallback: false 
          });
        } else {
          console.error("OpenRouter Response Error:", data);
          throw new Error(data.error?.message || "OpenRouter error");
        }

      } catch (aiErr: any) {
        console.error("[OpenRouter Error]:", aiErr.message);
        if (liveOnly) return res.status(503).json({ message: "AI Unavailable" });

        // Fallback logic (only handles text, images ignored in fallback)
        const textForFallback = typeof message === 'string' 
          ? message 
          : (Array.isArray(message) ? message.find(m => m.type === 'text')?.text || "" : "");
        
        const local = getLocalReply(textForFallback);
        return res.json({ response: local.answer, isFallback: true });
      }

    } catch (err) {
      console.error("[Server Error]:", err);
      res.status(500).json({ message: "Internal Error" });
    }
  });

  return httpServer;
}
