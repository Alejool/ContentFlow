import ModalFooter from "@/Components/ManageContent/modals/common/ModalFooter";
import ModalHeader from "@/Components/ManageContent/modals/common/ModalHeader";
import Modal from "@/Components/common/ui/Modal";
import {
  SOCIAL_PLATFORMS,
  getPlatformConfig,
} from "@/Constants/socialPlatforms";
import { useCalendar } from "@/Hooks/calendar/useCalendar";
import { formatTime } from "@/Utils/formatDate";
import { usePage } from "@inertiajs/react";
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfDay,
  startOfMonth,
} from "date-fns";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  Trash2,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import UserEventModal from "./UserEventModal";

interface ModernCalendarProps {
  onEventClick?: (
    id: number,
    type: "publication" | "post" | "user_event",
    event?: CalendarEvent,
  ) => void;
}

interface CalendarEvent {
  id: string;
  resourceId: number;
  type: "publication" | "post" | "user_event";
  title: string;
  start: string;
  end?: string;
  status: string;
  color: string;
  user?: {
    id: number;
    name: string;
  };
  extendedProps: {
    slug?: string;
    thumbnail?: string;
    publication_id?: number;
    platform?: string;
    description?: string;
    remind_at?: string;
    is_public?: boolean;
  };
}

const PlatformIcon = ({
  platform,
  className,
}: {
  platform?: string;
  className?: string;
}) => {
  const config = getPlatformConfig(platform || "");
  const Icon = config.icon;
  return <Icon className={`${config.textColor} ${className}`} />;
};

export default function ModernCalendar({ onEventClick }: ModernCalendarProps) {
  const { t, i18n } = useTranslation();
  const {
    filteredEvents,
    currentMonth,
    isLoading,
    platformFilter,
    setPlatformFilter,
    nextMonth,
    prevMonth,
    goToToday,
    handleEventDrop,
    deleteEvent,
    refreshEvents,
  } = useCalendar();

  const { auth } = usePage().props as any;
  const currentUser = auth.user;

  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEventForModal, setSelectedEventForModal] = useState<
    CalendarEvent | undefined
  >(undefined);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    event: CalendarEvent | null;
  }>({ isOpen: false, event: null });

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const firstDayOfMonth = startOfMonth(currentMonth).getDay();
  const startingEmptySlots = Array.from({ length: firstDayOfMonth });

  const handleDragStart = (e: React.DragEvent, event: CalendarEvent) => {
    if (event.type === "user_event" && event.user?.id !== currentUser?.id) {
      e.preventDefault();
      return;
    }
    setDraggedEvent(event);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", event.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const onDrop = async (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    if (!draggedEvent) return;

    if (isBefore(startOfDay(date), startOfDay(new Date()))) {
      toast.error(t("calendar.userEvents.modal.validation.pastDate"));
      setDraggedEvent(null);
      return;
    }

    await handleEventDrop(
      draggedEvent.id,
      date.toISOString(),
      draggedEvent.type,
    );
    setDraggedEvent(null);
  };

  const handleDeleteEvent = (e: React.MouseEvent, event: CalendarEvent) => {
    e.stopPropagation();
    setDeleteConfirmation({ isOpen: true, event });
  };

  const confirmDelete = async () => {
    const event = deleteConfirmation.event;
    if (!event) return;

    const success = await deleteEvent(event.id);
    if (success) {
      toast.success(
        t("calendar.userEvents.modal.messages.successDelete") ||
          "Evento eliminado correctamente",
      );
      setDeleteConfirmation({ isOpen: false, event: null });
    } else {
      toast.error(
        t("calendar.userEvents.modal.messages.errorDelete") ||
          "Error al eliminar el evento",
      );
    }
  };

  const platforms = ["all", "user_event", ...Object.keys(SOCIAL_PLATFORMS)];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
      <div className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8 gap-4 sm:gap-6">
          <div className="flex items-center gap-4">
            <h3 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white capitalize flex items-center gap-3">
              {new Intl.DateTimeFormat(i18n.language || undefined, {
                month: "long",
                year: "numeric",
              }).format(currentMonth)}
              {isLoading && (
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-primary-500" />
              )}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto justify-center sm:justify-end">
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 overflow-x-auto scrollbar-subtle max-w-full sm:max-w-none">
              {platforms.map((p) => (
                <button
                  key={p}
                  onClick={() => setPlatformFilter(p)}
                  className={`p-1.5 sm:p-2 rounded-md transition-all ${platformFilter === p ? "bg-white dark:bg-gray-700 shadow text-primary-600" : "text-gray-400 hover:text-gray-600"}`}
                  title={
                    p === "all"
                      ? t("calendar.filters.all")
                      : p === "user_event"
                        ? t("calendar.filters.events")
                        : p
                  }
                >
                  {p === "all" ? (
                    <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  ) : p === "user_event" ? (
                    <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-500" />
                  ) : (
                    <PlatformIcon
                      platform={p}
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                    />
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
              <button
                onClick={prevMonth}
                className="p-1.5 sm:p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all text-gray-600 dark:text-gray-300"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={goToToday}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all text-gray-700 dark:text-gray-200"
              >
                {t("calendar.actions.today")}
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 sm:p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all text-gray-600 dark:text-gray-300"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-8">
          <div className="flex-1 min-w-0">
            <div className="w-full border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm bg-gray-50 dark:bg-gray-900/50">
              <div className="grid grid-cols-7 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                {[
                  { key: "sun", label: t("calendar.weekdays.sun") },
                  { key: "mon", label: t("calendar.weekdays.mon") },
                  { key: "tue", label: t("calendar.weekdays.tue") },
                  { key: "wed", label: t("calendar.weekdays.wed") },
                  { key: "thu", label: t("calendar.weekdays.thu") },
                  { key: "fri", label: t("calendar.weekdays.fri") },
                  { key: "sat", label: t("calendar.weekdays.sat") },
                ].map((day) => (
                  <div
                    key={day.key}
                    className="py-3 text-center text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500"
                  >
                    <span className="hidden sm:inline">{day.label}</span>
                    <span className="inline sm:hidden">
                      {day.label.charAt(0)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 bg-gray-200 dark:bg-gray-800 gap-[1px]">
                {startingEmptySlots.map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="bg-gray-50/50 dark:bg-gray-900/40 h-24 sm:h-32 lg:h-40"
                  />
                ))}

                {days.map((day) => {
                  const dayEvents = filteredEvents.filter((e) =>
                    isSameDay(parseISO(e.start), day),
                  );
                  const isTodayDay = isToday(day);
                  const isSelected = isSameDay(day, selectedDate);

                  return (
                    <div
                      key={day.toString()}
                      onClick={() => setSelectedDate(day)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => onDrop(e, day)}
                      className={`
                        relative h-24 sm:h-32 lg:h-40 p-2 transition-all cursor-pointer group overflow-hidden
                        ${isSelected ? "bg-primary-50/30 dark:bg-primary-900/10 z-10" : "bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50"}
                        ${!isSameMonth(day, currentMonth) ? "opacity-40" : ""}
                      `}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span
                          className={`
                            flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 text-xs sm:text-sm font-bold rounded-lg transition-all
                            ${
                              isTodayDay
                                ? "bg-primary-500 text-white shadow-lg shadow-primary-500/30"
                                : isSelected
                                  ? "text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30"
                                  : "text-gray-700 dark:text-gray-300 group-hover:bg-gray-100 dark:group-hover:bg-gray-800"
                            }
                          `}
                        >
                          {format(day, "d")}
                        </span>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (
                              isBefore(startOfDay(day), startOfDay(new Date()))
                            ) {
                              toast.error(
                                t(
                                  "calendar.userEvents.modal.validation.pastDate",
                                ),
                              );
                              return;
                            }
                            setSelectedDate(day);
                            setSelectedEventForModal(undefined);
                            setShowEventModal(true);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-all text-gray-400 hover:text-primary-500"
                        >
                          <CalendarIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="hidden sm:flex flex-col gap-1 overflow-y-auto scrollbar-none max-h-[calc(100%-2rem)]">
                        {dayEvents.slice(0, 3).map((event) => (
                          <div
                            key={event.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, event)}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (event.type === "user_event") {
                                setSelectedEventForModal(event);
                                setShowEventModal(true);
                              } else {
                                const pubId =
                                  event.extendedProps.publication_id ||
                                  event.resourceId;
                                if (pubId)
                                  onEventClick?.(pubId, event.type, event);
                              }
                            }}
                            className="flex items-center gap-1.5 px-1.5 py-1 rounded-md text-[10px] font-medium border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 truncate transition-transform hover:scale-[1.02] shadow-sm"
                          >
                            <div
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: event.color }}
                            />
                            <span className="truncate text-gray-700 dark:text-gray-200">
                              {event.title}
                            </span>
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-[10px] text-gray-400 font-bold px-1.5">
                            + {dayEvents.length - 3}
                          </div>
                        )}
                      </div>

                      <div className="flex sm:hidden flex-wrap gap-0.5 mt-1">
                        {dayEvents.slice(0, 4).map((event) => (
                          <div
                            key={event.id}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: event.color }}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="w-full xl:w-96 space-y-6">
            <div className="bg-gray-50 dark:bg-neutral-800/30 p-6 rounded-2xl border border-gray-100 dark:border-neutral-800/50 h-full flex flex-col">
              <div className="mb-6">
                <h4 className="font-black text-gray-900 dark:text-white flex items-center gap-2 text-xl">
                  <CalendarIcon className="w-6 h-6 text-primary-500" />
                  {new Intl.DateTimeFormat(i18n.language || undefined, {
                    day: "numeric",
                    month: "long",
                  }).format(selectedDate)}
                </h4>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary-500 bg-primary-50 dark:bg-primary-900/30 px-2 py-0.5 rounded-full">
                    {
                      filteredEvents.filter((e) =>
                        isSameDay(parseISO(e.start), selectedDate),
                      ).length
                    }{" "}
                    {t("calendar.events.count")}
                  </span>
                </div>
              </div>

              <div className="space-y-4 flex-1 overflow-y-auto pr-1 scrollbar-thin">
                {filteredEvents.filter((e) =>
                  isSameDay(parseISO(e.start), selectedDate),
                ).length > 0 ? (
                  filteredEvents
                    .filter((e) => isSameDay(parseISO(e.start), selectedDate))
                    .sort((a, b) => a.start.localeCompare(b.start))
                    .map((event) => (
                      <div
                        key={event.id}
                        onClick={() => {
                          if (event.type === "user_event") {
                            setSelectedEventForModal(event);
                            setShowEventModal(true);
                          } else {
                            const pubId =
                              event.extendedProps.publication_id ||
                              event.resourceId;
                            if (pubId) onEventClick?.(pubId, event.type, event);
                          }
                        }}
                        className="group flex items-center gap-4 p-4 rounded-2xl shadow-sm hover:shadow-md active:scale-[0.98] transition-all cursor-pointer border-2"
                        style={{
                          backgroundColor: `${event.color}15`,
                          borderColor: `${event.color}40`,
                        }}
                      >
                        <div className="w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-700 group-hover:scale-110 transition-transform shadow-sm">
                          {event.type === "user_event" ? (
                            <CalendarIcon
                              className="w-6 h-6"
                              style={{ color: event.color }}
                            />
                          ) : (
                            <PlatformIcon
                              platform={event.extendedProps.platform}
                              className="w-6 h-6"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-gray-900 dark:text-white truncate text-sm">
                            {event.title}
                          </h5>
                          {event.user?.name && (
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                              {t("common.creator")}: {event.user.name}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/50 dark:bg-neutral-900/50 text-gray-500 dark:text-gray-400 font-bold uppercase backdrop-blur-sm">
                              {formatTime(event.start)}
                            </span>
                            <span
                              className="text-[10px] font-bold uppercase tracking-tight"
                              style={{ color: event.color }}
                            >
                              {event.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          {event.type === "user_event" &&
                            event.user?.id === currentUser?.id && (
                              <button
                                onClick={(e) => handleDeleteEvent(e, event)}
                                className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                                title={t("common.delete")}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          <div
                            className="w-1.5 h-10 rounded-full opacity-50 group-hover:opacity-100 transition-opacity"
                            style={{ backgroundColor: event.color }}
                          />
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="py-12 text-center rounded-2xl border-2 border-dashed border-gray-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/10">
                    <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-4">
                      <CalendarIcon className="w-6 h-6 text-gray-300" />
                    </div>
                    <p className="text-sm font-medium text-gray-400">
                      {t("calendar.events.empty")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

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
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("calendar.userEvents.modal.messages.confirmDelete") ||
              t("common.deleteConfirm") ||
              "¿Estás seguro de que deseas eliminar este elemento? Esta acción no se puede deshacer."}
          </p>
        </div>

        <ModalFooter
          onClose={() => setDeleteConfirmation({ isOpen: false, event: null })}
          onPrimarySubmit={confirmDelete}
          submitText={t("common.delete") || "Eliminar"}
          cancelText={t("common.cancel") || "Cancelar"}
          submitVariant="danger"
          submitIcon={<Trash2 className="w-4 h-4" />}
          cancelStyle="outline"
        />
      </Modal>
    </div>
  );
}
