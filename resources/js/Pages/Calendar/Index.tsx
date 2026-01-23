import Button from "@/Components/common/Modern/Button";
import { DynamicModal } from "@/Components/common/Modern/DynamicModal";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { formatTime } from "@/Utils/formatDate";
import { Head } from "@inertiajs/react";
import axios from "axios";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  subMonths,
} from "date-fns";
import {
  Calendar as CalendarIcon,
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

export default function CalendarIndex({ auth }: { auth: any }) {
  const { t, i18n } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<CalendarEvent | null>(
    null,
  );

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const start = startOfMonth(currentDate).toISOString();
      const end = endOfMonth(currentDate).toISOString();
      const response = await axios.get(route("api.calendar.events"), {
        params: { start, end },
      });
      setEvents(response.data.data);
    } catch (error) {
      console.error("Failed to fetch events", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [currentDate]);

  // Navigation
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

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
  const handleDragStart = (e: React.DragEvent, event: CalendarEvent) => {
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

    // Optimistic Update
    const updatedEvents = events.map((ev) =>
      ev.id === draggedEvent.id ? { ...ev, start: date.toISOString() } : ev,
    );
    setEvents(updatedEvents);

    try {
      const resourceId = draggedEvent.id.split("_")[1];
      await axios.patch(`/api/calendar/events/${resourceId}`, {
        scheduled_at: date.toISOString(),
        type: draggedEvent.type,
      });
    } catch (error) {
      console.error("Failed to update event", error);
      fetchEvents(); // Revert
    } finally {
      setDraggedEvent(null);
    }
  };

  // Delete Event Handler
  const handleDeleteEvent = (event: CalendarEvent) => {
    setEventToDelete(event);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!eventToDelete) return;

    try {
      const resourceId = eventToDelete.resourceId;
      // Optimistic remove
      setEvents((prev) => prev.filter((x) => x.id !== eventToDelete.id));
      await axios.delete(`/api/calendar/user-events/${resourceId}`);
      toast.success(t("calendar.userEvents.modal.messages.successDelete"));
    } catch (err) {
      console.error(err);
      toast.error(t("calendar.userEvents.modal.messages.errorDelete"));
      fetchEvents();
    } finally {
      setShowDeleteModal(false);
      setEventToDelete(null);
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
          <div className="bg-white dark:bg-gray-900 overflow-hidden shadow-xl sm:rounded-2xl border border-gray-100 dark:border-gray-800">
            <div className="p-6">
              {/* Toolbar */}
              <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
                <div className="flex items-center gap-4">
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white capitalize flex items-center gap-3">
                    {new Intl.DateTimeFormat(i18n.language || undefined, {
                      month: "long",
                      year: "numeric",
                    }).format(currentDate)}
                    {loading && (
                      <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
                    )}
                  </h3>
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
                                    platform={event.extendedProps.platform}
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

                                {["user_event", "event"].includes(
                                  String(event.type),
                                ) && (
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
