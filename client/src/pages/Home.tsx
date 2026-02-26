"use client";

import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "@/components/ChatMessage";
import { useSendMessage } from "@/hooks/use-chat";
import { Send, Sparkles, Compass, User, Briefcase, ImageIcon, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function Home() {
  // --- UI & Logic States ---
  const [messages, setMessages] = useState([
    { id: "welcome", role: "assistant", content: "Hello! I'm your AI Pest Control Assistant. How can I help you today?" },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isGeoLoading, setIsGeoLoading] = useState(false);
  const [role, setRole] = useState<"regular" | "business">("regular");
  
  // --- Auth States ---
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authCode, setAuthCode] = useState("");

  // --- Map & Library States ---
  const [L, setL] = useState<any>(null);
  const [map, setMap] = useState<any>(null);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sendMessage = useSendMessage();

  // --- Fix Render Build: Load Leaflet only on Client ---
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("leaflet").then((leaflet) => {
        setL(leaflet.default);
      });
    }
  }, []);

  // --- Initialize Map for Business Mode ---
  useEffect(() => {
    if (role === "business" && mapRef.current && L && !map) {
      const newMap = L.map(mapRef.current).setView([-1.286389, 36.817223], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(newMap);
      setMap(newMap);
    }
    return () => { if (map) { map.remove(); setMap(null); } };
  }, [role, L]);

  // --- Handlers ---
  const handleAuth = async () => {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: authCode })
    });
    const data = await res.json();
    if (data.role === "business") {
      setRole("business");
      setIsAuthOpen(false);
      setAuthCode("");
    } else {
      alert("Invalid Business Code");
    }
  };

  const toggleGeoSense = () => {
    if (location) { setLocation(null); return; }
    if (!navigator.geolocation) return alert("Geolocation not supported.");
    setIsGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setIsGeoLoading(false); },
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
      ? [{ type: "text", text: `${geoContext}${userMsg.content || "Analyze this image."}` }, { type: "image_url", image_url: { url: selectedImage } }] 
      : `${geoContext}${userMsg.content}`;

    try {
      const response = await sendMessage.mutateAsync({
        message: aiContent,
        history: updatedHistory.map(m => ({ role: m.role, content: m.content })),
        liveOnly: true,
        model: "google/gemini-2.0-flash-001",
      });
      setMessages(prev => [...prev, { id: Date.now().toString(), role: "assistant", content: response.response }]);
    } catch {
      setMessages(prev => [...prev, { id: "err", role: "error", content: "Connection error." }]);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FBF9] flex flex-col font-sans">
      <header className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#4AB295] rounded-xl flex items-center justify-center shadow-sm">
            <Sparkles className="text-white" size={20} />
          </div>
          <h1 className="text-xl font-bold text-[#1A3D35]">PestControl<span className="text-[#4AB295]">AI</span></h1>
        </div>
        
        <Button 
          variant="outline"
          className="rounded-full border-[#4AB295] text-[#4AB295]"
          onClick={() => role === "regular" ? setIsAuthOpen(true) : setRole("regular")}
        >
          {role === "regular" ? <Briefcase size={18} className="mr-2"/> : <User size={18} className="mr-2"/>}
          {role === "regular" ? "Business Login" : "User Mode"}
        </Button>
      </header>

      {/* Auth Modal */}
      <Dialog open={isAuthOpen} onOpenChange={setIsAuthOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Lock size={20}/> Business Access</DialogTitle>
            <DialogDescription>Enter your professional credentials to access dispatch tools.</DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <Input 
              type="password" 
              placeholder="Enter Code..." 
              value={authCode} 
              onChange={(e) => setAuthCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAuth()}
            />
            <Button onClick={handleAuth} className="bg-[#4AB295]">Verify</Button>
          </div>
        </DialogContent>
      </Dialog>

      <main className="flex-1 flex flex-col md:flex-row gap-6 p-4 md:p-8 w-full max-w-7xl mx-auto h-[calc(100vh-140px)]">
        {role === "business" ? (
          <div className="flex-1 flex flex-col bg-white rounded-[2.5rem] shadow-sm border p-6 overflow-hidden">
            <h2 className="text-lg font-bold text-[#1A3D35] mb-4">Service Dispatch Dashboard</h2>
            <div ref={mapRef} className="flex-1 w-full rounded-2xl border bg-[#f0f0f0] z-0" />
            <Button className="mt-4 bg-[#4AB295] hover:bg-[#3d967d]" onClick={() => {/* showRoute call here */}}>
              Navigate to Latest Request
            </Button>
          </div>
        ) : (
          <div className="flex-1 bg-white rounded-[2.5rem] shadow-sm border flex flex-col relative overflow-hidden">
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8">
              <AnimatePresence mode="popLayout">
                {messages.map((msg) => <ChatMessage key={msg.id} {...msg} />)}
              </AnimatePresence>
            </div>

            <div className="px-6 pb-6 md:px-10 md:pb-10 pt-2 bg-white/80">
              <form onSubmit={handleSend} className="relative flex flex-col">
                <div className="relative flex items-center">
                  <Input 
                    value={inputValue} 
                    onChange={(e) => setInputValue(e.target.value)} 
                    placeholder="Ask anything..." 
                    className="w-full bg-[#F3F8F6] border-none rounded-full py-7 pl-6 pr-32 text-lg" 
                  />
                  <div className="absolute right-3 flex items-center gap-2">
                    <button type="button" onClick={toggleGeoSense} className={`p-2 rounded-full ${location ? "bg-[#4AB295] text-white" : "text-gray-400"}`}>
                      <Compass size={22} className={isGeoLoading ? "animate-spin" : ""} />
                    </button>
                    <Button type="submit" className="h-10 w-10 rounded-full bg-[#1A3D35]"><Send size={18} /></Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
