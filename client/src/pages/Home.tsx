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
      content: "Hello! Welcome to Termipest Limited. How can we help you with your pest control needs today?",
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
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header />

      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 w-full max-w-5xl mx-auto">
        <div className="w-full bg-white rounded-3xl shadow-2xl shadow-primary/5 overflow-hidden border border-gray-100 flex flex-col h-[750px] max-h-[85vh]">
          
          {/* Chat Area */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 scrollbar-thin bg-gradient-to-b from-gray-50/50 to-white"
          >
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <ChatMessage key={msg.id} {...msg} />
              ))}
            </AnimatePresence>

            {sendMessage.isPending && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-row gap-3 mb-6"
              >
                <div className="w-8 h-8 rounded-full bg-white border border-primary/20 flex items-center justify-center shadow-sm relative overflow-visible">
                  <Loader2 size={16} className="text-primary animate-spin" />
                  {/* Floating Cube Animation */}
                  <motion.div
                    animate={{
                      x: [-12, 12, 12, -12, -12],
                      y: [-12, -12, 12, 12, -12],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                    className="absolute w-3 h-3 border border-primary/30 rounded-sm bg-primary/5 pointer-events-none"
                  />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-tl-none bg-gray-50 border border-gray-100 shadow-sm flex items-center gap-2">
                  <span className="text-sm text-gray-500 font-medium">AI is thinking...</span>
                  <Sparkles size={14} className="text-yellow-500 animate-pulse" />
                </div>
              </motion.div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-100">
            <form 
              onSubmit={handleSend}
              className="flex items-center gap-3 bg-gray-50 p-1.5 pr-2 rounded-full border border-gray-200 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all duration-200 shadow-sm"
            >
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your message here..."
                className="flex-1 border-none bg-transparent shadow-none focus-visible:ring-0 px-4 text-base placeholder:text-gray-400 h-10"
                disabled={sendMessage.isPending}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!inputValue.trim() || sendMessage.isPending}
                className="rounded-full h-10 w-10 shrink-0 bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all"
              >
                {sendMessage.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5 ml-0.5" />
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
