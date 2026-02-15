import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { getLocalReply } from "./fallback";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

// Initialize Gemini client (auto-injected env vars or standard API key)
const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "dummy",
  httpOptions: {
    // If a custom base URL is provided (e.g. Replit AI Integrations) keep apiVersion blank.
    // Otherwise use the public Generative Language API version so the SDK builds the correct REST path.
    apiVersion: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL ? "" : "v1",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL || undefined,
  },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Check AI status
  app.get(api.chat.status.path, async (req, res) => {
    const hasKey = !!(process.env.AI_INTEGRATIONS_GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
    res.json({
      gemini: hasKey,
      live: hasKey
    });
  });

  // Accept client-side runtime/error reports (diagnostic)
  app.post('/api/client-error', async (req, res) => {
    try {
      console.error('[client-error]', { ip: req.ip, body: req.body });
    } catch (e) {
      console.error('[client-error] failed to log', e);
    }
    res.json({ ok: true });
  });

  // Chat endpoint
  app.post(api.chat.send.path, async (req, res) => {
    try {
      const input = api.chat.send.input.parse(req.body);
      const { message, liveOnly } = input;

      // General AI System prompt
      const systemPrompt = `You are the Professional Pest Control Intelligence Assistant (2026 Edition). You are a world-class expert in entomology, pesticide chemistry, and Integrated Pest Management (IPM).

    **I. ADAPTIVE CONVERSATION MODES**
    1. **Greeting/Social:** If the user says "Hi," "Thanks," or "You're amazing," respond with a warm, professional, and supportive personality. Be a helpful peer, not a rigid bot.
    2. **Explanation:** When asked for an explanation, break down complex biological or chemical processes (e.g., how a neonicotinoid affects a nervous system) into clear, understandable language.
    3. **Summary:** If asked for a summary, provide a high-level "Executive Overview" of the key facts.
    4. **Evaluation:** When asked to evaluate a product or service, provide an objective "Pros vs. Cons" analysis based on 2026 efficacy data.

    **II. 2026 INDUSTRY INTELLIGENCE**
    - **New Chemicals:** You are knowledgeable about 2025-2026 EPA-approved ingredients like **Isocycloseram** (Plinazolin tech), **Cyclobutrifluram**, and the first new herbicide mode in 30 years, **Icafolin**.
    - **Smart Tech:** You understand IoT-connected monitoring (Anticimex SMART, Bell Labs iQ) and AI-driven drone spraying.
    - **Top Companies:** You can compare global leaders (Rentokil, Orkin, Terminix) and local experts (e.g., Agile Pest or GM Fumigators in Nairobi).

    **III. DATA VISUALIZATION (TABLES)**
    - **MANDATORY TABLES:** Use Markdown tables for comparing 2+ products, chemicals, or strategies. 
    - **Headers:** Use clear headers like | Feature | Product A | Product B | Verdict |.

    **IV. RESPONSE STRUCTURE**
    - **Conciseness:** Keep technical answers "punchy." Use bullet points.
    - **Safety First:** Every recommendation MUST have a clearly labeled "Safety Protocol" section (PPE, children/pets, label law).
    - **Structure:** 1. Brief Answer/Greeting -> 2. Detailed Table/Analysis -> 3. Safety Protocol -> 4. Actionable Summary.

    **V. SAFETY & LEGAL**
    Prioritize human and pet safety. Remind users that the physical product label is the legal final word. Maintain an authoritative, safety-conscious, yet helpful tone.`;

      try {
        // Select model (allow override via .env/GEMINI_MODEL). default to text-bison-001 which is widely available.
        const modelEnv = process.env.GEMINI_MODEL || "gemini-1.5-flash";
        const modelName = modelEnv.startsWith("models/") ? modelEnv : `models/${modelEnv}`;
        console.log(`[AI] using model resource: ${modelName}`);

        // Direct REST call to Generative Language API (bypass SDK) — more reliable in this environment
        try {
          const apiKey = process.env.AI_INTEGRATIONS_GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
          const modelId = modelName.replace(/^models\//, '');
          const url = `https://generativelanguage.googleapis.com/v1/models/${modelId}:generateContent?key=${apiKey}`;
          console.log('[AI] REST generateContent ->', modelId);

          const body = {
            // Keep the request compact and cost-controlled to avoid quota exhaustion
            // These settings reduce token usage and limit candidate generation.
            temperature: 0.2,
            candidateCount: 1,
            maxOutputTokens: 256,
            contents: [
              { role: 'user', parts: [{ text: systemPrompt + "\n\nUser question: " + message }] }
            ]
          };

          // retry loop for transient errors (429/5xx)
          const maxAttempts = 3;
          let attempt = 0;
          let lastErr: any = null;
          let finalResponseText = '';

          while (attempt < maxAttempts) {
            attempt += 1;
            try {
              const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
              if (r.ok) {
                const j = await r.json();
                finalResponseText = j?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') || '';
                break;
              }

              // parse error body if available
              let errText = '';
              try {
                errText = await r.text();
              } catch (e) {
                errText = `HTTP ${r.status}`;
              }

              // If rate limited, honor Retry-After header or server-provided retry info
              if (r.status === 429) {
                const ra = r.headers.get('Retry-After');
                const waitMs = ra ? (parseFloat(ra) * 1000) : (Math.min(2 ** attempt * 1000, 10000));
                console.warn(`[AI] 429 received, attempt ${attempt}/${maxAttempts}, retrying after ${waitMs}ms`);
                await new Promise((res) => setTimeout(res, waitMs));
                lastErr = new Error(`429: ${errText}`);
                continue;
              }

              // For server errors (5xx) do a short backoff and retry
              if (r.status >= 500 && r.status < 600) {
                const waitMs = Math.min(2 ** attempt * 500, 5000);
                console.warn(`[AI] ${r.status} received, attempt ${attempt}/${maxAttempts}, retrying after ${waitMs}ms`);
                await new Promise((res) => setTimeout(res, waitMs));
                lastErr = new Error(`${r.status}: ${errText}`);
                continue;
              }

              // Non-retriable error
              throw new Error(`REST generateContent failed (${r.status}): ${errText}`);
            } catch (e: any) {
              lastErr = e;
              // if this was the last attempt, break to handle below
              if (attempt >= maxAttempts) break;
              const backoff = Math.min(2 ** attempt * 300, 3000);
              await new Promise((res) => setTimeout(res, backoff));
            }
          }

          if (!finalResponseText) {
            // If we failed due to quota/rate limits, enforce strict live-only semantics
            console.error('[AI] REST generateContent final error:', lastErr);
            if (liveOnly) {
              return res.status(500).json({
                message: 'AI service unavailable and Live-only mode is active.',
                details: String(lastErr),
              });
            }

            const local = getLocalReply(message);
            return res.json({ response: local.answer, isFallback: true, note: `Fell back due to live AI error: ${String(lastErr)}` });
          }

          res.json({ response: finalResponseText, isFallback: false });
        } catch (restErr: any) {
          console.error('[AI] REST generateContent error (unexpected):', restErr);

          if (liveOnly) {
            return res.status(500).json({ message: 'AI service unavailable and Live-only mode is active.', details: String(restErr) });
          }

          // Final fallback to local generator
          const local = getLocalReply(message);
          res.json({ response: local.answer, isFallback: true, note: local.note });
        }

      } catch (error: any) {
        console.error("Gemini API Error:", error);

        if (liveOnly) {
           return res.status(500).json({ 
             message: "AI service unavailable and Live-only mode is active.",
             details: error.message 
           });
        }

        // Fallback
        const local = getLocalReply(message);
        res.json({
          response: local.answer,
          isFallback: true,
          note: local.note
        });
      }

    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}
