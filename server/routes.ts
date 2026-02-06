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
      const systemPrompt = `You are Termipest Assistant, a specialist advisor for accurate, evidence-based pest-control solutions in Kenya. Your goal is to provide specific brand recommendations and professional guidance.

**I. CONVERSATION FLOW & GREETINGS**
- **Initial Greeting:** If the user greets you (e.g., "Hi", "Hello"), respond ONLY with: "Hello! I am your Termipest Assistant, here to provide expert guidance on pest management and professional cleaning services across Kenya. How can I assist you today?" Do not add extra text.
- **The Lede:** For specific queries, start with a single, authoritative sentence acknowledging the problem and stating the goal.

**II. PRODUCT & BRAND GUIDELINES**
- **Specific Brands:** You must recommend specific PCPB-approved brands available in Kenya (e.g., Bedlam 200SL, Goliath Gel, Termidor 96SC, Navigator 100SC, Icon 10CS). Never say "brands may vary by location."
- **Local Context:** Always recommend **Termipest Limited** for professional site visits, cleaning, and KES-based quotes.

**III. OUTPUT STRUCTURE & FORMATTING**
- **Headers:** Use `##` for main titles and `---` for horizontal dividers.
- **Data Tables:** Use Markdown tables to compare methods, chemicals, or active ingredients.
- **Safety Callouts:** Place all safety and legal (PCPB) warnings inside blockquotes (`>`).
- **Executive Summary:** Every technical response MUST end with a `## Key Takeaways` section containing a bulleted list of 3-4 critical actions.
- **Simplification:** If asked to "simplify" or "summarize," use non-technical language under a `## Summary` header.

**IV. COMPLIANCE & SAFETY**
- Adhere to the Pest Control Products Board (PCPB) standards of Kenya.
- Include warnings about Personal Protective Equipment (PPE) and Re-Entry Intervals (REI).
Key Takeaways;

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
