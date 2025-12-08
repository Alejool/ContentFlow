import { AIMessage } from "@/Hooks/useAIChat";
import { Bot } from "lucide-react";
import StructuredResponseRenderer from "./StructuredResponseRenderer";

interface MessageBubbleProps {
  message: AIMessage;
  theme: "dark" | "light";
}

export default function MessageBubble({ message, theme }: MessageBubbleProps) {
  const getMessageBg = (role: "assistant" | "user") => {
    if (role === "user") {
      return theme === "dark"
        ? "bg-gradient-to-r from-purple-700 to-purple-800 text-white"
        : "bg-gradient-to-r from-primary-600 to-primary-600 text-white";
    } else {
      return theme === "dark"
        ? "bg-neutral-700/70 text-gray-100 border border-neutral-600/50"
        : "bg-white/80 text-gray-800 border border-gray-100";
    }
  };

  const renderContent = () => {
    if (message.role === "user") {
      return <div className="text-sm leading-relaxed">{message.content}</div>;
    }

    if (message.aiResponse) {
      return (
        <div className="space-y-4">
          {message.content && message.content.trim() && (
            <div className="text-sm leading-relaxed">{message.content}</div>
          )}

          <StructuredResponseRenderer
            aiResponse={message.aiResponse}
            theme={theme}
          />

          {message.aiResponse._metadata && (
            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-neutral-600/50">
              <div
                className={`flex items-center justify-between text-xs ${
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}
              >
                <span className="flex items-center gap-1">
                  <Bot className="w-3 h-3" />
                  {message.aiResponse._metadata.provider} •{" "}
                  {message.aiResponse._metadata.model}
                </span>
                <span>
                  {new Date(
                    message.aiResponse._metadata.timestamp
                  ).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          )}
        </div>
      );
    }

    return <div className="text-sm leading-relaxed">{message.content}</div>;
  };

  return (
    <div
      className={`max-w-[85%] rounded-lg px-4 py-3 shadow-sm ${
        message.role === "user" ? "rounded-br-none" : "rounded-bl-none"
      } ${getMessageBg(message.role)}`}
    >
      {renderContent()}
    </div>
  );
}
