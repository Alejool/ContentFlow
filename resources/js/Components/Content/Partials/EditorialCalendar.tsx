import { useCalendar } from '@/Hooks/calendar/useCalendar';
import { useTheme } from '@/Hooks/useTheme';
import { formatTime } from '@/Utils/formatDate';
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Layers,
  Share2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function EditorialCalendar() {
  const { t } = useTranslation();
  const { actualTheme } = useTheme();
  const { events, currentMonth, isLoading, nextMonth, prevMonth, goToToday, handleEventClick } =
    useCalendar();

  const renderHeader = () => (
    <div className="mb-6 flex flex-col items-center justify-between gap-4 sm:mb-8 sm:flex-row">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg bg-primary-100 p-2 dark:bg-primary-900/20`}>
          <CalendarIcon
            className={`h-5 w-5 text-primary-600 dark:text-primary-400 sm:h-6 sm:w-6`}
          />
        </div>
        <h2 className={`text-xl font-bold text-gray-900 dark:text-white sm:text-2xl`}>
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
      </div>
      <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
        <button
          onClick={prevMonth}
          className={`rounded-lg p-2 transition-colors ${actualTheme === 'dark' ? 'text-gray-400 hover:bg-neutral-800' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={goToToday}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${actualTheme === 'dark' ? 'bg-neutral-800 text-white hover:bg-neutral-700' : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}`}
        >
          {t('common.today')}
        </button>
        <button
          onClick={nextMonth}
          className={`rounded-lg p-2 transition-colors ${actualTheme === 'dark' ? 'text-gray-400 hover:bg-neutral-800' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );

  const renderDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div className="mb-2 grid grid-cols-7">
        {days.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-[10px] font-bold uppercase tracking-wider text-gray-400 sm:text-xs"
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
        className={`grid grid-cols-7 border-l border-t ${actualTheme === 'dark' ? 'border-neutral-800' : 'border-gray-100'} overflow-hidden rounded-lg`}
      >
        {days.map((day) => {
          const dayEvents = events.filter((event) => {
            if (!event.start) return false;
            return isSameDay(parseISO(event.start), day);
          });
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isTodayDate = isToday(day);

          return (
            <div
              key={day.toISOString()}
              className={`relative min-h-[80px] border-b border-r p-1 transition-colors sm:min-h-[140px] sm:p-2 ${
                actualTheme === 'dark'
                  ? `${isCurrentMonth ? 'bg-neutral-900/30' : 'bg-neutral-950/50'} border-neutral-800`
                  : `${isCurrentMonth ? 'bg-white' : 'bg-gray-50/50'} border-gray-100`
              }`}
            >
              <div className="mb-1 flex justify-end">
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium sm:h-8 sm:w-8 sm:text-sm ${
                    isTodayDate
                      ? 'bg-primary-600 text-white shadow-lg'
                      : isCurrentMonth
                        ? actualTheme === 'dark'
                          ? 'text-gray-300'
                          : 'text-gray-600'
                        : 'text-gray-400'
                  }`}
                >
                  {format(day, 'd')}
                </span>
              </div>

              <div className="scrollbar-none hover:scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-neutral-800 max-h-[60px] space-y-1 overflow-y-auto overflow-x-hidden scroll-smooth pr-0.5 transition-all duration-300 sm:max-h-[100px]">
                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEventClick(event);
                    }}
                    className={`group flex cursor-pointer flex-col gap-0.5 truncate rounded border-l-2 px-1 py-0.5 text-[7px] font-medium shadow-sm transition-all hover:scale-[1.02] active:scale-95 sm:px-2 sm:py-1 sm:text-[10px] ${
                      actualTheme === 'dark'
                        ? 'bg-neutral-800/80 hover:bg-neutral-700/80'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    style={{ borderLeftColor: event.color }}
                  >
                    <div className="flex items-center gap-1">
                      {event.type === 'publication' ? (
                        <Layers className="h-2 w-2 sm:h-3 sm:w-3" />
                      ) : (
                        <Share2 className="h-2 w-2 sm:h-3 sm:w-3" />
                      )}
                      <span
                        className={`truncate ${actualTheme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}
                      >
                        {event.title.replace('[PUB] ', '')}
                      </span>
                    </div>
                    {event.start && (
                      <div className="hidden items-center gap-1 text-[9px] text-gray-500 sm:flex">
                        <Clock className="h-2.5 w-2.5" />
                        {formatTime(event.start)}
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
      className={`rounded-lg p-3 sm:p-6 ${actualTheme === 'dark' ? 'border border-neutral-800 bg-neutral-900/50' : 'border border-gray-100 bg-white shadow-sm'}`}
    >
      {renderHeader()}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/50 backdrop-blur-sm dark:bg-neutral-900/50">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600"></div>
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
