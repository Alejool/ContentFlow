import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

interface FloatingButtonProps {
  theme: "dark" | "light";
  onClick: () => void;
}

export default function FloatingButton({
  theme,
  onClick,
}: FloatingButtonProps) {
  const { t } = useTranslation();

  const getButtonBg = () => {
    return theme === "dark"
      ? "bg-gradient-to-r from-orange-600 to-orange-800 hover:from-orange-700 hover:to-orange-900"
      : "bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700";
  };

  return (
    <button
      onClick={onClick}
      className={`fixed bottom-6 right-6 w-14 h-14 ${getButtonBg()} text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-50 group`}
    >
      <Sparkles className="w-6 h-6 group-hover:scale-110 transition-transform" />
      <span
        className={`absolute right-full mr-3 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap ${
          theme === "dark"
            ? "bg-neutral-800 text-white border border-neutral-700"
            : "bg-gray-900 text-white"
        }`}
      >
        {t("aiAssistant.buttonLabel")}
      </span>

      {/* Efecto de pulso */}
      <div
        className={`absolute inset-0 rounded-full animate-ping ${
          theme === "dark" ? "bg-orange-600/30" : "bg-red-600/30"
        }`}
      ></div>
    </button>
  );
}
