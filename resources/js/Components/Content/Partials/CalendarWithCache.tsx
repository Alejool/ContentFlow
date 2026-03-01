import { useEffect } from 'react';
import { useCalendarStore } from '@/stores/calendarStore';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import ModernCalendar from './ModernCalendar';
import { CalendarSkeleton, LoadingOverlay } from './CalendarSkeleton';

interface CalendarWithCacheProps {
  onEventClick: (event: any) => void;
}

/**
 * Calendar wrapper component that integrates React Query caching
 * with the Zustand calendar store.
 * 
 * This component:
 * - Uses React Query to fetch and cache calendar events (5-minute cache)
 * - Automatically refetches when date range or filters change
 * - Reduces server requests for repeated navigation
 * - Syncs React Query data with Zustand store for UI state management
 * - Shows loading indicators during data fetch and operations
 */
export function CalendarWithCache({ onEventClick }: CalendarWithCacheProps) {
  const { currentMonth, filters, setEvents, setLoading, setError } = useCalendarStore();

  // Use React Query hook for cached data fetching
  const { data: events, isLoading, error, isError, isFetching } = useCalendarEvents({
    currentMonth,
    filters,
  });

  // Sync React Query state with Zustand store - using useEffect is necessary here
  // for external state synchronization between React Query and Zustand
  useEffect(() => {
    if (events) {
      setEvents(events);
    }
    setLoading(isLoading);
    
    if (isError && error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch calendar events');
    } else {
      setError(null);
    }
  }, [events, isLoading, isError, error, setEvents, setLoading, setError]);

  // Show skeleton during initial load
  if (isLoading && !events) {
    return <CalendarSkeleton />;
  }

  return (
    <div className="relative">
      {/* Show overlay when refetching (e.g., after filter change) */}
      <LoadingOverlay show={isFetching && !!events} message="Updating calendar..." />
      <ModernCalendar onEventClick={onEventClick} />
    </div>
  );
}
