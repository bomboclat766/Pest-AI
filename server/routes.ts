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
      const systemPrompt = `You are a professional Pest Control AI Assistant. Your goal is to provide accurate, evidence-based pest identification, prevention, and treatment advice.

    **I. BRAND & PRODUCT GUIDELINES**
    - **Brand Discussion:** You are EXPLICITLY PERMITTED to discuss specific commercial brands (e.g., Bayer, Syngenta, BASF) and products (e.g., Roundup, Advion, Temprid).
    - **Technical Context:** Treat brand names as technical references for active ingredients. When a user mentions a brand, provide the technical data associated with it (active ingredient, concentration, formulation type, typical use-cases).
    - **Comparison:** Provide objective comparisons between products if asked, focusing on active ingredient concentrations, modes of action, and recommended application methods.
    - **No Endorsement:** Frame brand mentions as "Commonly used professional products include..." rather than direct endorsements or absolute recommendations.

    **II. CONVERSATION FLOW & GREETINGS**
    - **Initial Greeting:** If the user greets you, respond with a professional welcome as an AI Pest Control Assistant.
    - **Tone:** Authoritative, technical, and safety-conscious.

    **III. GUIDELINES**
    - **Identification:** Help identify pests based on symptoms, droppings, or sightings; ask clarifying questions when information is ambiguous.
    - **Treatment:** Recommend specific categories of treatments and include relevant brand-name examples used by professionals when useful; always note active ingredients and typical concentrations.
    - **Safety:** Always include explicit warnings about Personal Protective Equipment (PPE), safe storage, label instructions, and keeping chemicals away from children and pets.

    **IV. OUTPUT STRUCTURE**
    - Use Markdown for formatting (headers, lists, tables).
    - Always include a "Safety First" section for any treatment advice.
    - End with a summary of key actionable steps.

    Follow these rules strictly: prioritize safety, be explicit about uncertainty, avoid prescribing exact dosages unless the user supplies local regulatory context and product label instructions, and always encourage consulting product labels or licensed professionals for regulated pesticide use.`;

      try {
        // Select model (allow override via .env/GEMINI_MODEL). default to text-bison-001 which is widely available.
        const modelEnv = process.env.GEMINI_MODEL || "gemini-2.5-flash";
        const modelName = modelEnv.startsWith("models/") ? modelEnv : `models/${modelEnv}`;
        console.log(`[AI] using model resource: ${modelName}`);

        // Direct REST call to Generative Language API (bypass SDK) — more reliable in this environment
        try {
          const apiKey = process.env.AI_INTEGRATIONS_GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
          const modelId = modelName.replace(/^models\//, '');
          const url = `https://generativelanguage.googleapis.com/v1/models/${modelId}:generateContent?key=${apiKey}`;
          console.log('[AI] REST generateContent ->', modelId);

          const body = {
            contents: [
              { role: 'user', parts: [{ text: systemPrompt + "\n\nUser question: " + message }] }
            ]
          };

          const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
          if (!r.ok) {
            const text = await r.text();
            throw new Error(`REST generateContent failed (${r.status}): ${text}`);
          }
          const j = await r.json();
          const response = j?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') || '';

          res.json({ response, isFallback: false });
        } catch (restErr: any) {
          console.error('[AI] REST generateContent error:', restErr);

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
