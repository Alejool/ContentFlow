import type { CalendarEvent } from '@/types/Calendar/calendar';
import type { TFunction } from 'i18next';

export const monthViewDefaultT = ((key: string, fallback?: string) => fallback ?? key) as TFunction;

export interface MonthViewSharedProps {
  currentUser?: { name: string } | undefined;
  t?: TFunction | undefined;
}

export interface MonthViewProps extends MonthViewSharedProps {
  currentDate: Date;
  selectedDate?: Date;
  events: CalendarEvent[];
  onEventDrop: (eventId: string, newDate: Date) => Promise<void>;
  onEventDelete?: ((event: CalendarEvent) => void) | undefined;
  onEventClick?: ((event: CalendarEvent) => void) | undefined;
  onDaySelect?: ((day: Date) => void) | undefined;
  onAddEvent?: ((date: Date) => void) | undefined;
  selectedEvents: Set<string>;
  onToggleSelection: (eventId: string) => void;
  onSelectAll?: (() => void) | undefined;
  onSelectDay?: ((day: Date) => void) | undefined;
}

export interface DraggableEventProps extends MonthViewSharedProps {
  event: CalendarEvent;
  isSelected: boolean;
  onToggleSelection: (eventId: string) => void;
  onEventClick?: ((event: CalendarEvent) => void) | undefined;
  onEventDelete?: ((event: CalendarEvent) => void) | undefined;
}

export interface DroppableDayProps extends MonthViewSharedProps {
  day: Date;
  events: CalendarEvent[];
  isCurrentMonth: boolean;
  isTodayDay: boolean;
  isSelected?: boolean;
  selectedEvents: Set<string>;
  onToggleSelection: (eventId: string) => void;
  onEventClick?: ((event: CalendarEvent) => void) | undefined;
  onEventDelete?: ((event: CalendarEvent) => void) | undefined;
  onDaySelect?: ((day: Date) => void) | undefined;
  onAddEvent?: ((date: Date) => void) | undefined;
}
