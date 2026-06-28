import Switch from '@/Components/common/Modern/Switch';
import { SOCIAL_PLATFORMS } from '@/Constants/ConfigSocialMedia/socialPlatformsConfig';
import { isDarkColor } from '@/Utils/Calendar/colorHelpers';
import { formatTimeString } from '@/Utils/formatters';
import type { CalendarEvent } from '@/types/Calendar/calendar';
import { motion } from 'framer-motion';
import type { TFunction } from 'i18next';
import { AlertCircle, Trash2 } from 'lucide-react';
import React from 'react';

interface EventCardProps {
  event: CalendarEvent;
  isSelected: boolean;
  isDragging?: boolean;
  onToggleSelection: (eventId: string) => void;
  onEventClick?: ((event: CalendarEvent) => void) | undefined;
  onEventDelete?: ((event: CalendarEvent) => void) | undefined;
  currentUser?: { name: string } | undefined;
  t?: TFunction | undefined;
  dragHandleProps?: any;
  showDay?: boolean;
}

/**
 * Componente de tarjeta de evento individual
 * Muestra información del evento con checkbox, plataformas, hora y estado
 */
export const EventCard: React.FC<EventCardProps> = ({
  event,
  isSelected,
  isDragging = false,
  onToggleSelection,
  onEventClick,
  onEventDelete,
  currentUser,
  t = (key: string, fallback?: string) => fallback ?? key,
  dragHandleProps,
  showDay,
}) => {
  // Check if publication has no platforms assigned
  const hasNoPlatforms =
    event.hasNoPlatforms ||
    (event.type === 'post' &&
      (!event.extendedProps?.platforms || event.extendedProps.platforms.length === 0));

  // Get platforms array
  const platforms =
    event.type === 'post'
      ? [event.platform?.toLowerCase()].filter(Boolean)
      : (event.extendedProps?.platforms || []).map((p: string) => p.toLowerCase());

  // Get primary platform for color scheme
  const primaryPlatform = platforms[0];
  const platformConfig =
    primaryPlatform && SOCIAL_PLATFORMS[primaryPlatform as keyof typeof SOCIAL_PLATFORMS];

  // Get event color (for user events)
  const eventColor = event.backgroundColor || event.color;

  // Determine if delete button should be shown
  const canDelete =
    onEventDelete &&
    (['user_event', 'event'].includes(String(event.type))
      ? !event.extendedProps?.is_public || event.extendedProps?.user_name === currentUser?.name
      : false);

  // Get border and background colors
  const getBorderColor = () => {
    if (hasNoPlatforms) return 'border-orange-300 dark:border-orange-600';
    if (eventColor) return 'border-gray-200 dark:border-neutral-800';
    if (platformConfig) return `${platformConfig.borderColor} ${platformConfig.darkBorderColor}`;
    return 'border-gray-200 dark:border-neutral-800';
  };

  const getBackgroundColor = () => {
    if (hasNoPlatforms) return 'bg-orange-50 dark:bg-orange-900/10';
    if (eventColor) return 'bg-white dark:bg-theme-bg-secondary';
    if (platformConfig) return `${platformConfig.bgClass} ${platformConfig.darkColor}`;
    return 'bg-white dark:bg-theme-bg-secondary';
  };

  const getAccentColor = () => {
    if (hasNoPlatforms) return 'bg-orange-500';
    if (eventColor) return eventColor;
    if (platformConfig) return platformConfig.color.replace('bg-', '');
    return 'bg-gray-400';
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 2 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -2 }}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.15 }}
      {...dragHandleProps}
      onClick={(e) => {
        e.stopPropagation();
        onEventClick?.(event);
      }}
      className={`group/card relative cursor-grab overflow-hidden rounded-md border-l-[3px] transition-all duration-150 hover:shadow-md active:cursor-grabbing ${isSelected ? 'ring-primary-500 ring-2 ring-offset-1' : 'border-transparent'} ${isDragging ? 'scale-95 opacity-50' : ''} `}
      style={{
        backgroundColor: eventColor || '#ffffff',
        borderLeftColor:
          eventColor || (platformConfig ? platformConfig.color.replace('bg-', '#') : '#9ca3af'),
      }}
    >
      {/* Fondo con color de plataforma si no hay color de evento */}
      {!eventColor && platformConfig && (
        <div className={`absolute inset-0 opacity-10 ${platformConfig.bgClass}`} />
      )}

      {/* Indicador de advertencia */}
      {hasNoPlatforms && (
        <div className="absolute top-1 right-1 z-20 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500">
          <AlertCircle className="h-3 w-3 text-white" />
        </div>
      )}

      {/* Contenido principal */}
      <div className="relative z-10 flex items-center gap-1.5 p-1.5">
        {/* Switch */}
        <div
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          role="presentation"
          className="shrink-0"
        >
          <Switch
            isSelected={isSelected}
            onChange={() => onToggleSelection(event.id)}
            size="xs"
            variant="animated"
          />
        </div>

        {/* Hora y Día */}
        <div className="flex shrink-0 flex-col items-start leading-none">
          {showDay && (
            <span className={`text-[8px] font-black uppercase tracking-tighter opacity-70 ${eventColor ? (isDarkColor(eventColor) ? 'text-white' : 'text-gray-500') : 'text-gray-500'}`}>
              {new Intl.DateTimeFormat('es-ES', { weekday: 'short' }).format(new Date(event.start))}
            </span>
          )}
          <span className={`text-[10px] font-bold tabular-nums ${eventColor ? (isDarkColor(eventColor) ? 'text-white' : 'text-gray-700') : 'text-gray-700'}`}>
            {formatTimeString(event.start).split(' ')[0]}
          </span>
        </div>

        {/* Título */}
        <h4 className={`min-w-0 flex-1 truncate text-xs leading-tight font-semibold ${eventColor ? (isDarkColor(eventColor) ? 'text-white' : 'text-gray-900') : 'text-gray-900'}`} title={event.title}>
          {event.title}
        </h4>

        {/* Iconos de plataformas (solo primero) */}
        {platforms.length > 0 && (
          <div className="shrink-0">
            {(() => {
              const platform = platforms[0];
              const config = SOCIAL_PLATFORMS[platform as keyof typeof SOCIAL_PLATFORMS];
              const IconComponent = config?.icon;
              if (!IconComponent) return null;

              return (
                <div
                  className={`flex h-4 w-4 items-center justify-center rounded ${eventColor ? 'bg-black/10' : ''}`}
                  title={config.name + (platforms.length > 1 ? ` +${platforms.length - 1}` : '')}
                >
                  <IconComponent className={`h-3 w-3 ${eventColor ? (isDarkColor(eventColor) ? 'text-white' : '') : ''}`} />
                </div>
              );
            })()}
          </div>
        )}

        {/* Botón eliminar */}
        {canDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEventDelete(event);
            }}
            className={`shrink-0 rounded p-0.5 opacity-0 transition-all group-hover/card:opacity-100 hover:bg-red-500 hover:text-white ${eventColor ? (isDarkColor(eventColor) ? 'text-white' : 'text-red-500') : 'text-red-500'}`}
            title="Eliminar"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default EventCard;
