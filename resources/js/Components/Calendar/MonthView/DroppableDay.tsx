import Button from '@/Components/common/Modern/Button';
import { useDayAddEventClick } from '@/Hooks/calendar/useDayAddEventClick';
import { useDroppable } from '@dnd-kit/core';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';
import React from 'react';
import { DraggableEvent } from '@/Components/Calendar/MonthView/DraggableEvent';
import type { DroppableDayProps } from '@/types/Calendar/monthView';

export const DroppableDay: React.FC<DroppableDayProps> = ({
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
  currentUser,
  t,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: day.toISOString(),
    data: { date: day },
  });

  const handleAddEventClick = useDayAddEventClick(day, onAddEvent);

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
      className={`group relative min-h-35 cursor-pointer border p-3 transition-all ${isCurrentMonth ? 'border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900' : 'border-gray-100 bg-gray-50 dark:border-neutral-800/50 dark:bg-neutral-900/50'} ${isTodayDay ? 'ring-2 ring-inset ring-primary-500' : ''} ${isSelected ? 'bg-primary-50/50 ring-2 ring-inset ring-primary-300 dark:bg-primary-900/10' : ''} ${isOver ? 'bg-primary-50 ring-2 ring-inset ring-primary-500 dark:bg-primary-900/20' : ''} hover:bg-gray-50 dark:hover:bg-neutral-900/50`}
    >
      <div className="mb-2.5 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all ${
              isTodayDay
                ? 'scale-110 bg-primary-600 text-white shadow-lg shadow-primary-500/30'
                : isCurrentMonth
                  ? 'text-gray-700 group-hover:bg-gray-100 dark:text-neutral-300 dark:group-hover:bg-neutral-900'
                  : 'text-gray-400 dark:text-neutral-600'
            } `}
          >
            {format(day, 'd')}
          </span>
          <span
            className={`text-xs font-medium uppercase lg:hidden ${isTodayDay ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-neutral-400'}`}
          >
            {format(day, 'EEE')}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {isTodayDay && (
            <span className="rounded-full bg-primary-100 px-2 py-0.5 text-2xs font-bold text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
              HOY
            </span>
          )}
          {onAddEvent && (
            <Button
              type="button"
              buttonStyle="icon"
              variant="ghost"
              size="md"
              shadow="none"
              icon={Plus}
              onClick={handleAddEventClick}
              title="Agregar evento"
              aria-label="Agregar evento"
              className=""
            >
              {''}
            </Button>
          )}
        </div>
      </div>

      <div className="custom-scrollbar relative z-10 flex max-h-3 flex-col gap-2 overflow-y-auto pr-1">
        {events.map((event) => (
          <DraggableEvent
            key={event.id}
            event={event}
            isSelected={selectedEvents.has(event.id)}
            onToggleSelection={onToggleSelection}
            onEventClick={onEventClick}
            onEventDelete={onEventDelete}
            currentUser={currentUser}
            t={t}
          />
        ))}
      </div>

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
