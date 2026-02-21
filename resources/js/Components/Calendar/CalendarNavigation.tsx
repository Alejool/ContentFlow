import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { format, setMonth, setYear } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { CalendarView } from '@/types/calendar';

interface CalendarNavigationProps {
  currentDate: Date;
  view: CalendarView;
  onNavigatePrevious: () => void;
  onNavigateNext: () => void;
  onNavigateToToday: () => void;
  onNavigateToDate: (date: Date) => void;
  isLoading?: boolean;
}

export const CalendarNavigation: React.FC<CalendarNavigationProps> = ({
  currentDate,
  view,
  onNavigatePrevious,
  onNavigateNext,
  onNavigateToToday,
  onNavigateToDate,
  isLoading = false,
}) => {
  const { t, i18n } = useTranslation();
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const today = new Date();

  // Close pickers when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showMonthPicker && !target.closest('.month-picker-container')) {
        setShowMonthPicker(false);
      }
      if (showDatePicker && !target.closest('.date-picker-container')) {
        setShowDatePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMonthPicker, showDatePicker]);

  const goToMonth = (month: number, year: number) => {
    const newDate = setYear(setMonth(new Date(currentDate), month), year);
    onNavigateToDate(newDate);
    setShowMonthPicker(false);
  };

  const handleDatePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = new Date(e.target.value);
    if (!isNaN(selectedDate.getTime())) {
      onNavigateToDate(selectedDate);
      setShowDatePicker(false);
    }
  };

  // Format the current date display based on view
  const getDateDisplay = () => {
    switch (view) {
      case 'day':
        return new Intl.DateTimeFormat(i18n.language || undefined, {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }).format(currentDate);
      case 'week':
        return new Intl.DateTimeFormat(i18n.language || undefined, {
          month: 'long',
          year: 'numeric',
        }).format(currentDate);
      case 'month':
      default:
        return new Intl.DateTimeFormat(i18n.language || undefined, {
          month: 'long',
          year: 'numeric',
        }).format(currentDate);
    }
  };

  const isCurrentDay = (date: Date) => {
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="flex items-center gap-4">
      {/* Date Display with Dropdown */}
      <div className="relative month-picker-container">
        <button
          onClick={() => setShowMonthPicker(!showMonthPicker)}
          className="text-3xl font-bold text-gray-900 dark:text-white capitalize flex items-center gap-3 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          {getDateDisplay()}
          <ChevronDown
            className={`w-5 h-5 transition-transform ${showMonthPicker ? 'rotate-180' : ''}`}
          />
          {isLoading && (
            <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
          )}
        </button>

        {/* Month/Year Picker Dropdown */}
        {showMonthPicker && (
          <div className="absolute top-full left-0 mt-2 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-4 min-w-[280px]">
            <div className="grid grid-cols-3 gap-2 mb-4">
              {Array.from({ length: 12 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => goToMonth(i, currentDate.getFullYear())}
                  className={`p-2 text-sm rounded-lg transition-colors ${
                    currentDate.getMonth() === i
                      ? 'bg-primary-500 text-white'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {new Intl.DateTimeFormat(i18n.language || undefined, {
                    month: 'short',
                  }).format(new Date(2024, i, 1))}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() =>
                  goToMonth(currentDate.getMonth(), currentDate.getFullYear() - 1)
                }
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-gray-900 dark:text-white">
                {currentDate.getFullYear()}
              </span>
              <button
                onClick={() =>
                  goToMonth(currentDate.getMonth(), currentDate.getFullYear() + 1)
                }
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
        {/* Previous Button */}
        <button
          onClick={onNavigatePrevious}
          className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all shadow-sm hover:shadow text-gray-600 dark:text-gray-300"
          title={t('calendar.navigation.previous') || 'Anterior'}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Today Button with visual indicator */}
        <button
          onClick={onNavigateToToday}
          className={`px-4 py-2 text-sm font-semibold hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all shadow-sm hover:shadow relative ${
            isCurrentDay(currentDate)
              ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
              : 'text-gray-700 dark:text-gray-200'
          }`}
          title={t('calendar.navigation.today') || 'Hoy'}
        >
          {isCurrentDay(currentDate) && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full"></span>
          )}
          {t('calendar.navigation.today') || 'Hoy'}
        </button>

        {/* Next Button */}
        <button
          onClick={onNavigateNext}
          className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all shadow-sm hover:shadow text-gray-600 dark:text-gray-300"
          title={t('calendar.navigation.next') || 'Siguiente'}
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Date Picker Button */}
        <div className="relative date-picker-container ml-1">
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all shadow-sm hover:shadow text-gray-600 dark:text-gray-300"
            title={t('calendar.navigation.selectDate') || 'Seleccionar fecha'}
          >
            <CalendarIcon className="w-5 h-5" />
          </button>

          {/* Date Picker Dropdown */}
          {showDatePicker && (
            <div className="absolute top-full right-0 mt-2 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('calendar.navigation.selectDate') || 'Seleccionar fecha'}
              </label>
              <input
                type="date"
                value={format(currentDate, 'yyyy-MM-dd')}
                onChange={handleDatePickerChange}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
