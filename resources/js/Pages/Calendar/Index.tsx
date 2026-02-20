import Button from "@/Components/common/Modern/Button";
import { DynamicModal } from "@/Components/common/Modern/DynamicModal";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { formatTime } from "@/Utils/formatDate";
import { Head } from "@inertiajs/react";
import EmptyState from "@/Components/common/EmptyState";
import { getEmptyStateByKey } from "@/Utils/emptyStateMapper";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  setMonth,
  setYear,
  startOfMonth,
  subMonths,
} from "date-fns";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
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
import { MonthView } from "@/Components/Calendar/MonthView";
import { WeekView } from "@/Components/Calendar/WeekView";
import { DayView } from "@/Components/Calendar/DayView";
import { FilterPanel } from "@/Components/Calendar/FilterPanel";
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
    })),
  );

  const { campaigns, fetchCampaigns } = useCampaignStore(
    useShallow((s) => ({
      campaigns: s.campaigns,
      fetchCampaigns: s.fetchCampaigns,
    })),
  );

  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<CalendarEvent | null>(
    null,
  );
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  // Close month picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showMonthPicker && !target.closest(".month-picker-container")) {
        setShowMonthPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMonthPicker]);

  useEffect(() => {
    fetchEvents();
    fetchCampaigns();
  }, [currentDate]);

  // Navigation
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());
  const goToMonth = (month: number, year: number) => {
    setCurrentDate(setYear(setMonth(new Date(), month), year));
    setShowMonthPicker(false);
  };

  // Grid Generation
  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  const firstDayOfMonth = startOfMonth(currentDate).getDay();
  const startingEmptySlots = Array.from({ length: firstDayOfMonth });

  // Filter Events - use the store's filtering logic
  const filteredEvents = getFilteredEvents();

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, event: any) => {
    setDraggedEvent(event);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", event.id); // Required for Firefox
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    if (!draggedEvent) return;

    await updateEvent(draggedEvent.id, date.toISOString(), draggedEvent.type);
    setDraggedEvent(null);
  };

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
                <div className="flex items-center gap-4">
                  <div className="relative month-picker-container">
                    <button
                      onClick={() => setShowMonthPicker(!showMonthPicker)}
                      className="text-3xl font-bold text-gray-900 dark:text-white capitalize flex items-center gap-3 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      {new Intl.DateTimeFormat(i18n.language || undefined, {
                        month: "long",
                        year: "numeric",
                      }).format(currentDate)}
                      <ChevronDown
                        className={`w-5 h-5 transition-transform ${showMonthPicker ? "rotate-180" : ""}`}
                      />
                      {loading && (
                        <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
                      )}
                    </button>

                    {showMonthPicker && (
                      <div className="absolute top-full left-0 mt-2 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-4 min-w-[280px]">
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          {Array.from({ length: 12 }, (_, i) => (
                            <button
                              key={i}
                              onClick={() =>
                                goToMonth(i, currentDate.getFullYear())
                              }
                              className={`p-2 text-sm rounded-lg transition-colors ${
                                currentDate.getMonth() === i
                                  ? "bg-primary-500 text-white"
                                  : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                              }`}
                            >
                              {new Intl.DateTimeFormat(
                                i18n.language || undefined,
                                {
                                  month: "short",
                                },
                              ).format(new Date(2024, i, 1))}
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <button
                            onClick={() =>
                              goToMonth(
                                currentDate.getMonth(),
                                currentDate.getFullYear() - 1,
                              )
                            }
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {currentDate.getFullYear()}
                          </span>
                          <button
                            onClick={() =>
                              goToMonth(
                                currentDate.getMonth(),
                                currentDate.getFullYear() + 1,
                              )
                            }
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

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

                  <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
                    <button
                      onClick={prevMonth}
                      className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all shadow-sm hover:shadow text-gray-600 dark:text-gray-300"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={goToToday}
                      className="px-4 py-2 text-sm font-semibold hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all shadow-sm hover:shadow text-gray-700 dark:text-gray-200"
                    >
                      Hoy
                    </button>
                    <button
                      onClick={nextMonth}
                      className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all shadow-sm hover:shadow text-gray-600 dark:text-gray-300"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
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
                      onEventDragStart={handleDragStart}
                      onDayDragOver={handleDragOver}
                      onDayDrop={handleDrop}
                      onEventDelete={handleDeleteEvent}
                      PlatformIcon={PlatformIcon}
                      currentUser={auth.user}
                    />
                  )}
                  
                  {view === 'week' && (
                    <WeekView
                      currentDate={currentDate}
                      events={filteredEvents}
                      onEventDrop={async (event, newDate) => {
                        await updateEvent(event.id, newDate.toISOString(), event.type);
                      }}
                      onEventClick={(event) => {
                        // Handle event click - could open a modal
                        }}
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
                        await updateEvent(event.id, newDate.toISOString(), event.type);
                      }}
                      onEventClick={(event) => {
                        // Handle event click - could open a modal
                        }}
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
        canUndo={canUndo}
      />
    </AuthenticatedLayout>
  );
}
