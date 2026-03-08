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
import { AlertCircle, Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import React, { useMemo, useState } from "react";

interface ScheduleSectionProps {
  scheduledAt?: string;
  t: (key: string) => string;
  onScheduleChange: (date: string) => void;
  useGlobalSchedule?: boolean;
  onGlobalScheduleToggle?: (val: boolean) => void;
  onClearAccountSchedules?: () => void;
  error?: string;
  recurrenceDaysError?: string;
  disabled?: boolean;
  hasRecurrenceAccess?: boolean;
  isRecurring?: boolean;
  recurrenceType?: "daily" | "weekly" | "monthly" | "yearly";
  recurrenceInterval?: number;
  recurrenceDays?: number[];
  recurrenceEndDate?: string;
  recurrenceAccounts?: number[];
  onRecurrenceChange?: (data: {
    is_recurring?: boolean;
    recurrence_type?: string;
    recurrence_interval?: number;
    recurrence_days?: number[];
    recurrence_end_date?: string;
    recurrence_accounts?: number[];
  }) => void;
  i18n?: any;
  publishDate?: string;
  accountSchedules?: Record<number, string>;
  selectedAccounts?: number[];
  socialAccounts?: Array<{ id: number; account_name: string; platform: string }>;
  existingScheduledPosts?: Array<{ social_account_id: number; scheduled_at: string; status: string }>;
}

const ScheduleSection: React.FC<ScheduleSectionProps> = ({
  scheduledAt,
  t,
  onScheduleChange,
  useGlobalSchedule = false,
  onGlobalScheduleToggle,
  onClearAccountSchedules,
  error,
  disabled = false,
  hasRecurrenceAccess = true,
  isRecurring = false,
  recurrenceType = "daily",
  recurrenceInterval = 1,
  recurrenceDays = [],
  recurrenceEndDate,
  recurrenceAccounts = [],
  onRecurrenceChange,
  recurrenceDaysError,
  i18n,
  publishDate,
  accountSchedules = {},
  selectedAccounts = [],
  socialAccounts = [],
  existingScheduledPosts = [],
}) => {
  const [carouselIndex, setCarouselIndex] = useState(0);
  
  const daysOfWeek = [
    { label: t("common.days.sun") || "D", value: 0 },
    { label: t("common.days.mon") || "L", value: 1 },
    { label: t("common.days.tue") || "M", value: 2 },
    { label: t("common.days.wed") || "X", value: 3 },
    { label: t("common.days.thu") || "J", value: 4 },
    { label: t("common.days.fri") || "V", value: 5 },
    { label: t("common.days.sat") || "S", value: 6 },
  ];

  // Calculate recurrence dates PER ACCOUNT
  // Each account can have its own scheduled date
  // Only calculate for accounts that are in recurrenceAccounts (or all if empty/null)
  const nextDatesByAccount = useMemo(() => {
    console.log('🔄 Recalculating nextDatesByAccount', {
      isRecurring,
      selectedAccounts,
      selectedAccountsLength: selectedAccounts?.length,
      scheduledAt,
      accountSchedules,
      accountSchedulesKeys: Object.keys(accountSchedules),
      recurrenceType,
      recurrenceInterval,
      recurrenceDays,
      recurrenceDaysLength: recurrenceDays?.length,
      recurrenceEndDate,
      recurrenceAccounts,
      recurrenceAccountsLength: recurrenceAccounts?.length,
      useGlobalSchedule,
      existingScheduledPosts: existingScheduledPosts.length
    });

    if (!isRecurring) {
      console.log('❌ Skipping: not recurring (isRecurring is false or undefined)');
      return {};
    }

    if (selectedAccounts.length === 0) {
      console.log('❌ Skipping: no accounts selected (selectedAccounts is empty)');
      return {};
    }

    // Check if we have the minimum required data
    if (!recurrenceType) {
      console.log('❌ Skipping: recurrenceType is missing');
      return {};
    }

    if (!recurrenceInterval || recurrenceInterval < 1) {
      console.log('❌ Skipping: recurrenceInterval is invalid', recurrenceInterval);
      return {};
    }

    // For weekly recurrence, we need days
    if (recurrenceType === 'weekly' && (!recurrenceDays || recurrenceDays.length === 0)) {
      console.log('❌ Skipping: weekly recurrence but no days selected', {
        recurrenceType,
        recurrenceDays,
        recurrenceDaysLength: recurrenceDays?.length
      });
      return {};
    }

    console.log('✅ Validation passed, proceeding with calculation', {
      recurrenceType,
      recurrenceDays,
      recurrenceDaysLength: recurrenceDays?.length
    });

    const result: Record<number, Date[]> = {};
    
    // Determine which accounts should have recurrence
    // Convert recurrenceAccounts to numbers for comparison
    // IMPORTANT: null or empty array means ALL selected accounts get recurrence
    const recurrenceAccountsNumbers = recurrenceAccounts && recurrenceAccounts.length > 0
      ? recurrenceAccounts.map(id => typeof id === 'string' ? parseInt(id) : id)
      : [];
    
    // If recurrenceAccounts is null/empty, ALL selected accounts get recurrence
    const accountsWithRecurrence = recurrenceAccountsNumbers.length > 0
      ? selectedAccounts.filter(id => recurrenceAccountsNumbers.includes(id))
      : selectedAccounts; // ALL accounts if empty/null

    console.log('📋 Accounts with recurrence:', accountsWithRecurrence);
    console.log('📋 recurrenceAccounts (original):', recurrenceAccounts);
    console.log('📋 recurrenceAccountsNumbers:', recurrenceAccountsNumbers);
    console.log('📋 selectedAccounts:', selectedAccounts);
    console.log('📋 Logic: recurrenceAccounts is', recurrenceAccounts === null ? 'null' : recurrenceAccounts === undefined ? 'undefined' : `array with ${recurrenceAccounts.length} items`, '→ applying to', accountsWithRecurrence.length === selectedAccounts.length ? 'ALL accounts' : 'specific accounts');

    accountsWithRecurrence.forEach((accountId) => {
      // Check if we should use existing dates from BD or calculate new ones
      // Use existing dates ONLY if:
      // 1. We have existing scheduled posts for this account
      // 2. The configuration hasn't changed (we'll always recalculate for preview)
      
      // For now, ALWAYS calculate to show preview when user changes config
      // The backend will handle saving the correct dates
      console.log(`🔢 Calculating dates for account ${accountId}`);
      
      // Use account-specific schedule if available, otherwise use global schedule
      const baseDate = accountSchedules[accountId] || scheduledAt;
      
      console.log(`📅 Account ${accountId} baseDate:`, baseDate, 'type:', typeof baseDate);
      console.log(`📅 Account ${accountId} accountSchedules[${accountId}]:`, accountSchedules[accountId]);
      console.log(`📅 Account ${accountId} scheduledAt:`, scheduledAt);
      console.log(`📅 Account ${accountId} useGlobalSchedule:`, useGlobalSchedule);
      
      // Skip if no date is available for this account
      if (!baseDate) {
        console.log(`⚠️ No baseDate for account ${accountId}`);
        return;
      }

      // For weekly recurrence, skip if no days are selected
      if (recurrenceType === "weekly" && (!recurrenceDays || recurrenceDays.length === 0)) {
        console.log(`⚠️ Weekly recurrence but no days selected for account ${accountId}`);
        return;
      }

      const dates: Date[] = [];
      const interval = Math.max(1, recurrenceInterval || 1);
      const endDate = recurrenceEndDate ? parseISO(recurrenceEndDate) : null;
      const maxCount = 5;
      let currentDate: Date;
      
      try {
        // Handle different date formats
        if (typeof baseDate === 'string') {
          currentDate = parseISO(baseDate);
        } else if (baseDate instanceof Date) {
          currentDate = baseDate;
        } else {
          console.error(`❌ Invalid baseDate format for account ${accountId}:`, baseDate);
          return;
        }
        
        // Validate the parsed date
        if (isNaN(currentDate.getTime())) {
          console.error(`❌ Invalid date for account ${accountId}:`, baseDate);
          return;
        }
      } catch (error) {
        console.error(`❌ Error parsing date for account ${accountId}:`, error, baseDate);
        return;
      }

      // Convert recurrenceDays to numbers for comparison
      const recurrenceDaysNumbers = recurrenceDays ? recurrenceDays.map(d => typeof d === 'string' ? parseInt(d) : d) : [];

      // Start from the NEXT occurrence after the scheduled date
      switch (recurrenceType) {
        case "daily":
          currentDate = addDays(currentDate, interval);
          break;
        case "weekly":
          if (recurrenceDaysNumbers.length > 0) {
            const currentDay = currentDate.getDay();
            let nextDayMatch = null;
            const sortedDays = [...recurrenceDaysNumbers].sort((a, b) => a - b);

            console.log(`📅 Weekly calculation - Finding next day:`, {
              currentDate: currentDate.toISOString(),
              currentDay,
              sortedDays,
              recurrenceDaysNumbers
            });

            // Find the next occurrence of any selected day
            for (const day of sortedDays) {
              if (day > currentDay) {
                nextDayMatch = day;
                break;
              }
            }

            if (nextDayMatch !== null) {
              // Found a day later in the same week
              const daysToAdd = nextDayMatch - currentDay;
              console.log(`✅ Found next day in same week: ${nextDayMatch}, adding ${daysToAdd} days`);
              currentDate = addDays(currentDate, daysToAdd);
            } else {
              // No day found in current week, go to next week and find first selected day
              const firstDayOfCycle = sortedDays[0];
              // Calculate days until next week's first selected day
              const daysUntilNextWeek = 7 - currentDay; // Days until next Sunday (day 0)
              const daysToAdd = daysUntilNextWeek + firstDayOfCycle + (interval - 1) * 7;
              console.log(`🔄 No day found in same week, going to next cycle:`, {
                firstDayOfCycle,
                daysUntilNextWeek,
                daysToAdd,
                calculation: `${daysUntilNextWeek} + ${firstDayOfCycle} + ${(interval - 1) * 7}`
              });
              currentDate = addDays(currentDate, daysToAdd);
            }
            console.log(`📅 Next date calculated: ${currentDate.toISOString()}`);
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

      // Calculate recurring dates (show preview even without end date)
      let iterations = 0;
      console.log(`🔁 Starting calculation for account ${accountId}:`, {
        currentDate: currentDate.toISOString(),
        endDate: endDate?.toISOString(),
        maxCount,
        recurrenceType,
        interval,
        recurrenceDaysNumbers
      });
      
      while (dates.length < maxCount && iterations < 50) {
        iterations++;

        // If there's an end date and we've passed it, stop
        if (endDate && currentDate > endDate) {
          console.log(`⏹️ Stopped: currentDate (${currentDate.toISOString()}) > endDate (${endDate.toISOString()})`);
          break;
        }
        
        console.log(`➕ Adding date ${dates.length + 1}:`, currentDate.toISOString());
        dates.push(new Date(currentDate));

        if (dates.length >= maxCount) break;

        switch (recurrenceType) {
          case "daily":
            currentDate = addDays(currentDate, interval);
            break;
          case "weekly":
            if (recurrenceDaysNumbers.length > 0) {
              const currentDay = currentDate.getDay();
              let nextDayMatch = null;
              const sortedDays = [...recurrenceDaysNumbers].sort((a, b) => a - b);

              // Find the next occurrence of any selected day
              for (const day of sortedDays) {
                if (day > currentDay) {
                  nextDayMatch = day;
                  break;
                }
              }

              if (nextDayMatch !== null) {
                // Found a day later in the same week
                currentDate = addDays(currentDate, nextDayMatch - currentDay);
              } else {
                // No day found in current week, go to next week and find first selected day
                const firstDayOfCycle = sortedDays[0];
                const daysUntilNextWeek = 7 - currentDay;
                const daysToAdd = daysUntilNextWeek + firstDayOfCycle + (interval - 1) * 7;
                currentDate = addDays(currentDate, daysToAdd);
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

      result[accountId] = dates;
      console.log(`✅ Account ${accountId} calculated ${dates.length} dates:`, dates);
    });

    console.log('📊 Final result:', result);
    return result;
  }, [
    isRecurring,
    selectedAccounts,
    accountSchedules,
    scheduledAt,
    recurrenceType,
    recurrenceInterval,
    recurrenceDays,
    recurrenceEndDate,
    recurrenceAccounts,
    useGlobalSchedule,
    existingScheduledPosts,
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
                
                // Si se activa el global schedule, limpiar las fechas individuales
                if (isChecked) {
                  console.log('[ScheduleSection] Global schedule enabled, clearing individual account schedules');
                  onClearAccountSchedules?.();
                } else {
                  // Si se desactiva, limpiar la fecha global
                  console.log('[ScheduleSection] Global schedule disabled, clearing global date');
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
                {/* Selector de redes con recurrencia - Solo si hay más de una red */}
                {selectedAccounts.length > 1 ? (
                  <div className="space-y-3 pb-4 border-b border-gray-100 dark:border-neutral-800">
                    <div>
                      <Label size="sm">
                        {t("publications.modal.schedule.recurrence.select_accounts") ||
                          "Redes con recurrencia"}
                      </Label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {t("publications.modal.schedule.recurrence.select_accounts_desc") ||
                          "Selecciona qué redes publicarán de forma recurrente. Las demás solo publicarán una vez."}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      {/* Opción: Todas las redes */}
                      <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-800/50 cursor-pointer transition-colors border border-gray-200 dark:border-neutral-700">
                        <input
                          type="checkbox"
                          checked={!recurrenceAccounts || recurrenceAccounts.length === 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              onRecurrenceChange?.({ recurrence_accounts: [] });
                            } else {
                              onRecurrenceChange?.({ recurrence_accounts: [selectedAccounts[0]] });
                            }
                          }}
                          className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                          disabled={disabled}
                        />
                        <div className="flex-1">
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {t("publications.modal.schedule.recurrence.all_accounts") || "Aplicar a todas"}
                          </span>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {socialAccounts
                              .filter(acc => selectedAccounts.includes(acc.id))
                              .map((account) => {
                                const platformColors: Record<string, { bg: string; text: string; border: string }> = {
                                  youtube: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-800' },
                                  facebook: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
                                  instagram: { bg: 'bg-pink-50 dark:bg-pink-900/20', text: 'text-pink-700 dark:text-pink-400', border: 'border-pink-200 dark:border-pink-800' },
                                  twitter: { bg: 'bg-sky-50 dark:bg-sky-900/20', text: 'text-sky-700 dark:text-sky-400', border: 'border-sky-200 dark:border-sky-800' },
                                  linkedin: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
                                  tiktok: { bg: 'bg-gray-50 dark:bg-gray-900/20', text: 'text-gray-700 dark:text-gray-400', border: 'border-gray-200 dark:border-gray-800' },
                                };
                                const colors = platformColors[account.platform.toLowerCase()] || platformColors.tiktok;
                                
                                return (
                                  <span
                                    key={account.id}
                                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border}`}
                                  >
                                    <span className="font-semibold">{account.platform}</span>
                                    <span className="opacity-75">·</span>
                                    <span className="truncate max-w-[120px]">{account.account_name}</span>
                                  </span>
                                );
                              })}
                          </div>
                        </div>
                      </label>

                      {/* Opciones individuales - Solo mostrar si NO es "todas" */}
                      {recurrenceAccounts && recurrenceAccounts.length > 0 && (
                        <div className="space-y-2 pt-2">
                          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 px-1">
                            Selección personalizada:
                          </p>
                          {socialAccounts
                            .filter(acc => selectedAccounts.includes(acc.id))
                            .map((account) => {
                              const platformColors: Record<string, { bg: string; text: string; border: string; hover: string }> = {
                                youtube: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-800', hover: 'hover:bg-red-100 dark:hover:bg-red-900/30' },
                                facebook: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800', hover: 'hover:bg-blue-100 dark:hover:bg-blue-900/30' },
                                instagram: { bg: 'bg-pink-50 dark:bg-pink-900/20', text: 'text-pink-700 dark:text-pink-400', border: 'border-pink-200 dark:border-pink-800', hover: 'hover:bg-pink-100 dark:hover:bg-pink-900/30' },
                                twitter: { bg: 'bg-sky-50 dark:bg-sky-900/20', text: 'text-sky-700 dark:text-sky-400', border: 'border-sky-200 dark:border-sky-800', hover: 'hover:bg-sky-100 dark:hover:bg-sky-900/30' },
                                linkedin: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800', hover: 'hover:bg-blue-100 dark:hover:bg-blue-900/30' },
                                tiktok: { bg: 'bg-gray-50 dark:bg-gray-900/20', text: 'text-gray-700 dark:text-gray-400', border: 'border-gray-200 dark:border-gray-800', hover: 'hover:bg-gray-100 dark:hover:bg-gray-900/30' },
                              };
                              const colors = platformColors[account.platform.toLowerCase()] || platformColors.tiktok;
                              const isChecked = recurrenceAccounts.includes(account.id);
                              
                              return (
                                <label
                                  key={account.id}
                                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border ${colors.bg} ${colors.border} ${colors.hover} ${isChecked ? 'ring-2 ring-primary-500 dark:ring-primary-600' : ''}`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      const currentAccounts = recurrenceAccounts || [];
                                      let newAccounts: number[];
                                      
                                      if (e.target.checked) {
                                        newAccounts = [...currentAccounts, account.id];
                                        if (newAccounts.length === selectedAccounts.length) {
                                          newAccounts = [];
                                        }
                                      } else {
                                        newAccounts = currentAccounts.filter(id => id !== account.id);
                                        if (newAccounts.length === 0) {
                                          const otherAccount = selectedAccounts.find(id => id !== account.id);
                                          if (otherAccount) {
                                            newAccounts = [otherAccount];
                                          }
                                        }
                                      }
                                      
                                      onRecurrenceChange?.({ recurrence_accounts: newAccounts });
                                    }}
                                    className="w-4 h-4 text-primary-600 bg-white border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                    disabled={disabled}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className={`text-sm font-bold ${colors.text}`}>
                                        {account.platform}
                                      </span>
                                      <span className="text-xs text-gray-400 dark:text-gray-500">·</span>
                                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                                        {account.account_name}
                                      </span>
                                    </div>
                                  </div>
                                </label>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  </div>
                ) : selectedAccounts.length === 1 ? (
                  <div className="pb-4 border-b border-gray-100 dark:border-neutral-800">
                    {(() => {
                      const account = socialAccounts.find(a => a.id === selectedAccounts[0]);
                      if (!account) return null;
                      
                      const platformColors: Record<string, { bg: string; text: string; border: string }> = {
                        youtube: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-800' },
                        facebook: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
                        instagram: { bg: 'bg-pink-50 dark:bg-pink-900/20', text: 'text-pink-700 dark:text-pink-400', border: 'border-pink-200 dark:border-pink-800' },
                        twitter: { bg: 'bg-sky-50 dark:bg-sky-900/20', text: 'text-sky-700 dark:text-sky-400', border: 'border-sky-200 dark:border-sky-800' },
                        linkedin: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
                        tiktok: { bg: 'bg-gray-50 dark:bg-gray-900/20', text: 'text-gray-700 dark:text-gray-400', border: 'border-gray-200 dark:border-gray-800' },
                      };
                      const colors = platformColors[account.platform.toLowerCase()] || platformColors.tiktok;
                      
                      return (
                        <div className={`flex items-start gap-3 p-3 rounded-lg border ${colors.bg} ${colors.border}`}>
                          <div className={`p-1.5 rounded-full shrink-0 mt-0.5 ${colors.bg} ${colors.border} border`}>
                            <CalendarIcon className={`w-4 h-4 ${colors.text}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-sm font-bold ${colors.text}`}>
                                {account.platform}
                              </span>
                              <span className="text-xs text-gray-400 dark:text-gray-500">·</span>
                              <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                                {account.account_name}
                              </span>
                            </div>
                            <p className={`text-xs ${colors.text} opacity-90`}>
                              {t("publications.modal.schedule.recurrence.single_account_note") ||
                                "Esta red publicará de forma recurrente según la configuración."}
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : null}

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
                            console.log('[ScheduleSection] Day clicked:', {
                              dayValue: day.value,
                              dayLabel: day.label,
                              currentDays: recurrenceDays,
                              newDays,
                              action: recurrenceDays.includes(day.value) ? 'remove' : 'add'
                            });
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
                  <Label size="sm" required>
                    {t("publications.modal.schedule.recurrence.ends") ||
                      "Fecha de finalización"}
                  </Label>
                  <DatePickerModern
                    selected={
                      recurrenceEndDate ? parseISO(recurrenceEndDate) : null
                    }
                    onChange={(date) =>
                      onRecurrenceChange?.({
                        recurrence_end_date: date
                          ? format(date, 'yyyy-MM-dd')
                          : undefined,
                      })
                    }
                    placeholder={
                      t(
                        "publications.modal.schedule.recurrence.ends_placeholder",
                      ) || "Selecciona cuándo termina la recurrencia"
                    }
                    dateFormat="dd/MM/yyyy"
                    minDate={new Date()}
                    size="md"
                    disabled={disabled}
                  />
                  {isRecurring && !recurrenceEndDate && (
                    <p className="mt-1 text-xs text-red-500">
                      {t("publications.modal.schedule.recurrence.end_date_required") || 
                        "La fecha de fin es obligatoria para publicaciones recurrentes"}
                    </p>
                  )}
                </div>

                {/* Next Dates Preview - Always show when recurring is enabled */}
                {isRecurring && (
                  <div className="mt-4 p-4 bg-primary-50/30 dark:bg-primary-900/10 rounded-lg border border-primary-100/50 dark:border-primary-800/30">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-primary-700 dark:text-primary-400">
                        <CalendarIcon className="w-4 h-4" />
                        <span className="text-sm font-semibold">
                          {t(
                            "publications.modal.schedule.recurrence.preview_title",
                          ) || "Próximas fechas de publicación"}
                        </span>
                      </div>
                      {Object.keys(nextDatesByAccount).length > 1 && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setCarouselIndex(prev => Math.max(0, prev - 1))}
                            disabled={carouselIndex === 0}
                            className="p-1 rounded hover:bg-primary-100 dark:hover:bg-primary-900/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <ChevronLeft className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                          </button>
                          <span className="text-xs text-primary-600 dark:text-primary-400 font-medium min-w-[3rem] text-center">
                            {carouselIndex + 1} / {Object.keys(nextDatesByAccount).length}
                          </span>
                          <button
                            type="button"
                            onClick={() => setCarouselIndex(prev => Math.min(Object.keys(nextDatesByAccount).length - 1, prev + 1))}
                            disabled={carouselIndex === Object.keys(nextDatesByAccount).length - 1}
                            className="p-1 rounded hover:bg-primary-100 dark:hover:bg-primary-900/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <ChevronRight className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {Object.keys(nextDatesByAccount).length > 0 ? (
                      <div className="relative overflow-hidden">
                        <div 
                          className="flex transition-transform duration-300 ease-in-out"
                          style={{ transform: `translateX(-${carouselIndex * 100}%)` }}
                        >
                          {Object.entries(nextDatesByAccount).map(([accountIdStr, dates]) => {
                            const accountId = parseInt(accountIdStr);
                            const account = socialAccounts.find(a => a.id === accountId);
                            if (!account || dates.length === 0) return null;
                            
                            const platformColors: Record<string, { bg: string; text: string; border: string }> = {
                              youtube: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-800' },
                              facebook: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
                              instagram: { bg: 'bg-pink-50 dark:bg-pink-900/20', text: 'text-pink-700 dark:text-pink-400', border: 'border-pink-200 dark:border-pink-800' },
                              twitter: { bg: 'bg-sky-50 dark:bg-sky-900/20', text: 'text-sky-700 dark:text-sky-400', border: 'border-sky-200 dark:border-sky-800' },
                              linkedin: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
                              tiktok: { bg: 'bg-gray-50 dark:bg-gray-900/20', text: 'text-gray-700 dark:text-gray-400', border: 'border-gray-200 dark:border-gray-800' },
                            };
                            const colors = platformColors[account.platform.toLowerCase()] || platformColors.tiktok;
                            
                            return (
                              <div key={accountId} className="w-full flex-shrink-0 px-1">
                                <div className="space-y-2">
                                  <div className={`flex items-center gap-2 pb-2 border-b ${colors.border}`}>
                                    <span className={`text-sm font-bold ${colors.text}`}>
                                      {account.platform}
                                    </span>
                                    <span className="text-xs text-gray-400 dark:text-gray-500">·</span>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                                      {account.account_name}
                                    </span>
                                  </div>
                                  <div className="space-y-1.5">
                                    {dates.slice(0, 5).map((date: Date, idx: number) => (
                                      <div
                                        key={idx}
                                        className="flex items-center justify-between p-2 bg-white/50 dark:bg-neutral-900/30 rounded-md hover:bg-white/80 dark:hover:bg-neutral-900/50 transition-colors"
                                      >
                                        <div className="flex items-center gap-2">
                                          <span className={`flex items-center justify-center w-6 h-6 rounded-full ${colors.bg} ${colors.text} text-xs font-bold`}>
                                            {idx + 1}
                                          </span>
                                          <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                                            {format(date, "EEEE, d 'de' MMMM", {
                                              locale: i18n?.language === "es" ? es : undefined,
                                            })}
                                          </span>
                                        </div>
                                        <span className={`text-sm font-mono font-semibold ${colors.text}`}>
                                          {format(date, "HH:mm")}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <AlertCircle className="w-8 h-8 text-amber-500 dark:text-amber-400 mx-auto mb-2" />
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {!scheduledAt && Object.keys(accountSchedules).length === 0
                            ? "Configura una fecha para ver el preview"
                            : recurrenceType === "weekly" && (!recurrenceDays || recurrenceDays.length === 0)
                              ? "Selecciona al menos un día de la semana"
                              : "Configura los parámetros de recurrencia"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {!scheduledAt && Object.keys(accountSchedules).length === 0
                            ? "Activa la 'Programación Global' arriba o configura fechas individuales por red social"
                            : recurrenceType === "weekly" && (!recurrenceDays || recurrenceDays.length === 0)
                              ? "Marca los días en los que quieres que se repita la publicación"
                              : "Verifica que todos los campos estén completos"}
                        </p>
                      </div>
                    )}
                    
                    <p className="mt-3 text-[10px] text-gray-500 dark:text-gray-400 italic flex items-start gap-1.5">
                      <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                      <span>
                        {t(
                          "publications.modal.schedule.recurrence.preview_note",
                        ) ||
                          "Estas fechas son estimadas y se reflejarán en el calendario al guardar."}
                      </span>
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
