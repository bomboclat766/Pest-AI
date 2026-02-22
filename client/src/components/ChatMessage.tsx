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
}

export function ChatMessage({ role, content = "", image }: ChatMessageProps) {
  const isUser = role === "user";
  const isError = role === "error";
  const safeContent = content || "";
  const [displayedContent, setDisplayedContent] = useState(isUser || isError ? safeContent : "");

  useEffect(() => {
    if (!isUser && !isError && safeContent) {
      let index = 0;
      const intervalId = setInterval(() => {
        setDisplayedContent(safeContent.slice(0, index + 1));
        index++;
        if (index >= safeContent.length) clearInterval(intervalId);
      }, 4); 
      return () => clearInterval(intervalId);
    }
    setDisplayedContent(safeContent);
  }, [safeContent, isUser, isError]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      className={cn("flex w-full gap-4 mb-10", isUser ? "flex-row-reverse" : "flex-row")}
    >
      <div className="relative flex-shrink-0 mt-1">
        {!isUser && !isError && (
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.1, 0.4] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="absolute inset-0 bg-[#4AB295] rounded-full blur-md"
          />
        )}
        <div className={cn(
          "relative w-9 h-9 rounded-full flex items-center justify-center shadow-sm z-10",
          isUser ? "bg-[#4AB295] text-white" : "bg-white border border-gray-100 text-[#4AB295]"
        )}>
          {isUser ? <User size={18} /> : isError ? <Info size={18} className="text-red-500" /> : <Bot size={18} />}
        </div>
      </div>

      <div className={cn("flex flex-col max-w-[85%]", isUser && "items-end")}>
        <div className={cn(
          "transition-all duration-500",
          isUser ? "bg-[#f0f4f9] px-5 py-3 rounded-[24px] text-gray-800 shadow-sm" : "text-gray-800 pt-1"
        )}>
          {isUser && image && (
            <div className="mb-3 overflow-hidden rounded-xl max-w-[280px] shadow-md border-2 border-white">
              <img src={image} alt="Pest" className="w-full object-cover" />
            </div>
          )}
          <div className="prose prose-emerald max-w-none assistant-response">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayedContent}</ReactMarkdown>
            {!isUser && !isError && displayedContent.length < safeContent.length && (
              <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="inline-block w-2 h-5 bg-[#4AB295] ml-1 translate-y-1"
              />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
