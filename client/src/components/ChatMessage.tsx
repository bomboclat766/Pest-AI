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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex w-full gap-3 mb-6",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm",
          isUser ? "bg-primary text-primary-foreground" : isError ? "bg-destructive text-destructive-foreground" : "bg-white text-primary border border-primary/20"
        )}
      >
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      <div className={cn("flex flex-col max-w-[80%]", isUser && "items-end")}>
        <div
          className={cn(
            "px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed",
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-none"
              : isError
              ? "bg-destructive/10 text-destructive border border-destructive/20 rounded-tl-none"
              : "bg-white text-gray-800 border border-gray-100 rounded-tl-none assistant-response"
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
