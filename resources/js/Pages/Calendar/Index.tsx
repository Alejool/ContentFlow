
import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Loader2, Filter, Calendar as CalendarIcon, MoreHorizontal } from 'lucide-react';
import { FaInstagram, FaFacebook, FaTwitter, FaLinkedin, FaYoutube, FaTiktok } from 'react-icons/fa';
import axios from 'axios';
import { Menu, Transition } from '@headlessui/react';

// Types
interface CalendarEvent {
    id: string; // "pub_1" or "post_1"
    resourceId: number;
    type: 'publication' | 'post';
    title: string;
    start: string; // ISO
    status: string;
    color: string;
    extendedProps: {
        slug?: string;
        thumbnail?: string;
        publication_id?: number;
        platform?: string;
    };
}

const PlatformIcon = ({ platform, className }: { platform?: string, className?: string }) => {
    switch (platform?.toLowerCase()) {
        case 'instagram': return <FaInstagram className={`text-pink-600 ${className}`} />;
        case 'facebook': return <FaFacebook className={`text-blue-600 ${className}`} />;
        case 'twitter':
        case 'x': return <FaTwitter className={`text-sky-500 ${className}`} />;
        case 'linkedin': return <FaLinkedin className={`text-blue-700 ${className}`} />;
        case 'youtube': return <FaYoutube className={`text-red-600 ${className}`} />;
        case 'tiktok': return <FaTiktok className={`text-black dark:text-white ${className}`} />;
        default: return <CalendarIcon className={`text-gray-500 ${className}`} />;
    }
};

export default function CalendarIndex({ auth }: { auth: any }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);
    const [platformFilter, setPlatformFilter] = useState<string>('all');

    // Fetch events
    const fetchEvents = async () => {
        setLoading(true);
        try {
            const start = startOfMonth(currentDate).toISOString();
            const end = endOfMonth(currentDate).toISOString();
            const response = await axios.get(route('api.calendar.events'), {
                params: { start, end }
            });
            setEvents(response.data.data);
        } catch (error) {
            console.error("Failed to fetch events", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, [currentDate]);

    // Navigation
    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const goToToday = () => setCurrentDate(new Date());

    // Grid Generation
    const days = eachDayOfInterval({
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate)
    });

    const firstDayOfMonth = startOfMonth(currentDate).getDay();
    const startingEmptySlots = Array.from({ length: firstDayOfMonth });

    // Filter Events
    const filteredEvents = events.filter(e => {
        if (platformFilter === 'all') return true;
        return e.extendedProps.platform?.toLowerCase() === platformFilter;
    });

    // Drag and Drop Handlers
    const handleDragStart = (e: React.DragEvent, event: CalendarEvent) => {
        setDraggedEvent(event);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', event.id); // Required for Firefox
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e: React.DragEvent, date: Date) => {
        e.preventDefault();
        if (!draggedEvent) return;

        // Optimistic Update
        const updatedEvents = events.map(ev =>
            ev.id === draggedEvent.id
                ? { ...ev, start: date.toISOString() }
                : ev
        );
        setEvents(updatedEvents);

        try {
            const resourceId = draggedEvent.id.split('_')[1];
            await axios.patch(`/api/calendar/events/${resourceId}`, {
                scheduled_at: date.toISOString(),
                type: draggedEvent.type
            });
        } catch (error) {
            console.error("Failed to update event", error);
            fetchEvents(); // Revert
        } finally {
            setDraggedEvent(null);
        }
    };

    const platforms = ['all', 'instagram', 'facebook', 'twitter', 'linkedin', 'youtube', 'tiktok'];

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Planificador</h2>}
        >
            <Head title="Planificador de Contenido" />

            <div className="py-8">
                <div className="max-w-[1600px] mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-900 overflow-hidden shadow-xl sm:rounded-2xl border border-gray-100 dark:border-gray-800">
                        <div className="p-6">

                            {/* Toolbar */}
                            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
                                <div className="flex items-center gap-4">
                                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white capitalize flex items-center gap-3">
                                        {format(currentDate, 'MMMM yyyy', { locale: es })}
                                        {loading && <Loader2 className="w-5 h-5 animate-spin text-primary-500" />}
                                    </h3>
                                </div>

                                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-center md:justify-end">
                                    {/* Platform Filter */}
                                    <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mr-2">
                                        {platforms.slice(0, 4).map(p => (
                                            <button
                                                key={p}
                                                onClick={() => setPlatformFilter(p)}
                                                className={`p-2 rounded-md transition-all ${platformFilter === p ? 'bg-white dark:bg-gray-700 shadow text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                                                title={p}
                                            >
                                                {p === 'all' ? <Filter className="w-4 h-4" /> : <PlatformIcon platform={p} className="w-4 h-4" />}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
                                        <button onClick={prevMonth} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all shadow-sm hover:shadow text-gray-600 dark:text-gray-300">
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>
                                        <button onClick={goToToday} className="px-4 py-2 text-sm font-semibold hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all shadow-sm hover:shadow text-gray-700 dark:text-gray-200">
                                            Hoy
                                        </button>
                                        <button onClick={nextMonth} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all shadow-sm hover:shadow text-gray-600 dark:text-gray-300">
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Calendar Grid */}
                            <div className="border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm bg-gray-50 dark:bg-gray-900/50">
                                {/* Weekday Headers */}
                                <div className="grid grid-cols-7 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                                    {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                                        <div key={day} className="py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                {/* Days */}
                                <div className="grid grid-cols-7 auto-rows-fr min-h-[700px] bg-gray-200 dark:bg-gray-800 gap-px">
                                    {/* Empty Slots */}
                                    {startingEmptySlots.map((_, i) => (
                                        <div key={`empty-${i}`} className="bg-gray-50/50 dark:bg-gray-900/50 p-2"></div>
                                    ))}

                                    {/* Actual Days */}
                                    {days.map(day => {
                                        const dayEvents = filteredEvents.filter(e => isSameDay(parseISO(e.start), day));
                                        const isCurrentMonth = isSameMonth(day, currentDate);
                                        const isTodayDay = isToday(day);

                                        return (
                                            <div
                                                key={day.toISOString()}
                                                onDragOver={handleDragOver}
                                                onDrop={(e) => handleDrop(e, day)}
                                                className={`
                                                    relative p-2 min-h-[140px] transition-all group
                                                    ${isCurrentMonth ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/30 dark:bg-gray-900/30'}
                                                    ${isTodayDay ? 'bg-purple-50/10 dark:bg-primary-900/5' : ''}
                                                    hover:bg-gray-50 dark:hover:bg-gray-800/50
                                                `}
                                            >
                                                {/* Date Header */}
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className={`
                                                        text-sm font-medium w-8 h-8 flex items-center justify-center rounded-full transition-colors
                                                        ${isTodayDay
                                                            ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
                                                            : 'text-gray-500 dark:text-gray-400 group-hover:bg-gray-100 dark:group-hover:bg-gray-800'}
                                                    `}>
                                                        {format(day, 'd')}
                                                    </span>
                                                    {isTodayDay && <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400">HOY</span>}
                                                </div>

                                                {/* Events Stack */}
                                                <div className="flex flex-col gap-2 relative z-10">
                                                    {dayEvents.map(event => (
                                                        <div
                                                            key={event.id}
                                                            draggable
                                                            onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, event)}
                                                            className={`
                                                                relative overflow-hidden
                                                                rounded-lg border border-gray-100 dark:border-gray-700/50 
                                                                bg-white dark:bg-gray-800 shadow-sm hover:shadow-md 
                                                                cursor-grab active:cursor-grabbing transition-all hover:-translate-y-0.5
                                                                group/card
                                                            `}
                                                        >
                                                            {/* Status Indicator Bar */}
                                                            <div
                                                                className="absolute left-0 top-0 bottom-0 w-1"
                                                                style={{ backgroundColor: event.color }}
                                                            />

                                                            <div className="p-2 pl-3 flex items-start gap-2">
                                                                {/* Icon */}
                                                                <div className="mt-0.5 flex-shrink-0 text-gray-400 dark:text-gray-500">
                                                                    <PlatformIcon platform={event.extendedProps.platform} className="w-3.5 h-3.5" />
                                                                </div>

                                                                {/* Content */}
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate leading-tight">
                                                                        {event.title}
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5 mt-1">
                                                                        <span className="text-[10px] text-gray-400 dark:text-gray-500 capitalize">
                                                                            {format(parseISO(event.start), 'HH:mm')} • {event.status}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Thumbnail Background (Optional - Subtle) */}
                                                            {/* {event.extendedProps.thumbnail && (
                                                                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-cover bg-center" style={{ backgroundImage: `url(${event.extendedProps.thumbnail})` }} />
                                                            )} */}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

