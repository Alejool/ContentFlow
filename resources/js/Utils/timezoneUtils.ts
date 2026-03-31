import { format, parseISO } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { es, enUS } from 'date-fns/locale';
import { useTimezoneStore } from '@/stores/timezoneStore';

/**
 * Obtiene el locale de date-fns según el idioma actual
 */
const getDateLocale = () => {
  const currentLocale = localStorage.getItem('locale') || 'en';
  return currentLocale === 'es' ? es : enUS;
};

/**
 * Convierte fecha UTC del backend a timezone del workspace para MOSTRAR
 *
 * @param utcDateString - Fecha en UTC del backend (ISO 8601)
 * @param formatStr - Formato de salida (default: 'PPpp')
 * @returns Fecha formateada en timezone del workspace
 *
 * @example
 * formatDate('2026-03-08T20:30:00Z')
 * // → "8 de marzo de 2026, 15:30" (si workspace es America/Bogota)
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

    // Convertir a timezone del workspace
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
 * @param localDate - Fecha en timezone del workspace
 * @returns Fecha en UTC (ISO 8601)
 *
 * @example
 * toUTC(new Date('2026-03-08T15:30:00'))
 * // → "2026-03-08T20:30:00.000Z" (si workspace es America/Bogota)
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
 * Convierte fecha UTC a Date local del workspace
 *
 * @param utcDateString - Fecha en UTC (ISO 8601)
 * @returns Date en timezone del workspace
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
 * Obtiene fecha/hora actual en timezone del workspace
 *
 * @returns Fecha actual en timezone del workspace
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
