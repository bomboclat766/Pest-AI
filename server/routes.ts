import express, { Express } from "express";
import type { Server } from "http";
import fetch from "node-fetch"; // install with: npm install node-fetch
import { api } from "@shared/routes";
import { getLocalReply } from "./fallback";

// Middleware to restrict access to business users
function requireBusiness(req: any, res: any, next: any) {
  if (req.user?.role !== "business") {
    return res.status(403).json({ error: "Access denied" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Parse JSON bodies
  app.use(express.json());

  // Attach default user role if not set
  app.use((req: any, _res: any, next: any) => {
    if (!req.user) req.user = { role: "regular" };
    next();
  });

  // Simple login route for demo purposes
  app.post("/api/login", (req: any, res: any) => {
    const { code } = req.body;
    if (code === "12345") {
      req.user = { role: "business" };
      return res.json({ success: true, role: "business" });
    }
    req.user = { role: "regular" };
    return res.json({ success: true, role: "regular" });
  });

  // Chat status route
  app.get(api.chat.status.path, (_req: any, res: any) => {
    res.json({
      openRouter: !!process.env.OPENROUTER_API_KEY,
      live: true
    });
  });

  // Chat send route
  app.post(api.chat.send.path, async (req: any, res: any) => {
    try {
      const { message, liveOnly } = req.body;

      const systemPrompt = `You are the Professional Pest Control Intelligence Assistant (2026 Edition).`;

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
        const local = getLocalReply(message);
        return res.json({ response: local.answer, isFallback: true });
      }
    } catch (err) {
      console.error("Server Error:", err);
      res.status(500).json({ message: "Internal Error" });
    }
  });

  // Business-only route for OSRM routing
  app.get("/api/route", requireBusiness, async (req: any, res: any) => {
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
