import React, { useState } from 'react';
import { CalendarEvent } from '@/types/calendar';
import { DynamicModal } from '@/Components/common/Modern/DynamicModal';
import Button from '@/Components/common/Modern/Button';
import { DateTimePicker } from './DateTimePicker';
import { formatTime } from '@/Utils/formatDate';
import { format, parseISO } from 'date-fns';
import { Calendar, Clock, Tag, Link as LinkIcon, Edit2, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
            className="w-1 h-20 rounded-full flex-shrink-0"
            style={{ backgroundColor: event.color }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <PlatformIcon
                platform={
                  ['user_event', 'event'].includes(String(event.type))
                    ? 'user_event'
                    : event.platform
                }
                className="w-6 h-6"
              />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {event.title}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                {event.status}
              </span>
              {event.type && (
                <span className="px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-sm font-medium text-primary-700 dark:text-primary-300 capitalize">
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
            <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                {t('calendar.eventDetails.dateTime') || 'Fecha y Hora'}
              </div>
              {isEditingDate ? (
                <div className="space-y-3">
                  <DateTimePicker
                    selected={newDate || eventDate}
                    onChange={(date) => setNewDate(date)}
                    showTimeSelect
                    dateFormat="dd/MM/yyyy HH:mm"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveDate}
                      disabled={isSaving || !newDate}
                    >
                      {isSaving ? t('common.saving') || 'Guardando...' : t('common.save') || 'Guardar'}
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
                      className="p-1 rounded-md text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
                      title={t('common.edit') || 'Editar'}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
              <div className="flex items-center gap-1 mt-1 text-gray-600 dark:text-gray-400">
                <Clock className="w-4 h-4" />
                <span className="text-sm">{formatTime(event.start)}</span>
              </div>
            </div>
          </div>

          {/* Platform */}
          {event.platform && (
            <div className="flex items-start gap-3">
              <Tag className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {t('calendar.eventDetails.platform') || 'Plataforma'}
                </div>
                <div className="text-base text-gray-900 dark:text-white capitalize">
                  {event.platform}
                </div>
              </div>
            </div>
          )}

          {/* Campaign */}
          {event.campaign && (
            <div className="flex items-start gap-3">
              <Tag className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {t('calendar.eventDetails.campaign') || 'Campaña'}
                </div>
                <div className="text-base text-gray-900 dark:text-white">
                  {event.campaign}
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          {event.extendedProps?.description && (
            <div className="flex items-start gap-3">
              <LinkIcon className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {t('calendar.eventDetails.description') || 'Descripción'}
                </div>
                <div className="text-base text-gray-900 dark:text-white">
                  {event.extendedProps.description}
                </div>
              </div>
            </div>
          )}

          {/* Link to publication */}
          {event.extendedProps?.slug && event.type === 'publication' && (
            <div className="flex items-start gap-3">
              <LinkIcon className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {t('calendar.eventDetails.viewPublication') || 'Ver Publicación'}
                </div>
                <a
                  href={`/content`}
                  className="text-base text-primary-600 dark:text-primary-400 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('calendar.eventDetails.openPublication') || 'Abrir publicación'}
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
          <div>
            {canDelete && onDelete && (
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
                icon={<Trash2 className="w-4 h-4" />}
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
