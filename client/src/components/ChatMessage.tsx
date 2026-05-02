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
    <div className={`flex gap-4 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
      {/* Avatar */}
      <div className="flex-shrink-0 mt-1">
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
          isUser ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"
        )}>
          {isUser ? "You" : "MB"}
        </div>
      </div>

      {/* Message Content */}
      <div className={`flex-1 ${isUser ? 'text-right' : 'text-left'}`}>
        <div className={cn(
          "inline-block px-4 py-2 rounded-2xl max-w-full",
          isUser
            ? "bg-blue-600 text-white"
            : isError
            ? "bg-red-50 text-red-800 border border-red-200"
            : "text-gray-900"
        )}>
          {isUser && image && (
            <div className="mb-2">
              <img src={image} alt="User uploaded image" className="max-w-xs rounded-lg" />
            </div>
          )}

          <div className="prose prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {displayedContent}
            </ReactMarkdown>
          </div>

          {!isUser && !isError && displayedContent.length < safeContent.length && (
            <span className="inline-block w-1 h-4 bg-gray-400 ml-1 animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
}
