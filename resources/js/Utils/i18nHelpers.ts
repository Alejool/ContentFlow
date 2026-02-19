import i18n from "i18next";

/**
 * Configuración de formatos de fecha/hora por idioma
 */
export const dateTimeFormats: Record<string, Intl.DateTimeFormatOptions> = {
  short: {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  },
  medium: {
    year: "numeric",
    month: "short",
    day: "numeric",
  },
  long: {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  },
  time: {
    hour: "2-digit",
    minute: "2-digit",
  },
  datetime: {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  },
  full: {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  },
};

/**
 * Formatea una fecha según el idioma actual
 */
export const formatDate = (
  date: Date | string | number,
  format: keyof typeof dateTimeFormats = "medium",
  locale?: string
): string => {
  const dateObj = typeof date === "string" || typeof date === "number" 
    ? new Date(date) 
    : date;
  
  const currentLocale = locale || i18n.language || "es";
  
  return new Intl.DateTimeFormat(currentLocale, dateTimeFormats[format]).format(
    dateObj
  );
};

/**
 * Formatea un número según el idioma actual
 */
export const formatNumber = (
  value: number,
  options?: Intl.NumberFormatOptions,
  locale?: string
): string => {
  const currentLocale = locale || i18n.language || "es";
  return new Intl.NumberFormat(currentLocale, options).format(value);
};

/**
 * Formatea una moneda según el idioma y región
 */
export const formatCurrency = (
  amount: number,
  currency: string = "USD",
  locale?: string
): string => {
  const currentLocale = locale || i18n.language || "es";
  
  return new Intl.NumberFormat(currentLocale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Formatea un porcentaje según el idioma actual
 */
export const formatPercent = (
  value: number,
  decimals: number = 1,
  locale?: string
): string => {
  const currentLocale = locale || i18n.language || "es";
  
  return new Intl.NumberFormat(currentLocale, {
    style: "percent",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
};

/**
 * Formatea números grandes con abreviaciones (K, M, B)
 */
export const formatCompactNumber = (
  value: number,
  locale?: string
): string => {
  const currentLocale = locale || i18n.language || "es";
  
  return new Intl.NumberFormat(currentLocale, {
    notation: "compact",
    compactDisplay: "short",
  }).format(value);
};

/**
 * Formatea una fecha relativa (hace 2 horas, en 3 días)
 */
export const formatRelativeTime = (
  date: Date | string | number,
  locale?: string
): string => {
  const dateObj = typeof date === "string" || typeof date === "number"
    ? new Date(date)
    : date;
  
  const currentLocale = locale || i18n.language || "es";
  const now = new Date();
  const diffInSeconds = Math.floor((dateObj.getTime() - now.getTime()) / 1000);
  
  const rtf = new Intl.RelativeTimeFormat(currentLocale, { numeric: "auto" });
  
  const units: { unit: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
    { unit: "year", seconds: 31536000 },
    { unit: "month", seconds: 2592000 },
    { unit: "week", seconds: 604800 },
    { unit: "day", seconds: 86400 },
    { unit: "hour", seconds: 3600 },
    { unit: "minute", seconds: 60 },
    { unit: "second", seconds: 1 },
  ];
  
  for (const { unit, seconds } of units) {
    const value = Math.floor(diffInSeconds / seconds);
    if (Math.abs(value) >= 1) {
      return rtf.format(value, unit);
    }
  }
  
  return rtf.format(0, "second");
};

/**
 * Obtiene la configuración regional del navegador
 */
export const getBrowserLocale = (): string => {
  const browserLang = navigator.language || (navigator as any).userLanguage;
  return browserLang.split("-")[0]; // 'es-ES' -> 'es'
};

/**
 * Detecta la zona horaria del usuario
 */
export const getUserTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

/**
 * Formatea una lista según el idioma (a, b y c)
 */
export const formatList = (
  items: string[],
  type: "conjunction" | "disjunction" = "conjunction",
  locale?: string
): string => {
  const currentLocale = locale || i18n.language || "es";
  
  return new Intl.ListFormat(currentLocale, {
    style: "long",
    type,
  }).format(items);
};

/**
 * Pluralización inteligente
 */
export const pluralize = (
  count: number,
  singular: string,
  plural?: string,
  locale?: string
): string => {
  const currentLocale = locale || i18n.language || "es";
  const pluralRules = new Intl.PluralRules(currentLocale);
  const rule = pluralRules.select(count);
  
  if (rule === "one") {
    return singular;
  }
  
  return plural || `${singular}s`;
};
