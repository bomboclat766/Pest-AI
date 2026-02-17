import { useState, useRef, useEffect } from "react";
import { Header } from "@/components/Header";
import { ChatMessage } from "@/components/ChatMessage";
import { useSendMessage } from "@/hooks/use-chat";
import { Send, Loader2, Sparkles, Activity } from "lucide-react";
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
      const response = await sendMessage.mutateAsync({ message: userMsg.content, liveOnly: true, model: "gemini-1.5-flash" });
      setMessages(prev => [...prev, { id: Date.now().toString(), role: "assistant", content: response.response }]);
    } catch (error) {
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
          <div>
            <h1 className="text-xl font-bold text-[#1A3D35]">PestControl<span className="text-[#4AB295]">AI</span></h1>
            <p className="text-xs text-gray-500 font-medium">Smart Identification & Advice</p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-row gap-6 p-4 md:p-8 w-full max-w-7xl mx-auto h-[800px]">
        {/* Left: Necessities Dashboard */}
        <aside className="w-64 hidden lg:flex flex-col gap-4">
          <div className="bg-white p-6 rounded-[2rem] border border-[#E8F0ED] shadow-sm">
            <h3 className="text-[#1A3D35] font-bold mb-4 flex items-center gap-2"><Activity size={16}/> Necessities</h3>
            <div className="space-y-4">
              <div className="p-3 bg-[#F3F8F6] rounded-2xl">
                <p className="text-[10px] uppercase text-gray-400 font-bold">Safety Level</p>
                <p className="text-[#4AB295] font-bold">99.9% Secure</p>
              </div>
              
              <div className="p-3 bg-[#F3F8F6] rounded-2xl">
                <p className="text-[10px] uppercase text-gray-400 font-bold">AI Latency</p>
                <p className="text-[#4AB295] font-bold">1.2s Response</p>
              </div>

              <div className="p-3 bg-[#F3F8F6] rounded-2xl">
                <p className="text-[10px] uppercase text-gray-400 font-bold">Expert Logic</p>
                <p className="text-[#4AB295] font-bold">Activated</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Right: Chat Container */}
        <div className="flex-1 bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-[#E8F0ED] flex flex-col relative overflow-hidden">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-8">
            <AnimatePresence initial={false}>
              {messages.map(msg => <ChatMessage key={msg.id} {...msg} />)}
            </AnimatePresence>
          </div>

          <div className="px-10 pb-10 pt-2">
            <form onSubmit={handleSend} className="relative flex items-center">
              <Input 
                value={inputValue} 
                onChange={e => setInputValue(e.target.value)} 
                placeholder="Ask anything..." 
                className="w-full bg-[#F3F8F6] border-none rounded-full py-7 px-8 text-lg focus-visible:ring-1 focus-visible:ring-[#4AB295]/20" 
              />
              <Button 
                type="submit" 
                className="absolute right-2 h-12 w-12 rounded-full bg-[#4AB295] hover:bg-[#3d967d] text-white shadow-lg"
                disabled={!inputValue.trim() || sendMessage.isPending}
              >
                {sendMessage.isPending ? <Loader2 className="animate-spin" /> : <Send size={20} />}
              </Button>
            </form>
          </div>
        </div>
      </main>

      <footer className="p-6 flex justify-center">
        <div className="bg-[#E8F0ED] px-5 py-2 rounded-full flex items-center gap-2 border border-[#4AB295]/20 shadow-sm">
          <div className="w-2 h-2 bg-[#4AB295] rounded-full animate-ping" />
          <span className="text-[11px] font-bold text-[#1A3D35] uppercase tracking-widest">AI Live Responses Activated</span>
        </div>
      </footer>
    </div>
  );
}
