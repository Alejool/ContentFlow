import axios from "axios";
import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import { z } from "zod";
import { makeZodErrorMap } from "./Utils/zodErrorMap";

import en from "./locales/en";
import es from "./locales/es";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
    },
    fallbackLng: "es", // Default to Spanish if language not detected/supported
    supportedLngs: ["en", "es"],
    load: "languageOnly",
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["navigator", "localStorage", "path", "subdomain"],
      caches: ["localStorage"],
      lookupLocalStorage: "i18nextLng",
    },
  });

// Set global Zod error map using a dynamic call to i18n.t
// this ensures it always uses the current language.
z.setErrorMap(
  makeZodErrorMap(((key: string, options: any) => i18n.t(key, options)) as any),
);

i18n.on("languageChanged", (lng) => {
  axios.defaults.headers.common["Accept-Language"] = lng;
});

// Set initial header
if (i18n.language) {
  axios.defaults.headers.common["Accept-Language"] = i18n.language;
}

export default i18n;
