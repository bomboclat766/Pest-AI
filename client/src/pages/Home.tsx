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
      setMessages(prev => [...prev, { id: "err", role: "error", content: "Connection error." }]);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FBF9] flex flex-col font-sans">
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

      <main className="flex-1 flex flex-col lg:flex-row gap-6 p-4 md:p-8 w-full max-w-7xl mx-auto h-[600px]">
        {/* Sidebar: Uniform Emerald Cards */}
        <aside className="w-full lg:w-64 flex flex-col gap-4">
          <div className="bg-white p-6 rounded-[2rem] border border-[#E8F0ED] shadow-sm">
            <h3 className="text-[#1A3D35] font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
              <Activity size={16} className="text-[#4AB295]"/> Necessities
            </h3>
            <div className="space-y-3">
              {[
                { label: "Safety Level", val: "99.9% Secure" },
                { label: "AI Latency", val: "1.2s Response" },
                { label: "Expert Logic", val: "Activated" },
                { label: "Cookies & Data", val: "Disabled", icon: <ShieldOff size={10} className="inline mr-1" /> }
              ].map((item, i) => (
                <div key={i} className="p-3 bg-[#F3F8F6] rounded-2xl">
                  <p className="text-[9px] uppercase text-gray-400 font-bold">{item.label}</p>
                  <p className="text-[#4AB295] font-bold text-sm">{item.icon}{item.val}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Standard Sized Chat Container */}
        <div className="flex-1 bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-[#E8F0ED] flex flex-col relative overflow-hidden h-full">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8">
            <AnimatePresence initial={false}>
              {messages.map(msg => <ChatMessage key={msg.id} {...msg} />)}
            </AnimatePresence>
            
            {/* 🟢 Analyzing Animation 🟢 */}
