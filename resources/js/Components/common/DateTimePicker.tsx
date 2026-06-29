import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';
import { useTimezoneStore } from '@/stores/common/timezoneStore';
import { toLocalDate } from '@/Utils/common/timezoneUtils';

interface DateTimePickerProps {
  value: string | null;
  onChange: (value: string | null) => void;
  label?: string;
  min?: Date | string;
  max?: Date | string;
  disabled?: boolean;
  className?: string;
  error?: string;
  required?: boolean;
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  value,
  onChange,
  label,
  min,
  max,
  disabled = false,
  className = '',
  error,
  required = false,
}) => {
  const { timezoneLabel } = useTimezoneStore();
  const [localValue, setLocalValue] = useState('');

  // Convertir valor UTC del backend a datetime-local
  useEffect(() => {
    if (value) {
      const localDate = toLocalDate(value);
      if (localDate) {
        setLocalValue(format(localDate, "yyyy-MM-dd'T'HH:mm"));
      }
    } else {
      setLocalValue('');
    }
  }, [value]);

  // Valores mínimo y máximo
  const minValue = min
    ? format(min instanceof Date ? min : toLocalDate(min) || new Date(), "yyyy-MM-dd'T'HH:mm")
    : '';

  const maxValue = max
    ? format(max instanceof Date ? max : toLocalDate(max) || new Date(), "yyyy-MM-dd'T'HH:mm")
    : '';

  // Manejar cambio — parse the raw string as workspace timezone, then convert to UTC.
  // Using new Date(string) would interpret the string as browser-local time,
  // causing a double-conversion bug when browser timezone ≠ workspace timezone.
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value; // "2026-03-08T15:30" — no timezone suffix
    setLocalValue(newValue);

    if (newValue) {
      const timezone = useTimezoneStore.getState().effectiveTimezone();
      // fromZonedTime treats the string as-is in the workspace timezone → UTC
      const utcDate = fromZonedTime(newValue, timezone);
      onChange(utcDate.toISOString());
    } else {
      onChange(null);
    }
  };

  return (
    <div className={`datetime-picker ${className}`}>
      {label && (
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-neutral-300">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      <input
        type="datetime-local"
        value={localValue}
        onChange={handleChange}
        min={minValue}
        max={maxValue}
        disabled={disabled}
        required={required}
        className={`w-full rounded-md border px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white ${error ? 'border-red-500' : 'border-gray-300'} `}
      />

      <div className="mt-1 flex items-center justify-between">
        <small className="flex items-center gap-1 text-xs text-gray-500 dark:text-neutral-400">
          <i className="bi bi-clock"></i>
          {timezoneLabel()}
        </small>
        {error && <small className="text-xs text-red-500">{error}</small>}
      </div>
    </div>
  );
};
