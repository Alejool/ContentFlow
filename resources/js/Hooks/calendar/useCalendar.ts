import { useCalendarStore } from "@/stores/calendarStore";
import { useManageContentUIStore } from "@/stores/manageContentUIStore";
import axios from "axios";
import { addMonths, setMonth, setYear, subMonths } from "date-fns";
import { useCallback, useEffect, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

export const useCalendar = () => {
  const {
    events,
    currentMonth,
    isLoading,
    platformFilter,
    statusFilter,
    campaignFilter,
    view,
    selectedEvents,
    setCurrentMonth,
    setPlatformFilter,
    setStatusFilter,
    setCampaignFilter,
    setView,
    toggleEventSelection,
    clearSelection,
    selectAll,
    fetchEvents,
    updateEvent,
    bulkUpdateEvents,
    deleteEvent,
    exportToGoogleCalendar,
    exportToOutlook,
  } = useCalendarStore(
    useShallow((s) => ({
      events: s.events,
      currentMonth: s.currentMonth,
      isLoading: s.isLoading,
      platformFilter: s.platformFilter,
      statusFilter: s.statusFilter,
      campaignFilter: s.campaignFilter,
      view: s.view,
      selectedEvents: s.selectedEvents,
      setCurrentMonth: s.setCurrentMonth,
      setPlatformFilter: s.setPlatformFilter,
      setStatusFilter: s.setStatusFilter,
      setCampaignFilter: s.setCampaignFilter,
      setView: s.setView,
      toggleEventSelection: s.toggleEventSelection,
      clearSelection: s.clearSelection,
      selectAll: s.selectAll,
      fetchEvents: s.fetchEvents,
      updateEvent: s.updateEvent,
      bulkUpdateEvents: s.bulkUpdateEvents,
      deleteEvent: s.deleteEvent,
      exportToGoogleCalendar: s.exportToGoogleCalendar,
      exportToOutlook: s.exportToOutlook,
    })),
  );

  const { openEditModal, openViewDetailsModal } = useManageContentUIStore();

  useEffect(() => {
    fetchEvents();
  }, [currentMonth, fetchEvents]);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      // Platform filter
      if (platformFilter !== "all") {
        if (platformFilter === "user_event" && e.type !== "user_event") return false;
        if (platformFilter !== "user_event" && e.extendedProps.platform?.toLowerCase() !== platformFilter) return false;
      }

      // Status filter
      if (statusFilter !== "all" && e.status !== statusFilter) return false;

      // Campaign filter
      if (campaignFilter && e.extendedProps.campaign_id !== campaignFilter) return false;

      return true;
    });
  }, [events, platformFilter, statusFilter, campaignFilter]);

  const nextMonth = useCallback(() => {
    setCurrentMonth(addMonths(currentMonth, 1));
  }, [currentMonth, setCurrentMonth]);

  const prevMonth = useCallback(() => {
    setCurrentMonth(subMonths(currentMonth, 1));
  }, [currentMonth, setCurrentMonth]);

  const goToToday = useCallback(() => {
    setCurrentMonth(new Date());
  }, [setCurrentMonth]);

  const goToMonth = useCallback(
    (month: number, year: number) => {
      setCurrentMonth(setYear(setMonth(new Date(), month), year));
    },
    [setCurrentMonth],
  );

  const handleEventDrop = useCallback(
    async (id: string, newDate: string, type: string) => {
      return await updateEvent(id, newDate, type);
    },
    [updateEvent],
  );

  const handleEventClick = useCallback(
    async (event: any) => {
      try {
        const type = event.type;
        const resourceId = event.id.split("_").pop();

        if (!resourceId || resourceId === "undefined") {
          return;
        }

        if (type === "user_event") {
          // Detailed handling of user_event if needed elsewhere,
          // for now ModernCalendar handles its own modal locally or via prop
          return;
        }

        if (type === "post") {
          const pubId = event.extendedProps?.publication_id;
          if (!pubId) {
            return;
          }
          const response = await axios.get(`/api/v1/publications/${pubId}`);
          const data = response.data.publication || response.data.data;
          if (data) (data as any).__type = "publication";
          openEditModal(data);
          return;
        }

        if (type === "publication") {
          const response = await axios.get(
            `/api/v1/publications/${resourceId}`,
          );
          const data = response.data.publication || response.data.data;
          if (data) (data as any).__type = "publication";
          openEditModal(data);
          return;
        }

        // Fallback for other types (e.g., campaigns)
        const response = await axios.get(`/api/v1/campaigns/${resourceId}`);
        const data =
          response.data.campaign || response.data.data || response.data;

        if (response.data.campaign) {
          if (data) (data as any).__type = "campaign";
          openEditModal(data);
        } else {
          openViewDetailsModal(data);
        }
      } catch (error) {
        }
    },
    [openEditModal, openViewDetailsModal],
  );

  const handleBulkMove = useCallback(
    async (newDate: Date) => {
      const selectedIds = Array.from(selectedEvents);
      return await bulkUpdateEvents(selectedIds, newDate.toISOString());
    },
    [selectedEvents, bulkUpdateEvents],
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
    refreshEvents: fetchEvents,
  };
};
