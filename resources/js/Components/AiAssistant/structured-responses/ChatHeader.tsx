import { Brain, Maximize2, Minimize2, X } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ChatHeaderProps {
  theme: "dark" | "light";
  isMinimized: boolean;
  onMinimize: () => void;
  onClose: () => void;
}

export default function ChatHeader({
  theme,
  isMinimized,
  onMinimize,
  onClose,
}: ChatHeaderProps) {
  const { t } = useTranslation();

  const getHeaderBg = () => {
    return theme === "dark"
      ? "bg-gradient-to-r from-orange-700 to-orange-900"
      : "bg-gradient-to-r from-red-600 to-orange-600";
  };

  return (
    <div
      className={`p-4 flex items-center justify-between text-white shrink-0 cursor-pointer transition-colors ${getHeaderBg()}`}
      onClick={onMinimize}
    >
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded-lg ${
            theme === "dark" ? "bg-orange-800/40" : "bg-white/20"
          }`}
        >
          <Brain className="w-5 h-5" />
        </div>
        <div>
          <span className="font-semibold">{t("aiAssistant.headerTitle")}</span>
          <p
            className={`text-xs ${
              theme === "dark" ? "text-orange-200/80" : "text-white/90"
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
            onMinimize();
          }}
          className={`p-2 rounded transition-colors 
            ${theme === "dark" ? "hover:bg-orange-800/40" : "hover:bg-white/20"}
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
            onClose();
          }}
          className={`p-2 rounded transition-colors ${
            theme === "dark" ? "hover:bg-orange-800/40" : "hover:bg-white/20"
          }`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
