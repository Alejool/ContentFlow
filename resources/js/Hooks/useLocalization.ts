import { useTranslation } from "react-i18next";
import { useCallback, useMemo } from "react";
import {
  formatDate,
  formatNumber,
  formatCurrency,
  formatPercent,
  formatCompactNumber,
  formatRelativeTime,
  formatList,
  pluralize,
  getUserTimezone,
} from "@/Utils/i18nHelpers";

/**
 * Hook personalizado para localización con utilidades adicionales
 */
export const useLocalization = () => {
  const { t, i18n } = useTranslation();

  const currentLanguage = i18n.language;
  const timezone = useMemo(() => getUserTimezone(), []);

  const changeLanguage = useCallback(
    async (lng: string) => {
      await i18n.changeLanguage(lng);
      // Persistir en el backend si el usuario está autenticado
      try {
        await fetch("/api/user/locale", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": document
              .querySelector('meta[name="csrf-token"]')
              ?.getAttribute("content") || "",
          },
          body: JSON.stringify({ locale: lng }),
        });
      } catch (error) {
        console.error("Error updating user locale:", error);
      }
    },
    [i18n]
  );

  // Funciones de formateo con el idioma actual
  const formatters = useMemo(
    () => ({
      date: (date: Date | string | number, format?: any) =>
        formatDate(date, format, currentLanguage),
      number: (value: number, options?: Intl.NumberFormatOptions) =>
        formatNumber(value, options, currentLanguage),
      currency: (amount: number, currency?: string) =>
        formatCurrency(amount, currency, currentLanguage),
      percent: (value: number, decimals?: number) =>
        formatPercent(value, decimals, currentLanguage),
      compact: (value: number) => formatCompactNumber(value, currentLanguage),
      relative: (date: Date | string | number) =>
        formatRelativeTime(date, currentLanguage),
      list: (items: string[], type?: "conjunction" | "disjunction") =>
        formatList(items, type, currentLanguage),
      plural: (count: number, singular: string, plural?: string) =>
        pluralize(count, singular, plural, currentLanguage),
    }),
    [currentLanguage]
  );

  return {
    t,
    i18n,
    currentLanguage,
    timezone,
    changeLanguage,
    ...formatters,
  };
};
