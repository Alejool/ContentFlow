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
import {
    eachDayOfInterval,
    endOfMonth,
    format,
    isSameDay,
    isSameMonth,
    isToday,
    parseISO,
    startOfMonth,
} from 'date-fns';
import type { TFunction } from 'i18next';
import { Plus } from 'lucide-react';
import React, { useState } from 'react';
import { EventCard } from './EventCard';

interface MonthViewProps {
  currentDate: Date;
  selectedDate?: Date;
  events: CalendarEvent[];
  onEventDrop: (eventId: string, newDate: Date) => Promise<void>;
  onEventDelete?: (event: CalendarEvent) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onDaySelect?: (day: Date) => void;
  onAddEvent?: (date: Date) => void;
  selectedEvents: Set<string>;
  onToggleSelection: (eventId: string) => void;
  onSelectAll?: () => void;
  onSelectDay?: (day: Date) => void;
  PlatformIcon: React.ComponentType<{ platform?: string | undefined; className?: string | undefined }>;
  currentUser?: { name: string } | undefined;
  t?: TFunction | undefined;
}

interface DraggableEventProps {
  event: CalendarEvent;
  isSelected: boolean;
  onToggleSelection: (eventId: string) => void;
  onEventClick?: ((event: CalendarEvent) => void) | undefined;
  onEventDelete?: ((event: CalendarEvent) => void) | undefined;
  PlatformIcon: React.ComponentType<{ platform?: string | undefined; className?: string | undefined }>;
  currentUser?: { name: string } | undefined;
  t?: TFunction | undefined;
}

const DraggableEvent: React.FC<DraggableEventProps> = ({
  event,
  isSelected,
  onToggleSelection,
  onEventClick,
  onEventDelete,
  PlatformIcon,
  currentUser,
  t = (key: string, fallback?: string) => fallback ?? key,
}) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: event.id,
    data: { event },
  });

  return (
    <div ref={setNodeRef}>
      <EventCard
        event={event}
        isSelected={isSelected}
        isDragging={isDragging}
        onToggleSelection={onToggleSelection}
        onEventClick={onEventClick}
        onEventDelete={onEventDelete}
        PlatformIcon={PlatformIcon}
        currentUser={currentUser}
        t={t}
        dragHandleProps={{ ...listeners, ...attributes }}
      />
    </div>
  );
};

interface DroppableDayProps {
  day: Date;
  events: CalendarEvent[];
  isCurrentMonth: boolean;
  isTodayDay: boolean;
  isSelected?: boolean;
  selectedEvents: Set<string>;
  onToggleSelection: (eventId: string) => void;
  onEventClick?: ((event: CalendarEvent) => void) | undefined;
  onEventDelete?: ((event: CalendarEvent) => void) | undefined;
  onDaySelect?: ((day: Date) => void) | undefined;
  onAddEvent?: ((date: Date) => void) | undefined;
  PlatformIcon: React.ComponentType<{ platform?: string | undefined; className?: string | undefined }>;
  currentUser?: { name: string } | undefined;
  t?: TFunction | undefined;
}

const DroppableDay: React.FC<DroppableDayProps> = ({
  day,
  events,
  isCurrentMonth,
  isTodayDay,
  isSelected,
  selectedEvents,
  onToggleSelection,
  onEventClick,
  onEventDelete,
  onDaySelect,
  onAddEvent,
  PlatformIcon,
  currentUser,
  t,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: day.toISOString(),
    data: { date: day },
  });

  return (
    <div
      ref={setNodeRef}
      role="button"
      tabIndex={0}
      onClick={() => onDaySelect?.(day)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onDaySelect?.(day);
        }
      }}
      className={`group relative min-h-[140px] cursor-pointer border p-3 transition-all ${isCurrentMonth ? 'border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900' : 'border-gray-100 bg-gray-50 dark:border-gray-800/50 dark:bg-gray-900/50'} ${isTodayDay ? 'ring-2 ring-inset ring-primary-500' : ''} ${isSelected ? 'bg-primary-50/50 ring-2 ring-inset ring-primary-300 dark:bg-primary-900/10' : ''} ${isOver ? 'bg-primary-50 ring-2 ring-inset ring-primary-500 dark:bg-primary-900/20' : ''} hover:bg-gray-50 dark:hover:bg-gray-800/50`}
    >
      {/* Date Header */}
      <div className="mb-2.5 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all ${
              isTodayDay
                ? 'scale-110 bg-primary-600 text-white shadow-lg shadow-primary-500/30'
                : isCurrentMonth
                  ? 'text-gray-700 group-hover:bg-gray-100 dark:text-gray-300 dark:group-hover:bg-gray-800'
                  : 'text-gray-400 dark:text-gray-600'
            } `}
          >
            {format(day, 'd')}
          </span>
          {/* Show weekday on mobile/tablet */}
          <span
            className={`text-xs font-medium uppercase lg:hidden ${isTodayDay ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}`}
          >
            {format(day, 'EEE')}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {isTodayDay && (
            <span className="rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-bold text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
              HOY
            </span>
          )}
          {/* Add event button */}
          {onAddEvent && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const dateWithTime = new Date(day);
                dateWithTime.setHours(9, 0, 0, 0);
                onAddEvent(dateWithTime);
              }}
              className="flex h-6 w-6 items-center justify-center rounded-md bg-primary-50 text-primary-600 transition-all hover:bg-primary-100 dark:bg-primary-900/30 dark:text-primary-400 dark:hover:bg-primary-900/50 shadow-sm"
              title="Agregar evento"
              aria-label="Agregar evento"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Events Stack with Scroll */}
      <div className="custom-scrollbar relative z-10 flex max-h-[120px] flex-col gap-2 overflow-y-auto pr-1">
        {events.map((event) => (
          <DraggableEvent
            key={event.id}
            event={event}
            isSelected={selectedEvents.has(event.id)}
            onToggleSelection={onToggleSelection}
            onEventClick={onEventClick}
            onEventDelete={onEventDelete}
            PlatformIcon={PlatformIcon}
            currentUser={currentUser}
            t={t}
          />
        ))}
      </div>

      {/* Drop indicator overlay */}
      {isOver && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg border-2 border-dashed border-primary-500 bg-primary-50/20 dark:bg-primary-900/20">
          <span className="rounded-lg bg-white/95 px-3 py-1.5 text-sm font-semibold text-primary-600 shadow-lg dark:bg-black/95 dark:text-primary-400">
            Soltar aquí
          </span>
        </div>
      )}
    </div>
  );
};

export const MonthView: React.FC<MonthViewProps> = ({
  currentDate,
  selectedDate,
  events,
  onEventDrop,
  onEventDelete,
  onEventClick,
  onDaySelect,
  onAddEvent,
  selectedEvents,
  onToggleSelection,
  onSelectAll,
  onSelectDay,
  PlatformIcon,
  currentUser,
  t,
}) => {
  const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null);

  // Configure sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start drag
      },
    }),
  );

  // Calculate days in the month
  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  // Calculate empty slots before first day
  const firstDayOfMonth = startOfMonth(currentDate).getDay();
  const startingEmptySlots = Array.from({ length: firstDayOfMonth });

  const handleDragStart = (event: DragStartEvent) => {
    const draggedEvent = event.active.data.current?.event as CalendarEvent;
    setActiveEvent(draggedEvent);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const draggedEvent = active.data.current?.event as CalendarEvent;
      const targetDate = over.data.current?.date as Date;

      if (draggedEvent && targetDate) {
        // Preserve the time from the original event
        const originalDate = parseISO(draggedEvent.start);
        const newDate = new Date(targetDate);
        newDate.setHours(originalDate.getHours());
        newDate.setMinutes(originalDate.getMinutes());
        newDate.setSeconds(originalDate.getSeconds());

        onEventDrop(draggedEvent.id, newDate);
      }
    }

    setActiveEvent(null);
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        {/* Weekday Headers - Desktop Only */}
        <div className="hidden grid-cols-7 border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800 lg:grid">
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
            <div
              key={day}
              className="py-3 text-center text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid min-h-[700px] auto-rows-fr grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
          {/* Empty Slots - Desktop Only */}
          {startingEmptySlots.map((_, i) => (
            <div
              key={`empty-${i}`}
              className="hidden border-b border-r border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50 lg:block"
            />
          ))}

          {/* Actual Days */}
          {days.map((day) => {
            const dayEvents = events.filter((e) => isSameDay(parseISO(e.start), day));
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isTodayDay = isToday(day);

            return (
              <DroppableDay
                key={day.toISOString()}
                day={day}
                events={dayEvents}
                isCurrentMonth={isCurrentMonth}
                isTodayDay={isTodayDay}
                isSelected={selectedDate ? isSameDay(day, selectedDate) : false}
                selectedEvents={selectedEvents}
                onToggleSelection={onToggleSelection}
                onEventClick={onEventClick}
                onEventDelete={onEventDelete}
                onDaySelect={onDaySelect}
                onAddEvent={onAddEvent}
                PlatformIcon={PlatformIcon}
                currentUser={currentUser}
                t={t}
              />
            );
          })}
        </div>
      </div>

      {/* Drag Overlay - shows the dragged item */}
      <DragOverlay>
        {activeEvent && (
          <div className="cursor-grabbing opacity-95">
            <EventCard
              event={activeEvent}
              isSelected={false}
              isDragging={true}
              onToggleSelection={() => {}}
              PlatformIcon={PlatformIcon}
              currentUser={currentUser}
              t={t}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};
