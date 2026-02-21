import React, { useState } from 'react';
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
import { Clock, Trash2 } from 'lucide-react';
import { CalendarEvent } from '@/types/calendar';
import { formatTime } from '@/Utils/formatDate';
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

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventDrop: (eventId: string, newDate: Date) => Promise<void>;
  onEventDelete?: (event: CalendarEvent) => void;
  onEventClick?: (event: CalendarEvent) => void;
  selectedEvents: Set<string>;
  onToggleSelection: (eventId: string) => void;
  PlatformIcon: React.ComponentType<{ platform?: string; className?: string }>;
  currentUser?: { name: string };
}

interface DraggableEventProps {
  event: CalendarEvent;
  isSelected: boolean;
  onToggleSelection: (eventId: string) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onEventDelete?: (event: CalendarEvent) => void;
  PlatformIcon: React.ComponentType<{ platform?: string; className?: string }>;
  currentUser?: { name: string };
}

const DraggableEvent: React.FC<DraggableEventProps> = ({
  event,
  isSelected,
  onToggleSelection,
  onEventClick,
  onEventDelete,
  PlatformIcon,
  currentUser,
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
        relative overflow-hidden
        rounded-lg border border-gray-100 dark:border-gray-700/50
        bg-white dark:bg-gray-800 shadow-sm hover:shadow-md
        cursor-grab active:cursor-grabbing transition-all hover:-translate-y-0.5
        group/card
        ${isSelected ? 'ring-2 ring-primary-500' : ''}
        ${isDragging ? 'opacity-50' : ''}
      `}
    >
      {/* Status Indicator Bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ backgroundColor: event.color }}
      />

      <div className="p-2 pl-3 flex items-start gap-2">
        {/* Checkbox for selection */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            onToggleSelection(event.id);
          }}
          onClick={(e) => e.stopPropagation()}
          className="mt-0.5 flex-shrink-0"
        />

        {/* Icon */}
        <div className="mt-0.5 flex-shrink-0 text-gray-400 dark:text-gray-500">
          <PlatformIcon
            platform={
              ['user_event', 'event'].includes(String(event.type))
                ? 'user_event'
                : event.platform
            }
            className="w-3.5 h-3.5"
          />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate leading-tight">
            {event.title}
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
            <span className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-0.5">
              <Clock className="w-3 h-3" />
              {formatTime(event.start)}
            </span>
            {event.status && (
              <span className="text-[9px] px-1 rounded-sm bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 capitalize">
                {event.status}
              </span>
            )}
          </div>
        </div>

        {/* Delete button - only show for user's own events */}
        {onEventDelete &&
          ['user_event', 'event'].includes(String(event.type)) &&
          (!event.extendedProps?.is_public ||
            event.extendedProps?.user_name === currentUser?.name) && (
            <button
              onClick={(ev) => {
                ev.stopPropagation();
                onEventDelete(event);
              }}
              className="flex-shrink-0 p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all self-start"
              title="Eliminar evento"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
      </div>
    </div>
  );
};

interface DroppableDayProps {
  day: Date;
  events: CalendarEvent[];
  isCurrentMonth: boolean;
  isTodayDay: boolean;
  selectedEvents: Set<string>;
  onToggleSelection: (eventId: string) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onEventDelete?: (event: CalendarEvent) => void;
  PlatformIcon: React.ComponentType<{ platform?: string; className?: string }>;
  currentUser?: { name: string };
}

const DroppableDay: React.FC<DroppableDayProps> = ({
  day,
  events,
  isCurrentMonth,
  isTodayDay,
  selectedEvents,
  onToggleSelection,
  onEventClick,
  onEventDelete,
  PlatformIcon,
  currentUser,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: day.toISOString(),
    data: { date: day },
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        relative p-2 min-h-[140px] transition-all group
        ${isCurrentMonth ? 'bg-white dark:bg-black' : 'bg-gray-50/30 dark:bg-black/30'}
        ${isTodayDay ? 'bg-primary-50/10 dark:bg-primary-900/5' : ''}
        ${isOver ? 'bg-primary-100/50 dark:bg-primary-900/20 ring-2 ring-primary-500' : ''}
        hover:bg-gray-50 dark:hover:bg-gray-800/50
      `}
    >
      {/* Date Header */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <span
            className={`
              text-sm font-medium w-8 h-8 flex items-center justify-center rounded-full transition-colors
              ${
                isTodayDay
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
                  : 'text-gray-500 dark:text-gray-400 group-hover:bg-gray-100 dark:group-hover:bg-gray-800'
              }
            `}
          >
            {format(day, 'd')}
          </span>
          {/* Show weekday on mobile/tablet */}
          <span className="lg:hidden text-xs font-medium text-gray-400 uppercase">
            {format(day, 'EEE')}
          </span>
        </div>

        {isTodayDay && (
          <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400">
            HOY
          </span>
        )}
      </div>

      {/* Events Stack with Scroll */}
      <div className="flex flex-col gap-2 relative z-10 max-h-[120px] overflow-y-auto pr-1 custom-scrollbar">
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
          />
        ))}
      </div>

      {/* Drop indicator overlay */}
      {isOver && (
        <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-primary-500 rounded-lg bg-primary-50/10 dark:bg-primary-900/10 flex items-center justify-center">
          <span className="text-xs font-medium text-primary-600 dark:text-primary-400 bg-white/90 dark:bg-black/90 px-2 py-1 rounded">
            Soltar aquí
          </span>
        </div>
      )}
    </div>
  );
};

export const MonthView: React.FC<MonthViewProps> = ({
  currentDate,
  events,
  onEventDrop,
  onEventDelete,
  onEventClick,
  selectedEvents,
  onToggleSelection,
  PlatformIcon,
  currentUser,
}) => {
  const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null);

  // Configure sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start drag
      },
    })
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
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden shadow-sm bg-gray-50 dark:bg-black/50">
        {/* Weekday Headers - Desktop Only */}
        <div className="hidden lg:grid grid-cols-7 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
            <div
              key={day}
              className="py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 auto-rows-fr min-h-[700px] bg-gray-200 dark:bg-gray-800 gap-px">
          {/* Empty Slots - Desktop Only */}
          {startingEmptySlots.map((_, i) => (
            <div
              key={`empty-${i}`}
              className="hidden lg:block bg-gray-50/50 dark:bg-black/50 p-2"
            />
          ))}

          {/* Actual Days */}
          {days.map((day) => {
            const dayEvents = events.filter((e) =>
              isSameDay(parseISO(e.start), day)
            );
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isTodayDay = isToday(day);

            return (
              <DroppableDay
                key={day.toISOString()}
                day={day}
                events={dayEvents}
                isCurrentMonth={isCurrentMonth}
                isTodayDay={isTodayDay}
                selectedEvents={selectedEvents}
                onToggleSelection={onToggleSelection}
                onEventClick={onEventClick}
                onEventDelete={onEventDelete}
                PlatformIcon={PlatformIcon}
                currentUser={currentUser}
              />
            );
          })}
        </div>
      </div>

      {/* Drag Overlay - shows the dragged item */}
      <DragOverlay>
        {activeEvent ? (
          <div className="rounded-lg border border-primary-500 bg-white dark:bg-gray-800 shadow-2xl p-2 opacity-90 cursor-grabbing">
            <div className="flex items-center gap-2">
              <PlatformIcon
                platform={
                  ['user_event', 'event'].includes(String(activeEvent.type))
                    ? 'user_event'
                    : activeEvent.platform
                }
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
