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

  const currentLanguage = languages.find((lang) => lang.code === currentLangCode) || languages[0];

  const nextLanguage = languages.find((lang) => lang.code !== currentLangCode) || languages[1];

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
      } catch (error) {}
    }
  };

  return (
    <button
      onClick={toggleLanguage}
      className="group relative min-w-[44px] overflow-hidden rounded-lg border border-gray-200 p-2 transition-all duration-300 hover:border-indigo-300 hover:bg-gray-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
      aria-label={`Switch to ${nextLanguage.code.toUpperCase()}`}
    >
      <div className="relative flex h-8 w-8 items-center justify-center">
        <div className="h-4 w-6 overflow-hidden rounded-sm shadow-sm transition-all duration-300 group-hover:scale-110">
          <img
            src={currentLanguage.flag}
            alt={currentLanguage.name}
            className="h-full w-full object-cover"
          />
        </div>

        <div
          className={`absolute -bottom-1 -right-1 h-3.5 w-5 overflow-hidden rounded-sm border border-gray-200 bg-white p-0.5 shadow-sm transition-all duration-300 dark:border-neutral-700 dark:bg-neutral-900 ${isAnimating ? "scale-0 opacity-0" : "scale-100 opacity-100"}`}
        >
          <img
            src={nextLanguage.flag}
            alt={nextLanguage.name}
            className="h-full w-full object-cover"
          />
        </div>

        <span className="absolute -left-1 -top-1 text-[10px] text-indigo-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          →
        </span>
      </div>
    </button>
  );
}
