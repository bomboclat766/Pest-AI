import express, { Express } from "express";
import type { Server } from "http";
// Note: Top-level fetch import removed to prevent Render deployment crashes.
// We use dynamic imports inside the routes instead.
import { api } from "@shared/routes";

// Business logic middleware
function requireBusiness(req: any, res: any, next: any) {
  if (req.user?.role !== "business") {
    return res.status(403).json({ error: "Access denied. Business role required." });
  }
  next();
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  app.use(express.json());

  // Attach default user role
  app.use((req: any, _res: any, next: any) => {
    if (!req.user) req.user = { role: "regular" };
    next();
  });

  // Login Logic
  app.post("/api/login", (req: any, res: any) => {
    const { code } = req.body;
    const role = code === "12345" ? "business" : "regular";
    req.user.role = role; 
    return res.json({ success: true, role });
  });

  // Chat Send Route - FIXED FOR PRODUCTION
  app.post(api.chat.send.path, async (req: any, res: any) => {
    try {
      const { message, history } = req.body;
      
      // FIX: Use dynamic import for node-fetch to avoid ESM/CommonJS conflicts
      const fetch = (await import("node-fetch")).default as any;
      
      // Professional System Prompt for 2026 Edition
      const systemPrompt = `You are the Professional Pest Control Intelligence Assistant (2026 Edition). 
      Developed by Osteen. You are based in Nairobi, Kenya. 
      Provide warm, empathetic, and expert advice on pest control. 
      Use Markdown tables for comparisons. Use LaTeX for chemical formulas if mentioned.`;

      const chatMessages = [
        { role: "system", content: systemPrompt },
        ...(history || []),
        { role: "user", content: message }
      ];

      // THE REAL API CALL
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://pest-ai-1.onrender.com",
          "X-Title": "Pest AI Sales Desk"
        },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash-001",
          messages: chatMessages,
          temperature: 0.7
        })
      });

      const data: any = await response.json();

      if (response.ok && data.choices?.[0]?.message?.content) {
        return res.json({ 
          response: data.choices[0].message.content, 
          isFallback: false 
        });
      } else {
        console.error("OpenRouter Error Details:", data);
        return res.status(502).json({ 
          message: "AI Service is currently unavailable. Please check API Key.",
          details: data.error?.message 
        });
      }
    } catch (err) {
      console.error("Internal Server Error:", err);
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
      // Use dynamic fetch here as well to prevent crashes
      const fetch = (await import("node-fetch")).default as any;
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
