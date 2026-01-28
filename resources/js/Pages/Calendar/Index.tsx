import Button from "@/Components/common/Modern/Button";
import { DynamicModal } from "@/Components/common/Modern/DynamicModal";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { formatTime } from "@/Utils/formatDate";
import { Head } from "@inertiajs/react";
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

interface CalendarEvent {
  id: string;
  resourceId: number;
  type: "publication" | "post" | "user_event" | "event";
  title: string;
  start: string;
  status: string;
  color: string;
  extendedProps: {
    slug?: string;
    thumbnail?: string;
    publication_id?: number;
    platform?: string;
  };
}

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
      return <CalendarIcon className={`text-indigo-500 ${className}`} />;
    default:
      return <CalendarIcon className={`text-gray-500 ${className}`} />;
  }
};

import { useCalendarStore } from "@/stores/calendarStore";
import { useShallow } from "zustand/react/shallow";

export default function CalendarIndex({ auth }: { auth: any }) {
  const { t, i18n } = useTranslation();

  const {
    events,
    currentDate,
    loading,
    platformFilter,
    setCurrentDate,
    setPlatformFilter,
    fetchEvents,
    updateEvent,
    deleteEvent,
  } = useCalendarStore(
    useShallow((s) => ({
      events: s.events,
      currentDate: s.currentMonth,
      loading: s.isLoading,
      platformFilter: s.platformFilter,
      setCurrentDate: s.setCurrentMonth,
      setPlatformFilter: s.setPlatformFilter,
      fetchEvents: s.fetchEvents,
      updateEvent: s.updateEvent,
      deleteEvent: s.deleteEvent,
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

  // Filter Events
  const filteredEvents = events.filter((e) => {
    if (platformFilter === "all") return true;
    if (platformFilter === "events")
      return String(e.type) === "user_event" || String(e.type) === "event";
    return e.extendedProps.platform?.toLowerCase() === platformFilter;
  });

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
          <div className="bg-white dark:bg-gray-900 overflow-hidden shadow-xl sm:rounded-2xl border border-gray-100 dark:border-gray-800">
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
                      <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-4 min-w-[280px]">
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
              <div className="border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm bg-gray-50 dark:bg-gray-900/50">
                {/* Weekday Headers - Desktop Only */}
                <div className="hidden lg:grid grid-cols-7 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                  {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map(
                    (day) => (
                      <div
                        key={day}
                        className="py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500"
                      >
                        {day}
                      </div>
                    ),
                  )}
                </div>

                {/* Days */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 auto-rows-fr min-h-[700px] bg-gray-200 dark:bg-gray-800 gap-px">
                  {/* Empty Slots - Desktop Only */}
                  {startingEmptySlots.map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="hidden lg:block bg-gray-50/50 dark:bg-gray-900/50 p-2"
                    ></div>
                  ))}

                  {/* Actual Days */}
                  {days.map((day) => {
                    const dayEvents = filteredEvents.filter((e) =>
                      isSameDay(parseISO(e.start), day),
                    );
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const isTodayDay = isToday(day);

                    return (
                      <div
                        key={day.toISOString()}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, day)}
                        className={`
                                                    relative p-2 min-h-[140px] transition-all group
                                                    ${isCurrentMonth ? "bg-white dark:bg-gray-900" : "bg-gray-50/30 dark:bg-gray-900/30"}
                                                    ${isTodayDay ? "bg-purple-50/10 dark:bg-primary-900/5" : ""}
                                                    hover:bg-gray-50 dark:hover:bg-gray-800/50
                                                `}
                      >
                        {/* Date Header */}
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`
                                    text-sm font-medium w-8 h-8 flex items-center justify-center rounded-full transition-colors
                                    ${
                                      isTodayDay
                                        ? "bg-primary-600 text-white shadow-lg shadow-primary-500/30"
                                        : "text-gray-500 dark:text-gray-400 group-hover:bg-gray-100 dark:group-hover:bg-gray-800"
                                    }
                                `}
                            >
                              {format(day, "d")}
                            </span>
                            {/* Show weekday on mobile/tablet */}
                            <span className="lg:hidden text-xs font-medium text-gray-400 uppercase">
                              {format(day, "EEE", {
                                locale:
                                  i18n.language === "es"
                                    ? undefined
                                    : undefined,
                              })}
                            </span>
                          </div>

                          {isTodayDay && (
                            <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400">
                              HOY
                            </span>
                          )}
                        </div>

                        {/* Events Stack with Scroll */}
                        <div className="flex flex-col gap-2 relative z-10 max-h-[120px] overflow-y-auto pr-1 custom-scrollbar">
                          {dayEvents.map((event) => (
                            <div
                              key={event.id}
                              draggable
                              onDragStart={(e) =>
                                handleDragStart(
                                  e as unknown as React.DragEvent,
                                  event,
                                )
                              }
                              className={`
                                                                relative overflow-hidden
                                                                rounded-lg border border-gray-100 dark:border-gray-700/50
                                                                bg-white dark:bg-gray-800 shadow-sm hover:shadow-md
                                                                cursor-grab active:cursor-grabbing transition-all hover:-translate-y-0.5
                                                                group/card
                                                            `}
                            >
                              {/* Status Indicator Bar */}
                              <div
                                className="absolute left-0 top-0 bottom-0 w-1"
                                style={{ backgroundColor: event.color }}
                              />

                              <div className="p-2 pl-3 flex items-start gap-2">
                                {/* Icon */}
                                <div className="mt-0.5 flex-shrink-0 text-gray-400 dark:text-gray-500">
                                  <PlatformIcon
                                    platform={
                                      ["user_event", "event"].includes(
                                        String(event.type),
                                      )
                                        ? "user_event"
                                        : event.extendedProps.platform
                                    }
                                    className="w-3.5 h-3.5"
                                  />
                                </div>

                                {/* Content */}
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate leading-tight">
                                    {event.title}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                                    <span className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-0.5">
                                      <Clock className="w-3 h-3" />
                                      {formatTime(event.start)}
                                    </span>
                                    {event.status && (
                                      <span className="text-[9px] px-1 rounded-sm bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 capitalize">
                                        {event.status}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Delete button - only show for user's own events */}
                                {["user_event", "event"].includes(
                                  String(event.type),
                                ) &&
                                  // Only show delete button for events created by current user
                                  // We can determine this by checking if the event ID contains the user's events
                                  // or by checking user_name if available
                                  (!event.extendedProps?.is_public ||
                                    event.extendedProps?.user_name ===
                                      auth.user.name) && (
                                    <button
                                      onClick={(ev) => {
                                        ev.stopPropagation();
                                        handleDeleteEvent(event);
                                      }}
                                      className="flex-shrink-0 p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all self-start"
                                      title="Eliminar evento"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
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
    </AuthenticatedLayout>
  );
}
