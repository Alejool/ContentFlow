import {
  SOCIAL_PLATFORMS,
  getPlatformConfig,
} from "@/Constants/socialPlatforms";
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
import { es } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
} from "lucide-react";
import React, { useEffect, useState } from "react";

// Types
interface CalendarEvent {
  id: string;
  resourceId: number;
  type: "publication" | "post";
  title: string;
  start: string; // ISO
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
  const config = getPlatformConfig(platform || "");
  const Icon = config.icon;
  return <Icon className={`${config.textColor} ${className}`} />;
};

export default function ModernCalendar({
  onEventClick,
}: {
  onEventClick?: (id: number, type: "publication" | "post") => void;
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Fetch events
  const fetchEvents = async () => {
    setLoading(true);
    try {
      const start = startOfMonth(currentDate).toISOString();
      const end = endOfMonth(currentDate).toISOString();
      // Use manual URL to avoid Ziggy issues in components if needed, or route() if accessible
      const response = await axios.get("/api/calendar/events", {
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
    return e.extendedProps.platform?.toLowerCase() === platformFilter;
  });

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, event: CalendarEvent) => {
    setDraggedEvent(event);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", event.id);
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

  const platforms = ["all", ...Object.keys(SOCIAL_PLATFORMS)];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
      <div className="p-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8 gap-4 sm:gap-6">
          <div className="flex items-center gap-4">
            <h3 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white capitalize flex items-center gap-3">
              {format(currentDate, "MMMM yyyy", { locale: es })}
              {loading && (
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-primary-500" />
              )}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto justify-center sm:justify-end">
            {/* Platform Filter */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 overflow-x-auto scrollbar-subtle max-w-full sm:max-w-none">
              {platforms.map((p) => (
                <button
                  key={p}
                  onClick={() => setPlatformFilter(p)}
                  className={`p-1.5 sm:p-2 rounded-md transition-all ${platformFilter === p ? "bg-white dark:bg-gray-700 shadow text-primary-600" : "text-gray-400 hover:text-gray-600"}`}
                  title={p}
                >
                  {p === "all" ? (
                    <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
                Hoy
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

        {/* Calendar Grid - Responsive */}
        <div className="w-full">
          <div className="w-full border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden shadow-sm bg-gray-50 dark:bg-gray-900/50">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
              {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
                <div
                  key={day}
                  className="py-3 text-center text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500"
                >
                  <span className="hidden sm:inline">{day}</span>
                  <span className="inline sm:hidden">{day.charAt(0)}</span>
                </div>
              ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 auto-rows-fr min-h-[300px] sm:min-h-[700px] bg-gray-200 dark:bg-gray-800 gap-px">
              {/* Empty Slots */}
              {startingEmptySlots.map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="bg-gray-50/50 dark:bg-gray-900/50 p-1 sm:p-2"
                ></div>
              ))}

              {/* Actual Days */}
              {days.map((day) => {
                const dayEvents = filteredEvents.filter((e) =>
                  isSameDay(parseISO(e.start), day),
                );
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isTodayDay = isToday(day);
                const isSelected = isSameDay(day, selectedDate);

                return (
                  <div
                    key={day.toISOString()}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, day)}
                    onClick={() => setSelectedDate(day)}
                    className={`
                                            relative p-1 sm:p-2 min-h-[45px] sm:min-h-[140px] transition-all group cursor-pointer
                                            ${isCurrentMonth ? "bg-white dark:bg-gray-900" : "bg-gray-50/30 dark:bg-gray-900/30"}
                                            ${isTodayDay ? "bg-purple-50/10 dark:bg-primary-900/5" : ""}
                                            ${isSelected ? "ring-2 ring-primary-500/50 z-20" : ""}
                                            hover:bg-gray-50 dark:hover:bg-gray-800/50
                                        `}
                  >
                    {/* Date Header */}
                    <div className="flex justify-between items-start mb-1 sm:mb-2">
                      <span
                        className={`
                                                text-[10px] sm:text-sm font-medium w-5 h-5 sm:w-8 sm:h-8 flex items-center justify-center rounded-full transition-colors
                                                ${
                                                  isTodayDay
                                                    ? "bg-primary-600 text-white shadow-lg shadow-primary-500/30"
                                                    : isSelected
                                                      ? "bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400"
                                                      : "text-gray-500 dark:text-gray-400 group-hover:bg-gray-100 dark:group-hover:bg-gray-800"
                                                }
                                            `}
                      >
                        {format(day, "d")}
                      </span>
                      {isTodayDay && (
                        <span className="hidden sm:inline text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase">
                          Hoy
                        </span>
                      )}
                    </div>

                    {/* Events Stack / Indicators */}
                    <div className="flex flex-wrap sm:flex-col gap-1 sm:gap-2 relative z-10">
                      {/* Desktop Events */}
                      <div className="hidden sm:flex flex-col gap-2 w-full">
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
                            onClick={(e) => {
                              e.stopPropagation();
                              const pubId =
                                event.extendedProps.publication_id ||
                                event.resourceId;
                              if (pubId) onEventClick?.(pubId, event.type);
                            }}
                            className="relative overflow-hidden rounded-lg border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md cursor-pointer transition-all hover:-translate-y-0.5 group/card"
                          >
                            <div
                              className="absolute left-0 top-0 bottom-0 w-1"
                              style={{ backgroundColor: event.color }}
                            />
                            <div className="p-2 pl-3 flex items-start gap-2">
                              <div className="mt-0.5 flex-shrink-0 text-gray-400 dark:text-gray-500">
                                <PlatformIcon
                                  platform={event.extendedProps.platform}
                                  className="w-3.5 h-3.5"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-bold text-gray-700 dark:text-gray-200 truncate leading-tight">
                                  {event.title}
                                </div>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <span className="text-[10px] text-gray-400 dark:text-gray-500 capitalize font-medium">
                                    {format(parseISO(event.start), "HH:mm")}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Mobile Indicators (Dots) */}
                      <div className="flex sm:hidden flex-wrap gap-0.5 mt-auto">
                        {dayEvents.slice(0, 4).map((event) => (
                          <div
                            key={event.id}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: event.color }}
                          />
                        ))}
                        {dayEvents.length > 4 && (
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile Agenda View */}
          <div className="lg:hidden mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-primary-500" />
                {format(selectedDate, "d 'de' MMMM", { locale: es })}
              </h4>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                {
                  filteredEvents.filter((e) =>
                    isSameDay(parseISO(e.start), selectedDate),
                  ).length
                }{" "}
                Eventos
              </span>
            </div>

            <div className="space-y-3">
              {filteredEvents.filter((e) =>
                isSameDay(parseISO(e.start), selectedDate),
              ).length > 0 ? (
                filteredEvents
                  .filter((e) => isSameDay(parseISO(e.start), selectedDate))
                  .map((event) => (
                    <div
                      key={event.id}
                      onClick={() => {
                        const pubId =
                          event.extendedProps.publication_id ||
                          event.resourceId;
                        if (pubId) onEventClick?.(pubId, event.type);
                      }}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-neutral-800/50 border border-gray-100 dark:border-neutral-700/50 active:scale-[0.98] transition-all"
                    >
                      <div className="w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center bg-white dark:bg-neutral-800 shadow-sm border border-gray-100 dark:border-neutral-700">
                        <PlatformIcon
                          platform={event.extendedProps.platform}
                          className="w-6 h-6"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-bold text-gray-900 dark:text-white truncate">
                          {event.title}
                        </h5>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {format(parseISO(event.start), "HH:mm")} •{" "}
                          <span className="capitalize">{event.status}</span>
                        </p>
                      </div>
                      <div
                        className="w-2 h-10 rounded-full"
                        style={{ backgroundColor: event.color }}
                      />
                    </div>
                  ))
              ) : (
                <div className="py-8 text-center rounded-2xl border border-dashed border-gray-200 dark:border-neutral-800">
                  <p className="text-sm text-gray-400">
                    No hay eventos para este día
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
