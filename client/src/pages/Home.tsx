import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "@/components/ChatMessage";
import { useSendMessage } from "@/hooks/use-chat";
import { Send, Loader2, Sparkles, Activity, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [messages, setMessages] = useState([{
    id: "welcome",
    role: "assistant",
    content: "Hello! I'm your AI Pest Control Assistant. How can I help you today?",
  }]);
  
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const sendMessage = useSendMessage();

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, sendMessage.isPending]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || sendMessage.isPending) return;

    const userMsg = { id: Date.now().toString(), role: "user", content: inputValue };
    setMessages(prev => [...prev, userMsg]);
    setInputValue("");

    try {
      const response = await sendMessage.mutateAsync({ 
        message: userMsg.content, 
        liveOnly: true, 
        model: "gemini-1.5-flash" 
      });

      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: "assistant", 
        content: response.response 
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        id: "err", 
        role: "error", 
        content: "Connection error. Please try again." 
      }]);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FBF9] flex flex-col font-sans selection:bg-[#4AB295]/10">
      {/* Header */}
      <header className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#4AB295] rounded-xl flex items-center justify-center shadow-sm">
            <Sparkles className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1A3D35]">PestControl<span className="text-[#4AB295]">AI</span></h1>
            <p className="text-xs text-gray-400 font-medium">Expert Identification</p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row gap-6 p-4 md:p-8 w-full max-w-7xl mx-auto h-[750px]">
        {/* Sidebar Dashboard */}
        <aside className="w-full lg:w-64 flex flex-col gap-4">
          <div className="bg-white p-6 rounded-[2rem] border border-[#E8F0ED] shadow-sm">
            <h3 className="text-[#1A3D35] font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
              <Activity size={16} className="text-[#4AB295]"/> Necessities
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-[#F3F8F6] rounded-2xl">
                <p className="text-[9px] uppercase text-gray-400 font-bold">Safety Level</p>
                <p className="text-[#4AB295] font-bold text-sm">99.9% Secure</p>
              </div>
              <div className="p-3 bg-[#F3F8F6] rounded-2xl">
                <p className="text-[9px] uppercase text-gray-400 font-bold">AI Latency</p>
                <p className="text-[#4AB295] font-bold text-sm">1.2s Response</p>
              </div>
              <div className="p-3 bg-[#F3F8F6] rounded-2xl">
                <p className="text-[9px] uppercase text-gray-400 font-bold">Expert Logic</p>
                <p className="text-[#4AB295] font-bold text-sm">Activated</p>
              </div>
              <div className="p-3 bg-white border border-[#E8F0ED] rounded-2xl">
                <p className="text-[9px] uppercase text-gray-400 font-bold flex items-center gap-1">
                  <ShieldOff size={10} className="text-[#4AB295]" /> Privacy
                </p>
                <p className="text-[#4AB295] font-bold text-[10px] mt-0.5 leading-tight">Cookies & Site Data Disabled</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Chat Container */}
        <div className="flex-1 bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-[#E8F0ED] flex flex-col relative overflow-hidden h-full">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8">
            <AnimatePresence initial={false}>
              {messages.map(msg => (
                <ChatMessage key={msg.id} {...msg} />
              ))}
            </AnimatePresence>
            
            {/* Analyzing Animation */}
            {sendMessage.isPending && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#F3F8F6] rounded-xl flex items-center justify-center">
                  <Activity size={18} className="text-[#4AB295] animate-pulse" />
                </div>
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[#4AB295] uppercase tracking-tighter">Analyzing</span>
                    <span className="flex gap-1">
                      <span className="w-1 h-1 bg-[#4AB295] rounded-full animate-bounce" />
                      <span className="w-1 h-1 bg-[#4AB295] rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1 h-1 bg-[#4AB295] rounded-full animate-bounce [animation-delay:0.4s]" />
                    </span>
                  </div>
                  <div className="h-8 w-32 bg-[#F3F8F6] rounded-2xl relative overflow-hidden border border-[#E8F0ED]">
                    <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#4AB295]/10 to-transparent" animate={{ x: ['-100%', '200%'] }} transition={{ repeat: Infinity, duration: 1.2 }} />
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Input */}
          <div className="px-6 md:px-10 pb-10 pt-2">
            <form onSubmit={handleSend} className="relative flex items-center">
              <Input 
                value={inputValue} 
                onChange={e => setInputValue(e.target.value)} 
                placeholder="Ask anything..." 
                className="w-full bg-[#F3F8F6] border-none rounded-full py-7 px-8 text-lg focus-visible:ring-2 focus-visible:ring-[#4AB295]/20 shadow-inner" 
              />
              <Button type="submit" className="absolute right-2 h-12 w-12 rounded-full bg-[#4AB295] hover:bg-[#3d967d] shadow-lg transition-transform active:scale-95">
                <Send size={20} />
              </Button>
            </form>
          </div>
        </div>
      </main>

      {/* Footer Sticker */}
      <footer className="p-6 flex justify-center mt-auto">
        <div className="bg-[#E8F0ED] px-5 py-2 rounded-full flex items-center gap-3 border border-[#4AB295]/20 shadow-sm">
          <div className="flex h-2 w-2 relative">
            <span className="animate-ping absolute h-full w-full rounded-full bg-[#4AB295] opacity-75"></span>
            <span className="h-2 w-2 rounded-full bg-[#4AB295]"></span>
          </div>
          <span className="text-[10px] font-bold text-[#1A3D35] uppercase tracking-[0.2em]">AI Live Responses Activated</span>
        </div>
      </footer>
    </div>
  );
}
