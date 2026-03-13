import Button from "@/Components/common/Modern/Button";
import SimpleContentTypeBadge from "@/Components/Content/common/SimpleContentTypeBadge";
import { usePublicationActions } from "@/Hooks/publication/usePublicationActions";
import { formatDateString } from "@/Utils/dateHelpers";
import {
  countMediaFiles,
  getLockedByFirstName,
  getLockedByName,
  getMediaUrl,
  getStatusColors,
  hasMedia,
  isProcessing,
  isVideoMedia,
  prepareMediaForPreview
} from "@/Utils/publicationHelpers";
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
  Video
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface ContentCardProps {
  item: any;
  onEdit: (item: any) => void;
  onDelete: (id: number) => void;
  onViewDetails?: (item: any) => void;
  onPublish?: (item: any) => void;
  onDuplicate?: (id: number) => void;
  type: "publication" | "campaign";
  permissions?: string[];
  remoteLock?: {
    user_id: number;
    user_name: string;
    expires_at: string;
  } | null;
  onPreviewMedia?: (
    media: {
      url: string;
      type: "image" | "video";
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
    }[(item.status || "draft")] || Edit;

  // Get platform icons for publication
  const getPlatformIcons = () => {
    if (!item.accounts || !Array.isArray(item.accounts)) return null;

    return (
      <div className="flex items-center gap-1">
        {item.accounts.slice(0, 3).map((account: any, index: number) => (
          <div
            key={index}
            className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center"
            title={account.provider}
          >
            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
              {account.provider?.charAt(0).toUpperCase()}
            </span>
          </div>
        ))}
        {item.accounts.length > 3 && (
          <span className="text-xs text-gray-500">
            +{item.accounts.length - 3}
          </span>
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
      className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col h-full cursor-pointer"
      onClick={handleCardClick}
    >
      {(itemHasMedia || itemIsProcessing) && (
        <div
          className="relative h-40 bg-gray-100 dark:bg-gray-700 overflow-hidden cursor-zoom-in"
          onClick={handleMediaClick}
        >
          <div className="relative w-full h-full">
            {itemIsProcessing ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 animate-pulse">
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-2 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Clock className="w-6 h-6 animate-spin" />
                </div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {t("common.processing")}...
                </span>
              </div>
            ) : !imageError && mediaUrl ? (
              <img
                src={mediaUrl}
                alt={item.title || "Media"}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                <div className="text-center">
                  <div className="p-3 rounded-full bg-gray-300 dark:bg-gray-600 mb-2 mx-auto w-12 h-12 flex items-center justify-center text-gray-500">
                    {isVideo ? (
                      <Video className="w-6 h-6" />
                    ) : (
                      <ImageIcon className="w-6 h-6" />
                    )}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {isVideo ? t("common.videoTypes.video") : t("common.videoTypes.post")}
                  </span>
                </div>
              </div>
            )}
            {!itemIsProcessing && isVideo && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors">
                <div className="bg-white/90 dark:bg-gray-900/90 p-2.5 rounded-full shadow-lg backdrop-blur-sm">
                  <Video className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
              </div>
            )}
          </div>
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-2 items-start">
            {/* Content Type Badge - Solo para publicaciones */}
            {type === "publication" && !remoteLock && (
              <SimpleContentTypeBadge
                contentType={item.content_type}
                mediaFiles={item.media_files}
                size="sm"
                className="shadow-sm backdrop-blur-md border border-white/20"
              />
            )}
            {/* Content Type Badge cuando hay remoteLock - posición ajustada */}
            {type === "publication" && remoteLock && (
              <div className="mt-12">
                <SimpleContentTypeBadge
                  contentType={item.content_type}
                  mediaFiles={item.media_files}
                  size="sm"
                  className="shadow-sm backdrop-blur-md border border-white/20"
                />
              </div>
            )}
          </div>
          <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 items-end">
            {/* Status Badge */}
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-sm backdrop-blur-md border border-white/20 ${statusColors}`}
            >
              <StatusIcon className="w-3 h-3" />
              <span className="capitalize">
                {type === "campaign"
                  ? t(`campaigns.filters.${item.status || "active"}`)
                  : t(`publications.status.${item.status || "draft"}`)}
              </span>
            </span>
          </div>
          {remoteLock && (
            <div className="absolute top-3 left-3 z-10">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-md border border-amber-200/50 bg-amber-100/90 text-amber-700 dark:bg-amber-900/80 dark:text-amber-300 dark:border-amber-700/50 animate-pulse">
                <div className="relative">
                  <Lock className="w-3 h-3" />
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-500 rounded-full animate-ping" />
                </div>
                <span className="capitalize">{lockedByFirstName}</span>
              </span>
            </div>
          )}
        </div>
      )}

      {!itemHasMedia && (
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className={`p-2 rounded-lg ${type === "campaign" ? "bg-orange-100 dark:bg-orange-900/30" : "bg-blue-100 dark:bg-blue-900/30"}`}
              >
                {type === "campaign" ? (
                  <Users className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                ) : (
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                  {type === "campaign" ? "Campaña" : "Publicación"}
                </span>
                {remoteLock && (
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    {lockedByFirstName}
                  </span>
                )}
              </div>
            </div>

            <span
              className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${statusColors}`}
            >
              <StatusIcon className="w-3 h-3" />
              <span className="capitalize">
                {type === "campaign"
                  ? t(`campaigns.filters.${item.status || "active"}`)
                  : t(`publications.status.${item.status || "draft"}`)}
              </span>
            </span>
          </div>

          <h3 className="font-bold text-gray-900 dark:text-white text-base line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {item.title ? item.title : (item.name ?? t("publications.table.untitled"))}
          </h3>
        </div>
      )}

      <div className={`${itemHasMedia ? "p-4" : "px-4 pb-4"} flex-1 flex flex-col`}>
        {itemHasMedia && (
          <h3 className="font-bold text-gray-900 dark:text-white text-base line-clamp-2 mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {item.title ? item.title : (item.name ?? "Sin título")}
          </h3>
        )}

        <div className="mb-3 flex-1">
          <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 break-words">
            {item.description ||
              item.content?.substring(0, 120) ||
              t("publications.table.description")}
            {!item.description && (item.content?.length || 0) > 120 && "..."}
          </p>
        </div>

        <div className="space-y-2 mt-auto">
          {remoteLock && item.status !== "pending_review" && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30">
              <div className="relative flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-800 text-amber-600 dark:text-amber-400">
                <Lock className="w-3 h-3" />
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
              </div>
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                Editando: {lockedByName}
              </span>
            </div>
          )}
          {item.status === "pending_review" && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800/30">
              <div className="relative flex items-center justify-center w-5 h-5 rounded-full bg-yellow-100 dark:bg-yellow-800 text-yellow-600 dark:text-yellow-400">
                <Clock className="w-3 h-3" />
              </div>
              <span className="text-xs font-semibold text-yellow-700 dark:text-yellow-400">
                {t("publications.table.pendingAdminReview") || "Pendiente de revisión"}
              </span>
            </div>
          )}

          {type === "publication" &&
            item.accounts &&
            item.accounts.length > 0 && (
              <div className="flex items-center justify-between">
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white text-xs font-medium px-2 py-1 bg-black/50 rounded-full flex gap-1 items-center">
                    <Loader2 className="w-3 h-3 animate-spin" />{" "}
                    {t("publications.gallery.processing", {
                      defaultValue: "Generating Preview...",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {t("publications.modal.publish.platforms")}:
                  </span>
                  {getPlatformIcons()}
                </div>
              </div>
            )}

          {type === "campaign" && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-gray-400" />
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
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs text-gray-600 dark:text-gray-300">
                  {formatDateString(item.scheduled_at, {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ) : (
              item.created_at && (
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs text-gray-600 dark:text-gray-300">
                    {formatDateString(item.created_at, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )
            )}

            {type === "publication" && itemHasMedia && (
              <div className="flex items-center gap-1">
                {isVideo ? (
                  <Video className="w-3.5 h-3.5 text-gray-400" />
                ) : (
                  <ImageIcon className="w-3.5 h-3.5 text-gray-400" />
                )}
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {mediaCount.total}{" "}
                  {mediaCount.total === 1 ? t("common.item") : t("common.files")}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
        <div className="flex items-center gap-2">
          {type === "publication" && canManageContent && (
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
                  size="sm"
                  icon={Rocket}
                  className="flex-1"
                >
                  <span className="hidden sm:inline">{t("publications.button.publish")}</span>
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
                  size="sm"
                  icon={Send}
                  className="flex-1"
                >
                  <span className="hidden sm:inline">
                    {isLoading?.submitting ? t("publications.button.sending") : t("publications.button.sendForReview")}
                  </span>
                </Button>
              ) : item.status === "pending_review" ? (
                <Button
                  disabled
                  variant="warning"
                  size="sm"
                  icon={Clock}
                  className="flex-1"
                >
                  <span className="hidden sm:inline">{t("publications.button.inReview")}</span>
                </Button>
              ) : item.status === "published" ? (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDetails(item);
                  }}
                  variant="ghost"
                  size="sm"
                  icon={Eye}
                  className="flex-1"
                >
                  <span className="hidden sm:inline">{t("publications.button.view")}</span>
                </Button>
              ) : (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDetails(item);
                  }}
                  variant="ghost"
                  size="sm"
                  icon={Eye}
                  className="flex-1"
                >
                  <span className="sr-only">{t("publications.button.view")}</span>
                </Button>
              )}
            </>
          )}

          {(!canManageContent || type === "campaign") && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleViewDetails(item);
              }}
              variant="ghost"
              size="sm"
              icon={Eye}
              className="flex-1"
            >
              <span className="sr-only">{t("publications.button.view")}</span>
            </Button>
          )}

          {canManageContent && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(item, remoteLock);
              }}
              variant={remoteLock ? "ghost" : "secondary"}
              buttonStyle="icon"
              size="sm"
              icon={remoteLock ? Lock : Edit}
              disabled={!!remoteLock}
            >
              <span className="sr-only">{t("common.edit")}</span>
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
              size="sm"
              icon={Copy}
            >
              <span className="sr-only">{t("publications.button.duplicate")}</span>
            </Button>
          )}

          {canManageContent && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                if (item?.id) {
                  handleDelete(item, (item as any).type === "user_event");
                }
              }}
              variant="danger"
              buttonStyle="icon"
              size="sm"
              icon={Trash2}
              disabled={isLoading?.deleting}
              loading={isLoading?.deleting}
            >
              <span className="sr-only">{t("common.delete")}</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
