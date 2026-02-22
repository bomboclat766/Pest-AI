import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "@/components/ChatMessage";
import { useSendMessage } from "@/hooks/use-chat";
import { Send, Sparkles, Plus, X, Compass, Menu, Trash2, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant" | "error";
  content: string;
  image?: string | null;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([{ id: "w", role: "assistant", content: "Hello! How can I help you with pests today?" }]);
  const [inputValue, setInputValue] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sendMessage = useSendMessage();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, sendMessage.isPending]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!inputValue.trim() && !selectedImage) || sendMessage.isPending) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: inputValue, image: selectedImage };
    const history = [...messages, userMsg];
    setMessages(history);
    setInputValue("");
    setSelectedImage(null);

    try {
      const response = await sendMessage.mutateAsync({
        message: selectedImage 
          ? [{ type: "text", text: userMsg.content || "Identify" }, { type: "image_url", image_url: { url: selectedImage } }] 
          : userMsg.content,
        history: history.map(m => ({ role: m.role, content: m.content })),
        liveOnly: true,
        model: "google/gemini-flash-1.5",
      });
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: response.response }]);
    } catch {
      setMessages(prev => [...prev, { id: "err", role: "error", content: "I hit a snag. Please try again!" }]);
    }
  };

  return (
    <div className="h-screen bg-white flex flex-col font-sans text-[#1f1f1f] relative overflow-hidden">
      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]" />
            <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              className="fixed right-0 top-0 h-full w-72 bg-white z-[70] p-6 shadow-2xl flex flex-col gap-6">
              <div className="flex justify-between items-center"><span className="font-bold text-xl">Dashboard</span><Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)}><X size={20}/></Button></div>
              <Button variant="outline" className="w-full justify-start gap-2 border-red-100 text-red-600 hover:bg-red-50" onClick={() => {setMessages([{id:"1", role:"assistant", content:"Reset."}]); setIsSidebarOpen(false);}}><Trash2 size={18}/> New Session</Button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* FIXED HEADER */}
      <header className="fixed top-0 left-0 right-0 h-16 border-b border-gray-100 bg-white/80 backdrop-blur-xl z-50 flex items-center justify-between px-6">
        <div className="flex items-center gap-2"><Sparkles className="text-[#4AB295]" size={22} /><span className="font-bold text-xl text-[#1A3D35]">PestControlAI</span></div>
        <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)} className="rounded-full hover:bg-gray-100"><Menu size={24} /></Button>
      </header>

      {/* Main Area */}
      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 pt-16">
        <div ref={scrollRef} className="flex-1 overflow-y-auto pt-10 pb-44 custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {messages.length <= 1 && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-20 text-center">
                <h2 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-[#4AB295] to-[#1A3D35] bg-clip-text text-transparent mb-4">What's bugging you?</h2>
                <p className="text-gray-400 text-xl font-light">Identify pests and get eco-safe solutions instantly.</p>
              </motion.div>
            )}
            {messages.map((msg) => <ChatMessage key={msg.id} {...msg} />)}
            
            {/* REPLIT THINKING ANIMATION */}
            {sendMessage.isPending && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4 items-center ml-1 mb-10">
                <div className="relative w-9 h-9">
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                    className="absolute inset-0 border-2 border-dashed border-[#4AB295]/40 rounded-full" />
                  <div className="absolute inset-0 flex items-center justify-center text-[#4AB295]"><Sparkles size={16} className="animate-pulse" /></div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-gray-400">Pest Intelligence analyzing...</span>
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => <motion.div key={i} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }} className="w-1 h-1 bg-[#4AB295] rounded-full" />)}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input Pill */}
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pb-8 px-4 z-40">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSend} className="bg-[#f0f4f9] rounded-[32px] p-2 shadow-sm border border-transparent focus-within:border-[#4AB295]/20 transition-all">
              {selectedImage && (
                <div className="p-3 relative inline-block">
                  <img src={selectedImage} className="w-20 h-20 object-cover rounded-2xl border-2 border-white shadow-md" />
                  <button type="button" onClick={() => setSelectedImage(null)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1"><X size={12}/></button>
                </div>
              )}
              <div className="flex items-center gap-1">
                <input type="file" className="hidden" ref={fileInputRef} accept="image/*" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if(f){ const r=new FileReader(); r.onloadend=()=>setSelectedImage(r.result as string); r.readAsDataURL(f); }
                }} />
                <Button type="button" variant="ghost" onClick={() => fileInputRef.current?.click()} className="rounded-full h-12 w-12 text-gray-500"><Plus size={24}/></Button>
                <Input value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Describe the bug or upload a photo..." className="bg-transparent border-none shadow-none text-lg py-7 focus-visible:ring-0" />
                <div className="flex items-center gap-1 pr-2">
                  <button type="button" onClick={() => setLocation(location ? null : {lat:-1.28, lng:36.82})} className={cn("p-3 rounded-full", location ? "text-[#4AB295] bg-[#4AB295]/10" : "text-gray-400")}><Compass size={24}/></button>
                  {(inputValue || selectedImage) && <Button type="submit" disabled={sendMessage.isPending} className="rounded-full bg-[#4AB295] h-12 w-12 p-0 shadow-lg"><Send size={20} className="text-white" /></Button>}
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
