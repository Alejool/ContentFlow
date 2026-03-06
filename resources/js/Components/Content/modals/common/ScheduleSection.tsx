import DatePickerModern from "@/Components/common/Modern/DatePicker";
import Label from "@/Components/common/Modern/Label";
import { parseISO } from "date-fns";
import { Clock } from "lucide-react";
import React from "react";

interface ScheduleSectionProps {
  scheduledAt?: string;
  t: (key: string) => string;
  onScheduleChange: (date: string) => void;
  useGlobalSchedule?: boolean;
  onGlobalScheduleToggle?: (val: boolean) => void;
  error?: string;
  disabled?: boolean;
  hasRecurrenceAccess?: boolean;
}

const ScheduleSection: React.FC<ScheduleSectionProps> = ({
  scheduledAt,
  t,
  onScheduleChange,
  useGlobalSchedule = false,
  onGlobalScheduleToggle,
  error,
  disabled = false,
  hasRecurrenceAccess = true,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="scheduled_at" icon={Clock} size="lg" className="mb-0">
          {t("publications.modal.schedule.title") || "Date for all networks"}
        </Label>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={useGlobalSchedule}
            onChange={(e) => {
              if (!disabled) {
                const isChecked = e.target.checked;
                onGlobalScheduleToggle?.(isChecked);
                // Clear the date when unchecking
                if (!isChecked) {
                  onScheduleChange("");
                }
              }
            }}
            disabled={disabled}
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
          <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("publications.modal.schedule.useGlobal") || "Global"}
          </span>
        </label>
      </div>

      <div
        className={`transition-all duration-300 ${useGlobalSchedule ? "opacity-100" : "opacity-40 pointer-events-none"} ${disabled ? "opacity-60 grayscale-[0.5]" : ""}`}
      >
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 ml-1">
          {t("publications.modal.schedule.description") ||
            "Set a single date to publish on all selected social networks at once."}
        </p>

        <div className="relative">
          <DatePickerModern
            id="scheduled_at"
            selected={scheduledAt ? parseISO(scheduledAt) : null}
            onChange={(date) =>
              onScheduleChange(date ? date.toISOString() : "")
            }
            showTimeSelect
            placeholder={
              t("publications.modal.schedule.placeholder") ||
              "Select date and time"
            }
            dateFormat="dd/MM/yyyy HH:mm"
            minDate={new Date()}
            minTime={
              scheduledAt &&
              new Date(scheduledAt).toDateString() === new Date().toDateString()
                ? new Date()
                : undefined
            }
            maxTime={
              scheduledAt &&
              new Date(scheduledAt).toDateString() === new Date().toDateString()
                ? new Date(new Date().setHours(23, 59, 59, 999))
                : undefined
            }
            withPortal
            popperPlacement="bottom-start"
            size="lg"
            isClearable
          />
        </div>

        {error && (
          <p className="mt-1 text-xs text-red-500 dark:text-red-400">{error}</p>
        )}
      </div>

      <div className="pt-4 border-t border-gray-100 dark:border-neutral-800">
        <Label htmlFor="recurrence" icon={Clock} size="lg" className="mb-2">
          {t("publications.modal.schedule.recurrence.title") ||
            "Repetir publicación (Recurrencia)"}
        </Label>

        {!hasRecurrenceAccess ? (
          <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-primary-100 dark:bg-primary-900/40 rounded-full shrink-0">
                <svg
                  className="w-4 h-4 text-primary-600 dark:text-primary-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-primary-800 dark:text-primary-300">
                  {t("publications.modal.schedule.recurrence.locked_title") ||
                    "Recurrencia bloqueada"}
                </p>
                <p className="text-xs text-primary-600 dark:text-primary-400 mt-0.5">
                  {t("publications.modal.schedule.recurrence.locked_desc") ||
                    "Sube de plan para configurar repeticiones automáticas (cada X días/semanas) en tus publicaciones."}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => (window.location.href = route("pricing"))}
              className="whitespace-nowrap shrink-0 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium rounded-md shadow-sm transition-colors"
            >
              {t("common.upgradePlan") || "Ver Planes"}
            </button>
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-neutral-800/50 border border-gray-200 dark:border-neutral-700 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("publications.modal.schedule.recurrence.coming_soon") ||
                "Opciones de configuración de recurrencia..."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleSection;
