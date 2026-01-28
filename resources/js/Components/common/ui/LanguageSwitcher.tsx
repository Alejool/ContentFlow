import Button from "@/Components/common/Modern/Button";
import enFlag from "@/../assets/Icons/Flags/en.svg";
import esFlag from "@/../assets/Icons/Flags/es.svg";
import { usePage } from "@inertiajs/react";
import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

type Language = {
  code: string;
  name: string;
  flag: string;
};

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const { auth } = (usePage().props as any) || {};

  const languages: Language[] = useMemo(
    () => [
      { code: "en", name: "English", flag: enFlag },
      { code: "es", name: "Español", flag: esFlag },
    ],
    [],
  );

  const getBaseLang = (lang?: string) =>
    (lang || "").split("-")[0] || languages[0].code;

  const initialLangCode = getBaseLang(i18n.resolvedLanguage || i18n.language);

  const initialIndex = languages.findIndex((l) => l.code === initialLangCode);

  const [mainLang, setMainLang] = useState(
    languages[initialIndex] || languages[0],
  );
  const [secondaryLang, setSecondaryLang] = useState(
    languages[(initialIndex + 1) % languages.length],
  );
  const [isAnimating, setIsAnimating] = useState(false);

  /* ---- sync if language changes elsewhere ---- */
  useEffect(() => {
    const realLang = getBaseLang(i18n.language);
    if (realLang !== mainLang.code) {
      const newMain =
        languages.find((l) => l.code === realLang) || languages[0];
      const newSecondary =
        languages.find((l) => l.code !== realLang) || languages[1];

      setMainLang(newMain);
      setSecondaryLang(newSecondary);
    }
  }, [i18n.language]);

  const toggleLanguage = () => {
    if (isAnimating) return;

    setIsAnimating(true);

    // 🔥 swap visual real
    setTimeout(() => {
      setMainLang(secondaryLang);
      setSecondaryLang(mainLang);

      i18n.changeLanguage(secondaryLang.code).finally(() => {
        setIsAnimating(false);
      });
    }, 200);

    if (auth?.user) {
      axios
        .patch(route("settings.locale"), {
          locale: secondaryLang.code,
        })
        .catch(() => {
          console.warn("Locale persistence failed");
        });
    }
  };

  return (
    <Button
      onClick={toggleLanguage}
      buttonStyle="icon"
      rounded="lg"
      disabled={isAnimating}
      aria-label={`Switch language to ${secondaryLang.name}`}
      title={`Switch to ${secondaryLang.name}`}
      className="
        relative group
        min-w-[44px] min-h-[44px]
        border border-gray-200 dark:border-neutral-700
        hover:border-indigo-300
        hover:bg-gray-50 dark:hover:bg-neutral-800
        transition-all duration-300
      "
    >
      <div className="relative w-8 h-8">
        <div
          className={`
            absolute left-1/2 top-1/2
            -translate-x-1/2 -translate-y-1/2
            w-6 h-4 rounded-sm overflow-hidden shadow-sm
            transition-all duration-300 ease-out
            ${
              isAnimating
                ? "scale-75 opacity-60"
                : "scale-100 opacity-100 group-hover:scale-110"
            }
          `}
        >
          <img
            src={mainLang.flag}
            alt={mainLang.name}
            className="w-full h-full object-cover"
          />
        </div>

        <div
          className={`
            absolute bottom-0 right-0
            w-5 h-3.5 rounded-sm overflow-hidden shadow-sm
            bg-white dark:bg-neutral-900
            border border-gray-200 dark:border-neutral-700
            p-0.5
            transition-all duration-300 ease-out
            ${
              isAnimating
                ? "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 scale-100 opacity-100"
                : "scale-75 opacity-90"
            }
          `}
        >
          <img
            src={secondaryLang.flag}
            alt={secondaryLang.name}
            className="w-full h-full object-cover"
          />
        </div>

        <span
          className="
            absolute -top-1 -left-1
            text-[10px] text-indigo-500
            opacity-0 group-hover:opacity-100
            transition-opacity duration-300
          "
        >
          →
        </span>
      </div>
    </Button>
  );
}
