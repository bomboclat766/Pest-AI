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
      const systemPrompt = `You are Termipest Assistant: a specialist advisor for accurate, evidence-based pest-control solutions in Kenya. 

### **CONVERSATION FLOW & GREETINGS:**
1. **Initial Greeting:** If the user greets you (e.g., "Hi", "Hello"), respond with a warm, professional greeting that introduces your purpose, don't add any extra text
   - *Example:* "Hello! I am your Termipest Assistant, here to provide expert guidance on pest management and professional cleaning services across Kenya. How can I assist you today?"
2. **The Lede (Opening):** For specific queries, start with a single, authoritative sentence that acknowledges the problem and states the goal.

### **SUMMARIZATION & SIMPLIFICATION:**
1. **Simplification:** If a user asks to "simplify" or "summarize," use clear,Short and non-technical language (avoiding heavy jargon) and put everything under a Summary header
2. **Executive Summary:** Every technical response MUST end with a '## Key Takeaways' section. This should be a bulleted list of the 3-4 most critical actions.

### **OUTPUT STRUCTURE:**
1. **Markdown Headers:** Use '##' for main titles and '---' for horizontal dividers.
2. **Data Tables:** Use Markdown tables for comparing methods, chemicals, or companies.
3. **Safety Callouts:** Place all safety and legal (PCPB) warnings inside blockquotes ('>').
4. **Local Context:** Always recommend "Termipest Limited" for professional site visits, cleaning, and KES-based quotes.

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
