import Button from '@/Components/common/Modern/Button';
import DatePickerModern from '@/Components/common/Modern/DatePicker';
import { formatDate } from '@/Utils/common/i18nHelpers';
import type { CalendarView } from '@/types/Calendar/calendar';
import { setMonth, setYear } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const today = new Date();

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

  const getDateDisplay = () => {
    switch (view) {
      case 'day':
        return formatDate(currentDate, 'dayWeekMonthYear');
      case 'week':
        return formatDate(currentDate, 'monthYear');
      case 'month':
      default:
        return formatDate(currentDate, 'monthYear');
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
      <div className="month-picker-container relative">
        <Button
          onClick={() => setShowMonthPicker(!showMonthPicker)}
          variant="ghost"
          buttonStyle="ghost"
          className="hover:text-primary-600 dark:hover:text-primary-400 flex items-center gap-3 border-none p-0! text-3xl! font-bold text-gray-900 capitalize shadow-none transition-colors hover:bg-transparent! dark:text-white"
          icon={
            isLoading ? <Loader2 className="text-primary-500 h-5 w-5 animate-spin" /> : undefined
          }
        >
          {getDateDisplay()}
        </Button>

        {/* Month/Year Picker Dropdown */}
        {showMonthPicker && (
          <div className="absolute top-full left-0 z-50 mt-2 min-w-7 rounded-lg border border-gray-200 bg-white p-4 shadow-lg dark:border-neutral-800 dark:bg-neutral-800">
            <div className="mb-4 grid grid-cols-3 gap-2">
              {Array.from({ length: 12 }, (_, i) => (
                <Button
                  key={i}
                  onClick={() => goToMonth(i, currentDate.getFullYear())}
                  variant={currentDate.getMonth() === i ? 'primary' : 'ghost'}
                  buttonStyle={currentDate.getMonth() === i ? 'solid' : 'ghost'}
                  size="md"
                  className={`text-sm ${
                    currentDate.getMonth() === i
                      ? ''
                      : 'border-none! text-gray-700 hover:bg-gray-100 dark:text-neutral-300 dark:hover:bg-neutral-900'
                  }`}
                >
                  {formatDate(new Date(2024, i, 1), 'monthShort')}
                </Button>
              ))}
            </div>
            <div className="flex items-center justify-between gap-2">
              <Button
                onClick={() => goToMonth(currentDate.getMonth(), currentDate.getFullYear() - 1)}
                variant="secondary"
                buttonStyle="icon"
                size="sm"
                className="p-2! transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-semibold text-gray-900 dark:text-white">
                {currentDate.getFullYear()}
              </span>
              <Button
                onClick={() => goToMonth(currentDate.getMonth(), currentDate.getFullYear() + 1)}
                variant="secondary"
                buttonStyle="icon"
                size="sm"
                className="p-2! transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-100 p-1 dark:border-neutral-800 dark:bg-neutral-900">
        <Button
          onClick={onNavigatePrevious}
          buttonStyle="icon"
          variant="ghost"
          size="sm"
          rounded="lg"
          shadow="sm"
          className="border-none! p-2 text-gray-600! hover:bg-white! dark:text-neutral-300! dark:hover:bg-neutral-800!"
          title={t('calendar.navigation.previous') || 'Anterior'}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <Button
          onClick={onNavigateToToday}
          variant={isCurrentDay(currentDate) ? 'primary' : 'secondary'}
          buttonStyle={'ghost'}
          size="sm"
          rounded="lg"
          shadow="sm"
          className={`relative font-semibold transition-all hover:shadow ${
            isCurrentDay(currentDate)
              ? 'bg-primary-100! text-primary-700! dark:bg-primary-900! dark:text-primary-300!'
              : 'text-gray-700! hover:bg-white! dark:text-neutral-200! dark:hover:bg-neutral-800!'
          }`}
          title={t('calendar.navigation.today') || 'Hoy'}
        >
          {isCurrentDay(currentDate) && (
            <span className="bg-primary-500 absolute top-1 right-1 h-2 w-2 rounded-full"></span>
          )}
          {t('calendar.navigation.today') || 'Hoy'}
        </Button>

        <Button
          onClick={onNavigateNext}
          buttonStyle="icon"
          variant="ghost"
          size="sm"
          rounded="lg"
          shadow="sm"
          className="border-none! p-2 text-gray-600! hover:bg-white! dark:text-neutral-300! dark:hover:bg-neutral-800!"
          title={t('calendar.navigation.next') || 'Siguiente'}
          icon={<ChevronRight className="h-5 w-5" />}
        >
          {''}
        </Button>

        <div className="relative">
          <Button
            onClick={() => setShowDatePicker(!showDatePicker)}
            buttonStyle="icon"
            variant="ghost"
            size="sm"
            rounded="lg"
            shadow="sm"
            className="border-none! p-2 text-gray-600! hover:bg-white! dark:text-neutral-300! dark:hover:bg-neutral-800!"
            title={t('calendar.navigation.selectDate') || 'Seleccionar fecha'}
            icon={<CalendarIcon className="h-5 w-5" />}
          >
            {''}
          </Button>

          {showDatePicker && (
            <div className="date-picker-container absolute top-full right-0 z-50 mt-2">
              <DatePickerModern
                inline
                selected={currentDate}
                onChange={(date) => {
                  if (date) {
                    onNavigateToDate(date);
                  }
                  setShowDatePicker(false);
                }}
                showTimeSelect={false}
                placeholder={t('calendar.navigation.selectDate') || 'Seleccionar fecha'}
                isClearable={false}
                allowPastDates={true}
                yearRange={{ past: 5, future: 5 }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
