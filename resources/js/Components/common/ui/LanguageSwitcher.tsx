import { usePage } from "@inertiajs/react";
import axios from "axios";
import { Globe, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const { auth } = usePage().props as any;
  const [isAnimating, setIsAnimating] = useState(false);

  const languages = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "es", name: "Español", flag: "🇪🇸" },
  ];

  const currentLanguage =
    languages.find((lang) => lang.code === i18n.language) || languages[0];

  const nextLanguage =
    languages.find((lang) => lang.code !== i18n.language) || languages[1];

  const toggleLanguage = async () => {
    if (isAnimating) return;

    setIsAnimating(true);
    const newLang = nextLanguage.code;

    setTimeout(() => {
      i18n.changeLanguage(newLang);
      setIsAnimating(false);
    }, 200);

    if (auth?.user) {
      try {
        await axios.patch(route("locale.update"), { locale: newLang });
      } catch (error) {
        console.error("Failed to save locale preference:", error);
      }
    }
  };


  return (
    <button
      onClick={toggleLanguage}
      className="relative p-2 rounded-lg hover:bg-gray-50 transition-all duration-300
        group overflow-hidden border border-gray-200 hover:border-indigo-300 min-w-[44px]"
      aria-label={`Switch to ${nextLanguage.code.toUpperCase()}`}
    >
      <div className="relative w-8 h-8 flex items-center justify-center">
        <span className="text-xl transition-all duration-300 group-hover:scale-110">
          {currentLanguage.flag}
        </span>

        <span className={`absolute -bottom-1 -right-1 text-sm transition-all duration-300
          bg-white rounded-full border border-gray-200 p-0.5
          ${isAnimating ? "scale-0 opacity-0" : "scale-100 opacity-100"}`}>
          {nextLanguage.flag}
        </span>

        <span className="absolute -top-1 -left-1 text-[10px] text-indigo-500 
          opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          →
        </span>
      </div>
    </button>
  );
}