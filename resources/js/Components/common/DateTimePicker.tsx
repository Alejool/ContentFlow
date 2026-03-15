import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { useTimezoneStore } from "@/stores/timezoneStore";
import { toLocalDate, toUTC } from "@/Utils/timezoneUtils";

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
  className = "",
  error,
  required = false,
}) => {
  const { timezoneLabel } = useTimezoneStore();
  const [localValue, setLocalValue] = useState("");

  // Convertir valor UTC del backend a datetime-local
  useEffect(() => {
    if (value) {
      const localDate = toLocalDate(value);
      if (localDate) {
        setLocalValue(format(localDate, "yyyy-MM-dd'T'HH:mm"));
      }
    } else {
      setLocalValue("");
    }
  }, [value]);

  // Valores mínimo y máximo
  const minValue = min
    ? format(min instanceof Date ? min : toLocalDate(min) || new Date(), "yyyy-MM-dd'T'HH:mm")
    : "";

  const maxValue = max
    ? format(max instanceof Date ? max : toLocalDate(max) || new Date(), "yyyy-MM-dd'T'HH:mm")
    : "";

  // Manejar cambio
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    if (newValue) {
      // Convertir a UTC y emitir
      const utcDate = toUTC(new Date(newValue));
      onChange(utcDate);
    } else {
      onChange(null);
    }
  };

  return (
    <div className={`datetime-picker ${className}`}>
      {label && (
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
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
        className={`w-full rounded-md border px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white ${error ? "border-red-500" : "border-gray-300"} `}
      />

      <div className="mt-1 flex items-center justify-between">
        <small className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          <i className="bi bi-clock"></i>
          {timezoneLabel()}
        </small>
        {error && <small className="text-xs text-red-500">{error}</small>}
      </div>
    </div>
  );
};
