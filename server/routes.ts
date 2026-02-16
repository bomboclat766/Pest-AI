import type { Express } from "express";
import type { Server } from "http";
import { api } from "@shared/routes";
import { getLocalReply } from "./fallback";
import { checkAndConsume, getStatus } from "./rateLimiter";
import { z } from "zod";

// Configuration for OpenRouter
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const SITE_URL = process.env.SITE_URL || "https://pest-ai.onrender.com";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // 1. Check AI status
  app.get(api.chat.status.path, async (_req, res) => {
    const hasKey = !!OPENROUTER_API_KEY && OPENROUTER_API_KEY !== "dummy";
    res.json({
      gemini: hasKey,
      live: hasKey
    });
  });

  // 2. Client-side error reporting
  app.post('/api/client-error', async (req, res) => {
    try {
      console.error('[client-error]', { ip: req.ip, body: req.body });
    } catch (e) {
      console.error('[client-error] failed to log', e);
    }
    res.json({ ok: true });
  });

  // 3. Chat endpoint
  app.post(api.chat.send.path, async (req, res) => {
    try {
      const input = api.chat.send.input.parse(req.body);
      const { message, liveOnly } = input;

      // Rate Limiting Logic
      const limiterKey = OPENROUTER_API_KEY || 'public';
      const status = checkAndConsume(limiterKey);
      if (!status.ok) {
        const retry = status.retryAfterSeconds || 60;
        res.setHeader('Retry-After', String(retry));
        return res.status(429).json({ 
          message: 'Rate limit exceeded', 
          retryAfter: retry, 
          status: getStatus(limiterKey) 
        });
      }

      // Professional Pest Control System Prompt
      const systemPrompt = `You are the Professional Pest Control Intelligence Assistant (2026 Edition).
      Mandatory: Use Markdown tables for comparisons.
      Mandatory: Include a 'Safety Protocol' section (PPE, label law).
      Knowledge: Isocycloseram (Plinazolin), Cyclobutrifluram, and Icafolin.`;

      // OpenRouter Request
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'HTTP-Referer': SITE_URL,
            'X-Title': "Pest AI Assistant",
          },
          body: JSON.stringify({
            model: process.env.AI_MODEL || "google/gemini-flash-1.5",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: message }
            ]
          })
        });

        const data = await response.json();

        if (response.ok && data.choices?.[0]?.message?.content) {
          const aiText = data.choices[0].message.content;
          return res.json({ response: aiText, isFallback: false });
        } else {
          throw new Error(data.error?.message || "OpenRouter failed to return content");
        }

      } catch (aiErr: any) {
        console.error('[OpenRouter Error]:', aiErr.message);

        if (liveOnly) {
          return res.status(503).json({
            message: 'AI unavailable',
            details: aiErr.message,
          });
        }

        // Fallback to local response if OpenRouter fails
        const local = getLocalReply(message);
        return res.json({ 
          response: local.answer, 
          isFallback: true, 
          note: `Fell back due to OpenRouter error: ${aiErr.message}` 
        });
      }

    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}
