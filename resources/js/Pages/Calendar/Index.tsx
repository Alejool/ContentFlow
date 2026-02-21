import Button from "@/Components/common/Modern/Button";
import { DynamicModal } from "@/Components/common/Modern/DynamicModal";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { formatTime } from "@/Utils/formatDate";
import { Head } from "@inertiajs/react";
import EmptyState from "@/Components/common/EmptyState";
import { getEmptyStateByKey } from "@/Utils/emptyStateMapper";
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
} from "date-fns";
import {
  Calendar as CalendarIcon,
  Filter,
  Loader2,
  Trash2,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import {
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaTiktok,
  FaTwitter,
  FaYoutube,
} from "react-icons/fa";
import { CalendarViewSelector } from "@/Components/Calendar/CalendarViewSelector";
import { CalendarNavigation } from "@/Components/Calendar/CalendarNavigation";
import { MonthView } from "@/Components/Calendar/MonthView";
import { WeekView } from "@/Components/Calendar/WeekView";
import { DayView } from "@/Components/Calendar/DayView";
import { FilterPanel } from "@/Components/Calendar/FilterPanel";
import { EventDetailsModal } from "@/Components/Calendar/EventDetailsModal";
import { CalendarEvent } from "@/types/calendar";
import { useCampaignStore } from "@/stores/campaignStore";

const PlatformIcon = ({
  platform,
  className,
}: {
  platform?: string;
  className?: string;
}) => {
  switch (platform?.toLowerCase()) {
    case "instagram":
      return <FaInstagram className={`text-pink-600 ${className}`} />;
    case "facebook":
      return <FaFacebook className={`text-blue-600 ${className}`} />;
    case "twitter":
    case "x":
      return <FaTwitter className={`text-sky-500 ${className}`} />;
    case "linkedin":
      return <FaLinkedin className={`text-blue-700 ${className}`} />;
    case "youtube":
      return <FaYoutube className={`text-red-600 ${className}`} />;
    case "tiktok":
      return <FaTiktok className={`text-black dark:text-white ${className}`} />;
    case "user_event":
    case "event":
    case "events":
      return <CalendarIcon className={`text-primary-500 ${className}`} />;
    default:
      return <CalendarIcon className={`text-gray-500 ${className}`} />;
  }
};

import { useCalendarStore } from "@/stores/calendarStore";
import { useShallow } from "zustand/react/shallow";
import { BulkActionsBar } from "@/Components/Calendar/BulkActionsBar";

export default function CalendarIndex({ auth }: { auth: any }) {
  const { t, i18n } = useTranslation();

  const {
    events,
    currentDate,
    loading,
    platformFilter,
    view,
    selectedEvents,
    filters,
    canUndo,
    setCurrentDate,
    setPlatformFilter,
    setView,
    setFilters,
    getFilteredEvents,
    toggleEventSelection,
    clearSelection,
    selectAll,
    fetchEvents,
    updateEvent,
    deleteEvent,
    bulkUpdateEvents,
    bulkDeleteEvents,
    undoBulkOperation,
    isUndoAvailable,
    navigatePrevious,
    navigateNext,
    navigateToToday,
    navigateToDate,
  } = useCalendarStore(
    useShallow((s) => ({
      events: s.events,
      currentDate: s.currentMonth,
      loading: s.isLoading,
      platformFilter: s.platformFilter,
      view: s.view,
      selectedEvents: s.selectedEvents,
      filters: s.filters,
      canUndo: s.canUndo,
      setCurrentDate: s.setCurrentMonth,
      setPlatformFilter: s.setPlatformFilter,
      setView: s.setView,
      setFilters: s.setFilters,
      getFilteredEvents: s.getFilteredEvents,
      toggleEventSelection: s.toggleEventSelection,
      clearSelection: s.clearSelection,
      selectAll: s.selectAll,
      fetchEvents: s.fetchEvents,
      updateEvent: s.updateEvent,
      deleteEvent: s.deleteEvent,
      bulkUpdateEvents: s.bulkUpdateEvents,
      bulkDeleteEvents: s.bulkDeleteEvents,
      undoBulkOperation: s.undoBulkOperation,
      isUndoAvailable: s.isUndoAvailable,
      navigatePrevious: s.navigatePrevious,
      navigateNext: s.navigateNext,
      navigateToToday: s.navigateToToday,
      navigateToDate: s.navigateToDate,
    })),
  );

  const { campaigns, fetchCampaigns } = useCampaignStore(
    useShallow((s) => ({
      campaigns: s.campaigns,
      fetchCampaigns: s.fetchCampaigns,
    })),
  );

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<CalendarEvent | null>(
    null,
  );
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);

  useEffect(() => {
    fetchEvents();
    fetchCampaigns();
  }, [currentDate]);

  // Grid Generation
  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  const firstDayOfMonth = startOfMonth(currentDate).getDay();
  const startingEmptySlots = Array.from({ length: firstDayOfMonth });

  // Filter Events - use the store's filtering logic
  const filteredEvents = getFilteredEvents();

  // Delete Event Handler
  const handleDeleteEvent = (event: any) => {
    setEventToDelete(event);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!eventToDelete) return;

    const success = await deleteEvent(eventToDelete.id);
    if (success) {
      toast.success(t("calendar.userEvents.modal.messages.successDelete"));
    } else {
      toast.error(t("calendar.userEvents.modal.messages.errorDelete"));
    }
    setShowDeleteModal(false);
    setEventToDelete(null);
  };

  // Event Click Handler
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventDetailsModal(true);
  };

  const handleUpdateEventDate = async (eventId: string, newDate: Date) => {
    // Check if dropping to a past date
    const now = new Date();
    
    if (newDate < now) {
      const confirmed = window.confirm(
        t('calendar.warnings.pastDate') || 
        '¿Estás seguro de que quieres mover este evento a una fecha/hora pasada?'
      );
      if (!confirmed) {
        throw new Error('User cancelled');
      }
    }
    
    const success = await updateEvent(eventId, newDate.toISOString(), '');
    if (success) {
      toast.success(t('calendar.messages.eventUpdated') || 'Evento actualizado');
    } else {
      toast.error(t('calendar.messages.updateFailed') || 'Error al actualizar evento');
      throw new Error('Update failed');
    }
  };

  const platforms = [
    "all",
    "events",
    "instagram",
    "facebook",
    "twitter",
    "linkedin",
    "youtube",
    "tiktok",
  ];

  return (
    <AuthenticatedLayout
      user={auth.user}
      header={
        <h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
          Planificador
        </h2>
      }
    >
      <Head title="Planificador de Contenido" />

      <div className="py-8">
        <div className="max-w-[1600px] mx-auto sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-black overflow-hidden shadow-xl sm:rounded-lg border border-gray-100 dark:border-gray-800">
            <div className="p-6">
              {/* Toolbar */}
              <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
                {/* Calendar Navigation */}
                <CalendarNavigation
                  currentDate={currentDate}
                  view={view}
                  onNavigatePrevious={navigatePrevious}
                  onNavigateNext={navigateNext}
                  onNavigateToToday={navigateToToday}
                  onNavigateToDate={navigateToDate}
                  isLoading={loading}
                />

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-center md:justify-end">
                  {/* View Selector */}
                  <CalendarViewSelector
                    currentView={view}
                    onViewChange={setView}
                  />

                  <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mr-2 flex-wrap gap-1">
                    {platforms.map((p) => (
                      <button
                        key={p}
                        onClick={() => setPlatformFilter(p)}
                        className={`p-2 rounded-md transition-all flex items-center gap-2 ${platformFilter === p ? "bg-white dark:bg-gray-700 shadow text-primary-600" : "text-gray-400 hover:text-gray-600"}`}
                        title={p}
                      >
                        {p === "all" ? (
                          <Filter className="w-4 h-4" />
                        ) : (
                          <PlatformIcon
                            platform={p === "events" ? "user_event" : p}
                            className="w-4 h-4"
                          />
                        )}
                        <span className="text-xs font-medium hidden lg:inline capitalize">
                          {p === "all"
                            ? t("calendar.filters.all")
                            : p === "events"
                              ? t("calendar.filters.events")
                              : p}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Calendar Grid */}
              {!loading && filteredEvents.length === 0 ? (
                <EmptyState config={getEmptyStateByKey('calendarView', t)!} />
              ) : (
                <>
                  {/* Filter Panel */}
                  <div className="mb-6">
                    <FilterPanel
                      filters={filters}
                      onFiltersChange={setFilters}
                      campaigns={campaigns}
                      totalEvents={events.length}
                      filteredCount={filteredEvents.length}
                    />
                  </div>

                  {view === 'month' && (
                    <MonthView
                      currentDate={currentDate}
                      events={filteredEvents}
                      onEventDrop={async (eventId, newDate) => {
                        // Check if dropping to a past date
                        const now = new Date();
                        now.setHours(0, 0, 0, 0);
                        const targetDate = new Date(newDate);
                        targetDate.setHours(0, 0, 0, 0);
                        
                        if (targetDate < now) {
                          // Show warning for past date
                          const confirmed = window.confirm(
                            t('calendar.warnings.pastDate') || 
                            '¿Estás seguro de que quieres mover este evento a una fecha pasada?'
                          );
                          if (!confirmed) {
                            return; // Cancel the drop
                          }
                        }
                        
                        const success = await updateEvent(eventId, newDate.toISOString(), '');
                        if (success) {
                          toast.success(t('calendar.messages.eventUpdated') || 'Evento actualizado');
                        } else {
                          toast.error(t('calendar.messages.updateFailed') || 'Error al actualizar evento');
                        }
                      }}
                      onEventDelete={handleDeleteEvent}
                      onEventClick={handleEventClick}
                      selectedEvents={selectedEvents}
                      onToggleSelection={toggleEventSelection}
                      PlatformIcon={PlatformIcon}
                      currentUser={auth.user}
                    />
                  )}
                  
                  {view === 'week' && (
                    <WeekView
                      currentDate={currentDate}
                      events={filteredEvents}
                      onEventDrop={async (event, newDate) => {
                        // Check if dropping to a past date/time
                        const now = new Date();
                        
                        if (newDate < now) {
                          const confirmed = window.confirm(
                            t('calendar.warnings.pastDate') || 
                            '¿Estás seguro de que quieres mover este evento a una fecha/hora pasada?'
                          );
                          if (!confirmed) {
                            return;
                          }
                        }
                        
                        const success = await updateEvent(event.id, newDate.toISOString(), event.type);
                        if (success) {
                          toast.success(t('calendar.messages.eventUpdated') || 'Evento actualizado');
                        } else {
                          toast.error(t('calendar.messages.updateFailed') || 'Error al actualizar evento');
                        }
                      }}
                      onEventClick={handleEventClick}
                      selectedEvents={selectedEvents}
                      onToggleSelection={toggleEventSelection}
                      PlatformIcon={PlatformIcon}
                    />
                  )}
                  
                  {view === 'day' && (
                    <DayView
                      currentDate={currentDate}
                      events={filteredEvents}
                      onEventDrop={async (event, newDate) => {
                        // Check if dropping to a past date/time
                        const now = new Date();
                        
                        if (newDate < now) {
                          const confirmed = window.confirm(
                            t('calendar.warnings.pastDate') || 
                            '¿Estás seguro de que quieres mover este evento a una fecha/hora pasada?'
                          );
                          if (!confirmed) {
                            return;
                          }
                        }
                        
                        const success = await updateEvent(event.id, newDate.toISOString(), event.type);
                        if (success) {
                          toast.success(t('calendar.messages.eventUpdated') || 'Evento actualizado');
                        } else {
                          toast.error(t('calendar.messages.updateFailed') || 'Error al actualizar evento');
                        }
                      }}
                      onEventClick={handleEventClick}
                      onDeleteEvent={handleDeleteEvent}
                      selectedEvents={selectedEvents}
                      onToggleSelection={toggleEventSelection}
                      PlatformIcon={PlatformIcon}
                      auth={auth}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <DynamicModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setEventToDelete(null);
        }}
        title={t("calendar.userEvents.modal.actions.delete")}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            {t("calendar.userEvents.modal.actions.deleteConfirm")}
          </p>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="secondary"
              onClick={() => {
                setShowDeleteModal(false);
                setEventToDelete(null);
              }}
            >
              {t("calendar.userEvents.modal.actions.cancel")}
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              {t("calendar.userEvents.modal.actions.delete")}
            </Button>
          </div>
        </div>
      </DynamicModal>

      {/* Event Details Modal */}
      <EventDetailsModal
        event={selectedEvent}
        isOpen={showEventDetailsModal}
        onClose={() => {
          setShowEventDetailsModal(false);
          setSelectedEvent(null);
        }}
        onUpdateDate={handleUpdateEventDate}
        onDelete={(event) => {
          setShowEventDetailsModal(false);
          handleDeleteEvent(event);
        }}
        PlatformIcon={PlatformIcon}
        canEdit={true}
        canDelete={
          selectedEvent &&
          ['user_event', 'event'].includes(String(selectedEvent.type)) &&
          (!selectedEvent.extendedProps?.is_public ||
            selectedEvent.extendedProps?.user_name === auth.user?.name)
        }
      />

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedEvents.size}
        totalEvents={filteredEvents.length}
        selectedEventIds={Array.from(selectedEvents)}
        onClearSelection={clearSelection}
        onSelectAll={selectAll}
        onBulkMove={async (newDate) => {
          const success = await bulkUpdateEvents(
            Array.from(selectedEvents),
            newDate.toISOString()
          );
          if (success) {
            toast.success(`${selectedEvents.size} eventos movidos exitosamente`);
          } else {
            toast.error('Error al mover eventos');
          }
        }}
        onBulkDelete={async (eventIds) => {
          const success = await bulkDeleteEvents(eventIds);
          if (success) {
            toast.success(`${eventIds.length} eventos eliminados exitosamente`);
          } else {
            toast.error('Error al eliminar eventos');
          }
        }}
        onUndo={async () => {
          const success = await undoBulkOperation();
          if (success) {
            toast.success('Operación deshecha exitosamente');
          } else {
            toast.error('Error al deshacer operación');
          }
        }}
        canUndo={canUndo && isUndoAvailable()}
      />
    </AuthenticatedLayout>
  );
}
