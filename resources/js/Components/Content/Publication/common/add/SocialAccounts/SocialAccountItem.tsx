import Button from '@/Components/common/Modern/Button';
import Switch from '@/Components/common/Modern/Switch';
import YouTubeThumbnailUploader from '@/Components/common/ui/YouTubeThumbnailUploader';
import { formatDateTimeStyled } from '@/Utils/dateHelpers';
import { validateVideoDuration } from '@/Utils/validationUtils';
import { AlertTriangle, Check, ChevronDown, Clock, Info, X } from 'lucide-react';
import React, { memo } from 'react';
import { isPlatformCompatible } from './helpers';
import ScheduleButton from './ScheduleButton';
import type { SocialAccountItemProps } from './types';

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
    isTokenInvalid = false,
    isTokenExpiringSoon = false,
  }: SocialAccountItemProps) => {
    const isPlatformIncompatible = !isPlatformCompatible(account.platform, contentType);
    const isInternalDisabled =
      isPublished ||
      isPublishing ||
      isUnpublishing ||
      disabled ||
      isPlatformIncompatible ||
      isTokenInvalid;
    const isCheckedActually = isChecked || isPublished || isPublishing || isUnpublishing;

    const complianceInfo = React.useMemo(() => {
      const videos = mediaFiles.filter((m) => m.type === 'video');
      if (videos.length === 0 || !isCheckedActually) return null;

      const results = videos
        .map((v) => {
          if (!v.tempId) return null;
          const metadata = videoMetadata[v.tempId];
          if (!metadata || metadata.duration === undefined) return null;
          const platformKey = account.platform?.toLowerCase();
          return validateVideoDuration(platformKey, metadata.duration);
        })
        .filter((r): r is NonNullable<typeof r> => r !== null);

      if (results.length === 0) return null;

      const first = results[0]!;
      const allValid = results.every((r) => r.isValid);
      return {
        allValid,
        formattedMax: first.formattedMax,
      };
    }, [mediaFiles, videoMetadata, account.platform, isCheckedActually]);

    return (
      <>
        <div
          className={`relative flex min-h-[80px] items-start rounded-lg border-2 p-3 transition-all ${
            isInternalDisabled ? 'cursor-default opacity-80' : 'cursor-pointer'
          } ${
            isFailed || durationError
              ? 'border-red-500 bg-red-50 shadow-md dark:border-red-600 dark:bg-red-900/30'
              : isUnpublishing
                ? 'border-amber-500 bg-amber-50 shadow-md dark:border-amber-600 dark:bg-amber-900/30'
                : isCheckedActually
                  ? `border-primary-500 bg-primary-100 shadow-lg ring-2 ring-primary-200 dark:border-primary-400 dark:bg-primary-900/40 dark:ring-primary-800`
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-neutral-600 dark:bg-neutral-800/30 dark:hover:border-neutral-500 dark:hover:bg-neutral-700/20'
          }`}
          data-platform={account.platform}
          onClick={() => {
            if (!isInternalDisabled) onToggle();
          }}
        >
          <div className="flex flex-1 items-center gap-3">
            <div className="relative shrink-0">
              <Switch
                isSelected={!!isCheckedActually}
                onChange={() => {
                  if (!isInternalDisabled) onToggle();
                }}
                isDisabled={isInternalDisabled}
                size="sm"
                containerClassName="shrink-0"
              />
              {isCheckedActually && !isInternalDisabled && (
                <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary-500 shadow-md dark:bg-primary-400">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{account.platform}</span>
                {isPlatformIncompatible && (
                  <div className="group relative">
                    <Info className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
                    <div className="pointer-events-none absolute bottom-full left-0 z-50 mb-2 hidden group-hover:block">
                      <div className="whitespace-nowrap rounded-lg border border-gray-700 bg-gray-900 px-3 py-1.5 text-xs text-white shadow-lg dark:bg-neutral-800">
                        {`${account.platform} doesn't support ${contentType} content type`}
                        <div className="absolute left-4 top-full -mt-px">
                          <div className="border-4 border-transparent border-t-gray-900 dark:border-t-neutral-800"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {/* Token health badges */}
                {isTokenInvalid && (
                  <span className="flex items-center gap-1 rounded-full bg-red-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-red-700 dark:bg-red-900/40 dark:text-red-300">
                    <AlertTriangle className="h-2.5 w-2.5" />
                    Token inválido
                  </span>
                )}
                {!isTokenInvalid && isTokenExpiringSoon && (
                  <span className="flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                    <Clock className="h-2.5 w-2.5" />
                    Token por vencer
                  </span>
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
                      variant="primary"
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
                    <div className="flex flex-col gap-1.5">
                      <div className="rounded border border-red-200 bg-red-50 px-2 py-1 text-[10px] text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                        {errorMessage}
                      </div>
                      {/* Botón de reconexión si el error es de OAuth 1.0a */}
                      {(errorMessage.includes('OAuth 1.0a') ||
                        errorMessage.includes('credenciales')) &&
                        account.platform === 'twitter' && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                const response = await fetch(`/social-accounts/auth-url/twitter`);
                                const data = await response.json();
                                if (data.success && data.url) {
                                  window.location.href = data.url;
                                }
                              } catch (error) {
                                console.error('Error al obtener URL de reconexión:', error);
                              }
                            }}
                            className="flex items-center justify-center gap-1 rounded border border-blue-300 bg-blue-50 px-2 py-1 text-[10px] font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
                          >
                            <svg
                              className="h-3 w-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              />
                            </svg>
                            Reconectar cuenta ahora
                          </button>
                        )}
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
                    {...(mediaFiles.find((m) => m.type === 'video')?.url
                      ? {
                          videoPreviewUrl: mediaFiles.find((m) => m.type === 'video')!
                            .url as string,
                        }
                      : {})}
                    {...(() => {
                      const fn = publication?.media_files?.find(
                        (m) => m.file_type === 'video' || m.mime_type?.startsWith('video/'),
                      )?.file_name;
                      return fn ? { videoFileName: fn } : {};
                    })()}
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

export default SocialAccountItem;
