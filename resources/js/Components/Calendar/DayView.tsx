import { formatTime } from "@/Utils/formatDate";
import { format, parseISO } from "date-fns";
import { Clock, Trash2 } from "lucide-react";
import React from "react";
import { CalendarEvent } from "@/types/calendar";

interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventDrop: (event: CalendarEvent, newDate: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onDeleteEvent?: (event: CalendarEvent) => void;
  selectedEvents: Set<string>;
  onToggleSelection: (eventId: string) => void;
  PlatformIcon: React.ComponentType<{ platform?: string; className?: string }>;
  auth: any;
}

export const DayView: React.FC<DayViewProps> = ({
  currentDate,
  events,
  onEventDrop,
  onEventClick,
  onDeleteEvent,
  selectedEvents,
  onToggleSelection,
  PlatformIcon,
  auth,
}) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const [draggedEvent, setDraggedEvent] = React.useState<CalendarEvent | null>(
    null,
  );

  const handleDragStart = (e: React.DragEvent, event: CalendarEvent) => {
    setDraggedEvent(event);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, hour: number) => {
    e.preventDefault();
    if (!draggedEvent) return;

    const newDate = new Date(currentDate);
    newDate.setHours(hour, 0, 0, 0);
    onEventDrop(draggedEvent, newDate);
    setDraggedEvent(null);
  };

  const getEventsForHour = (hour: number) => {
    return events.filter((event) => {
      const eventDate = parseISO(event.start);
      return (
        format(eventDate, "yyyy-MM-dd") === format(currentDate, "yyyy-MM-dd") &&
        eventDate.getHours() === hour
      );
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-black">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20">
        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {format(currentDate, "EEEE")}
        </div>
        <div className="text-4xl font-bold text-gray-900 dark:text-white mt-1">
          {format(currentDate, "d 'de' MMMM, yyyy")}
        </div>
      </div>

      {/* Time slots */}
      <div className="flex-1 overflow-y-auto">
        {hours.map((hour) => {
          const hourEvents = getEventsForHour(hour);
          return (
            <div
              key={hour}
              className="flex border-b border-gray-100 dark:border-gray-800 min-h-[100px] hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, hour)}
            >
              {/* Time label */}
              <div className="w-24 p-4 text-right border-r border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {format(new Date().setHours(hour, 0, 0, 0), "HH:mm")}
                </div>
              </div>

              {/* Events */}
              <div className="flex-1 p-3 space-y-2">
                {hourEvents.map((event) => (
                  <div
                    key={event.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, event)}
                    onClick={() => onEventClick?.(event)}
                    className={`
                      relative p-4 rounded-lg cursor-pointer
                      ${selectedEvents.has(event.id) ? "ring-2 ring-primary-500" : ""}
                      hover:shadow-lg transition-all
                      bg-white dark:bg-gray-800 border-l-4
                    `}
                    style={{ borderLeftColor: event.color }}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedEvents.has(event.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          onToggleSelection(event.id);
                        }}
                        className="mt-1"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <PlatformIcon
                              platform={event.extendedProps.platform}
                              className="w-5 h-5"
                            />
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                              {event.title}
                            </h3>
                          </div>

                          {["user_event", "event"].includes(
                            String(event.type),
                          ) &&
                            onDeleteEvent && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteEvent(event);
                                }}
                                className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                        </div>

                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{formatTime(event.start)}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-xs capitalize">
                            {event.status}
                          </span>
                        </div>

                        {event.extendedProps.description && (
                          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                            {event.extendedProps.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {hourEvents.length === 0 && (
                  <div className="text-center py-4 text-gray-400 dark:text-gray-600 text-sm">
                    Sin eventos programados
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
