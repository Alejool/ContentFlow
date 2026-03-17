import { getPlatformConfig } from '@/Constants/socialPlatforms';
import { queryKeys } from '@/lib/queryKeys';
import { formatDateTimeStyled } from '@/Utils/dateHelpers';
import { validateVideoDuration } from '@/Utils/validationUtils';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Check,
  CheckCircle,
  Clock,
  Loader2,
  RefreshCw,
  X,
  XCircle,
} from 'lucide-react';
import { memo } from 'react';
import toast from 'react-hot-toast';

interface PlatformCardProps {
  account: any;
  publication: any;
  isSelected: boolean;
  isPublished: boolean;
  isFailed: boolean;
  isRemovedPlatform: boolean;
  isDuplicate: boolean;
  isPublishing: boolean;
  isScheduled: boolean;
  isUnpublishing: boolean;
  platformRetryInfo: any;
  onToggle: () => void;
  onCancelPlatform: (publicationId: number, accountId: number) => Promise<void>;
  onUnpublish: (accountId: number, platform: string) => void;
  confirm: (options: any) => Promise<boolean>;
  t: (key: string, params?: any) => string;
  RecurringPostsSection?: React.ComponentType<any>;
  getRecurringPosts?: (pubId: number, accId: number) => any[];
  getPublishedRecurringPosts?: (pubId: number, accId: number) => any[];
  // Capabilities props
  canPublish?: boolean;
  capabilityErrors?: string[];
  capabilityWarnings?: string[];
  upgradeMessage?: string | null;
  capabilityMetadata?: any;
}

const PlatformCard = memo(
  ({
    account,
    publication,
    isSelected,
    isPublished,
    isFailed,
    isRemovedPlatform,
    isDuplicate,
    isPublishing,
    isScheduled,
    isUnpublishing,
    platformRetryInfo,
    onToggle,
    onCancelPlatform,
    onUnpublish,
    confirm,
    t,
    RecurringPostsSection,
    getRecurringPosts,
    getPublishedRecurringPosts,
    canPublish = true,
    capabilityErrors = [],
    capabilityWarnings = [],
    upgradeMessage = null,
    capabilityMetadata,
  }: PlatformCardProps) => {
    const iconSrc = getPlatformConfig(account.platform).logo;
    const isRetrying = platformRetryInfo?.is_retrying || false;
    const retryStatus = platformRetryInfo?.retry_status || null;
    const isDuplicateAttempt = platformRetryInfo?.is_duplicate || false;
    const originalAttemptAt = platformRetryInfo?.original_attempt_at;

    const queryClient = useQueryClient();

    // Check if this is a Twitter account with video content but missing OAuth 1.0a credentials
    const isTwitter = ['twitter', 'x'].includes(account.platform?.toLowerCase());
    const hasVideo = publication?.media_files?.some(
      (m: any) => m.file_type === 'video' || m.mime_type?.startsWith('video/'),
    );
    const hasOAuth1 = account.account_metadata?.oauth1_token && account.account_metadata?.secret;
    const needsOAuth1Reconnection = isTwitter && hasVideo && !hasOAuth1;

    const canToggle =
      !isPublished &&
      !isScheduled &&
      !isPublishing &&
      !isRetrying &&
      !isDuplicate &&
      !isDuplicateAttempt &&
      !needsOAuth1Reconnection &&
      canPublish; // Add capability check

    const handleReconnect = async (e: React.MouseEvent) => {
      e.stopPropagation();

      // Show toast message
      const toastId = toast.loading(
        t('publications.modal.publish.reconnecting') || 'Iniciando reconexión...',
      );

      try {
        // Get auth URL for the platform
        const response = await fetch(`/social-accounts/auth-url/${account.platform}`, {
          headers: {
            'X-CSRF-TOKEN':
              document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
            Accept: 'application/json',
          },
        });

        const data = await response.json();

        if (data.url) {
          toast.success(
            t('publications.modal.publish.reconnect_window') || 'Abriendo ventana de reconexión...',
            { id: toastId },
          );

          // Open OAuth window
          const width = 600;
          const height = 700;
          const left = window.screen.width / 2 - width / 2;
          const top = window.screen.height / 2 - height / 2;

          const authWindow = window.open(
            data.url,
            'oauth',
            `width=${width},height=${height},left=${left},top=${top}`,
          );

          // Listen for successful reconnection
          const handleAuthMessage = (event: MessageEvent) => {
            if (event.data?.type === 'social_auth_callback' && event.data.success) {
              toast.success(
                t('publications.modal.publish.reconnect_success') ||
                  'Cuenta reconectada exitosamente',
                { id: toastId },
              );

              // Invalidate social accounts cache to refresh the data
              queryClient.invalidateQueries({ queryKey: queryKeys.socialAccounts.all });

              // Clean up listener
              window.removeEventListener('message', handleAuthMessage);
            }
          };

          window.addEventListener('message', handleAuthMessage);

          // Clean up listener after 5 minutes (timeout)
          setTimeout(
            () => {
              window.removeEventListener('message', handleAuthMessage);
            },
            5 * 60 * 1000,
          );
        } else {
          toast.error(
            t('publications.modal.publish.reconnect_error') || 'Error al iniciar reconexión',
            { id: toastId },
          );
        }
      } catch (error) {
        toast.error(
          t('publications.modal.publish.reconnect_error') || 'Error al iniciar reconexión',
          { id: toastId },
        );
      }
    };

    return (
      <div className="relative w-full">
        <div
          onClick={() => {
            if (canToggle) {
              onToggle();
            }
          }}
          className={`relative flex h-[110px] w-full flex-col gap-3 rounded-lg border-2 p-4 transition-all ${
            canToggle ? 'cursor-pointer' : 'cursor-not-allowed'
          } ${
            !canPublish && !isPublished && !isScheduled
              ? 'border-red-300 bg-red-50/50 opacity-75 dark:border-red-700 dark:bg-red-900/20'
              : isDuplicate || isDuplicateAttempt
                ? 'border-orange-500 bg-orange-50 shadow-md dark:border-orange-600 dark:bg-orange-900/30'
                : isPublishing || isRetrying
                  ? 'border-yellow-500 bg-yellow-50 shadow-md dark:border-yellow-600 dark:bg-yellow-900/30'
                  : isPublished
                    ? 'border-green-500 bg-green-50 shadow-md dark:border-green-600 dark:bg-green-900/30'
                    : isScheduled
                      ? 'border-blue-500 bg-blue-50 shadow-md dark:border-blue-600 dark:bg-blue-900/30'
                      : isFailed
                        ? 'border-red-500 bg-red-50 shadow-md dark:border-red-600 dark:bg-red-900/30'
                        : isRemovedPlatform
                          ? 'border-gray-500 bg-gray-50 shadow-md dark:border-gray-600 dark:bg-gray-900/30'
                          : isSelected
                            ? 'border-primary-600 bg-primary-100 shadow-lg ring-4 ring-primary-300/60 dark:border-primary-400 dark:bg-primary-900/50 dark:ring-primary-600/50'
                            : 'border-gray-300 bg-white hover:border-primary-400 hover:shadow-md dark:border-neutral-700 dark:bg-neutral-900/30 dark:hover:border-primary-500'
          }`}
        >
          {/* Publishing Overlay */}
          {(isPublishing || isRetrying) && !isFailed && (
            <div className="animate-in fade-in absolute inset-0 z-30 flex flex-col items-center justify-center rounded-full bg-white/95 backdrop-blur-sm duration-300 dark:bg-neutral-900/95">
              <div className="flex flex-col items-center gap-2">
                <div className="relative flex-shrink-0">
                  <div className="h-10 w-10 rounded-full border border-yellow-200 dark:border-yellow-900" />
                  <div className="absolute inset-0 h-10 w-10 animate-spin rounded-full border border-yellow-500 border-t-transparent" />
                </div>

                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-sm font-bold capitalize tracking-wide text-yellow-800 dark:text-yellow-300">
                    {account.platform}
                  </span>
                  <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">
                    {isRetrying && retryStatus
                      ? `${t('publications.status.retrying') || 'Reintentando'} ${retryStatus}`
                      : publication?.status === 'retrying'
                        ? t('publications.status.retrying') || 'Reintentando'
                        : t('publications.modal.publish.publishing')}
                  </span>
                </div>
              </div>

              {/* Cancel button for individual platform */}
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  if (!publication) return;

                  const confirmed = await confirm({
                    title:
                      t('publications.modal.cancel_platform.title', {
                        platform: account.platform,
                      }) || `¿Cancelar ${account.platform}?`,
                    message:
                      t('publications.modal.cancel_platform.message', {
                        platform: account.platform,
                      }) ||
                      `¿Estás seguro de que deseas cancelar la publicación en ${account.platform}? Se detendrán todos los reintentos para esta plataforma.`,
                    confirmText: t('publications.modal.cancel_platform.confirm') || 'Sí, cancelar',
                    cancelText: t('publications.modal.cancel_platform.cancel') || 'No',
                    type: 'warning',
                  });

                  if (confirmed) {
                    await onCancelPlatform(publication.id, account.id);
                  }
                }}
                className="mt-3 rounded-lg border border-yellow-300 bg-white px-3 py-1.5 text-xs font-medium text-yellow-700 transition-colors hover:bg-yellow-50 hover:text-yellow-900 dark:border-yellow-700 dark:bg-neutral-800 dark:text-yellow-400 dark:hover:bg-neutral-700 dark:hover:text-yellow-200"
              >
                {t('common.cancel') || 'Cancelar'}
              </button>
            </div>
          )}

          {/* Failed Overlay */}
          {isFailed && !isPublished && !isScheduled && (
            <div className="animate-in fade-in absolute inset-0 z-30 flex flex-col items-center justify-center rounded-lg bg-red-50/95 backdrop-blur-sm duration-300 dark:bg-red-900/30">
              <div className="flex flex-col items-center gap-2">
                <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-sm font-bold capitalize tracking-wide text-red-800 dark:text-red-300">
                    {account.platform}
                  </span>
                  <span className="text-xs font-medium text-red-600 dark:text-red-400">
                    {t('publications.modal.publish.failed') || 'Falló'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Unpublishing Overlay */}
          {isUnpublishing && (
            <div className="animate-in fade-in absolute inset-0 z-30 flex flex-col items-center justify-center rounded-lg bg-white/95 backdrop-blur-sm duration-300 dark:bg-neutral-900/95">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-10 w-10 animate-spin text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                  {t('publications.modal.publish.unpublishing') || 'Despublicando...'}
                </span>
              </div>
            </div>
          )}

          {/* Duplicate Attempt Overlay */}
          {/* {(isDuplicate || isDuplicateAttempt) && !isPublished && !isScheduled && (
            <div className="animate-in fade-in absolute inset-0 z-30 flex flex-col items-center justify-center rounded-lg bg-orange-50/95 backdrop-blur-sm duration-300 dark:bg-orange-900/30">
              <div className="flex flex-col items-center gap-2">
                <div className="relative flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/50">
                    <svg
                      className="h-6 w-6 text-orange-600 dark:text-orange-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )} */}

          {/* OAuth 1.0a Missing Overlay for Twitter Video */}
          {needsOAuth1Reconnection && !isPublishing && !isUnpublishing && (
            <div className="animate-in fade-in absolute inset-0 z-30 flex flex-col items-center justify-center rounded-lg bg-amber-50/95 backdrop-blur-sm duration-300 dark:bg-amber-900/30">
              <div className="flex flex-col items-center gap-2 px-3">
                <AlertTriangle className="h-7 w-7 text-amber-600 dark:text-amber-400" />
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-xs font-bold capitalize tracking-wide text-amber-800 dark:text-amber-300">
                    {account.platform}
                  </span>
                  <span className="text-center text-xs font-medium text-amber-700 dark:text-amber-400">
                    {t('publications.modal.publish.oauth1_required') || 'Requiere reconexión'}
                  </span>
                  <span className="mt-1 text-center text-[10px] leading-tight text-amber-600 dark:text-amber-500">
                    {t('publications.modal.publish.oauth1_video_message') ||
                      'Esta cuenta necesita credenciales OAuth 1.0a para subir videos'}
                  </span>
                </div>

                {/* <button
                  onClick={handleReconnect}
                  className="pointer-events-auto mt-2 flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  {t('publications.modal.publish.reconnect_account') || 'Reconectar cuenta'}
                </button> */}
              </div>
            </div>
          )}

          {/* Capability Error Overlay - Platform cannot publish this content */}
          {!canPublish &&
            !isPublishing &&
            !isUnpublishing &&
            !isPublished &&
            !isScheduled &&
            capabilityErrors.length > 0 && (
              <div className="animate-in fade-in absolute inset-0 z-30 flex flex-col items-center justify-center rounded-lg bg-red-50/95 backdrop-blur-sm duration-300 dark:bg-red-900/30">
                <div className="flex flex-col items-center gap-2 px-3">
                  <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-sm font-bold capitalize tracking-wide text-red-800 dark:text-red-300">
                      {account.platform}
                    </span>
                    <span className="text-center text-xs font-medium text-red-700 dark:text-red-400">
                      {t('publications.modal.publish.cannot_publish') || 'No se puede publicar'}
                    </span>
                    <div className="mt-2 max-w-[200px] space-y-1">
                      {capabilityErrors.map((error, idx) => (
                        <div
                          key={idx}
                          className="text-center text-[10px] leading-tight text-red-600 dark:text-red-500"
                        >
                          • {error}
                        </div>
                      ))}
                    </div>
                    {upgradeMessage && (
                      <div className="mt-2 rounded-lg border border-red-200 bg-red-100 px-2 py-1 text-center text-[10px] font-medium text-red-700 dark:border-red-800 dark:bg-red-900/40 dark:text-red-400">
                        💡 {upgradeMessage}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          {/* Published Overlay */}
          {isPublished &&
            !isUnpublishing &&
            (() => {
              const postLog = publication.social_post_logs?.find(
                (log: any) => log.social_account_id === account.id && log.status === 'published',
              );
              const postUrl = postLog?.post_url;

              return (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-lg bg-green-50/80 backdrop-blur-[2px] dark:bg-green-900/30">
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-sm font-bold capitalize tracking-wide text-green-800 dark:text-green-300">
                        {account.platform}
                      </span>
                      <span className="text-xs font-medium text-green-600 dark:text-green-400">
                        {t('publications.modal.publish.published')}
                      </span>
                    </div>

                    {postUrl && (
                      <a
                        href={postUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="pointer-events-auto mt-2 flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
                      >
                        <svg
                          className="h-3.5 w-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                        {t('publications.modal.publish.viewPost') || 'Ver publicación'}
                      </a>
                    )}
                  </div>
                </div>
              );
            })()}

          {/* Video Duration Warning */}
          {!isPublishing &&
            !isUnpublishing &&
            !isPublished &&
            (() => {
              const mediaFiles = publication.media_files || [];
              const video = mediaFiles.find(
                (m: any) => m.file_type === 'video' || m.mime_type?.startsWith('video/'),
              );
              if (!video) return null;

              const duration = video.metadata?.duration || 0;
              const validation = validateVideoDuration(account.platform, duration);

              if (validation.maxDuration === Infinity || validation.isValid) return null;

              return (
                <div className="absolute left-2 top-2 z-10 flex animate-pulse items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600 shadow-sm dark:border-red-800/30 dark:bg-red-900/30 dark:text-red-400">
                  <XCircle className="h-3 w-3" />
                  <span className="leading-none">MAX {validation.formattedMax}</span>
                </div>
              );
            })()}

          {/* Capability Warnings Badge */}
          {/* {canPublish && capabilityWarnings.length > 0 && !isPublishing && !isUnpublishing && !isPublished && (
            <div className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-600 shadow-sm dark:border-amber-800/30 dark:bg-amber-900/30 dark:text-amber-400"
                 title={capabilityWarnings.join(', ')}>
              <AlertTriangle className="h-3 w-3" />
              <span className="leading-none">{capabilityWarnings.length} {t('common.warning', 'Advertencia')}</span>
            </div>
          )} */}

          {/* Platform Logo and Info */}
          <div className="z-10 flex items-center gap-3">
            <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg p-1">
              <img src={iconSrc} alt={account.platform} className="h-full w-full object-contain" />
              {/* Check badge for selected platforms */}
              {isSelected && !isPublished && !isScheduled && !isPublishing && (
                <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-lg bg-primary-600 shadow-lg ring-2 ring-white dark:bg-primary-500 dark:ring-neutral-900">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <div className="flex items-center gap-2">
                <div className="truncate text-base font-bold capitalize text-gray-900 dark:text-white">
                  {account.platform}
                </div>
                {/* Selected badge */}
                {isSelected && !isPublished && !isScheduled && !isPublishing && (
                  <span className="flex-shrink-0 rounded-lg bg-primary-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white shadow-sm dark:bg-primary-500">
                    {t('common.selected') || 'Seleccionado'}
                  </span>
                )}
              </div>
              <div className="truncate text-xs text-gray-600 dark:text-gray-400">
                @{account.account_name}
              </div>
            </div>
          </div>

          {/* Connected By Info */}
          {account.user?.name && !isPublishing && !isUnpublishing && !isPublished && (
            <div className="z-10 truncate text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {t('manageContent.socialMedia.status.connectedBy') || 'Conectado por'}:{' '}
              {account.user.name}
            </div>
          )}
        </div>

        {/* Scheduled Badge - Outside the card */}
        {isScheduled && !isPublishing && !isUnpublishing && (
          <div className="absolute -top-3 right-2 z-40">
            <div className="flex flex-col items-end gap-1">
              <span className="flex items-center gap-1.5 rounded-lg border border-white bg-gradient-to-r from-blue-600 to-blue-700 px-3 py-1.5 text-xs font-bold text-white shadow-lg dark:border-neutral-800">
                <Clock className="h-3.5 w-3.5" />
                {t('publications.status.scheduled')?.toUpperCase() || 'PROGRAMADO'}
              </span>
              {(() => {
                const schedPost = publication.scheduled_posts?.find(
                  (sp: any) => sp.social_account_id === account.id,
                );
                return schedPost?.scheduled_at ? (
                  <span className="rounded-lg bg-white px-2 py-0.5 text-[10px] text-gray-600 shadow-sm dark:bg-neutral-800 dark:text-gray-400">
                    {formatDateTimeStyled(schedPost.scheduled_at, 'short', 'short')}
                  </span>
                ) : null;
              })()}
            </div>
          </div>
        )}

        {/* Removed Badge - Outside the card */}
        {isRemovedPlatform && !isPublishing && !isUnpublishing && !isPublished && (
          <div className="absolute -top-3 right-2 z-40">
            <span className="flex items-center gap-1.5 rounded-lg border border-white bg-gradient-to-r from-gray-600 to-gray-700 px-3 py-1.5 text-xs font-bold text-white shadow-lg dark:border-neutral-800">
              <XCircle className="h-3.5 w-3.5" />
              {t('publications.modal.publish.removed')?.toUpperCase() || 'Removido'}
            </span>
          </div>
        )}

        {/* Failed Badge - Discrete corner badge */}
        {isFailed &&
          !isScheduled &&
          !isPublished &&
          !isPublishing &&
          !isUnpublishing &&
          !isRetrying && (
            <div className="absolute left-2 top-2 z-10">
              <span className="flex items-center gap-1 rounded-lg border border-red-300 bg-red-100 px-2 py-1 text-[10px] font-bold text-red-700 shadow-sm dark:border-red-800 dark:bg-red-900/40 dark:text-red-400">
                <XCircle className="h-3 w-3" />
                {t('publications.modal.publish.failed') || 'Falló'}
              </span>
            </div>
          )}

        {/* Unpublish Button */}
        {isPublished && !isUnpublishing && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUnpublish(account.id, account.platform);
            }}
            disabled={isUnpublishing}
            className="absolute right-3 top-3 z-30 rounded-lg bg-red-500 p-2 text-white shadow-lg transition-colors hover:bg-red-600 disabled:opacity-50"
            title="Despublicar"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Recurring Posts Section */}
        {publication &&
          RecurringPostsSection &&
          getRecurringPosts &&
          getPublishedRecurringPosts && (
            <RecurringPostsSection
              publication={publication}
              accountId={account.id}
              getRecurringPosts={getRecurringPosts}
              getPublishedRecurringPosts={getPublishedRecurringPosts}
              t={t}
            />
          )}
      </div>
    );
  },
);

PlatformCard.displayName = 'PlatformCard';

export default PlatformCard;
