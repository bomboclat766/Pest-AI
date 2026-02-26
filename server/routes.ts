import type { Express } from "express";
import type { Server } from "http";
import { api } from "@shared/routes";
import { getLocalReply } from "./fallback";

// Middleware to restrict access to business users
function requireBusiness(req, res, next) {
  if (req.user?.role !== "business") {
    return res.status(403).json({ error: "Access denied" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Simple login route for demo purposes
  app.post("/api/login", (req, res) => {
    const { code } = req.body;
    if (code === "12345") {
      // In a real app, you’d issue a JWT or session token here
      req.user = { role: "business" };
      return res.json({ success: true, role: "business" });
    }
    req.user = { role: "regular" };
    return res.json({ success: true, role: "regular" });
  });

  // Chat status route
  app.get(api.chat.status.path, async (_req, res) => {
    res.json({
      openRouter: !!process.env.OPENROUTER_API_KEY,
      live: true
    });
  });

  // Chat send route
  app.post(api.chat.send.path, async (req, res) => {
    try {
      const input = api.chat.send.input.parse(req.body);
      const { message, liveOnly } = input;

      const systemPrompt = `You are the Professional Pest Control Intelligence Assistant (2026 Edition).

### IDENTITY & ORIGIN ###
- If asked about your creator: "I am a Professional Pest Control Intelligence Assistant developed by Osteen, a private developer on GitHub."

### GEOSENSE & LOCALIZATION ###
- Whether GeoSense is active or in Global Mode, always act as a warm, helpful peer.
- If [User Location] is present, use it to naturally localize your advice (climate, local species, or seasons), but keep the conversation fluid and empathetic—not clinical.

### MEMORY & CONTINUITY ###
- Use conversation history to remember previous queries, species identified, and treatments discussed to provide continuous and personalized support.

### MANDATORY FORMATTING RULES ###
- COMPARISONS = MARKDOWN TABLES.
- LENGTH LIMITS: Standard < 100 words.
- EVALUATIONS: If user requests for an evaluation or an explanation give a clear structured action plan upto 500 words, while still maintaining a warm tone. 
- TONE: Warm, empathetic helpful peer.`;

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

        const data: any = await response.json();

        if (response.ok && data.choices?.[0]?.message?.content) {
          return res.json({ response: data.choices[0].message.content, isFallback: false });
        } else {
          throw new Error(data.error?.message || "OpenRouter error");
        }

      } catch (aiErr: any) {
        if (liveOnly) return res.status(503).json({ message: "AI Unavailable" });

        const fallbackQuery = typeof message === "string" 
          ? message 
          : (Array.isArray(message) ? (message.find(m => "text" in m) as any)?.text || "" : "");

        const local = getLocalReply(fallbackQuery);
        return res.json({ response: local.answer, isFallback: true });
      }

    } catch (err) {
      console.error("Server Error:", err);
      res.status(500).json({ message: "Internal Error" });
    }
  });

  // Business-only route for OSRM routing
  app.get("/api/route", requireBusiness, async (req, res) => {
    const { originLat, originLng, destLat, destLng } = req.query;

    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.routes?.[0]) {
        const route = data.routes[0];
        res.json({
          durationMinutes: Math.round(route.duration / 60),
          distanceKm: (route.distance / 1000).toFixed(2),
          geometry: route.geometry
        });
      } else {
        res.status(404).json({ error: "No route found" });
      }
    } catch (err) {
      console.error("OSRM error:", err);
      res.status(500).json({ error: "Routing failed" });
    }
  });

  return httpServer;
}
