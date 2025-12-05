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
      ? "bg-neutral-700/50 border border-neutral-600/50 text-gray-100 placeholder-gray-400 focus:border-orange-500 focus:ring-orange-500/20"
      : "bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-500 focus:border-red-500 focus:ring-red-500/20";
  };

  return (
    <div
      className={`p-4 border-t ${
        theme === "dark"
          ? "bg-neutral-800/50 border-neutral-700/50"
          : "bg-white/90 border-gray-100"
      }`}
    >
      <form onSubmit={onSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder={t("aiAssistant.askPlaceholder")}
          className={`flex-1 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 transition-all text-sm ${getInputBg()}`}
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          className={`p-3 rounded-lg transition-all duration-300 shadow-sm ${
            theme === "dark"
              ? "bg-gradient-to-r from-orange-600 to-orange-700 text-white hover:from-orange-700 hover:to-orange-800 disabled:opacity-50 disabled:cursor-not-allowed"
              : "bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-700 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
          }`}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      <div
        className={`mt-3 text-xs flex items-center gap-1 ${
          theme === "dark" ? "text-gray-400" : "text-gray-500"
        }`}
      >
        <Zap className="w-3 h-3" />
        <span>{t("aiAssistant.tips")}</span>
      </div>
    </div>
  );
}
