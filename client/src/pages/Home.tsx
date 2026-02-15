import { useState, useRef, useEffect } from "react";
import { Header } from "@/components/Header";
import { FooterControls } from "@/components/FooterControls";
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
  note?: string;
  isFallback?: boolean;
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
  const [liveOnly, setLiveOnly] = useState(true);
  const [model, setModel] = useState("gemini-1.5-flash");
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const sendMessage = useSendMessage();

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sendMessage.isPending]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || sendMessage.isPending) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");

    try {
      const response = await sendMessage.mutateAsync({
        message: userMsg.content,
        liveOnly,
        model,
      });

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.response,
        note: response.note,
        isFallback: response.isFallback,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "error",
        content: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col font-sans">
      <Header />

      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 w-full max-w-4xl mx-auto">
        <div className="w-full bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-primary/10 overflow-hidden border border-white/40 flex flex-col h-[800px] max-h-[85vh]">
          
          {/* Chat Area */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-8 scrollbar-thin"
          >
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <ChatMessage key={msg.id} {...msg} />
              ))}
            </AnimatePresence>

            {sendMessage.isPending && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-row gap-4 mb-8"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg relative overflow-hidden">
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                  <Sparkles size={18} className="text-white relative z-10" />
                </div>
                <div className="px-6 py-4 rounded-3xl rounded-tl-none bg-white/80 border border-white/20 shadow-sm flex items-center gap-3">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-primary/40"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-400 font-medium">Thinking...</span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-6 bg-white/40 border-t border-white/20 backdrop-blur-sm">
            <form 
              onSubmit={handleSend}
              className="flex items-center gap-4 bg-white/80 p-2 pr-2.5 rounded-[1.5rem] border border-white/40 focus-within:ring-4 focus-within:ring-primary/10 focus-within:border-primary/30 transition-all duration-300 shadow-xl shadow-primary/5"
            >
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask anything..."
                className="flex-1 border-none bg-transparent shadow-none focus-visible:ring-0 px-5 text-lg placeholder:text-gray-300 h-12"
                disabled={sendMessage.isPending}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!inputValue.trim() || sendMessage.isPending}
                className="rounded-2xl h-12 w-12 shrink-0 bg-gradient-to-tr from-primary to-accent hover:opacity-90 text-white shadow-lg hover:shadow-primary/20 transition-all duration-300"
              >
                {sendMessage.isPending ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <Send className="h-6 w-6" />
                )}
              </Button>
            </form>
          </div>
        </div>
      </main>

      <FooterControls 
        liveOnly={liveOnly} 
        setLiveOnly={setLiveOnly}
        model={model}
        setModel={setModel}
      />
    </div>
  );
}
