import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "@/components/ChatMessage";
import { useSendMessage } from "@/hooks/use-chat";
import { Send, Sparkles, Plus, X, Image as ImageIcon, Menu, Settings, Bug, ShieldCheck, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  { label: "Identify a bug", icon: <Bug size={14}/>, prompt: "Can you help me identify a pest from a description or photo?" },
  { label: "Nairobi Fly safety", icon: <ShieldCheck size={14}/>, prompt: "What should I do if I find a Nairobi Fly (Paederus sabaeus) in my house?" },
  { label: "Organic repellents", icon: <Leaf size={14}/>, prompt: "What are some eco-friendly ways to keep ants away from my kitchen?" },
];

export default function Home() {
  const [messages, setMessages] = useState<any[]>([{ id: "w", role: "assistant", content: "I am your PestAI assistant. How can I help you today?" }]);
  const [inputValue, setInputValue] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sendMessage = useSendMessage();

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sendMessage.isPending]);

  const handleSend = async (e?: React.FormEvent, overrideText?: string) => {
    e?.preventDefault();
    const textToSend = overrideText || inputValue;
    if ((!textToSend.trim() && !selectedImage) || sendMessage.isPending) return;

    const userMsg = { id: Date.now().toString(), role: "user", content: textToSend, image: selectedImage };
    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setSelectedImage(null);

    try {
      const response = await sendMessage.mutateAsync({
        message: selectedImage ? [{ type: "text", text: textToSend || "Identify" }, { type: "image_url", image_url: { url: selectedImage } }] : textToSend,
        history: messages.map(m => ({ role: m.role, content: m.content })),
        liveOnly: true,
        model: "google/gemini-flash-1.5",
      });
      setMessages(prev => [...prev, { id: Date.now().toString(), role: "assistant", content: response.response }]);
    } catch {
      setMessages(prev => [...prev, { id: "e", role: "error", content: "Connection error. Please try again." }]);
    }
  };

  return (
    <div className="h-screen bg-white flex flex-col relative overflow-hidden font-sans">
      <header className="flex items-center justify-between px-6 h-16 bg-white/50 backdrop-blur-sm fixed top-0 w-full z-50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 rounded-lg"><Sparkles className="text-blue-500" size={18} /></div>
          <span className="font-medium text-[15px] text-slate-700">PestAI <span className="text-slate-400 font-normal">v2026.1</span></span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-full text-slate-500"><Settings size={20} /></Button>
          <Button variant="ghost" size="icon" className="rounded-full text-slate-500"><Menu size={20} /></Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden pt-16">
        <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar pb-64">
          <AnimatePresence mode="popLayout">
            {messages.length <= 1 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-32 text-center max-w-2xl mx-auto px-6">
                <h1 className="text-4xl md:text-5xl font-medium text-slate-800 mb-6 bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 bg-clip-text text-transparent">Hello, I'm PestAI</h1>
                <p className="text-slate-500 text-lg">Your specialized intelligence for local Nairobi species and eco-safe treatment plans.</p>
              </motion.div>
            )}
            {messages.map((msg) => <ChatMessage key={msg.id} {...msg} />)}
            {sendMessage.isPending && (
              <div className="max-w-3xl mx-auto flex gap-6 px-4 py-8 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-slate-50 border border-blue-50 flex items-center justify-center text-blue-300"><Sparkles size={20} /></div>
                <div className="flex-1 space-y-3 pt-2">
                  <div className="h-2 bg-slate-100 rounded-full w-3/4"></div>
                  <div className="h-2 bg-slate-100 rounded-full w-1/2"></div>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Floating Input Area */}
        <div className="absolute bottom-0 w-full bg-gradient-to-t from-white via-white to-transparent pt-10 pb-6 px-4">
          <div className="max-w-3xl mx-auto space-y-4">
            
            {/* SUGGESTION CHIPS */}
            {messages.length <= 1 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {SUGGESTIONS.map((item, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => handleSend(undefined, item.prompt)}
                    className="flex items-center gap-2 whitespace-nowrap bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm"
                  >
                    <span className="text-blue-500">{item.icon}</span>
                    {item.label}
                  </motion.button>
                ))}
              </div>
            )}

            <form onSubmit={handleSend} className="relative bg-[#f0f4f9] hover:bg-[#e9eef6] transition-colors rounded-[32px] p-2 pr-4 shadow-sm focus-within:bg-white focus-within:shadow-md border border-transparent focus-within:border-blue-100">
              {selectedImage && (
                <div className="absolute -top-24 left-4 p-2 bg-white rounded-2xl shadow-xl border border-slate-100">
                  <img src={selectedImage} className="w-16 h-16 object-cover rounded-xl" alt="Preview" />
                  <button type="button" onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 bg-slate-800 text-white rounded-full p-1"><X size={10} /></button>
                </div>
              )}
              <div className="flex items-center">
                <input type="file" className="hidden" ref={fileInputRef} accept="image/*" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if(f){ const r=new FileReader(); r.onloadend=()=>setSelectedImage(r.result as string); r.readAsDataURL(f); }
                }} />
                <Button type="button" variant="ghost" onClick={() => fileInputRef.current?.click()} className="rounded-full text-slate-600"><ImageIcon size={22} /></Button>
                <input 
                  value={inputValue} 
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask PestAI..." 
                  className="flex-1 bg-transparent border-none outline-none text-[16px] px-4 py-3 placeholder:text-slate-500"
                />
                <div className="flex items-center gap-2">
                  <Button type="button" variant="ghost" className="rounded-full text-blue-500"><Plus size={22} /></Button>
                  {(inputValue || selectedImage) && (
                    <button type="submit" className="text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-all">
                      <Send size={22} />
                    </button>
                  )}
                </div>
              </div>
            </form>
            <p className="text-[11px] text-center text-slate-400">PestAI uses advanced intelligence. Verify information for safety.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
