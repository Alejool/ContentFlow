import { Avatar } from '@/Components/common/Avatar';
import Button from '@/Components/common/Modern/Button';
import SimpleContentTypeBadge from '@/Components/Content/common/SimpleContentTypeBadge';
import PublicationThumbnailCard from '@/Components/Content/Publication/PublicationThumbnailCard';
import SocialAccountsDisplay from '@/Components/Content/Publication/SocialAccountsDisplay';
import { usePublicationActions } from '@/Hooks/publication/usePublicationActions';
import { usePublicationStore } from '@/stores/publicationStore';
import type { Publication } from '@/types/Publication';
import {
  countMediaFiles,
  getLockedByName,
  getMediaUrl,
  hasMedia,
  isVideoMedia,
} from '@/Utils/publicationHelpers';
import {
  Calendar,
  Clock,
  Copy,
  Edit,
  Eye,
  Image,
  Lock,
  Rocket,
  Send,
  Trash2,
  Video,
} from 'lucide-react';
import React, { memo, useMemo } from 'react';
import toast from 'react-hot-toast';

// ... (skipping interface to save tokens if possible, or just targeting the specific blocks)

// Actually I need to split this into two chunks if possible or one large replacement if they are close.
// Imports are lines 4-13.
// Lock indicator is lines 124-131.
// Edit button is lines 287-323.
// I'll use multi_replace.

interface PublicationRowProps {
  item: Publication;
  t: (key: string) => string;
  connectedAccounts: { id: number; platform: string; [key: string]: unknown }[];
  getStatusColor: (status?: string) => string;
  onEdit: (item: Publication) => void;
  onDelete: (id: number) => void;
  onPublish: (item: Publication) => void;
  onEditRequest?: (item: Publication) => void;
  onViewDetails?: (item: Publication) => void;
  onDuplicate?: (id: number) => void;
  remoteLock?: {
    user_id: number;
    user_name: string;
    expires_at: string;
  } | null;
  permissions?: string[];
  onPreviewMedia?: (
    media: {
      url: string;
      type: 'image' | 'video';
      title?: string;
    }[],
    initialIndex?: number,
  ) => void;
}

const PublicationRow = memo(function PublicationRow({
  item,
  t,
  connectedAccounts,
  getStatusColor,
  onEdit,
  onDelete,
  onPublish,
  onEditRequest,
  onViewDetails,
  onDuplicate,
  remoteLock,
  permissions,
  onPreviewMedia,
}: PublicationRowProps) {
  const {
    loadingStates,
    canManageContent,
    shouldShowSendToReview,
    shouldShowPublish,
    handleSubmitForApproval,
    handlePublish,
    handleDuplicate,
    handleViewDetails,
    handleDelete,
  } = usePublicationActions({
    onEdit,
    onDelete,
    onPublish,
    ...(onViewDetails && { onViewDetails }),
    ...(onDuplicate && { onDuplicate }),
    ...(onEditRequest && { onEditRequest }),
    ...(permissions && { permissions }),
  });

  const publishingPlatforms = useMemo(() => {
    return usePublicationStore.getState().getPublishingPlatforms(item.id);
  }, [item.id]);

  const mediaCount = React.useMemo(() => {
    return countMediaFiles(item);
  }, [item]);

  const lockedByName = getLockedByName(remoteLock || undefined);
  const isLoading = loadingStates[item.id];
  const itemHasMedia = hasMedia(item);
  const isVideo = isVideoMedia(item);
  const mediaUrl = getMediaUrl(item);

  return (
    <>
      <td className="text-center"></td>
      <td>
        <div className="flex items-center gap-4">
          <PublicationThumbnailCard
            publication={item}
            {...(mediaUrl && { mediaUrl })}
            isVideo={isVideo}
            mediaCount={mediaCount.total}
            size="md"
            {...(onPreviewMedia && { onPreviewMedia })}
            {...(onViewDetails && { onViewDetails: () => handleViewDetails(item) })}
            className="relative z-10"
          />
          <div className="min-w-0 max-w-md">
            <h3
              className="truncate text-sm font-medium text-gray-900 dark:text-white"
              title={item.title || 'Untitled'}
            >
              {item.title || 'Untitled'}
            </h3>

            {/* Content Type Badge */}
            <div className="mt-1">
              <SimpleContentTypeBadge
                contentType={item.content_type ?? 'post'}
                {...(item.media_files && { mediaFiles: item.media_files })}
                size="sm"
              />
            </div>

            <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
              {item.description || t('publications.table.noDescription')}
            </p>
            {item.platform_settings &&
              typeof item.platform_settings === 'object' &&
              !Array.isArray(item.platform_settings) &&
              Object.keys(item.platform_settings).length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {Object.entries(item.platform_settings)
                    .slice(0, 2)
                    .map(([platform, settings]: [string, unknown]) => {
                      const typedSettings = settings as { type?: string } | undefined;
                      if (!typedSettings || !typedSettings.type) return null;

                      const typeLabel =
                        typedSettings.type === 'poll'
                          ? 'Poll'
                          : typedSettings.type === 'thread'
                            ? 'Thread'
                            : typedSettings.type === 'reel'
                              ? 'Reel'
                              : typedSettings.type === 'short'
                                ? 'Short'
                                : 'Post';
                      const colorClass =
                        platform === 'twitter'
                          ? 'bg-sky-50 text-sky-800 dark:bg-sky-900/20 dark:text-sky-400'
                          : platform === 'youtube'
                            ? 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            : 'bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';

                      return (
                        <span
                          key={platform}
                          className={`inline-flex items-center rounded border border-gray-100 px-1.5 py-0.5 text-[10px] font-medium dark:border-white/5 ${colorClass}`}
                        >
                          {platform.slice(0, 2).toUpperCase()}: {typeLabel}
                        </span>
                      );
                    })}
                  {Object.keys(item.platform_settings).length > 2 && (
                    <span className="inline-flex items-center rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:border-white/5 dark:bg-white/10 dark:text-gray-300">
                      +{Object.keys(item.platform_settings).length - 2}
                    </span>
                  )}
                </div>
              )}
            {remoteLock && item.status !== 'pending_review' && (
              <div className="animate-in fade-in slide-in-from-top-1 mt-2 flex w-fit items-center gap-2 rounded-lg border border-amber-100 bg-amber-50 p-1.5 dark:border-amber-800/30 dark:bg-amber-900/20">
                <div className="relative flex h-4 w-4 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-800 dark:text-amber-400">
                  <Lock className="h-2.5 w-2.5" />
                  <span className="absolute -right-0.5 -top-0.5 flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-tight text-amber-700 dark:text-amber-400">
                  {t('publications.table.editingBy')} {lockedByName}
                </span>
              </div>
            )}
            {item.status === 'pending_review' && (
              <div className="animate-in fade-in slide-in-from-top-1 mt-2 flex w-fit items-center gap-2 rounded-lg border border-yellow-100 bg-yellow-50 p-1.5 dark:border-yellow-800/30 dark:bg-yellow-900/20">
                <div className="relative flex h-4 w-4 items-center justify-center rounded-full bg-yellow-100 text-yellow-600 dark:bg-yellow-800 dark:text-yellow-400">
                  <Clock className="h-2.5 w-2.5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-tight text-yellow-700 dark:text-yellow-400">
                    {t('publications.table.pendingAdminReview') || 'Pendiente de revisión'}
                  </span>
                  {item.current_approval_step?.name && (
                    <span className="text-[9px] text-yellow-600 dark:text-yellow-500">
                      {t('approvals.approver_role')}: {item.current_approval_step.name}
                    </span>
                  )}
                </div>
              </div>
            )}
            {item.status === 'publishing' && item.publisher && (
              <div className="mt-1 flex items-center gap-1.5">
                <span className="h-2 w-2 flex-shrink-0 animate-pulse rounded-full bg-emerald-500"></span>
                <span className="text-[10px] font-bold uppercase tracking-tight text-emerald-600 dark:text-emerald-400">
                  {(() => {
                    const publishingAccounts = connectedAccounts.filter((acc) =>
                      publishingPlatforms.includes(acc.id),
                    );
                    if (publishingAccounts.length === 1 && publishingAccounts[0]) {
                      const platformName =
                        publishingAccounts[0].platform.charAt(0).toUpperCase() +
                        publishingAccounts[0].platform.slice(1);
                      return `Publicando en ${platformName} por ${item.publisher.name}`;
                    } else if (publishingAccounts.length > 1) {
                      return `Publicando en ${publishingAccounts.length} redes por ${item.publisher.name}`;
                    }
                    return (
                      (t('publications.table.publishingBy') || 'Publicando por') +
                      ' ' +
                      item.publisher.name
                    );
                  })()}
                </span>
              </div>
            )}
            {item.status === 'rejected' && item.rejector && (
              <div className="mt-1 flex items-center gap-1.5">
                <span className="h-2 w-2 flex-shrink-0 rounded-full bg-rose-500"></span>
                <span className="text-[10px] font-bold uppercase tracking-tight text-rose-600 dark:text-rose-400">
                  {t('publications.table.rejectedBy') || 'Rejected by'} {item.rejector.name}
                </span>
              </div>
            )}
            {((item as Publication & { type?: string }).type === 'user_event' ||
              item.scheduled_at) && (
              <div className="mt-1 flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3 w-3 text-primary-500" />
                  <span className="text-[10px] font-bold uppercase tracking-tight text-primary-500">
                    {(item as Publication & { type?: string }).type === 'user_event'
                      ? t('publications.table.manualEvent')
                      : t('publications.table.socialNetworkEvent')}
                  </span>
                </div>
                {(item as Publication & { type?: string }).type === 'user_event' && item.user && (
                  <span className="ml-4 text-[9px] font-medium italic text-gray-500 dark:text-gray-400">
                    {t('publications.table.createdBy')}: {item.user.name}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        {item.user && (
          <div className="flex items-center">
            <Avatar
              src={item.user.photo_url}
              name={item.user.name}
              size="md"
              className="flex-shrink-0"
            />
            <div className="ml-3 hidden xl:block">
              <p className="max-w-[100px] truncate text-sm font-medium text-gray-900 dark:text-white">
                {item.user.name}
              </p>
            </div>
          </div>
        )}
      </td>
      <td className="px-6 py-4">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${getStatusColor(
            item.status,
          )}`}
        >
          {t(`publications.status.${item.status || 'draft'}`)}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          {mediaCount.images > 0 && (
            <span className="flex items-center rounded border border-gray-100 bg-gray-50 px-1.5 py-0.5 text-[10px] dark:border-white/5 dark:bg-white/5">
              <Image className="mr-1 h-3 w-3 text-blue-500" /> {mediaCount.images}
            </span>
          )}
          {mediaCount.videos > 0 && (
            <span className="flex items-center rounded border border-gray-100 bg-gray-50 px-1.5 py-0.5 text-[10px] dark:border-white/5 dark:bg-white/5">
              <Video className="mr-1 h-3 w-3 text-purple-500" /> {mediaCount.videos}
            </span>
          )}
          {mediaCount.total === 0 && (
            <span className="text-[10px] text-gray-400">
              {t('publications.table.noMedia') || 'Sin multimedia'}
            </span>
          )}
        </div>
      </td>
      <td className="max-w-[120px] px-6 py-4">
        {item.campaigns && item.campaigns.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            <span className="rounded border border-indigo-100 bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700 dark:border-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400">
              {item.campaigns.length} {item.campaigns.length === 1 ? 'Campaign' : 'Campaigns'}
            </span>
          </div>
        ) : (
          <span className="text-[10px] italic text-gray-400">{t('common.none') || 'Ninguna'}</span>
        )}
      </td>
      <td className="max-w-[180px] px-6 py-4">
        <SocialAccountsDisplay
          publication={item}
          connectedAccounts={connectedAccounts}
          publishingPlatforms={publishingPlatforms}
          compact={true}
        />
      </td>
      <td className="px-2 py-4 text-right">
        <div className="flex items-center justify-end gap-1">
          {/* Lógica de botones basada en permisos y roles */}
          {canManageContent && (
            <>
              {shouldShowPublish(item) ? (
                <Button
                  onClick={async (e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation();
                    await handlePublish(item);
                  }}
                  disabled={isLoading?.publishing || isLoading?.editing || isLoading?.deleting}
                  {...(isLoading?.publishing !== undefined && { loading: isLoading.publishing })}
                  variant="success"
                  buttonStyle="icon"
                  size="sm"
                  icon={Rocket}
                >
                  <span className="sr-only">{t('publications.button.publish')}</span>
                </Button>
              ) : shouldShowSendToReview(item) ? (
                <Button
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation();
                    handleSubmitForApproval(item);
                  }}
                  disabled={isLoading?.submitting}
                  {...(isLoading?.submitting !== undefined && { loading: isLoading.submitting })}
                  variant="primary"
                  buttonStyle="icon"
                  size="sm"
                  icon={Send}
                >
                  <span className="sr-only">{t('publications.button.sendForReview')}</span>
                </Button>
              ) : item.status === 'pending_review' ? (
                <Button disabled variant="warning" buttonStyle="icon" size="sm" icon={Clock}>
                  <span className="sr-only">{t('publications.button.inReview')}</span>
                </Button>
              ) : null}
            </>
          )}

          {/* View Details button */}
          {(!canManageContent || item.status === 'published') && (
            <Button
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation();
                handleViewDetails(item);
              }}
              variant="ghost"
              buttonStyle="icon"
              size="sm"
              icon={Eye}
            >
              <span className="sr-only">{t('publications.button.view')}</span>
            </Button>
          )}

          {/* Edit button */}
          {canManageContent && (
            <Button
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation();
                if (remoteLock) {
                  toast.error(
                    `${t('publications.table.lockedBy') || 'Editando por'} ${lockedByName}`,
                  );
                  return;
                }
                if (onEditRequest) {
                  onEditRequest(item);
                } else {
                  onEdit(item);
                }
              }}
              disabled={
                isLoading?.publishing || isLoading?.editing || isLoading?.deleting || !!remoteLock
              }
              {...(isLoading?.editing !== undefined && { loading: isLoading.editing })}
              variant={item.status === 'published' ? 'warning' : 'primary'}
              buttonStyle="icon"
              size="sm"
              icon={remoteLock ? Lock : Edit}
            >
              <span className="sr-only">{t('common.edit')}</span>
            </Button>
          )}

          {/* Duplicate button */}
          {canManageContent && onDuplicate && (
            <Button
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation();
                handleDuplicate(item.id);
              }}
              disabled={isLoading?.publishing || isLoading?.editing || isLoading?.deleting}
              {...(isLoading?.duplicating !== undefined && { loading: isLoading.duplicating })}
              variant="secondary"
              buttonStyle="icon"
              size="sm"
              icon={Copy}
            >
              <span className="sr-only">{t('publications.button.duplicate')}</span>
            </Button>
          )}

          {/* Delete button */}
          {canManageContent && (
            <Button
              onClick={async (e: React.MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation();
                const isUserEvent = (item as Publication & { type?: string }).type === 'user_event';
                await handleDelete(item, isUserEvent);
              }}
              disabled={isLoading?.publishing || isLoading?.editing || isLoading?.deleting}
              {...(isLoading?.deleting !== undefined && { loading: isLoading.deleting })}
              variant="danger"
              buttonStyle="icon"
              size="sm"
              icon={Trash2}
            >
              <span className="sr-only">{t('common.delete')}</span>
            </Button>
          )}
        </div>
      </td>
    </>
  );
});

export default PublicationRow;
