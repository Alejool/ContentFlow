import { Brain, Maximize2, Minimize2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import Button from "@/Components/common/Modern/Button";

interface ChatHeaderProps {
  isMinimized: boolean;
  onMinimize: () => void;
  onClose: () => void;
}

export default function ChatHeader({
  isMinimized,
  onMinimize,
  onClose,
}: ChatHeaderProps) {
  const { t } = useTranslation();

  return (
    <div
      className="p-4 flex items-center justify-between text-white shrink-0 cursor-pointer transition-colors bg-gradient-to-r from-primary-600 to-primary-600 dark:from-primary-700 dark:to-primary-900"
      onClick={onMinimize}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-white/20 dark:bg-primary-800/40">
          <Brain className="w-5 h-5" />
        </div>
        <div>
          <span className="font-semibold">{t("aiAssistant.headerTitle")}</span>
          <p className="text-xs text-white/90 dark:text-primary-200/80">
            {t("aiAssistant.subtitle")}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onMinimize();
          }}
          variant="ghost"
          buttonStyle="ghost"
          className="!p-2 !rounded !transition-colors hover:!bg-white/20 dark:hover:!bg-primary-800/40 !shadow-none"
        >
          {isMinimized ? (
            <Maximize2 className="w-4 h-4" />
          ) : (
            <Minimize2 className="w-4 h-4" />
          )}
        </Button>
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          variant="ghost"
          buttonStyle="ghost"
          className="!p-2 !rounded !transition-colors hover:!bg-white/20 dark:hover:!bg-primary-800/40 !shadow-none"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
