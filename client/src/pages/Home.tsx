import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "@/components/ChatMessage";
import { useSendMessage } from "@/hooks/use-chat";
import { Send, Sparkles, Activity, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm your AI Pest Control Assistant. How can I help you today?",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const sendMessage = useSendMessage();

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
    if (!inputValue.trim() || sendMessage.isPending) return;

    const userMsg = { id: Date.now().toString(), role: "user", content: inputValue };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");

    try {
      const response = await sendMessage.mutateAsync({
        message: userMsg.content,
        liveOnly: true,
        model: "gemini-1.5-flash",
      });
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "assistant", content: response.response },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { id: "err", role: "error", content: "Connection error." },
      ]);
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
            <h1 className="text-xl font-bold text-[#1A3D35]">
              PestControl<span className="text-[#4AB295]">AI</span>
            </h1>
            <p className="text-xs text-gray-500">Smart Identification & Advice</p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-row gap-6 p-4 md:p-8 w-full max-w-7xl mx-auto h-[800px]">
        <aside className="w-64 hidden lg:flex flex-col gap-4">
          {/* Necessities Dashboard */}
          <div className="bg-white p-6 rounded-[2rem] border border-[#E8F0ED] shadow-sm">
            <h3 className="text-[#1A3D35] font-bold mb-4 flex items-center gap-2">
              <Activity size={16} /> Necessities
            </h3>
            <div className="space-y-4">
              <div className="p-3 bg-[#F3F8F6] rounded-2xl">
                <p className="text-[10px] uppercase text-gray-400 font-bold">Safety Level</p>
                <p className="text-[#4AB295] font-bold">99.9% Secure</p>
              </div>
              <div className="p-3 bg-[#F3F8F6] rounded-2xl">
                <p className="text-[10px] uppercase text-gray-400 font-bold">AI Status</p>
                <p className="text-[#4AB295] font-bold">
                  {sendMessage.isPending ? "Analyzing..." : "Ready"}
                </p>
              </div>
            </div>
          </div>

          {/* AI Capabilities Dashboard */}
          <div className="bg-white p-6 rounded-[2rem] border border-[#E8F0ED] shadow-sm">
            <h3 className="text-[#1A3D35] font-bold mb-4 flex items-center gap-2">
              <Zap size={16} className="text-[#4AB295]" /> AI Capabilities
            </h3>
            <div className="space-y-4">
              <div className="p-3 bg-[#F3F8F6] rounded-2xl">
                <p className="text-[10px] uppercase text-gray-400 font-bold">Identification</p>
                <p className="text-[#4AB295] font-bold text-sm">Instant Pest ID</p>
              </div>
              <div className="p-3 bg-[#F3F8F6] rounded-2xl">
                <p className="text-[10px] uppercase text-gray-400 font-bold">Responses</p>
                <p className="text-[#4AB295] font-bold text-sm">Eco-Safe Advice</p>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex-1 bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-[#E8F0ED] flex flex-col relative overflow-hidden">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-8">
            <AnimatePresence mode="popLayout">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} {...msg} />
              ))}
              {sendMessage.isPending && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex gap-1.5 p-4 bg-[#F3F8F6] rounded-2xl rounded-bl-none">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 bg-[#4AB295] rounded-full"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          delay: i * 0.2,
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-[#4AB295] uppercase tracking-tighter">
                    AI Analyzing
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="px-10 pb-10 pt-2">
            <form onSubmit={handleSend} className="relative flex items-center">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask anything..."
                className="w-full bg-[#F3F8F6] border-none rounded-full py-7 px-8 text-lg focus-visible:ring-1 focus-visible:ring-[#4AB295]"
              />
              <Button
                type="submit"
                disabled={sendMessage.isPending}
                className="absolute right-2 h-12 w-12 rounded-full bg-[#4AB295] hover:bg-[#3d967d] transition-colors"
              >
                <Send size={20} />
              </Button>
            </form>
          </div>
        </div>
      </main>

      <footer className="p-6 flex justify-center">
        <div className="bg-[#E8F0ED] px-4 py-2 rounded-full flex items-center gap-2 border border-[#4AB295]/20">
          <div className={`w-2 h-2 rounded-full ${sendMessage.isPending ? "bg-orange-400 animate-pulse" : "bg-[#4AB295] animate-ping"}`} />
          <span className="text-[11px] font-bold text-[#1A3D35] uppercase tracking-widest">
            {sendMessage.isPending ? "Processing Request..." : "AI Live Responses Activated"}
          </span>
        </div>
      </footer>
    </div>
  );
}
