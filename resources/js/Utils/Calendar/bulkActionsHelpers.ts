/**
 * Formatea la fecha seleccionada en un formato legible
 */
import { formatDate } from '@/Utils/formatters';

export function formatSelectedDate(date: Date): string {
  return formatDate(date, 'long');
}

/**
 * Normaliza una fecha al inicio del día (00:00:00)
 */
export function normalizeToStartOfDay(date: Date): Date {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
}

/**
 * Verifica si una fecha está en el pasado
 */
export function isDateInPast(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

/**
 * Obtiene el texto apropiado para el contador de eventos
 */
export function getEventCountText(
  count: number,
  t: (key: string) => string
): string {
  return count === 1 ? t('calendar.event') : t('calendar.events.count');
}

/**
 * Calcula el porcentaje de eventos seleccionados
 */
export function calculateSelectionPercentage(
  selectedCount: number,
  totalCount: number
): number {
  if (totalCount === 0) return 0;
  return Math.round((selectedCount / totalCount) * 100);
}
