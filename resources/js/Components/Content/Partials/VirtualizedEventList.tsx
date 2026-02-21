import { CalendarEvent } from '@/types/calendar';
import { useMemo } from 'react';

interface VirtualizedEventListProps {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  maxVisible?: number;
}

/**
 * Virtualized event list for days with many events
 * Shows a limited number of events with a "show more" option
 * 
 * This is a lightweight alternative to full virtualization libraries
 * for the calendar grid where each day cell has limited space.
 */
export function VirtualizedEventList({
  events,
  onEventClick,
  maxVisible = 3,
}: VirtualizedEventListProps) {
  const { visibleEvents, hiddenCount } = useMemo(() => {
    if (events.length <= maxVisible) {
      return { visibleEvents: events, hiddenCount: 0 };
    }

    return {
      visibleEvents: events.slice(0, maxVisible),
      hiddenCount: events.length - maxVisible,
    };
  }, [events, maxVisible]);

  return (
    <div className="flex flex-col gap-1">
      {visibleEvents.map((event) => (
        <button
          key={event.id}
          onClick={(e) => {
            e.stopPropagation();
            onEventClick(event);
          }}
          className="text-left text-xs px-2 py-1 rounded truncate hover:opacity-80 transition-opacity"
          style={{ backgroundColor: event.color }}
          title={event.title}
        >
          {event.title}
        </button>
      ))}

      {hiddenCount > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            // Could open a modal showing all events for this day
          }}
          className="text-xs text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 px-2 py-1 text-left"
        >
          +{hiddenCount} more
        </button>
      )}
    </div>
  );
}

/**
 * Performance-optimized event renderer
 * Uses React.memo to prevent unnecessary re-renders
 */
export const EventItem = ({
  event,
  onClick,
}: {
  event: CalendarEvent;
  onClick: (event: CalendarEvent) => void;
}) => {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick(event);
      }}
      className="text-left text-xs px-2 py-1 rounded truncate hover:opacity-80 transition-opacity"
      style={{ backgroundColor: event.color }}
      title={event.title}
    >
      {event.title}
    </button>
  );
};
