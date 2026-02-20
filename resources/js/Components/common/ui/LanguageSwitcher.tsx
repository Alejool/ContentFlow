import enFlag from "@/../assets/Icons/Flags/en.svg";
import esFlag from "@/../assets/Icons/Flags/es.svg";
import { usePage } from "@inertiajs/react";
import axios from "axios";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const { auth } = (usePage().props as any) || {};
  const [isAnimating, setIsAnimating] = useState(false);

  const languages = [
    { code: "en", name: "English", flag: enFlag },
    { code: "es", name: "Español", flag: esFlag },
  ];

  const getBaseLang = (lang: string) => lang.split("-")[0];
  const currentLangCode = getBaseLang(i18n.resolvedLanguage || i18n.language);

  const currentLanguage =
    languages.find((lang) => lang.code === currentLangCode) || languages[0];

  const nextLanguage =
    languages.find((lang) => lang.code !== currentLangCode) || languages[1];

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
        await axios.patch(route("settings.locale"), { locale: newLang });
      } catch (error) {
        }
    }
  };

  return (
    <button
      onClick={toggleLanguage}
      className="relative p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-800 transition-all duration-300
        group overflow-hidden border border-gray-200 dark:border-neutral-700 hover:border-indigo-300 min-w-[44px]"
      aria-label={`Switch to ${nextLanguage.code.toUpperCase()}`}
    >
      <div className="relative w-8 h-8 flex items-center justify-center">
        <div className="w-6 h-4 transition-all duration-300 group-hover:scale-110 shadow-sm overflow-hidden rounded-sm">
          <img
            src={currentLanguage.flag}
            alt={currentLanguage.name}
            className="w-full h-full object-cover"
          />
        </div>

        <div
          className={`absolute -bottom-1 -right-1 w-5 h-3.5 transition-all duration-300
          bg-white dark:bg-neutral-900 rounded-sm border border-gray-200 dark:border-neutral-700 p-0.5 overflow-hidden shadow-sm
          ${isAnimating ? "scale-0 opacity-0" : "scale-100 opacity-100"}`}
        >
          <img
            src={nextLanguage.flag}
            alt={nextLanguage.name}
            className="w-full h-full object-cover"
          />
        </div>

        <span
          className="absolute -top-1 -left-1 text-[10px] text-indigo-500
          opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        >
          →
        </span>
      </div>
    </button>
  );
}
