import ModalFooter from "@/Components/ManageContent/modals/common/ModalFooter";
import ModalHeader from "@/Components/ManageContent/modals/common/ModalHeader";
import Modal from "@/Components/common/ui/Modal";
import {
  getActivePlatformKeys,
  getPlatformConfig,
} from "@/Constants/socialPlatforms";
import { useCalendar } from "@/Hooks/calendar/useCalendar";
import { formatTime } from "@/Utils/formatDate";
import { useLockStore } from "@/stores/lockStore";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
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
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  Lock,
  Trash2,
} from "lucide-react";
import React, { useEffect, useState } from "react";
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
    user_name?: string;
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

const DraggableEvent = ({
  event,
  onClick,
  onDelete,
  currentUser,
  remoteLocks,
}: {
  event: CalendarEvent;
  onClick: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent, event: CalendarEvent) => void;
  currentUser: any;
  remoteLocks: Record<number, any>;
}) => {
  const isDraggable =
    event.type !== "user_event" ||
    (event.user?.id && Number(event.user.id) === Number(currentUser?.id)) ||
    (!event.user?.id && event.extendedProps?.user_name === currentUser?.name);

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: event.id,
      disabled: !isDraggable,
      data: {
        event,
      },
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`flex items-center gap-1.5 px-1.5 py-1 rounded-md text-[10px] font-medium border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 truncate transition-transform hover:scale-[1.02] shadow-sm ${isDragging ? "opacity-50 cursor-grabbing" : "cursor-pointer"}`}
    >
      <div
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: event.color }}
      />
      {remoteLocks[
        event.extendedProps.publication_id || Number(event.resourceId)
      ] && <Lock className="w-2.5 h-2.5 text-amber-500 flex-shrink-0" />}
      <span className="truncate text-gray-700 dark:text-gray-200">
        {event.title}
      </span>
    </div>
  );
};

const DroppableDay = ({
  day,
  children,
  isSelected,
  currentMonth,
  isTodayDay,
  onSelect,
  onAddClick,
}: {
  day: Date;
  children: React.ReactNode;
  isSelected: boolean;
  currentMonth: Date;
  isTodayDay: boolean;
  onSelect: () => void;
  onAddClick: (e: React.MouseEvent) => void;
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: day.toISOString(),
    data: {
      date: day,
    },
  });

  return (
    <div
      ref={setNodeRef}
      onClick={onSelect}
      className={`
        relative h-24 sm:h-32 lg:h-40 p-2 transition-all cursor-pointer group overflow-hidden
        ${isSelected ? "bg-primary-50/50 dark:bg-primary-900/20 ring-2 ring-primary-500 ring-inset z-10" : "bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50"}
        ${!isSameMonth(day, currentMonth) ? "opacity-40" : ""}
        ${isOver ? "ring-2 ring-primary-500 ring-inset bg-primary-50/50 dark:bg-primary-900/20" : ""}
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
          onClick={onAddClick}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-all text-gray-400 hover:text-primary-500"
        >
          <CalendarIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="hidden sm:flex flex-col gap-1 overflow-y-auto scrollbar-none max-h-[calc(100%-2rem)]">
        {children}
      </div>
    </div>
  );
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
    goToMonth: calendarGoToMonth,
    handleEventDrop,
    deleteEvent,
    refreshEvents,
  } = useCalendar();

  const goToMonth = (month: number, year: number) => {
    calendarGoToMonth(month, year);
    setShowMonthPicker(false);
  };

  const { auth } = usePage().props as any;
  const currentUser = auth.user;
  const { remoteLocks } = useLockStore();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEventForModal, setSelectedEventForModal] = useState<
    CalendarEvent | undefined
  >(undefined);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    event: CalendarEvent | null;
  }>({ isOpen: false, event: null });
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

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

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const firstDayOfMonth = startOfMonth(currentMonth).getDay();
  const startingEmptySlots = Array.from({ length: firstDayOfMonth });

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const eventData = active.data.current?.event as CalendarEvent;
    const dropDate = over.data.current?.date as Date;

    if (!eventData || !dropDate) return;

    if (isBefore(startOfDay(dropDate), startOfDay(new Date()))) {
      toast.error(t("calendar.userEvents.modal.validation.pastDate"));
      return;
    }

    if (isSameDay(parseISO(eventData.start), dropDate)) return;

    await handleEventDrop(eventData.id, dropDate.toISOString(), eventData.type);
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

  const platforms = ["all", "user_event", ...getActivePlatformKeys()];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
      <div className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8 gap-4 sm:gap-6">
          <div className="flex items-center gap-4">
            <div className="relative month-picker-container">
              <button
                onClick={() => setShowMonthPicker(!showMonthPicker)}
                className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white capitalize flex items-center gap-3 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                {new Intl.DateTimeFormat(i18n.language || undefined, {
                  month: "long",
                  year: "numeric",
                }).format(currentMonth)}
                <ChevronDown
                  className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${showMonthPicker ? "rotate-180" : ""}`}
                />
                {isLoading && (
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-primary-500" />
                )}
              </button>

              {showMonthPicker && (
                <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-4 min-w-[280px]">
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {Array.from({ length: 12 }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => goToMonth(i, currentMonth.getFullYear())}
                        className={`p-2 text-sm rounded-lg transition-colors ${
                          currentMonth.getMonth() === i
                            ? "bg-primary-500 text-white"
                            : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {new Intl.DateTimeFormat(i18n.language || undefined, {
                          month: "short",
                        }).format(new Date(2024, i, 1))}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() =>
                        goToMonth(
                          currentMonth.getMonth(),
                          currentMonth.getFullYear() - 1,
                        )
                      }
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {currentMonth.getFullYear()}
                    </span>
                    <button
                      onClick={() =>
                        goToMonth(
                          currentMonth.getMonth(),
                          currentMonth.getFullYear() + 1,
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
                        : getPlatformConfig(p).name
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
            <div id="calendar" className="w-full border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden shadow-sm bg-gray-50 dark:bg-gray-900/50">
              <div id="calendar" className="grid grid-cols-7 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
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

              <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
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
                      <DroppableDay
                        key={day.toString()}
                        day={day}
                        isSelected={isSelected}
                        currentMonth={currentMonth}
                        isTodayDay={isTodayDay}
                        onSelect={() => setSelectedDate(day)}
                        onAddClick={(e) => {
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
                      >
                        {dayEvents.slice(0, 3).map((event) => (
                          <DraggableEvent
                            key={event.id}
                            event={event}
                            currentUser={currentUser}
                            remoteLocks={remoteLocks}
                            onDelete={handleDeleteEvent}
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
                          />
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-[10px] text-gray-400 font-bold px-1.5">
                            + {dayEvents.length - 3}
                          </div>
                        )}
                        <div className="flex sm:hidden flex-wrap gap-0.5 mt-1">
                          {dayEvents.slice(0, 4).map((event) => (
                            <div
                              key={event.id}
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: event.color }}
                            />
                          ))}
                        </div>
                      </DroppableDay>
                    );
                  })}
                </div>
              </DndContext>
            </div>
          </div>

          <div className="w-full xl:w-96 space-y-6">
            <div className="bg-gray-50 dark:bg-neutral-800/30 p-6 rounded-lg border border-gray-100 dark:border-neutral-800/50 h-full flex flex-col">
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
                        className="group flex items-center gap-4 p-4 rounded-lg shadow-sm hover:shadow-md active:scale-[0.98] transition-all cursor-pointer border-2"
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
                          <h5 className="font-bold text-gray-900 dark:text-white truncate text-sm flex items-center gap-1.5">
                            {remoteLocks[
                              event.extendedProps.publication_id ||
                                Number(event.resourceId)
                            ] && <Lock className="w-3 h-3 text-amber-500" />}
                            {event.title}
                          </h5>
                          {event.user?.name && (
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                              {t("common.creator")}:{" "}
                              {Number(event.user.id) === Number(currentUser?.id)
                                ? t("common.me") || "Yo"
                                : event.user.name}
                            </p>
                          )}
                          {!event.user?.name &&
                            event.extendedProps?.user_name && (
                              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                                {t("common.creator")}:{" "}
                                {event.extendedProps.user_name}
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
                            ((event.user?.id &&
                              Number(event.user.id) ===
                                Number(currentUser?.id)) ||
                              (!event.user?.id &&
                                event.extendedProps?.user_name ===
                                  currentUser?.name)) && (
                              <button
                                onClick={(e) => handleDeleteEvent(e, event)}
                                className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 transition-all"
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
                  <div className="py-12 text-center rounded-lg border-2 border-dashed border-gray-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/10">
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
