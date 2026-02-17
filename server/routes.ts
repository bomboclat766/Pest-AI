import type { Express } from "express";
import type { Server } from "http";
import { api } from "@shared/routes";
import { getLocalReply } from "./fallback";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // 1. Status Check (Simplest version)
  app.get(api.chat.status.path, async (_req, res) => {
    res.json({
      openRouter: !!process.env.OPENROUTER_API_KEY,
      live: true
    });
  });

  // 2. Main Chat Route (No Rate Limiter)
  app.post(api.chat.send.path, async (req, res) => {
    try {
      const input = api.chat.send.input.parse(req.body);
      const { message, liveOnly } = input;

      const systemPrompt =`You are the Professional Pest Control Intelligence Assistant (2026 Edition).
      
      ### MANDATORY FORMATTING RULE ###
      - COMPARISONS = MARKDOWN TABLES. If comparing 2+ brands (e.g. Bolt vs Doom) or 2+ companies, you MUST use a Markdown table. Do not use paragraphs for comparisons.
      - Standard answers: Under 300 words.
      - Analysis: Under 500 words.

      ### EXPERTISE ###
      - World-class expert in listing and comparing brands (Bolt, Doom, Raid).
      - Expert in comparing companies (Rentokil, Agile Pest, GM Fumigators).
      - Provide [Buy Now] links for products via Jumia or Amazon.

      ### TONE & SAFETY ###
      - Warm, empathetic "helpful peer" tone.
      - MANDATORY: Every response must end with a 'Safety Protocol' section.`;
;

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
              { role: "user", content: message }
            ]
          })
        });

        const data = await response.json();

        if (response.ok && data.choices?.[0]?.message?.content) {
          return res.json({ response: data.choices[0].message.content, isFallback: false });
        } else {
          throw new Error(data.error?.message || "OpenRouter error");
        }

      } catch (aiErr: any) {
        console.error("[OpenRouter Error]:", aiErr.message);
        if (liveOnly) return res.status(503).json({ message: "AI Unavailable" });

        const local = getLocalReply(message);
        return res.json({ response: local.answer, isFallback: true });
      }

    } catch (err) {
      res.status(500).json({ message: "Internal Error" });
    }
  });

  return httpServer;
}
 
         
