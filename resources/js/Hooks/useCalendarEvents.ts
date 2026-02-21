import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { 
  endOfMonth, 
  endOfWeek, 
  startOfMonth, 
  startOfWeek 
} from 'date-fns';
import { CalendarEvent, CalendarFilters } from '@/types/calendar';

interface FetchEventsParams {
  currentMonth: Date;
  filters: CalendarFilters;
}

interface UpdateEventParams {
  id: string;
  newDate: string;
  type: string;
}

interface BulkUpdateParams {
  eventIds: string[];
  newDate: string;
  operation: 'move' | 'delete';
}

// Fetch calendar events with caching
export function useCalendarEvents({ currentMonth, filters }: FetchEventsParams) {
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

  // Create a unique query key based on date range and filters
  const queryKey = ['calendar-events', start, end, filters];

  return useQuery({
    queryKey,
    queryFn: async () => {
      const response = await axios.get(route('api.v1.calendar.events'), {
        params,
      });
      return response.data.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Update single event
export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, newDate, type }: UpdateEventParams) => {
      const resourceId = id.split('_').pop();
      let eventType = type;

      if (!eventType) {
        if (id.startsWith('pub_')) eventType = 'publication';
        else if (id.startsWith('post_')) eventType = 'post';
        else if (id.startsWith('user_event_')) eventType = 'user_event';
      }

      await axios.patch(`/api/v1/calendar/events/${resourceId}`, {
        scheduled_at: newDate,
        type: eventType,
      });

      return { id, newDate };
    },
    onSuccess: () => {
      // Invalidate all calendar event queries to refetch
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
  });
}

// Bulk update events
export function useBulkUpdateEvents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventIds, newDate, operation }: BulkUpdateParams) => {
      const response = await axios.post('/api/v1/calendar/bulk-update', {
        event_ids: eventIds,
        new_date: newDate,
        operation,
      });

      return response.data;
    },
    onSuccess: () => {
      // Invalidate all calendar event queries to refetch
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
  });
}

// Undo bulk operation
export function useUndoBulkOperation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await axios.post('/api/v1/calendar/bulk-undo');
      return response.data;
    },
    onSuccess: () => {
      // Invalidate all calendar event queries to refetch
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
  });
}

// Delete event
export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const resourceId = id.includes('_') ? id.split('_')[2] : id;
      await axios.delete(`/api/v1/calendar/user-events/${resourceId}`);
      return id;
    },
    onSuccess: () => {
      // Invalidate all calendar event queries to refetch
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
  });
}
