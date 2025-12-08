import { useTheme } from "@/Hooks/useTheme";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Dialog } from "@headlessui/react";
import { Head, usePage } from "@inertiajs/react";
import {
  Brain,
  Camera,
  Leaf,
  Lightbulb,
  LucideIcon,
  MessageSquare,
  Send,
  Sparkles,
  User as UserIcon,
  Users,
  X,
  Zap,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

// Componente Avatar personalizado
interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

function Avatar({
  src,
  name = "User",
  size = "md",
  className = "",
}: AvatarProps) {
  const { theme } = useTheme();

  const getInitials = (name: string) => {
    if (!name.trim()) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-lg",
  };

  const avatarBgClass =
    theme === "dark"
      ? "bg-gradient-to-br from-primary-900/30 to-purple-900/30"
      : "bg-gradient-to-br from-primary-100 to-purple-100";

  const avatarTextClass =
    theme === "dark" ? "text-primary-200" : "text-primary-800";

  return (
    <div
      className={`${sizeClasses[size]} ${avatarBgClass} ${className} rounded-full overflow-hidden flex items-center justify-center font-bold shadow-lg`}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
            const fallback = document.createElement("div");
            fallback.className = `w-full h-full flex items-center justify-center ${avatarTextClass}`;
            fallback.textContent = getInitials(name);
            e.currentTarget.parentElement?.appendChild(fallback);
          }}
        />
      ) : (
        <div
          className={`w-full h-full flex items-center justify-center ${avatarTextClass}`}
        >
          {getInitials(name)}
        </div>
      )}
    </div>
  );
}

// Componente de mensaje de chat
interface Message {
  id: number;
  sender: string;
  message: string;
  timestamp: string;
}

interface User {
  name?: string;
  photo_url?: string;
  [key: string]: any;
}

const ChatMessage = ({
  message,
  user,
  theme,
}: {
  message: Message;
  user: User;
  theme: "dark" | "light";
}) => {
  const isAI = message.sender === "AI";

  return (
    <div className={`flex gap-3 p-2 ${isAI ? "flex-row" : "flex-row-reverse"}`}>
      <div className="flex-shrink-0">
        <Avatar
          src={isAI ? null : user.photo_url}
          name={isAI ? "AI" : user.name}
          size="md"
          className={
            isAI
              ? theme === "dark"
                ? "bg-gradient-to-br from-primary-600 to-primary-800"
                : "bg-gradient-to-br from-primary-500 to-primary-700"
              : theme === "dark"
              ? "bg-gradient-to-br from-purple-600 to-purple-800"
              : "bg-gradient-to-br from-purple-500 to-purple-700"
          }
        />
      </div>

      <div
        className={`max-w-[80%] rounded-2xl shadow-sm border px-4 py-3
        ${
          isAI
            ? theme === "dark"
              ? "bg-neutral-800 border-neutral-700"
              : "bg-white border-gray-100"
            : theme === "dark"
            ? "bg-purple-900/30 border-purple-800/30"
            : "bg-primary-50 border-primary-100"
        }`}
      >
        <p
          className={`text-sm leading-relaxed ${
            theme === "dark" ? "text-gray-100" : "text-gray-700"
          }`}
        >
          {message.message}
        </p>
        <p
          className={`text-xs mt-1 ${
            theme === "dark" ? "text-gray-400" : "text-gray-500"
          }`}
        >
          {message.timestamp}
        </p>
      </div>
    </div>
  );
};

// Estadísticas compactas
interface Campaign {
  status: string;
  [key: string]: any;
}

const CompactStats = ({
  campaigns,
  theme,
}: {
  campaigns: Campaign[];
  theme: "dark" | "light";
}) => {
  const { t } = useTranslation();
  const active = campaigns.filter((c) => c.status === "active").length;
  const total = campaigns.length;

  return (
    <div className="flex gap-6">
      <div className="text-center">
        <p
          className={`text-lg font-bold ${
            theme === "dark" ? "text-primary-400" : "text-primary-600"
          }`}
        >
          {active}
        </p>
        <p
          className={`text-xs ${
            theme === "dark" ? "text-gray-400" : "text-gray-500"
          }`}
        >
          {t("aiChat.stats.active")}
        </p>
      </div>
      <div className="text-center">
        <p
          className={`text-lg font-bold ${
            theme === "dark" ? "text-blue-400" : "text-blue-600"
          }`}
        >
          {total}
        </p>
        <p
          className={`text-xs ${
            theme === "dark" ? "text-gray-400" : "text-gray-500"
          }`}
        >
          {t("aiChat.stats.total")}
        </p>
      </div>
    </div>
  );
};

// Tarjeta de idea
interface Idea {
  id: number;
  titleKey: string;
  descriptionKey: string;
  icon: LucideIcon;
}

const IdeaCard = ({
  idea,
  onUse,
  theme,
}: {
  idea: Idea;
  onUse: (idea: Idea) => void;
  theme: "dark" | "light";
}) => {
  const { t } = useTranslation();

  return (
    <button
      onClick={() => onUse(idea)}
      className={`w-full text-left p-4 rounded-lg transition-all duration-200 hover:transform hover:-translate-y-0.5
        ${theme === "dark" ? "hover:bg-neutral-800" : "hover:bg-primary-50"}`}
    >
      <div className="flex items-start gap-3">
        <idea.icon
          className={`h-5 w-5 flex-shrink-0 ${
            theme === "dark" ? "text-primary-400" : "text-primary-600"
          }`}
        />
        <div className="flex-1">
          <p
            className={`text-sm font-semibold mb-1 ${
              theme === "dark" ? "text-gray-100" : "text-gray-800"
            }`}
          >
            {t(idea.titleKey)}
          </p>
          <p
            className={`text-xs ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            } leading-relaxed`}
          >
            {t(idea.descriptionKey)}
          </p>
        </div>
      </div>
    </button>
  );
};

// Panel de ideas
const IdeasPanel = ({
  ideas,
  onUse,
  theme,
}: {
  ideas: Idea[];
  onUse: (idea: Idea) => void;
  theme: "dark" | "light";
}) => {
  const { t } = useTranslation();

  return (
    <div
      className={`rounded-xl shadow-sm border transition-colors duration-300 ${
        theme === "dark"
          ? "bg-neutral-800/50 border-neutral-700/50"
          : "bg-white border-gray-100"
      }`}
    >
      <div className="p-5">
        <div className="flex items-center gap-3 mb-5">
          <div
            className={`p-2 rounded-lg ${
              theme === "dark"
                ? "bg-primary-900/20 text-primary-400"
                : "bg-primary-100 text-primary-600"
            }`}
          >
            <Lightbulb className="w-5 h-5" />
          </div>
          <h3
            className={`text-lg font-semibold ${
              theme === "dark" ? "text-gray-100" : "text-gray-800"
            }`}
          >
            {t("aiChat.ideas.title")}
          </h3>
        </div>

        <div className="space-y-2">
          {ideas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} onUse={onUse} theme={theme} />
          ))}
        </div>
      </div>
    </div>
  );
};

// Drawer móvil de ideas
const MobileIdeasDrawer = ({
  isOpen,
  onClose,
  ideas,
  onUse,
  theme,
}: {
  isOpen: boolean;
  onClose: () => void;
  ideas: Idea[];
  onUse: (idea: Idea) => void;
  theme: "dark" | "light";
}) => {
  const { t } = useTranslation();

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        aria-hidden="true"
      />

      <div className="fixed inset-0 flex items-end justify-center p-4">
        <Dialog.Panel
          className={`w-full max-w-2xl rounded-t-2xl shadow-2xl ${
            theme === "dark" ? "bg-neutral-900" : "bg-white"
          } max-h-[80vh] overflow-hidden`}
        >
          <div
            className={`p-4 border-b ${
              theme === "dark" ? "border-neutral-700" : "border-gray-100"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lightbulb
                  className={`h-4 w-4 ${
                    theme === "dark" ? "text-primary-400" : "text-primary-600"
                  }`}
                />
                <Dialog.Title
                  className={`font-semibold ${
                    theme === "dark" ? "text-gray-100" : "text-gray-800"
                  }`}
                >
                  {t("aiChat.ideas.panelTitle")}
                </Dialog.Title>
              </div>
              <button
                onClick={onClose}
                className={`p-1 rounded-lg ${
                  theme === "dark"
                    ? "hover:bg-neutral-800 text-gray-400"
                    : "hover:bg-gray-100 text-gray-500"
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
            <div className="space-y-2">
              {ideas.map((idea) => (
                <IdeaCard
                  key={idea.id}
                  idea={idea}
                  onUse={(idea) => {
                    onUse(idea);
                    onClose();
                  }}
                  theme={theme}
                />
              ))}
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

// Componente Badge personalizado
interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "outline" | "subtle";
  colorScheme?: "orange" | "red" | "green" | "blue";
  className?: string;
}

function Badge({
  children,
  variant = "default",
  colorScheme = "orange",
  className = "",
}: BadgeProps) {
  const { theme } = useTheme();

  const colorClasses = {
    orange:
      theme === "dark"
        ? "bg-primary-900/30 text-primary-300 border-primary-800/50"
        : "bg-primary-100 text-primary-800 border-primary-200",
    red:
      theme === "dark"
        ? "bg-primary-900/30 text-primary-300 border-primary-800/50"
        : "bg-primary-100 text-primary-800 border-primary-200",
    green:
      theme === "dark"
        ? "bg-green-900/30 text-green-300 border-green-800/50"
        : "bg-green-100 text-green-800 border-green-200",
    blue:
      theme === "dark"
        ? "bg-blue-900/30 text-blue-300 border-blue-800/50"
        : "bg-blue-100 text-blue-800 border-blue-200",
  };

  const variantClasses = {
    default: "px-3 py-1 rounded-full text-xs font-medium border",
    outline: "px-3 py-1 rounded-full text-xs font-medium border",
    subtle: "px-3 py-1 rounded-full text-xs font-medium border",
  };

  return (
    <span
      className={`${variantClasses[variant]} ${colorClasses[colorScheme]} ${className} inline-flex items-center gap-1`}
    >
      {children}
    </span>
  );
}

// Componente principal
export default function Index() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const user = (usePage().props as any).auth.user || {};

  // Estado simulado para el chat (reemplaza con useAIChat)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: "AI",
      message: t("aiChat.welcomeMessage"),
      timestamp: "Just now",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [campaigns] = useState<Campaign[]>([]);
  const [isIdeasDrawerOpen, setIsIdeasDrawerOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const newMessage: Message = {
      id: messages.length + 1,
      sender: "User",
      message: inputMessage,
      timestamp: "Just now",
    };

    setMessages([...messages, newMessage]);
    setInputMessage("");
    setLoading(true);

    // Simular respuesta de AI
    setTimeout(() => {
      const aiResponse: Message = {
        id: messages.length + 2,
        sender: "AI",
        message: `Gracias por tu mensaje: "${inputMessage}". Como asistente de IA, puedo ayudarte con estrategias de marketing, ideas de contenido y análisis de campañas. ¿En qué más puedo asistirte?`,
        timestamp: "Just now",
      };
      setMessages((prev) => [...prev, aiResponse]);
      setLoading(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const [ideas] = useState<Idea[]>([
    {
      id: 1,
      titleKey: "aiChat.ideas.visualMarketing.title",
      descriptionKey: "aiChat.ideas.visualMarketing.description",
      icon: Camera,
    },
    {
      id: 2,
      titleKey: "aiChat.ideas.sustainability.title",
      descriptionKey: "aiChat.ideas.sustainability.description",
      icon: Leaf,
    },
    {
      id: 3,
      titleKey: "aiChat.ideas.microInfluencers.title",
      descriptionKey: "aiChat.ideas.microInfluencers.description",
      icon: Users,
    },
    {
      id: 4,
      titleKey: "aiChat.ideas.ugcContent.title",
      descriptionKey: "aiChat.ideas.ugcContent.description",
      icon: UserIcon,
    },
    {
      id: 5,
      titleKey: "aiChat.ideas.viralContent.title",
      descriptionKey: "aiChat.ideas.viralContent.description",
      icon: Zap,
    },
    {
      id: 6,
      titleKey: "aiChat.ideas.copywriting.title",
      descriptionKey: "aiChat.ideas.copywriting.description",
      icon: MessageSquare,
    },
  ]);

  const useIdeaAsPrompt = (idea: Idea) => {
    const prompt = `${t("aiChat.promptPrefix")} ${t(idea.titleKey)}`;
    setInputMessage(prompt);
  };

  // Clases de utilidad
  const getBgColor = () => (theme === "dark" ? "bg-neutral-900" : "bg-gray-50");
  const getTextColor = (type: "primary" | "secondary" = "primary") => {
    if (theme === "dark") {
      return type === "primary" ? "text-gray-100" : "text-gray-400";
    } else {
      return type === "primary" ? "text-gray-800" : "text-gray-600";
    }
  };
  const getBorderColor = () =>
    theme === "dark" ? "border-neutral-700/50" : "border-gray-100";
  const getCardBg = () => (theme === "dark" ? "bg-neutral-800/50" : "bg-white");

  return (
    <AuthenticatedLayout>
      <Head title={t("aiChat.title")} />

      <div
        className={`min-h-screen transition-colors duration-300 mt-8 ${getBgColor()}`}
      >
        <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6">
          <div className="space-y-6 mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h1
                  className={`text-3xl md:text-5xl font-bold my-6 text-center bg-gradient-to-r ${
                    theme === "dark"
                      ? "from-primary-500 to-primary-700"
                      : "from-primary-500 to-primary-700"
                  } bg-clip-text text-transparent`}
                >
                  {t("aiChat.title")}
                </h1>
                <p className={`mt-2 text-lg ${getTextColor("secondary")}`}>
                  {t("aiChat.subtitle")}
                </p>
              </div>

              <div className="flex items-center gap-4">
                {campaigns.length > 0 && (
                  <div
                    className={`px-4 py-3 rounded-lg shadow-sm border ${getBorderColor()} ${getCardBg()}`}
                  >
                    <CompactStats campaigns={campaigns} theme={theme} />
                  </div>
                )}

                <button
                  onClick={() => setIsIdeasDrawerOpen(true)}
                  className={`p-2 rounded-xl border lg:hidden ${
                    theme === "dark"
                      ? "border-primary-800 text-primary-400 hover:bg-primary-900/20"
                      : "border-primary-200 text-primary-600 hover:bg-primary-50"
                  }`}
                >
                  <Lightbulb className="w-5 h-5" />
                </button>
              </div>
            </div>

            {campaigns.length > 0 && (
              <Badge
                colorScheme={theme === "dark" ? "orange" : "red"}
                className="self-start"
              >
                {campaigns.length} {t("aiChat.campaignsAvailable")}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6">
            {/* Chat Panel */}
            <div
              className={`rounded-xl shadow-sm border transition-colors duration-300 ${getCardBg()} ${getBorderColor()}`}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        theme === "dark"
                          ? "bg-primary-900/20 text-primary-400"
                          : "bg-primary-100 text-primary-600"
                      }`}
                    >
                      <Brain className="w-5 h-5" />
                    </div>
                    <h2
                      className={`text-xl font-semibold ${getTextColor(
                        "primary"
                      )}`}
                    >
                      {t("aiChat.chatTitle")}
                    </h2>
                  </div>
                  <Badge colorScheme="green">
                    <Sparkles className="inline h-3 w-3 mr-1" />
                    {t("aiChat.online")}
                  </Badge>
                </div>

                {/* Mensajes del chat */}
                <div className="h-[400px] px-2 overflow-y-auto mb-6 scrollbar-thin scrollbar-thumb-primary-500 scrollbar-track-gray-100 dark:scrollbar-track-neutral-700">
                  <div className="space-y-4 py-1">
                    {messages.length === 0 && (
                      <div className="text-center py-8">
                        <p className={`text-sm ${getTextColor("secondary")}`}>
                          {t("aiChat.welcomeMessage")}
                        </p>
                      </div>
                    )}

                    {messages.map((msg) => (
                      <ChatMessage
                        key={msg.id}
                        message={msg}
                        user={user}
                        theme={theme}
                      />
                    ))}

                    {loading && (
                      <div className="flex gap-3 items-center">
                        <Avatar
                          src={null}
                          name="AI"
                          size="md"
                          className={
                            theme === "dark"
                              ? "bg-gradient-to-br from-primary-600 to-primary-800"
                              : "bg-gradient-to-br from-primary-500 to-primary-700"
                          }
                        />
                        <div
                          className={`px-4 py-3 rounded-lg shadow-sm border ${getBorderColor()} ${getCardBg()}`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-4 h-4 rounded-full border-2 ${
                                theme === "dark"
                                  ? "border-primary-400 border-t-transparent"
                                  : "border-primary-500 border-t-transparent"
                              } animate-spin`}
                            ></div>
                            <p
                              className={`text-sm ${getTextColor("secondary")}`}
                            >
                              {t("aiChat.thinking")}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Separador */}
                <hr
                  className={`mb-6 ${
                    theme === "dark" ? "border-neutral-700" : "border-gray-200"
                  }`}
                />

                {/* Input del chat */}
                <div className="space-y-3">
                  <textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder={t("aiChat.inputPlaceholder")}
                    className={`w-full border rounded-xl p-4 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-1 resize-none
                      ${
                        theme === "dark"
                          ? "bg-neutral-800 border-neutral-700 text-gray-100 placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500"
                          : "bg-white border-gray-200 text-gray-900 placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500"
                      }`}
                    rows={3}
                  />
                  <div className="flex justify-between items-center">
                    <p className={`text-xs ${getTextColor("secondary")}`}>
                      {t("aiChat.enterToSend")}
                    </p>
                    <button
                      onClick={handleSendMessage}
                      disabled={loading || !inputMessage.trim()}
                      className={`px-4 py-2 rounded-xl min-w-[100px] flex items-center justify-center gap-2 transition-all duration-300
                        ${
                          loading || !inputMessage.trim()
                            ? theme === "dark"
                              ? "bg-neutral-700 text-gray-400 cursor-not-allowed"
                              : "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : theme === "dark"
                            ? "bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white"
                            : "bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white"
                        }`}
                    >
                      <Send className="w-4 h-4" />
                      {t("aiChat.send")}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel de ideas (desktop) */}
            <div className="hidden lg:block">
              <IdeasPanel ideas={ideas} onUse={useIdeaAsPrompt} theme={theme} />
            </div>
          </div>

          {/* Drawer móvil de ideas */}
          <MobileIdeasDrawer
            isOpen={isIdeasDrawerOpen}
            onClose={() => setIsIdeasDrawerOpen(false)}
            ideas={ideas}
            onUse={useIdeaAsPrompt}
            theme={theme}
          />
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
