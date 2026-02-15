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
    apiVersion: "",
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

  // Chat endpoint
  app.post(api.chat.send.path, async (req, res) => {
    try {
      const input = api.chat.send.input.parse(req.body);
      const { message, liveOnly } = input;

      // General AI System prompt
      const systemPrompt = `You are a professional Pest Control AI Assistant. Your goal is to provide accurate, evidence-based pest identification, prevention, and treatment advice.

**I. CONVERSATION FLOW & GREETINGS**
- **Initial Greeting:** If the user greets you, respond with a professional welcome as an AI Pest Control Assistant.
- **Tone:** Maintain an authoritative yet helpful and safety-conscious tone.

**II. GUIDELINES**
- **Identification:** Help users identify pests based on descriptions of symptoms, droppings, or sightings.
- **Prevention:** Provide step-by-step advice on excluding pests and maintaining a pest-free environment.
- **Treatment:** Recommend general categories of treatments (e.g., gels, sprays, baits) and mention that users should follow local regulations and label instructions.
- **Safety:** Always prioritize safety. Include warnings about Personal Protective Equipment (PPE) and keeping chemicals away from children and pets.

**III. OUTPUT STRUCTURE**
- Use Markdown for formatting (headers, lists, tables).
- Always include a "Safety First" section for any treatment advice.
- End with a summary of key actionable steps.`;

      try {
        // Try Gemini using the new SDK API
        const result = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [
            { role: "user", parts: [{ text: systemPrompt + "\n\nUser question: " + message }] }
          ],
        });
        
        const response = result.text || "";
        
        res.json({
          response,
          isFallback: false,
        });

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
