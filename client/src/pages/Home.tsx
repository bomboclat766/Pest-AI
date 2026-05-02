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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4 md:p-8 flex flex-col items-center">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-4xl flex justify-center items-center mb-8"
      >
        <div className="flex items-center gap-3 bg-white/90 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-lg border border-gray-200">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          >
            <div className="bg-black p-2 rounded-xl text-white shadow-md">
              <Sparkles size={24}/>
            </div>
          </motion.div>
          <h1 className="text-2xl font-bold text-black tracking-tight">MarwaBuddy</h1>
          <span className="text-sm text-gray-600 font-medium">Your friendly AI peer</span>
        </div>
      </motion.header>

      <motion.main
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full max-w-4xl bg-white/95 backdrop-blur-sm rounded-[2.5rem] shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
        style={{ height: "calc(100vh - 200px)", minHeight: "600px", maxHeight: "800px" }}
      >
        <motion.div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-thin scrollbar-thumb-black/20 scrollbar-track-transparent"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <AnimatePresence mode="pop">
            {messages.map((m, index) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.1,
                  ease: "easeOut"
                }}
              >
                <ChatMessage {...m} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        <motion.div
          className="p-6 border-t border-gray-200 bg-gray-50/50 backdrop-blur-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <form onSubmit={handleSend} className="bg-white rounded-2xl flex items-center px-6 py-4 border border-gray-200 shadow-inner">
            <Plus size={20} className="text-black mr-3 transition-transform hover:scale-110" />
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask me anything..."
              className="border-none bg-transparent focus-visible:ring-0 text-gray-900 placeholder:text-gray-500 text-lg"
              disabled={sendMessage.isPending}
            />
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                type="submit"
                className="rounded-xl bg-black hover:bg-gray-800 w-12 h-12 p-0 shadow-lg transition-all duration-200 disabled:opacity-50"
                disabled={!inputValue.trim() || sendMessage.isPending}
              >
                <Send size={20} className="text-white" />
              </Button>
            </motion.div>
          </form>
        </motion.div>
      </motion.main>
    </div>
  );
}
