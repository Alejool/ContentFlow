import { useCalendarStore } from "@/stores/calendarStore";
import { useManageContentUIStore } from "@/stores/manageContentUIStore";
import { addMonths, subMonths } from "date-fns";
import { useEffect, useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import axios from "axios";

export const useCalendar = () => {
    const {
        events,
        currentMonth,
        isLoading,
        setCurrentMonth,
        fetchEvents,
        updateEvent,
    } = useCalendarStore(
        useShallow((s) => ({
            events: s.events,
            currentMonth: s.currentMonth,
            isLoading: s.isLoading,
            setCurrentMonth: s.setCurrentMonth,
            fetchEvents: s.fetchEvents,
            updateEvent: s.updateEvent,
        }))
    );

    const {
        openEditModal,
        openViewDetailsModal,
    } = useManageContentUIStore();

    useEffect(() => {
        fetchEvents();
    }, [currentMonth, fetchEvents]);

    const nextMonth = useCallback(() => {
        setCurrentMonth(addMonths(currentMonth, 1));
    }, [currentMonth, setCurrentMonth]);

    const prevMonth = useCallback(() => {
        setCurrentMonth(subMonths(currentMonth, 1));
    }, [currentMonth, setCurrentMonth]);

    const goToToday = useCallback(() => {
        setCurrentMonth(new Date());
    }, [setCurrentMonth]);

    const handleEventDrop = useCallback(async (id: string, newDate: string, type: string) => {
        return await updateEvent(id, newDate, type);
    }, [updateEvent]);

    const handleEventClick = useCallback(async (event: any) => {
        try {
            const type = event.type;
            const resourceId = event.id.split('_')[1];

            if (!resourceId || resourceId === 'undefined') {
                console.error("Invalid resource ID in event", event);
                return;
            }

            if (type === 'post') {
                const pubId = event.extendedProps?.publication_id;
                if (!pubId) {
                    console.error("No publication_id found in event extendedProps", event);
                    return;
                }
                const response = await axios.get(`/publications/${pubId}`);
                const data = response.data.publication || response.data.data;
                if (data) (data as any).__type = 'publication';
                openEditModal(data);
                return;
            }

            if (type === 'publication') {
                const response = await axios.get(`/publications/${resourceId}`);
                const data = response.data.publication || response.data.data;
                if (data) (data as any).__type = 'publication';
                openEditModal(data);
                return;
            }

            // Fallback for other types (e.g., campaigns)
            const response = await axios.get(`/campaigns/${resourceId}`);
            const data = response.data.campaign || response.data.data || response.data;

            if (response.data.campaign) {
                if (data) (data as any).__type = 'campaign';
                openEditModal(data);
            } else {
                openViewDetailsModal(data);
            }
        } catch (error) {
            console.error("Failed to load event details", error);
        }
    }, [openEditModal, openViewDetailsModal]);

    return {
        events,
        currentMonth,
        isLoading,
        nextMonth,
        prevMonth,
        goToToday,
        handleEventDrop,
        handleEventClick,
        refreshEvents: fetchEvents,
    };
};
