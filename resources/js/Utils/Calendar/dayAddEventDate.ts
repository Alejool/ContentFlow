/** Hora por defecto al crear un evento desde un día del calendario (vista mes). */
export const DEFAULT_CALENDAR_ADD_EVENT_HOUR = 9;

/** Copia el día y fija hora/minutos/segundos para abrir el modal de nuevo evento. */
export function toAddEventDateTime(
  day: Date,
  hour = DEFAULT_CALENDAR_ADD_EVENT_HOUR,
  minute = 0,
): Date {
  const d = new Date(day);
  d.setHours(hour, minute, 0, 0);
  return d;
}
