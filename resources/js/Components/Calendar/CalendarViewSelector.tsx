import React, { useEffect } from 'react';
import { Calendar, CalendarDays, CalendarRange } from 'lucide-react';
import { CalendarView } from '@/types/calendar';

interface CalendarViewSelectorProps {
  currentView: CalendarView;
  onViewChange: (view: CalendarView) => void;
}

const VIEW_STORAGE_KEY = 'calendar_preferred_view';

export const CalendarViewSelector: React.FC<CalendarViewSelectorProps> = ({
  currentView,
  onViewChange,
}) => {
  // Load preferred view from localStorage on mount
  useEffect(() => {
    const savedView = localStorage.getItem(VIEW_STORAGE_KEY) as CalendarView | null;
    if (savedView && ['month', 'week', 'day'].includes(savedView)) {
      onViewChange(savedView);
    }
  }, []);

  // Persist view preference when it changes
  const handleViewChange = (view: CalendarView) => {
    localStorage.setItem(VIEW_STORAGE_KEY, view);
    onViewChange(view);
  };

  const views: Array<{ value: CalendarView; label: string; icon: React.ReactNode }> = [
    { value: 'month', label: 'Mes', icon: <CalendarRange className="w-4 h-4" /> },
    { value: 'week', label: 'Semana', icon: <CalendarDays className="w-4 h-4" /> },
    { value: 'day', label: 'Día', icon: <Calendar className="w-4 h-4" /> },
  ];

  return (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
      {views.map((view) => (
        <button
          key={view.value}
          onClick={() => handleViewChange(view.value)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium
            ${
              currentView === view.value
                ? 'bg-white dark:bg-gray-700 shadow text-primary-600 dark:text-primary-400'
                : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/50'
            }
          `}
          aria-label={`Vista ${view.label}`}
          aria-pressed={currentView === view.value}
        >
          {view.icon}
          <span className="hidden sm:inline">{view.label}</span>
        </button>
      ))}
    </div>
  );
};
