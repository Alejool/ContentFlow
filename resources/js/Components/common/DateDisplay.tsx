import React from 'react';
import { formatDate, DATE_FORMATS } from '@/Utils/timezoneUtils';
import { useTimezoneStore } from '@/stores/timezoneStore';

interface DateDisplayProps {
  date: string | null | undefined;
  format?: keyof typeof DATE_FORMATS | string;
  showTimezone?: boolean;
  className?: string;
  fallback?: string;
}

/**
 * Componente para mostrar fechas formateadas según el timezone del workspace
 * 
 * @example
 * <DateDisplay date={publication.scheduled_at} format="FULL" showTimezone />
 * <DateDisplay date={post.published_at} format="SHORT" />
 * <DateDisplay date={event.start_date} format="DATE_ONLY" />
 */
export const DateDisplay: React.FC<DateDisplayProps> = ({
  date,
  format = 'FULL',
  showTimezone = false,
  className = '',
  fallback = '-'
}) => {
  const { timezoneLabel } = useTimezoneStore();

  if (!date) {
    return <span className={className}>{fallback}</span>;
  }

  // Obtener formato predefinido o usar el custom
  const formatStr = format in DATE_FORMATS 
    ? DATE_FORMATS[format as keyof typeof DATE_FORMATS]
    : format;

  const formattedDate = formatDate(date, formatStr);

  return (
    <span className={`date-display ${className}`}>
      {formattedDate}
      {showTimezone && (
        <small className="ml-2 text-xs text-gray-500 dark:text-gray-400">
          ({timezoneLabel()})
        </small>
      )}
    </span>
  );
};
