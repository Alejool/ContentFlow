import PlatformSettingsModal from "@/Components/ConfigSocialMedia/PlatformSettingsModal";
import VideoSplitter from "@/Components/ManageContent/Publication/common/edit/VideoSplitter";
import YouTubeThumbnailUploader from "@/Components/common/ui/YouTubeThumbnailUploader";
import {
  SOCIAL_PLATFORMS,
  getPlatformConfig,
} from "@/Constants/socialPlatforms";
import { usePublishPublication } from "@/Hooks/publication/usePublishPublication";
import { useConfirm } from "@/Hooks/useConfirm";
import { formatDateTime } from "@/Utils/formatDate";
import { useMediaStore } from "@/stores/mediaStore";
import { usePublicationStore } from "@/stores/publicationStore";
import { Publication } from "@/types/Publication";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { usePage } from "@inertiajs/react";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  Scissors,
  Settings as SettingsIcon,
  Share2,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

interface PublishPublicationModalProps {
  isOpen: boolean;
  onClose: (id?: number) => void;
  publication: Publication | null;
  onSuccess?: () => void;
}

export default function PublishPublicationModal({
  isOpen,
  onClose,
  publication,
  onSuccess,
}: PublishPublicationModalProps) {
  const { confirm, ConfirmDialog } = useConfirm();
  const { t, i18n } = useTranslation();

  const [activePlatformSettings, setActivePlatformSettings] = useState<
    string | null
  >(null);
  const [platformSettings, setPlatformSettings] = useState<Record<string, any>>(
    {},
  );

  const {
    connectedAccounts,
    selectedPlatforms,
    publishedPlatforms,
    failedPlatforms,
    removedPlatforms,
    publishingPlatforms,
    scheduledPlatforms,
    publishing,
    unpublishing,
    existingThumbnails,
    isLoadingThumbnails,
    fetchPublishedPlatforms,
    loadExistingThumbnails,
    handleUnpublish,
    togglePlatform,
    selectAll,
    deselectAll,
    isYoutubeSelected,
    handlePublish,
    handleCancelPublication,
    handleThumbnailChange,
    handleThumbnailDelete,
    handleRequestReview,
    handleApprove,
    handleReject,
    setUnpublishing,
    resetState,
  } = usePublishPublication();

  const [splittingMedia, setSplittingMedia] = useState<{
    id: number;
    url: string;
    file_name: string;
  } | null>(null);

  const handleSplitComplete = async (
    newFiles: File[],
    mode: "replace" | "new_publications",
  ) => {
    if (!splittingMedia || !publication) return;

    if (mode === "replace") {
      // This is complicated in Publish modal because it's already saved.
      // We'd need to upload the new segment and replace the old media item.
      toast.error(
        "Reemplazar video no está disponible desde aquí. Por favor usa el editor.",
      );
    } else {
      // Create new publications for each segment
      // We can use the current publication as template
      for (const file of newFiles) {
        const formData = new FormData();
        formData.append("title", `${publication.title} - Segment`);
        formData.append("description", publication.description || "");
        formData.append("goal", publication.goal || "");
        formData.append("hashtags", publication.hashtags || "");
        formData.append("status", "draft");
        formData.append("files[]", file);

        try {
          await usePublicationStore.getState().createPublication(formData);
        } catch (e) {
          console.error("Failed to create new publication from split", e);
        }
      }
      toast.success("Nuevas publicaciones creadas en borradores.");
    }
    setSplittingMedia(null);
  };

  const { auth } = usePage<any>().props;
  const currentWorkspace = auth.current_workspace;
  const permissions = currentWorkspace?.permissions || [];
  const hasPublishPermission = permissions.includes("publish");
  const canManageContent = permissions.includes("manage-content");
  const isApproved =
    publication?.status === "approved" || publication?.status === "published";
  const canPublishDirectly = hasPublishPermission || isApproved;
  const isPendingReview = publication?.status === "pending_review";

  const handleRequestApproval = async () => {
    if (!publication) return;
    const success = await handleRequestReview(publication.id, platformSettings);
    if (success) {
      if (onSuccess) onSuccess();
      onClose(publication.id);
    }
  };

  const handleApproveRequest = async () => {
    if (!publication) return;
    const data = await handleApprove(publication.id);
    if (data && data.success) {
      if (onSuccess) onSuccess();
      // If we are an owner/admin, we might want to stay to publish.
      // However, since 'publication' is a prop, we won't see the change until
      // the parent re-renders. We should probably close to avoid confusion
      // OR the parent must refresh immediately.
      // Many users prefer it closing so they see the updated list.
      // But the user said "no me deja subir", maybe they want to see the Publish button NOW.
      // I will close it to force a clean refresh of the parent state.
      onClose(publication.id);
    }
  };

  const handleRejectRequest = async () => {
    if (!publication) return;
    const success = await handleReject(publication.id);
    if (success) {
      if (onSuccess) onSuccess();
      onClose(publication.id);
    }
  };

  const { fetchPublicationById } = usePublicationStore();

  useEffect(() => {
    if (isOpen && publication) {
      fetchPublishedPlatforms(publication.id);
      fetchPublicationById(publication.id).then((fresh) => {
        if (fresh) loadExistingThumbnails(fresh);
      });
      loadExistingThumbnails(publication);
      if (publication.platform_settings) {
        setPlatformSettings(publication.platform_settings);
      } else {
        setPlatformSettings({});
      }
    }

    if (!isOpen) {
      resetState();
    }
  }, [isOpen, publication]);

  const handleUnpublishWithConfirm = async (
    accountId: number,
    platform: string,
  ) => {
    if (!publication) return;
    const allPublished = connectedAccounts.every((acc) =>
      publishedPlatforms.includes(acc.id),
    );

    if (allPublished) {
      const confirmed = await confirm({
        title: t("publications.modal.publish.modal.title", { platform }),
        message: t("publications.modal.publish.modal.message", { platform }),
        confirmText: t("publications.modal.publish.modal.confirmText"),
        cancelText: t("publications.modal.publish.modal.cancelText"),
        type: "warning",
      });

      if (!confirmed) return;
    }

    setUnpublishing(accountId);
    try {
      const success = await handleUnpublish(
        publication.id,
        accountId,
        platform,
      );
      if (success) {
        if (onSuccess) onSuccess();
      }
    } finally {
      setUnpublishing(null);
    }
  };

  const handlePublishWithNotifications = async () => {
    if (!publication) return;

    const success = await handlePublish(publication, platformSettings);
    if (success) {
      if (onSuccess) onSuccess();
      onClose(publication.id);
    }
  };

  const getPlatformIcon = (platform: string) => {
    return getPlatformConfig(platform).logo;
  };

  const getPlatformGradient = (platform: string) => {
    return getPlatformConfig(platform).gradient;
  };

  if (!publication) return null;

  const videoFiles =
    publication.media_files?.filter((m) => m.file_type === "video") || [];

  const videoMetadata = useMediaStore((s) => s.videoMetadata);

  const getViolations = (platform: string) => {
    const config = SOCIAL_PLATFORMS[platform];
    if (!config)
      return {
        countExceeded: false,
        durationExceeded: false,
        exceedingVideos: [],
      };

    const maxCount = config.maxVideoCount || 100;
    const maxDuration = config.maxVideoDuration || 0;

    const countExceeded = videoFiles.length > maxCount;
    const exceedingVideos = videoFiles.filter((v) => {
      const duration =
        videoMetadata[v.id.toString()]?.duration || v.metadata?.duration || 0;
      return maxDuration > 0 && duration > maxDuration;
    });

    return {
      countExceeded,
      durationExceeded: exceedingVideos.length > 0,
      exceedingVideos,
    };
  };

  return (
    <>
      <Dialog
        open={isOpen}
        onClose={() => onClose(publication.id)}
        className="relative z-50"
      >
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm"
          aria-hidden="true"
        />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-2xl rounded-lg p-8 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar bg-white dark:bg-neutral-800 dark:border dark:border-neutral-700">
            <div className="flex items-center justify-between mb-6">
              <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-primary-500 to-pink-500 rounded-lg">
                    <Share2 className="w-6 h-6 text-white" />
                  </div>
                  {t("publications.modal.publish.title")}
                </div>
              </DialogTitle>
              <button
                onClick={() => onClose(publication.id)}
                className="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-500 dark:text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isPendingReview && (
              <div className="mb-6 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 flex items-start gap-3">
                <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-yellow-800 dark:text-yellow-200">
                    {t(
                      "publications.modal.publish.pendingReviewBanner.title",
                    ) || "Publicación en Revisión"}
                  </h4>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300">
                    {t(
                      "publications.modal.publish.pendingReviewBanner.message",
                    ) ||
                      "Esta publicación ya ha sido enviada para revisión. Un administrador debe aprobarla antes de que pueda ser publicada."}
                  </p>
                </div>
              </div>
            )}

            {publication.status === "rejected" && !hasPublishPermission && (
              <div className="mb-6 p-4 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 flex items-start gap-3">
                <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-rose-800 dark:text-rose-200">
                    {t("publications.modal.publish.rejectedBanner.title")}
                  </h4>
                  <div className="mt-1 text-xs text-rose-700 dark:text-rose-300 space-y-2">
                    <p>
                      {t("publications.modal.publish.rejectedBanner.message", {
                        name: publication.rejector?.name || "Admin",
                      })}
                    </p>

                    {publication.rejected_at && (
                      <div className="flex items-center gap-1.5 opacity-80">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatDateTime(publication.rejected_at)}</span>
                      </div>
                    )}

                    {publication.rejection_reason && (
                      <div className="p-3 bg-white/50 dark:bg-black/20 rounded border border-rose-200/50 dark:border-rose-900/30 italic">
                        "{publication.rejection_reason}"
                      </div>
                    )}

                    <p className="font-medium pt-1">
                      {t("publications.modal.publish.rejectedBanner.footer")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-6 p-4 rounded-lg bg-gray-50 dark:bg-neutral-900/50">
              <h3 className="font-semibold mb-1 text-gray-900 dark:text-white">
                {publication.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {publication.description}
              </p>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
                  <button
                    onClick={selectAll}
                    className="text-sm text-primary-500 hover:text-primary-600 font-medium"
                  >
                    {t("publications.modal.publish.selectAll")}
                  </button>
                  <span className="text-gray-400 dark:text-gray-600">|</span>
                  <button
                    onClick={deselectAll}
                    className="text-sm text-primary-500 hover:text-primary-600 font-medium"
                  >
                    {t("publications.modal.publish.deselectAll")}
                  </button>
                </div>
              </div>

              {connectedAccounts.length === 0 ? (
                <div className="text-center py-8 rounded-lg bg-gray-50 dark:bg-neutral-900/50">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t("publications.modal.publish.noConnectedAccounts")}
                    <br />
                    {t("publications.modal.publish.connectAccounts")}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {" "}
                  {connectedAccounts.map((account) => {
                    const iconSrc = getPlatformIcon(account.platform);
                    const isSelected = selectedPlatforms.includes(account.id);
                    const isPublished = publishedPlatforms.includes(account.id);
                    const isFailed = failedPlatforms.includes(account.id);
                    const isRemovedPlatform = removedPlatforms.includes(
                      account.id,
                    );
                    const isPublishing = publishingPlatforms.includes(
                      account.id,
                    );
                    const isScheduled = scheduledPlatforms.includes(account.id);
                    const isUnpublishing = unpublishing === account.id;

                    return (
                      <div
                        key={account.id}
                        className="relative w-full sm:flex-1"
                      >
                        <div
                          onClick={() =>
                            !isPublished &&
                            !isPublishing &&
                            !isScheduled &&
                            togglePlatform(account.id)
                          }
                          className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all pt-6 relative ${
                            !isPublished && !isPublishing && !isScheduled
                              ? "cursor-pointer"
                              : "cursor-default"
                          } ${
                            isPublishing
                              ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
                              : isPublished
                                ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                                : isScheduled
                                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                  : isFailed
                                    ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                                    : isRemovedPlatform
                                      ? "border-gray-500 bg-gray-50 dark:bg-gray-900/20"
                                      : isSelected
                                        ? "p-2 border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                                        : "bg-white dark:bg-neutral-900/30 border-primary-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-neutral-600"
                          }`}
                        >
                          {/* Publishing Overlay */}
                          {isPublishing && (
                            <div className="absolute inset-0 z-20 bg-white/70 dark:bg-neutral-900/80 backdrop-blur-[2px] flex flex-col items-center justify-center rounded-lg animate-in fade-in duration-300">
                              <div className="flex flex-col items-center gap-3">
                                <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin shadow-sm" />
                                <div className="flex flex-col items-center">
                                  {isPublishing && (
                                    <span className="text-[11px] font-bold text-yellow-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/50 px-2.5 py-1 rounded-md shadow-sm border border-yellow-200 dark:border-yellow-800 uppercase tracking-wider mb-2">
                                      {t(
                                        "publications.modal.publish.publishing",
                                      )}
                                    </span>
                                  )}
                                  {isUnpublishing && (
                                    <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-2.5 py-1 rounded-md shadow-sm border border-amber-200 dark:border-amber-800 uppercase tracking-wider mb-2">
                                      {t(
                                        "publications.modal.publish.unpublishing",
                                      ) || "Despublicando..."}
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCancelPublication(publication.id);
                                    }}
                                    className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-[10px] font-bold uppercase transition-all shadow-md active:scale-95"
                                  >
                                    {t("common.cancel") || "Cancelar"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                          <div className="w-12 h-12 rounded-lg  flex items-center justify-center flex-shrink-0 ">
                            <img src={iconSrc} alt={account.platform} />
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-medium capitalize text-sm text-primary-600 dark:text-primary-50">
                              {account.platform}
                            </div>
                            <div className="text-xs text-primary-600 dark:text-primary-400">
                              @{account.account_name}
                            </div>
                            {account.user?.name && (
                              <div className="text-[10px] text-primary-500 font-bold uppercase tracking-wider mt-1">
                                {t(
                                  "manageContent.socialMedia.status.connectedBy",
                                ) || "Conectado por"}
                                : {account.user.name}
                              </div>
                            )}

                            {/* Video Violations */}
                            {isSelected &&
                              !isPublished &&
                              !isPublishing &&
                              !isScheduled && (
                                <div className="mt-2 space-y-1">
                                  {(() => {
                                    const {
                                      countExceeded,
                                      durationExceeded,
                                      exceedingVideos,
                                    } = getViolations(account.platform);
                                    const config =
                                      SOCIAL_PLATFORMS[account.platform];

                                    return (
                                      <>
                                        {countExceeded && (
                                          <div className="flex items-center gap-1.5 text-[10px] text-red-600 font-semibold bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded border border-red-200 dark:border-red-800">
                                            <AlertCircle className="w-3 h-3" />
                                            {t(
                                              "publications.modal.publish.validation.maxVideos",
                                              { count: config.maxVideoCount },
                                            ) ||
                                              `Límite: ${config.maxVideoCount} videos`}
                                          </div>
                                        )}
                                        {durationExceeded && (
                                          <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1.5 text-[10px] text-red-600 font-semibold bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded border border-red-200 dark:border-red-800">
                                              <Clock className="w-3 h-3" />
                                              {t(
                                                "publications.modal.publish.validation.maxDuration",
                                                {
                                                  duration:
                                                    config.maxVideoDuration,
                                                },
                                              ) ||
                                                `Límite: ${config.maxVideoDuration}s por video`}
                                            </div>
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                const vid = exceedingVideos[0];
                                                let finalUrl = vid.file_path;
                                                if (
                                                  finalUrl &&
                                                  !finalUrl.startsWith(
                                                    "http",
                                                  ) &&
                                                  !finalUrl.startsWith(
                                                    "/storage/",
                                                  )
                                                ) {
                                                  finalUrl = `/storage/${finalUrl}`;
                                                }
                                                setSplittingMedia({
                                                  id: vid.id,
                                                  url: finalUrl,
                                                  file_name: vid.file_name,
                                                });
                                              }}
                                              className="flex items-center justify-center gap-1 w-full py-1 bg-primary-600 hover:bg-primary-700 text-white rounded text-[10px] font-bold transition-all shadow-sm"
                                            >
                                              <Scissors className="w-3 h-3" />
                                              {t(
                                                "publications.modal.publish.splitVideo",
                                              ) || "Recortar Video"}
                                            </button>
                                          </div>
                                        )}
                                      </>
                                    );
                                  })()}
                                </div>
                              )}
                          </div>

                          {isUnpublishing && (
                            <div className="flex items-center gap-2">
                              <span className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-full">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                {t("publications.modal.publish.unpublishing") ||
                                  "Despublicando..."}
                              </span>
                            </div>
                          )}

                          {isFailed &&
                            !isPublished &&
                            !isPublishing &&
                            !isUnpublishing && (
                              <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded-full">
                                  <AlertCircle className="w-3 h-3" />
                                  {t("publications.modal.publish.failed")}
                                </span>
                              </div>
                            )}

                          {isPublished && (
                            <div className="flex items-center gap-2">
                              <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                                <CheckCircle className="w-3 h-3" />
                                {t("publications.modal.publish.published")}
                              </span>
                            </div>
                          )}

                          {isScheduled && (
                            <div className="flex items-center gap-2">
                              <span className="flex flex-col items-end">
                                <span className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                                  <Clock className="w-3 h-3" />
                                  {t("publications.modal.publish.scheduled")}
                                </span>
                                {(() => {
                                  const schedPost =
                                    publication.scheduled_posts?.find(
                                      (sp) =>
                                        sp.social_account_id === account.id,
                                    );
                                  return schedPost?.scheduled_at ? (
                                    <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                                      {new Date(
                                        schedPost.scheduled_at,
                                      ).toLocaleString([], {
                                        dateStyle: "short",
                                        timeStyle: "short",
                                      })}
                                    </span>
                                  ) : null;
                                })()}
                              </span>
                            </div>
                          )}
                          {isRemovedPlatform && (
                            <div className="absolute top-1 left-1">
                              <span className="flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30 px-2 py-1 rounded-full">
                                <XCircle className="w-3 h-3" />
                                {t("publications.modal.publish.removed")}
                              </span>
                            </div>
                          )}

                          {isFailed &&
                            !isScheduled &&
                            !isPublished &&
                            !isPublishing && (
                              <div className="absolute top-1 left-1">
                                <span className="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded-full">
                                  <AlertCircle className="w-3 h-3" />
                                  {t("publications.modal.publish.failed")}
                                </span>
                              </div>
                            )}

                          <div className="flex items-center gap-1 ml-auto">
                            {!isPublished && !isPublishing && !isScheduled && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActivePlatformSettings(account.platform);
                                }}
                                className="p-1.5 rounded-lg transition-all z-10 hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-500 dark:text-gray-400"
                              >
                                <SettingsIcon className="w-4 h-4" />
                              </button>
                            )}

                            {isSelected &&
                              !isPublished &&
                              !isPublishing &&
                              !isScheduled && (
                                <CheckCircle className="w-5 h-5 text-primary-500" />
                              )}
                          </div>
                        </div>

                        {isPublished && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnpublishWithConfirm(
                                account.id,
                                account.platform,
                              );
                            }}
                            disabled={isUnpublishing}
                            className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-600 text-white rounded-full transition-colors disabled:opacity-50"
                            title="Unpublish to allow re-publishing"
                          >
                            {isUnpublishing ? (
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <X className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {isYoutubeSelected() && videoFiles.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <img
                    src={getPlatformConfig("youtube").logo}
                    className="w-5 h-5"
                    alt="YouTube"
                  />
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {t("publications.modal.publish.youtubeThumbnails")}
                    {isLoadingThumbnails && (
                      <span className="ml-2 text-xs text-gray-500">
                        {t("publications.modal.publish.loading")}
                      </span>
                    )}
                  </h4>
                </div>

                {isLoadingThumbnails ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {videoFiles.map((video) => {
                      const videoId = video.id;
                      const existingThumbnail = existingThumbnails[videoId];
                      const videoPreviewUrl = video.file_path?.startsWith(
                        "http",
                      )
                        ? video.file_path
                        : `/storage/${video.file_path}`;

                      return (
                        <YouTubeThumbnailUploader
                          key={videoId}
                          videoId={videoId}
                          videoFileName={video.file_name}
                          videoPreviewUrl={videoPreviewUrl}
                          existingThumbnail={existingThumbnail || null}
                          onThumbnailChange={(file: File | null) => {
                            handleThumbnailChange(videoId, file);
                          }}
                          onThumbnailDelete={() => {
                            handleThumbnailDelete(videoId);
                          }}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 mt-8">
              <button
                type="button"
                onClick={() => onClose(publication.id)}
                className="flex-1 px-4 py-3 rounded-lg font-medium transition-colors bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 text-gray-700 dark:text-white"
              >
                {t("publications.modal.publish.button.cancel")}
              </button>
              {canPublishDirectly ? (
                <div className="flex-[2] flex gap-3">
                  {isPendingReview && hasPublishPermission && (
                    <button
                      type="button"
                      onClick={handleApproveRequest}
                      className="flex-1 px-4 py-3 rounded-lg font-medium bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors flex items-center justify-center gap-2"
                      title="Aprobar sin publicar ahora"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {t("publications.modal.publish.button.approve") ||
                        "Aprobar"}
                    </button>
                  )}
                  {isPendingReview && !hasPublishPermission && (
                    <button
                      type="button"
                      onClick={handleRejectRequest}
                      className="flex-1 px-4 py-3 rounded-lg font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      {t("publications.modal.publish.button.reject") ||
                        "Rechazar"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={
                      isPendingReview && !hasPublishPermission
                        ? handleApproveRequest
                        : handlePublishWithNotifications
                    }
                    disabled={
                      publishing ||
                      publication.status === "publishing" ||
                      publication.status === "processing" ||
                      (isPendingReview && !hasPublishPermission && false) || // placeholder to match logic
                      (!isPendingReview &&
                        !isApproved &&
                        selectedPlatforms.length === 0) ||
                      (isApproved &&
                        selectedPlatforms.length === 0 &&
                        !isPendingReview)
                    }
                    className="flex-[2] px-4 py-3 rounded-lg font-medium bg-gradient-to-r from-primary-500 to-pink-500 hover:from-primary-600 hover:to-pink-600 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {publishing || publication.status === "publishing" ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        {t("publications.modal.publish.publishing")}
                      </>
                    ) : isPendingReview && !hasPublishPermission ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        {t("publications.modal.publish.button.approve") ||
                          "Aprobar"}
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4" />
                        {t("publications.modal.publish.button.publish")}{" "}
                        {selectedPlatforms.length > 0 &&
                          `(${selectedPlatforms.length})`}
                      </>
                    )}
                  </button>
                </div>
              ) : canManageContent ? (
                <button
                  type="button"
                  onClick={handleRequestApproval}
                  disabled={publishing || isPendingReview}
                  className="flex-[2] px-4 py-3 rounded-lg font-medium bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isPendingReview ? (
                    <>
                      <Clock className="w-4 h-4" />
                      {t("publications.modal.publish.button.pendingReview")}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      {t("publications.modal.publish.button.requestApproval")}
                    </>
                  )}
                </button>
              ) : null}
            </div>

            <PlatformSettingsModal
              isOpen={!!activePlatformSettings}
              onClose={() => setActivePlatformSettings(null)}
              platform={activePlatformSettings || ""}
              settings={
                platformSettings[activePlatformSettings?.toLowerCase() || ""] ||
                {}
              }
              onSettingsChange={(newSettings) => {
                if (activePlatformSettings) {
                  setPlatformSettings((prev) => ({
                    ...prev,
                    [activePlatformSettings.toLowerCase()]: newSettings,
                  }));
                }
              }}
            />
          </DialogPanel>
        </div>
      </Dialog>
      <ConfirmDialog />

      {splittingMedia && (
        <VideoSplitter
          isOpen={!!splittingMedia}
          onClose={() => setSplittingMedia(null)}
          videoUrl={splittingMedia.url}
          onSplitComplete={handleSplitComplete}
        />
      )}
    </>
  );
}
