import type { CalendarEvent } from '@/types/Calendar/calendar';
import React from 'react';

export interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventDrop: (event: CalendarEvent, newDate: Date) => void | Promise<void>;
  onEventClick?: ((event: CalendarEvent) => void) | undefined;
  onDeleteEvent?: ((event: CalendarEvent) => void) | undefined;
  onAddEvent?: ((date: Date) => void) | undefined;
  selectedEvents: Set<string>;
  onToggleSelection: (eventId: string) => void;
  onDaySelect?: (date: Date) => void;
}

export interface DraggableDayEventProps {
  event: CalendarEvent;
  isSelected: boolean;
  onToggleSelection: (eventId: string) => void;
  onEventClick?: ((event: CalendarEvent) => void) | undefined;
}

export interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventDrop: (event: CalendarEvent, newDate: Date) => void | Promise<void>;
  onEventClick?: ((event: CalendarEvent) => void) | undefined;
  onDeleteEvent?: ((event: CalendarEvent) => void) | undefined;
  onAddEvent?: ((date: Date) => void) | undefined;
  selectedEvents: Set<string>;
  onToggleSelection: (eventId: string) => void;
  onDaySelect?: (day: Date) => void;
  currentUser?: { name: string } | undefined;
}

export interface DraggableWeekEventProps {
  event: CalendarEvent;
  isSelected: boolean;
  onToggleSelection: (eventId: string) => void;
  onEventClick?: ((event: CalendarEvent) => void) | undefined;
  currentUser?: { name: string } | undefined;
}

export interface DroppableHourSlotProps {
  hour: number;
  events: CalendarEvent[];
  selectedEvents: Set<string>;
  onToggleSelection: (eventId: string) => void;
  onEventClick?: ((event: CalendarEvent) => void) | undefined;
  onAddEvent?: ((date: Date) => void) | undefined;
  currentDate: Date;
}
