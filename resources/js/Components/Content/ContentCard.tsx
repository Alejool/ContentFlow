import Button from '@/Components/common/Modern/Button';
import SimpleContentTypeBadge from '@/Components/Content/common/SimpleContentTypeBadge';
import { usePublicationActions } from '@/Hooks/publication/usePublicationActions';
import { formatDateString } from '@/Utils/dateHelpers';
import {
  countMediaFiles,
  getLockedByFirstName,
  getLockedByName,
  getMediaUrl,
  getStatusColors,
  hasMedia,
  isProcessing,
  isVideoMedia,
  prepareMediaForPreview,
} from '@/Utils/publicationHelpers';
import {
  Calendar,
  CheckCircle,
  Clock,
  Copy,
  Edit,
  Eye,
  FileText,
  Image as ImageIcon,
  Loader2,
  Lock,
  Rocket,
  Send,
  Trash2,
  Users,
  Video,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ContentCardProps {
  item: any;
  onEdit: (item: any) => void;
  onDelete: (id: number) => void;
  onViewDetails?: (item: any) => void;
  onPublish?: (item: any) => void;
  onDuplicate?: (id: number) => void;
  type: 'publication' | 'campaign';
  permissions?: string[];
  remoteLock?: {
    user_id: number;
    user_name: string;
    expires_at: string;
  } | null;
  onPreviewMedia?: (
    media: {
      url: string;
      type: 'image' | 'video';
      title?: string;
    }[],
    initialIndex?: number,
  ) => void;
}

export default function ContentCard({
  item,
  onEdit,
  onDelete,
  onViewDetails,
  onPublish,
  onDuplicate,
  type,
  permissions,
  remoteLock,
  onPreviewMedia,
}: ContentCardProps) {
  const { t } = useTranslation();

  // Hook centralizado - SIN lógica en el componente
  const {
    loadingStates,
    canManageContent,
    shouldShowSendToReview,
    shouldShowPublish,
    handleSubmitForApproval,
    handlePublish,
    handleEdit,
    handleDelete,
    handleDuplicate,
    handleViewDetails,
  } = usePublicationActions({
    onEdit,
    onDelete,
    onPublish,
    onViewDetails,
    onDuplicate,
    permissions,
  });

  const [imageError, setImageError] = useState(false);

  // Early return after all hooks
  if (!item) {
    return null;
  }

  // Usar helpers centralizados - NO lógica
  const itemHasMedia = hasMedia(item);
  const isVideo = isVideoMedia(item);
  const itemIsProcessing = isProcessing(item);
  const mediaUrl = getMediaUrl(item);
  const statusColors = getStatusColors(item.status);
  const lockedByName = getLockedByName(remoteLock);
  const lockedByFirstName = getLockedByFirstName(remoteLock);
  const isLoading = loadingStates[item.id];
  const mediaCount = countMediaFiles(item);

  const StatusIcon =
    {
      published: CheckCircle,
      draft: Edit,
      scheduled: Calendar,
      failed: Clock,
      pending_review: Clock,
      approved: CheckCircle,
      rejected: Clock,
      publishing: Clock,
    }[item.status || 'draft'] || Edit;

  // Get platform icons for publication
  const getPlatformIcons = () => {
    if (!item.accounts || !Array.isArray(item.accounts)) return null;

    return (
      <div className="flex items-center gap-1">
        {item.accounts.slice(0, 3).map((account: any, index: number) => (
          <div
            key={index}
            className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700"
            title={account.provider}
          >
            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
              {account.provider?.charAt(0).toUpperCase()}
            </span>
          </div>
        ))}
        {item.accounts.length > 3 && (
          <span className="text-xs text-gray-500">+{item.accounts.length - 3}</span>
        )}
      </div>
    );
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // If user is selecting text, don't trigger click
    if (window.getSelection()?.toString()) return;

    // Trigger view details or edit - USA EL HANDLER DEL HOOK
    if (onViewDetails) {
      handleViewDetails(item);
    } else if (onEdit) {
      handleEdit(item, remoteLock);
    }
  };

  const handleMediaClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPreviewMedia && itemHasMedia && !itemIsProcessing) {
      const allMedia = prepareMediaForPreview(item);
      onPreviewMedia(allMedia, 0);
    }
  };

  return (
    <div
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
      onClick={handleCardClick}
    >
      {(itemHasMedia || itemIsProcessing) && (
        <div
          className="relative h-40 cursor-zoom-in overflow-hidden bg-gray-100 dark:bg-gray-700"
          onClick={handleMediaClick}
        >
          <div className="relative h-full w-full">
            {itemIsProcessing ? (
              <div className="flex h-full w-full animate-pulse flex-col items-center justify-center bg-gray-100 dark:bg-gray-800">
                <div className="mb-2 flex items-center justify-center rounded-full bg-blue-100 p-3 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  <Clock className="h-6 w-6 animate-spin" />
                </div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {t('common.processing')}...
                </span>
              </div>
            ) : !imageError && mediaUrl ? (
              <img
                src={mediaUrl}
                alt={item.title || 'Media'}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-200 dark:bg-gray-700">
                <div className="text-center">
                  <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gray-300 p-3 text-gray-500 dark:bg-gray-600">
                    {isVideo ? <Video className="h-6 w-6" /> : <ImageIcon className="h-6 w-6" />}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {isVideo ? t('common.videoTypes.video') : t('common.videoTypes.post')}
                  </span>
                </div>
              </div>
            )}
            {!itemIsProcessing && isVideo && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/10 transition-colors group-hover:bg-black/20">
                <div className="rounded-full bg-white/90 p-2.5 shadow-lg backdrop-blur-sm dark:bg-gray-900/90">
                  <Video className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                </div>
              </div>
            )}
          </div>
          <div className="absolute left-3 top-3 z-10 flex flex-col items-start gap-2">
            {/* Content Type Badge - Solo para publicaciones */}
            {type === 'publication' && !remoteLock && (
              <SimpleContentTypeBadge
                contentType={item.content_type}
                mediaFiles={item.media_files}
                size="md"
                className="border border-white/20 shadow-sm backdrop-blur-md"
              />
            )}
            {/* Content Type Badge cuando hay remoteLock - posición ajustada */}
            {type === 'publication' && remoteLock && (
              <div className="mt-12">
                <SimpleContentTypeBadge
                  contentType={item.content_type}
                  mediaFiles={item.media_files}
                  size="md"
                  className="border border-white/20 shadow-sm backdrop-blur-md"
                />
              </div>
            )}
          </div>
          <div className="absolute right-3 top-3 z-10 flex flex-col items-end gap-2">
            {/* Status Badge */}
            <span
              className={`flex items-center gap-1.5 rounded-full border border-white/20 px-2.5 py-1 text-xs font-medium shadow-sm backdrop-blur-md ${statusColors}`}
            >
              <StatusIcon className="h-3 w-3" />
              <span className="capitalize">
                {type === 'campaign'
                  ? t(`campaigns.filters.${item.status || 'active'}`)
                  : t(`publications.status.${item.status || 'draft'}`)}
              </span>
            </span>
          </div>
          {remoteLock && (
            <div className="absolute left-3 top-3 z-10">
              <span className="flex animate-pulse items-center gap-1.5 rounded-full border border-amber-200/50 bg-amber-100/90 px-2.5 py-1 text-xs font-bold text-amber-700 shadow-lg backdrop-blur-md dark:border-amber-700/50 dark:bg-amber-900/80 dark:text-amber-300">
                <div className="relative">
                  <Lock className="h-3 w-3" />
                  <div className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-ping rounded-full bg-amber-500" />
                </div>
                <span className="capitalize">{lockedByFirstName}</span>
              </span>
            </div>
          )}
        </div>
      )}

      {!itemHasMedia && (
        <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white p-4 dark:border-gray-700 dark:from-gray-800 dark:to-gray-900">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`rounded-lg p-2 ${type === 'campaign' ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}
              >
                {type === 'campaign' ? (
                  <Users className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                ) : (
                  <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                  {type === 'campaign' ? 'Campaña' : 'Publicación'}
                </span>
                {remoteLock && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                    <Lock className="h-3 w-3" />
                    {lockedByFirstName}
                  </span>
                )}
              </div>
            </div>

            <span
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusColors}`}
            >
              <StatusIcon className="h-3 w-3" />
              <span className="capitalize">
                {type === 'campaign'
                  ? t(`campaigns.filters.${item.status || 'active'}`)
                  : t(`publications.status.${item.status || 'draft'}`)}
              </span>
            </span>
          </div>

          <h3 className="line-clamp-2 text-base font-bold text-gray-900 transition-colors group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400">
            {item.title ? item.title : (item.name ?? t('publications.table.untitled'))}
          </h3>
        </div>
      )}

      <div className={`${itemHasMedia ? 'p-4' : 'px-4 pb-4'} flex flex-1 flex-col`}>
        {itemHasMedia && (
          <h3 className="mb-2 line-clamp-2 text-base font-bold text-gray-900 transition-colors group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400">
            {item.title ? item.title : (item.name ?? 'Sin título')}
          </h3>
        )}

        <div className="mb-3 flex-1">
          <p className="line-clamp-2 break-words text-sm text-gray-600 dark:text-gray-300">
            {item.description ||
              item.content?.substring(0, 120) ||
              t('publications.table.description')}
            {!item.description && (item.content?.length || 0) > 120 && '...'}
          </p>
        </div>

        <div className="mt-auto space-y-2">
          {remoteLock && item.status !== 'pending_review' && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-100 bg-amber-50 p-2 dark:border-amber-800/30 dark:bg-amber-900/20">
              <div className="relative flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-800 dark:text-amber-400">
                <Lock className="h-3 w-3" />
                <span className="absolute -right-1 -top-1 flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
                </span>
              </div>
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                Editando: {lockedByName}
              </span>
            </div>
          )}
          {item.status === 'pending_review' && (
            <div className="flex items-center gap-2 rounded-lg border border-yellow-100 bg-yellow-50 p-2 dark:border-yellow-800/30 dark:bg-yellow-900/20">
              <div className="relative flex h-5 w-5 items-center justify-center rounded-full bg-yellow-100 text-yellow-600 dark:bg-yellow-800 dark:text-yellow-400">
                <Clock className="h-3 w-3" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-yellow-700 dark:text-yellow-400">
                  {t('publications.table.pendingAdminReview') || 'Pendiente de revisión'}
                </span>
                {item.currentApprovalStep?.role?.name && (
                  <span className="text-[10px] text-yellow-600 dark:text-yellow-500">
                    {t('approvals.approver_role')}: {item.currentApprovalStep.role.name}
                  </span>
                )}
              </div>
            </div>
          )}

          {type === 'publication' && item.accounts && item.accounts.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <span className="flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-xs font-medium text-white">
                  <Loader2 className="h-3 w-3 animate-spin" />{' '}
                  {t('publications.gallery.processing', {
                    defaultValue: 'Generating Preview...',
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {t('publications.modal.publish.platforms')}:
                </span>
                {getPlatformIcons()}
              </div>
            </div>
          )}

          {type === 'campaign' && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-xs text-gray-600 dark:text-gray-300">
                  {item.publications?.length || 0} publicaciones
                </span>
              </div>
              {item.engagement_rate && (
                <span className="text-xs font-medium text-green-600 dark:text-green-400">
                  {item.engagement_rate}% engagement
                </span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            {item.scheduled_at ? (
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-xs text-gray-600 dark:text-gray-300">
                  {formatDateString(item.scheduled_at, {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ) : (
              item.created_at && (
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-xs text-gray-600 dark:text-gray-300">
                    {formatDateString(item.created_at, {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )
            )}

            {type === 'publication' && itemHasMedia && (
              <div className="flex items-center gap-1">
                {isVideo ? (
                  <Video className="h-3.5 w-3.5 text-gray-400" />
                ) : (
                  <ImageIcon className="h-3.5 w-3.5 text-gray-400" />
                )}
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {mediaCount.total} {mediaCount.total === 1 ? t('common.item') : t('common.files')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
        <div className="flex items-center gap-2">
          {type === 'publication' && canManageContent && (
            <>
              {shouldShowPublish(item) ? (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePublish(item);
                  }}
                  disabled={isLoading?.publishing}
                  loading={isLoading?.publishing}
                  variant="primary"
                  size="md"
                  icon={Rocket}
                  className="flex-1"
                >
                  <span className="hidden sm:inline">{t('publications.button.publish')}</span>
                </Button>
              ) : shouldShowSendToReview(item) ? (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSubmitForApproval(item);
                  }}
                  disabled={isLoading?.submitting}
                  loading={isLoading?.submitting}
                  variant="primary"
                  size="md"
                  icon={Send}
                  className="flex-1"
                >
                  <span className="hidden sm:inline">
                    {isLoading?.submitting
                      ? t('publications.button.sending')
                      : t('publications.button.sendForReview')}
                  </span>
                </Button>
              ) : item.status === 'pending_review' ? (
                <Button disabled buttonStyle="gradient" size="md" icon={Clock} className="flex-1">
                  <span className="hidden sm:inline">{t('publications.button.inReview')}</span>
                </Button>
              ) : item.status === 'published' ? (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDetails(item);
                  }}
                  variant="ghost"
                  buttonStyle="ghost"
                  size="md"
                  icon={Eye}
                  className="flex-1"
                >
                  <span>{t('publications.button.view')}</span>
                </Button>
              ) : (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDetails(item);
                  }}
                  variant="ghost"
                  buttonStyle="ghost"
                  size="md"
                  icon={Eye}
                  className="flex-1"
                >
                  <span>{t('publications.button.view')}</span>
                </Button>
              )}
            </>
          )}

          {(!canManageContent || type === 'campaign') && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleViewDetails(item);
              }}
              variant="ghost"
              buttonStyle="ghost"
              size="md"
              icon={Eye}
              className="flex-1"
            >
              <span>{t('publications.button.view')}</span>
            </Button>
          )}

          {canManageContent && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(item, remoteLock);
              }}
              variant={remoteLock ? 'ghost' : 'secondary'}
              buttonStyle="icon"
              size="md"
              icon={remoteLock ? Lock : Edit}
              disabled={!!remoteLock}
            >
              <span className="sr-only">{t('common.edit')}</span>
            </Button>
          )}

          {canManageContent && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                if (item?.id) {
                  handleDuplicate(item.id);
                }
              }}
              variant="secondary"
              buttonStyle="icon"
              size="md"
              icon={Copy}
            >
              <span className="sr-only">{t('publications.button.duplicate')}</span>
            </Button>
          )}

          {canManageContent && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                if (item?.id) {
                  handleDelete(item, (item as any).type === 'user_event');
                }
              }}
              buttonStyle="icon"
              size="md"
              icon={Trash2}
              disabled={isLoading?.deleting}
              loading={isLoading?.deleting}
            >
              <span className="sr-only">{t('common.delete')}</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
