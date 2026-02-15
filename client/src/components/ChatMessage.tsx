import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Bot, User, Info } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState, useEffect } from "react";

interface ChatMessageProps {
  role: "user" | "assistant" | "error";
  content: string;
  note?: string;
  isFallback?: boolean;
}

export function ChatMessage({ role, content, note, isFallback }: ChatMessageProps) {
  const isUser = role === "user";
  const isError = role === "error";
  const [displayedContent, setDisplayedContent] = useState(isUser || isError ? content : "");

  useEffect(() => {
    if (!isUser && !isError && content) {
      let index = 0;
      const intervalId = setInterval(() => {
        setDisplayedContent(content.slice(0, index + 1));
        index++;
        if (index >= content.length) {
          clearInterval(intervalId);
        }
      }, 5); // Fast typing speed
      return () => clearInterval(intervalId);
    }
  }, [content, isUser, isError]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn(
        "flex w-full gap-4 mb-8",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div
        className={cn(
          "flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:scale-105",
          isUser 
            ? "bg-gradient-to-tr from-primary to-accent text-white" 
            : isError 
              ? "bg-destructive text-destructive-foreground" 
              : "bg-white text-primary border border-white/40 backdrop-blur-sm"
        )}
      >
        {isUser ? <User size={20} /> : isError ? <Info size={20} /> : <Bot size={20} />}
      </div>

      <div className={cn("flex flex-col max-w-[85%]", isUser && "items-end")}>
        <div
          className={cn(
            "px-6 py-4 rounded-[1.5rem] shadow-xl text-[1rem] leading-relaxed transition-all",
            isUser
              ? "bg-gradient-to-tr from-primary to-accent text-white rounded-tr-none shadow-primary/20"
              : isError
              ? "bg-destructive/10 text-destructive border border-destructive/20 rounded-tl-none"
              : "bg-white/90 backdrop-blur-sm text-gray-700 border border-white/60 rounded-tl-none assistant-response"
          )}
        >
          {isUser || isError ? (
            displayedContent
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayedContent}</ReactMarkdown>
          )}
        </div>

        {(note || isFallback) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground px-1"
          >
            <Info size={12} className="text-primary/60" />
            <span>
              {note || (isFallback && "Using automated fallback response")}
            </span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
