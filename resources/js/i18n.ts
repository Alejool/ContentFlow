import axios from "axios";
import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import { z } from "zod";
import { makeZodErrorMap } from "./Utils/zodErrorMap";

import en from "./locales/en";
import es from "./locales/es";

// Configuración mejorada de detección de idioma
const languageDetectorOptions = {
  order: [
    "querystring",      // ?lng=es
    "cookie",           // cookie i18next
    "localStorage",     // localStorage i18nextLng
    "sessionStorage",   // sessionStorage i18nextLng
    "navigator",        // navegador del usuario
    "htmlTag",          // html lang attribute
    "path",             // /es/page
    "subdomain",        // es.domain.com
  ],
  lookupQuerystring: "lng",
  lookupCookie: "i18next",
  lookupLocalStorage: "i18nextLng",
  lookupSessionStorage: "i18nextLng",
  lookupFromPathIndex: 0,
  lookupFromSubdomainIndex: 0,
  caches: ["localStorage", "cookie"],
  excludeCacheFor: ["cimode"],
  cookieMinutes: 10080, // 7 días
  cookieDomain: window.location.hostname,
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
    },
    fallbackLng: "es",
    supportedLngs: ["en", "es"],
    load: "languageOnly",
    debug: false,
    interpolation: {
      escapeValue: false,
      // Formatos personalizados para interpolación
      format: (value, format, lng) => {
        if (format === "uppercase") return value.toUpperCase();
        if (format === "lowercase") return value.toLowerCase();
        if (format === "capitalize") {
          return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
        }
        return value;
      },
    },
    detection: languageDetectorOptions,
    // Reaccionar a cambios de idioma del navegador
    react: {
      useSuspense: false,
      bindI18n: "languageChanged loaded",
      bindI18nStore: "added removed",
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
