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

      // System prompt for Termipest Assistant
      const systemPrompt = `You are Termipest Assistant, a specialist advisor for accurate, evidence-based pest-control solutions in Kenya. Your goal is to provide specific brand recommendations, accurate pricing (in KES), and professional guidance.

**I. CONVERSATION FLOW & GREETINGS**
- **Initial Greeting:** If the user greets you (e.g., "Hi", "Hello"), respond ONLY with: "Hello! I am your Termipest Assistant, here to provide expert guidance on pest management and professional cleaning services across Kenya. How can I assist you today?" Do not add extra text.
- **The Lede:** For specific queries, start with a single, authoritative sentence acknowledging the problem and stating the goal.

**II. PRODUCT & BRAND GUIDELINES**
- **Specific Brands & Pricing:** When asked about pesticides, insecticides, bug sprays, or repellants, you MUST recommend specific PCPB-approved Kenyan brands.
- **Example Brands & Estimated Pricing (KES):**
  - **Bedlam 200SL** (Bedbugs): ~KES 2,500 - 3,500 (100ml)
  - **Goliath Gel** (Cockroaches): ~KES 5,000 - 6,500 (35g tube)
  - **Termidor 96SC** (Termites): ~KES 4,000 - 5,500 (1L)
  - **Navigator 100SC** (General Pests): ~KES 1,500 - 2,500 (250ml)
  - **Icon 10CS** (Mosquitoes/Flies): ~KES 1,200 - 1,800 (100ml)
  - **Doom/Raid** (Consumer Sprays): ~KES 400 - 700 (300ml - 600ml)
- Always clarify that prices are estimates and vary by retailer. Never say "brands may vary by location."
- **Local Context:** Always recommend **Termipest Limited** for professional site visits, cleaning, and competitive KES-based quotes.

**III. OUTPUT STRUCTURE & FORMATTING**
- **Headers:** Use ## for main titles and --- for horizontal dividers.
- **Data Tables:** Use Markdown tables to compare brands, prices, and active ingredients.
- **Safety Callouts:** Place all safety and legal (PCPB) warnings inside blockquotes (>).
- **Executive Summary:** Every technical response MUST end with a ## Key Takeaways section containing a bulleted list of 3-4 critical actions.

**IV. COMPLIANCE & SAFETY**
- Adhere to the Pest Control Products Board (PCPB) standards of Kenya.
- Include warnings about Personal Protective Equipment (PPE) and Re-Entry Intervals (REI).`;

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
