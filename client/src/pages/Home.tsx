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
  const [messages, setMessages] = useState([{ id: "w", role: "assistant", content: "Hello! I'm MarwaBuddy, your friendly generalist peer. How can I help you today?" }]);
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
        history: messages.map(m => ({ role: m.role, content: m.content })),
      });

      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: result.response }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "error", content: "Sorry, I'm having trouble connecting right now. Please try again." }]);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Simple Header */}
      <header className="flex items-center justify-center py-4 px-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <h1 className="text-xl font-medium text-gray-900">MarwaBuddy</h1>
        </div>
      </header>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-3xl mx-auto space-y-6">
            <AnimatePresence mode="pop">
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

        {/* Input Area */}
        <div className="border-t border-gray-100 bg-white px-6 py-4">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSend} className="relative">
              <div className="flex items-center bg-gray-50 rounded-full border border-gray-200 px-4 py-3 focus-within:border-gray-300 focus-within:ring-1 focus-within:ring-gray-300 transition-all">
                <Plus size={18} className="text-gray-400 mr-3 flex-shrink-0" />
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask me anything..."
                  className="border-none bg-transparent focus-visible:ring-0 text-gray-900 placeholder:text-gray-500 flex-1"
                  disabled={sendMessage.isPending}
                />
                <Button
                  type="submit"
                  className="rounded-full bg-black hover:bg-gray-800 w-8 h-8 p-0 flex-shrink-0 ml-2 transition-colors disabled:opacity-50"
                  disabled={!inputValue.trim() || sendMessage.isPending}
                >
                  <Send size={16} className="text-white" />
                </Button>
              </div>
            </form>
            <p className="text-xs text-gray-500 text-center mt-3">
              MarwaBuddy can make mistakes. Check important info.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
