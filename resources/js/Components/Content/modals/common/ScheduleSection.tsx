import { parseISO } from 'date-fns';
import React, { useMemo, useState } from 'react';
import { RecurrenceSection } from '@/Components/Content/modals/common/RecurrenceSection';

interface ScheduleSectionProps {
  scheduledAt?: string | undefined;
  t: (key: string) => string;
  onScheduleChange: (date: string) => void;
  useGlobalSchedule?: boolean | undefined;
  onGlobalScheduleToggle?: ((val: boolean) => void) | undefined;
  onClearAccountSchedules?: (() => void) | undefined;
  error?: string | undefined;
  recurrenceDaysError?: string | undefined;
  disabled?: boolean | undefined;
  hasRecurrenceAccess?: boolean | undefined;
  isRecurring?: boolean | undefined;
  recurrenceType?: 'daily' | 'weekly' | 'monthly' | 'yearly' | undefined;
  recurrenceInterval?: number | undefined;
  recurrenceDays?: number[] | undefined;
  recurrenceEndDate?: string | undefined;
  recurrenceAccounts?: number[] | undefined;
  onRecurrenceChange?: ((data: {
    is_recurring?: boolean;
    recurrence_type?: string;
    recurrence_interval?: number;
    recurrence_days?: number[];
    recurrence_end_date?: string;
    recurrence_accounts?: number[];
  }) => void) | undefined;
  i18n?: any | undefined;
  publishDate?: string | undefined;
  accountSchedules?: Record<number, string> | undefined;
  selectedAccounts?: number[] | undefined;
  socialAccounts?: Array<{
    id: number;
    account_name?: string;
    platform: string;
  }> | undefined;
  existingScheduledPosts?: Array<{
    social_account_id: number;
    scheduled_at: string;
    published_at?: string;
    status: string;
  }> | undefined;
  socialPostLogs?: Array<{
    social_account_id: number;
    status: string;
    published_at?: string;
    created_at?: string;
  }> | undefined;
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
  recurrenceType = 'daily',
  recurrenceInterval,
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
  socialPostLogs = [],
}) => {
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Helper function to parse date strings in UTC
  // Handles multiple formats:
  // - YYYY-MM-DD (date only)
  // - YYYY-MM-DD HH:mm:ss (datetime without timezone - assumes UTC)
  // - ISO format with timezone (YYYY-MM-DDTHH:mm:ss.sssZ)
  const parseUTCDate = (dateString: string): Date => {
    // If it's just a date (YYYY-MM-DD), append UTC time
    if (dateString.length === 10 && !dateString.includes('T')) {
      return new Date(dateString + 'T00:00:00.000Z');
    }

    // If it's datetime without timezone (YYYY-MM-DD HH:mm:ss), convert to UTC
    // This format comes from Laravel's published_at field
    if (dateString.includes(' ') && !dateString.includes('T')) {
      // Replace space with 'T' and append 'Z' to indicate UTC
      return new Date(dateString.replace(' ', 'T') + 'Z');
    }

    // Otherwise, parse as ISO (already includes timezone info)
    return parseISO(dateString);
  };

  // Helper function to format Date to YYYY-MM-DD in UTC
  const formatUTCDate = (date: Date): string => {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper functions for UTC date arithmetic
  const addDaysUTC = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setUTCDate(result.getUTCDate() + days);
    return result;
  };

  const addWeeksUTC = (date: Date, weeks: number): Date => {
    return addDaysUTC(date, weeks * 7);
  };

  const addMonthsUTC = (date: Date, months: number): Date => {
    const result = new Date(date);
    result.setUTCMonth(result.getUTCMonth() + months);
    return result;
  };

  const addYearsUTC = (date: Date, years: number): Date => {
    const result = new Date(date);
    result.setUTCFullYear(result.getUTCFullYear() + years);
    return result;
  };

  const daysOfWeek = [
    { label: t('common.days.sun') || 'D', value: 0 },
    { label: t('common.days.mon') || 'L', value: 1 },
    { label: t('common.days.tue') || 'M', value: 2 },
    { label: t('common.days.wed') || 'M', value: 3 },
    { label: t('common.days.thu') || 'J', value: 4 },
    { label: t('common.days.fri') || 'V', value: 5 },
    { label: t('common.days.sat') || 'S', value: 6 },
  ];

  // Calculate recurrence dates PER ACCOUNT
  // Each account can have its own scheduled date
  // Only calculate for accounts that are in recurrenceAccounts (or all if empty/null)
  // Get all available accounts (selected + published + from logs)
  // This allows recurrence on already published posts
  const allAvailableAccounts = useMemo(() => {
    const accounts = new Set<number>(selectedAccounts);

    // Add accounts from existing scheduled/published posts
    if (existingScheduledPosts && existingScheduledPosts.length > 0) {
      existingScheduledPosts.forEach((post) => {
        if (post.status === 'published' || post.status === 'pending') {
          accounts.add(post.social_account_id);
        }
      });
    }

    // Add accounts from social post logs (for posts published directly without scheduling)
    if (socialPostLogs && socialPostLogs.length > 0) {
      socialPostLogs.forEach((log) => {
        if (log.status === 'published' && log.social_account_id) {
          accounts.add(log.social_account_id);
        }
      });
    }

    return Array.from(accounts);
  }, [selectedAccounts, existingScheduledPosts, socialPostLogs]);

  // Helper to check if we have any dates available (scheduled or published)
  const hasAnyDates = useMemo(() => {
    // Check if we have global schedule
    if (scheduledAt) return true;

    // Check if we have account-specific schedules
    if (Object.keys(accountSchedules).length > 0) return true;

    // Check if we have existing published posts with dates
    if (existingScheduledPosts && existingScheduledPosts.length > 0) {
      const hasScheduledDates = existingScheduledPosts.some(
        (post) =>
          allAvailableAccounts.includes(post.social_account_id) &&
          (post.status === 'published' || post.status === 'pending') &&
          (post.published_at || post.scheduled_at),
      );
      if (hasScheduledDates) return true;
    }

    // Check if we have social post logs with published dates
    if (socialPostLogs && socialPostLogs.length > 0) {
      return socialPostLogs.some(
        (log) =>
          allAvailableAccounts.includes(log.social_account_id) &&
          log.status === 'published' &&
          log.published_at,
      );
    }

    return false;
  }, [scheduledAt, accountSchedules, existingScheduledPosts, socialPostLogs, allAvailableAccounts]);

  const nextDatesByAccount = useMemo(() => {
    if (!isRecurring) {
      return {};
    }

    if (allAvailableAccounts.length === 0) {
      return {};
    }

    // Check if we have the minimum required data
    if (!recurrenceType) {
      return {};
    }

    if (!recurrenceInterval || recurrenceInterval < 1) {
      return {};
    }

    // For weekly recurrence, we need days
    if (recurrenceType === 'weekly' && (!recurrenceDays || recurrenceDays.length === 0)) {
      return {};
    }

    const result: Record<number, Date[]> = {};

    // Determine which accounts should have recurrence
    // Convert recurrenceAccounts to numbers for comparison
    // IMPORTANT: null or empty array means ALL available accounts get recurrence
    const recurrenceAccountsNumbers =
      recurrenceAccounts && recurrenceAccounts.length > 0
        ? recurrenceAccounts.map((id) => (typeof id === 'string' ? parseInt(id) : id))
        : [];

    // If recurrenceAccounts is null/empty, ALL available accounts get recurrence
    const accountsWithRecurrence =
      recurrenceAccountsNumbers.length > 0
        ? allAvailableAccounts.filter((id) => recurrenceAccountsNumbers.includes(id))
        : allAvailableAccounts; // ALL accounts if empty/null

    accountsWithRecurrence.forEach((accountId) => {
      // Determine the base date for this account
      // Priority order:
      // 1. Account-specific schedule (user is actively configuring)
      // 2. Published date from social_post_logs (if already published)
      // 3. Existing scheduled post for this account (pending or published)
      // 4. Global scheduledAt (fallback for new publications)

      let baseDate = accountSchedules[accountId];

      // If no account-specific schedule, check social_post_logs first (most accurate for published posts)
      if (!baseDate && socialPostLogs && socialPostLogs.length > 0) {
        const publishedLog = socialPostLogs.find(
          (log) => log.social_account_id === accountId && log.status === 'published',
        );
        if (publishedLog?.published_at) {
          baseDate = publishedLog.published_at;
        }
      }

      // If still no date, try to get it from existingScheduledPosts
      // This handles the case when editing an existing publication
      if (!baseDate && existingScheduledPosts && existingScheduledPosts.length > 0) {
        const existingPost = existingScheduledPosts.find(
          (post) =>
            post.social_account_id === accountId &&
            (post.status === 'pending' || post.status === 'published'),
        );
        // For published posts, use published_at; for pending, use scheduled_at
        if (existingPost) {
          baseDate =
            existingPost.status === 'published'
              ? existingPost.published_at
              : existingPost.scheduled_at;
        }
      }

      // FALLBACK: Use global scheduledAt if no account-specific date is found
      // This is critical for new publications where user sets a global date
      if (!baseDate && scheduledAt) {
        baseDate = scheduledAt;
        console.log(
          `[ScheduleSection] Using global scheduledAt as fallback for account ${accountId}:`,
          scheduledAt,
        );
      }

      // Skip if no date is available for this account
      if (!baseDate) {
        console.warn(
          `[ScheduleSection] No base date found for account ${accountId}, skipping recurrence calculation`,
        );
        return;
      }

      // For weekly recurrence, skip if no days are selected
      if (recurrenceType === 'weekly' && (!recurrenceDays || recurrenceDays.length === 0)) {
        return;
      }

      const dates: Date[] = [];
      const interval = Math.max(1, recurrenceInterval || 1);
      // Parse end date in UTC without timezone conversion
      const endDate = recurrenceEndDate ? parseUTCDate(recurrenceEndDate) : null;
      // For comparison, we only care about the date (not time)
      // Get the end date as YYYY-MM-DD in UTC for comparison
      const endDateString = endDate ? formatUTCDate(endDate) : null;
      const maxCount = 5;
      let currentDate: Date;

      try {
        // Handle different date formats - ALWAYS parse in UTC
        if (typeof baseDate === 'string') {
          // If it's an ISO string with time, parse it as UTC
          currentDate = new Date(baseDate);
        } else {
          // At this point, baseDate must be a Date since it's not undefined and not a string
          currentDate = baseDate as Date;
        }

        // Validate the parsed date
        if (isNaN(currentDate.getTime())) {
          return;
        }
      } catch (error) {
        return;
      }

      // Convert recurrenceDays to numbers for comparison
      const recurrenceDaysNumbers = recurrenceDays
        ? recurrenceDays.map((d) => (typeof d === 'string' ? parseInt(d) : d))
        : [];

      // Calculate the FIRST recurrence date after the base date
      // IMPORTANT: If base date's day is in the selected days, use it as first recurrence
      // Otherwise, find the next selected day
      switch (recurrenceType) {
        case 'daily':
          currentDate = addDaysUTC(currentDate, interval);
          break;
        case 'weekly':
          if (recurrenceDaysNumbers.length > 0) {
            const currentDay = currentDate.getUTCDay();
            const sortedDays = [...recurrenceDaysNumbers].sort((a, b) => a - b);

            // Check if current day is one of the selected days
            if (sortedDays.includes(currentDay)) {
              // Current day IS selected, so use it as the first recurrence
              // Don't add any days - the loop will use this date
            } else {
              // Current day is NOT selected, find the next selected day
              let nextDayMatch = null;

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
                currentDate = addDaysUTC(currentDate, daysToAdd);
              } else {
                // No day found in current week, go to next cycle
                const firstDayOfCycle = sortedDays[0] as number;
                // Calculate days until next week's first selected day
                const daysUntilNextWeek = 7 - currentDay; // Days until next Sunday (day 0)
                const daysToAdd = daysUntilNextWeek + firstDayOfCycle + (interval - 1) * 7;

                currentDate = addDaysUTC(currentDate, daysToAdd);
              }
            }
          } else {
            currentDate = addWeeksUTC(currentDate, interval);
          }
          break;
        case 'monthly':
          currentDate = addMonthsUTC(currentDate, interval);
          break;
        case 'yearly':
          currentDate = addYearsUTC(currentDate, interval);
          break;
        default:
          currentDate = addDaysUTC(currentDate, 1);
      }

      // Now currentDate is the FIRST recurrence date
      // The loop will add this date and then calculate subsequent dates

      // Calculate recurring dates (show preview even without end date)
      let iterations = 0;

      while (dates.length < maxCount && iterations < 50) {
        iterations++;

        // Check if current date exceeds end date BEFORE adding it
        // Compare only the date part (YYYY-MM-DD) in UTC, ignoring time
        if (endDateString) {
          const currentDateString = formatUTCDate(currentDate);

          if (currentDateString > endDateString) {
            break;
          }
        }

        // Add the current date to the array
        dates.push(new Date(currentDate));

        if (dates.length >= maxCount) break;

        // Calculate next date
        switch (recurrenceType) {
          case 'daily':
            currentDate = addDaysUTC(currentDate, interval);
            break;
          case 'weekly':
            if (recurrenceDaysNumbers.length > 0) {
              const currentDay = currentDate.getUTCDay();
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
                currentDate = addDaysUTC(currentDate, nextDayMatch - currentDay);
              } else {
                // No day found in current week, go to next cycle
                // Find the first selected day and add the interval weeks
                const firstDayOfCycle = sortedDays[0] as number;
                const daysUntilNextWeek = 7 - currentDay; // Days until Sunday (day 0)
                const daysToAdd = daysUntilNextWeek + firstDayOfCycle + (interval - 1) * 7;
                currentDate = addDaysUTC(currentDate, daysToAdd);
              }
            } else {
              currentDate = addWeeksUTC(currentDate, interval);
            }
            break;
          case 'monthly':
            currentDate = addMonthsUTC(currentDate, interval);
            break;
          case 'yearly':
            currentDate = addYearsUTC(currentDate, interval);
            break;
          default:
            currentDate = addDaysUTC(currentDate, 1);
        }
      }

      result[accountId] = dates;
    });

    return result;
  }, [
    isRecurring,
    allAvailableAccounts,
    accountSchedules,
    scheduledAt,
    recurrenceType,
    recurrenceInterval,
    recurrenceDays,
    recurrenceEndDate,
    recurrenceAccounts,
    useGlobalSchedule,
    existingScheduledPosts,
    socialPostLogs,
  ]);

  return (
    <div className="space-y-4">
      {/* <div className="flex items-center justify-between">
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
                  onClearAccountSchedules?.();
                } else {
                  // Si se desactiva, limpiar la fecha global
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
      </div> */}

      <RecurrenceSection
        t={t}
        i18n={i18n}
        disabled={disabled}
        hasRecurrenceAccess={hasRecurrenceAccess}
        isRecurring={isRecurring}
        recurrenceType={recurrenceType}
        recurrenceInterval={recurrenceInterval}
        recurrenceDays={recurrenceDays}
        recurrenceEndDate={recurrenceEndDate}
        recurrenceAccounts={recurrenceAccounts}
        onRecurrenceChange={onRecurrenceChange}
        recurrenceDaysError={recurrenceDaysError}
        allAvailableAccounts={allAvailableAccounts}
        socialAccounts={socialAccounts}
        selectedAccounts={selectedAccounts}
        nextDatesByAccount={nextDatesByAccount}
        hasAnyDates={hasAnyDates}
        daysOfWeek={daysOfWeek}
      />
    </div>
  );
};
export default ScheduleSection;
