import Button from '@/Components/common/Modern/Button';
import SimpleContentTypeBadge from '@/Components/Content/common/SimpleContentTypeBadge';
import SocialAccountsDisplay from '@/Components/Content/Publication/SocialAccountsDisplay';
import { usePublicationActions } from '@/Hooks/publication/usePublicationActions';
import { Publication } from '@/types/Publication';
import {
  countMediaFiles,
  formatPublicationDate,
  getLockedByName,
  getMediaUrl,
  hasMedia,
  isVideoMedia,
  prepareMediaForPreview,
} from '@/Utils/publicationHelpers';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import {
  Calendar,
  CheckCircle,
  Clock,
  Copy,
  Edit,
  Eye,
  Image as ImageIcon,
  Loader2,
  Lock,
  MoreVertical,
  Rocket,
  Trash2,
  Video,
  XCircle,
} from 'lucide-react';
import { memo, useState } from 'react';

interface PublicationMobileRowProps {
  items: Publication[];
  t: (key: string) => string;
  connectedAccounts: { id: number; platform: string; [key: string]: unknown }[];
  getStatusColor: (status?: string) => string;
  onEdit: (item: Publication) => void;
  onDelete: (id: number) => void;
  onPublish: (item: Publication) => void;
  onEditRequest?: (item: Publication) => void;
  onViewDetails?: (item: Publication) => void;
  onDuplicate?: (id: number) => void;
  remoteLocks?: Record<number, { user_id: number; user_name: string; expires_at: string }>;
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

const PublicationMobileRow = memo(
  function PublicationMobileRow({
    items,
    t,
    connectedAccounts,
    getStatusColor,
    onEdit,
    onDelete,
    onPublish,
    onEditRequest,
    onViewDetails,
    onDuplicate,
    remoteLocks = {},
    permissions,
    onPreviewMedia,
  }: PublicationMobileRowProps) {
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
      onViewDetails: onViewDetails || (() => {}),
      onDuplicate: onDuplicate || (() => {}),
      onEditRequest: onEditRequest || (() => {}),
      permissions: permissions || [],
    });

    const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'published':
          return <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />;
        case 'publishing':
          return <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />;
        case 'scheduled':
          return <Calendar className="h-3.5 w-3.5 text-blue-500" />;
        case 'failed':
          return <XCircle className="h-3.5 w-3.5 text-rose-500" />;
        case 'pending_review':
          return <Clock className="h-3.5 w-3.5 text-amber-500" />;
        case 'approved':
          return <CheckCircle className="h-3.5 w-3.5 text-purple-500" />;
        case 'rejected':
          return <XCircle className="h-3.5 w-3.5 text-rose-500" />;
        default:
          return <Clock className="h-3.5 w-3.5 text-gray-500" />;
      }
    };

    const getStatusText = (status: string) => {
      return t(`publications.status.${status || 'draft'}`);
    };

    const formatDate = (dateString?: string) => {
      return formatPublicationDate(dateString);
    };

    const handleImageError = (id: number) => {
      setImageErrors((prev) => ({ ...prev, [id]: true }));
    };

    return (
      <div className="w-full space-y-3 px-1">
        {items.map((item) => {
          const mediaCount = countMediaFiles(item);
          const isLoading = loadingStates[item.id];
          const isVideo = isVideoMedia(item);
          const mediaUrl = getMediaUrl(item);
          const hasImageError = imageErrors[item.id];
          const lock = remoteLocks[item.id];
          const lockedByName = getLockedByName(lock);

          return (
            <div
              key={item.id}
              className="relative rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-neutral-700 dark:bg-neutral-900"
              style={{
                contentVisibility: 'auto',
                containIntrinsicSize: '0 88px',
              }}
            >
              <div className="flex items-start gap-3 p-4">
                {/* Thumbnail - clickable para preview */}
                {hasMedia(item) && mediaUrl ? (
                  <button
                    type="button"
                    className="relative flex-shrink-0 cursor-pointer transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onPreviewMedia) {
                        const allMedia = prepareMediaForPreview(item);
                        onPreviewMedia(allMedia, 0);
                      }
                    }}
                  >
                    <div className="relative h-20 w-20 overflow-hidden rounded-lg border-2 border-gray-200 bg-gray-100 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
                      {(item as Publication & { type?: string }).type === 'user_event' ? (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20">
                          <Calendar className="h-10 w-10 text-primary-600 dark:text-primary-400" />
                        </div>
                      ) : !hasImageError ? (
                        <img
                          src={mediaUrl}
                          alt={item.title || 'Preview'}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          onError={() => handleImageError(item.id)}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400 dark:bg-neutral-800">
                          {isVideo ? (
                            <Video className="h-8 w-8" />
                          ) : (
                            <ImageIcon className="h-8 w-8" />
                          )}
                        </div>
                      )}
                      {isVideo && !hasImageError && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
                          <div className="rounded-full bg-white/90 p-2 shadow-lg">
                            <Video className="h-6 w-6 text-primary-600" />
                          </div>
                        </div>
                      )}
                      {mediaCount.total > 1 && (
                        <div className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-primary-600 text-[11px] font-bold text-white shadow-md dark:border-neutral-900">
                          +{mediaCount.total - 1}
                        </div>
                      )}
                    </div>
                  </button>
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 dark:border-neutral-700 dark:bg-neutral-900/30">
                    <ImageIcon className="h-8 w-8 text-gray-300 dark:text-neutral-700" />
                  </div>
                )}

                {/* Main content */}
                <div className="min-w-0 flex-1">
                  <div className="mb-2">
                    <h3 className="truncate text-base font-bold leading-tight text-gray-900 dark:text-white">
                      {item.title || t('publications.table.untitled')}
                    </h3>
                    <p className="mt-1 line-clamp-2 break-words text-xs text-gray-600 dark:text-gray-400">
                      {item.description || t('publications.table.noDescription')}
                    </p>
                  </div>

                  {/* Status and metadata */}
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm ${getStatusColor(item.status)}`}
                    >
                      {getStatusIcon(item.status || 'draft')}
                      <span>{getStatusText(item.status || 'draft')}</span>
                    </span>

                    {item.content_type && (
                      <SimpleContentTypeBadge
                        contentType={item.content_type}
                        mediaFiles={item.media_files || []}
                        size="sm"
                        className=""
                      />
                    )}

                    {item.scheduled_at && (
                      <div className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{formatDate(item.scheduled_at)}</span>
                      </div>
                    )}
                  </div>

                  {/* Social accounts */}
                  <div className="mb-3">
                    <SocialAccountsDisplay
                      publication={item}
                      connectedAccounts={connectedAccounts}
                      compact={true}
                    />
                  </div>

                  {/* Alerts */}
                  {remoteLocks[item.id] && item.status !== 'pending_review' && (
                    <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5 dark:border-amber-800/30 dark:bg-amber-900/20">
                      <Lock className="h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                      <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                        {t('publications.table.editingBy')} {lockedByName}
                      </span>
                    </div>
                  )}
                  {item.status === 'pending_review' && (
                    <div className="mb-3 flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-2.5 dark:border-yellow-800/30 dark:bg-yellow-900/20">
                      <Clock className="h-4 w-4 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
                      <div className="flex-1">
                        <span className="text-xs font-semibold text-yellow-700 dark:text-yellow-400">
                          {t('publications.table.pendingAdminReview') || 'Pendiente de revisión'}
                        </span>
                        {item.current_approval_step?.name && (
                          <span className="ml-1 text-[10px] text-yellow-600 dark:text-yellow-500">
                            ({item.current_approval_step.name})
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {/* Primary action */}
                    {shouldShowPublish(item) && canManageContent ? (
                      <Button
                        onClick={async (e) => {
                          e.stopPropagation();
                          await handlePublish(item);
                        }}
                        disabled={isLoading?.publishing || false}
                        loading={isLoading?.publishing || false}
                        variant="primary"
                        size="sm"
                        icon={Rocket}
                        className="flex-1 bg-primary-600 hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-700"
                      >
                        {t('publications.button.publish')}
                      </Button>
                    ) : shouldShowSendToReview(item) && canManageContent ? (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSubmitForApproval(item);
                        }}
                        disabled={isLoading?.submitting || false}
                        loading={isLoading?.submitting || false}
                        variant="warning"
                        size="sm"
                        icon={Clock}
                        className="flex-1"
                      >
                        {t('publications.button.request')}
                      </Button>
                    ) : canManageContent && !remoteLocks[item.id] ? (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onEditRequest) {
                            onEditRequest(item);
                          } else {
                            onEdit(item);
                          }
                        }}
                        disabled={isLoading?.editing || false}
                        loading={isLoading?.editing || false}
                        variant="primary"
                        size="sm"
                        icon={Edit}
                        className="flex-1 bg-primary-600 hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-700"
                      >
                        {t('common.edit')}
                      </Button>
                    ) : (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(item);
                        }}
                        variant="primary"
                        size="sm"
                        icon={Eye}
                        className="flex-1 bg-primary-600 hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-700"
                      >
                        {t('publications.button.view')}
                      </Button>
                    )}

                    {/* More options menu */}
                    <Menu>
                      <MenuButton className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white p-2 text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:border-neutral-600 dark:bg-neutral-800 dark:text-gray-300 dark:hover:bg-neutral-700">
                        <MoreVertical className="h-5 w-5" />
                        <span className="sr-only">{t('common.more')}</span>
                      </MenuButton>
                      <MenuItems
                        anchor="bottom end"
                        className="z-[9999] mt-2 w-56 origin-top-right rounded-xl border border-gray-200 bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800"
                      >
                        <div className="p-2 space-y-1">
                          <MenuItem>
                            {({ focus }: { focus: boolean }) => (
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewDetails(item);
                                }}
                                variant="ghost"
                                buttonStyle="outline"
                                size="sm"
                                icon={Eye}
                                className={`w-full justify-start ${
                                  focus ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400' : ''
                                }`}
                              >
                                {t('publications.button.viewDetails')}
                              </Button>
                            )}
                          </MenuItem>

                          {canManageContent && !remoteLocks[item.id] && (
                            <MenuItem>
                              {({ focus }: { focus: boolean }) => (
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onEditRequest) {
                                      onEditRequest(item);
                                    } else {
                                      onEdit(item);
                                    }
                                  }}
                                  disabled={isLoading?.editing || false}
                                  loading={isLoading?.editing || false}
                                  variant="ghost"
                                  buttonStyle="outline"
                                  size="sm"
                                  icon={Edit}
                                  className={`w-full justify-start ${
                                    focus ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400' : ''
                                  }`}
                                >
                                  {t('common.edit')}
                                </Button>
                              )}
                            </MenuItem>
                          )}

                          {canManageContent && (
                            <MenuItem>
                              {({ focus }: { focus: boolean }) => (
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDuplicate(item.id);
                                  }}
                                  disabled={isLoading?.duplicating || false}
                                  loading={isLoading?.duplicating || false}
                                  variant="ghost"
                                  buttonStyle="outline"
                                  size="sm"
                                  icon={Copy}
                                  className={`w-full justify-start ${
                                    focus ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400' : ''
                                  }`}
                                >
                                  {t('publications.button.duplicate')}
                                </Button>
                              )}
                            </MenuItem>
                          )}

                          {permissions?.includes('publish') && canManageContent && (
                            <>
                              <div className="my-1 h-px bg-gray-200 dark:bg-neutral-700" />
                              <MenuItem>
                                {({ focus }: { focus: boolean }) => (
                                  <Button
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      await handleDelete(item, (item as Publication & { type?: string }).type === 'user_event');
                                    }}
                                    disabled={isLoading?.deleting || false}
                                    loading={isLoading?.deleting || false}
                                    variant="primary"
                                    size="sm"
                                    icon={Trash2}
                                    className={`w-full justify-start ${
                                      focus ? 'bg-red-50 dark:bg-red-900/20' : ''
                                    }`}
                                  >
                                    {t('common.delete')}
                                  </Button>
                                )}
                              </MenuItem>
                            </>
                          )}
                        </div>
                      </MenuItems>
                    </Menu>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  },
);

export default PublicationMobileRow;
