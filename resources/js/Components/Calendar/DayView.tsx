import Button from '@/Components/common/Modern/Button';
import Switch from '@/Components/common/Modern/Switch';
import { isDarkColor } from '@/Utils/Calendar/colorHelpers';
import { formatTimeString } from '@/Utils/formatters';
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
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, Plus } from 'lucide-react';
import { SOCIAL_PLATFORMS } from '@/Constants/ConfigSocialMedia/socialPlatformsConfig';
import { toAddEventDateTime } from '@/Utils/Calendar/dayAddEventDate';
import React, { useState } from 'react';
import type { DayViewProps, DraggableDayEventProps, DroppableHourSlotProps } from '@/types/Calendar/viewTypes';

const DraggableDayEvent: React.FC<DraggableDayEventProps> = ({
  event,
  isSelected,
  onToggleSelection,
  onEventClick,
}) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: event.id,
    data: { event },
  });

  const eventColor = event.color;
  const dark = eventColor ? isDarkColor(eventColor) : false;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        onEventClick?.(event);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onEventClick?.(event);
      }}
      className={`relative cursor-grab rounded-lg p-3 transition-all hover:shadow-lg active:cursor-grabbing ${
        isSelected ? 'ring-primary-500 ring-2 ring-offset-1' : ''
      } ${isDragging ? 'scale-95 opacity-50' : ''}`}
      style={{
        backgroundColor: eventColor || '#f9fafb',
        borderLeft: `4px solid ${eventColor || '#9ca3af'}`,
      }}
    >
      <div className="flex items-start gap-3">
        {/* System Checkbox — stop propagation so click doesn't open modal */}
        <div className="mt-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <Switch
            isSelected={isSelected}
            onChange={() => onToggleSelection(event.id)}
            size="xs"
            variant="animated"
          />
        </div>

        <div className="min-w-0 flex-1">
          {/* Platform icon + title */}
          <div className="flex items-center gap-2">
            {(() => {
              const platforms = event.type === 'post' 
                ? [event.platform?.toLowerCase()].filter(Boolean)
                : (event.extendedProps?.platforms || []).map((p: string) => p.toLowerCase());
              const platform = platforms[0];
              const config = SOCIAL_PLATFORMS[platform as keyof typeof SOCIAL_PLATFORMS];
              const IconComponent = config?.icon;
              return IconComponent ? <IconComponent className="h-4 w-4 shrink-0" /> : null;
            })()}
            <h3 className={`truncate text-sm font-semibold ${dark ? 'text-white' : 'text-gray-900'}`} title={event.title}>
              {event.title}
            </h3>
          </div>

          {/* Time + status */}
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className={`flex items-center gap-1 text-xs ${dark ? 'text-white/75' : 'text-gray-500'}`}>
              <Clock className="h-3 w-3" />
              {formatTimeString(event.start)}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${dark ? 'bg-white/20 text-white' : 'bg-black/10 text-gray-700'}`}
            >
              {event.status}
            </span>
          </div>

          {/* Description */}
          {event.extendedProps?.description && (
            <p className={`mt-1.5 line-clamp-2 text-xs ${dark ? 'text-white/70' : 'text-gray-600'}`}>
              {event.extendedProps.description as string}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── DroppableHourSlot ────────────────────────────────────────────────────────

const DroppableHourSlot: React.FC<DroppableHourSlotProps> = ({
  hour,
  events,
  selectedEvents,
  onToggleSelection,
  onEventClick,
  onAddEvent,
  currentDate,
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: `hour-${hour}`, data: { hour } });

  const handleSlotClick = () => {
    if (!onAddEvent) return;
    onAddEvent(toAddEventDateTime(currentDate, hour));
  };

  return (
    <div
      ref={setNodeRef}
      className={`group flex min-h-[90px] border-b border-gray-100 transition-colors dark:border-neutral-800 ${
        isOver ? 'bg-primary-50 dark:bg-primary-900/20' : ''
      }`}
    >
      {/* Time label — clicking it also opens the add modal */}
      <div className="hover:bg-primary-50 dark:hover:bg-primary-900/20 relative w-20 shrink-0 border-r border-gray-100 bg-gray-50 px-3 py-3 text-right transition-colors dark:border-neutral-800 dark:bg-neutral-900/50">
        <span className="text-xs font-semibold text-gray-500 dark:text-neutral-400">
          {format(new Date().setHours(hour, 0, 0, 0), 'HH:mm')}
        </span>
        {onAddEvent && (
          <Button
            type="button"
            buttonStyle="icon"
            onClick={handleSlotClick}
            variant="ghost"
            className=""
            title="Agregar evento"
            aria-label="Agregar evento"
            icon={<Plus className="h-4 w-4" />}
          >
            {''}
          </Button>
        )}
      </div>

      {/* Events area */}
      <div className="relative flex-1 p-2">
        {/* Botón + grande removido */}

        {events.length > 0 ? (
          <div className="space-y-2">
            {events.map((event) => (
              <DraggableDayEvent
                key={event.id}
                event={event}
                isSelected={selectedEvents.has(event.id)}
                onToggleSelection={onToggleSelection}
                onEventClick={onEventClick}
              />
            ))}
          </div>
        ) : (
          /* Empty slot — click anywhere to add */
          <Button
            type="button"
            onClick={handleSlotClick}
            variant="ghost"
            className="hover:border-primary-300 hover:bg-primary-50 hover:text-primary-500 dark:hover:border-primary-700 dark:hover:bg-primary-900/20 dark:hover:text-primary-400 flex h-full min-h-[66px] w-full items-center justify-center rounded-lg border-2 border-dashed border-transparent text-xs text-gray-400 transition-all dark:text-neutral-600"
            icon={<Plus className="h-4 w-4" />}
          >
            {''}
          </Button>
        )}

        {/* Drop indicator */}
        {isOver && (
          <div className="border-primary-400 bg-primary-50/30 dark:bg-primary-900/20 pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg border-2 border-dashed">
            <span className="text-primary-600 dark:text-primary-400 rounded-lg bg-white/90 px-3 py-1 text-xs font-semibold shadow dark:bg-black/90">
              Soltar aquí
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── DayView ──────────────────────────────────────────────────────────────────

export const DayView: React.FC<DayViewProps> = ({
  currentDate,
  events,
  onEventDrop,
  onEventClick,
  onAddEvent,
  selectedEvents,
  onToggleSelection,
  onDaySelect,
}) => {
  const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getEventsForHour = (hour: number) =>
    events.filter((event) => {
      const d = parseISO(event.start);
      return format(d, 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd') && d.getHours() === hour;
    });

  const handleDragStart = (e: DragStartEvent) => {
    setActiveEvent(e.active.data.current?.['event'] as CalendarEvent);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      const draggedEvent = active.data.current?.['event'] as CalendarEvent;
      const { hour } = over.data.current as { hour: number };
      if (draggedEvent && hour !== undefined) {
        onEventDrop(draggedEvent, toAddEventDateTime(currentDate, hour));
      }
    }
    setActiveEvent(null);
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        {/* ── Header ── */}
        <div
          role="button"
          tabIndex={0}
          className="from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 flex cursor-pointer items-center justify-between border-b border-gray-200 bg-linear-to-r px-6 py-4 transition-colors hover:bg-gray-100/50 dark:border-neutral-800"
          onClick={() => onDaySelect?.(currentDate)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onDaySelect?.(currentDate);
            }
          }}
        >
          <div>
            <p className="text-primary-500 dark:text-primary-400 text-xs font-semibold tracking-wide uppercase">
              {format(currentDate, 'EEEE', { locale: es })}
            </p>
            <h2 className="mt-0.5 text-2xl font-bold text-gray-900 dark:text-white">
              {format(currentDate, "d 'de' MMMM, yyyy", { locale: es })}
            </h2>
          </div>
        </div>

        {/* ── Time slots ── */}
        <div className="max-h-[70vh] overflow-y-auto">
          {hours.map((hour) => (
            <DroppableHourSlot
              key={hour}
              hour={hour}
              events={getEventsForHour(hour)}
              selectedEvents={selectedEvents}
              onToggleSelection={onToggleSelection}
              onEventClick={onEventClick}
              onAddEvent={onAddEvent}
              currentDate={currentDate}
            />
          ))}
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeEvent ? (
          <div className="border-primary-400 w-64 cursor-grabbing rounded-lg border bg-white p-3 opacity-90 shadow-2xl dark:bg-neutral-800">
            <div className="flex items-center gap-2">
              {activeEvent.title}
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
