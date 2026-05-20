import Button from '@/Components/common/Modern/Button';
import { DynamicModal } from '@/Components/common/Modern/DynamicModal';
import { SOCIAL_PLATFORMS } from '@/Constants/ConfigSocialMedia/socialPlatformsConfig';
import { formatTimeString } from '@/Utils/formatters';
import type { CalendarEvent } from '@/types/Calendar/calendar';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    AlertCircle,
    Calendar,
    CalendarClock,
    Clock,
    ExternalLink,
    Globe,
    Lock,
    Megaphone,
    Pencil,
    Trash2,
    User,
} from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DateTimePicker } from './DateTimePicker';

interface EventDetailsModalProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateDate?: (eventId: string, newDate: Date) => Promise<void>;
  onDelete?: (event: CalendarEvent) => void;
  PlatformIcon: React.ComponentType<{ platform?: string; className?: string }>;
  canEdit?: boolean;
  canDelete?: boolean;
}

// ─── Status badge config ─────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  scheduled:   { label: 'Programado',      bg: 'bg-blue-100 dark:bg-blue-900/30',    text: 'text-blue-700 dark:text-blue-300',   dot: 'bg-blue-500' },
  published:   { label: 'Publicado',        bg: 'bg-green-100 dark:bg-green-900/30',  text: 'text-green-700 dark:text-green-300', dot: 'bg-green-500' },
  draft:       { label: 'Borrador',         bg: 'bg-gray-100 dark:bg-gray-800',       text: 'text-gray-600 dark:text-gray-400',   dot: 'bg-gray-400' },
  failed:      { label: 'Fallido',          bg: 'bg-red-100 dark:bg-red-900/30',      text: 'text-red-700 dark:text-red-300',     dot: 'bg-red-500' },
  pending:     { label: 'Pendiente',        bg: 'bg-yellow-100 dark:bg-yellow-900/30',text: 'text-yellow-700 dark:text-yellow-300',dot: 'bg-yellow-500' },
  approved:    { label: 'Aprobado',         bg: 'bg-emerald-100 dark:bg-emerald-900/30',text: 'text-emerald-700 dark:text-emerald-300',dot: 'bg-emerald-500' },
  rejected:    { label: 'Rechazado',        bg: 'bg-red-100 dark:bg-red-900/30',      text: 'text-red-700 dark:text-red-300',     dot: 'bg-red-500' },
  publishing:  { label: 'Publicando...',    bg: 'bg-purple-100 dark:bg-purple-900/30',text: 'text-purple-700 dark:text-purple-300',dot: 'bg-purple-500' },
  retrying:    { label: 'Reintentando',     bg: 'bg-orange-100 dark:bg-orange-900/30',text: 'text-orange-700 dark:text-orange-300',dot: 'bg-orange-500' },
};

function isDarkColor(color: string): boolean {
  const hex = color.replace('#', '');
  if (hex.length < 6) return false;
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
}

// ─── Main component ──────────────────────────────────────────────────────────

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  event,
  isOpen,
  onClose,
  onUpdateDate,
  onDelete,
  PlatformIcon,
  canEdit = true,
  canDelete = false,
}) => {
  const { t } = useTranslation();
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [newDate, setNewDate] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!event) return null;

  const eventDate   = parseISO(event.start);
  const eventColor  = event.color || '#6366f1';
  const isUserEvent = ['user_event', 'event'].includes(String(event.type));
  const statusCfg   = STATUS_CONFIG[event.status] ?? STATUS_CONFIG['draft'];

  // Platform config for social posts
  const platformKey = event.platform?.toLowerCase();
  const platformCfg = platformKey ? SOCIAL_PLATFORMS[platformKey as keyof typeof SOCIAL_PLATFORMS] : null;

  const handleSaveDate = async () => {
    if (!newDate || !onUpdateDate) return;
    setIsSaving(true);
    try {
      await onUpdateDate(event.id, newDate);
      setIsEditingDate(false);
      setNewDate(null);
      onClose();
    } catch {
      // error handled by caller
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    onDelete?.(event);
    onClose();
  };

  const headerTextColor = isDarkColor(eventColor) ? 'text-white' : 'text-gray-900';
  const headerSubColor  = isDarkColor(eventColor) ? 'text-white/70' : 'text-gray-600';

  return (
    <DynamicModal isOpen={isOpen} onClose={onClose} size="lg" title="">
      {/* ── Colored header banner ── */}
      <div
        className="-mx-6 -mt-6 mb-6 rounded-t-lg px-6 pb-5 pt-6"
        style={{ backgroundColor: eventColor }}
      >
        {/* Thumbnail (if available) */}
        {event.extendedProps?.thumbnail && (
          <div className="mb-4 overflow-hidden rounded-lg shadow-lg">
            <img
              src={event.extendedProps.thumbnail as string}
              alt={event.title}
              className="h-36 w-full object-cover"
            />
          </div>
        )}

        {/* Platform + type row */}
        <div className="mb-3 flex items-center gap-2">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full shadow"
            style={{ backgroundColor: isDarkColor(eventColor) ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.08)' }}
          >
            <PlatformIcon
              platform={isUserEvent ? 'user_event' : event.platform}
              className="h-5 w-5"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status badge */}
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusCfg.bg} ${statusCfg.text}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
              {statusCfg.label}
            </span>

            {/* Platform name */}
            {platformCfg && (
              <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold text-white">
                {platformCfg.name}
              </span>
            )}

            {/* User event visibility */}
            {isUserEvent && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold text-white">
                {event.extendedProps?.is_public
                  ? <><Globe className="h-3 w-3" /> Público</>
                  : <><Lock className="h-3 w-3" /> Privado</>
                }
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <h2 className={`text-xl font-bold leading-snug ${headerTextColor}`}>
          {event.title}
        </h2>

        {/* Date + time summary */}
        <div className={`mt-2 flex items-center gap-3 text-sm ${headerSubColor}`}>
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {format(eventDate, "d 'de' MMMM, yyyy", { locale: es })}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {formatTimeString(event.start)}
          </span>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="space-y-4">

        {/* Reschedule section */}
        {canEdit && onUpdateDate && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-neutral-700 dark:bg-theme-bg-secondary">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <CalendarClock className="h-4 w-4 text-primary-500" />
                Reprogramar
              </div>
              {!isEditingDate && (
                <button
                  onClick={() => {
                    setNewDate(eventDate);
                    setIsEditingDate(true);
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-700"
                >
                  <Pencil className="h-3 w-3" />
                  Cambiar fecha
                </button>
              )}
            </div>

            {isEditingDate ? (
              <div className="space-y-3">
                <DateTimePicker
                  selectedDate={newDate || eventDate}
                  onChange={(date) => setNewDate(date)}
                  minDate={new Date()}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveDate} disabled={isSaving || !newDate}>
                    {isSaving ? 'Guardando...' : 'Guardar fecha'}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => { setIsEditingDate(false); setNewDate(null); }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Actualmente programado para el{' '}
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {format(eventDate, "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es })}
                </span>
              </p>
            )}
          </div>
        )}

        {/* Description */}
        {event.extendedProps?.description && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-neutral-700 dark:bg-theme-bg-secondary">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
              Descripción
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {event.extendedProps.description as string}
            </p>
          </div>
        )}

        {/* Campaign */}
        {event.campaign && (
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-neutral-700 dark:bg-theme-bg-secondary">
            <Megaphone className="h-5 w-5 shrink-0 text-primary-500" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                Campaña
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{event.campaign}</p>
            </div>
          </div>
        )}

        {/* Creator */}
        {(event.user?.name || event.extendedProps?.user_name) && (
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-neutral-700 dark:bg-theme-bg-secondary">
            <User className="h-5 w-5 shrink-0 text-gray-400" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                Creado por
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {event.user?.name || (event.extendedProps?.user_name as string)}
              </p>
            </div>
          </div>
        )}

        {/* Link to publication in editor */}
        {event.extendedProps?.slug && (
          <a
            href={`${event.extendedProps.slug}?id=${event.publicationId || event.extendedProps.publication_id}`}
            className="flex items-center gap-3 rounded-xl border border-primary-200 bg-primary-50 p-4 transition hover:bg-primary-100 dark:border-primary-800/40 dark:bg-primary-900/20 dark:hover:bg-primary-900/30"
          >
            <Pencil className="h-5 w-5 shrink-0 text-primary-600 dark:text-primary-400" />
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary-500 dark:text-primary-400">
                Editar publicación
              </p>
              <p className="text-sm font-medium text-primary-700 dark:text-primary-300">
                Abrir en el editor
              </p>
            </div>
            <ExternalLink className="h-4 w-4 text-primary-400" />
          </a>
        )}

        {/* Published link on social network */}
        {event.extendedProps?.post_url && (
          <a
            href={event.extendedProps.post_url as string}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 transition hover:bg-green-100 dark:border-green-800/40 dark:bg-green-900/20 dark:hover:bg-green-900/30"
          >
            <ExternalLink className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-green-500 dark:text-green-400">
                Ver en la red social
              </p>
              <p className="text-sm font-medium text-green-700 dark:text-green-300">
                Ver publicación real
              </p>
            </div>
            <ExternalLink className="h-4 w-4 text-green-400" />
          </a>
        )}

        {/* Error message */}
        {event.status === 'failed' && event.extendedProps?.error_message && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800/40 dark:bg-red-900/20">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-red-500">
                Error en el envío
              </p>
              <p className="text-sm text-red-700 dark:text-red-300">
                {event.extendedProps.error_message as string}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Footer actions ── */}
      <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-neutral-800">
        <div>
          {canDelete && onDelete && (
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              icon={<Trash2 className="h-4 w-4" />}
            >
              Eliminar
            </Button>
          )}
        </div>
        <Button variant="secondary" onClick={onClose}>
          Cerrar
        </Button>
      </div>
    </DynamicModal>
  );
};
