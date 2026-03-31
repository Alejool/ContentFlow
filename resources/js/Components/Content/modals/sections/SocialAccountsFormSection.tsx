import SocialAccountsSection from '@/Components/Content/Publication/common/add/SocialAccountsSection';
import type { TFunction } from 'i18next';
import { SectionHeader } from '../common/SectionHeader';

interface SocialAccountsFormSectionProps {
  t: TFunction;
  socialAccounts: any[];
  selectedAccounts: number[];
  accountSchedules: Record<number, string>;
  globalSchedule?: string;
  publishedAccountIds: number[];
  publishingAccountIds: number[];
  failedAccountIds: number[];
  error?: string;
  durationErrors: Record<number, string>;
  videoMetadata: Record<string, any>;
  mediaFiles: any[];
  thumbnails: Record<string, File>;
  socialPostLogs?: any[];
  publication?: any;
  disabled: boolean;
  allowConfiguration: boolean;
  isContentSectionDisabled: boolean;
  onAccountToggle: (accountId: number) => void;
  onScheduleChange: (accountId: number, date: string | null) => void;
  onScheduleRemove: (accountId: number) => void;
  onPlatformSettingsClick: (platform: string) => void;
  onCancel: (accountId: number) => void;
  onThumbnailChange: (videoId: string, file: File | null) => void;
  onThumbnailDelete: (videoId: string) => void;
}

export const SocialAccountsFormSection = ({
  t,
  socialAccounts,
  selectedAccounts,
  accountSchedules,
  globalSchedule,
  publishedAccountIds,
  publishingAccountIds,
  failedAccountIds,
  error,
  durationErrors,
  videoMetadata,
  mediaFiles,
  thumbnails,
  socialPostLogs,
  publication,
  disabled,
  allowConfiguration,
  isContentSectionDisabled,
  onAccountToggle,
  onScheduleChange,
  onScheduleRemove,
  onPlatformSettingsClick,
  onCancel,
  onThumbnailChange,
  onThumbnailDelete,
}: SocialAccountsFormSectionProps) => {
  return (
    <div
      className={`space-y-4 transition-opacity duration-200 ${!allowConfiguration || isContentSectionDisabled ? 'pointer-events-none opacity-50 grayscale-[0.5]' : ''}`}
    >
      <SectionHeader
        title={t('publications.modal.edit.socialAccountsSection') || 'Redes Sociales'}
      />

      <SocialAccountsSection
        socialAccounts={socialAccounts as any}
        selectedAccounts={selectedAccounts}
        accountSchedules={accountSchedules}
        t={t}
        onAccountToggle={onAccountToggle}
        onScheduleChange={onScheduleChange}
        onScheduleRemove={onScheduleRemove}
        onPlatformSettingsClick={onPlatformSettingsClick}
        globalSchedule={globalSchedule}
        publishedAccountIds={publishedAccountIds}
        publishingAccountIds={publishingAccountIds}
        failedAccountIds={failedAccountIds}
        onCancel={onCancel}
        error={error}
        durationErrors={durationErrors}
        videoMetadata={videoMetadata}
        mediaFiles={mediaFiles}
        disabled={disabled}
        socialPostLogs={socialPostLogs}
        onThumbnailChange={onThumbnailChange}
        onThumbnailDelete={onThumbnailDelete}
        thumbnails={thumbnails}
        publication={publication}
      />
    </div>
  );
};
