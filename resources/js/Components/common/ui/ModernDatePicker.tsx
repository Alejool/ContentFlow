import Label from "@/Components/common/Modern/Label";
import { useTheme } from "@/Hooks/useTheme";
import { enUS, es } from "date-fns/locale";
import { AlertCircle, Calendar, Check, Clock } from "lucide-react";
import { ReactNode, forwardRef } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FieldValues, UseFormRegister } from "react-hook-form";
import { useTranslation } from "react-i18next";

registerLocale("es", es);
registerLocale("en", enUS);

interface ModernDatePickerProps<T extends FieldValues> {
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
}

const ModernDatePicker = ({
  selected,
  onChange,
  showTimeSelect = false,
  placeholder = "Select date",
  minDate,
  className = "",
  dateFormat,
  isClearable = false,
  popperPlacement = "bottom-start",
  withPortal = false,
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
}: ModernDatePickerProps<T>) => {
  const { theme } = useTheme();
  const { i18n } = useTranslation();

  const currentLocale = i18n.language.startsWith("es") ? "es" : "en";
  const defaultDateFormat = showTimeSelect ? "Pp" : "P";

  // Configuración de tamaños
  const sizeConfig = {
    sm: {
      input: "py-2 px-3 text-sm",
      icon: "w-4 h-4",
      label: "text-sm",
    },
    md: {
      input: "py-3 px-4 text-base",
      icon: "w-5 h-5",
      label: "text-base",
    },
    lg: {
      input: "py-4 px-4 text-lg",
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

    if (theme === "dark") {
      if (error) {
        return `${base} bg-neutral-800 text-white border-primary-500 focus:ring-primary-500/30`;
      }
      if (success) {
        return `${base} bg-neutral-800 text-white border-green-500 focus:ring-green-500/30`;
      }
      if (variant === "outlined") {
        return `${base} bg-transparent text-white border-2 border-neutral-600 hover:border-neutral-500 focus:ring-purple-500/30`;
      }
      if (variant === "filled") {
        return `${base} bg-neutral-800 text-white border border-neutral-700 hover:border-neutral-600 focus:ring-purple-500/30`;
      }
      return `${base} bg-neutral-800/50 text-white border border-neutral-700/50 hover:border-neutral-600/70 focus:ring-purple-500/30`;
    } else {
      if (error) {
        return `${base} bg-white text-gray-900 border-primary-500 focus:ring-primary-500/20`;
      }
      if (success) {
        return `${base} bg-white text-gray-900 border-green-500 focus:ring-green-500/20`;
      }
      if (variant === "outlined") {
        return `${base} bg-transparent text-gray-900 border-2 border-gray-300 hover:border-gray-400 focus:ring-purple-500/20`;
      }
      if (variant === "filled") {
        return `${base} bg-gray-50 text-gray-900 border border-gray-300 hover:border-gray-400 focus:ring-purple-500/20`;
      }
      return `${base} bg-white text-gray-900 border border-gray-300 hover:border-gray-400 focus:ring-purple-500/20`;
    }
  };

  const getMessageStyles = (type: "error" | "success") => {
    const base = "flex items-start gap-2 px-3 py-2 rounded-lg text-sm";

    if (theme === "dark") {
      return type === "error"
        ? `${base} text-primary-300 bg-primary-900/30 border border-primary-800/50`
        : `${base} text-green-300 bg-green-900/30 border border-green-800/50`;
    }
    return type === "error"
      ? `${base} text-primary-600 bg-primary-50/80 border border-primary-100`
      : `${base} text-green-600 bg-green-50/80 border border-green-100`;
  };

  const CustomInput = forwardRef<HTMLButtonElement, any>(
    ({ value, onClick, placeholder: inputPlaceholder }, ref) => (
      <button
        type="button"
        onClick={disabled ? undefined : onClick}
        ref={ref}
        disabled={disabled}
        className={`${getInputStyles()} ${className} ${
          disabled ? "cursor-not-allowed" : ""
        }`}
        {...register}
        aria-invalid={!!error}
        aria-describedby={
          error
            ? `${label?.toLowerCase()}-error`
            : success
            ? `${label?.toLowerCase()}-success`
            : undefined
        }
      >
        <div className="flex items-center gap-3 flex-1 text-left">
          <div className="flex items-center gap-2">
            {icon ||
              (showTimeSelect ? (
                <Clock
                  className={`${currentSize.icon} ${
                    theme === "dark"
                      ? error
                        ? "text-primary-400"
                        : success
                        ? "text-green-400"
                        : "text-gray-400"
                      : error
                      ? "text-primary-500"
                      : success
                      ? "text-green-500"
                      : "text-gray-500"
                  }`}
                />
              ) : (
                <Calendar
                  className={`${currentSize.icon} ${
                    theme === "dark"
                      ? error
                        ? "text-primary-400"
                        : success
                        ? "text-green-400"
                        : "text-gray-400"
                      : error
                      ? "text-primary-500"
                      : success
                      ? "text-green-500"
                      : "text-gray-500"
                  }`}
                />
              ))}
            <span
              className={`${
                !value
                  ? theme === "dark"
                    ? "text-gray-500"
                    : "text-gray-400"
                  : ""
              }`}
            >
              {value || inputPlaceholder}
            </span>
          </div>
        </div>
      </button>
    )
  );

  CustomInput.displayName = "CustomDateInput";

  return (
    <div className={`space-y-2 ${containerClassName}`}>
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
            <span
              className={`text-xs ${
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              } ml-auto`}
            >
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
            border-radius: 0.5rem;
            border: 1px solid ${theme === "dark" ? "#404040" : "#e5e7eb"};
            background-color: ${
              theme === "dark" ? "#262626 !important" : "#ffffff"
            };
            color: ${theme === "dark" ? "#e5e7eb" : "#374151"};
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            z-index: 9999 !important;
          }
          .react-datepicker__header {
            background-color: ${
              theme === "dark" ? "#171717 !important" : "#f9fafb"
            };
            border-bottom: 1px solid ${
              theme === "dark" ? "#404040" : "#e5e7eb"
            };
            border-top-left-radius: 0.5rem;
            border-top-right-radius: 0.5rem;
            padding-top: 1rem;
          }
          .react-datepicker__current-month, 
          .react-datepicker-time__header, 
          .react-datepicker-year-header {
            color: ${theme === "dark" ? "#e5e7eb !important" : "#111827"};
            font-weight: 600;
          }
          .react-datepicker__day-name {
            color: ${theme === "dark" ? "#9ca3af !important" : "#6b7280"};
          }
          .react-datepicker__day {
            color: ${theme === "dark" ? "#e5e7eb !important" : "#374151"};
            border-radius: 0.375rem;
          }
          .react-datepicker__day:hover {
            background-color: ${
              theme === "dark" ? "#404040 !important" : "#f3f4f6"
            };
            color: ${theme === "dark" ? "#ffffff !important" : "#111827"};
          }
          .react-datepicker__day--selected, 
          .react-datepicker__day--keyboard-selected {
            background-color: #ea580c !important;
            color: white !important;
          }
          .react-datepicker__day--today {
            font-weight: bold;
            color: ${theme === "dark" ? "#ea580c" : "#ea580c"};
          }
          .react-datepicker__time-container {
            border-left: 1px solid ${theme === "dark" ? "#404040" : "#e5e7eb"};
          }
          .react-datepicker__time-container .react-datepicker__time {
            background-color: ${
              theme === "dark" ? "#262626 !important" : "#ffffff"
            };
            border-bottom-right-radius: 0.5rem;
          }
          .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item {
            color: ${theme === "dark" ? "#e5e7eb !important" : "#374151"};
          }
          .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item:hover {
            background-color: ${
              theme === "dark" ? "#404040 !important" : "#f3f4f6"
            };
            color: ${theme === "dark" ? "#ffffff !important" : "#111827"};
          }
          .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item--selected {
            background-color: #ea580c !important;
            color: white !important;
          }
          .react-datepicker__navigation-icon::before {
            border-color: ${theme === "dark" ? "#9ca3af" : "#6b7280"};
          }
          .react-datepicker-popper {
            z-index: 9999 !important;
          }
          .react-datepicker__close-icon {
            background-color: transparent;
          }
          .react-datepicker__close-icon::after {
            background-color: ${theme === "dark" ? "#9ca3af" : "#6b7280"};
          }
        `}</style>

        <DatePicker
          name={name}
          selected={selected}
          onChange={onChange}
          showTimeSelect={showTimeSelect}
          dateFormat={dateFormat || defaultDateFormat}
          locale={currentLocale}
          placeholderText={placeholder}
          minDate={minDate}
          isClearable={isClearable}
          customInput={<CustomInput />}
          popperClassName="z-50"
          popperPlacement={popperPlacement}
          withPortal={withPortal}
          portalId="root-portal"
          disabled={disabled}
          className="w-full"
        />
      </div>

      {error && (
        <div
          id={`${label?.toLowerCase().replace(/\s+/g, "-")}-error`}
          className={getMessageStyles("error")}
          role="alert"
        >
          <AlertCircle />
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

export default ModernDatePicker;
