import axios from "axios";
import { endOfMonth, endOfWeek, startOfMonth, startOfWeek } from "date-fns";
import { create } from "zustand";

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

type CalendarView = "month" | "week" | "day";

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

  setCurrentMonth: (date: Date) => void;
  setPlatformFilter: (platform: string) => void;
  setStatusFilter: (status: string) => void;
  setCampaignFilter: (campaign: string | null) => void;
  setView: (view: CalendarView) => void;
  toggleEventSelection: (eventId: string) => void;
  clearSelection: () => void;
  selectAll: () => void;
  fetchEvents: () => Promise<void>;
  updateEvent: (id: string, newDate: string, type: string) => Promise<boolean>;
  bulkUpdateEvents: (eventIds: string[], newDate: string) => Promise<boolean>;
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

  setCurrentMonth: (date) => set({ currentMonth: date }),
  setPlatformFilter: (platform) => set({ platformFilter: platform }),
  setStatusFilter: (status) => set({ statusFilter: status }),
  setCampaignFilter: (campaign) => set({ campaignFilter: campaign }),
  setView: (view) => set({ view }),
  
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
    const allEventIds = get().events.map(e => e.id);
    set({ selectedEvents: new Set(allEventIds) });
  },

  fetchEvents: async () => {
    const { currentMonth } = get();
    set({ isLoading: true, error: null });

    try {
      const start = startOfWeek(startOfMonth(currentMonth)).toISOString();
      const end = endOfWeek(endOfMonth(currentMonth)).toISOString();

      const response = await axios.get(route("api.v1.calendar.events"), {
        params: { start, end },
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
      const promises = eventIds.map(id => {
        const event = get().events.find(e => e.id === id);
        if (!event) return Promise.resolve();
        
        const resourceId = id.split("_").pop();
        return axios.patch(`/api/v1/calendar/events/${resourceId}`, {
          scheduled_at: newDate,
          type: event.type,
        });
      });

      await Promise.all(promises);

      // Update local state
      const events = get().events.map((ev) =>
        eventIds.includes(ev.id) ? { ...ev, start: newDate } : ev,
      );
      set({ events, selectedEvents: new Set() });

      return true;
    } catch (error: any) {
      set({
        error: error.message ?? "Failed to bulk update events",
      });
      get().fetchEvents();
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
