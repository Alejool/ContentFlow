import { useTimezoneStore } from '@/stores/timezoneStore';
import i18n from 'i18next';

/**
 * Obtiene el timezone efectivo del usuario para VISUALIZACIÓN (uso interno)
 * 
 * JERARQUÍA PARA MOSTRAR FECHAS:
 * 1. User timezone (preferencia configurada por el usuario)
 * 2. Browser timezone (detectado automáticamente según ubicación)
 * 3. UTC (fallback)
 * 
 * IMPORTANTE: El workspace timezone NO se usa para visualización.
 * Solo se usa para seguimiento interno. Las fechas siempre se muestran
 * según la zona horaria real del usuario para mayor coherencia.
 * 
 * Esto asegura que las fechas UTC almacenadas en la BD se muestren
 * en la zona horaria correcta según donde esté ubicado el usuario.
 */
const getEffectiveUserTimezone = (): string => {
  return useTimezoneStore.getState().effectiveTimezone();
};

/**
 * Configuración de formatos de fecha/hora por idioma
 */
export const dateTimeFormats: Record<string, Intl.DateTimeFormatOptions> = {
  short: {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  },
  medium: {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  },
  long: {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  },
  monthYear: {
    month: 'long',
    year: 'numeric',
  },
  dayMonth: {
    day: 'numeric',
    month: 'long',
  },
  monthShort: {
    month: 'short',
  },
  dayWeekMonthYear: {
    day: 'numeric',
    weekday: 'long',
    month: 'long',
    year: 'numeric',
  },
  time: {
    hour: '2-digit',
    minute: '2-digit',
  },
  datetime: {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  },
  datetimeLong: {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  },
  full: {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  },
};

/**
 * Formatea una fecha según el idioma actual y timezone del usuario
 * 
 * IMPORTANTE: Esta función convierte automáticamente fechas UTC (del backend)
 * a la zona horaria del usuario (user timezone > browser timezone > UTC).
 * 
 * @param date - Fecha a formatear (puede ser Date, string ISO, o timestamp)
 * @param format - Formato predefinido (short, medium, long, datetime, etc.)
 * @param locale - Locale opcional (por defecto usa el idioma actual de i18n)
 * @returns Fecha formateada en la zona horaria del usuario
 * 
 * @example
 * // BD almacena: "2026-03-08T20:30:00Z" (UTC)
 * // Usuario en Colombia (UTC-5):
 * formatDate("2026-03-08T20:30:00Z", "datetime")
 * // → "8 mar 2026, 15:30" (convertido a hora local del usuario)
 * 
 * // Usuario en España (UTC+1):
 * formatDate("2026-03-08T20:30:00Z", "datetime")
 * // → "8 mar 2026, 21:30" (convertido a hora local del usuario)
 */
export const formatDate = (
  date: Date | string | number,
  format: keyof typeof dateTimeFormats = 'medium',
  locale?: string,
): string => {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

  const currentLocale = locale || i18n.language || 'es';
  const timezone = getEffectiveUserTimezone();

  return new Intl.DateTimeFormat(currentLocale, {
    ...dateTimeFormats[format],
    timeZone: timezone,
  }).format(dateObj);
};

/**
 * Formatea un número según el idioma actual
 */
export const formatNumber = (
  value: number,
  options?: Intl.NumberFormatOptions,
  locale?: string,
): string => {
  const currentLocale = locale || i18n.language || 'es';
  return new Intl.NumberFormat(currentLocale, options).format(value);
};

/**
 * Formatea una moneda según el idioma y región
 */
export const formatCurrency = (
  amount: number,
  currency: string = 'USD',
  locale?: string,
): string => {
  const currentLocale = locale || i18n.language || 'es';

  return new Intl.NumberFormat(currentLocale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Formatea un porcentaje según el idioma actual
 */
export const formatPercent = (value: number, decimals: number = 1, locale?: string): string => {
  const currentLocale = locale || i18n.language || 'es';

  return new Intl.NumberFormat(currentLocale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
};

/**
 * Formatea números grandes con abreviaciones (K, M, B)
 */
export const formatCompactNumber = (value: number, locale?: string): string => {
  const currentLocale = locale || i18n.language || 'es';

  return new Intl.NumberFormat(currentLocale, {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(value);
};

/**
 * Formatea una fecha relativa (hace 2 horas, en 3 días)
 */
export const formatRelativeTime = (date: Date | string | number, locale?: string): string => {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

  const currentLocale = locale || i18n.language || 'es';
  const now = new Date();
  const diffInSeconds = Math.floor((dateObj.getTime() - now.getTime()) / 1000);

  const rtf = new Intl.RelativeTimeFormat(currentLocale, { numeric: 'auto' });

  const units: { unit: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
    { unit: 'year', seconds: 31536000 },
    { unit: 'month', seconds: 2592000 },
    { unit: 'week', seconds: 604800 },
    { unit: 'day', seconds: 86400 },
    { unit: 'hour', seconds: 3600 },
    { unit: 'minute', seconds: 60 },
    { unit: 'second', seconds: 1 },
  ];

  for (const { unit, seconds } of units) {
    const value = Math.floor(diffInSeconds / seconds);
    if (Math.abs(value) >= 1) {
      return rtf.format(value, unit);
    }
  }

  return rtf.format(0, 'second');
};

/**
 * Obtiene la configuración regional del navegador
 */
export const getBrowserLocale = (): string => {
  const browserLang =
    navigator.language || (navigator as unknown as { userLanguage: string }).userLanguage;
  return browserLang?.split('-')[0] || 'es'; // 'es-ES' -> 'es'
};

/**
 * Detecta la zona horaria del usuario desde el navegador
 * Esta es una función de utilidad que detecta el timezone del navegador.
 * Para obtener el timezone efectivo (con fallbacks), usar el timezoneStore.
 */
export const getUserTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
};

/**
 * Formatea bytes a la unidad más apropiada automáticamente
 * 
 * @param bytes - Cantidad de bytes
 * @param decimals - Número de decimales (default: 2)
 * @param locale - Locale para formateo de números (default: idioma actual)
 * @returns String formateado con la unidad apropiada
 * 
 * @example
 * formatBytes(1024) // → "1 KB"
 * formatBytes(1048576) // → "1 MB"
 * formatBytes(1073741824) // → "1 GB"
 * formatBytes(704994 * 1024 * 1024 * 1024) // → "688.96 TB"
 */
export const formatBytes = (
  bytes: number | null | undefined,
  decimals: number = 2,
  locale?: string,
): string => {
  if (bytes === null || bytes === undefined || bytes === 0) {
    return '0 Bytes';
  }

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  const value = bytes / Math.pow(k, i);

  const currentLocale = locale || i18n.language || 'es';
  const formattedNumber = new Intl.NumberFormat(currentLocale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: dm,
  }).format(value);

  return `${formattedNumber} ${sizes[i]}`;
};

/**
 * Formatea el uso de almacenamiento con formato "usado / total"
 * 
 * @param used - Bytes usados
 * @param total - Bytes totales
 * @param decimals - Número de decimales (default: 2)
 * @param locale - Locale para formateo
 * @returns String formateado "usado / total"
 * 
 * @example
 * formatStorageUsage(536870912, 1073741824) // → "512 MB / 1 GB"
 * formatStorageUsage(750000000, 1000000000) // → "715.26 MB / 953.67 MB"
 */
export const formatStorageUsage = (
  used: number | null | undefined,
  total: number | null | undefined,
  decimals: number = 2,
  locale?: string,
): string => {
  if (used === null || used === undefined) used = 0;
  if (total === null || total === undefined) total = 0;

  const usedFormatted = formatBytes(used, decimals, locale);
  const totalFormatted = formatBytes(total, decimals, locale);

  return `${usedFormatted} / ${totalFormatted}`;
};

/**
 * Formatea una lista según el idioma (a, b y c)
 */
export const formatList = (
  items: string[],
  type: 'conjunction' | 'disjunction' = 'conjunction',
  locale?: string,
): string => {
  const currentLocale = locale || i18n.language || 'es';

  return new Intl.ListFormat(currentLocale, {
    style: 'long',
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
  locale?: string,
): string => {
  const currentLocale = locale || i18n.language || 'es';
  const pluralRules = new Intl.PluralRules(currentLocale);
  const rule = pluralRules.select(count);

  if (rule === 'one') {
    return singular;
  }

  return plural || `${singular}s`;
};

/**
 * Formatea una fecha opcional con un fallback
 * Útil para campos que pueden ser undefined/null
 * 
 * IMPORTANTE: Esta función convierte automáticamente fechas UTC (del backend)
 * a la zona horaria del usuario (user timezone > browser timezone > UTC).
 * 
 * @param date - Fecha a formatear (puede ser Date, string ISO, timestamp, undefined o null)
 * @param format - Formato predefinido (short, medium, long, datetime, etc.)
 * @param fallback - Texto a mostrar si la fecha es null/undefined
 * @param locale - Locale opcional (por defecto usa el idioma actual de i18n)
 * @returns Fecha formateada en la zona horaria del usuario, o el fallback
 * 
 * @example
 * // BD almacena: "2026-03-08T20:30:00Z" (UTC)
 * // Usuario en España (UTC+1):
 * formatOptionalDate("2026-03-08T20:30:00Z", "datetimeLong")
 * // → "8 de marzo de 2026, 21:30" (convertido a hora local del usuario)
 * 
 * // Usuario en México (UTC-6):
 * formatOptionalDate("2026-03-08T20:30:00Z", "datetimeLong")
 * // → "8 de marzo de 2026, 14:30" (convertido a hora local del usuario)
 * 
 * formatOptionalDate(null, "medium")
 * // → "No disponible" (fallback)
 */
export const formatOptionalDate = (
  date: Date | string | number | undefined | null,
  format: keyof typeof dateTimeFormats = 'medium',
  fallback: string = i18n.t('common.notAvailable', 'No disponible'),
  locale?: string,
): string => {
  if (!date) {
    return fallback;
  }

  try {
    return formatDate(date, format, locale);
  } catch (error) {
    console.error('Error formatting date:', error);
    return fallback;
  }
};
