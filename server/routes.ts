import express, { Express } from "express";
import type { Server } from "http";
import fetch from "node-fetch"; 
import { api } from "@shared/routes";
import { getLocalReply } from "./fallback";

// Middleware: In a real app, use sessions/JWT. For this demo, 
// we check the role we manually attached in the previous middleware.
function requireBusiness(req: any, res: any, next: any) {
  if (req.user?.role !== "business") {
    return res.status(403).json({ error: "Access denied. Business role required." });
  }
  next();
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  app.use(express.json());

  // Attach default user role (simulating session/auth state)
  app.use((req: any, _res: any, next: any) => {
    if (!req.user) req.user = { role: "regular" };
    next();
  });

  // Demo Login: Updates the "session" role
  app.post("/api/login", (req: any, res: any) => {
    const { code } = req.body;
    const role = code === "12345" ? "business" : "regular";
    req.user.role = role; // Update the existing object
    return res.json({ success: true, role });
  });

  // Chat Send Route
  app.post(api.chat.send.path, async (req: any, res: any) => {
    try {
      const { message, history, liveOnly } = req.body;
      const systemPrompt = `You are the Professional Pest Control Intelligence Assistant (2026 Edition). Developed by Osteen. Use Markdown tables for comparisons.`;

      // Construct messages including history if provided
      const chatMessages = [
        { role: "system", content: systemPrompt },
        ...(history || []),
        { role: "user", content: message }
      ];

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
            messages: chatMessages
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
        const local = getLocalReply(typeof message === 'string' ? message : "Analyze image");
        return res.json({ response: local.answer, isFallback: true });
      }
    } catch (err) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // OSRM Routing (Business Only)
  app.get("/api/route", requireBusiness, async (req: any, res: any) => {
    const { originLat, originLng, destLat, destLng } = req.query;

    if (!originLat || !originLng || !destLat || !destLng) {
      return res.status(400).json({ error: "Missing coordinates" });
    }

    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson`;
      const response = await fetch(url);
      const data: any = await response.json();

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
      res.status(500).json({ error: "Routing service unavailable" });
    }
  });

  return httpServer;
}
