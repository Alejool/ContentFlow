import { EventCard } from '@/Components/Calendar/EventCard';
import type { CalendarEvent } from '@/types/Calendar/calendar';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import {
  eachDayOfInterval,
  endOfMonth,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
} from 'date-fns';
import React, { useState } from 'react';
import { DroppableDay } from '@/Components/Calendar/MonthView/DroppableDay';
import type { MonthViewProps } from '@/types/Calendar/monthView';
import { WeekdayHeaderRow } from '@/Components/Calendar/MonthView/WeekdayHeaderRow';

export type { MonthViewProps, MonthViewPlatformIcon, MonthViewPlatformIconProps } from '@/types/Calendar/monthView';

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
  onSelectAll: _onSelectAll,
  onSelectDay: _onSelectDay,
  currentUser,
  t,
}) => {
  const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  const firstDayOfMonth = startOfMonth(currentDate).getDay();
  const startingEmptySlots = Array.from({ length: firstDayOfMonth });

  const handleDragStart = (event: DragStartEvent) => {
    const dragged = event.active.data.current?.['event'] as CalendarEvent | undefined;
    setActiveEvent(dragged ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const draggedEvent = active.data.current?.['event'] as CalendarEvent | undefined;
      const targetDate = over.data.current?.['date'] as Date | undefined;

      if (draggedEvent && targetDate) {
        const originalDate = parseISO(draggedEvent.start);
        const newDate = new Date(targetDate);
        newDate.setHours(originalDate.getHours());
        newDate.setMinutes(originalDate.getMinutes());
        newDate.setSeconds(originalDate.getSeconds());
        void onEventDrop(draggedEvent.id, newDate);
      }
    }

    setActiveEvent(null);
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <WeekdayHeaderRow />

        <div className="grid min-h-175 auto-rows-fr grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
          {startingEmptySlots.map((_, i) => (
            <div
              key={`empty-${i}`}
              className="hidden border-b border-r border-gray-200 bg-gray-50 dark:border-neutral-800 dark:bg-neutral-900/50 lg:block"
            />
          ))}

          {days.map((day) => (
            <DroppableDay
              key={day.toISOString()}
              day={day}
              events={events.filter((e) => isSameDay(parseISO(e.start), day))}
              isCurrentMonth={isSameMonth(day, currentDate)}
              isTodayDay={isToday(day)}
              isSelected={selectedDate ? isSameDay(day, selectedDate) : false}
              selectedEvents={selectedEvents}
              onToggleSelection={onToggleSelection}
              onEventClick={onEventClick}
              onEventDelete={onEventDelete}
              onDaySelect={onDaySelect}
              onAddEvent={onAddEvent}
              currentUser={currentUser}
              t={t}
            />
          ))}
        </div>
      </div>

      <DragOverlay>
        {activeEvent && (
          <div className="cursor-grabbing opacity-95">
            <EventCard
              event={activeEvent}
              isSelected={false}
              isDragging
              onToggleSelection={() => {}}
              currentUser={currentUser}
              t={t}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};
