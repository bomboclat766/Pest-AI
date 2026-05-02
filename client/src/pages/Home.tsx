"use client";

import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "@/components/ChatMessage";
import { useSendMessage } from "@/hooks/use-chat";
import { Send, Sparkles, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<Array<{ id: string; role: "user" | "assistant" | "error"; content: string }>>([{ id: "w", role: "assistant", content: "Hello! I'm MarwaBuddy, your friendly generalist peer. How can I help you today?" }]);
  const [inputValue, setInputValue] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const sendMessage = useSendMessage();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth"
      });
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
      const result = await sendMessage.mutateAsync({
        message: currentInput,
        liveOnly: false,
      });

      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: result.response }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "error", content: "Sorry, I'm having trouble connecting right now. Please try again." }]);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[var(--gemini-surface)] flex flex-col">
      {/* Gemini-style Header */}
      <header className="flex items-center justify-center py-6 px-6 border-b border-[var(--gemini-outline)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[var(--gemini-primary)] to-blue-600 rounded-full flex items-center justify-center shadow-sm">
            <Sparkles size={20} className="text-white" />
          </div>
          <h1 className="text-2xl font-medium text-[var(--gemini-on-surface)] tracking-tight">MarwaBuddy</h1>
        </div>
      </header>

      {/* Main Chat Area - Gemini inspired layout */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        {/* Messages Container */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-6 py-8"
          style={{ scrollbarGutter: 'stable' }}
        >
          <div className="max-w-3xl mx-auto space-y-8">
            <AnimatePresence mode="wait">
              {messages.map((m, index) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.05,
                    ease: "easeOut"
                  }}
                >
                  <ChatMessage {...m} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Input Area - Gemini inspired */}
        <div className="border-t border-[var(--gemini-outline)] bg-[var(--gemini-surface)] px-6 py-6">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSend} className="relative">
              <div className="flex items-center bg-[var(--gemini-surface-variant)] rounded-full border border-[var(--gemini-outline)] px-6 py-4 focus-within:border-[var(--gemini-primary)] focus-within:ring-1 focus-within:ring-[var(--gemini-primary)] transition-all shadow-sm">
                <Plus size={20} className="text-[var(--gemini-on-surface-variant)] mr-4 flex-shrink-0" />
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask me anything..."
                  className="border-none bg-transparent focus-visible:ring-0 text-[var(--gemini-on-surface)] placeholder:text-[var(--gemini-on-surface-variant)] flex-1 text-base"
                  disabled={sendMessage.isPending}
                />
                <Button
                  type="submit"
                  className="rounded-full bg-[var(--gemini-primary)] hover:bg-[var(--gemini-primary-hover)] w-10 h-10 p-0 flex-shrink-0 ml-4 transition-colors disabled:opacity-50 shadow-sm"
                  disabled={!inputValue.trim() || sendMessage.isPending}
                >
                  <Send size={18} className="text-white" />
                </Button>
              </div>
            </form>
            <p className="text-sm text-[var(--gemini-on-surface-variant)] text-center mt-4">
              MarwaBuddy can make mistakes. Check important info.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
