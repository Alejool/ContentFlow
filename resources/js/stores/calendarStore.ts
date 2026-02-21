import axios from "axios";
import { 
  endOfMonth, 
  endOfWeek, 
  startOfMonth, 
  startOfWeek,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays
} from "date-fns";
import { create } from "zustand";
import { CalendarEvent, CalendarView, CalendarFilters } from "@/types/calendar";
import { DataConflict } from "@/Components/Calendar/ConflictResolutionModal";

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
  lastBulkOperation: any | null;
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
    type: "publication" | "post" | "user_event",
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
  platformFilter: "all",
  statusFilter: "all",
  campaignFilter: null,
  view: "month",
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
      // Platform filter
      const platformMatch =
        filters.platforms.length === 0 ||
        (event.platform && filters.platforms.includes(event.platform)) ||
        (event.extendedProps?.platform && filters.platforms.includes(event.extendedProps.platform));

      // Campaign filter
      const campaignMatch =
        filters.campaigns.length === 0 ||
        (event.campaign && filters.campaigns.includes(event.campaign));

      // Status filter
      const statusMatch =
        filters.statuses.length === 0 ||
        filters.statuses.includes(event.status);

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
    const allEventIds = get().getFilteredEvents().map(e => e.id);
    set({ selectedEvents: new Set(allEventIds) });
  },

  fetchEvents: async () => {
    const { currentMonth, filters } = get();
    set({ isLoading: true, error: null });

    try {
      const start = startOfWeek(startOfMonth(currentMonth)).toISOString();
      const end = endOfWeek(endOfMonth(currentMonth)).toISOString();

      // Build query params with filters
      const params: any = { start, end };
      
      if (filters.platforms.length > 0) {
        params.platforms = filters.platforms.join(',');
      }
      if (filters.campaigns.length > 0) {
        params.campaigns = filters.campaigns.join(',');
      }
      if (filters.statuses.length > 0) {
        params.statuses = filters.statuses.join(',');
      }

      const response = await axios.get(route("api.v1.calendar.events"), {
        params,
      });

      set({
        events: response.data.data || [],
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message ?? "Failed to fetch calendar events",
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
      
      // Past dates are NOT allowed - validation will be enforced
      
      const resourceId = id.split("_").pop();
      let eventType = type;

      if (!eventType) {
        if (id.startsWith("pub_")) eventType = "publication";
        else if (id.startsWith("post_")) eventType = "post";
        else if (id.startsWith("user_event_")) eventType = "user_event";
      }

      // Get current event for conflict detection
      const currentEvent = get().events.find(ev => ev.id === id);

      await axios.patch(`/api/v1/calendar/events/${resourceId}`, {
        scheduled_at: newDate,
        type: eventType,
        current_version: currentEvent?.extendedProps?.version || null,
      });

      // Update local state immediately
      const events = get().events.map((ev) =>
        ev.id === id ? { ...ev, start: newDate } : ev,
      );
      set({ events });

      return true;
    } catch (error: any) {
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
        error: error.message ?? "Failed to update event",
      });
      get().fetchEvents();
      return false;
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
      const response = await axios.post('/api/v1/calendar/bulk-update', {
        event_ids: eventIds,
        new_date: newDate,
        operation: 'move',
      });

      if (response.data.success) {
        // Update local state
        const events = get().events.map((ev) =>
          eventIds.includes(ev.id) ? { ...ev, start: newDate } : ev,
        );
        set({ 
          events, 
          selectedEvents: new Set(),
          canUndo: true,
          lastBulkOperation: response.data.data,
          lastBulkOperationTime: new Date(),
        });
        
        return true;
      }
      
      return false;
    } catch (error: any) {
      set({
        error: error.response?.data?.message ?? "Failed to bulk update events",
      });
      get().fetchEvents();
      return false;
    }
  },

  bulkDeleteEvents: async (eventIds) => {
    try {
      const response = await axios.post('/api/v1/calendar/bulk-update', {
        event_ids: eventIds,
        new_date: new Date().toISOString(), // Not used for delete
        operation: 'delete',
      });

      if (response.data.success) {
        // Remove deleted events from local state
        const events = get().events.filter((ev) => !eventIds.includes(ev.id));
        set({ 
          events, 
          selectedEvents: new Set(),
          canUndo: true,
          lastBulkOperation: response.data.data,
          lastBulkOperationTime: new Date(),
        });
        
        return true;
      }
      
      return false;
    } catch (error: any) {
      set({
        error: error.response?.data?.message ?? "Failed to bulk delete events",
      });
      get().fetchEvents();
      return false;
    }
  },

  undoBulkOperation: async () => {
    try {
      const response = await axios.post('/api/v1/calendar/bulk-undo');

      if (response.data.success) {
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
    } catch (error: any) {
      set({
        error: error.response?.data?.message ?? "Failed to undo operation",
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
      const resourceId = id.includes("_") ? id.split("_")[2] : id;
      await axios.delete(`/api/v1/calendar/user-events/${resourceId}`);
      const events = get().events.filter((ev) => ev.id !== id);
      set({ events });

      return true;
    } catch (error: any) {
      set({
        error: error.message ?? "Failed to delete event",
      });
      return false;
    }
  },

  exportToGoogleCalendar: async () => {
    try {
      const { events } = get();
      const response = await axios.post('/api/v1/calendar/export/google', {
        events: events.map(e => ({
          title: e.title,
          start: e.start,
          end: e.end,
          description: `Status: ${e.status}`,
        })),
      });
      
      if (response.data.url) {
        window.open(response.data.url, '_blank');
      }
    } catch (error: any) {
      set({
        error: error.message ?? "Failed to export to Google Calendar",
      });
    }
  },

  exportToOutlook: async () => {
    try {
      const { events } = get();
      const response = await axios.post('/api/v1/calendar/export/outlook', {
        events: events.map(e => ({
          title: e.title,
          start: e.start,
          end: e.end,
          description: `Status: ${e.status}`,
        })),
      });
      
      if (response.data.url) {
        window.open(response.data.url, '_blank');
      }
    } catch (error: any) {
      set({
        error: error.message ?? "Failed to export to Outlook",
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
      const resourceId = conflict.eventId.split("_").pop();
      
      await axios.post(`/api/v1/calendar/events/${resourceId}/resolve-conflict`, {
        resolution,
        field: conflict.field,
        value: resolution === 'local' ? conflict.localValue : conflict.serverValue,
      });

      // Update local state
      const events = get().events.map((ev) =>
        ev.id === conflict.eventId 
          ? { ...ev, [conflict.field]: resolution === 'local' ? conflict.localValue : conflict.serverValue } 
          : ev,
      );
      
      set({ events, conflict: null });
      return true;
    } catch (error: any) {
      set({
        error: error.message ?? "Failed to resolve conflict",
      });
      return false;
    }
  },
}));
