import { useState, useRef, useEffect } from "react";
import { Header } from "@/components/Header";
import { ChatMessage } from "@/components/ChatMessage";
import { useSendMessage } from "@/hooks/use-chat";
import { Send, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  role: "user" | "assistant" | "error";
  content: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm your AI Pest Control Assistant. How can I help you with your pest identification or prevention needs today?",
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  
  const liveOnly = true; 
  const model = "gemini-1.5-flash"; 
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const sendMessage = useSendMessage();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sendMessage.isPending]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || sendMessage.isPending) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: inputValue };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");

    try {
      const response = await sendMessage.mutateAsync({ message: userMsg.content, liveOnly, model });
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: response.response };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      setMessages((prev) => [...prev, { id: "err", role: "error", content: "Error connecting to server." }]);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FBF9] flex flex-col font-sans selection:bg-emerald-100">
      {/* Modern Top Header */}
      <header className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#4AB295] rounded-xl flex items-center justify-center shadow-sm">
            <Sparkles className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1A3D35] leading-none">PestControl<span className="text-[#4AB295]">AI</span></h1>
            <p className="text-xs text-gray-500 font-medium mt-1">Smart Identification & Advice</p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center p-4 md:p-8 w-full max-w-5xl mx-auto">
        {/* Main Chat Container */}
        <div className="w-full bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-[#E8F0ED] flex flex-col h-[750px] relative overflow-hidden">
          
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-8 scroll-smooth">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <ChatMessage key={msg.id} {...msg} />
              ))}
            </AnimatePresence>

            {sendMessage.isPending && (
              <div className="flex gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-[#E8F0ED]" />
                <div className="h-12 w-24 bg-[#F0F7F4] rounded-2xl rounded-tl-none" />
              </div>
            )}
          </div>

          {/* Minimalist Input Field */}
          <div className="px-10 pb-10 pt-2">
            <form 
              onSubmit={handleSend}
              className="relative flex items-center group"
            >
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask anything..."
                className="w-full bg-[#F3F8F6] border-2 border-transparent focus:border-[#4AB295]/20 focus:bg-white rounded-full py-7 px-8 text-lg transition-all shadow-inner placeholder:text-gray-300"
              />
              <Button
                type="submit"
                className="absolute right-2 h-12 w-12 rounded-full bg-[#4AB295] hover:bg-[#3d967d] shadow-lg transition-transform active:scale-90"
                disabled={!inputValue.trim() || sendMessage.isPending}
              >
                {sendMessage.isPending ? <Loader2 className="animate-spin" /> : <Send size={20} />}
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
