import {
  useBulkUpdateEvents,
  useCalendarEvents,
  useDeleteEvent,
  useUpdateEvent,
} from '@/Hooks/useCalendarEvents';
import { useCalendarStore } from '@/stores/calendarStore';
import { useManageContentUIStore } from '@/stores/manageContentUIStore';
import axios from 'axios';
import { addMonths, setMonth, setYear, subMonths } from 'date-fns';
import { useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

export const useCalendar = () => {
  const {
    currentMonth,
    platformFilter,
    statusFilter,
    campaignFilter,
    view,
    selectedEvents,
    filters,
    setCurrentMonth,
    setPlatformFilter,
    setStatusFilter,
    setCampaignFilter,
    setView,
    toggleEventSelection,
    clearSelection,
    selectAll,
    exportToGoogleCalendar,
    exportToOutlook,
  } = useCalendarStore(
    useShallow((s) => ({
      currentMonth: s.currentMonth,
      platformFilter: s.platformFilter,
      statusFilter: s.statusFilter,
      campaignFilter: s.campaignFilter,
      view: s.view,
      selectedEvents: s.selectedEvents,
      filters: s.filters,
      setCurrentMonth: s.setCurrentMonth,
      setPlatformFilter: s.setPlatformFilter,
      setStatusFilter: s.setStatusFilter,
      setCampaignFilter: s.setCampaignFilter,
      setView: s.setView,
      toggleEventSelection: s.toggleEventSelection,
      clearSelection: s.clearSelection,
      selectAll: s.selectAll,
      exportToGoogleCalendar: s.exportToGoogleCalendar,
      exportToOutlook: s.exportToOutlook,
    })),
  );

  const { openEditModal, openViewDetailsModal } = useManageContentUIStore();

  // TanStack Query handles fetching, caching, and refetching
  const { data: events = [], isLoading, refetch } = useCalendarEvents({ currentMonth, filters });

  const updateEvent = useUpdateEvent();
  const bulkUpdate = useBulkUpdateEvents();
  const deleteEventMutation = useDeleteEvent();

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (platformFilter !== 'all') {
        if (platformFilter === 'user_event') {
          if (e.type !== 'user_event') return false;
        } else {
          if (e.type === 'user_event') return false;
          const eventPlatform = (e.platform || e.extendedProps?.platform)?.toLowerCase();
          if (!eventPlatform || eventPlatform !== platformFilter.toLowerCase()) return false;
        }
      }
      if (statusFilter !== 'all' && e.status !== statusFilter) return false;
      if (campaignFilter && e.extendedProps.campaign_id !== campaignFilter) return false;
      return true;
    });
  }, [events, platformFilter, statusFilter, campaignFilter]);

  const nextMonth = useCallback(
    () => setCurrentMonth(addMonths(currentMonth, 1)),
    [currentMonth, setCurrentMonth],
  );
  const prevMonth = useCallback(
    () => setCurrentMonth(subMonths(currentMonth, 1)),
    [currentMonth, setCurrentMonth],
  );
  const goToToday = useCallback(() => setCurrentMonth(new Date()), [setCurrentMonth]);
  const goToMonth = useCallback(
    (month: number, year: number) => setCurrentMonth(setYear(setMonth(new Date(), month), year)),
    [setCurrentMonth],
  );

  const handleEventDrop = useCallback(
    async (id: string, newDate: string, type: string) => {
      return updateEvent.mutateAsync({ id, newDate, type });
    },
    [updateEvent],
  );

  const handleEventClick = useCallback(
    async (event: any) => {
      try {
        const type = event.type;
        const resourceId = event.id.split('_').pop();
        if (!resourceId || resourceId === 'undefined') return;

        if (type === 'user_event') return;

        if (type === 'post') {
          const pubId = event.extendedProps?.publication_id;
          if (!pubId) return;
          const response = await axios.get(`/api/v1/publications/${pubId}`);
          const data = response.data.publication || response.data.data;
          if (data) (data as any).__type = 'publication';
          openEditModal(data);
          return;
        }

        if (type === 'publication') {
          const response = await axios.get(`/api/v1/publications/${resourceId}`);
          const data = response.data.publication || response.data.data;
          if (data) (data as any).__type = 'publication';
          openEditModal(data);
          return;
        }

        const response = await axios.get(`/api/v1/campaigns/${resourceId}`);
        const data = response.data.campaign || response.data.data || response.data;
        if (response.data.campaign) {
          if (data) (data as any).__type = 'campaign';
          openEditModal(data);
        } else {
          openViewDetailsModal(data);
        }
      } catch {}
    },
    [openEditModal, openViewDetailsModal],
  );

  const handleBulkMove = useCallback(
    async (newDate: Date) => {
      const selectedIds = Array.from(selectedEvents);
      return bulkUpdate.mutateAsync({
        eventIds: selectedIds,
        newDate: newDate.toISOString(),
        operation: 'move',
      });
    },
    [selectedEvents, bulkUpdate],
  );

  const deleteEvent = useCallback(
    (id: string) => deleteEventMutation.mutateAsync(id),
    [deleteEventMutation],
  );

  return {
    events,
    filteredEvents,
    currentMonth,
    isLoading,
    platformFilter,
    statusFilter,
    campaignFilter,
    view,
    selectedEvents,
    filters,
    setPlatformFilter,
    setStatusFilter,
    setCampaignFilter,
    setView,
    toggleEventSelection,
    clearSelection,
    selectAll,
    nextMonth,
    prevMonth,
    goToToday,
    goToMonth,
    handleEventDrop,
    handleEventClick,
    handleBulkMove,
    deleteEvent,
    exportToGoogleCalendar,
    exportToOutlook,
    refreshEvents: refetch,
  };
};
