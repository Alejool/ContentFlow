import Button from '@/Components/common/Modern/Button';
import DatePickerModern from '@/Components/common/Modern/DatePicker';
import Switch from '@/Components/common/Modern/Switch';
import YouTubeThumbnailUploader from '@/Components/common/ui/YouTubeThumbnailUploader';
import { CONTENT_TYPE_CONFIG, ContentType } from '@/Constants/contentTypes';
import { formatDateTimeStyled } from '@/Utils/dateHelpers';
import { validateVideoDuration } from '@/Utils/validationUtils';
import { parseISO } from 'date-fns';
import { AlertTriangle, Check, ChevronDown, Clock, Info, Target, X } from 'lucide-react';
import React, { memo, useMemo, useState } from 'react';

/**
 * Check if a platform is compatible with the selected content type
 */
function isPlatformCompatible(platform: string, contentType?: ContentType): boolean {
  if (!contentType) return true;
  const rules = CONTENT_TYPE_CONFIG[contentType];
  return (rules.platforms as readonly string[]).includes(platform.toLowerCase());
}

interface SocialAccount {
  id: number;
  platform: string;
  name: string;
  account_name?: string;
  isDisconnected?: boolean;
}

interface SocialPostLog {
  id: number;
  social_account_id: number;
  status: string;
  platform: string;
  account_name?: string;
}

interface VideoMetadata {
  duration?: number;
  [key: string]: unknown;
}

interface MediaFile {
  id?: number;
  type?: string;
  url?: string;
  thumbnailUrl?: string;
  tempId?: string;
  mime_type?: string;
  file_type?: string;
  file_name?: string;
  [key: string]: unknown;
}

interface SocialAccountsSectionProps {
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
  error?: string;
  durationErrors?: Record<number, string>;
  videoMetadata?: Record<string, VideoMetadata>;
  mediaFiles?: MediaFile[];
  disabled?: boolean;
  socialPostLogs?: SocialPostLog[];
  contentType?: 'post' | 'reel' | 'story' | 'poll' | 'carousel';
  onThumbnailChange?: (videoId: number, file: File | null) => void;
  onThumbnailDelete?: (videoId: number) => void;
  thumbnails?: Record<string, { file?: File; url?: string }>;
  publication?: { media_files?: { file_type?: string; mime_type?: string; file_name?: string }[] };
}

const SchedulePopoverContent = memo(
  ({
    account,
    customSchedule,
    onScheduleChange,
    onScheduleRemove,
    onClose,
  }: {
    account: SocialAccount;
    customSchedule?: string;
    onScheduleChange: (date: string) => void;
    onScheduleRemove: () => void;
    onClose: () => void;
  }) => {
    return (
      <>
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Schedule for {account.platform}
          </h4>
          <Button
            variant="ghost"
            size="xs"
            buttonStyle="icon"
            onClick={onClose}
            icon={X}
            className="!p-1"
          >
            {''}
          </Button>
        </div>

        <DatePickerModern
          selected={customSchedule ? parseISO(customSchedule) : null}
          onChange={(date: Date | null) => {
            if (date) {
              onScheduleChange(date.toISOString());
            } else {
              // Clearing the date removes the per-account override → falls back to global schedule
              onScheduleRemove();
            }
          }}
          onCalendarOpen={() => {
            // Si no hay fecha personalizada, establecer una por defecto al abrir el calendario
            if (!customSchedule) {
              const defaultDate = new Date();
              defaultDate.setMinutes(defaultDate.getMinutes() + 2);
              onScheduleChange(defaultDate.toISOString());
            }
          }}
          showTimeSelect
          placeholder="Select date & time"
          dateFormat="dd/MM/yyyy HH:mm"
          minDate={new Date()}
          withPortal
          popperPlacement="bottom-start"
          isClearable
        />

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="primary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </>
    );
  },
);

const ScheduleButton = memo(
  ({
    account,
    customSchedule,
    activePopover,
    onScheduleClick,
    onScheduleChange,
    onScheduleRemove,
    onPopoverClose,
  }: {
    account: SocialAccount;
    customSchedule?: string;
    activePopover: number | null;
    onScheduleClick: (e: React.MouseEvent) => void;
    onScheduleChange: (date: string) => void;
    onScheduleRemove: () => void;
    onPopoverClose: () => void;
  }) => {
    return (
      <div className="relative ml-2" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onScheduleClick}
          className={`rounded-full p-1.5 hover:bg-black/5 dark:hover:bg-white/10 ${
            customSchedule ? 'text-primary-500' : 'text-gray-500 dark:text-gray-400'
          }`}
          title="Set individual time"
        >
          <Clock className="h-4 w-4" />
        </button>

        {activePopover === account.id && (
          <div className="animate-in fade-in zoom-in-95 absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-gray-200 bg-white p-4 shadow-xl dark:border-neutral-600 dark:bg-neutral-800">
            <SchedulePopoverContent
              account={account}
              customSchedule={customSchedule}
              onScheduleChange={onScheduleChange}
              onScheduleRemove={onScheduleRemove}
              onClose={onPopoverClose}
            />
          </div>
        )}
      </div>
    );
  },
);

interface SocialAccountItemProps {
  account: SocialAccount;
  isChecked: boolean;
  customSchedule?: string;
  activePopover: number | null;
  onToggle: () => void;
  onScheduleClick: () => void;
  onScheduleChange: (date: string) => void;
  onScheduleRemove: () => void;
  onPlatformSettingsClick: () => void;
  onPopoverClose: () => void;
  t: (key: string) => string;
  globalSchedule?: string;
  isPublished?: boolean;
  isPublishing?: boolean;
  isFailed?: boolean;
  isUnpublishing?: boolean;
  onCancel?: () => void;
  disabled?: boolean;
  durationError?: string;
  videoMetadata?: Record<string, VideoMetadata>;
  mediaFiles?: MediaFile[];
  errorMessage?: string;
  contentType?: ContentType;
  onThumbnailChange?: (videoId: number, file: File | null) => void;
  onThumbnailDelete?: (videoId: number) => void;
  thumbnails?: Record<string, { file?: File; url?: string }>;
  publication?: { media_files?: { file_type?: string; mime_type?: string; file_name?: string }[] };
  isYouTubeThumbnailExpanded?: boolean;
  setIsYouTubeThumbnailExpanded?: (expanded: boolean) => void;
}

const SocialAccountItem = memo(
  ({
    account,
    isChecked,
    customSchedule,
    activePopover,
    onToggle,
    onScheduleClick,
    onScheduleChange,
    onScheduleRemove,
    onPlatformSettingsClick,
    onPopoverClose,
    t,
    globalSchedule,
    isPublished,
    isPublishing,
    isFailed,
    isUnpublishing,
    onCancel,
    disabled = false,
    durationError,
    videoMetadata = {},
    mediaFiles = [],
    errorMessage,
    onThumbnailChange,
    onThumbnailDelete,
    thumbnails,
    publication,
    isYouTubeThumbnailExpanded = true,
    setIsYouTubeThumbnailExpanded,
    contentType,
  }: SocialAccountItemProps) => {
    const isPlatformIncompatible = !isPlatformCompatible(account.platform, contentType);
    const isInternalDisabled =
      isPublished || isPublishing || isUnpublishing || disabled || isPlatformIncompatible;
    const isCheckedActually = isChecked || isPublished || isPublishing || isUnpublishing;

    const complianceInfo = React.useMemo(() => {
      const videos = mediaFiles.filter((m) => m.type === 'video');
      if (videos.length === 0 || !isCheckedActually) return null;

      const results = videos
        .map((v) => {
          const metadata = videoMetadata[v.tempId];
          if (!metadata) return null;
          const platformKey = account.platform?.toLowerCase();
          return validateVideoDuration(platformKey, metadata.duration);
        })
        .filter((r): r is NonNullable<typeof r> => r !== null);

      if (results.length === 0) return null;

      const allValid = results.every((r) => r.isValid);
      return {
        allValid,
        formattedMax: results[0].formattedMax,
      };
    }, [mediaFiles, videoMetadata, account.platform, isCheckedActually]);

    return (
      <>
        <div
          className={`relative flex min-h-[80px] items-start rounded-lg border p-3 transition-all ${
            isInternalDisabled ? 'cursor-default opacity-80' : ''
          } ${
            isFailed || durationError
              ? 'border-red-500 bg-red-50 shadow-sm dark:bg-red-900/20'
              : isUnpublishing
                ? 'border-amber-500 bg-amber-50 shadow-sm dark:bg-amber-900/20'
                : isCheckedActually
                  ? `border-primary-500 bg-primary-50 shadow-sm dark:bg-primary-900/20`
                  : 'border-gray-200 hover:bg-gray-50 dark:border-neutral-600 dark:hover:bg-neutral-700/5'
          }`}
          data-platform={account.platform}
        >
          <div className="flex flex-1 items-center gap-3">
            <Switch
              isSelected={!!isCheckedActually}
              onChange={() => {
                if (!isInternalDisabled) onToggle();
              }}
              isDisabled={isInternalDisabled}
              size="xs"
              containerClassName="shrink-0"
            />

            <div className="flex flex-1 flex-col">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{account.platform}</span>
                {isPlatformIncompatible && (
                  <div className="group relative">
                    <Info className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
                    <div className="pointer-events-none absolute bottom-full left-0 z-50 mb-2 hidden group-hover:block">
                      <div className="whitespace-nowrap rounded-lg border border-gray-700 bg-gray-900 px-3 py-1.5 text-xs text-white shadow-lg dark:bg-neutral-800">
                        {`This platform doesn't support ${contentType} content`}
                        <div className="absolute left-4 top-full -mt-px">
                          <div className="border-4 border-transparent border-t-gray-900 dark:border-t-neutral-800"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {account.isDisconnected && (
                  <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                    {t('common.disconnected') || 'Desconectada'}
                  </span>
                )}
                {isCheckedActually && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                      isPublished
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                        : isPublishing
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'
                          : (customSchedule || globalSchedule) && !isPublished && !isPublishing
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                            : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                    }`}
                  >
                    {isPublished
                      ? t('publications.modal.publish.published')
                      : isPublishing
                        ? t('publications.modal.publish.publishing')
                        : isFailed
                          ? t('publications.modal.publish.failed') || 'Fallido'
                          : isUnpublishing
                            ? t('publications.modal.publish.unpublishing') || 'Despublicando...'
                            : (customSchedule || globalSchedule) && !isPublished && !isPublishing
                              ? t('publications.status.scheduled') || 'Programado'
                              : t('publications.status.instant') || 'Instantáneo'}
                  </span>
                )}
              </div>
              {(account.account_name || account.name) && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  @{account.account_name || account.name}
                </span>
              )}
              {isChecked && (customSchedule || globalSchedule) && !isPublished && !isPublishing && (
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={`flex items-center gap-1 text-xs ${
                      customSchedule
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    <Clock className="h-3 w-3" />
                    {formatDateTimeStyled(customSchedule || globalSchedule || '', 'short', 'short')}
                    {!customSchedule && globalSchedule && (
                      <span className="text-[10px] opacity-70">(Global)</span>
                    )}
                  </span>
                  {customSchedule && (
                    <Button
                      variant="ghost"
                      size="xs"
                      buttonStyle="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onScheduleRemove();
                      }}
                      icon={X}
                      className="!p-1 text-primary-500 hover:text-primary-600"
                      title={t('common.remove') || 'Eliminar programación'}
                    >
                      {''}
                    </Button>
                  )}
                </div>
              )}
              {!customSchedule && !globalSchedule && !isPublished && !isPublishing && isChecked && (
                <div className="animate-in fade-in slide-in-from-top-1 flex items-center gap-1 text-[10px] font-medium text-primary-500">
                  <Clock className="h-3 w-3" />
                  {t('publications.modal.schedule.instantWarning') ||
                    'Para publicar inmediatamente, configura la fecha desde el modal de programación.'}
                </div>
              )}
              {isPublished && (
                <div className="mt-1 flex items-center gap-1 text-[10px] font-medium text-green-600 dark:text-green-400">
                  <Check className="h-3 w-3" />
                  {t('publications.modal.publish.published')}
                </div>
              )}
              {isPublishing && (
                <div className="mt-1 flex items-center justify-between gap-1 text-[10px] font-medium text-yellow-600 dark:text-yellow-400">
                  <div className="flex items-center gap-1">
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-yellow-600 border-t-transparent" />
                    {t('publications.modal.publish.publishing')} en {account.platform}
                  </div>
                  {onCancel && (
                    <Button
                      variant="danger"
                      size="xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCancel();
                      }}
                      className="uppercase"
                    >
                      {t('common.cancel') || 'Cancelar'}
                    </Button>
                  )}
                </div>
              )}
              {isUnpublishing && (
                <div className="mt-1 flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
                  {t('publications.modal.publish.unpublishing') || 'Despublicando...'}
                </div>
              )}
              {isFailed && (
                <div className="mt-1 flex flex-col gap-1">
                  <div className="flex items-center gap-1 text-[10px] font-medium text-red-600 dark:text-red-400">
                    <div className="flex h-3 w-3 items-center justify-center rounded-full bg-red-500">
                      <X className="h-2 w-2 text-white" />
                    </div>
                    {t('publications.modal.publish.failed') || 'Fallido'}
                  </div>
                  {errorMessage && (
                    <div className="rounded border border-red-200 bg-red-50 px-2 py-1 text-[10px] text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                      {errorMessage}
                    </div>
                  )}
                </div>
              )}
              {durationError && (
                <div className="animate-in slide-in-from-top-1 mt-1 flex items-center gap-1 text-[10px] font-medium text-red-600 dark:text-red-400">
                  <AlertTriangle className="h-3 w-3" />
                  {durationError}
                </div>
              )}
            </div>
          </div>

          <div className="ml-auto flex items-start gap-2 pl-2">
            {isCheckedActually && !isInternalDisabled && (
              <ScheduleButton
                account={account}
                customSchedule={customSchedule}
                activePopover={activePopover}
                onScheduleClick={(e) => {
                  e.stopPropagation();
                  onScheduleClick();
                }}
                onScheduleChange={onScheduleChange}
                onScheduleRemove={onScheduleRemove}
                onPopoverClose={onPopoverClose}
              />
            )}
          </div>
        </div>

        {/* YouTube Thumbnail Section - Fuera del card, justo debajo */}
        {isCheckedActually &&
          account.platform.toLowerCase() === 'youtube' &&
          mediaFiles &&
          mediaFiles.some((m) => m.type === 'video') &&
          onThumbnailChange &&
          onThumbnailDelete && (
            <div className="">
              <button
                type="button"
                onClick={() =>
                  setIsYouTubeThumbnailExpanded &&
                  setIsYouTubeThumbnailExpanded(!isYouTubeThumbnailExpanded)
                }
                className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:text-primary-600 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-gray-300 dark:hover:text-primary-400"
              >
                <span>YouTube Thumbnail</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${isYouTubeThumbnailExpanded ? 'rotate-180' : ''}`}
                />
              </button>

              {isYouTubeThumbnailExpanded && (
                <div className="animate-in fade-in slide-in-from-top-2 rounded-lg border border-gray-200 bg-white p-4 duration-200 dark:border-neutral-700 dark:bg-neutral-900">
                  <YouTubeThumbnailUploader
                    videoId={mediaFiles.find((m) => m.type === 'video')?.id || 0}
                    videoPreviewUrl={mediaFiles.find((m) => m.type === 'video')?.url}
                    videoFileName={
                      publication?.media_files?.find(
                        (m) => m.file_type === 'video' || m.mime_type?.startsWith('video/'),
                      )?.file_name
                    }
                    existingThumbnail={(() => {
                      const video = mediaFiles.find((m) => m.type === 'video');
                      return video?.thumbnailUrl
                        ? { url: video.thumbnailUrl, id: video.id || 0 }
                        : null;
                    })()}
                    onThumbnailChange={(videoId: number, file: File | null) => {
                      onThumbnailChange(videoId, file);
                    }}
                    onThumbnailDelete={(videoId: number) => {
                      onThumbnailDelete(videoId);
                    }}
                  />
                </div>
              )}
            </div>
          )}
      </>
    );
  },
);

const SocialAccountsSection = memo(
  ({
    socialAccounts,
    selectedAccounts,
    accountSchedules,
    t,
    onAccountToggle,
    onScheduleChange,
    onScheduleRemove,
    onPlatformSettingsClick,
    globalSchedule,
    publishedAccountIds,
    publishingAccountIds,
    failedAccountIds,
    unpublishing,
    onCancel,
    error,
    durationErrors = {},
    videoMetadata = {},
    mediaFiles = [],
    disabled = false,
    socialPostLogs = [],
    contentType,
    onThumbnailChange,
    onThumbnailDelete,
    thumbnails,
    publication,
  }: SocialAccountsSectionProps) => {
    const [activePopover, setActivePopover] = useState<number | null>(null);
    const [isYouTubeThumbnailExpanded, setIsYouTubeThumbnailExpanded] = useState(true);

    // Merge connected accounts with disconnected accounts from social_post_logs
    const allAccounts = useMemo(() => {
      const connectedAccounts = [...socialAccounts];
      const connectedAccountIds = new Set(socialAccounts.map((acc) => acc.id));

      // Find published accounts that are no longer connected
      const disconnectedPublishedAccounts = socialPostLogs
        .filter(
          (log) =>
            (log.status === 'published' ||
              log.status === 'publishing' ||
              log.status === 'failed') &&
            !connectedAccountIds.has(log.social_account_id),
        )
        .map((log) => ({
          id: log.social_account_id,
          platform: log.platform,
          name: log.account_name || 'Unknown',
          account_name: log.account_name,
          isDisconnected: true,
        }));

      // Remove duplicates from disconnected accounts
      const uniqueDisconnected = disconnectedPublishedAccounts.filter(
        (acc, index, self) => index === self.findIndex((a) => a.id === acc.id),
      );

      return [...connectedAccounts, ...uniqueDisconnected];
    }, [socialAccounts, socialPostLogs]);

    return (
      <div className="space-y-4">
        {/* Banner informativo si ya está publicada en algunas cuentas */}
        {publishedAccountIds && publishedAccountIds.length > 0 && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
            <div className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
              <div className="flex-1">
                <h4 className="text-xs font-bold text-blue-800 dark:text-blue-200">
                  {t('publications.modal.publish.alreadyPublishedBanner.title') ||
                    'Publicación Activa'}
                </h4>
                <p className="mt-0.5 text-[11px] text-blue-700 dark:text-blue-300">
                  {t('publications.modal.publish.alreadyPublishedBanner.message') ||
                    'Esta publicación ya está publicada en las siguientes cuentas:'}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {allAccounts
                    .filter((acc) => publishedAccountIds.includes(acc.id))
                    .map((acc) => (
                      <span
                        key={acc.id}
                        className="inline-flex items-center gap-1 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                      >
                        <span className="capitalize">{acc.platform}</span>
                        <span className="opacity-75">@{acc.account_name || acc.name}</span>
                        {acc.isDisconnected && (
                          <span className="ml-1 rounded bg-amber-200 px-1 py-0.5 text-[9px] font-bold text-amber-800 dark:bg-amber-800 dark:text-amber-200">
                            {t('common.disconnected') || 'Desconectada'}
                          </span>
                        )}
                      </span>
                    ))}
                </div>
                <p className="mt-1.5 text-[11px] font-medium text-blue-600 dark:text-blue-400">
                  {t('publications.modal.publish.alreadyPublishedBanner.hint') ||
                    'Puedes publicar en cuentas adicionales seleccionándolas a continuación.'}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 font-semibold">
            <Target className="h-4 w-4" />
            {t('manageContent.configureNetworks') || 'Configura tus redes sociales'}
          </label>
        </div>

        <div className="flex flex-col gap-2">
          {allAccounts.map((account) => {
            const isChecked = selectedAccounts.includes(account.id);
            const customSchedule = accountSchedules[account.id];
            const isPublished = publishedAccountIds?.includes(account.id);
            const isPublishing = publishingAccountIds?.includes(account.id);
            const isFailed = failedAccountIds?.includes(account.id);
            const isIndividualUnpublishing = unpublishing === account.id;

            // Get error message from social post logs
            const errorMessage = socialPostLogs?.find(
              (log) => log.social_account_id === account.id && log.status === 'failed',
            )?.error_message;

            return (
              <SocialAccountItem
                key={account.id}
                account={account}
                isChecked={isChecked}
                customSchedule={customSchedule}
                activePopover={activePopover}
                onToggle={() => onAccountToggle(account.id)}
                t={t}
                onScheduleClick={() =>
                  setActivePopover(activePopover === account.id ? null : account.id)
                }
                onScheduleChange={(date) => onScheduleChange(account.id, date)}
                onScheduleRemove={() => onScheduleRemove(account.id)}
                onPlatformSettingsClick={() => onPlatformSettingsClick(account.platform)}
                onPopoverClose={() => setActivePopover(null)}
                globalSchedule={globalSchedule}
                isPublished={isPublished}
                isPublishing={isPublishing}
                isFailed={isFailed}
                isUnpublishing={isIndividualUnpublishing}
                onCancel={onCancel}
                disabled={disabled || account.isDisconnected}
                durationError={durationErrors[account.id]}
                videoMetadata={videoMetadata}
                mediaFiles={mediaFiles}
                errorMessage={errorMessage}
                onThumbnailChange={onThumbnailChange}
                onThumbnailDelete={onThumbnailDelete}
                thumbnails={thumbnails}
                publication={publication}
                isYouTubeThumbnailExpanded={isYouTubeThumbnailExpanded}
                setIsYouTubeThumbnailExpanded={setIsYouTubeThumbnailExpanded}
                contentType={contentType}
              />
            );
          })}
        </div>
      </div>
    );
  },
);

export default SocialAccountsSection;
