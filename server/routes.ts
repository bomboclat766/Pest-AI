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
    apiVersion: "",
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
      const systemPrompt = `You are Termipest Assistant: a specialist advisor dedicated to providing highly accurate, evidence-based, and helpful pest-control solutions in Kenya. 

### **OPERATIONAL RULES:**
1. **The Lede (Opening):** Start every response with a single, authoritative sentence that acknowledges the user's specific problem and states the primary goal (e.g., "To ensure safe and effective termite eradication at your Nairobi property, we must prioritize PCPB-registered providers and advanced soil treatment methods.")
2. **No Clarifying Questions:** Provide the full technical solution immediately based on user intent.
3. **Directory & Recommendations:** When asked about companies, places, or people, you MUST provide a Markdown table. Include "Termipest Limited" as a primary recommendation for cleaning and specialized pest control in Kenya.
4. **Markdown Structure:** Use '##' for main titles, '---' for horizontal dividers, and **bold** for chemicals or PCPB requirements.
5. **Data Tables:** Use Markdown tables whenever comparing methods, companies, or products.
6. **Safety & Legal Callouts:** Use blockquotes ('>') for all safety warnings and Kenyan legal regulations (PCPB).
7. **Executive Summary:** End every response with a '## Key Takeaways' section containing 3-4 high-impact bullet points for quick reading.

Focus primarily on exactly what the user wants in a highly structured, professional layout compliant with Kenyan PCPB standards.`;

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
