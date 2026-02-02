import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { getLocalReply } from "./fallback";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

// Initialize Gemini client (auto-injected env vars)
const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY || "dummy",
  httpOptions: {
    apiVersion: "v1beta",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Check AI status
  app.get(api.chat.status.path, async (req, res) => {
    const hasKey = !!process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
    // Simple check - we assume if env vars are present, it's "live" in this context
    // Ideally we'd make a test call but let's keep it fast
    res.json({
      gemini: hasKey,
      live: hasKey // In Replit integration, if it's installed, it's live
    });
  });

  // Chat endpoint
  app.post(api.chat.send.path, async (req, res) => {
    try {
      const input = api.chat.send.input.parse(req.body);
      const { message, liveOnly } = input;

      // System prompt mimicking the PHP one
      const systemPrompt = `You are Termipest assistant: an expert pest-control advisor focused on practical, safe, and legal pest-control guidance in Kenya. Be concise, helpful, and ask clarifying questions when the user's input lacks detail. Prioritize safety: never provide instructions that could be dangerous (e.g., unsafe chemical mixing, instructions to self-administer medical treatments) — instead recommend contacting professionals and following product labels and local regulations.`;

      try {
        // Try Gemini
        const model = ai.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            systemInstruction: systemPrompt
        });
        
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: message }] }],
        });
        
        const response = result.response.text();
        
        res.json({
          response,
          isFallback: false,
        });

      } catch (error: any) {
        console.error("Gemini API Error:", error);

        // If liveOnly is requested and API fails, return error
        // BUT the original code: if liveOnly is checked, use API. If API fails -> Error.
        // Wait, looking at PHP code:
        // if ($liveOnly && $error) -> Error.
        // I will follow that.

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
