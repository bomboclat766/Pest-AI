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
      }, 3);
      return () => clearInterval(intervalId);
    }
    setDisplayedContent(safeContent);
  }, [safeContent, isUser, isError]);

  return (
    <div className={`flex gap-6 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
      {/* Avatar - Gemini style */}
      <div className="flex-shrink-0 mt-1">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium shadow-sm",
          isUser
            ? "bg-[var(--gemini-primary)] text-white"
            : "bg-[var(--gemini-surface-variant)] text-[var(--gemini-on-surface)] border border-[var(--gemini-outline)]"
        )}>
          {isUser ? "You" : "MB"}
        </div>
      </div>

      {/* Message Content - Gemini inspired */}
      <div className={`flex-1 ${isUser ? 'text-right' : 'text-left'}`}>
        <div className={cn(
          "inline-block px-6 py-4 rounded-2xl max-w-full shadow-sm",
          isUser
            ? "bg-[var(--gemini-primary)] text-white"
            : isError
            ? "bg-red-50 text-red-800 border border-red-200"
            : "bg-[var(--gemini-surface)] text-[var(--gemini-on-surface)] border border-[var(--gemini-outline)]"
        )}>
          {isUser && image && (
            <div className="mb-3">
              <img src={image} alt="User uploaded image" className="max-w-xs rounded-lg shadow-sm" />
            </div>
          )}

          <div className="prose prose-sm max-w-none prose-headings:text-[var(--gemini-on-surface)] prose-p:text-[var(--gemini-on-surface)] prose-strong:text-[var(--gemini-on-surface)] prose-code:text-[var(--gemini-on-surface)] prose-pre:bg-[var(--gemini-surface-variant)] prose-pre:border prose-pre:border-[var(--gemini-outline)]">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {displayedContent}
            </ReactMarkdown>
          </div>

          {!isUser && !isError && displayedContent.length < safeContent.length && (
            <span className="inline-block w-1 h-5 bg-[var(--gemini-on-surface-variant)] ml-1 animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
}
