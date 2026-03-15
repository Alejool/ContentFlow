import { Brain, Maximize2, Minimize2, X } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ChatHeaderProps {
  isMinimized: boolean;
  onMinimize: () => void;
  onClose: () => void;
}

export default function ChatHeader({ isMinimized, onMinimize, onClose }: ChatHeaderProps) {
  const { t } = useTranslation();

  return (
    <div
      className="flex shrink-0 cursor-pointer items-center justify-between bg-gradient-to-r from-primary-600 to-primary-600 p-4 text-white transition-colors dark:from-primary-700 dark:to-primary-900"
      onClick={onMinimize}
    >
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-white/20 p-2 dark:bg-primary-800/40">
          <Brain className="h-5 w-5" />
        </div>
        <div>
          <span className="font-semibold">{t("aiAssistant.headerTitle")}</span>
          <p className="text-xs text-white/90 dark:text-primary-200/80">
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
          className="rounded p-2 transition-colors hover:bg-white/20 dark:hover:bg-primary-800/40"
        >
          {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="rounded p-2 transition-colors hover:bg-white/20 dark:hover:bg-primary-800/40"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
