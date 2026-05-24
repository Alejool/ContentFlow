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
import { eachDayOfInterval, endOfWeek, format, isSameDay, isToday, parseISO, startOfWeek } from 'date-fns';
import { Plus } from 'lucide-react';
import Button from '@/Components/common/Modern/Button';
import { toAddEventDateTime } from '@/Utils/Calendar/dayAddEventDate';
import React, { useState } from 'react';

import type { DraggableWeekEventProps, WeekViewProps } from '@/types/Calendar/viewTypes';

const DraggableWeekEvent: React.FC<DraggableWeekEventProps> = ({
  event,
  isSelected,
  onToggleSelection,
  onEventClick,
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
        currentUser={currentUser}
        dragHandleProps={{ ...listeners, ...attributes }}
        showDay={true}
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
  currentUser?: { name: string } | undefined;
  isSelectedDay?: boolean;
}

const DroppableTimeSlot: React.FC<DroppableTimeSlotProps> = ({
  day,
  hour,
  events,
  selectedEvents,
  onToggleSelection,
  onEventClick,
  onAddEvent,
  currentUser,
  isSelectedDay,
}) => {
  const slotId = `${format(day, 'yyyy-MM-dd')}-${hour}`;
  const { setNodeRef, isOver } = useDroppable({ id: slotId, data: { day, hour } });

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddEvent?.(toAddEventDateTime(day, hour));
  };

  return (
    <div
      ref={setNodeRef}
      role="button"
      tabIndex={0}
      onClick={() => {
        if (!onAddEvent) return;
        onAddEvent(toAddEventDateTime(day, hour));
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (!onAddEvent) return;
          onAddEvent(toAddEventDateTime(day, hour));
        }
      }}
      className={`group relative min-h-[80px] cursor-pointer border-r border-gray-100 transition-colors hover:bg-primary-50/20 dark:border-gray-800 dark:hover:bg-primary-900/10 ${
        isOver ? 'bg-primary-100/50 ring-1 ring-inset ring-primary-500 dark:bg-primary-900/20' : ''
      } ${isToday(day) ? 'bg-primary-50/20 dark:bg-primary-900/5' : ''} ${isSelectedDay ? 'bg-gray-50/40 dark:bg-white/5' : ''}`}
    >
      {/* Línea de media hora decorativa */}
      <div className="absolute top-1/2 left-0 h-[1px] w-full border-t border-dashed border-gray-100 dark:border-gray-800/50" />
      {events.map((event) => (
        <DraggableWeekEvent
          key={event.id}
          event={event}
          isSelected={selectedEvents.has(event.id)}
          onToggleSelection={onToggleSelection}
          onEventClick={onEventClick}
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
  onDaySelect,
  currentUser,
}) => {
  const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getEventsForDayAndHour = (day: Date, hour: number) =>
    events.filter((event) => {
      const eventDate = parseISO(event.start);
      return isSameDay(eventDate, day) && eventDate.getHours() === hour;
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
        onEventDrop(draggedEvent, toAddEventDateTime(day, hour));
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
                role="button"
                tabIndex={0}
                onClick={() => onDaySelect?.(day)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onDaySelect?.(day);
                  }
                }}
                className={`group relative flex flex-col items-center justify-center border-r border-gray-200 px-2 py-4 last:border-r-0 transition-all hover:bg-gray-50/80 dark:border-gray-700 dark:hover:bg-gray-900/30 ${
                  isToday(day)
                    ? 'bg-primary-50/50 dark:bg-primary-900/10'
                    : 'bg-white dark:bg-black'
                }`}
              >
                {isToday(day) && (
                  <div className="absolute top-0 left-0 h-1 w-full bg-primary-500 shadow-[0_0_8px_rgba(var(--primary-500),0.5)]" />
                )}
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
                  <Button
                    type="button"
                    buttonStyle="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      const date = new Date(day);
                      date.setHours(9, 0, 0, 0);
                      onAddEvent(date);
                    }}
                    className=""
                    title="Agregar evento"
                    aria-label="Agregar evento"
                    icon={<Plus className="h-4 w-4" />}
                  >
                    {''}
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* ── Time grid ── */}
          <div className="overflow-y-auto max-h-[70vh]" >
            {hours.map((hour) => (
              <div
                key={hour}
                className={`grid border-b border-gray-100 dark:border-gray-800 ${hour % 2 === 0 ? 'bg-white dark:bg-black' : 'bg-gray-50/30 dark:bg-gray-900/10'}`}
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
                    currentUser={currentUser}
                    isSelectedDay={isSameDay(day, currentDate)}
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
              currentUser={currentUser}
              showDay={true}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
