import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Bot, User, Info } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState, useEffect } from "react";

interface ChatMessageProps {
  role: "user" | "assistant" | "error";
  content: string;
  image?: string | null;
  note?: string;
}

export function ChatMessage({ role, content, image, note }: ChatMessageProps) {
  const isUser = role === "user";
  const isError = role === "error";
  const [displayedContent, setDisplayedContent] = useState(isUser || isError ? content : "");

  useEffect(() => {
    if (!isUser && !isError && content) {
      let index = 0;
      const intervalId = setInterval(() => {
        setDisplayedContent(content.slice(0, index + 1));
        index++;
        if (index >= content.length) clearInterval(intervalId);
      }, 2); // Faster typing for a snappier feel
      return () => clearInterval(intervalId);
    }
    setDisplayedContent(content);
  }, [content, isUser, isError]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex w-full gap-4 mb-10", isUser ? "flex-row-reverse" : "flex-row")}
    >
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1",
        isUser ? "bg-[#4AB295] text-white" : "bg-[#f0f4f9] text-[#4AB295]"
      )}>
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      <div className={cn("flex flex-col max-w-[85%]", isUser && "items-end")}>
        <div className={cn(
          "text-[1rem] leading-7 transition-all",
          isUser 
            ? "bg-[#f0f4f9] px-5 py-3 rounded-[24px] text-gray-800" 
            : "text-gray-800 pt-1" // AI has no bubble, just clean text
        )}>
          {isUser && image && (
            <div className="mb-3 overflow-hidden rounded-xl max-w-[240px]">
              <img src={image} alt="Upload" className="w-full object-cover" />
            </div>
          )}
          
          <div className="prose prose-emerald max-w-none prose-p:leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayedContent}</ReactMarkdown>
          </div>
        </div>
        
        {note && (
          <div className="mt-2 flex items-center gap-1 text-[11px] text-gray-400 italic">
            <Info size={10} /> {note}
          </div>
        )}
      </div>
    </motion.div>
  );
}
