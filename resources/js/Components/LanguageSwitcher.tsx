import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import axios from "axios";
import { usePage } from "@inertiajs/react";
import { useState } from "react";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const { auth } = usePage().props as any;
  const [isAnimating, setIsAnimating] = useState(false);

  const languages = [
    { code: "en", flag: "🇺🇸" },
    { code: "es", flag: "🇪🇸" },
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
      className="relative p-2  rounded-lg hover:bg-gradient-to-br text-gray-400 hover:text-white
        hover:to-indigo-800 transition-all duration-500 group overflow-hidden"
      aria-label="Toggle language"
      title={`Switch to ${nextLanguage.code.toUpperCase()}`}
    >
      <div className="absolute inset-0  transition-all duration-700" />

      <div className="relative flex items-center gap-2 ">
        <div
          className="relative w-10 h-10  
          flex items-center justify-center  transition-all duration-500"
        >
          <Globe className="w-7 h-7   transition-transform duration-500 group-hover:rotate-180" />
          <div
            className={`absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-sm rounded-full  
              border border-gray-200 bg-secondary-20 shadow-sm transition-all duration-300 ${
                isAnimating ? "scale-0 rotate-90" : "scale-100"
              }`}
          >
            {nextLanguage.flag}
          </div>
        </div>
      </div>
    </button>
  );
}
