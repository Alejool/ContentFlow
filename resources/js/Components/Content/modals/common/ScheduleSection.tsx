import DatePickerModern from "@/Components/common/Modern/DatePicker";
import Label from "@/Components/common/Modern/Label";
import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  format,
  parseISO,
  subDays,
} from "date-fns";
import { es } from "date-fns/locale";
import { AlertCircle, Calendar as CalendarIcon, Clock } from "lucide-react";
import React, { useMemo } from "react";

interface ScheduleSectionProps {
  scheduledAt?: string;
  t: (key: string) => string;
  onScheduleChange: (date: string) => void;
  useGlobalSchedule?: boolean;
  onGlobalScheduleToggle?: (val: boolean) => void;
  error?: string;
  recurrenceDaysError?: string;
  disabled?: boolean;
  hasRecurrenceAccess?: boolean;
  isRecurring?: boolean;
  recurrenceType?: "daily" | "weekly" | "monthly" | "yearly";
  recurrenceInterval?: number;
  recurrenceDays?: number[];
  recurrenceEndDate?: string;
  onRecurrenceChange?: (data: {
    is_recurring?: boolean;
    recurrence_type?: string;
    recurrence_interval?: number;
    recurrence_days?: number[];
    recurrence_end_date?: string;
  }) => void;
  i18n?: any;
  publishDate?: string;
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
  isRecurring = false,
  recurrenceType = "daily",
  recurrenceInterval = 1,
  recurrenceDays = [],
  recurrenceEndDate,
  onRecurrenceChange,
  recurrenceDaysError,
  i18n,
  publishDate,
}) => {
  const daysOfWeek = [
    { label: t("common.days.sun") || "D", value: 0 },
    { label: t("common.days.mon") || "L", value: 1 },
    { label: t("common.days.tue") || "M", value: 2 },
    { label: t("common.days.wed") || "X", value: 3 },
    { label: t("common.days.thu") || "J", value: 4 },
    { label: t("common.days.fri") || "V", value: 5 },
    { label: t("common.days.sat") || "S", value: 6 },
  ];

  const nextDates = useMemo(() => {
    const baseDate = scheduledAt || publishDate;
    if (!isRecurring || !baseDate) return [];

    const dates: Date[] = [];
    let currentDate = parseISO(baseDate);
    const endDate = recurrenceEndDate ? parseISO(recurrenceEndDate) : null;
    const interval = Math.max(1, recurrenceInterval || 1);
    const maxCount = 5;

    // Safety limit for calculation loops
    let iterations = 0;
    while (dates.length < maxCount && iterations < 50) {
      iterations++;

      // Don't include the very first date if it's already used as the base
      if (iterations > 1) {
        if (endDate && currentDate > endDate) break;
        dates.push(new Date(currentDate));
      }

      if (dates.length >= maxCount) break;

      switch (recurrenceType) {
        case "daily":
          currentDate = addDays(currentDate, interval);
          break;
        case "weekly":
          if (recurrenceDays.length > 0) {
            const currentDay = currentDate.getDay();
            let nextDayMatch = null;
            const sortedDays = [...recurrenceDays].sort((a, b) => a - b);

            for (const day of sortedDays) {
              if (day > currentDay) {
                nextDayMatch = day;
                break;
              }
            }

            if (nextDayMatch !== null) {
              currentDate = addDays(currentDate, nextDayMatch - currentDay);
            } else {
              const firstDayOfCycle = sortedDays[0];
              // Go to start of current week (Sunday), then jump interval weeks, then to the first selected day
              currentDate = addDays(
                subDays(currentDate, currentDay),
                interval * 7 + firstDayOfCycle,
              );
            }
          } else {
            currentDate = addWeeks(currentDate, interval);
          }
          break;
        case "monthly":
          currentDate = addMonths(currentDate, interval);
          break;
        case "yearly":
          currentDate = addYears(currentDate, interval);
          break;
        default:
          currentDate = addDays(currentDate, 1);
      }
    }

    return dates;
  }, [
    isRecurring,
    scheduledAt,
    publishDate,
    recurrenceType,
    recurrenceInterval,
    recurrenceDays,
    recurrenceEndDate,
  ]);

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
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-800/50 rounded-lg border border-gray-100 dark:border-neutral-700">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("publications.modal.schedule.recurrence.enable") ||
                  "Activar repetición"}
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={isRecurring}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    const updateData: any = { is_recurring: isChecked };

                    // CRITICAL: If disabling recurrence, clear the days to avoid
                    // stale validation errors in the form state.
                    if (!isChecked) {
                      updateData.recurrence_days = [];
                    }

                    onRecurrenceChange?.(updateData);
                  }}
                  disabled={disabled}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
              </label>
            </div>

            {isRecurring && (
              <div className="space-y-4 p-4 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label size="sm">
                      {t("publications.modal.schedule.recurrence.frequency") ||
                        "Frecuencia"}
                    </Label>
                    <select
                      className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2.5 dark:bg-neutral-800 dark:border-neutral-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                      value={recurrenceType}
                      onChange={(e) => {
                        const newType = e.target.value;
                        const updateData: any = {
                          recurrence_type: newType,
                        };

                        // CRITICAL: If switching AWAY from weekly, clear the recurrence days
                        // to avoid validation errors for days that are no longer relevant.
                        if (newType !== "weekly") {
                          updateData.recurrence_days = [];
                        }

                        onRecurrenceChange?.(updateData);
                      }}
                      disabled={disabled}
                    >
                      <option value="daily">
                        {t("common.frequencies.daily") || "Diario"}
                      </option>
                      <option value="weekly">
                        {t("common.frequencies.weekly") || "Semanal"}
                      </option>
                      <option value="monthly">
                        {t("common.frequencies.monthly") || "Mensual"}
                      </option>
                      <option value="yearly">
                        {t("common.frequencies.yearly") || "Anual"}
                      </option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label size="sm">
                      {t("publications.modal.schedule.recurrence.interval") ||
                        "Cada"}
                    </Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2.5 dark:bg-neutral-800 dark:border-neutral-600 dark:text-white"
                        value={recurrenceInterval}
                        onChange={(e) =>
                          onRecurrenceChange?.({
                            recurrence_interval: parseInt(e.target.value) || 1,
                          })
                        }
                        disabled={disabled}
                      />
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {recurrenceType === "daily"
                          ? t("common.units.days") || "días"
                          : recurrenceType === "weekly"
                            ? t("common.units.weeks") || "semanas"
                            : recurrenceType === "monthly"
                              ? t("common.units.months") || "meses"
                              : t("common.units.years") || "años"}
                      </span>
                    </div>
                  </div>
                </div>

                {recurrenceType === "weekly" && (
                  <div className="space-y-2">
                    <Label size="sm">
                      {t("publications.modal.schedule.recurrence.days") ||
                        "Repetir los días"}
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {daysOfWeek.map((day) => (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => {
                            const newDays = recurrenceDays.includes(day.value)
                              ? recurrenceDays.filter((d) => d !== day.value)
                              : [...recurrenceDays, day.value];
                            onRecurrenceChange?.({ recurrence_days: newDays });
                          }}
                          disabled={disabled}
                          className={`w-9 h-9 rounded-full text-xs font-semibold flex items-center justify-center transition-all ${
                            recurrenceDays.includes(day.value)
                              ? "bg-primary-600 text-white shadow-md ring-2 ring-primary-100 dark:ring-primary-900/30"
                              : "bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-700"
                          }`}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                    {recurrenceDaysError && (
                      <p className="mt-1 text-xs text-red-500">
                        {recurrenceDaysError}
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-1.5 pt-2 border-t border-gray-100 dark:border-neutral-800">
                  <Label size="sm">
                    {t("publications.modal.schedule.recurrence.ends") ||
                      "Termina el"}
                  </Label>
                  <DatePickerModern
                    selected={
                      recurrenceEndDate ? parseISO(recurrenceEndDate) : null
                    }
                    onChange={(date) =>
                      onRecurrenceChange?.({
                        recurrence_end_date: date
                          ? date.toISOString()
                          : undefined,
                      })
                    }
                    placeholder={
                      t(
                        "publications.modal.schedule.recurrence.ends_placeholder",
                      ) || "Opcional: Fecha de fin"
                    }
                    dateFormat="dd/MM/yyyy"
                    minDate={new Date()}
                    size="md"
                    isClearable
                    disabled={disabled}
                  />
                </div>

                {/* Next Dates Preview */}
                {nextDates.length > 0 && (
                  <div className="mt-4 p-3 bg-primary-50/30 dark:bg-primary-900/10 rounded-lg border border-primary-100/50 dark:border-primary-800/30">
                    <div className="flex items-center gap-2 mb-2 text-primary-700 dark:text-primary-400">
                      <CalendarIcon className="w-3.5 h-3.5" />
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        {t(
                          "publications.modal.schedule.recurrence.preview_title",
                        ) || "Próximas fechas de publicación"}
                      </span>
                    </div>
                    <ul className="space-y-1.5">
                      {nextDates.map((date: Date, idx: number) => (
                        <li
                          key={idx}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-gray-600 dark:text-gray-400 font-medium">
                            {idx + 1}.{" "}
                            {format(date, "EEEE, d 'de' MMMM", {
                              locale: i18n?.language === "es" ? es : undefined,
                            })}
                          </span>
                          <span className="text-gray-400 dark:text-gray-500 font-mono text-xs">
                            {format(date, "HH:mm")}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 text-[10px] text-gray-500 dark:text-gray-500 italic flex items-start gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                      {t(
                        "publications.modal.schedule.recurrence.preview_note",
                      ) ||
                        "Estas fechas son estimadas y se reflejarán en el calendario al guardar."}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleSection;
