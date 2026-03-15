import { formatTime } from '@/Utils/formatDate';
import { format, parseISO } from 'date-fns';
import { Clock, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { CalendarEvent } from '@/types/calendar';
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

interface DraggableDayEventProps {
  event: CalendarEvent;
  isSelected: boolean;
  onToggleSelection: (eventId: string) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onDeleteEvent?: (event: CalendarEvent) => void;
  PlatformIcon: React.ComponentType<{ platform?: string; className?: string }>;
}

const DraggableDayEvent: React.FC<DraggableDayEventProps> = ({
  event,
  isSelected,
  onToggleSelection,
  onEventClick,
  onDeleteEvent,
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
      className={`relative cursor-grab rounded-lg p-4 active:cursor-grabbing ${isSelected ? 'ring-2 ring-primary-500' : ''} ${isDragging ? 'opacity-50' : ''} border-l-4 bg-white transition-all hover:shadow-lg dark:bg-gray-800`}
      style={{ borderLeftColor: event.color }}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            onToggleSelection(event.id);
          }}
          onClick={(e) => e.stopPropagation()}
          className="mt-1"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <PlatformIcon platform={event.extendedProps.platform} className="h-5 w-5" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                {event.title}
              </h3>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{formatTime(event.start)}</span>
            </div>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize dark:bg-gray-700">
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
  );
};

interface DroppableHourSlotProps {
  hour: number;
  events: CalendarEvent[];
  selectedEvents: Set<string>;
  onToggleSelection: (eventId: string) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onDeleteEvent?: (event: CalendarEvent) => void;
  PlatformIcon: React.ComponentType<{ platform?: string; className?: string }>;
}

const DroppableHourSlot: React.FC<DroppableHourSlotProps> = ({
  hour,
  events,
  selectedEvents,
  onToggleSelection,
  onEventClick,
  onDeleteEvent,
  PlatformIcon,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `hour-${hour}`,
    data: { hour },
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[100px] border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900/30 ${isOver ? 'bg-primary-100/50 dark:bg-primary-900/20' : ''} `}
    >
      {/* Time label */}
      <div className="w-24 border-r border-gray-100 bg-gray-50 p-4 text-right dark:border-gray-800 dark:bg-gray-900/50">
        <div className="text-sm font-semibold text-gray-900 dark:text-white">
          {format(new Date().setHours(hour, 0, 0, 0), 'HH:mm')}
        </div>
      </div>

      {/* Events */}
      <div className="flex-1 space-y-2 p-3">
        {events.map((event) => (
          <DraggableDayEvent
            key={event.id}
            event={event}
            isSelected={selectedEvents.has(event.id)}
            onToggleSelection={onToggleSelection}
            onEventClick={onEventClick}
            onDeleteEvent={onDeleteEvent}
            PlatformIcon={PlatformIcon}
          />
        ))}

        {events.length === 0 && !isOver && (
          <div className="py-4 text-center text-sm text-gray-400 dark:text-gray-600">
            Sin eventos programados
          </div>
        )}

        {isOver && events.length === 0 && (
          <div className="py-4 text-center text-sm font-medium text-primary-600 dark:text-primary-400">
            Soltar aquí
          </div>
        )}
      </div>
    </div>
  );
};

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
  const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null);

  // Configure sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getEventsForHour = (hour: number) => {
    return events.filter((event) => {
      const eventDate = parseISO(event.start);
      return (
        format(eventDate, 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd') &&
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
      const { hour } = over.data.current as { hour: number };

      if (draggedEvent && hour !== undefined) {
        const newDate = new Date(currentDate);
        newDate.setHours(hour, 0, 0, 0);
        onEventDrop(draggedEvent, newDate);
      }
    }

    setActiveEvent(null);
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex h-full flex-col overflow-hidden bg-white dark:bg-black">
        {/* Header */}
        <div className="border-b border-gray-200 bg-gradient-to-r from-primary-50 to-primary-100 p-6 dark:border-gray-700 dark:from-primary-900/20 dark:to-primary-800/20">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {format(currentDate, 'EEEE')}
          </div>
          <div className="mt-1 text-4xl font-bold text-gray-900 dark:text-white">
            {format(currentDate, "d 'de' MMMM, yyyy")}
          </div>
        </div>

        {/* Time slots */}
        <div className="flex-1 overflow-y-auto">
          {hours.map((hour) => {
            const hourEvents = getEventsForHour(hour);
            return (
              <DroppableHourSlot
                key={hour}
                hour={hour}
                events={hourEvents}
                selectedEvents={selectedEvents}
                onToggleSelection={onToggleSelection}
                onEventClick={onEventClick}
                onDeleteEvent={onDeleteEvent}
                PlatformIcon={PlatformIcon}
              />
            );
          })}
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeEvent ? (
          <div className="cursor-grabbing rounded-lg border border-primary-500 bg-white p-3 opacity-90 shadow-2xl dark:bg-gray-800">
            <div className="flex items-center gap-2">
              <PlatformIcon platform={activeEvent.extendedProps.platform} className="h-5 w-5" />
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                {activeEvent.title}
              </div>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
