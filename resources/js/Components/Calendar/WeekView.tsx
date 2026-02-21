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
import React, { useState } from "react";
import { CalendarEvent } from "@/types/calendar";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';

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

interface DraggableWeekEventProps {
  event: CalendarEvent;
  isSelected: boolean;
  onToggleSelection: (eventId: string) => void;
  onEventClick?: (event: CalendarEvent) => void;
  PlatformIcon: React.ComponentType<{ platform?: string; className?: string }>;
}

const DraggableWeekEvent: React.FC<DraggableWeekEventProps> = ({
  event,
  isSelected,
  onToggleSelection,
  onEventClick,
  PlatformIcon,
}) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: event.id,
    data: { event },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onEventClick?.(event)}
      className={`
        relative p-2 mb-1 rounded-lg cursor-grab active:cursor-grabbing
        ${isSelected ? "ring-2 ring-primary-500" : ""}
        ${isDragging ? "opacity-50" : ""}
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
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            onToggleSelection(event.id);
          }}
          onClick={(e) => e.stopPropagation()}
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
  );
};

interface DroppableTimeSlotProps {
  day: Date;
  hour: number;
  events: CalendarEvent[];
  selectedEvents: Set<string>;
  onToggleSelection: (eventId: string) => void;
  onEventClick?: (event: CalendarEvent) => void;
  PlatformIcon: React.ComponentType<{ platform?: string; className?: string }>;
}

const DroppableTimeSlot: React.FC<DroppableTimeSlotProps> = ({
  day,
  hour,
  events,
  selectedEvents,
  onToggleSelection,
  onEventClick,
  PlatformIcon,
}) => {
  const slotId = `${format(day, 'yyyy-MM-dd')}-${hour}`;
  const { setNodeRef, isOver } = useDroppable({
    id: slotId,
    data: { day, hour },
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        p-1 border-r border-gray-100 dark:border-gray-800 
        hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors
        ${isOver ? 'bg-primary-100/50 dark:bg-primary-900/20 ring-1 ring-primary-500' : ''}
      `}
    >
      {events.map((event) => (
        <DraggableWeekEvent
          key={event.id}
          event={event}
          isSelected={selectedEvents.has(event.id)}
          onToggleSelection={onToggleSelection}
          onEventClick={onEventClick}
          PlatformIcon={PlatformIcon}
        />
      ))}
      {isOver && events.length === 0 && (
        <div className="text-xs text-primary-600 dark:text-primary-400 text-center py-2">
          Soltar aquí
        </div>
      )}
    </div>
  );
};

export const WeekView: React.FC<WeekViewProps> = ({
  currentDate,
  events,
  onEventDrop,
  onEventClick,
  selectedEvents,
  onToggleSelection,
  PlatformIcon,
}) => {
  const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null);

  // Configure sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getEventsForDayAndHour = (day: Date, hour: number) => {
    return events.filter((event) => {
      const eventDate = parseISO(event.start);
      return (
        format(eventDate, "yyyy-MM-dd") === format(day, "yyyy-MM-dd") &&
        eventDate.getHours() === hour
      );
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    const draggedEvent = event.active.data.current?.event as CalendarEvent;
    setActiveEvent(draggedEvent);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const draggedEvent = active.data.current?.event as CalendarEvent;
      const { day, hour } = over.data.current as { day: Date; hour: number };

      if (draggedEvent && day !== undefined && hour !== undefined) {
        const newDate = new Date(day);
        newDate.setHours(hour, 0, 0, 0);
        onEventDrop(draggedEvent, newDate);
      }
    }

    setActiveEvent(null);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
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
                  <DroppableTimeSlot
                    key={`${day.toISOString()}-${hour}`}
                    day={day}
                    hour={hour}
                    events={dayEvents}
                    selectedEvents={selectedEvents}
                    onToggleSelection={onToggleSelection}
                    onEventClick={onEventClick}
                    PlatformIcon={PlatformIcon}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeEvent ? (
          <div className="rounded-lg border border-primary-500 bg-white dark:bg-gray-800 shadow-2xl p-2 opacity-90 cursor-grabbing">
            <div className="flex items-center gap-2">
              <PlatformIcon
                platform={activeEvent.extendedProps.platform}
                className="w-4 h-4"
              />
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                {activeEvent.title}
              </div>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
