import axios from "axios";
import { endOfMonth, endOfWeek, startOfMonth, startOfWeek } from "date-fns";
import { create } from "zustand";
import { CalendarEvent, CalendarView, CalendarFilters } from "@/types/calendar";

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
  updateEvent: (id: string, newDate: string, type: string) => Promise<boolean>;
  bulkUpdateEvents: (eventIds: string[], newDate: string) => Promise<boolean>;
  bulkDeleteEvents: (eventIds: string[]) => Promise<boolean>;
  undoBulkOperation: () => Promise<boolean>;
  updateEventByResourceId: (
    resourceId: number,
    type: "publication" | "post" | "user_event",
    updates: Partial<CalendarEvent>,
  ) => void;
  deleteEvent: (id: string) => Promise<boolean>;
  exportToGoogleCalendar: () => Promise<void>;
  exportToOutlook: () => Promise<void>;
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
    // Trigger a re-fetch with the new filters
    get().fetchEvents();
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

  updateEvent: async (id, newDate, type) => {
    try {
      const resourceId = id.split("_").pop();
      let eventType = type;

      if (!eventType) {
        if (id.startsWith("pub_")) eventType = "publication";
        else if (id.startsWith("post_")) eventType = "post";
        else if (id.startsWith("user_event_")) eventType = "user_event";
      }

      await axios.patch(`/api/v1/calendar/events/${resourceId}`, {
        scheduled_at: newDate,
        type: eventType,
      });

      // Update local state inmediately
      const events = get().events.map((ev) =>
        ev.id === id ? { ...ev, start: newDate } : ev,
      );
      set({ events });

      return true;
    } catch (error: any) {
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
}));
