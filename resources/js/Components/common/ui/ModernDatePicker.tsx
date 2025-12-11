import { useTheme } from "@/Hooks/useTheme";
import { enUS, es } from "date-fns/locale";
import { Calendar, Clock } from "lucide-react";
import { forwardRef } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useTranslation } from "react-i18next";

registerLocale("es", es);
registerLocale("en", enUS);

interface ModernDatePickerProps {
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
}: ModernDatePickerProps) => {
  const { theme } = useTheme();
  const { i18n } = useTranslation();

  const currentLocale = i18n.language.startsWith("es") ? "es" : "en";
  const defaultDateFormat = showTimeSelect ? "Pp" : "P";

  const CustomInput = forwardRef<HTMLButtonElement, any>(
    ({ value, onClick, placeholder }, ref) => (
      <button
        type="button"
        onClick={onClick}
        ref={ref}
        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg border transition-all text-sm
          ${
            theme === "dark"
              ? "bg-neutral-800 border-neutral-700 text-gray-200 hover:border-neutral-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/50"
              : "bg-white border-gray-200 text-gray-700 hover:border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/50"
          }
          ${className}`}
      >
        <div className="flex items-center gap-2">
          {showTimeSelect ? (
            <Clock
              className={`w-4 h-4 ${
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              }`}
            />
          ) : (
            <Calendar
              className={`w-4 h-4 ${
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              }`}
            />
          )}
          <span className={!value ? "text-gray-500" : ""}>
            {value || placeholder}
          </span>
        </div>
      </button>
    )
  );

  CustomInput.displayName = "CustomDateInput";

  return (
    <div className="relative w-full">
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
          border-bottom: 1px solid ${theme === "dark" ? "#404040" : "#e5e7eb"};
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
          background-color: #f97316 !important; /* orange-500 */
          color: white !important;
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
          background-color: #f97316 !important;
          color: white !important;
        }
        .react-datepicker__navigation-icon::before {
          border-color: ${theme === "dark" ? "#9ca3af" : "#6b7280"};
        }
        .react-datepicker-popper {
          z-index: 9999 !important;
        }
      `}</style>

      <DatePicker
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
      />
    </div>
  );
};

export default ModernDatePicker;
