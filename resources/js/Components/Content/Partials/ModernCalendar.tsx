import { BulkActionsBar } from '@/Components/Calendar/BulkActionsBar';
import { CalendarErrorBoundary } from '@/Components/Calendar/CalendarErrorBoundary';
import { CalendarViewSelector } from '@/Components/Calendar/CalendarViewSelector';
import ExternalCalendarSettings from '@/Components/Calendar/ExternalCalendarSettings';
import UserEventModal from '@/Components/Content/Partials/UserEventModal';
import ModalFooter from '@/Components/Content/modals/common/ModalFooter';
import ModalHeader from '@/Components/Content/modals/common/ModalHeader';
import Modal from '@/Components/common/ui/Modal';
import { getActivePlatformKeys, getPlatformConfig } from '@/Constants/socialPlatforms';
import { useCalendar } from '@/Hooks/calendar/useCalendar';
import { validateDate } from '@/Utils/dateValidation';
import { formatTime } from '@/Utils/formatDate';
import { formatDate } from '@/Utils/i18nHelpers';
import { useLockStore } from '@/stores/lockStore';
import { CalendarView } from '@/types/calendar';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { usePage } from '@inertiajs/react';
import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  setHours,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import {
  Calendar as CalendarIcon,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Loader2,
  Lock,
  Square,
  Trash2,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface ModernCalendarProps {
  onEventClick?: (
    id: number,
    type: 'publication' | 'post' | 'user_event',
    event?: CalendarEvent,
  ) => void;
}

interface CalendarEvent {
  id: string;
  resourceId: number;
  publicationId?: number;
  type: 'publication' | 'post' | 'user_event';
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

const PlatformIcon = ({ platform, className }: { platform?: string; className?: string }) => {
  const config = getPlatformConfig(platform || '');
  const Icon = config.icon;
  return <Icon className={`${config.textColor} ${className}`} />;
};

const DraggableEvent = ({
  event,
  onClick,
  onDelete,
  currentUser,
  remoteLocks,
  isSelected,
  onToggleSelect,
}: {
  event: CalendarEvent;
  onClick: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent, event: CalendarEvent) => void;
  currentUser: any;
  remoteLocks: Record<number, any>;
  isSelected?: boolean;
  onToggleSelect?: (e: React.MouseEvent) => void;
}) => {
  const isDraggable =
    event.type !== 'user_event' ||
    (event.user?.id && Number(event.user.id) === Number(currentUser?.id)) ||
    (!event.user?.id && event.extendedProps?.user_name === currentUser?.name);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
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
      className={`flex items-center gap-1.5 rounded-md border px-1.5 py-1 text-[10px] font-medium ${
        isSelected
          ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500 dark:bg-primary-900/20'
          : 'border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800'
      } truncate shadow-sm transition-transform hover:scale-[1.02] ${isDragging ? 'cursor-grabbing opacity-50' : 'cursor-pointer'}`}
    >
      {onToggleSelect && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(e);
          }}
          className="flex-shrink-0 transition-transform hover:scale-110"
        >
          {isSelected ? (
            <CheckSquare className="h-3 w-3 text-primary-600" />
          ) : (
            <Square className="h-3 w-3 text-gray-400" />
          )}
        </button>
      )}
      <div
        className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
        style={{ backgroundColor: event.color }}
      />
      {remoteLocks[event.extendedProps.publication_id || Number(event.resourceId)] && (
        <Lock className="h-2.5 w-2.5 flex-shrink-0 text-amber-500" />
      )}
      <span className="truncate text-gray-700 dark:text-gray-200">{event.title}</span>
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
      className={`group relative h-24 cursor-pointer overflow-hidden p-2 transition-all sm:h-32 lg:h-40 ${isSelected ? 'z-10 bg-primary-50/50 ring-2 ring-inset ring-primary-500 dark:bg-primary-900/20' : 'bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800/50'} ${!isSameMonth(day, currentMonth) ? 'opacity-40' : ''} ${isOver ? 'bg-primary-50/50 ring-2 ring-inset ring-primary-500 dark:bg-primary-900/20' : ''} `}
    >
      <div className="mb-1 flex items-start justify-between">
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold transition-all sm:h-8 sm:w-8 sm:text-sm ${
            isTodayDay
              ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
              : isSelected
                ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                : 'text-gray-700 group-hover:bg-gray-100 dark:text-gray-300 dark:group-hover:bg-gray-800'
          } `}
        >
          {format(day, 'd')}
        </span>

        <button
          onClick={onAddClick}
          className="rounded-md p-1 text-gray-400 opacity-0 transition-all hover:bg-gray-100 hover:text-primary-500 group-hover:opacity-100 dark:hover:bg-gray-800"
        >
          <CalendarIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="scrollbar-none hidden max-h-[calc(100%-2rem)] flex-col gap-1 overflow-y-auto sm:flex">
        {children}
      </div>
    </div>
  );
};

const DroppableTimeSlot = ({
  id,
  day,
  hour,
  children,
}: {
  id: string;
  day: Date;
  hour: number;
  children: React.ReactNode;
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { day, hour },
  });

  return (
    <div
      ref={setNodeRef}
      className={`border-r border-gray-100 p-1 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900/30 ${isOver ? 'bg-primary-100/50 ring-1 ring-primary-500 dark:bg-primary-900/20' : ''} `}
    >
      {children}
      {isOver && !children && (
        <div className="py-2 text-center text-xs text-primary-600 dark:text-primary-400">
          Soltar aquí
        </div>
      )}
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
  const [selectedEventForModal, setSelectedEventForModal] = useState<CalendarEvent | undefined>(
    undefined,
  );
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    event: CalendarEvent | null;
  }>({ isOpen: false, event: null });
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showExternalCalendars, setShowExternalCalendars] = useState(false);
  const [view, setView] = useState<CalendarView>('month');

  // State for bulk actions
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  // Bulk selection handlers
  const toggleEventSelection = (eventId: string) => {
    const newSelection = new Set(selectedEvents);
    if (newSelection.has(eventId)) {
      newSelection.delete(eventId);
    } else {
      newSelection.add(eventId);
    }
    setSelectedEvents(newSelection);
  };

  const clearSelection = () => {
    setSelectedEvents(new Set());
  };

  const selectAll = () => {
    const allEventIds = filteredEvents.map((e) => e.id);
    setSelectedEvents(new Set(allEventIds));
  };

  const handleBulkMove = async (newDate: Date) => {
    const eventIds = Array.from(selectedEvents);
    const selectedEventsList = filteredEvents.filter((e) => eventIds.includes(e.id));

    try {
      // Move each event, preserving the original time
      for (const event of selectedEventsList) {
        const originalDate = parseISO(event.start);

        // Create new date with the selected date but preserve the original time
        const newDateTime = new Date(newDate);
        newDateTime.setHours(originalDate.getHours());
        newDateTime.setMinutes(originalDate.getMinutes());
        newDateTime.setSeconds(originalDate.getSeconds());
        newDateTime.setMilliseconds(originalDate.getMilliseconds());

        await handleEventDrop(event.id, newDateTime.toISOString(), event.type);
      }

      toast.success(`${eventIds.length} eventos movidos exitosamente`);
      clearSelection();
      refreshEvents();
    } catch (error: any) {
      toast.error(error.message || 'Error al mover los eventos');
    }
  };

  const handleBulkDelete = async (eventIds: string[]) => {
    try {
      // Delete each event
      for (const eventId of eventIds) {
        await deleteEvent(eventId);
      }

      toast.success(`${eventIds.length} eventos eliminados exitosamente`);
      clearSelection();
      refreshEvents();
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar los eventos');
    }
  };

  // Close month picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showMonthPicker && !target.closest('.month-picker-container')) {
        setShowMonthPicker(false);
      }
      if (showDatePicker && !target.closest('.date-picker-container')) {
        setShowDatePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMonthPicker, showDatePicker]);

  // Navigation functions for different views
  const navigatePrevious = () => {
    switch (view) {
      case 'day':
        calendarGoToMonth(currentMonth.getMonth(), currentMonth.getFullYear());
        setSelectedDate(addDays(selectedDate, -1));
        break;
      case 'week':
        setSelectedDate(addDays(selectedDate, -7));
        break;
      case 'month':
      default:
        prevMonth();
        break;
    }
  };

  const navigateNext = () => {
    switch (view) {
      case 'day':
        setSelectedDate(addDays(selectedDate, 1));
        break;
      case 'week':
        setSelectedDate(addDays(selectedDate, 7));
        break;
      case 'month':
      default:
        nextMonth();
        break;
    }
  };

  const navigateToDate = (date: Date) => {
    setSelectedDate(date);
    calendarGoToMonth(date.getMonth(), date.getFullYear());

    // Si estamos en vista de día o semana, actualizar también
    if (view === 'day' || view === 'week') {
      // La fecha seleccionada ya se actualizó arriba
    }
  };

  const handleDatePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDateValue = new Date(e.target.value);
    if (!isNaN(selectedDateValue.getTime())) {
      navigateToDate(selectedDateValue);
      setShowDatePicker(false);
    }
  };

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

    // Parse the original event date to preserve the time
    const originalDate = parseISO(eventData.start);

    // Create new date with the drop date but preserve the original time
    const newDateTime = new Date(dropDate);
    newDateTime.setHours(originalDate.getHours());
    newDateTime.setMinutes(originalDate.getMinutes());
    newDateTime.setSeconds(originalDate.getSeconds());
    newDateTime.setMilliseconds(originalDate.getMilliseconds());

    // Validate the new date
    const validation = validateDate(newDateTime);

    if (!validation.isValid) {
      // Show error message for invalid dates (including past dates)
      if (validation.isPastDate) {
        toast.error(t('calendar.validation.past_date_message'));
      } else {
        toast.error(validation.error || t('calendar.validation.invalid_date'));
      }
      return;
    }

    // Check if date is the same
    if (isSameDay(originalDate, newDateTime)) return;

    try {
      await handleEventDrop(eventData.id, newDateTime.toISOString(), eventData.type);
      toast.success(t('calendar.bulkActions.moveSuccess') || 'Evento movido exitosamente');
    } catch (error: any) {
      toast.error(
        error.message || t('calendar.bulkActions.moveError') || 'Error al mover el evento',
      );
    }
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
        t('calendar.userEvents.modal.messages.successDelete') || 'Evento eliminado correctamente',
      );
      setDeleteConfirmation({ isOpen: false, event: null });
    } else {
      toast.error(
        t('calendar.userEvents.modal.messages.errorDelete') || 'Error al eliminar el evento',
      );
    }
  };

  const platforms = ['all', 'user_event', ...getActivePlatformKeys()];

  // Helper functions for week and day views
  const getEventsForDayAndHour = (day: Date, hour: number) => {
    return filteredEvents.filter((event) => {
      const eventDate = parseISO(event.start);
      return (
        format(eventDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd') &&
        eventDate.getHours() === hour
      );
    });
  };

  const getEventsForHour = (hour: number) => {
    return filteredEvents.filter((event) => {
      const eventDate = parseISO(event.start);
      return (
        format(eventDate, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') &&
        eventDate.getHours() === hour
      );
    });
  };

  // Render different calendar views
  const renderCalendarView = () => {
    switch (view) {
      case 'week':
        return renderWeekView();
      case 'day':
        return renderDayView();
      case 'month':
      default:
        return renderMonthView();
    }
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header with days */}
          <div className="sticky top-0 z-10 grid grid-cols-8 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <div className="border-r border-gray-200 p-3 text-center text-xs font-bold uppercase tracking-wider text-gray-400 dark:border-gray-800 dark:text-gray-500">
              Hora
            </div>
            {days.map((day) => (
              <div
                key={day.toString()}
                className={`border-r border-gray-200 p-3 text-center dark:border-gray-800 ${
                  isToday(day) ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                }`}
              >
                <div className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  {format(day, 'EEE')}
                </div>
                <div
                  className={`mt-1 text-lg font-bold ${
                    isToday(day)
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {format(day, 'd')}
                </div>
              </div>
            ))}
          </div>

          {/* Time slots */}
          <div className="bg-gray-50 dark:bg-gray-900/50">
            {hours.map((hour) => (
              <div
                key={hour}
                className="grid min-h-[80px] grid-cols-8 border-b border-gray-200 dark:border-gray-800"
              >
                <div className="border-r border-gray-200 bg-gray-100 p-2 text-right dark:border-gray-800 dark:bg-gray-900">
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                    {format(setHours(new Date(), hour), 'HH:mm')}
                  </span>
                </div>
                {days.map((day) => {
                  const dayEvents = getEventsForDayAndHour(day, hour);
                  const dropId = `${format(day, 'yyyy-MM-dd')}-${hour}`;

                  return (
                    <DroppableTimeSlot key={dropId} id={dropId} day={day} hour={hour}>
                      {dayEvents.map((event) => (
                        <DraggableEvent
                          key={event.id}
                          event={event}
                          currentUser={currentUser}
                          remoteLocks={remoteLocks}
                          onDelete={handleDeleteEvent}
                          isSelected={selectedEvents.has(event.id)}
                          onToggleSelect={(e) => {
                            e.stopPropagation();
                            toggleEventSelection(event.id);
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (event.type === 'user_event') {
                              setSelectedEventForModal(event);
                              setShowEventModal(true);
                            } else {
                              const pubId = event.extendedProps.publication_id || event.resourceId;
                              if (pubId) onEventClick?.(pubId, event.type, event);
                            }
                          }}
                        />
                      ))}
                    </DroppableTimeSlot>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="space-y-0">
        {hours.map((hour) => {
          const hourEvents = getEventsForHour(hour);
          const dropId = `hour-${hour}`;

          return (
            <div
              key={hour}
              className="flex min-h-[100px] border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900/30"
            >
              <div className="w-24 border-r border-gray-100 bg-gray-50 p-4 text-right dark:border-gray-800 dark:bg-gray-900/50">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {format(setHours(new Date(), hour), 'HH:mm')}
                </div>
              </div>

              <DroppableTimeSlot id={dropId} day={selectedDate} hour={hour}>
                <div className="flex-1 space-y-2 p-3">
                  {hourEvents.map((event) => (
                    <div
                      key={event.id}
                      className="relative rounded-lg border-l-4 bg-white p-4 transition-all hover:shadow-lg dark:bg-gray-800"
                      style={{ borderLeftColor: event.color }}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedEvents.has(event.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleEventSelection(event.id);
                          }}
                          className="mt-1"
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {event.type === 'user_event' ? (
                                <CalendarIcon className="h-5 w-5" style={{ color: event.color }} />
                              ) : event.platform ? (
                                <PlatformIcon platform={event.platform} className="h-5 w-5" />
                              ) : (
                                <Clock className="h-5 w-5" style={{ color: event.color }} />
                              )}
                              <h3
                                className="cursor-pointer text-base font-semibold text-gray-900 hover:text-primary-600 dark:text-white"
                                onClick={() => {
                                  if (event.type === 'user_event') {
                                    setSelectedEventForModal(event);
                                    setShowEventModal(true);
                                  } else {
                                    const pubId =
                                      event.extendedProps.publication_id || event.resourceId;
                                    if (pubId) onEventClick?.(pubId, event.type, event);
                                  }
                                }}
                              >
                                {event.title}
                              </h3>
                            </div>
                          </div>

                          <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{formatTime(event.start)}</span>
                            </div>
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize dark:bg-gray-700">
                              {event.status}
                            </span>
                          </div>

                          {event.extendedProps.description && (
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                              {event.extendedProps.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {hourEvents.length === 0 && (
                    <div className="py-4 text-center text-sm text-gray-400 dark:text-gray-600">
                      Sin eventos programados
                    </div>
                  )}
                </div>
              </DroppableTimeSlot>
            </div>
          );
        })}
      </div>
    );
  };

  const renderMonthView = () => {
    const days = eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth),
    });

    const firstDayOfMonth = startOfMonth(currentMonth).getDay();
    const startingEmptySlots = Array.from({ length: firstDayOfMonth });

    return (
      <>
        <div className="grid grid-cols-7 border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          {[
            { key: 'sun', label: t('calendar.weekdays.sun') },
            { key: 'mon', label: t('calendar.weekdays.mon') },
            { key: 'tue', label: t('calendar.weekdays.tue') },
            { key: 'wed', label: t('calendar.weekdays.wed') },
            { key: 'thu', label: t('calendar.weekdays.thu') },
            { key: 'fri', label: t('calendar.weekdays.fri') },
            { key: 'sat', label: t('calendar.weekdays.sat') },
          ].map((day) => (
            <div
              key={day.key}
              className="py-3 text-center text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 sm:text-xs"
            >
              <span className="hidden sm:inline">{day.label}</span>
              <span className="inline sm:hidden">{day.label.charAt(0)}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-[1px] bg-gray-200 dark:bg-gray-800">
          {startingEmptySlots.map((_, i) => (
            <div
              key={`empty-${i}`}
              className="h-24 bg-gray-50/50 dark:bg-gray-900/40 sm:h-32 lg:h-40"
            />
          ))}

          {days.map((day) => {
            const dayEvents = filteredEvents.filter((e) => isSameDay(parseISO(e.start), day));
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
                  if (isBefore(startOfDay(day), startOfDay(new Date()))) {
                    toast.error(t('calendar.userEvents.modal.validation.pastDate'));
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
                    isSelected={selectedEvents.has(event.id)}
                    onToggleSelect={(e) => {
                      e.stopPropagation();
                      toggleEventSelection(event.id);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (event.type === 'user_event') {
                        setSelectedEventForModal(event);
                        setShowEventModal(true);
                      } else {
                        const pubId = event.extendedProps.publication_id || event.resourceId;
                        if (pubId) onEventClick?.(pubId, event.type, event);
                      }
                    }}
                  />
                ))}
                {dayEvents.length > 3 && (
                  <div className="px-1.5 text-[10px] font-bold text-gray-400">
                    + {dayEvents.length - 3}
                  </div>
                )}
                <div className="mt-1 flex flex-wrap gap-0.5 sm:hidden">
                  {dayEvents.slice(0, 4).map((event) => (
                    <div
                      key={event.id}
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: event.color }}
                    />
                  ))}
                </div>
              </DroppableDay>
            );
          })}
        </div>
      </>
    );
  };

  return (
    <CalendarErrorBoundary>
      <div className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="p-6">
          <div className="mb-6 flex flex-col items-center justify-between gap-4 sm:mb-8 sm:flex-row sm:gap-6">
            <div className="flex items-center gap-4">
              <div className="month-picker-container relative">
                <button
                  onClick={() => setShowMonthPicker(!showMonthPicker)}
                  className="flex items-center gap-3 text-lg font-bold capitalize text-gray-900 transition-colors hover:text-primary-600 dark:text-white dark:hover:text-primary-400 sm:text-2xl"
                >
                  {formatDate(currentMonth, 'monthYear')}
                  <ChevronDown
                    className={`h-4 w-4 transition-transform sm:h-5 sm:w-5 ${showMonthPicker ? 'rotate-180' : ''}`}
                  />
                  {isLoading && (
                    <Loader2 className="h-4 w-4 animate-spin text-primary-500 sm:h-5 sm:w-5" />
                  )}
                </button>

                {showMonthPicker && (
                  <div className="absolute left-0 top-full z-50 mt-2 min-w-[280px] rounded-lg border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                    <div className="mb-4 grid grid-cols-3 gap-2">
                      {Array.from({ length: 12 }, (_, i) => (
                        <button
                          key={i}
                          onClick={() => goToMonth(i, currentMonth.getFullYear())}
                          className={`rounded-lg p-2 text-sm transition-colors ${
                            currentMonth.getMonth() === i
                              ? 'bg-primary-500 text-white'
                              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                          }`}
                        >
                          {formatDate(new Date(2024, i, 1), 'monthShort')}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={() =>
                          goToMonth(currentMonth.getMonth(), currentMonth.getFullYear() - 1)
                        }
                        className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {currentMonth.getFullYear()}
                      </span>
                      <button
                        onClick={() =>
                          goToMonth(currentMonth.getMonth(), currentMonth.getFullYear() + 1)
                        }
                        className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex w-full flex-wrap items-center justify-center gap-2 sm:w-auto sm:justify-end sm:gap-3">
              {/* View Selector */}
              <CalendarViewSelector currentView={view} onViewChange={setView} />

              {/* External Calendars Button - Gated by plan features */}
              {auth.current_workspace?.features?.calendar_sync && (
                <button
                  onClick={() => setShowExternalCalendars(!showExternalCalendars)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                    showExternalCalendars
                      ? 'border-primary-200 bg-primary-50 text-primary-600 dark:border-primary-800 dark:bg-primary-900/20 dark:text-primary-400'
                      : 'border-gray-200 bg-gray-100 text-gray-600 hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                  title="Calendarios Externos"
                >
                  <CalendarIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Externos</span>
                </button>
              )}

              <div className="scrollbar-subtle flex max-w-full items-center overflow-x-auto rounded-lg bg-gray-100 p-1 dark:bg-gray-800 sm:max-w-none">
                {platforms.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPlatformFilter(p)}
                    className={`rounded-full p-1.5 transition-all sm:p-2 ${platformFilter === p ? 'bg-white text-primary-600 shadow dark:bg-gray-700' : 'text-gray-400 hover:text-gray-600'}`}
                    title={
                      p === 'all'
                        ? t('calendar.filters.all')
                        : p === 'user_event'
                          ? t('calendar.filters.events')
                          : getPlatformConfig(p).name
                    }
                  >
                    {p === 'all' ? (
                      <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    ) : p === 'user_event' ? (
                      <CalendarIcon className="h-3.5 w-3.5 text-primary-500 sm:h-4 sm:w-4" />
                    ) : (
                      <PlatformIcon platform={p} className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    )}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-100 p-1 dark:border-gray-700 dark:bg-gray-800">
                <button
                  onClick={navigatePrevious}
                  className="rounded-lg p-1.5 text-gray-600 transition-all hover:bg-white dark:text-gray-300 dark:hover:bg-gray-700 sm:p-2"
                >
                  <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
                <button
                  onClick={goToToday}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-700 transition-all hover:bg-white dark:text-gray-200 dark:hover:bg-gray-700 sm:px-4 sm:py-2 sm:text-sm"
                >
                  {t('calendar.actions.today')}
                </button>

                <button
                  onClick={navigateNext}
                  className="rounded-lg p-1.5 text-gray-600 transition-all hover:bg-white dark:text-gray-300 dark:hover:bg-gray-700 sm:p-2"
                >
                  <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* External Calendars Panel */}
          {showExternalCalendars && (
            <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                  <CalendarIcon className="h-5 w-5 text-primary-500" />
                  {t('calendar.external.title')}
                </h3>
                <button
                  onClick={() => setShowExternalCalendars(false)}
                  className="rounded p-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              <ExternalCalendarSettings />
            </div>
          )}

          <div className="flex flex-col gap-8 xl:flex-row">
            <div className="min-w-0 flex-1">
              <div
                id="calendar"
                className="w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50 shadow-sm dark:border-gray-800 dark:bg-gray-900/50"
              >
                <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                  {renderCalendarView()}
                </DndContext>
              </div>
            </div>

            <div className="w-full space-y-6 xl:w-96">
              <div className="flex h-full flex-col rounded-lg border border-gray-100 bg-gray-50 p-6 dark:border-neutral-800/50 dark:bg-neutral-800/30">
                <div className="mb-6">
                  <h4 className="flex items-center gap-2 text-xl font-black text-gray-900 dark:text-white">
                    <CalendarIcon className="h-6 w-6 text-primary-500" />
                    {formatDate(selectedDate, 'dayMonth')}
                  </h4>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-primary-500 dark:bg-primary-900/30">
                      {
                        filteredEvents.filter((e) => isSameDay(parseISO(e.start), selectedDate))
                          .length
                      }{' '}
                      {t('calendar.events.count')}
                    </span>
                  </div>
                </div>

                <div className="scrollbar-thin max-h-[calc(100vh-400px)] flex-1 space-y-4 overflow-y-auto pr-1">
                  {filteredEvents.filter((e) => isSameDay(parseISO(e.start), selectedDate)).length >
                  0 ? (
                    filteredEvents
                      .filter((e) => isSameDay(parseISO(e.start), selectedDate))
                      .sort((a, b) => a.start.localeCompare(b.start))
                      .map((event) => (
                        <div
                          key={event.id}
                          onClick={() => {
                            if (event.type === 'user_event') {
                              setSelectedEventForModal(event);
                              setShowEventModal(true);
                            } else {
                              const pubId = event.extendedProps.publication_id || event.resourceId;
                              if (pubId) onEventClick?.(pubId, event.type, event);
                            }
                          }}
                          className="group flex cursor-pointer items-center gap-4 rounded-lg border-2 p-4 shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
                          style={{
                            backgroundColor: `${event.color}15`,
                            borderColor: `${event.color}40`,
                          }}
                        >
                          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg border border-gray-100 bg-white shadow-sm transition-transform group-hover:scale-110 dark:border-neutral-700 dark:bg-neutral-900">
                            {event.type === 'user_event' ? (
                              <CalendarIcon className="h-6 w-6" style={{ color: event.color }} />
                            ) : event.platform ? (
                              <PlatformIcon platform={event.platform} className="h-6 w-6" />
                            ) : (
                              <Clock className="h-6 w-6" style={{ color: event.color }} />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h5 className="flex items-center gap-1.5 truncate text-sm font-bold text-gray-900 dark:text-white">
                              {remoteLocks[
                                event.extendedProps.publication_id || Number(event.resourceId)
                              ] && <Lock className="h-3 w-3 text-amber-500" />}
                              {event.title}
                            </h5>
                            {event.user?.name && (
                              <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
                                {t('common.creator')}:{' '}
                                {Number(event.user.id) === Number(currentUser?.id)
                                  ? t('common.me') || 'Yo'
                                  : event.user.name}
                              </p>
                            )}
                            {!event.user?.name && event.extendedProps?.user_name && (
                              <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
                                {t('common.creator')}: {event.extendedProps.user_name}
                              </p>
                            )}
                            <div className="mt-1 flex items-center gap-2">
                              <span className="rounded-full bg-white/50 px-2 py-0.5 text-[10px] font-bold uppercase text-gray-500 backdrop-blur-sm dark:bg-neutral-900/50 dark:text-gray-400">
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
                            <div
                              className="h-10 w-1.5 rounded-full opacity-50 transition-opacity group-hover:opacity-100"
                              style={{ backgroundColor: event.color }}
                            />
                            {event.type === 'user_event' &&
                              Number(event.user?.id) === Number(currentUser?.id) && (
                                <button
                                  onClick={(e) => handleDeleteEvent(e, event)}
                                  className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                                  title={t('common.delete') || 'Eliminar'}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="rounded-lg border-2 border-dashed border-gray-200 bg-white/50 py-12 text-center dark:border-neutral-800 dark:bg-neutral-900/10">
                      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 dark:bg-neutral-800">
                        <CalendarIcon className="h-6 w-6 text-gray-300" />
                      </div>
                      <p className="text-sm font-medium text-gray-400">
                        {t('calendar.events.empty')}
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
              {t('calendar.userEvents.modal.messages.confirmDelete') ||
                t('common.deleteConfirm') ||
                '¿Estás seguro de que deseas eliminar este elemento? Esta acción no se puede deshacer.'}
            </p>
          </div>

          <ModalFooter
            onClose={() => setDeleteConfirmation({ isOpen: false, event: null })}
            onPrimarySubmit={confirmDelete}
            submitText={t('common.delete') || 'Eliminar'}
            cancelText={t('common.cancel') || 'Cancelar'}
            submitVariant="danger"
            submitIcon={<Trash2 className="h-4 w-4" />}
            cancelStyle="outline"
          />
        </Modal>

        {/* Bulk Actions Bar - Gated by plan features */}
        {auth.current_workspace?.features?.bulk_operations && (
          <BulkActionsBar
            selectedCount={selectedEvents.size}
            onClearSelection={clearSelection}
            onBulkMove={handleBulkMove}
            onBulkDelete={handleBulkDelete}
            onSelectAll={selectAll}
            totalEvents={filteredEvents.length}
            selectedEventIds={Array.from(selectedEvents)}
          />
        )}
      </div>
    </CalendarErrorBoundary>
  );
}
