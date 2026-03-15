import { validateDate } from '@/Utils/dateValidation';
import { AlertTriangle } from 'lucide-react';
import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useTranslation } from 'react-i18next';

interface DateTimePickerProps {
  selectedDate: Date;
  onChange: (date: Date) => void;
  minDate?: Date;
  showWarningForPastDates?: boolean;
  className?: string;
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  selectedDate,
  onChange,
  minDate,
  showWarningForPastDates = true,
  className = '',
}) => {
  const { t } = useTranslation();
  // Validate date whenever it changes — derived state, no effect needed
  const validation = useMemo(() => validateDate(selectedDate), [selectedDate, showWarningForPastDates]);

  const handleDateChange = (date: Date | null) => {
    if (!date) return;

    // Only call onChange if date is valid
    const result = validateDate(date);
    if (result.isValid) {
      onChange(date);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Date Picker */}
      <div className="flex justify-center">
        <DatePicker
          selected={selectedDate}
          onChange={handleDateChange}
          showTimeSelect
          timeFormat="HH:mm"
          timeIntervals={15}
          dateFormat="MMMM d, yyyy h:mm aa"
          inline
          minDate={minDate}
          className="rounded-lg border border-gray-300 dark:border-gray-600"
        />
      </div>

      {/* Validation Messages */}
      {!validation.isValid && validation.error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              {validation.isPastDate
                ? t('calendar.validation.past_date_error', 'Cannot Schedule in the Past')
                : t('calendar.validation.invalid_date', 'Invalid Date')}
            </p>
            <p className="mt-1 text-xs text-red-600 dark:text-red-300">
              {validation.isPastDate
                ? t(
                    'calendar.validation.past_date_message',
                    'You cannot schedule events for past dates. Please select a future date and time.',
                  )
                : validation.error}
            </p>
          </div>
        </div>
      )}

      {/* Selected Date Display */}
      {validation.isValid && (
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('calendar.selected_date', 'Selected date:')}
          </p>
          <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
            {selectedDate.toLocaleString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      )}
    </div>
  );
};
