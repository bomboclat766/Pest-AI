"use client";

import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "@/components/ChatMessage";
import { useSendMessage } from "@/hooks/use-chat";
import { 
  Send, 
  Sparkles, 
  Plus, 
  Code, 
  MessageSquare, 
  Lightbulb, 
  Settings2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const MARWA_SUGGESTIONS = [
  { icon: Code, label: "Help me debug my latest project", color: "text-blue-500", bg: "bg-blue-50" },
  { icon: MessageSquare, label: "Draft a pitch for my new AI tool", color: "text-emerald-500", bg: "bg-emerald-50" },
  { icon: Lightbulb, label: "Brainstorm features for MarwaBuddy", color: "text-amber-500", bg: "bg-amber-50" },
];

export default function Home() {
  const [mounted, setMounted] = useState(false);
  
  const [sessions, setSessions] = useState<Record<string, any>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('marwa_sessions_v2');
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });

  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('marwa_active_id') || "default";
    }
    return "default";
  });

  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState("");
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const sendMessage = useSendMessage();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted) {
      const sessionData = sessions[currentSessionId] || [{ id: "init", role: "assistant", content: "Hey! I'm MarwaBuddy. What's on your mind today?" }];
      setMessages(sessionData);
      localStorage.setItem('marwa_active_id', currentSessionId);
    }
  }, [currentSessionId, mounted]);

  useEffect(() => {
    if (mounted && (messages.length > 0 || sendMessage.isPending)) {
      const updatedSessions = { ...sessions, [currentSessionId]: messages };
      setSessions(updatedSessions);
      localStorage.setItem('marwa_sessions_v2', JSON.stringify(updatedSessions));
      
      if (scrollRef.current) {
        setTimeout(() => {
          scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
        }, 100);
      }
    }
  }, [messages, sendMessage.isPending]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || sendMessage.isPending) return;

    const userMsg = { id: Date.now().toString(), role: "user" as const, content: inputValue };
    const history = messages.map(m => ({ role: m.role, content: m.content }));
    
    setMessages(prev => [...prev, userMsg]);
    const currentInput = inputValue;
    setInputValue("");

    try {
      const result = await sendMessage.mutateAsync({ message: currentInput, history: history, liveOnly: false });
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: result.response }]);
    } catch (err) {
      setMessages(prev => [...prev, { id: "err", role: "error", content: "Snag detected. Mind trying that again?" }]);
    }
  };

  const handleNewSession = () => {
    const newId = `chat_${Date.now()}`;
    setCurrentSessionId(newId);
    setMessages([{ id: "init", role: "assistant", content: "New session started. What's the plan, Osteen?" }]);
  };

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-white text-slate-900 font-sans overflow-hidden">
      
      <aside className="w-20 md:w-64 border-r border-slate-100 flex flex-col p-4 bg-[#FCFDFE]">
        <div className="flex items-center gap-3 px-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center shadow-lg shadow-blue-200">
            <Sparkles size={18} className="text-white" />
          </div>
          <h1 className="font-bold text-lg tracking-tight hidden md:block">MarwaBuddy</h1>
        </div>

        <Button onClick={handleNewSession} variant="ghost" className="w-full justify-center md:justify-start gap-3 rounded-xl py-6 mb-2 hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-slate-100 outline-none ring-0 focus:ring-0">
          <Plus size={20} className="text-slate-600" /> 
          <span className="font-medium hidden md:block text-slate-600">New Session</span>
        </Button>

        <div className="flex-1 overflow-y-auto mt-4 space-y-1 pr-2 scrollbar-none hidden md:block">
          {Object.keys(sessions).reverse().map((id) => (
            <button
              key={id}
              onClick={() => setCurrentSessionId(id)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all truncate ${
                currentSessionId === id ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {sessions[id][1]?.content.substring(0, 24) || "New Conversation"}...
            </button>
          ))}
        </div>

        <div className="mt-auto space-y-2">
          <Button variant="ghost" size="icon" className="w-full md:w-auto md:px-3 md:justify-start gap-3 text-slate-500 hover:text-blue-600 outline-none ring-0 focus:ring-0">
            <Settings2 size={20} /> <span className="hidden md:block text-sm font-medium">Settings</span>
          </Button>
          <div className="pt-4 border-t border-slate-100 flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">OS</div>
            <div className="hidden md:block overflow-hidden">
              <p className="text-xs font-bold truncate text-slate-700">Osteen</p>
              <p className="text-[10px] text-blue-500 font-medium">Developer Mode</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative bg-[#F8F9FA]">
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-12 pt-12 pb-52 scrollbar-thin">
          <div className="max-w-4xl mx-auto space-y-10">
            
            {messages.length <= 1 && !sendMessage.isPending && (
              <div className="py-20 text-center md:text-left">
                <motion.h2 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-5xl font-semibold text-slate-800 mb-2 tracking-tight"
                >
                  Yo, Osteen.
                </motion.h2>
                <p className="text-slate-500 text-lg mb-12 font-medium">How can MarwaBuddy help you today?</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {MARWA_SUGGESTIONS.map((s, i) => (
                    <motion.button 
                      key={i}
                      onClick={() => setInputValue(s.label)}
                      className="p-6 bg-white border border-slate-200/60 rounded-3xl text-left hover:border-blue-400 hover:shadow-xl transition-all group outline-none ring-0"
                    >
                      <div className={`${s.bg} w-10 h-10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                        <s.icon className={s.color} size={20} />
                      </div>
                      <p className="text-[14px] font-semibold text-slate-700 leading-tight">{s.label}</p>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            <AnimatePresence mode="popLayout">
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-6 max-w-3xl"
                >
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1 shadow-sm ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200'}`}>
                    {m.role === 'user' ? <span className="text-[10px] font-bold">OS</span> : <Sparkles size={14} className="text-blue-500" />}
                  </div>
                  <div className="flex-1 pt-1.5 prose prose-slate max-w-none text-slate-800 text-[15px] leading-relaxed">
                    <ChatMessage {...m} />
                  </div>
                </motion.div>
              ))}

              {/* THINKING ANIMATION INDICATOR */}
              {sendMessage.isPending && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-6 max-w-3xl"
                >
                  <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1 bg-white border border-slate-200 shadow-sm">
                    <Sparkles size={14} className="text-blue-400 animate-pulse" />
                  </div>
                  <div className="flex items-center gap-1.5 pt-3">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-10 bg-gradient-to-t from-[#F8F9FA] via-[#F8F9FA]/90 to-transparent">
          <div className="max-w-3xl mx-auto">
            <form 
              onSubmit={handleSend}
              className="flex items-end gap-2 p-2 bg-white border border-slate-200/80 rounded-[32px] shadow-2xl shadow-slate-200/50 focus-within:border-blue-400 transition-all outline-none"
            >
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Ask MarwaBuddy anything..."
                className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none px-5 py-4 text-[15px] resize-none min-h-[60px] max-h-40 scrollbar-thin outline-none shadow-none"
                rows={1}
              />
              <Button 
                type="submit" 
                disabled={!inputValue.trim() || sendMessage.isPending}
                className="h-12 w-12 rounded-full bg-blue-600 hover:bg-blue-700 p-0 mb-1.5 mr-1.5 shadow-lg active:scale-90 transition-transform outline-none ring-0 focus:ring-0"
              >
                {sendMessage.isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={18} className="text-white" />}
              </Button>
            </form>
            <p className="text-[10px] text-center mt-4 text-slate-400 font-bold tracking-widest uppercase">
              MarwaBuddy v1.0 • Built for the Hustle
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}