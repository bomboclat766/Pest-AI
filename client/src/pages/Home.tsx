"use client";

import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "@/components/ChatMessage";
import { useSendMessage } from "@/hooks/use-chat";
import { Send, Sparkles, Compass, Briefcase, User, Lock, Zap, Activity, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState([{ id: "w", role: "assistant", content: "Hello! I'm your AI Pest Control Assistant. How can I help you today?" }]);
  const [inputValue, setInputValue] = useState("");
  const [role, setRole] = useState<"regular" | "business">("regular");
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authCode, setAuthCode] = useState("");
  const [authError, setAuthError] = useState(false);

  // Lead State
  const [isPickingLocation, setIsPickingLocation] = useState(false);
  const [businessLeads, setBusinessLeads] = useState<any[]>([]);

  const [L, setL] = useState<any>(null);
  const [map, setMap] = useState<any>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sendMessage = useSendMessage();

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      import("leaflet").then((leaflet) => setL(leaflet.default));
    }
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    const res = await fetch("/api/leads");
    if (res.ok) setBusinessLeads(await res.json());
  };

  useEffect(() => {
    if (mounted && (role === "business" || isPickingLocation) && mapRef.current && L) {
      const container = mapRef.current;
      const newMap = L.map(container).setView([-1.286389, 36.817223], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(newMap);
      setMap(newMap);
      return () => { newMap.remove(); };
    }
  }, [role, L, mounted, isPickingLocation]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || sendMessage.isPending) return;

    const userMsg = { id: Date.now().toString(), role: "user" as const, content: inputValue };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = inputValue;
    setInputValue("");

    const isBooking = ["team", "come", "visit", "fumigation", "book"].some(w => currentInput.toLowerCase().includes(w));

    try {
      const result = await sendMessage.mutateAsync({
        message: currentInput,
        history: messages.map(m => ({ role: m.role, content: m.content })),
      });

      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: result.response }]);
      if (isBooking) setIsPickingLocation(true);
    } catch (err) {
      console.error(err);
    }
  };

  const submitLead = async () => {
    const lead = {
      name: "Client via AI",
      email: "chat-user@pestai.com",
      pestType: "Fumigation Request",
      lat: "-1.2863",
      lng: "36.8172",
      message: "Pinned via Dispatch Toolbox"
    };
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lead)
    });
    if (res.ok) {
      setIsPickingLocation(false);
      fetchLeads();
      setMessages(prev => [...prev, { id: 's', role: 'assistant', content: 'Location sent! Our team has been notified.' }]);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F8FBF9] p-4 md:p-8 flex flex-col items-center">
      <header className="w-full max-w-7xl flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <div className="bg-[#4AB295] p-2 rounded-lg text-white"><Sparkles size={20}/></div>
          <h1 className="text-xl font-bold text-[#1A3D35]">PestControl<span className="text-[#4AB295]">AI</span></h1>
        </div>
        <Button variant="outline" className="rounded-full border-[#4AB295]" onClick={() => role === "regular" ? setIsAuthOpen(true) : setRole("regular")}>
          <Briefcase size={16} className="mr-2"/> {role === "regular" ? "Business Login" : "User View"}
        </Button>
      </header>

      <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-8 flex-1">
        <aside className="w-full lg:w-64 space-y-6">
          {role === "business" ? (
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 h-[600px] overflow-y-auto">
              <h3 className="text-xs font-bold text-[#1A3D35] mb-5 flex items-center gap-2 uppercase tracking-widest"><Activity size={14}/> Incoming Requests</h3>
              <div className="space-y-3">
                {businessLeads.map((req, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-[#F3F8F6] border border-[#4AB295]/20 shadow-sm">
                    <p className="text-xs font-bold text-[#1A3D35]">{req.name}</p>
                    <p className="text-[9px] text-gray-500 uppercase">{req.pestType}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
               <h3 className="text-xs font-bold text-[#1A3D35] mb-5 flex items-center gap-2 uppercase tracking-widest"><Zap size={14}/> Necessities</h3>
               <div className="bg-[#F3F8F6] p-4 rounded-2xl"><p className="text-[#4AB295] font-bold">99.9% Secure</p></div>
            </div>
          )}
        </aside>

        <main className="flex-1 bg-white rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col relative overflow-hidden h-[650px]">
          {role === "business" ? (
             <div className="h-full w-full relative">
               <div ref={mapRef} className="absolute inset-0 z-0" />
               <div className="absolute top-6 left-6 z-10 bg-white/90 p-4 rounded-2xl shadow-xl border border-white max-w-xs">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-[#4AB295] p-2 rounded-lg text-white"><Compass size={16}/></div>
                    <p className="text-sm font-bold text-[#1A3D35]">Active Lead Tracking</p>
                  </div>
                  <div className="bg-[#F3F8F6] p-2 rounded-xl text-center text-[10px] font-bold text-[#4AB295]">OPTIMIZED ROUTE ACTIVE</div>
               </div>
             </div>
          ) : (
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6">
                <AnimatePresence>
                  {messages.map(m => <ChatMessage key={m.id} {...m} />)}
                  {isPickingLocation && (
                    <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white border-2 border-[#4AB295] rounded-[2.5rem] p-2 shadow-2xl my-4">
                      <div className="h-64 w-full rounded-[2rem] overflow-hidden relative">
                        <div ref={mapRef} className="h-full w-full" />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                          <div className="mb-8 animate-bounce bg-[#4AB295] p-2 rounded-full border-2 border-white"><User size={20} className="text-white"/></div>
                        </div>
                      </div>
                      <div className="p-4"><Button onClick={submitLead} className="w-full bg-[#4AB295] rounded-2xl py-6 font-bold">Confirm Pickup Location</Button></div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="p-6 border-t"><form onSubmit={handleSend} className="bg-[#F3F8F6] rounded-full flex items-center px-4 py-1.5 border">
                <Plus size={20} className="text-[#4AB295] ml-2"/><Input value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Ask for a team..." className="border-none bg-transparent focus-visible:ring-0" />
                <Button type="submit" className="rounded-full bg-[#4AB295] w-10 h-10 p-0"><Send size={18} className="text-white"/></Button>
              </form></div>
            </>
          )}
        </main>
      </div>

      <Dialog open={isAuthOpen} onOpenChange={setIsAuthOpen}>
        <DialogContent className="rounded-[2.5rem] p-8">
          <DialogHeader className="items-center"><div className="w-16 h-16 bg-[#F3F8F6] rounded-full flex items-center justify-center text-[#4AB295] mb-4"><Lock size={32}/></div><DialogTitle className="text-2xl font-bold">Business Access</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-6">
            <Input type="password" placeholder="Enter Code..." value={authCode} onChange={(e) => setAuthCode(e.target.value)} className="rounded-2xl bg-[#F3F8F6] py-7 text-center text-xl" />
            <Button onClick={() => authCode === "12345" ? (setRole("business"), setIsAuthOpen(false)) : setAuthError(true)} className="w-full bg-[#4AB295] py-7 rounded-2xl font-bold">Verify</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
