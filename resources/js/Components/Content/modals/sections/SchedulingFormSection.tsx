import ScheduleSection from '@/Components/Content/modals/common/ScheduleSection';
import type { TFunction, i18n } from 'i18next';
import { SectionHeader } from '../common/SectionHeader';

interface SchedulingFormSectionProps {
  t: TFunction;
  i18n: i18n;
  scheduledAt?: string;
  useGlobalSchedule: boolean;
  isRecurring: boolean;
  recurrenceType: string;
  recurrenceInterval: number;
  recurrenceDays: number[];
  recurrenceEndDate?: string;
  recurrenceAccounts: number[];
  publishDate?: string;
  selectedAccounts: number[];
  socialAccounts: any[];
  accountSchedules: Record<number, string>;
  existingScheduledPosts?: any[];
  socialPostLogs?: any[];
  errors: {
    scheduledAt?: string;
    recurrenceDays?: string;
  };
  disabled: boolean;
  allowConfiguration: boolean;
  isContentSectionDisabled: boolean;
  hasRecurrenceAccess: boolean;
  onScheduleChange: (date: string | null) => void;
  onGlobalScheduleToggle: (value: boolean) => void;
  onClearAccountSchedules: () => void;
  onRecurrenceChange: (data: any) => void;
}

export const SchedulingFormSection = ({
  t,
  i18n,
  scheduledAt,
  useGlobalSchedule,
  isRecurring,
  recurrenceType,
  recurrenceInterval,
  recurrenceDays,
  recurrenceEndDate,
  recurrenceAccounts,
  publishDate,
  selectedAccounts,
  socialAccounts,
  accountSchedules,
  existingScheduledPosts,
  socialPostLogs,
  errors,
  disabled,
  allowConfiguration,
  isContentSectionDisabled,
  hasRecurrenceAccess,
  onScheduleChange,
  onGlobalScheduleToggle,
  onClearAccountSchedules,
  onRecurrenceChange,
}: SchedulingFormSectionProps) => {
  return (
    <div
      className={`space-y-4 transition-opacity duration-200 ${!allowConfiguration || isContentSectionDisabled ? 'pointer-events-none opacity-50 grayscale-[0.5]' : ''}`}
    >
      <SectionHeader title={t('publications.modal.edit.scheduleSection') || 'Programación'} />

      <ScheduleSection
        scheduledAt={scheduledAt}
        t={t}
        onScheduleChange={onScheduleChange}
        useGlobalSchedule={useGlobalSchedule}
        onGlobalScheduleToggle={onGlobalScheduleToggle}
        onClearAccountSchedules={onClearAccountSchedules}
        error={errors.scheduledAt}
        disabled={disabled}
        hasRecurrenceAccess={hasRecurrenceAccess}
        recurrenceDaysError={errors.recurrenceDays}
        isRecurring={isRecurring}
        recurrenceType={recurrenceType as any}
        recurrenceInterval={recurrenceInterval}
        recurrenceDays={recurrenceDays}
        recurrenceEndDate={recurrenceEndDate}
        recurrenceAccounts={recurrenceAccounts}
        onRecurrenceChange={onRecurrenceChange}
        i18n={i18n}
        publishDate={publishDate}
        selectedAccounts={selectedAccounts}
        socialAccounts={socialAccounts}
        accountSchedules={accountSchedules}
        existingScheduledPosts={existingScheduledPosts}
        socialPostLogs={socialPostLogs}
      />
    </div>
  );
};
