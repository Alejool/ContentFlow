import axios from "axios";
import { create } from "zustand";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';

interface CalendarEvent {
    id: string;
    resourceId: number;
    type: 'publication' | 'post';
    title: string;
    start: string | null;
    status: string;
    color: string;
    extendedProps: any;
}

interface CalendarState {
    events: CalendarEvent[];
    currentMonth: Date;
    isLoading: boolean;
    error: string | null;

    setCurrentMonth: (date: Date) => void;
    fetchEvents: () => Promise<void>;
    updateEvent: (id: string, newDate: string, type: string) => Promise<boolean>;
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
    events: [],
    currentMonth: new Date(),
    isLoading: false,
    error: null,

    setCurrentMonth: (date) => set({ currentMonth: date }),

    fetchEvents: async () => {
        const { currentMonth } = get();
        set({ isLoading: true, error: null });

        try {
            // Fetch full visible range to include edge days from adjacent months
            const start = startOfWeek(startOfMonth(currentMonth));
            const end = endOfWeek(endOfMonth(currentMonth));

            const response = await axios.get('/api/calendar/events', {
                params: {
                    start: format(start, 'yyyy-MM-dd'),
                    end: format(end, 'yyyy-MM-dd')
                }
            });

            set({
                events: response.data.data || [],
                isLoading: false
            });
        } catch (error: any) {
            set({
                error: error.message ?? "Failed to fetch calendar events",
                isLoading: false,
            });
        }
    },

    updateEvent: async (id, newDate, type) => {
        set({ isLoading: true, error: null });
        try {
            const resourceId = id.split('_')[1];
            await axios.patch(`/api/calendar/events/${resourceId}`, {
                scheduled_at: newDate,
                type: type
            });

            // Refresh events after update
            await get().fetchEvents();
            return true;
        } catch (error: any) {
            set({
                error: error.message ?? "Failed to update event",
                isLoading: false,
            });
            return false;
        }
    }
}));
