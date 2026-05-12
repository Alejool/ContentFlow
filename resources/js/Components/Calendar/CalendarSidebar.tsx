import Checkbox from '@/Components/common/Modern/Checkbox';
import { SOCIAL_PLATFORMS } from '@/Constants/ConfigSocialMedia/socialPlatformsConfig';
import type { CalendarEvent } from '@/types/Calendar/calendar';
import { formatTimeString } from '@/Utils/formatters';
import { isSameDay, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import { AlertCircle, Calendar as CalendarIcon, Lock, Trash2 } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

interface CalendarSidebarProps {
  selectedDate: Date;
  events: CalendarEvent[];
  currentUser?: { id: number; name: string };
  remoteLocks?: Record<number, any>;
  selectedEvents?: Set<string>;
  onEventClick: (event: CalendarEvent) => void;
  onDeleteEvent: (event: CalendarEvent) => void;
  onToggleSelection?: (eventId: string) => void;
  actionSlot?: React.ReactNode;
}

/**
 * Determina si un color es oscuro
 */
function isDarkColor(color: string): boolean {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
}

/**
 * Sidebar con diseño consistente con EventCard
 */
export const CalendarSidebar: React.FC<CalendarSidebarProps> = ({
  selectedDate,
  events,
  currentUser,
  remoteLocks = {},
  selectedEvents = new Set(),
  onEventClick,
  onDeleteEvent,
  onToggleSelection,
  actionSlot,
}) => {
  const { t } = useTranslation();

  const dayEvents = events
    .filter((e) => isSameDay(parseISO(e.start), selectedDate))
    .sort((a, b) => a.start.localeCompare(b.start));

  return (
    <div className="flex h-full flex-col rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-neutral-800/50 dark:bg-neutral-800/30">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-start justify-between">
          <h4 className="flex items-center gap-2 text-lg font-black text-gray-900 dark:text-white">
            <CalendarIcon className="text-primary-500 h-5 w-5" />
            <span className="truncate">
              {selectedDate.toLocaleDateString(undefined, {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}
            </span>
          </h4>
          {actionSlot}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="bg-primary-50 text-primary-500 dark:bg-primary-900/30 rounded-full px-2 py-0.5 text-[10px] font-black tracking-widest uppercase">
            {dayEvents.length}&nbsp;{t('calendar.events.count')}
          </span>
        </div>
      </div>

      {/* Event list */}
      <div className="max-h-[calc(100vh-400px)] flex-1 scrollbar-thin space-y-2 overflow-y-auto pr-1">
        {dayEvents.length > 0 ? (
          dayEvents.map((event, index) => {
            const isUserEvent = event.type === 'user_event';
            const canDelete = isUserEvent && Number(event.user?.id) === Number(currentUser?.id);
            const lockId = event.extendedProps.publication_id || Number(event.resourceId);
            const isLocked = !!remoteLocks[lockId];
            const isSelected = selectedEvents.has(event.id);
            const eventColor = event.backgroundColor || event.color || '#3B82F6';

            const hasNoPlatforms =
              event.hasNoPlatforms ||
              (event.type === 'post' &&
                (!event.extendedProps?.platforms || event.extendedProps.platforms.length === 0));

            const platforms =
              event.type === 'post'
                ? [event.platform?.toLowerCase()].filter(Boolean)
                : (event.extendedProps?.platforms || []).map((p: string) => p.toLowerCase());

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onEventClick(event)}
                className={`
                  group relative cursor-pointer overflow-hidden rounded-lg border
                  transition-all duration-150 hover:shadow-md
                  ${isSelected ? 'ring-2 ring-primary-500 ring-offset-1' : 'border-transparent'}
                `}
                style={{
                  backgroundColor: eventColor,
                  borderLeftWidth: '4px',
                  borderLeftColor: eventColor,
                }}
              >
                {hasNoPlatforms && (
                  <div className="absolute right-2 top-2 z-20 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500">
                    <AlertCircle className="h-3 w-3 text-white" />
                  </div>
                )}

                {isLocked && (
                  <div className="absolute left-2 top-2 z-20 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500">
                    <Lock className="h-3 w-3 text-white" />
                  </div>
                )}

                <div className="relative z-10 flex items-center gap-2 p-3">
                  {onToggleSelection && (
                    <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => onToggleSelection(event.id)}
                        size="sm"
                        variant="primary"
                      />
                    </div>
                  )}

                  <span
                    className="flex-shrink-0 text-xs font-bold tabular-nums"
                    style={{
                      color: isDarkColor(eventColor) ? '#ffffff' : '#374151',
                    }}
                  >
                    {formatTimeString(event.start).split(' ')[0]}
                  </span>

                  <div className="min-w-0 flex-1">
                    <h5
                      className="truncate text-sm font-semibold leading-tight"
                      style={{
                        color: isDarkColor(eventColor) ? '#ffffff' : '#111827',
                      }}
                      title={event.title}
                    >
                      {event.title}
                    </h5>

                    {(event.user?.name || event.extendedProps?.user_name) && (
                      <p
                        className="text-[10px]"
                        style={{
                          color: isDarkColor(eventColor)
                            ? 'rgba(255,255,255,0.7)'
                            : 'rgba(0,0,0,0.5)',
                        }}
                      >
                        {Number(event.user?.id) === Number(currentUser?.id)
                          ? t('common.me') || 'Yo'
                          : event.user?.name || event.extendedProps?.user_name}
                      </p>
                    )}
                  </div>

                  {platforms.length > 0 && (
                    <div className="flex-shrink-0">
                      {(() => {
                        const platform = platforms[0];
                        const config = SOCIAL_PLATFORMS[platform as keyof typeof SOCIAL_PLATFORMS];
                        const IconComponent = config?.icon;
                        if (!IconComponent) return null;

                        return (
                          <div
                            className="flex h-5 w-5 items-center justify-center rounded"
                            style={{
                              backgroundColor: 'rgba(0,0,0,0.1)',
                            }}
                            title={config.name + (platforms.length > 1 ? ` +${platforms.length - 1}` : '')}
                          >
                            <IconComponent
                              className="h-3.5 w-3.5"
                              style={{
                                color: isDarkColor(eventColor) ? '#ffffff' : undefined,
                              }}
                            />
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {canDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteEvent(event);
                      }}
                      className="flex-shrink-0 rounded p-1 opacity-0 transition-all hover:bg-red-500 hover:text-white group-hover:opacity-100"
                      style={{
                        color: isDarkColor(eventColor) ? '#ffffff' : '#ef4444',
                      }}
                      title={t('common.delete') || 'Eliminar'}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="rounded-lg border-2 border-dashed border-gray-200 bg-white/50 py-12 text-center dark:border-neutral-800 dark:bg-neutral-900/10">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 dark:bg-neutral-800">
              <CalendarIcon className="h-6 w-6 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-400">{t('calendar.events.empty')}</p>
          </div>
        )}
      </div>
    </div>
  );
};
