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
  };
}

interface CalendarState {
  events: CalendarEvent[];
  currentMonth: Date;
  isLoading: boolean;
  error: string | null;
  platformFilter: string;

  setCurrentMonth: (date: Date) => void;
  setPlatformFilter: (platform: string) => void;
  fetchEvents: () => Promise<void>;
  updateEvent: (id: string, newDate: string, type: string) => Promise<boolean>;
  deleteEvent: (id: string) => Promise<boolean>;
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  events: [],
  currentMonth: new Date(),
  isLoading: false,
  error: null,
  platformFilter: "all",

  setCurrentMonth: (date) => set({ currentMonth: date }),
  setPlatformFilter: (platform) => set({ platformFilter: platform }),

  fetchEvents: async () => {
    const { currentMonth } = get();
    set({ isLoading: true, error: null });

    try {
      const start = startOfWeek(startOfMonth(currentMonth)).toISOString();
      const end = endOfWeek(endOfMonth(currentMonth)).toISOString();

      const response = await axios.get("/api/calendar/events", {
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

      await axios.patch(`/api/calendar/events/${resourceId}`, {
        scheduled_at: newDate,
        type: eventType,
      });

      // Update local state for immediate feedback
      const events = get().events.map((ev) =>
        ev.id === id ? { ...ev, start: newDate } : ev,
      );
      set({ events });

      return true;
    } catch (error: any) {
      set({
        error: error.message ?? "Failed to update event",
      });
      get().fetchEvents(); // Re-fetch on error to sync
      return false;
    }
  },

  deleteEvent: async (id) => {
    try {
      const resourceId = id.includes("_") ? id.split("_")[2] : id;
      await axios.delete(`/api/calendar/user-events/${resourceId}`);

      // Update local state
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
}));
