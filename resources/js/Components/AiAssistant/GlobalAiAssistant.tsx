import { useTheme } from "@/Hooks/useTheme";
import { usePage } from "@inertiajs/react";
import axios from "axios";
import {
  Brain,
  Loader2,
  Maximize2,
  Minimize2,
  Send,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

interface Message {
  id: number;
  role: "assistant" | "user";
  content: string;
  suggestion?: {
    data: any;
  };
}

export default function GlobalAiAssistant() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { locale } = usePage().props as any;
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([
      {
        id: 1,
        role: "assistant",
        content: t("aiAssistant.welcomeMessage"),
      },
    ]);
  }, [t]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: inputValue,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      console.time("AI_Total_Roundtrip");
      console.time("AI_Network_Request");

      const response = await axios.post("/ai-chat/process", {
        message: userMessage.content,
        source: "assistant",
        context: {
          url: window.location.pathname,
          user_locale: locale || "en",
        },
      });

      console.timeEnd("AI_Network_Request");

      console.log("AI Response received", {
        size_bytes: JSON.stringify(response.data).length,
        server_processing_time: response.data.server_processing_time
      });

      console.time("AI_State_Update");

      if (response.data.success) {
        const aiMessage: Message = {
          id: Date.now() + 1,
          role: "assistant",
          content: response.data.message,
          suggestion: response.data.suggestion,
        };
        setMessages((prev) => [...prev, aiMessage]);
      }
      console.timeEnd("AI_State_Update");
      console.timeEnd("AI_Total_Roundtrip");
    } catch (error) {
      console.error("AI Chat Error:", error);
      toast.error(t("common.error"));
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: t("aiAssistant.error"),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Estilos según el tema
  const getButtonBg = () => {
    return theme === "dark"
      ? "bg-gradient-to-r from-primary-600 to-primary-800 hover:from-primary-700 hover:to-primary-900"
      : "bg-gradient-to-r from-primary-600 to-primary-600 hover:from-primary-700 hover:to-primary-700";
  };

  const getCardBg = () => {
    return theme === "dark"
      ? "bg-neutral-800/50 backdrop-blur-md border border-neutral-700/70"
      : "bg-white/10 border border-gray-200";
  };

  const getHeaderBg = () => {
    return theme === "dark"
      ? "bg-gradient-to-r from-primary-700 to-primary-900"
      : "bg-gradient-to-r from-primary-600 to-primary-600";
  };

  const getTextColor = (type: "primary" | "secondary" = "primary") => {
    if (theme === "dark") {
      return type === "primary" ? "text-gray-100" : "text-gray-400";
    } else {
      return type === "primary" ? "text-gray-800" : "text-gray-600";
    }
  };

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

  const getInputBg = () => {
    return theme === "dark"
      ? "bg-neutral-700/50 border border-neutral-600/50 text-gray-100 placeholder-gray-400 focus:border-primary-500 focus:ring-primary-500/20"
      : "bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-500 focus:border-primary-500 focus:ring-primary-500/20";
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 ${getButtonBg()} text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-50 group`}
      >
        <Sparkles className="w-6 h-6 group-hover:scale-110 transition-transform" />
        <span
          className={`absolute right-full mr-3 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap ${theme === "dark"
              ? "bg-neutral-800 text-white border border-neutral-700"
              : "bg-gray-900 text-white"
            }`}
        >
          {t("aiAssistant.buttonLabel")}
        </span>

        {/* Efecto de pulso */}
        <div
          className={`absolute inset-0 rounded-full animate-ping ${theme === "dark" ? "bg-primary-600/30" : "bg-primary-600/30"
            }`}
        ></div>
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-6 right-6 rounded-lg shadow-2xl overflow-hidden transition-all duration-300 z-50 flex flex-col backdrop-blur-2xl ${isMinimized ? "w-68 h-18" : "w-80 sm:w-96 h-[500px]"
        } `}
    >
      <div
        className={`p-4 flex items-center justify-between text-white shrink-0 cursor-pointer transition-colors ${getHeaderBg()}`}
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg ${theme === "dark" ? "bg-primary-800/40" : "bg-white/20"
              }`}
          >
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <span className="font-semibold">
              {t("aiAssistant.headerTitle")}
            </span>
            <p
              className={`text-xs ${theme === "dark" ? "text-primary-200/80" : "text-white/90"
                }`}
            >
              {t("aiAssistant.subtitle")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(!isMinimized);
            }}
            className={`p-2 rounded transition-colors 
              ${theme === "dark"
                ? "hover:bg-primary-800/40"
                : "hover:bg-white/20"
              }
              `}
          >
            {isMinimized ? (
              <Maximize2 className="w-4 h-4" />
            ) : (
              <Minimize2 className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
            className={`p-2 rounded transition-colors ${theme === "dark" ? "hover:bg-primary-800/40" : "hover:bg-white/20"
              }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages Container */}
          <div
            className={`flex-1 overflow-y-auto p-4 space-y-4 transition-colors`}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-3 shadow-sm transition-all duration-300 ${getMessageBg(
                    msg.role
                  )} ${msg.role === "user" ? "rounded-br-none" : "rounded-bl-none"
                    }`}
                >
                  <div className="text-sm leading-relaxed">{msg.content}</div>

                  {msg.suggestion && (
                    <div
                      className={`mt-3 pt-3 
                        ${theme === "dark"
                          ? "border-t border-neutral-600/50"
                          : "border-t border-gray-100"
                        }
                          `}
                    >
                      <div
                        className={`text-xs font-medium mb-1 uppercase tracking-wider ${theme === "dark"
                            ? "text-primary-400"
                            : "text-gray-500"
                          }`}
                      >
                        {t("aiAssistant.suggestion")}
                      </div>
                      <div
                        className={`rounded p-2 text-xs font-mono 
                          ${theme === "dark"
                            ? "bg-neutral-800/50 text-gray-300"
                            : "bg-gray-50 text-gray-600"
                          }
                            `}
                      >
                        {JSON.stringify(msg.suggestion.data, null, 2)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div
                  className={`rounded-lg rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-2 ${theme === "dark"
                      ? "bg-neutral-700/70 border border-neutral-600/50"
                      : "bg-white border border-gray-100"
                    }`}
                >
                  <Loader2
                    className={`w-4 h-4 animate-spin ${theme === "dark" ? "text-primary-400" : "text-primary-600"
                      }`}
                  />
                  <span
                    className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"
                      }`}
                  >
                    {t("aiAssistant.thinking")}
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Section */}
          <div
            className={`p-4 border-t transition-colors 
              ${theme === "dark"
                ? "bg-neutral-800/50 border-neutral-700/50"
                : "bg-white/90 border-gray-100"
              }
                `}
          >
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={t("aiAssistant.askPlaceholder")}
                className={`flex-1 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 transition-all text-sm ${getInputBg()}`}
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className={`p-3 rounded-lg transition-all duration-300 shadow-sm ${theme === "dark"
                    ? "bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    : "bg-gradient-to-r from-primary-600 to-primary-600 text-white hover:from-primary-700 hover:to-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            {/* Quick Tips */}
            <div
              className={`mt-3 text-xs flex items-center gap-1 ${theme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}
            >
              <Zap className="w-3 h-3" />
              <span>{t("aiAssistant.tips")}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
