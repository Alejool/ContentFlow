import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { AlertTriangle } from 'lucide-react';
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
  const [isPastDate, setIsPastDate] = useState(false);
  const [isInvalidDate, setIsInvalidDate] = useState(false);

  // Validate date whenever it changes
  useEffect(() => {
    validateDate(selectedDate);
  }, [selectedDate]);

  const validateDate = (date: Date) => {
    // Check if date is valid
    if (!date || isNaN(date.getTime())) {
      setIsInvalidDate(true);
      setIsPastDate(false);
      return false;
    }

    setIsInvalidDate(false);

    // Check if date is in the past
    const now = new Date();
    if (showWarningForPastDates && date < now) {
      setIsPastDate(true);
      return true; // Still valid, just shows warning
    }

    setIsPastDate(false);
    return true;
  };

  const handleDateChange = (date: Date | null) => {
    if (!date) return;

    // Validate the date
    if (validateDate(date)) {
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
          className="border border-gray-300 dark:border-gray-600 rounded-lg"
        />
      </div>

      {/* Validation Messages */}
      {isInvalidDate && (
        <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              Fecha inválida
            </p>
            <p className="text-xs text-red-600 dark:text-red-300 mt-1">
              Por favor selecciona una fecha válida.
            </p>
          </div>
        </div>
      )}

      {isPastDate && !isInvalidDate && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Advertencia: Fecha en el pasado
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-300 mt-1">
              Has seleccionado una fecha que ya pasó. ¿Estás seguro de que deseas continuar?
            </p>
          </div>
        </div>
      )}

      {/* Selected Date Display */}
      {!isInvalidDate && (
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Fecha seleccionada:
          </p>
          <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
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
