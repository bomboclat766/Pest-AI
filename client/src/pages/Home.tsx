"use client";

import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "@/components/ChatMessage";
import { useSendMessage } from "@/hooks/use-chat";
import { Send, Sparkles, Compass, Briefcase, User, ImageIcon, Lock, Zap, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Home() {
  // Prevent Hydration Mismatch
  const [mounted, setMounted] = useState(false);
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
    setMounted(true);
    if (typeof window !== "undefined") {
      import("leaflet").then((leaflet) => setL(leaflet.default));
    }
  }, []);

  useEffect(() => {
    if (mounted && role === "business" && mapRef.current && L && !map) {
      // Use Nairobi coords as default per project context
      const newMap = L.map(mapRef.current).setView([-1.286389, 36.817223], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OSM" }).addTo(newMap);
      setMap(newMap);
    }
  }, [role, L, mounted]);

  const handleAuth = () => {
    if (authCode === "12345") {
      setRole("business");
      setIsAuthOpen(false);
      setAuthError(false);
    } else {
      setAuthError(true);
    }
  };

  // If not mounted, return empty div to prevent client-error POSTs
  if (!mounted) return <div className="min-h-screen bg-[#F8FBF9]" />;

  return (
    <div className="min-h-screen bg-[#F8FBF9] p-4 md:p-8 flex flex-col items-center overflow-x-hidden">
      <header className="w-full max-w-7xl flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <div className="bg-[#4AB295] p-2 rounded-lg text-white"><Sparkles size={20}/></div>
          <div>
            <h1 className="text-xl font-bold text-[#1A3D35]">PestControl<span className="text-[#4AB295]">AI</span></h1>
            <p className="text-[10px] text-gray-400">Smart Identification & Advice</p>
          </div>
        </div>
        <Button variant="outline" className="rounded-full border-[#4AB295] text-[#4AB295]" onClick={() => role === "regular" ? setIsAuthOpen(true) : setRole("regular")}>
          <Briefcase size={16} className="mr-2"/> {role === "regular" ? "Business Login" : "Exit Business"}
        </Button>
      </header>

      <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-6 flex-1 h-[700px]">
        {/* Sidebar Cards */}
        <aside className="w-full lg:w-64 space-y-4">
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-[10px] font-bold text-[#1A3D35] mb-4 flex items-center gap-2 tracking-widest uppercase"><Activity className="w-3 h-3 text-[#4AB295]"/> Necessities</h3>
            <div className="space-y-3">
              <div className="bg-[#F3F8F6] p-3 rounded-2xl"><p className="text-[8px] font-bold text-gray-400 uppercase">Safety Level</p><p className="text-[#4AB295] font-bold text-sm">99.9% Secure</p></div>
              <div className="bg-[#F3F8F6] p-3 rounded-2xl"><p className="text-[8px] font-bold text-gray-400 uppercase">AI Status</p><p className="text-[#4AB295] font-bold text-sm">Ready</p></div>
            </div>
          </div>
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-[10px] font-bold text-[#1A3D35] mb-4 flex items-center gap-2 tracking-widest uppercase"><Zap className="w-3 h-3 text-[#4AB295]"/> AI Capabilities</h3>
            <div className="space-y-3">
              <div className="bg-[#F3F8F6] p-3 rounded-2xl"><p className="text-[8px] font-bold text-gray-400 uppercase">Identification</p><p className="text-[#4AB295] font-bold text-sm">Instant Pest ID</p></div>
              <div className="bg-[#F3F8F6] p-3 rounded-2xl"><p className="text-[8px] font-bold text-gray-400 uppercase">GeoSense</p><p className="text-[#4AB295] font-bold text-sm">Global Mode •</p></div>
            </div>
          </div>
        </aside>

        {/* Main Area */}
        <main className="flex-1 bg-white rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col relative overflow-hidden">
          {role === "business" ? (
             <div className="h-full w-full relative">
               <div ref={mapRef} className="absolute inset-0 z-0" />
               <div className="absolute top-4 left-4 z-10 bg-white/90 p-3 rounded-xl shadow-lg">
                 <p className="text-xs font-bold text-[#1A3D35]">Dispatch Active</p>
               </div>
             </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6">
                <AnimatePresence mode="popLayout">
                  {messages.map(m => <ChatMessage key={m.id} {...m} />)}
                </AnimatePresence>
              </div>
              <div className="p-6 bg-white/50 backdrop-blur-md border-t">
                <div className="bg-[#F3F8F6] rounded-full flex items-center px-4 py-1">
                  <Input 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask anything..." 
                    className="border-none bg-transparent shadow-none focus-visible:ring-0 text-md" 
                  />
                  <Compass className="text-gray-400 mx-2 cursor-pointer hover:text-[#4AB295] transition-colors" size={20}/>
                  <Button className="rounded-full bg-[#1A3D35] hover:bg-[#4AB295] w-10 h-10 p-0 ml-1 transition-all"><Send size={18}/></Button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Login Modal */}
      <Dialog open={isAuthOpen} onOpenChange={setIsAuthOpen}>
        <DialogContent className="sm:max-w-[380px] rounded-[2.5rem] p-8 border-none">
          <DialogHeader className="flex flex-col items-center">
            <div className="w-14 h-14 bg-[#F3F8F6] rounded-full flex items-center justify-center text-[#4AB295] mb-4"><Lock size={28}/></div>
            <DialogTitle className="text-2xl font-bold text-[#1A3D35]">Business Access</DialogTitle>
            <p className="text-center text-sm text-gray-400 mt-2">Enter your credentials to access the dispatch dashboard.</p>
          </DialogHeader>
          <div className="space-y-4 pt-6">
            <Input 
              type="password" 
              placeholder="Enter Code..." 
              value={authCode}
              onChange={(e) => {setAuthCode(e.target.value); setAuthError(false);}}
              className={`rounded-2xl bg-[#F3F8F6] border-none py-7 px-6 text-center text-xl tracking-widest ${authError ? 'ring-2 ring-red-400' : ''}`}
            />
            {authError && <p className="text-red-500 text-xs text-center font-bold">INVALID CODE. ACCESS DENIED.</p>}
            <Button onClick={handleAuth} className="w-full bg-[#4AB295] hover:bg-[#3d967d] rounded-2xl py-7 text-lg font-bold shadow-lg shadow-[#4AB295]/20">Verify</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
