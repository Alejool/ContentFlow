import Button from "@/Components/common/Modern/Button";
import SimpleContentTypeBadge from "@/Components/Content/common/SimpleContentTypeBadge";
import PublicationThumbnail from "@/Components/Content/Publication/PublicationThumbnail";
import SocialAccountsDisplay from "@/Components/Content/Publication/SocialAccountsDisplay";
import { usePublicationActions } from "@/Hooks/publication/usePublicationActions";
import { usePublicationStore } from "@/stores/publicationStore";
import { Publication } from "@/types/Publication";
import { countMediaFiles, getLockedByName } from "@/Utils/publicationHelpers";
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
} from "lucide-react";
import React, { memo, useMemo } from "react";
import toast from "react-hot-toast";

// ... (skipping interface to save tokens if possible, or just targeting the specific blocks)

// Actually I need to split this into two chunks if possible or one large replacement if they are close.
// Imports are lines 4-13.
// Lock indicator is lines 124-131.
// Edit button is lines 287-323.
// I'll use multi_replace.

interface PublicationRowProps {
  item: Publication;
  t: (key: string) => string;
  connectedAccounts: any[];
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
      type: "image" | "video";
      title?: string;
    }[],
    initialIndex?: number,
  ) => void;
}

const PublicationRow = memo(
  ({
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
  }: PublicationRowProps) => {
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
      isOwner,
      hasWorkflow,
    } = usePublicationActions({
      onEdit,
      onDelete,
      onPublish,
      onViewDetails,
      onDuplicate,
      onEditRequest,
      permissions,
    });

    const publishingPlatforms = useMemo(() => {
      return usePublicationStore.getState().getPublishingPlatforms(item.id);
    }, [item.id]);

    const mediaCount = React.useMemo(() => {
      return countMediaFiles(item);
    }, [item]);

    const lockedByName = getLockedByName(remoteLock);
    const isLoading = loadingStates[item.id];

    return (
      <>
        <td className="text-center"></td>
        <td className="">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-lg flex-shrink-0 border border-gray-200 bg-gray-100 dark:border-neutral-700 dark:bg-neutral-800 overflow-hidden flex items-center justify-center cursor-zoom-in"
              onClick={(e) => {
                e.stopPropagation();
                const hasMedia =
                  item.media_files && item.media_files.length > 0;
                if (hasMedia && onPreviewMedia) {
                  const allMedia = (item.media_files || []).map(
                    (media: any) => {
                      const isV = media.file_type?.includes("video");
                      let mUrl = media.thumbnail?.file_path || media.file_path;

                      if (!mUrl && media.file_type === "image") {
                        mUrl = media.file_path;
                      }

                      return {
                        url: isV
                          ? media.file_path.startsWith("http")
                            ? media.file_path
                            : `/storage/${media.file_path}`
                          : mUrl.startsWith("http")
                            ? mUrl
                            : `/storage/${mUrl}`,
                        type: (isV ? "video" : "image") as "image" | "video",
                        title: item.title,
                      };
                    },
                  );

                  onPreviewMedia(allMedia, 0);
                }
              }}
            >
              {(item as any).type === "user_event" ? (
                <Calendar className="w-6 h-6 text-primary-500" />
              ) : (
                <PublicationThumbnail publication={item} t={t} />
              )}
            </div>
            <div className="min-w-0 max-w-md">
              <h3
                className="font-medium text-sm text-gray-900 dark:text-white truncate"
                title={item.title || "Untitled"}
              >
                {item.title || "Untitled"}
              </h3>

              {/* Content Type Badge */}
              <div className="mt-1">
                <SimpleContentTypeBadge
                  contentType={item.content_type}
                  mediaFiles={item.media_files}
                  size="sm"
                />
              </div>

              <p className="text-xs mt-0.5 truncate text-gray-500 dark:text-gray-400">
                {item.description || t("publications.table.noDescription")}
              </p>
              {item.platform_settings &&
                typeof item.platform_settings === "object" &&
                !Array.isArray(item.platform_settings) &&
                Object.keys(item.platform_settings).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {Object.entries(item.platform_settings)
                      .slice(0, 2)
                      .map(([platform, settings]: [string, any]) => {
                        if (!settings || !settings.type) return null;

                        const typeLabel =
                          settings.type === "poll"
                            ? "Poll"
                            : settings.type === "thread"
                              ? "Thread"
                              : settings.type === "reel"
                                ? "Reel"
                                : settings.type === "short"
                                  ? "Short"
                                  : "Post";
                        const colorClass =
                          platform === "twitter"
                            ? "bg-sky-50 text-sky-800 dark:bg-sky-900/20 dark:text-sky-400"
                            : platform === "youtube"
                              ? "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                              : "bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";

                        return (
                          <span
                            key={platform}
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border border-gray-100 dark:border-white/5 ${colorClass}`}
                          >
                            {platform.slice(0, 2).toUpperCase()}: {typeLabel}
                          </span>
                        );
                      })}
                    {Object.keys(item.platform_settings).length > 2 && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300 border border-gray-200 dark:border-white/5">
                        +{Object.keys(item.platform_settings).length - 2}
                      </span>
                    )}
                  </div>
                )}
              {remoteLock && item.status !== "pending_review" && (
                <div className="flex items-center gap-2 mt-2 p-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 w-fit animate-in fade-in slide-in-from-top-1">
                  <div className="relative flex items-center justify-center w-4 h-4 rounded-full bg-amber-100 dark:bg-amber-800 text-amber-600 dark:text-amber-400">
                    <Lock className="w-2.5 h-2.5" />
                    <span className="absolute -top-0.5 -right-0.5 flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-tight">
                    {t("publications.table.editingBy")} {lockedByName}
                  </span>
                </div>
              )}
              {item.status === "pending_review" && (
                <div className="flex items-center gap-2 mt-2 p-1.5 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800/30 w-fit animate-in fade-in slide-in-from-top-1">
                  <div className="relative flex items-center justify-center w-4 h-4 rounded-full bg-yellow-100 dark:bg-yellow-800 text-yellow-600 dark:text-yellow-400">
                    <Clock className="w-2.5 h-2.5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-yellow-700 dark:text-yellow-400 uppercase tracking-tight">
                      {t("publications.table.pendingAdminReview") ||
                        "Pendiente de revisión"}
                    </span>
                    {item.currentApprovalStep?.role?.name && (
                      <span className="text-[9px] text-yellow-600 dark:text-yellow-500">
                        {t("approvals.approver_role")}:{" "}
                        {item.currentApprovalStep.role.name}
                      </span>
                    )}
                  </div>
                </div>
              )}
              {item.status === "publishing" && item.publisher && (
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="flex-shrink-0 w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-tight">
                    {(() => {
                      const publishingAccounts = connectedAccounts.filter(
                        (acc) => publishingPlatforms.includes(acc.id),
                      );
                      if (publishingAccounts.length === 1) {
                        const platformName =
                          publishingAccounts[0].platform
                            .charAt(0)
                            .toUpperCase() +
                          publishingAccounts[0].platform.slice(1);
                        return `Publicando en ${platformName} por ${item.publisher.name}`;
                      } else if (publishingAccounts.length > 1) {
                        return `Publicando en ${publishingAccounts.length} redes por ${item.publisher.name}`;
                      }
                      return (
                        (t("publications.table.publishingBy") ||
                          "Publicando por") +
                        " " +
                        item.publisher.name
                      );
                    })()}
                  </span>
                </div>
              )}
              {item.status === "rejected" && item.rejector && (
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="flex-shrink-0 w-2 h-2 rounded-full bg-rose-500"></span>
                  <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-tight">
                    {t("publications.table.rejectedBy") || "Rejected by"}{" "}
                    {item.rejector.name}
                  </span>
                </div>
              )}
              {((item as any).type === "user_event" || item.scheduled_at) && (
                <div className="flex flex-col gap-0.5 mt-1">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-primary-500" />
                    <span className="text-[10px] font-bold text-primary-500 uppercase tracking-tight">
                      {(item as any).type === "user_event"
                        ? t("publications.table.manualEvent")
                        : t("publications.table.socialNetworkEvent")}
                    </span>
                  </div>
                  {(item as any).type === "user_event" && item.user && (
                    <span className="text-[9px] font-medium text-gray-500 dark:text-gray-400 italic ml-4">
                      {t("publications.table.createdBy")}: {item.user.name}
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
              <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-neutral-700 overflow-hidden flex-shrink-0">
                {item.user.photo_url ? (
                  <img
                    src={item.user.photo_url}
                    alt={item.user.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xs font-medium text-gray-500 uppercase">
                    {item.user.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="ml-3 hidden xl:block">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[100px]">
                  {item.user.name}
                </p>
              </div>
            </div>
          )}
        </td>
        <td className="px-6 py-4">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(
              item.status,
            )}`}
          >
            {t(`publications.status.${item.status || "draft"}`)}
          </span>
        </td>
        <td className="px-6 py-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            {mediaCount.images > 0 && (
              <span className="text-[10px] flex items-center bg-gray-50 dark:bg-white/5 px-1.5 py-0.5 rounded border border-gray-100 dark:border-white/5">
                <Image className="w-3 h-3 mr-1 text-blue-500" />{" "}
                {mediaCount.images}
              </span>
            )}
            {mediaCount.videos > 0 && (
              <span className="text-[10px] flex items-center bg-gray-50 dark:bg-white/5 px-1.5 py-0.5 rounded border border-gray-100 dark:border-white/5">
                <Video className="w-3 h-3 mr-1 text-purple-500" />{" "}
                {mediaCount.videos}
              </span>
            )}
            {mediaCount.total === 0 && (
              <span className="text-[10px] text-gray-400">
                {t("publications.table.noMedia") || "Sin multimedia"}
              </span>
            )}
          </div>
        </td>
        <td className="px-6 py-4 max-w-[120px]">
          {item.campaigns && item.campaigns.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">
                {item.campaigns.length}{" "}
                {item.campaigns.length === 1 ? "Campaign" : "Campaigns"}
              </span>
            </div>
          ) : (
            <span className="text-[10px] italic text-gray-400">
              {t("common.none") || "Ninguna"}
            </span>
          )}
        </td>
        <td className="px-6 py-4 max-w-[180px]">
          <SocialAccountsDisplay
            publication={item}
            connectedAccounts={connectedAccounts}
            publishingPlatforms={publishingPlatforms}
            t={t}
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
                    onClick={async (e) => {
                      e.stopPropagation();
                      await handlePublish(item);
                    }}
                    disabled={
                      isLoading?.publishing ||
                      isLoading?.editing ||
                      isLoading?.deleting
                    }
                    loading={isLoading?.publishing}
                    variant="success"
                    buttonStyle="icon"
                    size="sm"
                    icon={Rocket}
                  >
                    <span className="sr-only">
                      {t("publications.button.publish")}
                    </span>
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
                    buttonStyle="icon"
                    size="sm"
                    icon={Send}
                  >
                    <span className="sr-only">
                      {t("publications.button.sendForReview")}
                    </span>
                  </Button>
                ) : item.status === "pending_review" ? (
                  <Button
                    disabled
                    variant="warning"
                    buttonStyle="icon"
                    size="sm"
                    icon={Clock}
                  >
                    <span className="sr-only">
                      {t("publications.button.inReview")}
                    </span>
                  </Button>
                ) : null}
              </>
            )}

            {/* View Details button */}
            {(!canManageContent || item.status === "published") && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewDetails(item);
                }}
                variant="ghost"
                buttonStyle="icon"
                size="sm"
                icon={Eye}
              >
                <span className="sr-only">{t("publications.button.view")}</span>
              </Button>
            )}

            {/* Edit button */}
            {canManageContent && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  if (remoteLock) {
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
                  !!remoteLock
                }
                loading={isLoading?.editing}
                variant={item.status === "published" ? "warning" : "primary"}
                buttonStyle="icon"
                size="sm"
                icon={remoteLock ? Lock : Edit}
              >
                <span className="sr-only">{t("common.edit")}</span>
              </Button>
            )}

            {/* Duplicate button */}
            {canManageContent && onDuplicate && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDuplicate(item.id);
                }}
                disabled={
                  isLoading?.publishing ||
                  isLoading?.editing ||
                  isLoading?.deleting
                }
                loading={isLoading?.duplicating}
                variant="secondary"
                buttonStyle="icon"
                size="sm"
                icon={Copy}
              >
                <span className="sr-only">
                  {t("publications.button.duplicate")}
                </span>
              </Button>
            )}

            {/* Delete button */}
            {canManageContent && (
              <Button
                onClick={async (e) => {
                  e.stopPropagation();
                  const isUserEvent = (item as any).type === "user_event";
                  await handleDelete(item, isUserEvent);
                }}
                disabled={
                  isLoading?.publishing ||
                  isLoading?.editing ||
                  isLoading?.deleting
                }
                loading={isLoading?.deleting}
                variant="danger"
                buttonStyle="icon"
                size="sm"
                icon={Trash2}
              >
                <span className="sr-only">{t("common.delete")}</span>
              </Button>
            )}
          </div>
        </td>
      </>
    );
  },
);

export default PublicationRow;
