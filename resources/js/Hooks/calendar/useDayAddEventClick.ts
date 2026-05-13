import { toAddEventDateTime } from '@/Utils/Calendar/dayAddEventDate';
import { useCallback, useRef } from 'react';

/**
 * Click en “añadir evento” dentro de una celda de día: evita propagar al `onDaySelect` del contenedor.
 * Si `onAddEvent` es undefined, el handler no hace nada (útil para llamar el hook siempre).
 */
export function useDayAddEventClick(
  day: Date,
  onAddEvent?: (date: Date) => void,
): (e: React.MouseEvent<HTMLButtonElement>) => void {
  const dayMs = day.getTime();
  const onAddRef = useRef(onAddEvent);
  onAddRef.current = onAddEvent;

  return useCallback((e) => {
    e.stopPropagation();
    const fn = onAddRef.current;
    if (fn) {
      fn(toAddEventDateTime(new Date(dayMs)));
    }
  }, [dayMs]);
}
