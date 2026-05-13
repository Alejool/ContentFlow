import Switch from '@/Components/common/Modern/Switch';
import type { CalendarEvent } from '@/types/Calendar/calendar';
import { formatTimeString } from '@/Utils/formatters';
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
import React, { useState } from 'react';

// ─── helpers ─────────────────────────────────────────────────────────────────

function isDarkColor(color: string): boolean {
  const hex = color.replace('#', '');
  if (hex.length < 6) return false;
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
}

// ─── interfaces ──────────────────────────────────────────────────────────────

interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventDrop: (event: CalendarEvent, newDate: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onDeleteEvent?: (event: CalendarEvent) => void;
  onAddEvent?: (date: Date) => void;
  selectedEvents: Set<string>;
  onToggleSelection: (eventId: string) => void;
  PlatformIcon: React.ComponentType<{ platform?: string; className?: string }>;
}

// ─── DraggableDayEvent ────────────────────────────────────────────────────────

interface DraggableDayEventProps {
  event: CalendarEvent;
  isSelected: boolean;
  onToggleSelection: (eventId: string) => void;
  onEventClick?: (event: CalendarEvent) => void;
  PlatformIcon: React.ComponentType<{ platform?: string; className?: string }>;
}

const DraggableDayEvent: React.FC<DraggableDayEventProps> = ({
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

  const eventColor = event.color;
  const dark = eventColor ? isDarkColor(eventColor) : false;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      role="button"
      tabIndex={0}
      onClick={() => onEventClick?.(event)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onEventClick?.(event); }}
      className={`relative cursor-grab rounded-xl p-3 active:cursor-grabbing transition-all hover:shadow-lg ${
        isSelected ? 'ring-2 ring-primary-500 ring-offset-1' : ''
      } ${isDragging ? 'opacity-50 scale-95' : ''}`}
      style={{
        backgroundColor: eventColor || '#f9fafb',
        borderLeft: `4px solid ${eventColor || '#9ca3af'}`,
      }}
    >
      <div className="flex items-start gap-3">
        {/* System Checkbox — stop propagation so click doesn't open modal */}
        <div
          className="mt-0.5 flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <Switch
            isSelected={isSelected}
            onChange={() => onToggleSelection(event.id)}
            size="sm"
            variant="animated"
          />
        </div>

        <div className="min-w-0 flex-1">
          {/* Platform icon + title */}
          <div className="flex items-center gap-2">
            <PlatformIcon platform={event.extendedProps?.platform} className="h-4 w-4 flex-shrink-0" />
            <h3
              className="truncate text-sm font-semibold"
              style={{ color: dark ? '#ffffff' : '#111827' }}
              title={event.title}
            >
              {event.title}
            </h3>
          </div>

          {/* Time + status */}
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span
              className="flex items-center gap-1 text-xs"
              style={{ color: dark ? 'rgba(255,255,255,0.75)' : '#6b7280' }}
            >
              <Clock className="h-3 w-3" />
              {formatTimeString(event.start)}
            </span>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize"
              style={{
                backgroundColor: dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.08)',
                color: dark ? '#ffffff' : '#374151',
              }}
            >
              {event.status}
            </span>
          </div>

          {/* Description */}
          {event.extendedProps?.description && (
            <p
              className="mt-1.5 line-clamp-2 text-xs"
              style={{ color: dark ? 'rgba(255,255,255,0.7)' : '#4b5563' }}
            >
              {event.extendedProps.description as string}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── DroppableHourSlot ────────────────────────────────────────────────────────

interface DroppableHourSlotProps {
  hour: number;
  events: CalendarEvent[];
  selectedEvents: Set<string>;
  onToggleSelection: (eventId: string) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onAddEvent?: (date: Date) => void;
  currentDate: Date;
  PlatformIcon: React.ComponentType<{ platform?: string; className?: string }>;
}

const DroppableHourSlot: React.FC<DroppableHourSlotProps> = ({
  hour,
  events,
  selectedEvents,
  onToggleSelection,
  onEventClick,
  onAddEvent,
  currentDate,
  PlatformIcon,
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: `hour-${hour}`, data: { hour } });

  const handleSlotClick = () => {
    if (!onAddEvent) return;
    const date = new Date(currentDate);
    date.setHours(hour, 0, 0, 0);
    onAddEvent(date);
  };

  return (
    <div
      ref={setNodeRef}
      className={`group flex min-h-[90px] border-b border-gray-100 transition-colors dark:border-gray-800 ${
        isOver ? 'bg-primary-50 dark:bg-primary-900/20' : ''
      }`}
    >
      {/* Time label — clicking it also opens the add modal */}
      <div className="relative w-20 flex-shrink-0 border-r border-gray-100 bg-gray-50 px-3 py-3 text-right transition-colors hover:bg-primary-50 dark:border-gray-800 dark:bg-gray-900/50 dark:hover:bg-primary-900/20">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
          {format(new Date().setHours(hour, 0, 0, 0), 'HH:mm')}
        </span>
        {onAddEvent && (
          <button
            type="button"
            onClick={handleSlotClick}
            className="absolute left-1 top-2.5 flex h-5 w-5 items-center justify-center rounded bg-primary-50 text-primary-600 transition-all hover:bg-primary-100 dark:bg-primary-900/30 dark:text-primary-400 dark:hover:bg-primary-900/50 shadow-sm"
            title={`Agregar evento a las ${hour.toString().padStart(2, '0')}:00`}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
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
                PlatformIcon={PlatformIcon}
              />
            ))}
          </div>
        ) : (
          /* Empty slot — click anywhere to add */
          <button
            type="button"
            onClick={handleSlotClick}
            className="flex h-full min-h-[66px] w-full items-center justify-center rounded-lg border-2 border-dashed border-transparent text-xs text-gray-400 transition-all hover:border-primary-300 hover:bg-primary-50 hover:text-primary-500 dark:text-gray-600 dark:hover:border-primary-700 dark:hover:bg-primary-900/20 dark:hover:text-primary-400"
          >
            <span className="flex items-center gap-1">
              <Plus className="h-4 w-4" />
              Agregar evento
            </span>
          </button>
        )}

        {/* Drop indicator */}
        {isOver && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg border-2 border-dashed border-primary-400 bg-primary-50/30 dark:bg-primary-900/20">
            <span className="rounded-lg bg-white/90 px-3 py-1 text-xs font-semibold text-primary-600 shadow dark:bg-black/90 dark:text-primary-400">
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
  onDeleteEvent: _onDeleteEvent,
  onAddEvent,
  selectedEvents,
  onToggleSelection,
  PlatformIcon,
}) => {
  const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getEventsForHour = (hour: number) =>
    events.filter((event) => {
      const d = parseISO(event.start);
      return (
        format(d, 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd') &&
        d.getHours() === hour
      );
    });

  const handleDragStart = (e: DragStartEvent) => {
    setActiveEvent(e.active.data.current?.event as CalendarEvent);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
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
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-black">

        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-primary-50 to-primary-100 px-6 py-4 dark:border-gray-700 dark:from-primary-900/20 dark:to-primary-800/20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-500 dark:text-primary-400">
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
              PlatformIcon={PlatformIcon}
            />
          ))}
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeEvent ? (
          <div className="w-64 cursor-grabbing rounded-xl border border-primary-400 bg-white p-3 opacity-90 shadow-2xl dark:bg-gray-800">
            <div className="flex items-center gap-2">
              <PlatformIcon platform={activeEvent.extendedProps?.platform} className="h-4 w-4" />
              <span className="truncate text-sm font-semibold text-gray-800 dark:text-gray-200">
                {activeEvent.title}
              </span>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
