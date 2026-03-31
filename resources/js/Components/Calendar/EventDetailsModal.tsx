import Button from '@/Components/common/Modern/Button';
import { DynamicModal } from '@/Components/common/Modern/DynamicModal';
import { formatTime } from '@/Utils/formatDate';
import type { CalendarEvent } from '@/types/calendar';
import { format, parseISO } from 'date-fns';
import {
    AlertCircle,
    Calendar,
    Clock,
    Edit2,
    ExternalLink,
    Link as LinkIcon,
    Tag,
    Trash2,
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

  const eventDate = parseISO(event.start);

  const handleSaveDate = async () => {
    if (!newDate || !onUpdateDate) return;

    setIsSaving(true);
    try {
      await onUpdateDate(event.id, newDate);
      setIsEditingDate(false);
      setNewDate(null);
      onClose();
    } catch (error) {
      console.error('Error updating event date:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(event);
      onClose();
    }
  };

  return (
    <DynamicModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('calendar.eventDetails.title') || 'Detalles del Evento'}
      size="lg"
    >
      <div className="space-y-6">
        {/* Event Header */}
        <div className="flex items-start gap-4">
          <div
            className="h-20 w-1 flex-shrink-0 rounded-full"
            style={{ backgroundColor: event.color }}
          />
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-2">
              <PlatformIcon
                platform={
                  ['user_event', 'event'].includes(String(event.type))
                    ? 'user_event'
                    : event.platform
                }
                className="h-6 w-6"
              />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{event.title}</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium capitalize text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                {t(`status.${event.status}`, event.status)}
              </span>
              {event.type && (
                <span className="rounded-full bg-primary-100 px-3 py-1 text-sm font-medium capitalize text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                  {event.type.replace('_', ' ')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Event Details */}
        <div className="space-y-4">
          {/* Date and Time */}
          <div className="flex items-start gap-3">
            <Calendar className="mt-0.5 h-5 w-5 text-gray-400" />
            <div className="flex-1">
              <div className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                {t('calendar.eventDetails.dateTime') || 'Fecha y Hora'}
              </div>
              {isEditingDate ? (
                <div className="space-y-3">
                  <DateTimePicker
                    selectedDate={newDate || eventDate}
                    onChange={(date) => setNewDate(date)}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveDate} disabled={isSaving || !newDate}>
                      {isSaving
                        ? t('common.saving') || 'Guardando...'
                        : t('common.save') || 'Guardar'}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setIsEditingDate(false);
                        setNewDate(null);
                      }}
                    >
                      {t('common.cancel') || 'Cancelar'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="text-base text-gray-900 dark:text-white">
                    {format(eventDate, "EEEE, d 'de' MMMM 'de' yyyy")}
                  </div>
                  {canEdit && onUpdateDate && (
                    <button
                      onClick={() => setIsEditingDate(true)}
                      className="rounded-md p-1 text-gray-400 transition-all hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-900/20"
                      title={t('common.edit') || 'Editar'}
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
              <div className="mt-1 flex items-center gap-1 text-gray-600 dark:text-gray-400">
                <Clock className="h-4 w-4" />
                <span className="text-sm">{formatTime(event.start)}</span>
              </div>
            </div>
          </div>

          {/* Platform */}
          {event.platform && (
            <div className="flex items-start gap-3">
              <Tag className="mt-0.5 h-5 w-5 text-gray-400" />
              <div className="flex-1">
                <div className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t('calendar.eventDetails.platform') || 'Plataforma'}
                </div>
                <div className="text-base capitalize text-gray-900 dark:text-white">
                  {event.platform}
                </div>
              </div>
            </div>
          )}

          {/* Campaign */}
          {event.campaign && (
            <div className="flex items-start gap-3">
              <Tag className="mt-0.5 h-5 w-5 text-gray-400" />
              <div className="flex-1">
                <div className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t('calendar.eventDetails.campaign') || 'Campaña'}
                </div>
                <div className="text-base text-gray-900 dark:text-white">{event.campaign}</div>
              </div>
            </div>
          )}

          {/* Description */}
          {event.extendedProps?.description && (
            <div className="flex items-start gap-3">
              <LinkIcon className="mt-0.5 h-5 w-5 text-gray-400" />
              <div className="flex-1">
                <div className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t('calendar.eventDetails.description') || 'Descripción'}
                </div>
                <div className="text-base text-gray-900 dark:text-white">
                  {event.extendedProps.description}
                </div>
              </div>
            </div>
          )}

          {/* Link to publication (Internal) */}
          {event.extendedProps?.slug && (
            <div className="flex items-start gap-3">
              <LinkIcon className="mt-0.5 h-5 w-5 text-gray-400" />
              <div className="flex-1">
                <div className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t('calendar.eventDetails.viewPublication') || 'Ver en Intellipost'}
                </div>
                <a
                  href={`${event.extendedProps.slug}?id=${event.publicationId || event.extendedProps.publication_id}`}
                  className="text-base text-primary-600 hover:underline dark:text-primary-400"
                >
                  {t('calendar.eventDetails.openInEditor') || 'Abrir en el editor'}
                </a>
              </div>
            </div>
          )}

          {/* External platform link */}
          {event.extendedProps?.post_url && (
            <div className="flex items-start gap-3 rounded-lg border border-primary-100 bg-primary-50 p-3 dark:border-primary-800/30 dark:bg-primary-900/10">
              <ExternalLink className="mt-0.5 h-5 w-5 text-primary-600 dark:text-primary-400" />
              <div className="flex-1">
                <div className="mb-1 text-sm font-medium text-primary-700 dark:text-primary-300">
                  {t('calendar.eventDetails.publishedLink') || 'Publicado en la red social'}
                </div>
                <a
                  href={event.extendedProps.post_url}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:underline dark:text-primary-400"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('calendar.eventDetails.viewOnPlatform') || 'Ver publicación real'}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}

          {/* Error Message */}
          {event.status === 'failed' && event.extendedProps?.error_message && (
            <div className="flex items-start gap-3 rounded-lg border border-red-100 bg-red-50 p-3 dark:border-red-900/30 dark:bg-red-900/10">
              <AlertCircle className="mt-0.5 h-5 w-5 text-red-600 dark:text-red-400" />
              <div className="flex-1">
                <div className="mb-1 text-sm font-medium text-red-700 dark:text-red-300">
                  {t('calendar.eventDetails.errorTitle') || 'Error en el envío'}
                </div>
                <div className="text-sm font-medium italic text-red-600 dark:text-red-400">
                  {event.extendedProps.error_message}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-700">
          <div>
            {canDelete && onDelete && (
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
                icon={<Trash2 className="h-4 w-4" />}
              >
                {t('common.delete') || 'Eliminar'}
              </Button>
            )}
          </div>
          <Button variant="secondary" onClick={onClose}>
            {t('common.close') || 'Cerrar'}
          </Button>
        </div>
      </div>
    </DynamicModal>
  );
};
