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
import { SOCIAL_PLATFORMS } from '@/Constants/socialPlatformsConfig';
import { useTranslation } from 'react-i18next';
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
  const hasNoPlatforms = event.hasNoPlatforms || 
    (event.type === 'post' && 
     (!event.extendedProps?.platforms || event.extendedProps.platforms.length === 0));

  // Get platforms array - for posts, use the single platform, for publications use all platforms
  const platforms = event.type === 'post' 
    ? [event.platform?.toLowerCase()].filter(Boolean)
    : (event.extendedProps?.platforms || []).map((p: string) => p.toLowerCase());

  // Get primary platform for color scheme (first platform or the single platform)
  const primaryPlatform = platforms[0];
  const platformConfig = primaryPlatform && SOCIAL_PLATFORMS[primaryPlatform as keyof typeof SOCIAL_PLATFORMS];

  // Determine if delete button should be shown
  const canDelete = onEventDelete && (
    ['user_event', 'event'].includes(String(event.type)) 
      ? (!event.extendedProps?.is_public || event.extendedProps?.user_name === currentUser?.name)
      : false // Don't allow delete for posts from calendar
  );

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onEventClick?.(event)}
      className={`
        relative overflow-hidden
        rounded-lg border-2
        shadow-sm hover:shadow-lg
        cursor-grab active:cursor-grabbing transition-all duration-200 hover:-translate-y-0.5
        group/card
        ${isSelected ? 'ring-2 ring-primary-500 ring-offset-2' : ''}
        ${isDragging ? 'opacity-50 scale-95' : ''}
        ${hasNoPlatforms ? 'border-orange-300 dark:border-orange-600 bg-orange-50 dark:bg-orange-900/10' : ''}
        ${platformConfig && !hasNoPlatforms ? `${platformConfig.borderColor} ${platformConfig.darkBorderColor} ${platformConfig.bgClass} ${platformConfig.darkColor}` : !hasNoPlatforms ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800' : ''}
      `}
    >
      {/* Status Indicator Bar with platform color */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1.5 ${platformConfig ? platformConfig.color : hasNoPlatforms ? 'bg-orange-500' : 'bg-gray-400'}`}
      />

      {/* Warning indicator for publications without platforms */}
      {hasNoPlatforms && (
        <div className="absolute right-2 top-2 bg-orange-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow-md z-10" title="Sin redes sociales asignadas">
          !
        </div>
      )}

      <div className="p-3 pl-4 flex items-start gap-2.5">
        {/* Checkbox for selection */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            onToggleSelection(event.id);
          }}
          onClick={(e) => e.stopPropagation()}
          className="mt-0.5 flex-shrink-0 w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
        />

        {/* Platform Icons - Show all platforms for publications */}
        <div className="flex items-center gap-1 mt-0.5 flex-shrink-0">
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
                  <IconComponent className="w-4 h-4" />
                </div>
              );
            })
          ) : (
            // Fallback for user events
            <PlatformIcon
              platform={
                ['user_event', 'event'].includes(String(event.type))
                  ? 'user_event'
                  : event.platform
              }
              className="w-4 h-4 text-gray-400 dark:text-gray-500"
            />
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate leading-tight mb-1">
            {event.title}
          </div>
          
          {/* Creator info */}
          {event.extendedProps?.user_name && (
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">
              Creador: {event.extendedProps.user_name}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className={`text-[11px] flex items-center gap-1 font-medium ${platformConfig ? platformConfig.textColor + ' ' + platformConfig.darkTextColor : 'text-gray-500 dark:text-gray-400'}`}>
              <Clock className="w-3 h-3" />
              {formatTime(event.start)}
            </span>
            {event.status && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wide
                ${event.status === 'published' || event.status === 'posted' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : ''}
                ${event.status === 'scheduled' || event.status === 'pending' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : ''}
                ${event.status === 'draft' ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400' : ''}
                ${event.status === 'failed' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : ''}
                ${event.status === 'event' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' : ''}
              `}>
                {t(`status.${event.status}`, event.status)}
              </span>
            )}
            {hasNoPlatforms && (
              <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
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
            className="flex-shrink-0 p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all self-start opacity-0 group-hover/card:opacity-100"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
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
      className={`
        relative p-3 min-h-[140px] transition-all group border
        ${isCurrentMonth ? 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800' : 'bg-gray-50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800/50'}
        ${isTodayDay ? 'ring-2 ring-primary-500 ring-inset' : ''}
        ${isOver ? 'bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-500 ring-inset' : ''}
        hover:bg-gray-50 dark:hover:bg-gray-800/50
      `}
    >
      {/* Date Header */}
      <div className="flex justify-between items-start mb-2.5">
        <div className="flex items-center gap-2">
          <span
            className={`
              text-sm font-semibold w-8 h-8 flex items-center justify-center rounded-full transition-all
              ${
                isTodayDay
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30 scale-110'
                  : isCurrentMonth
                  ? 'text-gray-700 dark:text-gray-300 group-hover:bg-gray-100 dark:group-hover:bg-gray-800'
                  : 'text-gray-400 dark:text-gray-600'
              }
            `}
          >
            {format(day, 'd')}
          </span>
          {/* Show weekday on mobile/tablet */}
          <span className={`lg:hidden text-xs font-medium uppercase ${isTodayDay ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}`}>
            {format(day, 'EEE')}
          </span>
        </div>

        {isTodayDay && (
          <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/30 px-2 py-0.5 rounded-full">
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
            t={t}
          />
        ))}
      </div>

      {/* Drop indicator overlay */}
      {isOver && (
        <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-primary-500 rounded-lg bg-primary-50/20 dark:bg-primary-900/20 flex items-center justify-center">
          <span className="text-sm font-semibold text-primary-600 dark:text-primary-400 bg-white/95 dark:bg-black/95 px-3 py-1.5 rounded-lg shadow-lg">
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
      <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden shadow-sm bg-white dark:bg-gray-900">
        {/* Weekday Headers - Desktop Only */}
        <div className="hidden lg:grid grid-cols-7 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 auto-rows-fr min-h-[700px]">
          {/* Empty Slots - Desktop Only */}
          {startingEmptySlots.map((_, i) => (
            <div
              key={`empty-${i}`}
              className="hidden lg:block bg-gray-50 dark:bg-gray-900/50 border-r border-b border-gray-200 dark:border-gray-800"
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
                t={t}
              />
            );
          })}
        </div>
      </div>

      {/* Drag Overlay - shows the dragged item */}
      <DragOverlay>
        {activeEvent ? (
          (() => {
            const platforms = activeEvent.type === 'post' 
              ? [activeEvent.platform?.toLowerCase()].filter(Boolean)
              : (activeEvent.extendedProps?.platforms || []).map((p: string) => p.toLowerCase());
            
            const primaryPlatform = platforms[0];
            const platformConfig = primaryPlatform && SOCIAL_PLATFORMS[primaryPlatform as keyof typeof SOCIAL_PLATFORMS];
            
            return (
              <div className={`rounded-lg border-2 shadow-2xl p-3 opacity-95 cursor-grabbing ${platformConfig ? `${platformConfig.borderColor} ${platformConfig.bgClass}` : 'border-primary-500 bg-white dark:bg-gray-800'}`}>
                <div className="flex items-center gap-2">
                  {/* Show all platform icons */}
                  <div className="flex items-center gap-1">
                    {platforms.length > 0 ? (
                      platforms.map((platform) => {
                        const config = SOCIAL_PLATFORMS[platform as keyof typeof SOCIAL_PLATFORMS];
                        const IconComponent = config?.icon;
                        if (!IconComponent) return null;
                        
                        return (
                          <div 
                            key={platform}
                            className={`${config.textColor}`}
                          >
                            <IconComponent className="w-5 h-5" />
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
                        className="w-5 h-5"
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
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
