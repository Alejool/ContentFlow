import { CalendarNavigation } from "@/Components/Calendar/CalendarNavigation";
import { CalendarViewSelector } from "@/Components/Calendar/CalendarViewSelector";
import { DayView } from "@/Components/Calendar/DayView";
import { EventDetailsModal } from "@/Components/Calendar/EventDetailsModal";
import { FilterPanel } from "@/Components/Calendar/FilterPanel";
import { MonthView } from "@/Components/Calendar/MonthView";
import { WeekView } from "@/Components/Calendar/WeekView";
import EmptyState from "@/Components/common/EmptyState";
import Button from "@/Components/common/Modern/Button";
import { DynamicModal } from "@/Components/common/Modern/DynamicModal";
import { SOCIAL_PLATFORMS } from "@/Constants/socialPlatformsConfig";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useCampaignStore } from "@/stores/campaignStore";
import { CalendarEvent } from "@/types/calendar";
import { getEmptyStateByKey } from "@/Utils/emptyStateMapper";
import { Head } from "@inertiajs/react";
import { eachDayOfInterval, endOfMonth, startOfMonth } from "date-fns";
import { Calendar as CalendarIcon, Filter } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

const PlatformIcon = ({ platform, className }: { platform?: string; className?: string }) => {
  const platformKey = platform?.toLowerCase();

  // Handle user events
  if (["user_event", "event", "events"].includes(platformKey || "")) {
    return <CalendarIcon className={`text-primary-500 ${className}`} />;
  }

  // Get platform config from SOCIAL_PLATFORMS
  const platformConfig =
    platformKey && SOCIAL_PLATFORMS[platformKey as keyof typeof SOCIAL_PLATFORMS];

  if (platformConfig) {
    const Icon = platformConfig.icon;
    return <Icon className={`${platformConfig.textColor} ${className}`} />;
  }

  // Fallback for unknown platforms
  return <CalendarIcon className={`text-gray-500 ${className}`} />;
};

import { BulkActionsBar } from "@/Components/Calendar/BulkActionsBar";
import { useCalendarStore } from "@/stores/calendarStore";
import { useShallow } from "zustand/react/shallow";

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
  const [eventToDelete, setEventToDelete] = useState<CalendarEvent | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);

  useEffect(() => {
    fetchEvents();
    fetchCampaigns();
  }, [currentDate]);

  // Refresh calendar when workspace changes
  useEffect(() => {
    const workspaceId = auth?.user?.current_workspace_id;
    if (workspaceId) {
      fetchEvents();
      fetchCampaigns();
      clearSelection(); // Clear any selected events from previous workspace
    }
  }, [auth?.user?.current_workspace_id]);

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
        t("calendar.warnings.pastDate") ||
          "¿Estás seguro de que quieres mover este evento a una fecha/hora pasada?",
      );
      if (!confirmed) {
        throw new Error("User cancelled");
      }
    }

    const success = await updateEvent(eventId, newDate.toISOString(), "");
    if (success) {
      toast.success(t("calendar.messages.eventUpdated") || "Evento actualizado");
    } else {
      toast.error(t("calendar.messages.updateFailed") || "Error al actualizar evento");
      throw new Error("Update failed");
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
        <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
          Planificador
        </h2>
      }
    >
      <Head title="Planificador de Contenido" />

      <div className="py-8">
        <div className="mx-auto max-w-[1600px] sm:px-6 lg:px-8">
          <div className="overflow-hidden border border-gray-100 bg-white shadow-xl dark:border-gray-800 dark:bg-black sm:rounded-lg">
            <div className="p-6">
              {/* Toolbar */}
              <div className="mb-8 flex flex-col items-center justify-between gap-6 md:flex-row">
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

                <div className="flex w-full flex-wrap items-center justify-center gap-3 md:w-auto md:justify-end">
                  {/* View Selector */}
                  <CalendarViewSelector currentView={view} onViewChange={setView} />

                  <div className="mr-2 flex flex-wrap items-center gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
                    {platforms.map((p) => (
                      <button
                        key={p}
                        onClick={() => setPlatformFilter(p)}
                        className={`flex items-center gap-2 rounded-md p-2 transition-all ${platformFilter === p ? "bg-white text-primary-600 shadow dark:bg-gray-700" : "text-gray-400 hover:text-gray-600"}`}
                        title={p}
                      >
                        {p === "all" ? (
                          <Filter className="h-4 w-4" />
                        ) : (
                          <PlatformIcon
                            platform={p === "events" ? "user_event" : p}
                            className="h-4 w-4"
                          />
                        )}
                        <span className="hidden text-xs font-medium capitalize lg:inline">
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
                <EmptyState config={getEmptyStateByKey("calendarView", t)!} />
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

                  {view === "month" && (
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
                            t("calendar.warnings.pastDate") ||
                              "¿Estás seguro de que quieres mover este evento a una fecha pasada?",
                          );
                          if (!confirmed) {
                            return; // Cancel the drop
                          }
                        }

                        const success = await updateEvent(eventId, newDate.toISOString(), "");
                        if (success) {
                          toast.success(
                            t("calendar.messages.eventUpdated") || "Evento actualizado",
                          );
                        } else {
                          toast.error(
                            t("calendar.messages.updateFailed") || "Error al actualizar evento",
                          );
                        }
                      }}
                      onEventDelete={handleDeleteEvent}
                      onEventClick={handleEventClick}
                      selectedEvents={selectedEvents}
                      onToggleSelection={toggleEventSelection}
                      PlatformIcon={PlatformIcon}
                      currentUser={auth.user}
                      t={t}
                    />
                  )}

                  {view === "week" && (
                    <WeekView
                      currentDate={currentDate}
                      events={filteredEvents}
                      onEventDrop={async (event, newDate) => {
                        // Check if dropping to a past date/time
                        const now = new Date();

                        if (newDate < now) {
                          const confirmed = window.confirm(
                            t("calendar.warnings.pastDate") ||
                              "¿Estás seguro de que quieres mover este evento a una fecha/hora pasada?",
                          );
                          if (!confirmed) {
                            return;
                          }
                        }

                        const success = await updateEvent(
                          event.id,
                          newDate.toISOString(),
                          event.type,
                        );
                        if (success) {
                          toast.success(
                            t("calendar.messages.eventUpdated") || "Evento actualizado",
                          );
                        } else {
                          toast.error(
                            t("calendar.messages.updateFailed") || "Error al actualizar evento",
                          );
                        }
                      }}
                      onEventClick={handleEventClick}
                      selectedEvents={selectedEvents}
                      onToggleSelection={toggleEventSelection}
                      PlatformIcon={PlatformIcon}
                    />
                  )}

                  {view === "day" && (
                    <DayView
                      currentDate={currentDate}
                      events={filteredEvents}
                      onEventDrop={async (event, newDate) => {
                        // Check if dropping to a past date/time
                        const now = new Date();

                        if (newDate < now) {
                          const confirmed = window.confirm(
                            t("calendar.warnings.pastDate") ||
                              "¿Estás seguro de que quieres mover este evento a una fecha/hora pasada?",
                          );
                          if (!confirmed) {
                            return;
                          }
                        }

                        const success = await updateEvent(
                          event.id,
                          newDate.toISOString(),
                          event.type,
                        );
                        if (success) {
                          toast.success(
                            t("calendar.messages.eventUpdated") || "Evento actualizado",
                          );
                        } else {
                          toast.error(
                            t("calendar.messages.updateFailed") || "Error al actualizar evento",
                          );
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

          <div className="mt-6 flex justify-end gap-3">
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
          ["user_event", "event"].includes(String(selectedEvent.type)) &&
          (Number(selectedEvent.user?.id) === Number(auth.user?.id) ||
            (!selectedEvent.user?.id && selectedEvent.extendedProps?.user_name === auth.user?.name))
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
          const success = await bulkUpdateEvents(Array.from(selectedEvents), newDate.toISOString());
          if (success) {
            toast.success(`${selectedEvents.size} eventos movidos exitosamente`);
          } else {
            toast.error("Error al mover eventos");
          }
        }}
        onBulkDelete={async (eventIds) => {
          const success = await bulkDeleteEvents(eventIds);
          if (success) {
            toast.success(`${eventIds.length} eventos eliminados exitosamente`);
          } else {
            toast.error("Error al eliminar eventos");
          }
        }}
        onUndo={async () => {
          const success = await undoBulkOperation();
          if (success) {
            toast.success(t("calendar.bulkActions.undoSuccess"));
          } else {
            toast.error(t("calendar.bulkActions.undoError"));
          }
        }}
        canUndo={canUndo && isUndoAvailable()}
      />
    </AuthenticatedLayout>
  );
}
