import Input from "@/Components/common/Modern/Input";
import Label from "@/Components/common/Modern/Label";
import Select from "@/Components/common/Modern/Select";
import { enUS, es } from "date-fns/locale";
import {
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  TriangleAlert,
  X,
} from "lucide-react";
import { ReactNode, forwardRef, useEffect, useMemo, useState } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FieldValues, UseFormRegister } from "react-hook-form";
import { useTranslation } from "react-i18next";

registerLocale("es", es);
registerLocale("en", enUS);

interface DatePickerProps<T extends FieldValues> {
  selected?: Date | null;
  onChange: (date: Date | null) => void;
  showTimeSelect?: boolean;
  placeholder?: string;
  minDate?: Date;
  className?: string;
  dateFormat?: string;
  isClearable?: boolean;
  popperPlacement?: "top-start" | "top-end" | "bottom-start" | "bottom-end";
  withPortal?: boolean;
  showMonthDropdown?: boolean;
  showYearDropdown?: boolean;
  dropdownMode?: "scroll" | "select";

  register?: UseFormRegister<T>;
  label?: string;
  error?: string;
  name?: string;
  success?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outlined" | "filled";
  containerClassName?: string;
  activeColor?: string;
}

// Custom Time Selector Component
const CustomTimeSelector = ({
  date,
  onChange,
  currentLocale,
  activeColor = "#ea580c",
}: {
  date: Date | null;
  onChange: (date: Date) => void;
  currentLocale: string;
  activeColor?: string;
}) => {
  const [hours, setHours] = useState(
    date ? date.getHours().toString().padStart(2, "0") : "12",
  );
  const [minutes, setMinutes] = useState(
    date ? date.getMinutes().toString().padStart(2, "0") : "00",
  );
  const [isFocused, setIsFocused] = useState<{ h: boolean; m: boolean }>({
    h: false,
    m: false,
  });

  useEffect(() => {
    if (date && !isFocused.h && !isFocused.m) {
      setHours(date.getHours().toString().padStart(2, "0"));
      setMinutes(date.getMinutes().toString().padStart(2, "0"));
    }
  }, [date, isFocused]);

  const updateTime = (newHours: number, newMinutes: number) => {
    const newDate = date ? new Date(date) : new Date();
    newDate.setHours(newHours);
    newDate.setMinutes(newMinutes);
    onChange(newDate);
  };

  const incrementHours = () => {
    const h = parseInt(hours) || 0;
    const newHours = (h + 1) % 24;
    const hStr = newHours.toString().padStart(2, "0");
    setHours(hStr);
    updateTime(newHours, parseInt(minutes) || 0);
  };

  const decrementHours = () => {
    const h = parseInt(hours) || 0;
    const newHours = h === 0 ? 23 : h - 1;
    const hStr = newHours.toString().padStart(2, "0");
    setHours(hStr);
    updateTime(newHours, parseInt(minutes) || 0);
  };

  const incrementMinutes = () => {
    const m = parseInt(minutes) || 0;
    const newMinutes = (m + 1) % 60;
    const mStr = newMinutes.toString().padStart(2, "0");
    setMinutes(mStr);
    updateTime(parseInt(hours) || 0, newMinutes);
  };

  const decrementMinutes = () => {
    const m = parseInt(minutes) || 0;
    const newMinutes = m === 0 ? 59 : m - 1;
    const mStr = newMinutes.toString().padStart(2, "0");
    setMinutes(mStr);
    updateTime(parseInt(hours) || 0, newMinutes);
  };

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 2) val = val.slice(-2);
    setHours(val);
  };

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 2) val = val.slice(-2);
    setMinutes(val);
  };

  const syncTime = () => {
    const h = parseInt(hours);
    const m = parseInt(minutes);
    if (!isNaN(h) && h >= 0 && h <= 23 && !isNaN(m) && m >= 0 && m <= 59) {
      updateTime(h, m);
    }
  };

  const handleBlur = (field: "h" | "m") => {
    setIsFocused((prev) => ({ ...prev, [field]: false }));
    setHours((prev) => (prev === "" ? "00" : prev.padStart(2, "0")));
    setMinutes((prev) => (prev === "" ? "00" : prev.padStart(2, "0")));
    // Use a small timeout to ensure state is updated before syncing
    setTimeout(syncTime, 0);
  };

  return (
    <div className="custom-time-selector">
      <div className="time-selector-header">
        <Clock className="w-4 h-4" />
        <span className="text-base font-medium">
          {currentLocale === "es" ? "Seleccionar Hora" : "Select Time"}
        </span>
      </div>
      <div className="time-selector-body">
        <div className="time-input-group">
          <button
            type="button"
            className="time-spinner-btn"
            onClick={incrementHours}
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <Input
            id="time-hours"
            type="text"
            value={hours}
            onChange={handleHoursChange}
            onFocus={() => setIsFocused((prev) => ({ ...prev, h: true }))}
            onBlur={() => handleBlur("h")}
            className="!text-center !text-2xl font-bold !p-2 w-16"
            sizeType="lg"
            maxLength={2}
            activeColor={activeColor}
          />
          <button
            type="button"
            className="time-spinner-btn"
            onClick={decrementHours}
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <span className="time-label">
            {currentLocale === "es" ? "Horas" : "Hours"}
          </span>
        </div>
        <div className="time-separator">:</div>
        <div className="time-input-group">
          <button
            type="button"
            className="time-spinner-btn"
            onClick={incrementMinutes}
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <Input
            id="time-minutes"
            type="text"
            value={minutes}
            onChange={handleMinutesChange}
            onFocus={() => setIsFocused((prev) => ({ ...prev, m: true }))}
            onBlur={() => handleBlur("m")}
            className="!text-center !text-2xl font-bold !p-2 w-16"
            sizeType="lg"
            maxLength={2}
            activeColor={activeColor}
          />
          <button
            type="button"
            className="time-spinner-btn"
            onClick={decrementMinutes}
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <span className="time-label">
            {currentLocale === "es" ? "Minutos" : "Minutes"}
          </span>
        </div>
      </div>
    </div>
  );
};

const DatePickerModern = <T extends FieldValues>({
  selected,
  onChange,
  showTimeSelect = false,
  placeholder = "Select date",
  minDate,
  className = "",
  dateFormat,
  isClearable = true,
  popperPlacement = "bottom-start",
  withPortal = false,
  showMonthDropdown = true,
  showYearDropdown = true,
  dropdownMode = "select",
  register,
  label,
  error,
  name,
  success,
  hint,
  required = false,
  disabled = false,
  icon,
  size = "md",
  variant = "default",
  containerClassName = "",
  activeColor = "#ea580c",
}: DatePickerProps<T>) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const currentLocale = i18n.language.startsWith("es") ? "es" : "en";
  const defaultDateFormat = showTimeSelect ? "Pp" : "P";

  const sizeConfig = {
    sm: {
      input: "py-1 px-2 text-sm",
      icon: "w-4 h-4",
      label: "text-sm",
    },
    md: {
      input: "py-2 px-4 text-base",
      icon: "w-5 h-5",
      label: "text-base",
    },
    lg: {
      input: "py-3 px-4 text-lg",
      icon: "w-6 h-6",
      label: "text-lg",
    },
  };

  const currentSize = sizeConfig[size];

  const getInputStyles = () => {
    const base = `
      w-full flex items-center justify-between rounded-lg border transition-all
      focus:outline-none focus:ring-2 focus:ring-offset-2
      ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
      ${currentSize.input}
    `;

    if (error) {
      return `${base} bg-white dark:bg-neutral-800 text-gray-900 dark:text-white border-primary-500 focus:ring-primary-500/20 dark:focus:ring-primary-500/30 pl-11`;
    }
    if (success) {
      return `${base} bg-white dark:bg-neutral-800 text-gray-900 dark:text-white border-green-500 focus:ring-green-500/20 dark:focus:ring-green-500/30 pl-11`;
    }
    if (variant === "outlined") {
      return `${base} bg-transparent text-gray-900 dark:text-white border-2 border-gray-300 dark:border-neutral-600 hover:border-gray-400 dark:hover:border-neutral-500 focus:ring-purple-500/20 dark:focus:ring-purple-500/30 pl-11`;
    }
    if (variant === "filled") {
      return `${base} bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white border border-gray-300 dark:border-neutral-700 hover:border-gray-400 dark:hover:border-neutral-600 focus:ring-purple-500/20 dark:focus:ring-purple-500/30 pl-11`;
    }
    return `${base} bg-white dark:bg-neutral-800/50 text-gray-900 dark:text-white border border-gray-300 dark:border-neutral-700/50 hover:border-gray-400 dark:hover:border-neutral-600/70 focus:ring-purple-500/20 dark:focus:ring-purple-500/30 pl-11`;
  };

  const getMessageStyles = (type: "error" | "success") => {
    const base = "flex items-start gap-2 px-3 py-2 rounded-lg text-sm";

    return type === "error"
      ? `${base} text-primary-600 dark:text-primary-500`
      : `${base} text-green-600 dark:text-green-500`;
  };

  const CustomInput = forwardRef<HTMLInputElement, any>(
    ({ value, onClick, onChange, placeholder: inputPlaceholder }, ref) => (
      <div className="relative flex items-center w-full">
        <input
          value={value}
          onChange={onChange}
          onClick={(e) => {
            if (!disabled) {
              onClick(e);
              setIsOpen(true);
            }
          }}
          ref={ref}
          disabled={disabled}
          placeholder={inputPlaceholder}
          readOnly={false}
          className={`${getInputStyles()} ${className} pr-10`}
          {...register}
          aria-invalid={!!error}
          aria-describedby={
            error
              ? `${label?.toLowerCase()}-error`
              : success
                ? `${label?.toLowerCase()}-success`
                : undefined
          }
        />
        <div className="absolute left-4 flex items-center pointer-events-none">
          {icon ||
            (showTimeSelect ? (
              <Clock
                className={`${currentSize.icon} text-gray-500 dark:text-gray-400 ${
                  error
                    ? "text-primary-500 dark:text-primary-400"
                    : success
                      ? "text-green-500 dark:text-green-400"
                      : ""
                }`}
              />
            ) : (
              <Calendar
                className={`${currentSize.icon} text-gray-500 dark:text-gray-400 ${
                  error
                    ? "text-primary-500 dark:text-primary-400"
                    : success
                      ? "text-green-500 dark:text-green-400"
                      : ""
                }`}
              />
            ))}
        </div>
      </div>
    ),
  );

  CustomInput.displayName = "CustomDateInput";

  return (
    <div className={` ${containerClassName}`}>
      {(label || hint) && (
        <div className="flex items-center justify-between">
          {label && (
            <Label
              htmlFor={label?.toLowerCase().replace(/\s+/g, "-")}
              size={size}
              required={required}
              error={error}
              success={success}
              variant="default"
              align="left"
              className="mb-2"
            >
              {label}
            </Label>
          )}
          {hint && !label && (
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
              {hint}
            </span>
          )}
        </div>
      )}

      <div className="relative">
        <style>{`
          .react-datepicker-wrapper {
            width: 100%;
          }

          .react-datepicker {
            font-family: inherit;
            border-radius: 0.75rem;
            border: 1px solid #e5e7eb;
            background-color: #ffffff !important;
            color: #374151;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            z-index: 9999 !important;
            overflow: visible;
            max-width: 95vw;
          }

          @media (max-width: 640px) {
            .react-datepicker-popper {
              left: 50% !important;
              right: auto !important;
              transform: translateX(-50%) !important;
              width: 100% !important;
              padding: 0 10px !important;
              display: flex !important;
              justify-content: center !important;
            }

            .react-datepicker {
              font-size: 0.8rem;
              display: flex;
              flex-direction: column;
              width: 100%;
              max-width: 400px; /* Optional cap for very wide mobile screens but usually fits fine */
            }
            .react-datepicker__month-container {
              width: 100% !important;
              padding-bottom: 3.5rem !important;
            }
            .custom-time-selector {
              width: 100% !important;
              border-left: none !important;
              border-top: 1px solid #e5e7eb;
              padding-bottom: 3.5rem !important;
            }
            .dark .custom-time-selector {
               border-top: 1px solid #404040;
            }
            .time-selector-header, .react-datepicker__header {
              height: 3.5rem !important;
              padding: 0.25rem 0.5rem !important;
            }
            .time-selector-body {
              padding: 1rem 0.5rem !important;
            }
            .time-input-group .time-spinner-btn {
              padding: 0.25rem !important;
            }
            .time-input-group input {
              font-size: 1.25rem !important;
              padding: 0.25rem !important;
              width: 3.5rem !important;
            }
            .react-datepicker__day {
              width: 2rem !important;
              line-height: 2rem !important;
              margin: 0.125rem !important;
            }
            .react-datepicker__day-name {
              width: 2rem !important;
              line-height: 2rem !important;
              margin: 0.125rem !important;
            }
            .react-datepicker__month {
              margin: 0.5rem !important;
            }
            .react-datepicker__footer {
               padding: 0.5rem 0.75rem !important;
               min-height: 3rem !important;
            }
          }

          .dark .react-datepicker {
            border: 1px solid #404040 !important;
            background-color: #1a1a1a !important;
            color: #e5e7eb !important;
          }

          .react-datepicker__month-container {
            background-color: #ffffff !important;
            float: left;
            padding-bottom: 4.5rem;
          }

          .dark .react-datepicker__month-container {
            background-color: #1a1a1a !important;
          }

          .react-datepicker__month {
            background-color: #ffffff !important;
            margin: 1.25rem;
          }

          .dark .react-datepicker__month {
            background-color: #1a1a1a !important;
          }

          .react-datepicker__header {
            background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%) !important;
            border-bottom: 1px solid #e5e7eb;
            border-top-left-radius: 0.75rem;
            border-top-right-radius: ${showTimeSelect ? "0" : "0.75rem"};
            padding: 0.5rem 1rem !important;
            display: flex;
            flex-direction: column;
            justify-content: center;
            height: 4.5rem;
          }

          .dark .react-datepicker__header {
            background: linear-gradient(135deg, #262626 0%, #171717 100%) !important;
            border-bottom: 1px solid #404040;
          }

          .custom-header-container {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.25rem 0;
            width: 100%;
          }

          .header-nav-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 2.25rem;
            height: 2.25rem;
            border-radius: 0.5rem;
            border: 1px solid #d1d5db;
            background: #ffffff;
            color: #4b5563;
            cursor: pointer;
            transition: all 0.2s ease;
            flex-shrink: 0;
          }

          .header-nav-btn:hover:not(:disabled) {
            background: #f3f4f6 !important;
            border-color: #9ca3af !important;
            color: #111827 !important;
            transform: scale(1.05);
          }

          .header-nav-btn:disabled {
            opacity: 0.3;
            cursor: not-allowed;
          }

          .dark .header-nav-btn {
            background: #262626;
            border-color: #404040;
            color: #e5e7eb;
          }

          .dark .header-nav-btn:hover:not(:disabled) {
            background: #404040 !important;
            border-color: #525252 !important;
            color: #ffffff !important;
          }

          .react-datepicker__current-month,
          .react-datepicker-time__header,
          .react-datepicker-year-header {
            color: #111827;
            font-weight: 700;
            font-size: 1rem;
            line-height: 1.5rem;
            margin: 0;
            padding: 0.5rem 0;
          }

          .dark .react-datepicker__current-month,
          .dark .react-datepicker-time__header,
          .dark .react-datepicker-year-header {
            color: #f3f4f6 !important;
          }

          /* Custom Time Selector Styles */
          .custom-time-selector {
            background-color: #ffffff !important;
            padding: 0;
            border-left: 1px solid #e5e7eb;
            width: 200px !important;
            display: flex;
            flex-direction: column;
            float: left;
            padding-bottom: 4.5rem;
          }

          .dark .custom-time-selector {
            background-color: #1a1a1a !important;
            border-left: 1px solid #404040;
          }

          .time-selector-header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            justify-content: center;
            padding: 0.75rem 16px;
            background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
            border-bottom: 1px solid #e5e7eb;
            border-top-right-radius: 0.75rem;
            font-weight: 700;
            font-size: 1rem;
            color: #111827;
            line-height: 1.5rem;
            height: 4.5rem;
            margin-top: 0;
          }

          .dark .time-selector-header {
            background: linear-gradient(135deg, #262626 0%, #171717 100%);
            border-bottom: 1px solid #404040;
            color: #f3f4f6;
          }

          .time-selector-body {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 1rem;
            padding: 2rem 1rem;
            flex: 1;
          }

          .time-input-group {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
          }

          .time-spinner-btn {
            width: 100%;
            padding: 0.5rem;
            background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
            border: 1px solid #d1d5db;
            border-radius: 0.5rem;
            color: #374151;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .time-spinner-btn:hover {
            background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%);
            border-color: #ea580c;
            color: white;
            transform: translateY(-1px);
            box-shadow: 0 4px 6px -1px rgba(234, 88, 12, 0.3);
          }

          .dark .time-spinner-btn {
            background: linear-gradient(135deg, #404040 0%, #262626 100%);
            border: 1px solid #525252;
            color: #e5e7eb;
          }

          .dark .time-spinner-btn:hover {
            background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%);
            border-color: #ea580c;
            color: white;
          }

          .time-input {
            width: 70px;
            padding: 0.75rem 0.5rem;
            text-align: center;
            font-size: 1.75rem;
            font-weight: 700;
            border: 2px solid #e5e7eb;
            border-radius: 0.5rem;
            background-color: #ffffff;
            color: #111827;
            transition: all 0.2s ease;
          }

          .time-input:focus {
            outline: none;
            border-color: ${activeColor};
            box-shadow: 0 0 0 3px ${activeColor}20;
            background-color: ${activeColor}05;
          }

          .dark .time-input {
            background-color: #262626;
            border: 2px solid #404040;
            color: #f3f4f6;
          }

          .dark .time-input:focus {
            border-color: ${activeColor};
            background-color: ${activeColor}20;
          }

          .time-label {
            font-size: 0.75rem;
            font-weight: 700;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          .dark .time-label {
            color: #9ca3af;
          }

          .time-separator {
            font-size: 2.5rem;
            font-weight: 700;
            color: #374151;
            align-self: center;
            margin-top: -1rem;
          }

          .dark .time-separator {
            color: #e5e7eb;
          }

          .react-datepicker__day {
            color: #374151;
            border-radius: 0.5rem;
            transition: all 0.2s ease;
            font-weight: 500;
            margin: 0.25rem;
            width: 2.25rem;
            line-height: 2.25rem;
          }

          .dark .react-datepicker__day {
            color: #e5e7eb !important;
          }

          .react-datepicker__day:hover {
            background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%) !important;
            color: #111827 !important;
            transform: scale(1.1);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }

          .dark .react-datepicker__day:hover {
            background: linear-gradient(135deg, #404040 0%, #525252 100%) !important;
            color: #ffffff !important;
          }

          .react-datepicker__day--selected,
          .react-datepicker__day--keyboard-selected {
            background: linear-gradient(135deg, ${activeColor} 0%, ${activeColor}dd 100%) !important;
            color: white !important;
            font-weight: 700 !important;
            box-shadow: 0 4px 6px -1px ${activeColor}60;
            transform: scale(1.05);
          }

          .react-datepicker__day--today {
            font-weight: 700;
            color: ${activeColor} !important;
            background: linear-gradient(135deg, ${activeColor}10 0%, ${activeColor}05 100%) !important;
            border: 2px solid ${activeColor};
          }

          .dark .react-datepicker__day--today {
            background: linear-gradient(135deg, rgba(234, 88, 12, 0.2) 0%, rgba(234, 88, 12, 0.1) 100%) !important;
          }

          .react-datepicker__day-name {
            color: #6b7280;
            font-weight: 700;
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            width: 2.25rem;
            line-height: 2.25rem;
            margin: 0.25rem;
          }

          .react-datepicker__day-names {
            margin-bottom: 0.5rem;
          }

          .dark .react-datepicker__day-name {
            color: #9ca3af !important;
          }

          /* Month and Year Dropdown Styles - Matching Select Component */
          .react-datepicker__month-dropdown,
          .react-datepicker__year-dropdown {
            background-color: #ffffff !important;
            border: 1px solid #d1d5db !important;
            border-radius: 0.5rem !important;
            padding: 0.5rem 0.75rem !important;
            color: #374151 !important;
            font-weight: 600 !important;
            font-size: 0.875rem !important;
            cursor: pointer !important;
            transition: all 0.2s ease !important;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05) !important;
            margin: 0 !important;
          }

          .react-datepicker__month-dropdown:hover,
          .react-datepicker__year-dropdown:hover {
            border-color: #9ca3af !important;
            background-color: #f9fafb !important;
          }

          .dark .react-datepicker__month-dropdown,
          .dark .react-datepicker__year-dropdown {
            background-color: #262626 !important;
            border: 1px solid #525252 !important;
            color: #e5e7eb !important;
          }

          .dark .react-datepicker__month-dropdown:hover,
          .dark .react-datepicker__year-dropdown:hover {
            border-color: #737373 !important;
            background-color: #404040 !important;
          }



          .react-datepicker-popper {
            z-index: 9999 !important;
          }

          .react-datepicker__close-icon {
            display: none;
          }

          /* Modern Footer Styles */
          .react-datepicker__footer {
            background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%) !important;
            border-top: 1px solid #e5e7eb;
            padding: 1rem 1.25rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom-left-radius: 0.75rem;
            border-bottom-right-radius: 0.75rem;
            font-size: 0.875rem;
            gap: 1rem;
            min-height: 3.5rem;
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
          }

          .dark .react-datepicker__footer {
            background: linear-gradient(135deg, #262626 0%, #171717 100%) !important;
            border-top: 1px solid #404040;
          }

          .react-datepicker__footer-selected {
            color: #111827;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            flex: 1;
            font-size: 0.875rem;
          }

          .dark .react-datepicker__footer-selected {
            color: #f3f4f6;
          }

          .react-datepicker__footer-clear {
            background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
            border: 1px solid #d1d5db;
            border-radius: 0.5rem;
            padding: 0.5rem 1rem;
            font-size: 0.875rem;
            color: #374151;
            cursor: pointer;
            transition: all 0.2s ease;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 0.375rem;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          }

          .react-datepicker__footer-clear:hover {
            background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);
            border-color: #9ca3af;
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }

          .dark .react-datepicker__footer-clear {
            background: linear-gradient(135deg, #404040 0%, #262626 100%);
            border: 1px solid #525252;
            color: #e5e7eb;
          }

          .dark .react-datepicker__footer-clear:hover {
            background: linear-gradient(135deg, #525252 0%, #404040 100%);
            border-color: #737373;
          }

          /* Disabled days */
          .react-datepicker__day--disabled {
            color: #d1d5db !important;
            cursor: not-allowed;
            opacity: 0.5;
          }

          .dark .react-datepicker__day--disabled {
            color: #525252 !important;
          }

          .react-datepicker__day--disabled:hover {
            background-color: transparent !important;
            transform: none !important;
            box-shadow: none !important;
          }

          /* Responsive Layout */
          @media (max-width: 768px) {
            .react-datepicker {
              display: flex !important;
              flex-direction: column !important;
              width: 100% !important;
              max-width: 320px !important;
            }

            .react-datepicker__month-container {
              width: 100% !important;
              float: none !important;
              padding-bottom: 2rem !important;
            }

            .custom-time-selector {
              width: 100% !important;
              float: none !important;
              border-left: none !important;
              border-top: 1px solid #e5e7eb !important;
              padding-bottom: 5rem !important;
            }

            .dark .custom-time-selector {
              border-top: 1px solid #404040 !important;
            }

            .time-selector-header {
              height: 3.5rem !important;
              border-top-right-radius: 0 !important;
            }

            .react-datepicker__header {
              border-top-right-radius: 0.75rem !important;
            }

            .react-datepicker__footer {
              padding: 0.75rem 1rem !important;
              flex-direction: column !important;
              height: auto !important;
              min-height: auto !important;
              position: relative !important;
              border-top: 1px solid #e5e7eb !important;
            }

            .dark .react-datepicker__footer {
              border-top: 1px solid #404040 !important;
            }

            .react-datepicker__footer-selected {
              margin-bottom: 0.5rem !important;
            }

            .react-datepicker__footer-clear {
              width: 100% !important;
              justify-content: center !important;
            }
          }
        `}</style>

        <DatePicker
          name={name}
          selected={selected}
          onChange={(date) => {
            if (date && selected && showTimeSelect) {
              const newDate = new Date(date);
              newDate.setHours(selected.getHours());
              newDate.setMinutes(selected.getMinutes());
              newDate.setSeconds(selected.getSeconds());
              onChange(newDate);
            } else {
              onChange(date);
            }
            if (!showTimeSelect) {
              setIsOpen(false);
            }
          }}
          onCalendarClose={() => setIsOpen(false)}
          onCalendarOpen={() => setIsOpen(true)}
          showTimeSelect={false}
          showMonthDropdown={showMonthDropdown}
          showYearDropdown={showYearDropdown}
          dropdownMode={dropdownMode}
          dateFormat={dateFormat || defaultDateFormat}
          locale={currentLocale}
          placeholderText={placeholder}
          minDate={minDate || new Date()}
          renderCustomHeader={({
            date,
            changeYear,
            changeMonth,
            decreaseMonth,
            increaseMonth,
            prevMonthButtonDisabled,
            nextMonthButtonDisabled,
          }) => {
            const months = [
              "January",
              "February",
              "March",
              "April",
              "May",
              "June",
              "July",
              "August",
              "September",
              "October",
              "November",
              "December",
            ];
            const monthsEs = [
              "Enero",
              "Febrero",
              "Marzo",
              "Abril",
              "Mayo",
              "Junio",
              "Julio",
              "Agosto",
              "Septiembre",
              "Octubre",
              "Noviembre",
              "Diciembre",
            ];

            const monthOptions = (
              currentLocale === "es" ? monthsEs : months
            ).map((m, i) => ({
              value: i,
              label: m,
            }));

            const currentYear = new Date().getFullYear();
            const years = Array.from(
              { length: 101 },
              (_, i) => currentYear - 50 + i,
            );
            const yearOptions = years.map((y) => ({
              value: y,
              label: y.toString(),
            }));

            return (
              <div className="custom-header-container">
                <button
                  type="button"
                  className="header-nav-btn"
                  onClick={decreaseMonth}
                  disabled={prevMonthButtonDisabled}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex gap-2 items-center justify-center flex-1">
                  <div className="w-[130px]">
                    <Select
                      id="month-select"
                      options={monthOptions}
                      value={date.getMonth()}
                      onChange={(val) => changeMonth(Number(val))}
                      size="sm"
                      usePortal={false}
                    />
                  </div>
                  <div className="w-[100px]">
                    <Select
                      id="year-select"
                      options={yearOptions}
                      value={date.getFullYear()}
                      onChange={(val) => changeYear(Number(val))}
                      size="sm"
                      usePortal={false}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  className="header-nav-btn"
                  onClick={increaseMonth}
                  disabled={nextMonthButtonDisabled}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            );
          }}
          isClearable={false}
          customInput={<CustomInput />}
          popperClassName="z-50 !fixed"
          popperPlacement={popperPlacement}
          previousMonthButtonLabel="Mes anterior"
          nextMonthButtonLabel="Mes siguiente"
          previousYearButtonLabel="Año anterior"
          nextYearButtonLabel="Año siguiente"
          withPortal={withPortal}
          portalId="root-portal"
          disabled={disabled}
          className="w-full"
          calendarContainer={useMemo(
            () =>
              ({ children }: { children: ReactNode }) => (
                <div
                  className="react-datepicker-container"
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    position: "relative",
                  }}
                >
                  <div style={{ flex: 1 }}>{children}</div>
                  {showTimeSelect && (
                    <CustomTimeSelector
                      date={selected || new Date()}
                      onChange={onChange}
                      currentLocale={currentLocale}
                      activeColor={activeColor}
                    />
                  )}
                  <div className="react-datepicker__footer">
                    <div className="react-datepicker__footer-selected">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span>
                        {selected
                          ? showTimeSelect
                            ? selected.toLocaleString(currentLocale, {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })
                            : selected.toLocaleDateString(currentLocale, {
                                dateStyle: "medium",
                              })
                          : currentLocale === "es"
                            ? "Sin fecha seleccionada"
                            : "No date selected"}
                      </span>
                    </div>
                    {isClearable && selected && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onChange(null);
                          setIsOpen(false);
                        }}
                        className="react-datepicker__footer-clear"
                        title={currentLocale === "es" ? "Limpiar" : "Clear"}
                      >
                        <X className="w-4 h-4" />
                        {currentLocale === "es" ? "Limpiar" : "Clear"}
                      </button>
                    )}
                  </div>
                </div>
              ),
            [selected, onChange, currentLocale, showTimeSelect, isClearable],
          )}
        />
      </div>
      {error && (
        <div
          id={`${label?.toLowerCase().replace(/\s+/g, "-")}-error`}
          className={getMessageStyles("error")}
          role="alert"
        >
          <TriangleAlert className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {success && !error && (
        <div
          id={`${label?.toLowerCase().replace(/\s+/g, "-")}-success`}
          className={getMessageStyles("success")}
          role="status"
        >
          <Check />
          <span>{success}</span>
        </div>
      )}
    </div>
  );
};

export default DatePickerModern;
export { DatePickerModern as DatePicker };
