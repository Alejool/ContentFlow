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
    setCurrentMonth,
    setPlatformFilter,
    fetchEvents,
    updateEvent,
    deleteEvent,
  } = useCalendarStore(
    useShallow((s) => ({
      events: s.events,
      currentMonth: s.currentMonth,
      isLoading: s.isLoading,
      platformFilter: s.platformFilter,
      setCurrentMonth: s.setCurrentMonth,
      setPlatformFilter: s.setPlatformFilter,
      fetchEvents: s.fetchEvents,
      updateEvent: s.updateEvent,
      deleteEvent: s.deleteEvent,
    })),
  );

  const { openEditModal, openViewDetailsModal } = useManageContentUIStore();

  useEffect(() => {
    fetchEvents();
  }, [currentMonth, fetchEvents]);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (platformFilter === "all") return true;
      if (platformFilter === "user_event") return e.type === "user_event";
      return e.extendedProps.platform?.toLowerCase() === platformFilter;
    });
  }, [events, platformFilter]);

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
          console.error("Invalid resource ID in event", event);
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
            console.error(
              "No publication_id found in event extendedProps",
              event,
            );
            return;
          }
          const response = await axios.get(`/publications/${pubId}`);
          const data = response.data.publication || response.data.data;
          if (data) (data as any).__type = "publication";
          openEditModal(data);
          return;
        }

        if (type === "publication") {
          const response = await axios.get(`/publications/${resourceId}`);
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
        console.error("Failed to load event details", error);
      }
    },
    [openEditModal, openViewDetailsModal],
  );

  return {
    events,
    filteredEvents,
    currentMonth,
    isLoading,
    platformFilter,
    setPlatformFilter,
    nextMonth,
    prevMonth,
    goToToday,
    goToMonth,
    handleEventDrop,
    handleEventClick,
    deleteEvent,
    refreshEvents: fetchEvents,
  };
};
