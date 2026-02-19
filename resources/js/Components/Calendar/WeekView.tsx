import { formatTime } from "@/Utils/formatDate";
import {
  addDays,
  eachDayOfInterval,
  endOfWeek,
  format,
  isToday,
  parseISO,
  startOfWeek,
} from "date-fns";
import { Clock } from "lucide-react";
import React from "react";

interface CalendarEvent {
  id: string;
  resourceId: number;
  type: "publication" | "post" | "user_event" | "event";
  title: string;
  start: string;
  status: string;
  color: string;
  extendedProps: any;
}

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventDrop: (event: CalendarEvent, newDate: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onDeleteEvent?: (event: CalendarEvent) => void;
  selectedEvents: Set<string>;
  onToggleSelection: (eventId: string) => void;
  PlatformIcon: React.ComponentType<{ platform?: string; className?: string }>;
}

export const WeekView: React.FC<WeekViewProps> = ({
  currentDate,
  events,
  onEventDrop,
  onEventClick,
  selectedEvents,
  onToggleSelection,
  PlatformIcon,
}) => {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

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

  const handleDrop = (e: React.DragEvent, date: Date, hour: number) => {
    e.preventDefault();
    if (!draggedEvent) return;

    const newDate = addDays(date, 0);
    newDate.setHours(hour, 0, 0, 0);
    onEventDrop(draggedEvent, newDate);
    setDraggedEvent(null);
  };

  const getEventsForDayAndHour = (day: Date, hour: number) => {
    return events.filter((event) => {
      const eventDate = parseISO(event.start);
      return (
        format(eventDate, "yyyy-MM-dd") === format(day, "yyyy-MM-dd") &&
        eventDate.getHours() === hour
      );
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header with days */}
      <div className="grid grid-cols-8 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-black sticky top-0 z-10">
        <div className="p-4 text-xs font-bold text-gray-400 border-r border-gray-200 dark:border-gray-700">
          Hora
        </div>
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className={`p-4 text-center border-r border-gray-200 dark:border-gray-700 ${
              isToday(day)
                ? "bg-primary-50 dark:bg-primary-900/20"
                : "bg-white dark:bg-black"
            }`}
          >
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {format(day, "EEE")}
            </div>
            <div
              className={`text-2xl font-bold mt-1 ${
                isToday(day)
                  ? "text-primary-600 dark:text-primary-400"
                  : "text-gray-900 dark:text-white"
              }`}
            >
              {format(day, "d")}
            </div>
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="flex-1 overflow-y-auto">
        {hours.map((hour) => (
          <div
            key={hour}
            className="grid grid-cols-8 border-b border-gray-100 dark:border-gray-800 min-h-[80px]"
          >
            <div className="p-2 text-xs text-gray-400 border-r border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
              {format(new Date().setHours(hour, 0, 0, 0), "HH:mm")}
            </div>
            {days.map((day) => {
              const dayEvents = getEventsForDayAndHour(day, hour);
              return (
                <div
                  key={`${day.toISOString()}-${hour}`}
                  className="p-1 border-r border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, day, hour)}
                >
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, event)}
                      onClick={() => onEventClick?.(event)}
                      className={`
                        relative p-2 mb-1 rounded-lg cursor-pointer
                        ${selectedEvents.has(event.id) ? "ring-2 ring-primary-500" : ""}
                        hover:shadow-md transition-all
                      `}
                      style={{
                        backgroundColor: event.color + "20",
                        borderLeft: `3px solid ${event.color}`,
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={selectedEvents.has(event.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            onToggleSelection(event.id);
                          }}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                            {event.title}
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span className="text-[10px] text-gray-500">
                              {formatTime(event.start)}
                            </span>
                          </div>
                        </div>
                        <PlatformIcon
                          platform={event.extendedProps.platform}
                          className="w-4 h-4"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
