import { useCalendar } from '@/Hooks/Calendar/useCalendar';
import type { CalendarEvent } from '@/types/Calendar/calendar';
import { validateDate } from '@/Utils/common/dateValidation';
import { isSameDay, parseISO } from 'date-fns';
import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export interface DeleteConfirmationState {
  isOpen: boolean;
  event: CalendarEvent | null;
}

/**
 * Composable hook that wraps useCalendar and adds local UI state
 * (modals, delete confirmations) for ModernCalendar.
 */
export const useModernCalendar = () => {
  const { t } = useTranslation();

  const calendar = useCalendar();

  // ── Local UI state ──────────────────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEventForModal, setSelectedEventForModal] = useState<CalendarEvent | undefined>(
    undefined,
  );
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmationState>({
    isOpen: false,
    event: null,
  });
  const [showExternalCalendars, setShowExternalCalendars] = useState(false);

  // ── Navigation ──────────────────────────────────────────────────────────────
  const navigateToDate = useCallback(
    (date: Date) => {
      setSelectedDate(date);
      calendar.goToMonth(date.getMonth(), date.getFullYear());
    },
    [calendar],
  );

  // ── Event handlers ──────────────────────────────────────────────────────────

  /** Handle drag-and-drop for all views. */
  const handleDrop = useCallback(
    async (event: CalendarEvent, newDate: Date) => {
      const validation = validateDate(newDate);
      if (!validation.isValid) {
        if (validation.isPastDate) {
          toast.error(t('calendar.validation.past_date_message'));
        } else {
          toast.error(validation.error || t('calendar.validation.invalid_date'));
        }
        return;
      }

      const oldDate = parseISO(event.start);
      if (oldDate.getTime() === newDate.getTime()) return;

      try {
        await calendar.handleEventDrop(event.id, newDate.toISOString(), event.type);
        toast.success(t('calendar.bulkActions.moveSuccess') || 'Evento movido exitosamente');
      } catch (err: any) {
        toast.error(
          err?.message || t('calendar.bulkActions.moveError') || 'Error al mover el evento',
        );
      }
    },
    [calendar, t],
  );

  /** Open delete confirmation for a calendar event. */
  const requestDeleteEvent = useCallback((event: CalendarEvent) => {
    setDeleteConfirmation({ isOpen: true, event });
  }, []);

  /** Confirm and execute deletion. */
  const confirmDelete = useCallback(async () => {
    const event = deleteConfirmation.event;
    if (!event) return;

    try {
      await calendar.deleteEvent(event.id);
      toast.success(
        t('calendar.userEvents.modal.messages.successDelete') || 'Evento eliminado correctamente',
      );
      setDeleteConfirmation({ isOpen: false, event: null });
    } catch {
      toast.error(
        t('calendar.userEvents.modal.messages.errorDelete') || 'Error al eliminar el evento',
      );
    }
  }, [deleteConfirmation.event, calendar, t]);

  /** Handle clicking on a calendar event (opens edit modal or user event modal). */
  const handleEventClick = useCallback(
    async (event: CalendarEvent) => {
      if (event.type === 'user_event') {
        setSelectedEventForModal(event);
        setShowEventModal(true);
      } else {
        await calendar.handleEventClick(event);
      }
    },
    [calendar],
  );

  /** Open "add event" modal for a specific date. */
  const openAddEventModal = useCallback((date: Date) => {
    setSelectedDate(date);
    setSelectedEventForModal(undefined);
    setShowEventModal(true);
  }, []);

  return {
    // ── From useCalendar ───────────────────────────────────────────────────────
    ...calendar,

    // ── Local UI state ─────────────────────────────────────────────────────────
    selectedDate,
    setSelectedDate,
    showEventModal,
    setShowEventModal,
    selectedEventForModal,
    setSelectedEventForModal,
    deleteConfirmation,
    setDeleteConfirmation,
    showExternalCalendars,
    setShowExternalCalendars,

    // ── Derived actions ────────────────────────────────────────────────────────
    navigateToDate,
    handleDrop,
    requestDeleteEvent,
    confirmDelete,
    handleEventClick,
    openAddEventModal,
  };
};
