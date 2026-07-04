import type { CalendarEvent, CalendarFilters, CalendarView, DataConflict } from '@/types/Calendar/calendar';
import { calendarService } from '@/Services/Calendar/calendarService';
import {
    addDays,
    addMonths,
    addWeeks,
    endOfMonth,
    endOfWeek,
    startOfMonth,
    startOfWeek,
    subDays,
    subMonths,
    subWeeks,
} from 'date-fns';
import { create } from 'zustand';

interface CalendarState {
  events: CalendarEvent[];
  currentMonth: Date;
  isLoading: boolean;
  error: string | null;
  platformFilter: string;
  statusFilter: string;
  campaignFilter: string | null;
  view: CalendarView;
  selectedEvents: Set<string>;
  filters: CalendarFilters;
  canUndo: boolean;
  lastBulkOperation: Record<string, unknown> | null;
  lastBulkOperationTime: Date | null;
  conflict: DataConflict | null;

  setCurrentMonth: (date: Date) => void;
  setPlatformFilter: (platform: string) => void;
  setStatusFilter: (status: string) => void;
  setCampaignFilter: (campaign: string | null) => void;
  setView: (view: CalendarView) => void;
  setFilters: (filters: CalendarFilters) => void;
  applyFilters: (events: CalendarEvent[]) => CalendarEvent[];
  getFilteredEvents: () => CalendarEvent[];
  toggleEventSelection: (eventId: string) => void;
  clearSelection: () => void;
  selectAll: () => void;
  fetchEvents: () => Promise<void>;
  setEvents: (events: CalendarEvent[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  updateEvent: (id: string, newDate: string, type: string) => Promise<boolean>;
  bulkUpdateEvents: (eventIds: string[], newDate: string) => Promise<boolean>;
  bulkDeleteEvents: (eventIds: string[]) => Promise<boolean>;
  undoBulkOperation: () => Promise<boolean>;
  isUndoAvailable: () => boolean;
  updateEventByResourceId: (
    resourceId: number,
    type: 'publication' | 'post' | 'user_event',
    updates: Partial<CalendarEvent>,
  ) => void;
  deleteEvent: (id: string) => Promise<boolean>;
  exportToGoogleCalendar: () => Promise<void>;
  exportToOutlook: () => Promise<void>;
  navigatePrevious: () => void;
  navigateNext: () => void;
  navigateToToday: () => void;
  navigateToDate: (date: Date) => void;
  setConflict: (conflict: DataConflict | null) => void;
  resolveConflict: (resolution: 'local' | 'server') => Promise<boolean>;
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  events: [],
  currentMonth: new Date(),
  isLoading: false,
  error: null,
  platformFilter: 'all',
  statusFilter: 'all',
  campaignFilter: null,
  view: 'month',
  selectedEvents: new Set(),
  filters: {
    platforms: [],
    campaigns: [],
    statuses: [],
  },
  canUndo: false,
  lastBulkOperation: null,
  lastBulkOperationTime: null,
  conflict: null,

  setCurrentMonth: (date) => set({ currentMonth: date }),
  setPlatformFilter: (platform) => set({ platformFilter: platform }),
  setStatusFilter: (status) => set({ statusFilter: status }),
  setCampaignFilter: (campaign) => set({ campaignFilter: campaign }),
  setView: (view) => {
    // Persist view preference to localStorage
    localStorage.setItem('calendar_preferred_view', view);
    set({ view });
    // Re-fetch with the correct range for the new view
    setTimeout(() => get().fetchEvents(), 0);
  },

  setFilters: (filters) => {
    set({ filters });
    // React Query will handle re-fetching with new filters
  },

  applyFilters: (events) => {
    const { filters } = get();

    // If no filters are active, return all events
    if (
      filters.platforms.length === 0 &&
      filters.campaigns.length === 0 &&
      filters.statuses.length === 0
    ) {
      return events;
    }

    // Apply AND logic: event must match ALL active filter types
    return events.filter((event) => {
      // Platform filter - normalize both sides to lowercase for comparison
      const platformMatch =
        filters.platforms.length === 0 ||
        (event.platform &&
          filters.platforms.map((p) => p.toLowerCase()).includes(event.platform.toLowerCase())) ||
        (event.extendedProps?.platforms &&
          Array.isArray(event.extendedProps.platforms) &&
          event.extendedProps.platforms.some((p: string) =>
            filters.platforms.map((f) => f.toLowerCase()).includes(p.toLowerCase()),
          ));

      // Campaign filter - check if event's campaign matches any selected campaign
      const campaignMatch =
        filters.campaigns.length === 0 ||
        (event.extendedProps?.campaigns &&
          Array.isArray(event.extendedProps.campaigns) &&
          event.extendedProps.campaigns.some((c: string) => filters.campaigns.includes(c)));

      // Status filter
      const statusMatch = filters.statuses.length === 0 || filters.statuses.includes(event.status);

      // Return true only if ALL filter types match (AND logic)
      return platformMatch && campaignMatch && statusMatch;
    });
  },

  getFilteredEvents: () => {
    const { events } = get();
    return get().applyFilters(events);
  },

  toggleEventSelection: (eventId) => {
    const selectedEvents = new Set(get().selectedEvents);
    if (selectedEvents.has(eventId)) {
      selectedEvents.delete(eventId);
    } else {
      selectedEvents.add(eventId);
    }
    set({ selectedEvents });
  },

  clearSelection: () => set({ selectedEvents: new Set() }),

  selectAll: () => {
    const allEventIds = get()
      .getFilteredEvents()
      .map((e) => e.id);
    set({ selectedEvents: new Set(allEventIds) });
  },

  fetchEvents: async () => {
    const { currentMonth, filters, view } = get();
    set({ isLoading: true, error: null });

    try {
      let start: string;
      let end: string;

      if (view === 'week') {
        // For week view, fetch exactly the current week range
        start = startOfWeek(currentMonth, { weekStartsOn: 0 }).toISOString();
        end = endOfWeek(currentMonth, { weekStartsOn: 0 }).toISOString();
      } else if (view === 'day') {
        // For day view, fetch the full week containing the current day to have buffer
        start = startOfWeek(currentMonth, { weekStartsOn: 0 }).toISOString();
        end = endOfWeek(currentMonth, { weekStartsOn: 0 }).toISOString();
      } else {
        // For month view, fetch the full month including partial weeks at edges
        start = startOfWeek(startOfMonth(currentMonth)).toISOString();
        end = endOfWeek(endOfMonth(currentMonth)).toISOString();
      }

      // Build query params with filters
      const params: Record<string, string> = { start, end };

      if (filters.platforms.length > 0) {
        params.platforms = filters.platforms.join(',');
      }
      if (filters.campaigns.length > 0) {
        params.campaigns = filters.campaigns.join(',');
      }
      if (filters.statuses.length > 0) {
        params.statuses = filters.statuses.join(',');
      }

      const events = await calendarService.getEvents<CalendarEvent>(params);

      set({
        events,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error.message ?? 'Failed to fetch calendar events',
        isLoading: false,
      });
    }
  },

  // Method to set events from React Query (for cache integration)
  setEvents: (events: CalendarEvent[]) => set({ events, isLoading: false }),

  // Method to set loading state
  setLoading: (isLoading: boolean) => set({ isLoading }),

  // Method to set error state
  setError: (error: string | null) => set({ error }),

  updateEvent: async (id, newDate, type) => {
    try {
      // Validate that the new date is not in the past
      const targetDate = new Date(newDate);
      const now = new Date();

      // Set both dates to start of day for comparison
      const targetDay = new Date(targetDate);
      targetDay.setHours(0, 0, 0, 0);
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);

      // Prevent moving to past dates
      if (targetDay < today) {
        throw new Error('No puedes mover eventos a fechas anteriores a hoy');
      }

      const resourceId = id.split('_').pop();
      let eventType = type;

      if (!eventType) {
        if (id.startsWith('pub_')) eventType = 'publication';
        else if (id.startsWith('post_')) eventType = 'post';
        else if (id.startsWith('user_event_')) eventType = 'user_event';
      }

      // Get current event for conflict detection
      const currentEvent = get().events.find((ev) => ev.id === id);

      await calendarService.updateEvent(resourceId as string, {
        scheduled_at: newDate,
        type: eventType,
        current_version: currentEvent?.extendedProps?.version || null,
      });

      // Update local state immediately
      const events = get().events.map((ev) => (ev.id === id ? { ...ev, start: newDate } : ev));
      set({ events });

      return true;
    } catch (error) {
      // Check for conflict error (409)
      if (error.response?.status === 409 && error.response?.data?.conflict) {
        const conflictData = error.response.data.conflict;
        const conflict: DataConflict = {
          eventId: id,
          field: conflictData.field || 'start',
          localValue: newDate,
          serverValue: conflictData.server_value,
          localTimestamp: new Date(),
          serverTimestamp: new Date(conflictData.server_timestamp),
          serverUser: conflictData.server_user,
        };
        set({ conflict });
        return false;
      }

      set({
        error: error.message ?? 'Failed to update event',
      });

      // Re-throw the error so it can be caught by the caller
      throw error;
    }
  },

  updateEventByResourceId: (resourceId, type, updates) => {
    set((state) => ({
      events: state.events.map((ev) =>
        ev.resourceId === resourceId && ev.type === type
          ? {
              ...ev,
              ...updates,
              extendedProps: {
                ...ev.extendedProps,
                ...(updates.extendedProps || {}),
              },
            }
          : ev,
      ),
    }));
  },

  bulkUpdateEvents: async (eventIds, newDate) => {
    try {
      const response = await calendarService.bulkUpdate(eventIds, newDate, 'move');

      if (response.success) {
        // Update local state
        const events = get().events.map((ev) =>
          eventIds.includes(ev.id) ? { ...ev, start: newDate } : ev,
        );
        set({
          events,
          selectedEvents: new Set(),
          canUndo: true,
          lastBulkOperation: response.data ?? null,
          lastBulkOperationTime: new Date(),
        });

        return true;
      }

      return false;
    } catch (error) {
      set({
        error: error.response?.data?.message ?? 'Failed to bulk update events',
      });
      get().fetchEvents();
      return false;
    }
  },

  bulkDeleteEvents: async (eventIds) => {
    try {
      const response = await calendarService.bulkUpdate(
        eventIds,
        new Date().toISOString(), // Not used for delete
        'delete',
      );

      if (response.success) {
        // Remove deleted events from local state
        const events = get().events.filter((ev) => !eventIds.includes(ev.id));
        set({
          events,
          selectedEvents: new Set(),
          canUndo: true,
          lastBulkOperation: response.data ?? null,
          lastBulkOperationTime: new Date(),
        });

        return true;
      }

      return false;
    } catch (error) {
      set({
        error: error.response?.data?.message ?? 'Failed to bulk delete events',
      });
      get().fetchEvents();
      return false;
    }
  },

  undoBulkOperation: async () => {
    try {
      const response = await calendarService.bulkUndo();

      if (response.success) {
        // Refresh events to get the restored state
        await get().fetchEvents();
        set({
          canUndo: false,
          lastBulkOperation: null,
          lastBulkOperationTime: null,
        });

        return true;
      }

      return false;
    } catch (error) {
      set({
        error: error.response?.data?.message ?? 'Failed to undo operation',
      });
      return false;
    }
  },

  isUndoAvailable: () => {
    const state = get();
    if (!state.canUndo || !state.lastBulkOperationTime) {
      return false;
    }

    // Check if operation is within 5 minutes
    const now = new Date();
    const operationTime = new Date(state.lastBulkOperationTime);
    const diffInMinutes = (now.getTime() - operationTime.getTime()) / (1000 * 60);

    return diffInMinutes < 5;
  },

  deleteEvent: async (id) => {
    try {
      // Parse event ID to determine type
      const parts = id.split('_');
      const type = parts[0]; // 'post', 'user', or 'publication'
      const resourceId = parts[parts.length - 1] ?? ''; // Get the last part as resource ID

      if (type === 'post') {
        // Delete scheduled post
        await calendarService.deleteScheduledPost(resourceId);
      } else {
        // User events — and fallback for any other type
        await calendarService.deleteUserEvent(resourceId);
      }

      // Remove from local state
      const events = get().events.filter((ev) => ev.id !== id);
      set({ events });

      return true;
    } catch (error) {
      console.error('Delete event error:', error);
      set({
        error: error.response?.data?.message || error.message || 'Failed to delete event',
      });
      return false;
    }
  },

  exportToGoogleCalendar: async () => {
    try {
      const { events } = get();
      const response = await calendarService.exportToGoogle(
        events.map((e) => ({
          title: e.title,
          start: e.start,
          end: e.end,
          description: `Status: ${e.status}`,
        })),
      );

      if (response.url) {
        window.open(response.url, '_blank');
      }
    } catch (error) {
      set({
        error: error.message ?? 'Failed to export to Google Calendar',
      });
    }
  },

  exportToOutlook: async () => {
    try {
      const { events } = get();
      const response = await calendarService.exportToOutlook(
        events.map((e) => ({
          title: e.title,
          start: e.start,
          end: e.end,
          description: `Status: ${e.status}`,
        })),
      );

      if (response.url) {
        window.open(response.url, '_blank');
      }
    } catch (error) {
      set({
        error: error.message ?? 'Failed to export to Outlook',
      });
    }
  },

  // Navigation methods
  navigatePrevious: () => {
    const { currentMonth, view } = get();
    let newDate: Date;

    switch (view) {
      case 'day':
        newDate = subDays(currentMonth, 1);
        break;
      case 'week':
        newDate = subWeeks(currentMonth, 1);
        break;
      case 'month':
      default:
        newDate = subMonths(currentMonth, 1);
        break;
    }

    set({ currentMonth: newDate });
    // React Query will handle re-fetching with new date
  },

  navigateNext: () => {
    const { currentMonth, view } = get();
    let newDate: Date;

    switch (view) {
      case 'day':
        newDate = addDays(currentMonth, 1);
        break;
      case 'week':
        newDate = addWeeks(currentMonth, 1);
        break;
      case 'month':
      default:
        newDate = addMonths(currentMonth, 1);
        break;
    }

    set({ currentMonth: newDate });
    // React Query will handle re-fetching with new date
  },

  navigateToToday: () => {
    set({ currentMonth: new Date() });
    // React Query will handle re-fetching with new date
  },

  navigateToDate: (date: Date) => {
    set({ currentMonth: date });
    // React Query will handle re-fetching with new date
  },

  setConflict: (conflict: DataConflict | null) => {
    set({ conflict });
  },

  resolveConflict: async (resolution: 'local' | 'server') => {
    const { conflict } = get();
    if (!conflict) return false;

    try {
      const resourceId = conflict.eventId.split('_').pop();

      await calendarService.resolveConflict(resourceId as string, {
        resolution,
        field: conflict.field,
        value: resolution === 'local' ? conflict.localValue : conflict.serverValue,
      });

      // Update local state
      const events = get().events.map((ev) =>
        ev.id === conflict.eventId
          ? {
              ...ev,
              [conflict.field]: resolution === 'local' ? conflict.localValue : conflict.serverValue,
            }
          : ev,
      );

      set({ events, conflict: null });
      return true;
    } catch (error) {
      set({
        error: error.message ?? 'Failed to resolve conflict',
      });
      return false;
    }
  },
}));
