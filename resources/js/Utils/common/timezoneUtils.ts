import { useTimezoneStore } from '@/stores/common/timezoneStore';
import { format, parseISO } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { enUS, es } from 'date-fns/locale';

/**
 * Utilidades avanzadas para manejo de timezones con date-fns-tz
 * 
 * IMPORTANTE: Estas funciones manejan la conversión entre UTC (backend)
 * y la zona horaria efectiva del usuario (workspace > user > browser > UTC).
 * 
 * Para formateo simple, usar formatDate.ts o i18nHelpers.ts
 */

/**
 * Obtiene el locale de date-fns según el idioma actual
 */
const getDateLocale = () => {
  const currentLocale = localStorage.getItem('locale') || 'en';
  return currentLocale === 'es' ? es : enUS;
};

/**
 * Convierte fecha UTC del backend a timezone del usuario para MOSTRAR
 *
 * @param utcDateString - Fecha en UTC del backend (ISO 8601)
 * @param formatStr - Formato de salida (default: 'PPpp')
 * @returns Fecha formateada en timezone del usuario
 *
 * @example
 * // BD: "2026-03-08T20:30:00Z" (UTC)
 * // Usuario en Colombia (UTC-5):
 * formatDate('2026-03-08T20:30:00Z')
 * // → "8 de marzo de 2026, 15:30"
 * 
 * // Usuario en Alemania (UTC+1):
 * formatDate('2026-03-08T20:30:00Z')
 * // → "8 de marzo de 2026, 21:30"
 */
export function formatDate(
  utcDateString: string | null | undefined,
  formatStr: string = 'PPpp',
): string {
  if (!utcDateString) return '';

  try {
    const timezone = useTimezoneStore.getState().effectiveTimezone();

    // Parsear fecha UTC del backend
    const utcDate = parseISO(utcDateString);

    // Convertir a timezone del usuario
    const zonedDate = toZonedTime(utcDate, timezone);

    // Formatear
    return format(zonedDate, formatStr, { locale: getDateLocale() });
  } catch (error) {
    console.error('Error formatting date:', error);
    return utcDateString;
  }
}

/**
 * Convierte fecha local a UTC para ENVIAR al backend
 *
 * @param localDate - Fecha en timezone del usuario
 * @returns Fecha en UTC (ISO 8601)
 *
 * @example
 * // Usuario en Colombia (UTC-5) ingresa: "2026-03-08T15:30:00"
 * toUTC(new Date('2026-03-08T15:30:00'))
 * // → "2026-03-08T20:30:00.000Z" (convertido a UTC para guardar en BD)
 * 
 * // Usuario en Tokio (UTC+9) ingresa: "2026-03-08T15:30:00"
 * toUTC(new Date('2026-03-08T15:30:00'))
 * // → "2026-03-08T06:30:00.000Z" (convertido a UTC para guardar en BD)
 */
export function toUTC(localDate: Date | string | null | undefined): string | null {
  if (!localDate) return null;

  try {
    const timezone = useTimezoneStore.getState().effectiveTimezone();

    // Convertir a Date si es string
    const date = typeof localDate === 'string' ? new Date(localDate) : localDate;

    // Convertir a UTC
    const utcDate = fromZonedTime(date, timezone);

    // Retornar en formato ISO 8601
    return utcDate.toISOString();
  } catch (error) {
    console.error('Error converting to UTC:', error);
    return null;
  }
}

/**
 * Convierte fecha UTC a Date local del usuario
 *
 * @param utcDateString - Fecha en UTC (ISO 8601)
 * @returns Date en timezone del usuario
 * 
 * @example
 * // BD: "2026-03-08T20:30:00Z" (UTC)
 * // Usuario en Argentina (UTC-3):
 * toLocalDate("2026-03-08T20:30:00Z")
 * // → Date object representando "2026-03-08T17:30:00" en hora local
 * 
 * // Usuario en Singapur (UTC+8):
 * toLocalDate("2026-03-08T20:30:00Z")
 * // → Date object representando "2026-03-09T04:30:00" en hora local
 */
export function toLocalDate(utcDateString: string | null | undefined): Date | null {
  if (!utcDateString) return null;

  try {
    const timezone = useTimezoneStore.getState().effectiveTimezone();
    const utcDate = parseISO(utcDateString);
    return toZonedTime(utcDate, timezone);
  } catch (error) {
    console.error('Error converting to local date:', error);
    return null;
  }
}

/**
 * Obtiene fecha/hora actual en timezone del usuario
 *
 * @returns Fecha actual en timezone del usuario
 */
export function getNow(): Date {
  const timezone = useTimezoneStore.getState().effectiveTimezone();
  return toZonedTime(new Date(), timezone);
}

/**
 * Formatos predefinidos comunes
 */
export const DATE_FORMATS = {
  FULL: 'PPpp', // "8 de marzo de 2026, 15:30"
  DATE_ONLY: 'PP', // "8 de marzo de 2026"
  TIME_ONLY: 'p', // "15:30"
  SHORT: 'Pp', // "08/03/2026, 15:30"
  SHORT_DATE: 'P', // "08/03/2026"
  ISO: "yyyy-MM-dd'T'HH:mm", // "2026-03-08T15:30"
} as const;
