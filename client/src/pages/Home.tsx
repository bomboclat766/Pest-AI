"use client";

import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "@/components/ChatMessage";
import { useSendMessage } from "@/hooks/use-chat";
import { Send, Sparkles, Compass, Briefcase, User, ImageIcon, Lock, Zap, Activity, Plus } from "lucide-react";
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

  // Map & Leaflet
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
  }, []);

  useEffect(() => {
    if (mounted && role === "business" && mapRef.current && L && !map) {
      const newMap = L.map(mapRef.current).setView([-1.286389, 36.817223], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OSM" }).addTo(newMap);
      setMap(newMap);
    }
  }, [role, L, mounted]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || sendMessage.isPending) return;

    const userMsg = { id: Date.now().toString(), role: "user" as const, content: inputValue };
    
    // Update UI immediately for user experience
    setMessages(prev => [...prev, userMsg]);
    const currentInput = inputValue;
    setInputValue("");

    try {
      // Calling your actual API route via the hook
      const result = await sendMessage.mutateAsync({
        message: currentInput,
        // Mapping history to match the OpenRouter format expected by your backend
        history: messages.map(m => ({ role: m.role, content: m.content })),
        model: "google/gemini-2.0-flash-001",
      });

      // Adding the live AI response to the chat box
      if (result && result.response) {
        setMessages(prev => [...prev, { 
          id: (Date.now() + 1).toString(), 
          role: "assistant", 
          content: result.response 
        }]);
      }
    } catch (err) {
      console.error("Chat Error:", err);
      // Optional: Add an error message to the chat so the user knows it failed
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: "assistant", 
        content: "I'm having trouble connecting to my brain right now. Please check your API key!" 
      }]);
    }
  };

  if (!mounted) return <div className="min-h-screen bg-[#F8FBF9]" />;

  return (
    <div className="min-h-screen bg-[#F8FBF9] p-4 md:p-8 flex flex-col items-center">
      <header className="w-full max-w-7xl flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <div className="bg-[#4AB295] p-2 rounded-lg text-white"><Sparkles size={20}/></div>
          <div>
            <h1 className="text-xl font-bold text-[#1A3D35]">PestControl<span className="text-[#4AB295]">AI</span></h1>
            <p className="text-[10px] text-gray-400 font-medium">Smart Identification & Advice</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="rounded-full border-[#4AB295] text-[#4AB295] hover:bg-[#4AB295]/10" 
          onClick={() => role === "regular" ? setIsAuthOpen(true) : setRole("regular")}
        >
          <Briefcase size={16} className="mr-2"/> {role === "regular" ? "Business Login" : "User View"}
        </Button>
      </header>

      <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-8 flex-1">
        {/* SIDEBAR CARDS */}
        <aside className="w-full lg:w-64 space-y-6">
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
            <h3 className="text-xs font-bold text-[#1A3D35] mb-5 flex items-center gap-2 tracking-widest uppercase">
              <Activity className="w-4 h-4 text-[#4AB295]"/> Necessities
            </h3>
            <div className="space-y-4">
              <div className="bg-[#F3F8F6] p-4 rounded-2xl">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Safety Level</p>
                <p className="text-[#4AB295] font-bold text-md">99.9% Secure</p>
              </div>
              <div className="bg-[#F3F8F6] p-4 rounded-2xl">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">AI Status</p>
                <p className="text-[#4AB295] font-bold text-md">Ready</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
            <h3 className="text-xs font-bold text-[#1A3D35] mb-5 flex items-center gap-2 tracking-widest uppercase">
              <Zap className="w-4 h-4 text-[#4AB295]"/> AI Capabilities
            </h3>
            <div className="space-y-4">
              <div className="bg-[#F3F8F6] p-4 rounded-2xl">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Identification</p>
                <p className="text-[#4AB295] font-bold text-md">Instant Pest ID</p>
              </div>
              <div className="bg-[#F3F8F6] p-4 rounded-2xl">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">GeoSense</p>
                <p className="text-[#4AB295] font-bold text-md">Global Mode •</p>
              </div>
              <div className="bg-[#F3F8F6] p-4 rounded-2xl">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Responses</p>
                <p className="text-[#4AB295] font-bold text-md">Eco-Safe Advice</p>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN CHAT AREA */}
        <main className="flex-1 bg-white rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col relative overflow-hidden h-[650px]">
          {role === "business" ? (
             <div className="h-full w-full relative">
               <div ref={mapRef} className="absolute inset-0 z-0" />
               <div className="absolute top-4 right-4 z-10 bg-[#4AB295] text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg">
                 Optimized Route Active
               </div>
             </div>
          ) : (
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 scroll-smooth">
                <AnimatePresence mode="popLayout">
                  {messages.map(m => <ChatMessage key={m.id} {...m} />)}
                  {sendMessage.isPending && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                      <div className="bg-[#F3F8F6] p-4 rounded-2xl text-[#4AB295] text-sm animate-pulse font-bold">
                        AI is thinking...
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="p-6 bg-white border-t">
                <form onSubmit={handleSend} className="bg-[#F3F8F6] rounded-full flex items-center px-4 py-1.5 border border-transparent focus-within:border-[#4AB295]/20 transition-all">
                  <div className="p-2 text-[#4AB295] cursor-pointer hover:bg-white rounded-full transition-colors"><Plus size={20}/></div>
                  <Input 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask anything..." 
                    className="border-none bg-transparent shadow-none focus-visible:ring-0 text-md placeholder:text-gray-400" 
                  />
                  <Compass className="text-gray-400 mx-2 hover:text-[#4AB295] cursor-pointer transition-colors" size={20}/>
                  <Button 
                    type="submit" 
                    disabled={sendMessage.isPending}
                    className="rounded-full bg-[#4AB295] hover:bg-[#3d967d] w-10 h-10 p-0 shadow-lg shadow-[#4AB295]/20 flex items-center justify-center transition-transform active:scale-95 disabled:opacity-50"
                  >
                    <Send size={18} className="text-white ml-0.5" />
                  </Button>
                </form>
              </div>
            </>
          )}
        </main>
      </div>

      <Dialog open={isAuthOpen} onOpenChange={setIsAuthOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-[2.5rem] p-8">
          <DialogHeader className="flex flex-col items-center">
            <div className="w-16 h-16 bg-[#F3F8F6] rounded-full flex items-center justify-center text-[#4AB295] mb-4"><Lock size={32}/></div>
            <DialogTitle className="text-2xl font-bold text-[#1A3D35]">Business Access</DialogTitle>
            <p className="text-center text-sm text-gray-400 mt-2">Enter credentials to access dispatch tools.</p>
          </DialogHeader>
          <div className="space-y-4 pt-6">
            <Input 
              type="password" 
              placeholder="Enter Code..." 
              value={authCode}
              onChange={(e) => {setAuthCode(e.target.value); setAuthError(false);}}
              className={`rounded-2xl bg-[#F3F8F6] border-none py-7 text-center text-xl tracking-widest ${authError ? 'ring-2 ring-red-400' : ''}`}
            />
            {authError && <p className="text-red-500 text-xs text-center font-bold">INVALID CODE. PLEASE TRY AGAIN.</p>}
            <Button onClick={handleAuth} className="w-full bg-[#4AB295] hover:bg-[#3d967d] rounded-2xl py-7 text-lg font-bold">Verify</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
