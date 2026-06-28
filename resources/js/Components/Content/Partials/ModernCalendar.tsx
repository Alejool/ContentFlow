/**
 * ModernCalendar — Orchestrator principal del calendario.
 *
 * Conecta:
 *  - useModernCalendar  → datos, estado y handlers
 *  - CalendarNavigation → barra de navegación
 *  - CalendarViewSelector → selector mes / semana / día
 *  - MonthView / WeekView / DayView → grillas (con DnD propio)
 *  - CalendarSidebar → lista de eventos del día seleccionado
 *  - UserEventModal / Modal de borrado → CRUD eventos de usuario
 *  - BulkActionsBar → barra flotante de acciones masivas
 */

import { BulkActionsBar } from '@/Components/Calendar/BulkActionsBar';
import { DeleteModal } from '@/Components/Calendar/BulkActions/DeleteModal';
import { MoveModal } from '@/Components/Calendar/BulkActions/MoveModal';
import { CalendarErrorBoundary } from '@/Components/Calendar/CalendarErrorBoundary';
import { CalendarNavigation } from '@/Components/Calendar/CalendarNavigation';
import { CalendarSidebar } from '@/Components/Calendar/CalendarSidebar';
import { CalendarViewSelector } from '@/Components/Calendar/CalendarViewSelector';
import { DayView } from '@/Components/Calendar/DayView';
import ExternalCalendarSettings from '@/Components/Calendar/ExternalCalendarSettings';
import { MonthView } from '@/Components/Calendar/MonthView';
import { WeekView } from '@/Components/Calendar/WeekView';
import { PlatformIcon } from '@/Components/Content/Partials/Calendar/PlatformIcon';
import UserEventModal from '@/Components/Content/Partials/UserEventModal';
import ModalFooter from '@/Components/Content/modals/common/ModalFooter';
import ModalHeader from '@/Components/Content/modals/common/ModalHeader';
import Modal from '@/Components/common/ui/Modal';
import {
    getActivePlatformKeys,
    getPlatformConfig,
} from '@/Constants/ConfigSocialMedia/socialPlatforms';
import { useDeleteEvent } from '@/Hooks/calendar/useCalendarEvents';
import { useModernCalendar } from '@/Hooks/calendar/useModernCalendar';
import { useLockStore } from '@/stores/Publications/lockStore';
import type { CalendarEvent } from '@/types/Calendar/calendar';
import { usePage } from '@inertiajs/react';
import { isSameDay, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, Filter, Trash2, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ModernCalendarProps {
  /** Llamado cuando el usuario hace clic en un evento publicación/post */
  onEventClick?: (
    id: number,
    type: 'publication' | 'post' | 'user_event',
    event?: CalendarEvent,
  ) => void;
  onEventDrop?: (event: CalendarEvent, newDate: Date) => void | Promise<void>;
}

export default function ModernCalendar({ onEventClick }: ModernCalendarProps) {
  const { t } = useTranslation();
  const { auth } = usePage().props as any;
  const currentUser = auth.user;
  const { remoteLocks } = useLockStore();

  const {
    // ── Datos ─────────────────────────────────────────────────────────────────
    filteredEvents,
    currentMonth,
    isLoading,
    platformFilter,
    setPlatformFilter,
    view,
    setView,
    selectedEvents,
    toggleEventSelection,
    clearSelection,
    selectAll,

    // ── Navegación ────────────────────────────────────────────────────────────
    nextMonth,
    prevMonth,
    goToToday,
    refreshEvents,
    navigateToDate,

    // ── Estado local UI ───────────────────────────────────────────────────────
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

    // ── Handlers ──────────────────────────────────────────────────────────────
    handleDrop,
    requestDeleteEvent,
    confirmDelete,
    handleBulkMove,
  } = useModernCalendar();

  // ── Sidebar bulk modals ───────────────────────────────────────────────────
  const deleteEvent = useDeleteEvent();
  const [showSidebarDeleteModal, setShowSidebarDeleteModal] = useState(false);
  const [showSidebarMoveModal, setShowSidebarMoveModal] = useState(false);
  const [sidebarMoveDate, setSidebarMoveDate] = useState<Date>(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d;
  });
  const [isSidebarDeleting, setIsSidebarDeleting] = useState(false);

  const handleSidebarBulkDelete = async () => {
    setIsSidebarDeleting(true);
    try {
      const ids = Array.from(selectedEvents as Set<string>);
      // Only delete user_events (publications can't be deleted from calendar)
      const userEventIds = ids.filter((id: string) =>
        (filteredEvents as CalendarEvent[]).some(
          (e: CalendarEvent) => e.id === id && e.type === 'user_event',
        ),
      );
      await Promise.all(userEventIds.map((id: string) => deleteEvent.mutateAsync(id)));
      clearSelection();
      refreshEvents();
    } finally {
      setIsSidebarDeleting(false);
      setShowSidebarDeleteModal(false);
    }
  };

  // ── Eventos del día seleccionado (para sidebar y selectDay) ───────────────
  const dayEvents = (filteredEvents as CalendarEvent[]).filter((e: CalendarEvent) =>
    isSameDay(parseISO(e.start), selectedDate),
  );

  // ── Selección masiva ──────────────────────────────────────────────────────

  /** Selecciona solo los eventos del día activo en el sidebar */
  const selectDay = useCallback(() => {
    clearSelection();
    dayEvents.forEach((e: CalendarEvent) => toggleEventSelection(e.id));
  }, [dayEvents, clearSelection, toggleEventSelection]);

  /** Selecciona todos los eventos visibles (usa filteredEvents, no el store) */
  const selectAllVisible = useCallback(() => {
    clearSelection();
    filteredEvents.forEach((e: CalendarEvent) => toggleEventSelection(e.id));
  }, [filteredEvents, clearSelection, toggleEventSelection]);

  // ── Click en evento (vistas) ──────────────────────────────────────────────
  const onViewEventClick = useCallback(
    (event: CalendarEvent) => {
      if (event.type === 'user_event') {
        setSelectedEventForModal(event);
        setShowEventModal(true);
      } else {
        const pubId = event.extendedProps.publication_id || event.resourceId;
        if (pubId) onEventClick?.(pubId, event.type, event);
      }
    },
    [onEventClick, setSelectedEventForModal, setShowEventModal],
  );

  // ── Navegación ────────────────────────────────────────────────────────────
  const navigatePrevious = () => {
    if (view === 'month') {
      prevMonth();
    } else {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() - (view === 'week' ? 7 : 1));
      setSelectedDate(d);
      navigateToDate(d);
    }
  };

  const navigateNext = () => {
    if (view === 'month') {
      nextMonth();
    } else {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + (view === 'week' ? 7 : 1));
      setSelectedDate(d);
      navigateToDate(d);
    }
  };

  const handleDaySelect = useCallback(
    (day: Date) => {
      setSelectedDate(day);
      setView('day');
      // En vista mes sincronizamos el mes visible solo si cambia
      if (view === 'month') {
        navigateToDate(day);
      }
    },
    [setSelectedDate, setView, navigateToDate, view],
  );

  // ── Plataformas ───────────────────────────────────────────────────────────
  const platforms = ['all', 'user_event', ...getActivePlatformKeys()];

  // ── Render de vista ───────────────────────────────────────────────────────
  const renderView = () => {
    const commonProps = {
      selectedEvents: selectedEvents as Set<string>,
      onToggleSelection: (id: string) => toggleEventSelection(id),
      onDaySelect: handleDaySelect,
      currentUser: currentUser ? { name: currentUser.name as string } : undefined,
    };

    switch (view) {
      case 'week':
        return (
          <WeekView
            {...commonProps}
            currentDate={selectedDate}
            events={filteredEvents}
            onEventDrop={async (event, newDate) => {
              await handleDrop(event, newDate);
            }}
            onEventClick={onViewEventClick}
            onAddEvent={(date) => {
              setSelectedDate(date);
              setSelectedEventForModal(undefined);
              setShowEventModal(true);
            }}
          />
        );

      case 'day':
        return (
          <DayView
            {...commonProps}
            currentDate={selectedDate}
            events={filteredEvents}
            onEventDrop={async (event, newDate) => {
              await handleDrop(event, newDate);
            }}
            onEventClick={onViewEventClick}
            onDeleteEvent={requestDeleteEvent}
            onAddEvent={(date) => {
              setSelectedDate(date);
              setSelectedEventForModal(undefined);
              setShowEventModal(true);
            }}
          />
        );

      case 'month':
      default:
        return (
          <MonthView
            {...commonProps}
            currentDate={currentMonth}
            selectedDate={selectedDate}
            events={filteredEvents}
            onEventDrop={async (eventId: string, newDate: Date) => {
              const ev = filteredEvents.find((e: CalendarEvent) => e.id === eventId);
              if (ev) await handleDrop(ev, newDate);
            }}
            onEventClick={onViewEventClick}
            onEventDelete={requestDeleteEvent}
            onDaySelect={handleDaySelect}
            onAddEvent={(date) => {
              setSelectedDate(date);
              setSelectedEventForModal(undefined);
              setShowEventModal(true);
            }}
            t={t as any}
          />
        );
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <CalendarErrorBoundary>
      <div className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="p-6">

          {/* ── Toolbar superior ────────────────────────────────────────────── */}
          <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:mb-8 sm:flex-row sm:items-center sm:gap-6">

            {/* Navegación */}
            <CalendarNavigation
              currentDate={view === 'month' ? currentMonth : selectedDate}
              view={view}
              onNavigatePrevious={navigatePrevious}
              onNavigateNext={navigateNext}
              onNavigateToToday={() => {
                goToToday();
                setSelectedDate(new Date());
              }}
              onNavigateToDate={(date) => {
                navigateToDate(date);
                setSelectedDate(date);
              }}
              isLoading={isLoading}
            />

            {/* Controles derecha */}
            <div className="flex w-full flex-wrap items-center justify-center gap-2 sm:w-auto sm:justify-end sm:gap-3">

              {/* Selector de vista */}
              <CalendarViewSelector currentView={view} onViewChange={setView} />

              {/* Calendarios externos (feature-gated) */}
              {auth.current_workspace?.features?.calendar_sync && (
                <button
                  onClick={() => setShowExternalCalendars(!showExternalCalendars)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                    showExternalCalendars
                      ? 'border-primary-200 bg-primary-50 text-primary-600 dark:border-primary-800 dark:bg-primary-900/20 dark:text-primary-400'
                      : 'border-gray-200 bg-gray-100 text-gray-600 hover:bg-gray-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-gray-700'
                  }`}
                  title="Calendarios Externos"
                >
                  <CalendarIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Externos</span>
                </button>
              )}

              {/* Filtros de plataforma */}
              <div className="scrollbar-subtle flex max-w-full items-center overflow-x-auto rounded-lg bg-gray-100 p-1 dark:bg-neutral-800 sm:max-w-none">
                {platforms.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPlatformFilter(p)}
                    className={`rounded-full p-1.5 transition-all sm:p-2 ${
                      platformFilter === p
                        ? 'bg-white text-primary-600 shadow dark:bg-neutral-700'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                    title={
                      p === 'all'
                        ? t('calendar.filters.all')
                        : p === 'user_event'
                          ? t('calendar.filters.events')
                          : getPlatformConfig(p).name
                    }
                  >
                    {p === 'all' ? (
                      <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    ) : p === 'user_event' ? (
                      <CalendarIcon className="h-3.5 w-3.5 text-primary-500 sm:h-4 sm:w-4" />
                    ) : (
                      <PlatformIcon platform={p} className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Panel calendarios externos ──────────────────────────────────── */}
          {showExternalCalendars && (
            <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                  <CalendarIcon className="h-5 w-5 text-primary-500" />
                  {t('calendar.external.title')}
                </h3>
                <button
                  onClick={() => setShowExternalCalendars(false)}
                  className="rounded p-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              <ExternalCalendarSettings />
            </div>
          )}

          {/* ── Contenido: grilla + sidebar ─────────────────────────────────── */}
          <div className="flex flex-col gap-6 md:flex-row">

            {/* Grilla de calendario - Ocupa la mayor parte del espacio */}
            <div className="min-w-0 flex-1 md:flex-[3] lg:flex-[4] xl:flex-[5]">
              <div
                id="calendar"
                className="w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/50"
              >
                {renderView()}
              </div>
            </div>

            {/* Sidebar de eventos del día - Compacto pero legible */}
            <div className="w-full md:w-80 lg:w-72 xl:w-80">
              <CalendarSidebar
                selectedDate={selectedDate}
                events={filteredEvents}
                currentUser={currentUser}
                remoteLocks={remoteLocks}
                selectedEvents={selectedEvents as Set<string>}
                onToggleSelection={(id) => toggleEventSelection(id)}
                onSelectAll={selectDay}
                onClearSelection={clearSelection}
                onBulkDelete={() => setShowSidebarDeleteModal(true)}
                onBulkMove={() => setShowSidebarMoveModal(true)}
                onEventClick={(event) => {
                  if (event.type === 'user_event') {
                    setSelectedEventForModal(event);
                    setShowEventModal(true);
                  } else {
                    const pubId = event.extendedProps.publication_id || event.resourceId;
                    if (pubId) onEventClick?.(pubId, event.type, event);
                  }
                }}
                onDeleteEvent={requestDeleteEvent}
              />
            </div>
          </div>
        </div>

        {/* ── Modal de evento de usuario ────────────────────────────────────── */}
        <UserEventModal
          show={showEventModal}
          onClose={() => {
            setShowEventModal(false);
            setSelectedEventForModal(undefined);
          }}
          event={selectedEventForModal}
          selectedDate={selectedDate}
          onSuccess={refreshEvents}
        />

        {/* ── Modal de confirmación de borrado ──────────────────────────────── */}
        <Modal
          show={deleteConfirmation.isOpen}
          onClose={() => setDeleteConfirmation({ isOpen: false, event: null })}
          maxWidth="md"
        >
          <ModalHeader
            t={t}
            onClose={() => setDeleteConfirmation({ isOpen: false, event: null })}
            title="common.deleteConfirmTitle"
            icon={Trash2}
            iconColor="text-red-500"
            size="md"
          />
          <div className="p-6">
            <p className="text-sm text-gray-600 dark:text-neutral-400">
              {t('calendar.userEvents.modal.messages.confirmDelete') ||
                t('common.deleteConfirm') ||
                '¿Estás seguro de que deseas eliminar este elemento? Esta acción no se puede deshacer.'}
            </p>
          </div>
          <ModalFooter
            onClose={() => setDeleteConfirmation({ isOpen: false, event: null })}
            onPrimarySubmit={confirmDelete}
            submitText={t('common.delete') || 'Eliminar'}
            cancelText={t('common.cancel') || 'Cancelar'}
            submitVariant="danger"
            submitIcon={<Trash2 className="h-4 w-4" />}
            cancelStyle="outline"
          />
        </Modal>

        {/* ── Sidebar bulk delete modal ─────────────────────────────────────── */}
        <DeleteModal
          isOpen={showSidebarDeleteModal}
          onClose={() => setShowSidebarDeleteModal(false)}
          selectedCount={(selectedEvents as Set<string>).size}
          onConfirm={handleSidebarBulkDelete}
          isDeleting={isSidebarDeleting}
        />

        {/* ── Sidebar bulk move modal ───────────────────────────────────────── */}
        <MoveModal
          isOpen={showSidebarMoveModal}
          onClose={() => setShowSidebarMoveModal(false)}
          selectedCount={(selectedEvents as Set<string>).size}
          selectedDate={sidebarMoveDate}
          onDateChange={setSidebarMoveDate}
          onConfirm={async () => {
            await handleBulkMove(sidebarMoveDate);
            setShowSidebarMoveModal(false);
            clearSelection();
          }}
          isMoving={false}
        />

        {/* ── Barra de acciones masivas (feature-gated) ─────────────────────── */}
        {auth.current_workspace?.features?.bulk_operations && (
          <BulkActionsBar
            selectedCount={(selectedEvents as Set<string>).size}
            totalEvents={filteredEvents.length}
            dayEventsCount={dayEvents.length}
            onClearSelection={clearSelection}
            onBulkMove={handleBulkMove}
            onSelectAll={selectAllVisible}
            onSelectDay={selectDay}
            selectedEventIds={Array.from(selectedEvents as Set<string>)}
          />
        )}
      </div>
    </CalendarErrorBoundary>
  );
}
