import type { SocialAccount as GlobalSocialAccount } from '@/types/SocialAccount';
import type { ContentType } from '@/Constants/contentTypes';

export interface SocialAccount extends Partial<GlobalSocialAccount> {
  id: number;
  platform: string;
  name?: string;
  account_name?: string;
  isDisconnected?: boolean;
}

export interface SocialPostLog {
  id: number;
  social_account_id: number;
  status: string;
  platform: string;
  account_name?: string;
  error_message?: string;
}

export interface VideoMetadata {
  duration?: number;
  [key: string]: unknown;
}

export interface MediaFile {
  id?: number;
  type?: string;
  url?: string;
  thumbnailUrl?: string;
  tempId?: string;
  mime_type?: string;
  file_type?: string;
  file_name?: string;
}

export interface SocialAccountsSectionProps {
  socialAccounts: SocialAccount[];
  selectedAccounts: number[];
  accountSchedules: Record<number, string>;
  t: (key: string) => string;
  onAccountToggle: (accountId: number) => void;
  onScheduleChange: (accountId: number, schedule: string) => void;
  onScheduleRemove: (accountId: number) => void;
  onPlatformSettingsClick: (platform: string) => void;
  globalSchedule?: string;
  publishedAccountIds?: number[];
  publishingAccountIds?: number[];
  failedAccountIds?: number[];
  unpublishing?: number | null;
  onCancel?: () => void;
  onCancelPlatform?: (platformId: number) => void;
  error?: string;
  durationErrors?: Record<number, string>;
  videoMetadata?: Record<string, VideoMetadata>;
  mediaFiles?: MediaFile[];
  disabled?: boolean;
  socialPostLogs?: SocialPostLog[];
  contentType?: ContentType;
  onThumbnailChange?: (videoId: number, file: File | null) => void;
  onThumbnailDelete?: (videoId: number) => void;
  thumbnails?: Record<string, { file?: File; url?: string }>;
  publication?: { media_files?: any[] } | undefined;
  invalidTokenAccountIds?: number[];
  expiringSoonAccountIds?: number[];
}

export interface SocialAccountItemProps {
  account: SocialAccount;
  isChecked: boolean;
  customSchedule?: string | undefined;
  activePopover: number | null;
  onToggle: () => void;
  onScheduleClick: () => void;
  onScheduleChange: (date: string) => void;
  onScheduleRemove: () => void;
  onPlatformSettingsClick: () => void;
  onPopoverClose: () => void;
  t: (key: string) => string;
  globalSchedule?: string | undefined;
  isPublished?: boolean | undefined;
  isPublishing?: boolean | undefined;
  isFailed?: boolean | undefined;
  isUnpublishing?: boolean | undefined;
  onCancel?: (() => void) | undefined;
  disabled?: boolean | undefined;
  durationError?: string | undefined;
  videoMetadata?: Record<string, VideoMetadata>;
  mediaFiles?: MediaFile[];
  errorMessage?: string | undefined;
  contentType?: ContentType | undefined;
  onThumbnailChange?: ((videoId: number, file: File | null) => void) | undefined;
  onThumbnailDelete?: ((videoId: number) => void) | undefined;
  thumbnails?: Record<string, { file?: File; url?: string }> | undefined;
  publication?: { media_files?: any[] } | undefined;
  isYouTubeThumbnailExpanded?: boolean | undefined;
  setIsYouTubeThumbnailExpanded?: ((expanded: boolean) => void) | undefined;
  isTokenInvalid?: boolean;
  isTokenExpiringSoon?: boolean;
}
