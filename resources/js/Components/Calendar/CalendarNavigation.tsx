import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar as CalendarIcon,
  Loader2,
} from "lucide-react";
import { format, setMonth, setYear } from "date-fns";
import { useTranslation } from "react-i18next";
import { formatDate } from "@/Utils/i18nHelpers";
import { CalendarView } from "@/types/calendar";

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
      if (showMonthPicker && !target.closest(".month-picker-container")) {
        setShowMonthPicker(false);
      }
      if (showDatePicker && !target.closest(".date-picker-container")) {
        setShowDatePicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
      case "day":
        return formatDate(currentDate, "dayWeekMonthYear");
      case "week":
        return formatDate(currentDate, "monthYear");
      case "month":
      default:
        return formatDate(currentDate, "monthYear");
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
        <button
          onClick={() => setShowMonthPicker(!showMonthPicker)}
          className="flex items-center gap-3 text-3xl font-bold capitalize text-gray-900 transition-colors hover:text-primary-600 dark:text-white dark:hover:text-primary-400"
        >
          {getDateDisplay()}
          <ChevronDown
            className={`h-5 w-5 transition-transform ${showMonthPicker ? "rotate-180" : ""}`}
          />
          {isLoading && <Loader2 className="h-5 w-5 animate-spin text-primary-500" />}
        </button>

        {/* Month/Year Picker Dropdown */}
        {showMonthPicker && (
          <div className="absolute left-0 top-full z-50 mt-2 min-w-[280px] rounded-lg border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-black">
            <div className="mb-4 grid grid-cols-3 gap-2">
              {Array.from({ length: 12 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => goToMonth(i, currentDate.getFullYear())}
                  className={`rounded-lg p-2 text-sm transition-colors ${
                    currentDate.getMonth() === i
                      ? "bg-primary-500 text-white"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  {formatDate(new Date(2024, i, 1), "monthShort")}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => goToMonth(currentDate.getMonth(), currentDate.getFullYear() - 1)}
                className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="font-semibold text-gray-900 dark:text-white">
                {currentDate.getFullYear()}
              </span>
              <button
                onClick={() => goToMonth(currentDate.getMonth(), currentDate.getFullYear() + 1)}
                className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-100 p-1 dark:border-gray-700 dark:bg-gray-800">
        {/* Previous Button */}
        <button
          onClick={onNavigatePrevious}
          className="rounded-lg p-2 text-gray-600 shadow-sm transition-all hover:bg-white hover:shadow dark:text-gray-300 dark:hover:bg-gray-700"
          title={t("calendar.navigation.previous") || "Anterior"}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Today Button with visual indicator */}
        <button
          onClick={onNavigateToToday}
          className={`relative rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-all hover:bg-white hover:shadow dark:hover:bg-gray-700 ${
            isCurrentDay(currentDate)
              ? "bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300"
              : "text-gray-700 dark:text-gray-200"
          }`}
          title={t("calendar.navigation.today") || "Hoy"}
        >
          {isCurrentDay(currentDate) && (
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary-500"></span>
          )}
          {t("calendar.navigation.today") || "Hoy"}
        </button>

        {/* Next Button */}
        <button
          onClick={onNavigateNext}
          className="rounded-lg p-2 text-gray-600 shadow-sm transition-all hover:bg-white hover:shadow dark:text-gray-300 dark:hover:bg-gray-700"
          title={t("calendar.navigation.next") || "Siguiente"}
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* Date Picker Button */}
        <div className="date-picker-container relative ml-1">
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="rounded-lg p-2 text-gray-600 shadow-sm transition-all hover:bg-white hover:shadow dark:text-gray-300 dark:hover:bg-gray-700"
            title={t("calendar.navigation.selectDate") || "Seleccionar fecha"}
          >
            <CalendarIcon className="h-5 w-5" />
          </button>

          {/* Date Picker Dropdown */}
          {showDatePicker && (
            <div className="absolute right-0 top-full z-50 mt-2 rounded-lg border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-black">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("calendar.navigation.selectDate") || "Seleccionar fecha"}
              </label>
              <input
                type="date"
                value={format(currentDate, "yyyy-MM-dd")}
                onChange={handleDatePickerChange}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
