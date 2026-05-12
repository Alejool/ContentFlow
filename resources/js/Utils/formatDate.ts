import { useTimezoneStore } from '@/stores/timezoneStore';
import { parseISO } from 'date-fns';

/**
 * Helpers simples para formateo de fechas con timezone del usuario
 * 
 * IMPORTANTE: Estas funciones convierten automáticamente fechas UTC (del backend)
 * a la zona horaria del usuario (user timezone > browser timezone > UTC).
 * 
 * El workspace timezone NO se usa para visualización, solo para seguimiento interno.
 * 
 * Para más opciones de formato, usar i18nHelpers.ts
 */

// Obtiene el timezone efectivo del usuario para visualización
const getUserTimezone = () => {
  return useTimezoneStore.getState().effectiveTimezone();
};

const getUserLocale = () =>
  ((window as unknown as Record<string, unknown>).APP_LOCALE as string) ||
  document.documentElement.lang ||
  Intl.DateTimeFormat().resolvedOptions().locale;

/**
 * Formatea solo la hora de una fecha UTC
 * 
 * @param iso - Fecha en formato ISO 8601 (UTC del backend)
 * @returns Hora formateada en timezone del usuario (ej: "15:30")
 * 
 * @example
 * // BD: "2026-03-08T20:30:00Z" (UTC)
 * // Usuario en Colombia (UTC-5):
 * formatTime("2026-03-08T20:30:00Z") // → "15:30"
 * 
 * // Usuario en Japón (UTC+9):
 * formatTime("2026-03-08T20:30:00Z") // → "05:30" (día siguiente)
 */
export function formatTime(iso?: string | null) {
  if (!iso) return '';
  try {
    const date = parseISO(iso);
    const tz = getUserTimezone();
    const locale = getUserLocale();
    return date.toLocaleString(locale || undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: tz,
    });
  } catch {
    return '';
  }
}

/**
 * Formatea solo la fecha (sin hora) de una fecha UTC
 * 
 * @param iso - Fecha en formato ISO 8601 (UTC del backend)
 * @returns Fecha formateada en timezone del usuario (ej: "8 mar 2026")
 * 
 * @example
 * // BD: "2026-03-08T20:30:00Z" (UTC)
 * // Usuario en España (UTC+1):
 * formatDate("2026-03-08T20:30:00Z") // → "8 mar 2026"
 * 
 * // Usuario en Australia (UTC+10):
 * formatDate("2026-03-08T20:30:00Z") // → "9 mar 2026" (día siguiente)
 */
export function formatDate(iso?: string | null) {
  if (!iso) return '';
  try {
    const date = parseISO(iso);
    const tz = getUserTimezone();
    const locale = getUserLocale();
    return date.toLocaleString(locale || undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: tz,
    });
  } catch {
    return '';
  }
}

/**
 * Formatea fecha y hora completa de una fecha UTC
 * 
 * @param iso - Fecha en formato ISO 8601 (UTC del backend)
 * @returns Fecha y hora formateadas en timezone del usuario (ej: "8 mar 2026, 15:30")
 * 
 * @example
 * // BD: "2026-03-08T20:30:00Z" (UTC)
 * // Usuario en México (UTC-6):
 * formatDateTime("2026-03-08T20:30:00Z") // → "8 mar 2026, 14:30"
 * 
 * // Usuario en India (UTC+5:30):
 * formatDateTime("2026-03-08T20:30:00Z") // → "9 mar 2026, 02:00"
 */
export function formatDateTime(iso?: string | null) {
  if (!iso) return '';
  try {
    const date = parseISO(iso);
    const tz = getUserTimezone();
    const locale = getUserLocale();
    return date.toLocaleString(locale || undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: tz,
    });
  } catch {
    return '';
  }
}

export default { formatTime, formatDate, formatDateTime };
