import Button from "@/Components/common/Modern/Button";
import SimpleContentTypeBadge from "@/Components/Content/common/SimpleContentTypeBadge";
import SocialAccountsDisplay from "@/Components/Content/Publication/SocialAccountsDisplay";
import { usePublicationActions } from "@/Hooks/publication/usePublicationActions";
import { Publication } from "@/types/Publication";
import {
  countMediaFiles,
  formatPublicationDate,
  getLockedByName,
  getMediaUrl,
  hasMedia,
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
  Image as ImageIcon,
  Loader2,
  Lock,
  MoreVertical,
  Rocket,
  Trash2,
  Users,
  Video,
  XCircle,
} from "lucide-react";
import React, { memo, useState } from "react";
import toast from "react-hot-toast";

interface PublicationMobileRowProps {
  items: Publication[];
  t: (key: string) => string;
  connectedAccounts: any[];
  getStatusColor: (status?: string) => string;
  onEdit: (item: Publication) => void;
  onDelete: (id: number) => void;
  onPublish: (item: Publication) => void;
  onEditRequest?: (item: Publication) => void;
  onViewDetails?: (item: Publication) => void;
  onDuplicate?: (id: number) => void;
  remoteLocks?: Record<
    number,
    { user_id: number; user_name: string; expires_at: string }
  >;
  permissions?: string[];
  onPreviewMedia?: (
    media: {
      url: string;
      type: "image" | "video";
      title?: string;
    }[],
    initialIndex?: number,
  ) => void;
}

const PublicationMobileRow = memo(
  ({
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
  }: PublicationMobileRowProps) => {
    // Usar el hook centralizado
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
      onViewDetails,
      onDuplicate,
      onEditRequest,
      permissions,
    });
    
    const [expandedRow, setExpandedRow] = useState<number | null>(null);
    const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

    const toggleExpand = (id: number) => {
      setExpandedRow((prev) => (prev === id ? null : id));
    };

    const handleRowClick = (id: number, event: React.MouseEvent) => {
      if ((event.target as HTMLElement).closest("button")) {
        return;
      }
      toggleExpand(id);
    };

    const getStatusIcon = (status: string) => {
      switch (status) {
        case "published":
          return <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />;
        case "publishing":
          return <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />;
        case "scheduled":
          return <Calendar className="w-3.5 h-3.5 text-blue-500" />;
        case "failed":
          return <XCircle className="w-3.5 h-3.5 text-rose-500" />;
        case "pending_review":
          return <Clock className="w-3.5 h-3.5 text-amber-500" />;
        case "approved":
          return <CheckCircle className="w-3.5 h-3.5 text-purple-500" />;
        case "rejected":
          return <XCircle className="w-3.5 h-3.5 text-rose-500" />;
        default:
          return <Clock className="w-3.5 h-3.5 text-gray-500" />;
      }
    };

    const getStatusText = (status: string) => {
      return t(`publications.status.${status || "draft"}`);
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
          const isExpanded = expandedRow === item.id;
          const isLoading = loadingStates[item.id];
          const isVideo = isVideoMedia(item);
          const mediaUrl = getMediaUrl(item);
          const hasImageError = imageErrors[item.id];
          const lock = remoteLocks[item.id];
          const lockedByName = getLockedByName(lock);

          return (
            <div
              key={item.id}
              onClick={(e) => handleRowClick(item.id, e)}
              className={`
                relative overflow-hidden rounded-lg border transition-all duration-300
                ${
                  isExpanded
                    ? "bg-white dark:bg-neutral-800 border-primary-200 dark:border-primary-900/40 shadow-md ring-1 ring-primary-500/10"
                    : "bg-white/80 dark:bg-neutral-900/80 border-gray-100 dark:border-neutral-800 hover:border-gray-200 dark:hover:border-neutral-700 shadow-sm"
                }
              `}
              style={{
                contentVisibility: "auto",
                containIntrinsicSize: "0 88px",
              }}
            >
              {/* Header Content */}
              <div className="p-4 flex items-start gap-3">
                {/* Thumbnail with media preview */}
                <div
                  className="relative flex-shrink-0 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Trigger preview
                    if (hasMedia(item) && onPreviewMedia) {
                      const allMedia = prepareMediaForPreview(item);
                      onPreviewMedia(allMedia, 0);
                    } else {
                      // If no media or preview handler, toggle row
                      if (!hasMedia(item)) toggleExpand(item.id);
                    }
                  }}
                >
                  {hasMedia(item) && mediaUrl ? (
                    <div className="w-16 h-16 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-100 dark:bg-neutral-800 overflow-hidden shadow-sm">
                      {(item as any).type === "user_event" ? (
                        <div className="w-16 h-16 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-100 dark:bg-neutral-800 flex items-center justify-center shadow-sm">
                          <Calendar className="w-8 h-8 text-primary-500" />
                        </div>
                      ) : !hasImageError ? (
                        <img
                          src={mediaUrl}
                          alt={item.title || "Preview"}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={() => handleImageError(item.id)}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-neutral-800 text-gray-400">
                          {isVideo ? (
                            <Video className="w-6 h-6" />
                          ) : (
                            <ImageIcon className="w-6 h-6" />
                          )}
                        </div>
                      )}
                      {isVideo && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <Video className="w-5 h-5 text-white" />
                        </div>
                      )}
                      {mediaCount.total > 1 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gray-800 text-white text-[10px] flex items-center justify-center border border-white">
                          +{mediaCount.total - 1}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-lg border border-dashed border-gray-300 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-900/30 flex items-center justify-center shadow-sm">
                      <div className="text-center">
                        <ImageIcon className="w-6 h-6 text-gray-300 dark:text-neutral-700 mx-auto" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Main content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate leading-tight">
                        {item.title || t("publications.table.untitled")}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 break-words line-clamp-2">
                        {item.description || t("publications.table.noDescription")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {(item as any).type === "user_event" &&
                        canManageContent && (
                          <Button
                            onClick={async (e) => {
                              e.stopPropagation();
                              await handleDelete(item, true);
                            }}
                            disabled={isLoading?.deleting}
                            loading={isLoading?.deleting}
                            variant="danger"
                            buttonStyle="icon"
                            size="sm"
                            icon={Trash2}
                          >
                            <span className="sr-only">{t("common.delete")}</span>
                          </Button>
                        )}
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(item.id);
                        }}
                        variant="ghost"
                        buttonStyle="icon"
                        size="sm"
                        icon={MoreVertical}
                        className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                      >
                        <span className="sr-only">{t("common.more")}</span>
                      </Button>
                    </div>
                  </div>

                  {/* Creator info for events */}
                  {(item as any).type === "user_event" && item.user && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <Users className="w-3 h-3 text-gray-400" />
                      <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 italic">
                        {t("publications.table.createdBy")}: {item.user.name}
                      </span>
                    </div>
                  )}

                  {/* Status and metadata row */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Content Type Badge */}
                    <SimpleContentTypeBadge
                      contentType={item.content_type}
                      mediaFiles={item.media_files}
                      size="sm"
                      className="order-first"
                    />
                    
                    {/* Status badge */}
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}
                    >
                      {getStatusIcon(item.status || "draft")}
                      <span className="font-medium">
                        {getStatusText(item.status || "draft")}
                      </span>
                    </span>

                    {/* Media indicators */}
                    {hasMedia(item) && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        {mediaCount.images > 0 && (
                          <div className="flex items-center gap-1">
                            <ImageIcon className="w-3 h-3 text-blue-500" />
                            <span>{mediaCount.images}</span>
                          </div>
                        )}
                        {mediaCount.videos > 0 && (
                          <div className="flex items-center gap-1">
                            <Video className="w-3 h-3 text-purple-500" />
                            <span>{mediaCount.videos}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Scheduled time */}
                    {item.scheduled_at && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(item.scheduled_at)}</span>
                      </div>
                    )}

                    {/* Event indicators */}
                    {((item as any).type === "user_event" ||
                      (item.scheduled_at && item.status !== "published")) && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="font-medium">
                          {(item as any).type === "user_event"
                            ? t("publications.table.manualEvent")
                            : t("publications.table.socialNetworkEvent")}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Lock indicator */}
                  {remoteLocks[item.id] && item.status !== "pending_review" && (
                    <div className="flex items-center gap-2 mt-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 w-full animate-in fade-in slide-in-from-top-1">
                      <div className="relative flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-800 text-amber-600 dark:text-amber-400">
                        <Lock className="w-3 h-3" />
                        <span className="absolute -top-1 -right-1 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                        {t("publications.table.editingBy")} {lockedByName}
                      </span>
                    </div>
                  )}
                  {/* Pending review indicator */}
                  {item.status === "pending_review" && (
                    <div className="flex items-center gap-2 mt-2 p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800/30 w-full animate-in fade-in slide-in-from-top-1">
                      <div className="relative flex items-center justify-center w-5 h-5 rounded-full bg-yellow-100 dark:bg-yellow-800 text-yellow-600 dark:text-yellow-400">
                        <Clock className="w-3 h-3" />
                      </div>
                      <span className="text-xs font-semibold text-yellow-700 dark:text-yellow-400">
                        {t("publications.table.pendingAdminReview") || "Pendiente de revisión"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick actions bar */}
              <div className="px-4 pb-4 flex items-center gap-2">
                {/* View Details button - Always visible */}
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
                  {t("publications.button.view")}
                </Button>

                {/* Duplicate button */}
                {canManageContent && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicate(item.id);
                    }}
                    disabled={isLoading?.duplicating}
                    loading={isLoading?.duplicating}
                    variant="secondary"
                    size="sm"
                    icon={Copy}
                    className="flex-1"
                  >
                    {t("publications.button.duplicate")}
                  </Button>
                )}

                {/* Publish/Request button */}
                {shouldShowPublish(item) && canManageContent ? (
                  <Button
                    onClick={async (e) => {
                      e.stopPropagation();
                      await handlePublish(item);
                    }}
                    disabled={isLoading?.publishing}
                    loading={isLoading?.publishing}
                    variant="success"
                    size="sm"
                    icon={Rocket}
                    className="flex-1"
                  >
                    {t("publications.button.publish")}
                  </Button>
                ) : shouldShowSendToReview(item) && canManageContent ? (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSubmitForApproval(item);
                    }}
                    disabled={isLoading?.submitting}
                    loading={isLoading?.submitting}
                    variant="warning"
                    size="sm"
                    icon={Clock}
                    className="flex-1"
                  >
                    {t("publications.button.request")}
                  </Button>
                ) : null}
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-4 pb-4 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="pt-4 border-t border-gray-100 dark:border-neutral-700/50 space-y-4">
                    {/* Additional info */}
                    <div className="space-y-3">
                      {/* User info */}
                      {item.user && (
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                            {item.user.photo_url ? (
                              <img
                                src={item.user.photo_url}
                                alt={item.user.name}
                                className="h-full w-full rounded-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <span className="text-xs font-bold text-white uppercase">
                                {item.user.name.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {item.user.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {t("common.creator")}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Platform badges */}
                      {item.platform_settings &&
                        typeof item.platform_settings === "object" &&
                        !Array.isArray(item.platform_settings) &&
                        Object.keys(item.platform_settings).length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                              {t("publications.table.platforms")}:
                            </h4>
                            <div className="flex flex-wrap gap-1.5">
                              {Object.keys(item.platform_settings).map(
                                (platform) => (
                                  <span
                                    key={platform}
                                    className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-300 font-medium"
                                  >
                                    {platform.charAt(0).toUpperCase() +
                                      platform.slice(1)}
                                  </span>
                                ),
                              )}
                            </div>
                          </div>
                        )}

                      {/* Campaigns */}
                      {item.campaigns && item.campaigns.length > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
                            <Users className="w-4 h-4 text-indigo-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {item.campaigns.length === 1 
                                ? t("campaigns.inCampaigns").replace("{{count}}", String(item.campaigns.length))
                                : t("campaigns.inCampaigns_plural").replace("{{count}}", String(item.campaigns.length))}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Accounts */}
                      <div>
                        <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                          {t("publications.table.linkedAccounts")}:
                        </h4>
                        <SocialAccountsDisplay
                          publication={item}
                          connectedAccounts={connectedAccounts}
                          compact={true}
                          t={t}
                        />
                      </div>
                    </div>

                    {/* Expanded actions */}
                    <div className="flex items-center gap-2">
                      {/* View Button (Expanded) */}
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewDetails?.(item);
                        }}
                        variant="ghost"
                        size="sm"
                        icon={Eye}
                        className="flex-1"
                      >
                        {t("publications.button.viewDetails")}
                      </Button>

                      {/* Edit button */}
                      {canManageContent && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (remoteLocks[item.id]) {
                              (toast.error as any)(
                                `${t("publications.table.lockedBy") || "Editando por"} ${lockedByName}`,
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
                            isLoading?.publishing ||
                            isLoading?.editing ||
                            isLoading?.deleting ||
                            !!remoteLocks[item.id]
                          }
                          loading={isLoading?.editing}
                          variant={remoteLocks[item.id] ? "ghost" : "primary"}
                          size="sm"
                          icon={remoteLocks[item.id] ? Lock : (item.status as string) === "processing" ? Loader2 : Edit}
                          className="flex-1"
                        >
                          {remoteLocks[item.id] ||
                          (item.status as string) === "processing"
                            ? (item.status as string) === "processing"
                              ? t("common.processing")
                              : t("publications.table.lockedBy").replace(":", "")
                            : t("common.edit")}
                        </Button>
                      )}

                      {/* Delete button */}
                      {permissions?.includes("publish") &&
                        canManageContent && (
                          <Button
                            onClick={async (e) => {
                              e.stopPropagation();
                              await handleDelete(item, (item as any).type === "user_event");
                            }}
                            disabled={
                              isLoading?.publishing ||
                              isLoading?.editing ||
                              isLoading?.deleting
                            }
                            loading={isLoading?.deleting}
                            variant="danger"
                            size="sm"
                            icon={Trash2}
                            className="flex-1"
                          >
                            {t("common.delete")}
                          </Button>
                        )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  },
);

export default PublicationMobileRow;
