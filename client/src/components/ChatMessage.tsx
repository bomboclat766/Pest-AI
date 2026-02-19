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
  isFallback?: boolean;
}

export function ChatMessage({ role, content, image, note, isFallback }: ChatMessageProps) {
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
      }, 5);
      return () => clearInterval(intervalId);
    } else {
      setDisplayedContent(content);
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
            ? "bg-[#4AB295] text-white" 
            : isError 
              ? "bg-red-500 text-white" 
              : "bg-white text-[#4AB295] border border-white/40 backdrop-blur-sm"
        )}
      >
        {isUser ? <User size={20} /> : isError ? <Info size={20} /> : <Bot size={20} />}
      </div>

      <div className={cn("flex flex-col max-w-[85%]", isUser && "items-end")}>
        <div
          className={cn(
            "px-6 py-4 rounded-[1.5rem] shadow-xl text-[1rem] leading-relaxed transition-all",
            isUser
              ? "bg-[#4AB295] text-white rounded-tr-none shadow-md"
              : isError
              ? "bg-red-50 text-red-600 border border-red-100 rounded-tl-none"
              : "bg-white/90 backdrop-blur-sm text-gray-700 border border-[#E8F0ED] rounded-tl-none assistant-response"
          )}
        >
          {/* Render image if present - Fixed tag closure */}
          {isUser && image && (
            <div className="mb-3 overflow-hidden rounded-xl border-2 border-white/20 shadow-md">
              <img 
                src={image} 
                alt="Uploaded pest" 
                className="max-h-72 w-full object-cover rounded-lg"
              />
            </div>
          )}

          {isUser || isError ? (
            <span className="whitespace-pre-wrap">{displayedContent}</span>
          ) : (
            <div className="prose prose-sm max-w-none prose-p:leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayedContent}</ReactMarkdown>
            </div>
          )}
        </div>

        {(note || isFallback) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-400 px-1"
          >
            <Info size={12} className="text-[#4AB295]/60" />
            <span>
              {note || (isFallback && "Using automated fallback response")}
            </span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
