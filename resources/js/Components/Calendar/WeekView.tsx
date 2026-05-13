import { EventCard } from '@/Components/Calendar/EventCard';
import type { CalendarEvent } from '@/types/Calendar/calendar';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    useDraggable,
    useDroppable,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { eachDayOfInterval, endOfWeek, format, isToday, parseISO, startOfWeek } from 'date-fns';
import { Plus } from 'lucide-react';
import React, { useState } from 'react';

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventDrop: (event: CalendarEvent, newDate: Date) => void;
  onEventClick?: ((event: CalendarEvent) => void) | undefined;
  onDeleteEvent?: ((event: CalendarEvent) => void) | undefined;
  onAddEvent?: ((date: Date) => void) | undefined;
  selectedEvents: Set<string>;
  onToggleSelection: (eventId: string) => void;
  PlatformIcon: React.ComponentType<{ platform?: string | undefined; className?: string | undefined }>;
  currentUser?: { name: string } | undefined;
}

// ─── Draggable event wrapper using EventCard ────────────────────────────────

interface DraggableWeekEventProps {
  event: CalendarEvent;
  isSelected: boolean;
  onToggleSelection: (eventId: string) => void;
  onEventClick?: ((event: CalendarEvent) => void) | undefined;
  PlatformIcon: React.ComponentType<{ platform?: string | undefined; className?: string | undefined }>;
  currentUser?: { name: string } | undefined;
}

const DraggableWeekEvent: React.FC<DraggableWeekEventProps> = ({
  event,
  isSelected,
  onToggleSelection,
  onEventClick,
  PlatformIcon,
  currentUser,
}) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: event.id,
    data: { event },
  });

  return (
    <div ref={setNodeRef} className="mb-1">
      <EventCard
        event={event}
        isSelected={isSelected}
        isDragging={isDragging}
        onToggleSelection={onToggleSelection}
        onEventClick={onEventClick}
        PlatformIcon={PlatformIcon}
        currentUser={currentUser}
        dragHandleProps={{ ...listeners, ...attributes }}
      />
    </div>
  );
};

// ─── Droppable time slot ─────────────────────────────────────────────────────

interface DroppableTimeSlotProps {
  day: Date;
  hour: number;
  events: CalendarEvent[];
  selectedEvents: Set<string>;
  onToggleSelection: (eventId: string) => void;
  onEventClick?: ((event: CalendarEvent) => void) | undefined;
  onAddEvent?: ((date: Date) => void) | undefined;
  PlatformIcon: React.ComponentType<{ platform?: string | undefined; className?: string | undefined }>;
  currentUser?: { name: string } | undefined;
}

const DroppableTimeSlot: React.FC<DroppableTimeSlotProps> = ({
  day,
  hour,
  events,
  selectedEvents,
  onToggleSelection,
  onEventClick,
  onAddEvent,
  PlatformIcon,
  currentUser,
}) => {
  const slotId = `${format(day, 'yyyy-MM-dd')}-${hour}`;
  const { setNodeRef, isOver } = useDroppable({ id: slotId, data: { day, hour } });

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const date = new Date(day);
    date.setHours(hour, 0, 0, 0);
    onAddEvent?.(date);
  };

  return (
    <div
      ref={setNodeRef}
      role="button"
      tabIndex={0}
      onClick={() => {
        if (!onAddEvent) return;
        const date = new Date(day);
        date.setHours(hour, 0, 0, 0);
        onAddEvent(date);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (!onAddEvent) return;
          const date = new Date(day);
          date.setHours(hour, 0, 0, 0);
          onAddEvent(date);
        }
      }}
      className={`group relative min-h-[60px] cursor-pointer border-r border-gray-100 p-1 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900/30 ${
        isOver ? 'bg-primary-100/50 ring-1 ring-inset ring-primary-500 dark:bg-primary-900/20' : ''
      }`}
    >
      {events.map((event) => (
        <DraggableWeekEvent
          key={event.id}
          event={event}
          isSelected={selectedEvents.has(event.id)}
          onToggleSelection={onToggleSelection}
          onEventClick={onEventClick}
          PlatformIcon={PlatformIcon}
          currentUser={currentUser}
        />
      ))}

      {isOver && events.length === 0 && (
        <div className="py-2 text-center text-xs font-medium text-primary-600 dark:text-primary-400">
          Soltar aquí
        </div>
      )}

    </div>
  );
};

// ─── Main WeekView ───────────────────────────────────────────────────────────

export const WeekView: React.FC<WeekViewProps> = ({
  currentDate,
  events,
  onEventDrop,
  onEventClick,
  onAddEvent,
  selectedEvents,
  onToggleSelection,
  PlatformIcon,
  currentUser,
}) => {
  const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getEventsForDayAndHour = (day: Date, hour: number) =>
    events.filter((event) => {
      const eventDate = parseISO(event.start);
      return (
        format(eventDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd') &&
        eventDate.getHours() === hour
      );
    });

  const handleDragStart = (e: DragStartEvent) => {
    setActiveEvent(e.active.data.current?.['event'] as CalendarEvent);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      const draggedEvent = active.data.current?.['event'] as CalendarEvent;
      const day = over.data.current?.['day'] as Date;
      const hour = over.data.current?.['hour'] as number;
      if (draggedEvent && day !== undefined && hour !== undefined) {
        const newDate = new Date(day);
        newDate.setHours(hour, 0, 0, 0);
        onEventDrop(draggedEvent, newDate);
      }
    }
    setActiveEvent(null);
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      {/* Outer wrapper: horizontal scroll on small screens */}
      <div className="w-full overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
        <div className="min-w-[640px]">

          {/* ── Day headers ── */}
          <div className="sticky top-0 z-10 grid border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-black"
            style={{ gridTemplateColumns: '64px repeat(7, 1fr)' }}
          >
            {/* Time column label */}
            <div className="border-r border-gray-200 p-3 text-center text-xs font-bold text-gray-400 dark:border-gray-700">
              Hora
            </div>

            {days.map((day) => (
              <div
                key={day.toISOString()}
                className={`group relative border-r border-gray-200 px-2 py-3 text-center last:border-r-0 dark:border-gray-700 ${
                  isToday(day)
                    ? 'bg-primary-50 dark:bg-primary-900/20'
                    : 'bg-white dark:bg-black'
                }`}
              >
                <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {format(day, 'EEE')}
                </div>
                <div
                  className={`mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                    isToday(day)
                      ? 'bg-primary-600 text-white shadow-md shadow-primary-500/30'
                      : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {format(day, 'd')}
                </div>

                {/* Add event button */}
                {onAddEvent && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const date = new Date(day);
                      date.setHours(9, 0, 0, 0);
                      onAddEvent(date);
                    }}
                    className="absolute right-1 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-md bg-primary-50 text-primary-600 transition-all hover:bg-primary-100 dark:bg-primary-900/30 dark:text-primary-400 dark:hover:bg-primary-900/50 shadow-sm"
                    title="Agregar evento"
                    aria-label="Agregar evento"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* ── Time grid ── */}
          <div className="overflow-y-auto" style={{ maxHeight: '70vh' }}>
            {hours.map((hour) => (
              <div
                key={hour}
                className="grid border-b border-gray-100 dark:border-gray-800"
                style={{ gridTemplateColumns: '64px repeat(7, 1fr)' }}
              >
                {/* Hour label */}
                <div className="border-r border-gray-100 bg-gray-50 px-2 py-1 text-right text-xs font-medium text-gray-400 dark:border-gray-800 dark:bg-gray-900/50">
                  {format(new Date().setHours(hour, 0, 0, 0), 'HH:mm')}
                </div>

                {/* Day slots */}
                {days.map((day) => (
                  <DroppableTimeSlot
                    key={`${day.toISOString()}-${hour}`}
                    day={day}
                    hour={hour}
                    events={getEventsForDayAndHour(day, hour)}
                    selectedEvents={selectedEvents}
                    onToggleSelection={onToggleSelection}
                    onEventClick={onEventClick}
                    onAddEvent={onAddEvent}
                    PlatformIcon={PlatformIcon}
                    currentUser={currentUser}
                  />
                ))}
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeEvent ? (
          <div className="w-48 cursor-grabbing opacity-90">
            <EventCard
              event={activeEvent}
              isSelected={false}
              isDragging={true}
              onToggleSelection={() => {}}
              PlatformIcon={PlatformIcon}
              currentUser={currentUser}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
