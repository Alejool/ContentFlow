import { useCalendar } from "@/Hooks/calendar/useCalendar";
import { useTheme } from "@/Hooks/useTheme";
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Layers,
  Share2,
} from "lucide-react";

export default function EditorialCalendar() {
  const { theme } = useTheme();
  const {
    events,
    currentMonth,
    isLoading,
    nextMonth,
    prevMonth,
    goToToday,
    handleEventClick,
  } = useCalendar();

  const renderHeader = () => (
    <div className="flex flex-col sm:flex-row items-center justify-between mb-6 sm:mb-8 gap-4">
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded-lg ${theme === "dark" ? "bg-primary-900/20" : "bg-primary-100"}`}
        >
          <CalendarIcon
            className={`w-5 h-5 sm:w-6 sm:h-6 ${theme === "dark" ? "text-primary-400" : "text-primary-600"}`}
          />
        </div>
        <h2
          className={`text-xl sm:text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}
        >
          {format(currentMonth, "MMMM yyyy")}
        </h2>
      </div>
      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
        <button
          onClick={prevMonth}
          className={`p-2 rounded-lg transition-colors ${theme === "dark" ? "hover:bg-neutral-800 text-gray-400" : "hover:bg-gray-100 text-gray-600"}`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={goToToday}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${theme === "dark" ? "bg-neutral-800 text-white hover:bg-neutral-700" : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"}`}
        >
          Today
        </button>
        <button
          onClick={nextMonth}
          className={`p-2 rounded-lg transition-colors ${theme === "dark" ? "hover:bg-neutral-800 text-gray-400" : "hover:bg-gray-100 text-gray-600"}`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  const renderDays = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return (
      <div className="grid grid-cols-7 mb-2">
        {days.map((day) => (
          <div
            key={day}
            className="text-center text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400 py-2"
          >
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div
        className={`grid grid-cols-7 border-t border-l ${theme === "dark" ? "border-neutral-800" : "border-gray-100"} rounded-lg overflow-hidden`}
      >
        {days.map((day, idx) => {
          const dayEvents = events.filter((event) => {
            if (!event.start) return false;
            return isSameDay(new Date(event.start), day);
          });
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isTodayDate = isToday(day);

          return (
            <div
              key={idx}
              className={`min-h-[80px] sm:min-h-[140px] p-1 sm:p-2 border-r border-b transition-colors relative ${
                theme === "dark"
                  ? `${isCurrentMonth ? "bg-neutral-900/30" : "bg-neutral-950/50"} border-neutral-800`
                  : `${isCurrentMonth ? "bg-white" : "bg-gray-50/50"} border-gray-100`
              }`}
            >
              <div className="flex justify-end mb-1">
                <span
                  className={`text-[10px] sm:text-sm font-medium w-5 h-5 sm:w-8 sm:h-8 flex items-center justify-center rounded-full ${
                    isTodayDate
                      ? "bg-primary-600 text-white shadow-lg"
                      : isCurrentMonth
                        ? theme === "dark"
                          ? "text-gray-300"
                          : "text-gray-600"
                        : "text-gray-400"
                  }`}
                >
                  {format(day, "d")}
                </span>
              </div>

              <div className="space-y-1 max-h-[60px] sm:max-h-[100px] overflow-y-auto overflow-x-hidden scrollbar-none hover:scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-neutral-800 scroll-smooth pr-0.5 transition-all duration-300">
                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEventClick(event);
                    }}
                    className={`group px-1 py-0.5 sm:px-2 sm:py-1 rounded text-[7px] sm:text-[10px] font-medium border-l-2 shadow-sm truncate flex flex-col gap-0.5 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all ${
                      theme === "dark"
                        ? "bg-neutral-800/80 hover:bg-neutral-700/80"
                        : "bg-gray-50 hover:bg-gray-100"
                    }`}
                    style={{ borderLeftColor: event.color }}
                  >
                    <div className="flex items-center gap-1">
                      {event.type === "publication" ? (
                        <Layers className="w-2 h-2 sm:w-3 sm:h-3" />
                      ) : (
                        <Share2 className="w-2 h-2 sm:w-3 sm:h-3" />
                      )}
                      <span
                        className={`truncate ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}
                      >
                        {event.title.replace("[PUB] ", "")}
                      </span>
                    </div>
                    {event.start && (
                      <div className="hidden sm:flex items-center gap-1 text-[9px] text-gray-500">
                        <Clock className="w-2.5 h-2.5" />
                        {format(new Date(event.start), "HH:mm")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className={`p-3 sm:p-6 rounded-2xl ${theme === "dark" ? "bg-neutral-900/50 border border-neutral-800" : "bg-white shadow-sm border border-gray-100"}`}
    >
      {renderHeader()}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        )}
        <div className="w-full">
          {renderDays()}
          {renderCells()}
        </div>
      </div>
    </div>
  );
}
