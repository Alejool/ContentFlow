import Input from "@/Components/common/Modern/Input";
import Select from "@/Components/common/Modern/Select";
import Button from "@/Components/common/Modern/Button";
import { enUS, es } from "date-fns/locale";
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  X,
} from "lucide-react";
import { ReactNode, forwardRef, useEffect, useMemo, useState } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FieldValues, UseFormRegister } from "react-hook-form";
import { useTranslation } from "react-i18next";

registerLocale("es", es);
registerLocale("en", enUS);

const getColor = (color: string, alpha: string = "1") => {
  if (!color) return color;

  const alphaMap: Record<string, string> = {
    dd: "0.86",
    "60": "0.37",
    "10": "0.06",
    "05": "0.03",
    "20": "0.12",
    "50": "0.5",
    "70": "0.7",
  };
  const a = alphaMap[alpha] || alpha;

  if (color.startsWith("primary-")) {
    return `rgb(var(--${color}) / ${a})`;
  }

  if (color.startsWith("#") && a !== "1") {
    const hex =
      color.length === 4
        ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
        : color;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  return color;
};

interface DatePickerProps<T extends FieldValues> {
  selected?: Date | null;
  onChange: (date: Date | null) => void;
  showTimeSelect?: boolean;
  placeholder?: string;
  minDate?: Date;
  minTime?: Date;
  maxTime?: Date;
  allowPastDates?: boolean;
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
  id?: string;
}

const CustomTimeSelector = ({
  date,
  onChange,
  currentLocale,
  activeColor = "primary-500",
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
          <Button
            type="button"
            variant="ghost"
            buttonStyle="solid"
            className="time-spinner-btn !p-0"
            onClick={incrementHours}
          >
            <ChevronUp className="w-4 h-4" />
          </Button>
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
          <Button
            type="button"
            variant="ghost"
            buttonStyle="solid"
            className="time-spinner-btn !p-0"
            onClick={decrementHours}
          >
            <ChevronDown className="w-4 h-4" />
          </Button>
          <span className="time-label">
            {currentLocale === "es" ? "Horas" : "Hours"}
          </span>
        </div>
        <div className="time-separator">:</div>
        <div className="time-input-group">
          <Button
            type="button"
            variant="ghost"
            buttonStyle="solid"
            className="time-spinner-btn !p-0"
            onClick={incrementMinutes}
          >
            <ChevronUp className="w-4 h-4" />
          </Button>
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
          <Button
            type="button"
            variant="ghost"
            buttonStyle="solid"
            className="time-spinner-btn !p-0"
            onClick={decrementMinutes}
          >
            <ChevronDown className="w-4 h-4" />
          </Button>
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
  minTime,
  maxTime,
  allowPastDates = false,
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
  activeColor = "primary-500",
  id,
}: DatePickerProps<T>) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const currentLocale = i18n.language.startsWith("es") ? "es" : "en";
  const defaultDateFormat = showTimeSelect ? "Pp" : "P";

  const CustomInput = forwardRef<HTMLInputElement, any>(
    (
      { value, onClick, onChange, placeholder: inputPlaceholder, ...props },
      ref,
    ) => (
      <Input
        {...props}
        id={id || name || "datepicker-input"}
        ref={ref}
        value={value}
        onChange={onChange}
        onClick={(e) => {
          if (!disabled) {
            onClick?.(e);
            setIsOpen(true);
          }
        }}
        label={label}
        error={error}
        success={success}
        hint={hint}
        required={required}
        disabled={disabled}
        variant={variant}
        sizeType={size === "md" ? "md" : size === "lg" ? "lg" : "sm"}
        icon={(icon as any) || (showTimeSelect ? Clock : Calendar)}
        activeColor={activeColor}
        placeholder={inputPlaceholder || placeholder}
        containerClassName="w-full"
        autoComplete="off"
        className="cursor-pointer"
      />
    ),
  );

  CustomInput.displayName = "CustomDateInput";

  return (
    <div className={`relative ${containerClassName}`}>
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
            background: ${getColor(activeColor, "05")} !important;
            border-color: ${getColor(activeColor)} !important;
            color: ${getColor(activeColor)} !important;
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
            background: ${getColor(activeColor, "10")} !important;
            border-color: ${getColor(activeColor, "60")} !important;
            color: white !important;
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
            background: linear-gradient(135deg, ${getColor(activeColor)} 0%, ${getColor(activeColor, "dd")} 100%);
            border-color: ${getColor(activeColor)};
            color: white;
            transform: translateY(-1px);
            box-shadow: 0 4px 6px -1px ${getColor(activeColor, "60")};
          }

          .dark .time-spinner-btn {
            background: linear-gradient(135deg, #404040 0%, #262626 100%);
            border: 1px solid #525252;
            color: #e5e7eb;
          }

          .dark .time-spinner-btn:hover {
            background: linear-gradient(135deg, ${getColor(activeColor)} 0%, ${getColor(activeColor, "dd")} 100%);
            border-color: ${getColor(activeColor)};
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
            border-color: ${getColor(activeColor)};
            box-shadow: 0 0 0 3px ${getColor(activeColor, "20")};
            background-color: ${getColor(activeColor, "05")};
          }

          .dark .time-input {
            background-color: #262626;
            border: 2px solid #404040;
            color: #f3f4f6;
          }

          .dark .time-input:focus {
            border-color: ${getColor(activeColor)};
            background-color: ${getColor(activeColor, "20")};
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
            background: ${getColor(activeColor, "10")} !important;
            color: ${getColor(activeColor)} !important;
            transform: scale(1.1);
            box-shadow: 0 4px 6px -1px ${getColor(activeColor, "20")};
          }

          .dark .react-datepicker__day:hover {
            background: linear-gradient(135deg, #404040 0%, #525252 100%) !important;
            color: #ffffff !important;
          }

          .react-datepicker__day--selected,
          .react-datepicker__day--keyboard-selected {
            background: ${getColor(activeColor, "70")} !important;
            color: white !important;
            font-weight: 700 !important;
            box-shadow: 0 4px 6px -1px ${getColor(activeColor, "20")};
            transform: scale(1.05);
          }

          .react-datepicker__day--today {
            font-weight: 700;
            color: ${getColor(activeColor)} !important;
            background: linear-gradient(135deg, ${getColor(activeColor, "10")} 0%, ${getColor(activeColor, "05")} 100%) !important;
            border: 2px solid ${getColor(activeColor)};
          }

          .dark .react-datepicker__day--today {
            background: linear-gradient(135deg, ${getColor(activeColor, "20")} 0%, ${getColor(activeColor, "10")} 100%) !important;
            border-color: ${getColor(activeColor, "60")} !important;
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
            border-color: ${getColor(activeColor)} !important;
            background-color: ${getColor(activeColor, "05")} !important;
          }

          .dark .react-datepicker__month-dropdown,
          .dark .react-datepicker__year-dropdown {
            background-color: #262626 !important;
            border: 1px solid #525252 !important;
            color: #e5e7eb !important;
          }

          .dark .react-datepicker__month-dropdown:hover,
          .dark .react-datepicker__year-dropdown:hover {
            border-color: ${getColor(activeColor)} !important;
            background-color: ${getColor(activeColor, "20")} !important;
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
        id={id}
        name={name}
        selected={selected}
        onChange={(date) => {
          if (date && showTimeSelect) {
            if (selected) {
              const newDate = new Date(date);
              newDate.setHours(selected.getHours());
              newDate.setMinutes(selected.getMinutes());
              newDate.setSeconds(selected.getSeconds());
              onChange(newDate);
            } else {
              // If no previous date, set to current time
              const newDate = new Date(date);
              const now = new Date();
              newDate.setHours(now.getHours());
              newDate.setMinutes(now.getMinutes());
              newDate.setSeconds(0);
              onChange(newDate);
            }
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
        minTime={minTime}
        maxTime={maxTime}
        locale={currentLocale}
        placeholderText={placeholder}
        minDate={allowPastDates ? undefined : minDate || new Date()}
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

          const monthOptions = (currentLocale === "es" ? monthsEs : months).map(
            (m, i) => ({
              value: i,
              label: m,
            }),
          );

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
              <Button
                type="button"
                variant="ghost"
                buttonStyle="solid"
                className="header-nav-btn !p-0"
                onClick={decreaseMonth}
                disabled={prevMonthButtonDisabled}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

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

              <Button
                type="button"
                variant="ghost"
                buttonStyle="solid"
                className="header-nav-btn !p-0"
                onClick={increaseMonth}
                disabled={nextMonthButtonDisabled}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
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
                    <Button
                      type="button"
                      variant="ghost"
                      buttonStyle="solid"
                      onClick={(e) => {
                        e.stopPropagation();
                        onChange(null);
                        setIsOpen(false);
                      }}
                      icon={X}
                      className="p-2 react-datepicker__footer-clear"
                      title={currentLocale === "es" ? "Limpiar" : "Clear"}
                    >
                      {currentLocale === "es" ? "Limpiar" : "Clear"}
                    </Button>
                  )}
                </div>
              </div>
            ),
          [selected, onChange, currentLocale, showTimeSelect, isClearable],
        )}
      />
    </div>
  );
};

export default DatePickerModern;
export { DatePickerModern as DatePicker };
