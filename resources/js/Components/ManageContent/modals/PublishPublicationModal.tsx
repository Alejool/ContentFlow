import PlatformSettingsModal from "@/Components/ConfigSocialMedia/PlatformSettingsModal";
import YouTubeThumbnailUploader from "@/Components/common/ui/YouTubeThumbnailUploader";
import { getPlatformConfig } from "@/Constants/socialPlatforms";
import { usePublishPublication } from "@/Hooks/publication/usePublishPublication";
import { useConfirm } from "@/Hooks/useConfirm";
import { formatDateTime } from "@/Utils/formatDate";
import { validateVideoDuration } from "@/Utils/validationUtils";
import { usePublicationStore } from "@/stores/publicationStore";
import { Publication } from "@/types/Publication";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { usePage } from "@inertiajs/react";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  Settings as SettingsIcon,
  Share2,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
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
  }, [isOpen, publication?.id]);

  // Listen for real-time publication status updates
  useEffect(() => {
    if (!isOpen || !publication || !auth.user?.id || !window.Echo) {
      return;
    }

    const channel = window.Echo.private(`users.${auth.user.id}`);

    const handleStatusUpdate = (event: any) => {
      if (event.publicationId === publication.id) {
        // Refresh published platforms and publication data
        fetchPublishedPlatforms(publication.id);
        fetchPublicationById(publication.id);
      }
    };

    channel.listen(".PublicationStatusUpdated", handleStatusUpdate);

    return () => {
      channel.stopListening(".PublicationStatusUpdated", handleStatusUpdate);
    };
  }, [isOpen, publication?.id, auth.user?.id]);

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
      // Don't close modal immediately - let user see the progress
      // Modal will stay open showing publishing status
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
                  <div className="p-2 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg">
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
                            !isScheduled &&
                            togglePlatform(account.id)
                          }
                          className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all pt-6 relative ${
                            !isPublished && !isScheduled
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
                          {/* Publishing Overlay - Only show if actively publishing and not failed */}
                          {isPublishing && !isFailed && (
                            <div className="absolute inset-0 z-20 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm flex items-center justify-center rounded-lg animate-in fade-in duration-300">
                              <div className="flex items-center gap-3 px-4">
                                <div className="relative flex-shrink-0">
                                  <div className="w-8 h-8 border-3 border-yellow-200 dark:border-yellow-900 rounded-full" />
                                  <div className="absolute inset-0 w-8 h-8 border-3 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                                
                                <div className="flex flex-col gap-1">
                                  <span className="text-xs font-bold text-yellow-800 dark:text-yellow-300 uppercase tracking-wide">
                                    {t("publications.modal.publish.publishing")}
                                  </span>
                                  <span className="text-[10px] font-medium text-yellow-600 dark:text-yellow-400">
                                    @{account.account_name}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {!isPublishing && (() => {
                            const mediaFiles = publication.media_files || [];
                            const video = mediaFiles.find(
                              (m: any) =>
                                m.file_type === "video" ||
                                m.mime_type?.startsWith("video/"),
                            );
                            if (!video) return null;

                            const duration = video.metadata?.duration || 0;
                            const validation = validateVideoDuration(
                              account.platform,
                              duration,
                            );

                            if (validation.maxDuration === Infinity)
                              return null;

                            return (
                              <div
                                className={`absolute top-1 left-1 z-10 flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border shadow-sm ${
                                  validation.isValid
                                    ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/30"
                                    : "bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/30 animate-pulse"
                                }`}
                              >
                                {validation.isValid ? (
                                  <CheckCircle className="w-2.5 h-2.5" />
                                ) : (
                                  <XCircle className="w-2.5 h-2.5" />
                                )}
                                <span className="leading-none">
                                  {validation.isValid
                                    ? "OK"
                                    : `MAX ${validation.formattedMax}`}
                                </span>
                              </div>
                            );
                          })()}

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
                          </div>

                          {isUnpublishing && (
                            <div className="absolute inset-0 z-20 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm flex items-center justify-center rounded-lg animate-in fade-in duration-300">
                              <div className="flex items-center gap-2">
                                <Loader2 className="w-5 h-5 animate-spin text-amber-600 dark:text-amber-400" />
                                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                                  {t("publications.modal.publish.unpublishing") ||
                                    "Despublicando..."}
                                </span>
                              </div>
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

                          {isPublished && !isUnpublishing && (
                            <div className="absolute inset-0 z-10 bg-green-50/70 dark:bg-green-900/20 backdrop-blur-[1px] flex items-center justify-center rounded-lg pointer-events-none">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                <span className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wide">
                                  {t("publications.modal.publish.published")}
                                </span>
                              </div>
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
                            {!isPublished && !isScheduled && (
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
                            className="absolute top-2 right-2 z-20 p-1.5 bg-red-500/90 hover:bg-red-600 text-white rounded-full transition-colors disabled:opacity-50 shadow-lg"
                            title="Despublicar"
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
                onClick={async () => {
                  // If publication is actively publishing, cancel it
                  if (publishing || publication.status === "publishing") {
                    const confirmed = await confirm({
                      title: t("publications.modal.publish.cancelConfirm.title") || "¿Cancelar publicación?",
                      message: t("publications.modal.publish.cancelConfirm.message") || "¿Estás seguro de que deseas cancelar esta publicación? Las plataformas que ya se publicaron no se verán afectadas.",
                      confirmText: t("publications.modal.publish.cancelConfirm.confirm") || "Sí, cancelar",
                      cancelText: t("publications.modal.publish.cancelConfirm.cancel") || "No",
                      type: "warning",
                    });
                    
                    if (confirmed) {
                      await handleCancelPublication(publication.id);
                      if (onSuccess) onSuccess();
                      onClose(publication.id);
                    }
                  } else {
                    onClose(publication.id);
                  }
                }}
                className="flex-1 px-4 py-3 rounded-lg font-medium transition-colors bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600 text-gray-700 dark:text-white"
              >
                {publishing || publication.status === "publishing" 
                  ? t("publications.modal.publish.button.cancelPublication") || "Cancelar Publicación"
                  : t("publications.modal.publish.button.cancel") || "Cerrar"
                }
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
                      selectedPlatforms.length === 0
                    }
                    className="flex-[2] px-4 py-3 rounded-lg font-medium bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                  className="flex-[2] px-4 py-3 rounded-lg font-medium bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
    </>
  );
}
