import React from 'react';

const WEEKDAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] as const;

/**
 * Cabecera de días de la semana (solo desktop).
 */
export const WeekdayHeaderRow: React.FC = () => (
  <div className="hidden grid-cols-7 border-b border-gray-200 bg-gray-50 dark:border-neutral-800 dark:bg-neutral-900 lg:grid">
    {WEEKDAY_LABELS.map((day) => (
      <div
        key={day}
        className="py-3 text-center text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400"
      >
        {day}
      </div>
    ))}
  </div>
);
