import { useTimezoneStore } from '@/stores/common/timezoneStore';
import i18n from 'i18next';

/**
 * Obtiene el timezone del usuario para visualización
 */
export const getUserTimezone = (): string => {
  return useTimezoneStore.getState().effectiveTimezone();
};

/**
 * Obtiene el locale del usuario
 */
export const getUserLocale = (): string => {
  return (
    (window as { APP_LOCALE?: string }).APP_LOCALE ||
    document.documentElement.lang ||
    i18n.language ||
    Intl.DateTimeFormat().resolvedOptions().locale ||
    'es-ES'
  );
};

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
 */
export const formatDate = (
  date: Date | string | number,
  format: keyof typeof dateTimeFormats = 'medium',
  locale?: string,
): string => {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

  const currentLocale = locale || getUserLocale();
  const timezone = getUserTimezone();

  return new Intl.DateTimeFormat(currentLocale, {
    ...dateTimeFormats[format],
    timeZone: timezone,
  }).format(dateObj);
};

/**
 * Formatea una fecha opcional con un fallback
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

export function formatDateTimeString(
  date: Date | string | number | null | undefined,
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!date) return '';
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '';

    const timezone = getUserTimezone();
    const locale = getUserLocale();

    return dateObj.toLocaleString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      ...options,
      timeZone: timezone,
    });
  } catch {
    return '';
  }
}

export function formatDateString(
  date: Date | string | number | null | undefined,
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!date) return '';
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '';

    const timezone = getUserTimezone();
    const locale = getUserLocale();

    return dateObj.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options,
      timeZone: timezone,
    });
  } catch {
    return '';
  }
}

export function formatTimeString(
  date: Date | string | number | null | undefined,
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!date) return '';
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '';

    const timezone = getUserTimezone();
    const locale = getUserLocale();

    return dateObj.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      ...options,
      timeZone: timezone,
    });
  } catch {
    return '';
  }
}

export const formatRelativeTime = (date: Date | string | number, locale?: string): string => {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

  const currentLocale = locale || getUserLocale();
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

export function formatDateTimeStyled(
  date: Date | string | number | null | undefined,
  dateStyle: 'full' | 'long' | 'medium' | 'short' = 'short',
  timeStyle: 'full' | 'long' | 'medium' | 'short' = 'short'
): string {
  if (!date) return '';
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '';
    
    // We should use user locale and timezone
    const timezone = getUserTimezone();
    const locale = getUserLocale();

    return new Intl.DateTimeFormat(locale, {
      dateStyle,
      timeStyle,
      timeZone: timezone,
    }).format(dateObj);
  } catch {
    return '';
  }
}
