import { Send, Zap } from "lucide-react";
import { FormEvent } from "react";
import { useTranslation } from "react-i18next";

interface ChatInputProps {
  theme: "dark" | "light";
  inputValue: string;
  isLoading: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
}

export default function ChatInput({
  theme,
  inputValue,
  isLoading,
  onInputChange,
  onSubmit,
}: ChatInputProps) {
  const { t } = useTranslation();

  const getInputBg = () => {
    return theme === "dark"
      ? "bg-neutral-700/50 border border-neutral-600/50 text-gray-100 placeholder-gray-400 focus:border-primary-500 focus:ring-primary-500/20"
      : "bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-500 focus:border-primary-500 focus:ring-primary-500/20";
  };

  return (
    <div
      className={`border-t p-4 ${
        theme === "dark" ? "border-neutral-700/50 bg-neutral-800/50" : "border-gray-100 bg-white/90"
      }`}
    >
      <form onSubmit={onSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder={t("aiAssistant.askPlaceholder")}
          className={`flex-1 rounded-lg px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 ${getInputBg()}`}
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          className={`rounded-lg p-3 shadow-sm transition-all duration-300 ${
            theme === "dark"
              ? "bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 disabled:cursor-not-allowed disabled:opacity-50"
              : "bg-gradient-to-r from-primary-600 to-primary-600 text-white hover:from-primary-700 hover:to-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          }`}
        >
          <Send className="h-4 w-4" />
        </button>
      </form>

      <div
        className={`mt-3 flex items-center gap-1 text-xs ${
          theme === "dark" ? "text-gray-400" : "text-gray-500"
        }`}
      >
        <Zap className="h-3 w-3" />
        <span>{t("aiAssistant.tips")}</span>
      </div>
    </div>
  );
}
