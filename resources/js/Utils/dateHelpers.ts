/**
 * Helpers centralizados para formateo de fechas con timezone del workspace
 *
 * IMPORTANTE: Usar estos helpers en lugar de:
 * - new Date().toLocaleString()
 * - new Date().toLocaleDateString()
 * - new Date().toLocaleTimeString()
 */

import { useTimezoneStore } from '@/stores/timezoneStore';

/**
 * Obtiene el timezone del workspace
 */
const getWorkspaceTimezone = (): string => {
  return useTimezoneStore.getState().effectiveTimezone();
};

/**
 * Obtiene el locale del usuario
 */
const getUserLocale = (): string => {
  return (
    (window as any).APP_LOCALE ||
    document.documentElement.lang ||
    Intl.DateTimeFormat().resolvedOptions().locale ||
    'es-ES'
  );
};

/**
 * Formatea una fecha completa con hora (equivalente a toLocaleString)
 *
 * @param date - Fecha a formatear (Date, string ISO, o timestamp)
 * @param options - Opciones adicionales de formato
 * @returns Fecha formateada con timezone del workspace
 *
 * @example
 * formatDateTimeString("2026-03-08T20:30:00Z")
 * // → "8 mar 2026, 15:30" (si workspace es America/Bogota)
 */
export function formatDateTimeString(
  date: Date | string | number | null | undefined,
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!date) return '';

  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) return '';

    const timezone = getWorkspaceTimezone();
    const locale = getUserLocale();

    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: timezone,
    };

    // Filter out invalid options
    const validOptions: Intl.DateTimeFormatOptions = {};
    const validKeys = [
      'year',
      'month',
      'day',
      'hour',
      'minute',
      'second',
      'hour12',
      'timeZone',
      'weekday',
      'era',
      'timeZoneName',
    ];

    if (options) {
      Object.keys(options).forEach((key) => {
        if (validKeys.includes(key)) {
          validOptions[key as keyof Intl.DateTimeFormatOptions] =
            options[key as keyof Intl.DateTimeFormatOptions];
        }
      });
    }

    return dateObj.toLocaleString(locale, {
      ...defaultOptions,
      ...validOptions,
      timeZone: timezone, // Siempre usar timezone del workspace
    });
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return '';
  }
}

/**
 * Formatea solo la fecha (equivalente a toLocaleDateString)
 *
 * @param date - Fecha a formatear
 * @param options - Opciones adicionales de formato
 * @returns Fecha formateada con timezone del workspace
 *
 * @example
 * formatDateString("2026-03-08T20:30:00Z")
 * // → "8 mar 2026" (si workspace es America/Bogota)
 */
export function formatDateString(
  date: Date | string | number | null | undefined,
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!date) return '';

  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) return '';

    const timezone = getWorkspaceTimezone();
    const locale = getUserLocale();

    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: timezone,
    };

    return dateObj.toLocaleDateString(locale, {
      ...defaultOptions,
      ...options,
      timeZone: timezone,
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

/**
 * Formatea solo la hora (equivalente a toLocaleTimeString)
 *
 * @param date - Fecha a formatear
 * @param options - Opciones adicionales de formato
 * @returns Hora formateada con timezone del workspace
 *
 * @example
 * formatTimeString("2026-03-08T20:30:00Z")
 * // → "15:30" (si workspace es America/Bogota)
 */
export function formatTimeString(
  date: Date | string | number | null | undefined,
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!date) return '';

  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) return '';

    const timezone = getWorkspaceTimezone();
    const locale = getUserLocale();

    const defaultOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: timezone,
    };

    return dateObj.toLocaleTimeString(locale, {
      ...defaultOptions,
      ...options,
      timeZone: timezone,
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return '';
  }
}

/**
 * Formatea fecha para mostrar en formato corto (dateStyle/timeStyle)
 *
 * @param date - Fecha a formatear
 * @param dateStyle - Estilo de fecha: "short", "medium", "long", "full"
 * @param timeStyle - Estilo de hora: "short", "medium", "long", "full"
 * @returns Fecha formateada
 *
 * @example
 * formatDateTimeStyled("2026-03-08T20:30:00Z", "short", "short")
 * // → "08/03/26, 15:30"
 */
export function formatDateTimeStyled(
  date: Date | string | number | null | undefined,
  dateStyle: 'short' | 'medium' | 'long' | 'full' = 'short',
  timeStyle: 'short' | 'medium' | 'long' | 'full' = 'short',
): string {
  if (!date) return '';

  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) return '';

    const timezone = getWorkspaceTimezone();
    const locale = getUserLocale();

    return dateObj.toLocaleString(locale, {
      dateStyle,
      timeStyle,
      timeZone: timezone,
    });
  } catch (error) {
    console.error('Error formatting datetime styled:', error);
    return '';
  }
}

/**
 * Formatea fecha para mostrar solo fecha en formato styled
 */
export function formatDateStyled(
  date: Date | string | number | null | undefined,
  dateStyle: 'short' | 'medium' | 'long' | 'full' = 'medium',
): string {
  if (!date) return '';

  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) return '';

    const timezone = getWorkspaceTimezone();
    const locale = getUserLocale();

    return dateObj.toLocaleDateString(locale, {
      dateStyle,
      timeZone: timezone,
    });
  } catch (error) {
    console.error('Error formatting date styled:', error);
    return '';
  }
}
