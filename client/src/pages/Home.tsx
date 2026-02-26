"use client";

import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "@/components/ChatMessage";
import { useSendMessage } from "@/hooks/use-chat";
import { Send, Sparkles, Compass, User, Briefcase, ImageIcon, Lock, Shield, Zap, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Home() {
  const [messages, setMessages] = useState([{ id: "w", role: "assistant", content: "Hello! I'm your AI Pest Control Assistant. How can I help you today?" }]);
  const [inputValue, setInputValue] = useState("");
  const [role, setRole] = useState<"regular" | "business">("regular");
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authCode, setAuthCode] = useState("");
  const [authError, setAuthError] = useState(false);

  // Map & Leaflet
  const [L, setL] = useState<any>(null);
  const [map, setMap] = useState<any>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const sendMessage = useSendMessage();

  useEffect(() => {
    if (typeof window !== "undefined") {
      import("leaflet").then((leaflet) => setL(leaflet.default));
    }
  }, []);

  useEffect(() => {
    if (role === "business" && mapRef.current && L && !map) {
      const newMap = L.map(mapRef.current).setView([-1.286389, 36.817223], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OSM" }).addTo(newMap);
      setMap(newMap);
    }
  }, [role, L]);

  const handleAuth = () => {
    if (authCode === "12345") {
      setRole("business");
      setIsAuthOpen(false);
      setAuthError(false);
      setAuthCode("");
    } else {
      setAuthError(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FBF9] p-4 md:p-8 flex flex-col items-center">
      {/* Header matching your UI */}
      <header className="w-full max-w-7xl flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <div className="bg-[#4AB295] p-2 rounded-lg text-white"><Sparkles size={20}/></div>
          <div>
            <h1 className="text-xl font-bold text-[#1A3D35]">PestControl<span className="text-[#4AB295]">AI</span></h1>
            <p className="text-[10px] text-gray-400">Smart Identification & Advice</p>
          </div>
        </div>
        <Button variant="outline" className="rounded-full border-[#4AB295] text-[#4AB295]" onClick={() => role === "regular" ? setIsAuthOpen(true) : setRole("regular")}>
          <Briefcase size={16} className="mr-2"/> Business Login
        </Button>
      </header>

      <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-6 flex-1">
        {/* Sidebar Elements from Screenshot */}
        <aside className="w-full lg:w-64 space-y-4">
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-xs font-bold text-[#1A3D35] mb-4 flex items-center gap-2">
              <Activity className="w-3 h-3"/> NECESSITIES
            </h3>
            <div className="space-y-3">
              <div className="bg-[#F3F8F6] p-3 rounded-2xl">
                <p className="text-[9px] font-bold text-gray-400 uppercase">Safety Level</p>
                <p className="text-[#4AB295] font-bold text-sm">99.9% Secure</p>
              </div>
              <div className="bg-[#F3F8F6] p-3 rounded-2xl">
                <p className="text-[9px] font-bold text-gray-400 uppercase">AI Status</p>
                <p className="text-[#4AB295] font-bold text-sm">Ready</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-xs font-bold text-[#1A3D35] mb-4 flex items-center gap-2">
              <Zap className="w-3 h-3"/> AI CAPABILITIES
            </h3>
            <div className="space-y-3">
              <div className="bg-[#F3F8F6] p-3 rounded-2xl">
                <p className="text-[9px] font-bold text-gray-400 uppercase">Identification</p>
                <p className="text-[#4AB295] font-bold text-sm">Instant Pest ID</p>
              </div>
              <div className="bg-[#F3F8F6] p-3 rounded-2xl">
                <p className="text-[9px] font-bold text-gray-400 uppercase">GeoSense</p>
                <p className="text-[#4AB295] font-bold text-sm">Global Mode •</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Interface */}
        <main className="flex-1 bg-white rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col relative overflow-hidden">
          {role === "business" ? (
             <div ref={mapRef} className="flex-1 w-full z-0" />
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-10 space-y-6">
                {messages.map(m => <ChatMessage key={m.id} {...m} />)}
              </div>
              <div className="p-6">
                <div className="bg-[#F3F8F6] rounded-full flex items-center px-4 py-2">
                  <Input placeholder="Ask anything..." className="border-none bg-transparent shadow-none focus-visible:ring-0" />
                  <Compass className="text-gray-400 mx-2" size={20}/>
                  <Button className="rounded-full bg-[#4AB295] w-10 h-10 p-0"><Send size={18}/></Button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Modern Login Dialog matching your UI */}
      <Dialog open={isAuthOpen} onOpenChange={setIsAuthOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-[2rem] border-none shadow-xl">
          <DialogHeader className="items-center">
            <div className="w-12 h-12 bg-[#F3F8F6] rounded-full flex items-center justify-center text-[#4AB295] mb-2">
              <Lock size={24}/>
            </div>
            <DialogTitle className="text-[#1A3D35] text-xl font-bold">Business Access</DialogTitle>
            <p className="text-sm text-gray-400">Enter credentials to access dispatch tools.</p>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input 
              type="password" 
              placeholder="Enter Code..." 
              value={authCode} 
              className={`rounded-xl bg-[#F3F8F6] border-none py-6 ${authError ? 'ring-1 ring-red-400' : ''}`}
              onChange={(e) => {setAuthCode(e.target.value); setAuthError(false);}}
            />
            {authError && <p className="text-red-500 text-xs text-center font-medium">Invalid Code. Please try again.</p>}
            <Button onClick={handleAuth} className="w-full bg-[#4AB295] hover:bg-[#3d967d] rounded-xl py-6 text-lg">Verify</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
