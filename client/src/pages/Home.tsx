"use client";

import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "@/components/ChatMessage";
import { useSendMessage } from "@/hooks/use-chat";
import { 
  Send, 
  Sparkles, 
  Plus, 
  Search, 
  Code2, 
  Zap, 
  ChevronRight, 
  LayoutGrid,
  Settings2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const SUGGESTIONS = [
  { icon: Code2, label: "Optimize my React code", color: "text-blue-500" },
  { icon: Search, label: "Market research for SaaS", color: "text-purple-500" },
  { icon: Zap, label: "Summarize this technical doc", color: "text-amber-500" },
];

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<Array<{ id: string; role: "user" | "assistant" | "error"; content: string }>>([
    { id: "init", role: "assistant", content: "I'm MarwaBuddy. Ready to accelerate your workflow. What are we building today?" }
  ]);
  const [inputValue, setInputValue] = useState("");
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const sendMessage = useSendMessage();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || sendMessage.isPending) return;

    const userMsg = { id: Date.now().toString(), role: "user" as const, content: inputValue };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = inputValue;
    setInputValue("");

    try {
      const result = await sendMessage.mutateAsync({ message: currentInput, liveOnly: false });
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: result.response }]);
    } catch (err) {
      setMessages(prev => [...prev, { id: "err", role: "error", content: "I hit a snag. Let's try that again." }]);
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-[#fafafa] text-slate-900 font-sans overflow-hidden">
      
      {/* --- SIDEBAR --- */}
      <aside className="w-72 bg-white/80 backdrop-blur-xl border-r border-slate-200/60 p-6 flex flex-col hidden md:flex">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
            <Sparkles size={16} className="text-white" />
          </div>
          <h1 className="font-bold text-lg tracking-tight">MarwaBuddy</h1>
        </div>

        <Button className="w-full justify-start gap-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-6 mb-8 shadow-md transition-all active:scale-95">
          <Plus size={18} /> <span className="font-medium">New Chat</span>
        </Button>

        <nav className="flex-1 space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-3">Recent Projects</p>
          {['SaaS Dashboard UI', 'API Integration Fix', 'Marketing Copy'].map((item) => (
            <button key={item} className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-colors flex items-center justify-between group">
              {item}
              <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </nav>

        <div className="pt-6 border-t border-slate-100 space-y-1">
          <Button variant="ghost" className="w-full justify-start gap-3 text-slate-500 rounded-lg"><LayoutGrid size={18} /> Library</Button>
          <Button variant="ghost" className="w-full justify-start gap-3 text-slate-500 rounded-lg"><Settings2 size={18} /> Settings</Button>
        </div>
      </aside>

      {/* --- MAIN INTERFACE --- */}
      <main className="flex-1 flex flex-col relative bg-gradient-to-b from-white via-slate-50/50 to-slate-100">
        
        {/* Scrollable Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 pt-12 pb-32">
          <div className="max-w-4xl mx-auto space-y-10">
            
            {messages.length === 1 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }}
                className="py-12"
              >
                <h2 className="text-4xl font-semibold text-slate-800 mb-8 tracking-tight">
                  What’s on your mind?
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {SUGGESTIONS.map((s, i) => (
                    <button 
                      key={i}
                      onClick={() => setInputValue(s.label)}
                      className="p-5 bg-white border border-slate-200 rounded-2xl text-left hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/5 transition-all group"
                    >
                      <s.icon className={`${s.color} mb-3 group-hover:scale-110 transition-transform`} size={22} />
                      <p className="text-sm font-medium text-slate-700 leading-snug">{s.label}</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            <AnimatePresence mode="popLayout">
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {m.role !== 'user' && (
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center mt-1">
                      <Sparkles size={14} className="text-slate-600" />
                    </div>
                  )}
                  <div className={`p-5 rounded-2xl max-w-[85%] leading-relaxed ${
                    m.role === 'user' 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/10' 
                      : 'bg-white border border-slate-200 shadow-sm text-slate-800'
                  }`}>
                    <ChatMessage {...m} />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Input Dock */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-100 via-slate-100/90 to-transparent">
          <div className="max-w-4xl mx-auto">
            <form 
              onSubmit={handleSend}
              className="group relative flex items-end gap-2 p-2 bg-white border border-slate-200 rounded-3xl shadow-2xl shadow-slate-200 focus-within:border-blue-400 transition-all duration-300"
            >
              <Button type="button" variant="ghost" size="icon" className="h-12 w-12 rounded-2xl text-slate-400 hover:bg-slate-50">
                <Plus size={20} />
              </Button>

              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Message MarwaBuddy..."
                className="flex-1 bg-transparent border-none focus:ring-0 py-3.5 text-[15px] resize-none min-h-[52px] max-h-40"
                rows={1}
              />

              <Button 
                type="submit" 
                disabled={!inputValue.trim() || sendMessage.isPending}
                className="h-12 w-12 rounded-2xl bg-blue-600 hover:bg-blue-700 transition-transform active:scale-90 disabled:opacity-30 shadow-lg shadow-blue-600/20"
              >
                {sendMessage.isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={18} className="text-white" />}
              </Button>
            </form>
            <p className="text-[10px] text-center mt-3 text-slate-400 font-medium tracking-wide">
              POWERED BY MARWABUDDY AI • BUILT FOR NAIROBI
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}