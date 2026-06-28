import Button from '@/Components/common/Modern/Button';
import Checkbox from '@/Components/common/Modern/Checkbox';
import { SOCIAL_PLATFORMS } from '@/Constants/ConfigSocialMedia/socialPlatformsConfig';
import { isDarkColor } from '@/Utils/Calendar/colorHelpers';
import { formatDateString, formatTimeString } from '@/Utils/formatters';
import type { CalendarEvent } from '@/types/Calendar/calendar';
import { isSameDay, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import { AlertCircle, Calendar as CalendarIcon, CalendarArrowUp, CheckSquare, Lock, Trash2, X } from 'lucide-react';
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
  onSelectAll?: () => void;
  onClearSelection?: () => void;
  onBulkDelete?: () => void;
  onBulkMove?: () => void;
  actionSlot?: React.ReactNode;
}

export const CalendarSidebar: React.FC<CalendarSidebarProps> = ({
  selectedDate,
  events,
  currentUser,
  remoteLocks = {},
  selectedEvents = new Set(),
  onEventClick,
  onDeleteEvent,
  onToggleSelection,
  onSelectAll,
  onClearSelection,
  onBulkDelete,
  onBulkMove,
  actionSlot,
}) => {
  const { t } = useTranslation();

  const dayEvents = events
    .filter((e) => isSameDay(parseISO(e.start), selectedDate))
    .sort((a, b) => a.start.localeCompare(b.start));

  const nSelected = selectedEvents.size;
  const hasBulkActions = nSelected > 0 && (onBulkDelete || onBulkMove);

  return (
    <div className="flex h-full flex-col rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-neutral-800/50 dark:bg-neutral-900">
      {/* Header */}
      <div className="mb-3">
        <div className="flex items-start justify-between">
          <h4 className="flex items-center gap-2 text-lg font-black text-gray-900 dark:text-white">
            <CalendarIcon className="text-primary-500 h-5 w-5" />
            <span className="truncate">
              {formatDateString(selectedDate, {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}
            </span>
          </h4>
          {actionSlot}
        </div>

        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="bg-primary-50 text-primary-500 dark:bg-primary-900/30 rounded-full px-2 py-0.5 text-[10px] font-black tracking-widest uppercase">
            {dayEvents.length}&nbsp;{t('calendar.events.count')}
          </span>

          {dayEvents.length > 0 && onSelectAll && !nSelected && (
            <button
              onClick={onSelectAll}
              className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-neutral-800 dark:hover:text-gray-300"
            >
              <CheckSquare className="h-3 w-3" />
              {t('calendar.selectAll') || 'Sel. todo'}
            </button>
          )}
        </div>

        {/* Bulk action bar — visible when events are selected */}
        {hasBulkActions && (
          <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-primary-50 px-2.5 py-2 dark:bg-primary-900/20">
            <span className="mr-1 text-xs font-bold text-primary-600 dark:text-primary-400">
              {nSelected} sel.
            </span>
            {onBulkMove && (
              <Button
                type="button"
                size="xs"
                variant="secondary"
                buttonStyle="outline"
                shadow="none"
                onClick={onBulkMove}
                icon={CalendarArrowUp}
                className="!py-1 !text-[11px]"
              >
                {t('calendar.move') || 'Mover'}
              </Button>
            )}
            {onBulkDelete && (
              <Button
                type="button"
                size="xs"
                variant="danger"
                buttonStyle="outline"
                shadow="none"
                onClick={onBulkDelete}
                icon={Trash2}
                className="!py-1 !text-[11px]"
              >
                {t('common.delete') || 'Eliminar'}
              </Button>
            )}
            {onClearSelection && (
              <button
                onClick={onClearSelection}
                className="ml-auto rounded p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                title={t('calendar.clearSelection') || 'Limpiar selección'}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
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
            const eventColor = (event as any).backgroundColor || event.color || '#3B82F6';

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
                className={`group relative cursor-pointer overflow-hidden rounded-lg border-l-4 transition-all duration-150 hover:shadow-md ${isSelected ? 'ring-primary-500 ring-2 ring-offset-1' : 'border-transparent'} `}
                style={{
                  backgroundColor: eventColor,
                  borderLeftColor: eventColor,
                }}
              >
                {hasNoPlatforms && (
                  <div className="absolute top-2 right-2 z-20 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500">
                    <AlertCircle className="h-3 w-3 text-white" />
                  </div>
                )}

                {isLocked && (
                  <div className="absolute top-2 left-2 z-20 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500">
                    <Lock className="h-3 w-3 text-white" />
                  </div>
                )}

                <div className="relative z-10 flex items-center gap-2 p-3">
                  {onToggleSelection && (
                    <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => onToggleSelection(event.id)}
                        size="sm"
                        variant="primary"
                      />
                    </div>
                  )}

                  <span
                    className={`shrink-0 text-xs font-bold tabular-nums ${isDarkColor(eventColor) ? 'text-white' : 'text-gray-700'}`}
                  >
                    {formatTimeString(event.start).split(' ')[0]}
                  </span>

                  <div className="min-w-0 flex-1">
                    <h5
                      className={`truncate text-sm leading-tight font-semibold ${isDarkColor(eventColor) ? 'text-white' : 'text-gray-900'}`}
                      title={event.title}
                    >
                      {event.title}
                    </h5>

                    {(event.user?.name || event.extendedProps?.user_name) && (
                      <p
                        className={`text-[10px] ${isDarkColor(eventColor) ? 'text-white/70' : 'text-black/50'}`}
                      >
                        {Number(event.user?.id) === Number(currentUser?.id)
                          ? t('common.me') || 'Yo'
                          : event.user?.name || event.extendedProps?.user_name}
                      </p>
                    )}
                  </div>

                  {platforms.length > 0 && (
                    <div className="shrink-0">
                      {(() => {
                        const platform = platforms[0];
                        const config = SOCIAL_PLATFORMS[platform as keyof typeof SOCIAL_PLATFORMS];
                        const IconComponent = config?.icon;
                        if (!IconComponent) return null;

                        return (
                          <div
                            className="flex h-5 w-5 items-center justify-center rounded bg-black/10"
                            title={
                              config.name +
                              (platforms.length > 1 ? ` +${platforms.length - 1}` : '')
                            }
                          >
                            <IconComponent
                              className={`h-3.5 w-3.5 ${isDarkColor(eventColor) ? 'text-white' : ''}`}
                            />
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {canDelete && (
                    <Button
                      type="button"
                      buttonStyle="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteEvent(event);
                      }}
                      className="bg-neutral-100/10! backdrop-blur-2xl hover:bg-neutral-100/40!"
                      title="Eliminar evento"
                      aria-label="Eliminar evento"
                      icon={<Trash2 className="h-3.5 w-3.5 text-neutral-900!" />}
                    >
                      {''}
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="rounded-lg border-2 border-dashed border-gray-200 bg-white/50 py-12 text-center dark:border-neutral-800 dark:bg-neutral-900">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 dark:bg-neutral-900">
              <CalendarIcon className="h-6 w-6 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-400">{t('calendar.events.empty')}</p>
          </div>
        )}
      </div>
    </div>
  );
};
