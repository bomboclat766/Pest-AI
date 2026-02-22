import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "@/components/ChatMessage";
import { useSendMessage } from "@/hooks/use-chat";
import { Send, Sparkles, Activity, Zap, Plus, X, Compass, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Define the message type locally to ensure strict alignment
interface Message {
  id: string;
  role: "user" | "assistant" | "error";
  content: string;
  image?: string | null;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    { id: "w", role: "assistant", content: "Hello! How can I help you with pests today?" }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sendMessage = useSendMessage();

  // Robust Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, sendMessage.isPending]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!inputValue.trim() && !selectedImage) || sendMessage.isPending) return;

    const userMsg: Message = { 
      id: Date.now().toString(), 
      role: "user", 
      content: inputValue, 
      image: selectedImage 
    };
    
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInputValue("");
    setSelectedImage(null);

    try {
      const response = await sendMessage.mutateAsync({
        message: selectedImage 
          ? [{ type: "text", text: userMsg.content || "Identify" }, { type: "image_url", image_url: { url: selectedImage } }] 
          : userMsg.content,
        history: updatedHistory.map(m => ({ role: m.role, content: m.content })),
        liveOnly: true,
        model: "google/gemini-flash-1.5",
      });

      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: "assistant", 
        content: response.response 
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        id: "err-" + Date.now(), 
        role: "error", 
        content: "I encountered a connection hiccup. Please try again!" 
      }]);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-[#1f1f1f] overflow-hidden">
      {/* Sidebar Drawer */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/10 backdrop-blur-sm z-40"
            />
            <motion.aside 
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              className="fixed right-0 top-0 h-full w-72 bg-[#f8fafd] border-l z-50 p-6 shadow-xl flex flex-col gap-6"
            >
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-[#1A3D35]">Dashboard</span>
                <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)}><X size={20}/></Button>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><Activity size={12}/> Necessities</h4>
                  <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-sm">
                    <p className="text-gray-500">Integrity</p>
                    <p className="text-[#4AB295] font-bold">99.9% Secure</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><Zap size={12}/> Capabilities</h4>
                  <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-2 text-xs font-medium text-[#4AB295]">
                    <p>● Instant ID</p>
                    <p>● Eco-Safe Recommendations</p>
                  </div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <header className="p-4 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-2 px-2">
          <Sparkles className="text-[#4AB295]" size={20} />
          <span className="font-semibold text-lg tracking-tight">PestControlAI</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)} className="rounded-full">
          <Menu size={22} />
        </Button>
      </header>

      <main className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 relative">
        <div ref={scrollRef} className="flex-1 overflow-y-auto pt-12 pb-44 no-scrollbar">
          <AnimatePresence mode="popLayout">
            {messages.length <= 1 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center">
                <h2 className="text-5xl font-medium bg-gradient-to-r from-[#4AB295] to-[#1A3D35] bg-clip-text text-transparent mb-4">
                  What's bugging you today?
                </h2>
                <p className="text-gray-400 text-lg">Upload a photo or describe the pest.</p>
              </motion.div>
            )}
            {messages.map((msg) => (
              <ChatMessage 
                key={msg.id} 
                role={msg.role} 
                content={msg.content} 
                image={msg.image} 
              />
            ))}
          </AnimatePresence>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white pb-6 px-4">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSend} className="bg-[#f0f4f9] rounded-[32px] p-2 transition-all">
              {selectedImage && (
                <div className="p-3 relative inline-block">
                  <img src={selectedImage} className="w-16 h-16 object-cover rounded-xl border-2 border-white shadow-sm" />
                  <button type="button" onClick={() => setSelectedImage(null)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><X size={10}/></button>
                </div>
              )}
              <div className="flex items-center">
                <input type="file" className="hidden" ref={fileInputRef} accept="image/*" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if(f){ const r=new FileReader(); r.onloadend=()=>setSelectedImage(r.result as string); r.readAsDataURL(f); }
                }} />
                <Button type="button" variant="ghost" onClick={() => fileInputRef.current?.click()} className="rounded-full text-gray-500"><Plus size={22}/></Button>
                <Input value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Enter a prompt here..." className="bg-transparent border-none shadow-none text-lg py-6 focus-visible:ring-0" />
                <div className="flex items-center gap-1 pr-2">
                  <button type="button" onClick={() => setLocation(location ? null : {lat:-1.28, lng:36.82})} className={cn("p-2 rounded-full", location ? "text-[#4AB295]" : "text-gray-400")}>
                    <Compass size={22}/>
                  </button>
                  {(inputValue || selectedImage) && (
                    <Button type="submit" disabled={sendMessage.isPending} className="rounded-full bg-[#4AB295] w-10 h-10 p-0 shadow-md">
                      <Send size={18} className="text-white" />
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
