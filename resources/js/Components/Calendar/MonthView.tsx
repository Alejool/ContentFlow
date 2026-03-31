import { SOCIAL_PLATFORMS } from '@/Constants/socialPlatformsConfig';
import type { CalendarEvent } from '@/types/calendar';
import { formatTime } from '@/Utils/formatDate';
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
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
import { Clock, Trash2 } from 'lucide-react';
import React, { useState } from 'react';

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
  t?: (key: string, fallback?: string) => string;
}

interface DraggableEventProps {
  event: CalendarEvent;
  isSelected: boolean;
  onToggleSelection: (eventId: string) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onEventDelete?: (event: CalendarEvent) => void;
  PlatformIcon: React.ComponentType<{ platform?: string; className?: string }>;
  currentUser?: { name: string };
  t?: (key: string, fallback?: string) => string;
}

const DraggableEvent: React.FC<DraggableEventProps> = ({
  event,
  isSelected,
  onToggleSelection,
  onEventClick,
  onEventDelete,
  PlatformIcon,
  currentUser,
  t = (key, fallback) => fallback || key,
}) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: event.id,
    data: { event },
  });

  // Check if publication has no platforms assigned
  const hasNoPlatforms =
    event.hasNoPlatforms ||
    (event.type === 'post' &&
      (!event.extendedProps?.platforms || event.extendedProps.platforms.length === 0));

  // Get platforms array - for posts, use the single platform, for publications use all platforms
  const platforms =
    event.type === 'post'
      ? [event.platform?.toLowerCase()].filter(Boolean)
      : (event.extendedProps?.platforms || []).map((p: string) => p.toLowerCase());

  // Get primary platform for color scheme (first platform or the single platform)
  const primaryPlatform = platforms[0];
  const platformConfig =
    primaryPlatform && SOCIAL_PLATFORMS[primaryPlatform as keyof typeof SOCIAL_PLATFORMS];

  // Determine if delete button should be shown
  const canDelete =
    onEventDelete &&
    (['user_event', 'event'].includes(String(event.type))
      ? !event.extendedProps?.is_public || event.extendedProps?.user_name === currentUser?.name
      : false); // Don't allow delete for posts from calendar

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      role="button"
      tabIndex={0}
      onClick={() => onEventClick?.(event)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onEventClick?.(event);
      }}
      className={`group/card relative cursor-grab overflow-hidden rounded-lg border-2 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:cursor-grabbing ${isSelected ? 'ring-2 ring-primary-500 ring-offset-2' : ''} ${isDragging ? 'scale-95 opacity-50' : ''} ${hasNoPlatforms ? 'border-orange-300 bg-orange-50 dark:border-orange-600 dark:bg-orange-900/10' : ''} ${platformConfig && !hasNoPlatforms ? `${platformConfig.borderColor} ${platformConfig.darkBorderColor} ${platformConfig.bgClass} ${platformConfig.darkColor}` : !hasNoPlatforms ? 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800' : ''} `}
    >
      {/* Status Indicator Bar with platform color */}
      <div
        className={`absolute bottom-0 left-0 top-0 w-1.5 ${platformConfig ? platformConfig.color : hasNoPlatforms ? 'bg-orange-500' : 'bg-gray-400'}`}
      />

      {/* Warning indicator for publications without platforms */}
      {hasNoPlatforms && (
        <div
          className="absolute right-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white shadow-md"
          title="Sin redes sociales asignadas"
        >
          !
        </div>
      )}

      <div className="flex items-start gap-2.5 p-3 pl-4">
        {/* Checkbox for selection */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            onToggleSelection(event.id);
          }}
          onClick={(e) => e.stopPropagation()}
          className="mt-0.5 h-4 w-4 flex-shrink-0 cursor-pointer rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />

        {/* Platform Icons - Show all platforms for publications */}
        <div className="mt-0.5 flex flex-shrink-0 items-center gap-1">
          {platforms.length > 0 ? (
            platforms.map((platform) => {
              const config = SOCIAL_PLATFORMS[platform as keyof typeof SOCIAL_PLATFORMS];
              const IconComponent = config?.icon;
              if (!IconComponent) return null;

              return (
                <div
                  key={platform}
                  className={`${config.textColor} ${config.darkTextColor}`}
                  title={config.name}
                >
                  <IconComponent className="h-4 w-4" />
                </div>
              );
            })
          ) : (
            // Fallback for user events
            <PlatformIcon
              platform={
                ['user_event', 'event'].includes(String(event.type)) ? 'user_event' : event.platform
              }
              className="h-4 w-4 text-gray-400 dark:text-gray-500"
            />
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="mb-1 truncate text-sm font-semibold leading-tight text-gray-800 dark:text-gray-100">
            {event.title}
          </div>

          {/* Creator info */}
          {event.extendedProps?.user_name && (
            <div className="mb-1 text-[10px] text-gray-500 dark:text-gray-400">
              Creador: {event.extendedProps.user_name}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span
              className={`flex items-center gap-1 text-[11px] font-medium ${platformConfig ? platformConfig.textColor + ' ' + platformConfig.darkTextColor : 'text-gray-500 dark:text-gray-400'}`}
            >
              <Clock className="h-3 w-3" />
              {formatTime(event.start)}
            </span>
            {event.status && (
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${event.status === 'published' || event.status === 'posted' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''} ${event.status === 'scheduled' || event.status === 'pending' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : ''} ${event.status === 'draft' ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' : ''} ${event.status === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : ''} ${event.status === 'event' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : ''} `}
              >
                {t(`status.${event.status}`, event.status)}
              </span>
            )}
            {hasNoPlatforms && (
              <span className="rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                Sin redes
              </span>
            )}
          </div>
        </div>

        {/* Delete button */}
        {canDelete && (
          <button
            onClick={(ev) => {
              ev.stopPropagation();
              onEventDelete(event);
            }}
            className="flex-shrink-0 self-start rounded-md p-1.5 text-gray-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover/card:opacity-100 dark:hover:bg-red-900/20"
            title="Eliminar"
          >
            <Trash2 className="h-4 w-4" />
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
  t?: (key: string, fallback?: string) => string;
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
  t,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: day.toISOString(),
    data: { date: day },
  });

  return (
    <div
      ref={setNodeRef}
      className={`group relative min-h-[140px] border p-3 transition-all ${isCurrentMonth ? 'border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900' : 'border-gray-100 bg-gray-50 dark:border-gray-800/50 dark:bg-gray-900/50'} ${isTodayDay ? 'ring-2 ring-inset ring-primary-500' : ''} ${isOver ? 'bg-primary-50 ring-2 ring-inset ring-primary-500 dark:bg-primary-900/20' : ''} hover:bg-gray-50 dark:hover:bg-gray-800/50`}
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

        {isTodayDay && (
          <span className="rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-bold text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
            HOY
          </span>
        )}
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
  events,
  onEventDrop,
  onEventDelete,
  onEventClick,
  selectedEvents,
  onToggleSelection,
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
                selectedEvents={selectedEvents}
                onToggleSelection={onToggleSelection}
                onEventClick={onEventClick}
                onEventDelete={onEventDelete}
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
        {activeEvent
          ? (() => {
              const platforms =
                activeEvent.type === 'post'
                  ? [activeEvent.platform?.toLowerCase()].filter(Boolean)
                  : (activeEvent.extendedProps?.platforms || []).map((p: string) =>
                      p.toLowerCase(),
                    );

              const primaryPlatform = platforms[0];
              const platformConfig =
                primaryPlatform &&
                SOCIAL_PLATFORMS[primaryPlatform as keyof typeof SOCIAL_PLATFORMS];

              return (
                <div
                  className={`cursor-grabbing rounded-lg border-2 p-3 opacity-95 shadow-2xl ${platformConfig ? `${platformConfig.borderColor} ${platformConfig.bgClass}` : 'border-primary-500 bg-white dark:bg-gray-800'}`}
                >
                  <div className="flex items-center gap-2">
                    {/* Show all platform icons */}
                    <div className="flex items-center gap-1">
                      {platforms.length > 0 ? (
                        platforms.map((platform) => {
                          const config =
                            SOCIAL_PLATFORMS[platform as keyof typeof SOCIAL_PLATFORMS];
                          const IconComponent = config?.icon;
                          if (!IconComponent) return null;

                          return (
                            <div key={platform} className={`${config.textColor}`}>
                              <IconComponent className="h-5 w-5" />
                            </div>
                          );
                        })
                      ) : (
                        <PlatformIcon
                          platform={
                            ['user_event', 'event'].includes(String(activeEvent.type))
                              ? 'user_event'
                              : activeEvent.platform
                          }
                          className="h-5 w-5"
                        />
                      )}
                    </div>
                    <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                      {activeEvent.title}
                    </div>
                  </div>
                </div>
              );
            })()
          : null}
      </DragOverlay>
    </DndContext>
  );
};
