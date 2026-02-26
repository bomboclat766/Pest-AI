"use client";

import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "@/components/ChatMessage";
import { useSendMessage } from "@/hooks/use-chat";
import { Send, Sparkles, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  // --- States ---
  const [messages, setMessages] = useState([
    { id: "welcome", role: "assistant", content: "Hello! I'm your AI Pest Control Assistant. How can I help you today?" },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isGeoLoading, setIsGeoLoading] = useState(false);
  const [role, setRole] = useState<"regular" | "business">("regular");
  
  // --- Leaflet & Map Refs ---
  const [L, setL] = useState<any>(null);
  const [map, setMap] = useState<any>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sendMessage = useSendMessage();

  // --- Client-Side Leaflet Loader ---
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("leaflet").then((leaflet) => {
        setL(leaflet.default);
      });
    }
  }, []);

  // --- Map Initialization ---
  useEffect(() => {
    if (role === "business" && mapRef.current && L && !map) {
      const newMap = L.map(mapRef.current).setView([-1.286389, 36.817223], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(newMap);
      setMap(newMap);
    }
  }, [role, L, map]);

  // --- Helpers ---
  const toggleGeoSense = () => {
    if (location) { setLocation(null); return; }
    if (!navigator.geolocation) return alert("Geolocation not supported.");
    setIsGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsGeoLoading(false);
      },
      () => { setIsGeoLoading(false); alert("Location access denied."); }
    );
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!inputValue.trim() && !selectedImage) || sendMessage.isPending) return;

    const geoContext = location ? `[User Location: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}] ` : "";
    const userMsg = { id: Date.now().toString(), role: "user", content: inputValue, image: selectedImage };
    const updatedHistory = [...messages, userMsg];

    setMessages(updatedHistory);
    setInputValue("");
    setSelectedImage(null);

    const aiContent = selectedImage 
      ? [{ type: "text", text: `${geoContext}${userMsg.content || "What is in this image?"}` }, { type: "image_url", image_url: { url: selectedImage } }] 
      : `${geoContext}${userMsg.content}`;

    try {
      const response = await sendMessage.mutateAsync({
        message: aiContent,
        history: updatedHistory.map(m => ({ role: m.role, content: m.content })),
        liveOnly: true,
        model: "google/gemini-flash-1.5",
      });
      setMessages(prev => [...prev, { id: Date.now().toString(), role: "assistant", content: response.response }]);
    } catch {
      setMessages(prev => [...prev, { id: "err", role: "error", content: "Connection error." }]);
    }
  };

  async function showRoute(origin: {lat:number; lng:number}, destination: {lat:number; lng:number}) {
    if (!L || !map) return;
    const res = await fetch(`/api/route?originLat=${origin.lat}&originLng=${origin.lng}&destLat=${destination.lat}&destLng=${destination.lng}`);
    const data = await res.json();
    if (data.geometry) {
      L.geoJson(data.geometry).addTo(map);
      alert(`ETA: ${data.durationMinutes} mins`);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FBF9] flex flex-col font-sans">
      <header className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#4AB295] rounded-xl flex items-center justify-center shadow-sm">
            <Sparkles className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1A3D35]">PestControl<span className="text-[#4AB295]">AI</span></h1>
            <p className="text-xs text-gray-500">Smart Identification & Advice</p>
          </div>
        </div>
        <Button onClick={() => setRole(role === "regular" ? "business" : "regular")}>
          Switch to {role === "regular" ? "Business" : "Regular"} Mode
        </Button>
      </header>

      <main className="flex-1 flex flex-row gap-6 p-4 md:p-8 w-full max-w-7xl mx-auto h-[800px]">
        {role === "business" ? (
          <div className="flex-1 flex flex-col bg-white rounded-[2.5rem] shadow border p-6">
            <h2 className="text-lg font-bold mb-4">Business Dashboard</h2>
            <div ref={mapRef} className="h-[400px] w-full rounded-xl overflow-hidden z-0" />
            <Button className="mt-4 bg-[#4AB295] text-white" onClick={() => showRoute({ lat: -1.286389, lng: 36.817223 }, { lat: -1.2921, lng: 36.8219 })}>
              Show Route to Client
            </Button>
          </div>
        ) : (
          <div className="flex-1 bg-white rounded-[2.5rem] shadow border flex flex-col relative overflow-hidden">
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-8">
              <AnimatePresence mode="popLayout">
                {messages.map((msg: any) => <ChatMessage key={msg.id} {...msg} />)}
              </AnimatePresence>
            </div>
            <div className="px-10 pb-10 pt-2 relative">
              <form onSubmit={handleSend} className="relative flex flex-col">
                <Input 
                  value={inputValue} 
                  onChange={(e) => setInputValue(e.target.value)} 
                  placeholder={location ? "Localized GeoSense active..." : "Ask anything..."} 
                  className="w-full bg-[#F3F8F6] border-none rounded-full py-7 pl-14 pr-32 text-lg focus-visible:ring-1 focus-visible:ring-[#4AB295]" 
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <button type="button" onClick={toggleGeoSense} className={`p-2 rounded-full transition-all ${location ? "bg-[#4AB295] text-white" : "text-[#4AB295]"}`}>
                    <Compass size={24} className={isGeoLoading ? "animate-spin" : ""} />
                  </button>
                  <Button type="submit" disabled={sendMessage.isPending} className="h-12 w-12 rounded-full bg-[#4AB295]">
                    <Send size={20} />
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
