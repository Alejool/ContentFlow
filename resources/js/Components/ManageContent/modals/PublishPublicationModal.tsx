import IconFacebook from "@/../assets/Icons/facebook.svg";
import IconInstagram from "@/../assets/Icons/instagram.svg";
import IconTiktok from "@/../assets/Icons/tiktok.svg";
import IconTwitter from "@/../assets/Icons/x.svg";
import IconYoutube from "@/../assets/Icons/youtube.svg";
import PlatformSettingsModal from "@/Components/ConfigSocialMedia/PlatformSettingsModal";
import PlatformPreviewModal from "@/Components/ManageContent/modals/common/PlatformPreviewModal";
import YouTubeThumbnailUploader from "@/Components/common/ui/YouTubeThumbnailUploader";
import { usePublishPublication } from "@/Hooks/publication/usePublishPublication";
import { useConfirm } from "@/Hooks/useConfirm";
import { useTheme } from "@/Hooks/useTheme";
import { usePublicationStore } from "@/stores/publicationStore";
import { Publication } from "@/types/Publication";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
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
  const { theme } = useTheme();
  const { confirm, ConfirmDialog } = useConfirm();
  const { t } = useTranslation();

  const [activePlatformSettings, setActivePlatformSettings] = useState<
    string | null
  >(null);
  const [activePlatformPreview, setActivePlatformPreview] = useState<
    string | null
  >(null);
  const [platformSettings, setPlatformSettings] = useState<Record<string, any>>(
    {}
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
    handleThumbnailChange,
    handleThumbnailDelete,
    setUnpublishing,
    resetState,
  } = usePublishPublication();

  const { fetchPublicationById } = usePublicationStore();

  useEffect(() => {
    if (isOpen && publication) {
      fetchPublishedPlatforms(publication.id);
      fetchPublicationById(publication.id);
      loadExistingThumbnails(publication);

      // Load platform settings from publication
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
    platform: string
  ) => {
    if (!publication) return;

    // Check if ALL connected accounts are published
    const allPublished = connectedAccounts.every((acc) =>
      publishedPlatforms.includes(acc.id)
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
        platform
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
    const icons: any = {
      facebook: IconFacebook,
      twitter: IconTwitter,
      instagram: IconInstagram,
      tiktok: IconTiktok,
      youtube: IconYoutube,
    };
    return icons[platform.toLowerCase()];
  };

  const getPlatformGradient = (platform: string) => {
    const gradients: any = {
      facebook: "from-blue-500 to-blue-700",
      twitter: "from-neutral-800 to-neutral-900",
      instagram: "from-pink-500 to-purple-700",
      tiktok: "from-neutral-900 via-neutral-800 to-rose-900",
      youtube: "from-primary-600 to-primary-800",
    };
    return gradients[platform.toLowerCase()] || "from-gray-500 to-gray-700";
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
          <DialogPanel
            className={`w-full max-w-2xl rounded-lg p-8 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar
            ${
              theme === "dark"
                ? "bg-neutral-800 border border-neutral-700"
                : "bg-white"
            }
          `}
          >
            <div className="flex items-center justify-between mb-6">
              <DialogTitle
                className={`text-2xl font-bold ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-primary-500 to-pink-500 rounded-lg">
                    <Share2 className="w-6 h-6 text-white" />
                  </div>
                  {t("publications.modal.publish.title")}
                </div>
              </DialogTitle>
              <button
                onClick={() => onClose(publication.id)}
                className={`p-2 rounded-lg transition-colors ${
                  theme === "dark"
                    ? "hover:bg-neutral-700 text-gray-400"
                    : "hover:bg-gray-100 text-gray-500"
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              className={`mb-6 p-4 rounded-lg ${
                theme === "dark" ? "bg-neutral-900/50" : "bg-gray-50"
              }`}
            >
              <h3
                className={`font-semibold mb-1 ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                {publication.title}
              </h3>
              <p
                className={`text-sm ${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {publication.description}
              </p>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h4
                  className={`font-semibold ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}
                >
                  {t("publications.modal.publish.selectPlatforms")}
                </h4>
                <div className="flex gap-2">
                  <button
                    onClick={selectAll}
                    className="text-sm text-primary-500 hover:text-primary-600 font-medium"
                  >
                    {t("publications.modal.publish.selectAll")}
                  </button>
                  <span
                    className={
                      theme === "dark" ? "text-gray-600" : "text-gray-400"
                    }
                  >
                    |
                  </span>
                  <button
                    onClick={deselectAll}
                    className="text-sm text-primary-500 hover:text-primary-600 font-medium"
                  >
                    {t("publications.modal.publish.deselectAll")}
                  </button>
                </div>
              </div>

              {connectedAccounts.length === 0 ? (
                <div
                  className={`text-center py-8 rounded-lg ${
                    theme === "dark" ? "bg-neutral-900/50" : "bg-gray-50"
                  }`}
                >
                  <p
                    className={`text-sm ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {t("publications.modal.publish.noConnectedAccounts")}
                    <br />
                    {t("publications.modal.publish.connectAccounts")}
                  </p>
                </div>
              ) : (
                <div className="flex justify-between items-center gap-2">
                  {connectedAccounts.map((account) => {
                    const iconSrc = getPlatformIcon(account.platform);
                    const gradient = getPlatformGradient(account.platform);
                    const isSelected = selectedPlatforms.includes(account.id);
                    const isPublished = publishedPlatforms.includes(account.id);
                    const isFailed = failedPlatforms.includes(account.id);
                    const isRemovedPlatform = removedPlatforms.includes(
                      account.id
                    );
                    const isPublishing = publishingPlatforms.includes(
                      account.id
                    );
                    const isScheduled = scheduledPlatforms.includes(account.id);
                    const isUnpublishing = unpublishing === account.id;

                    return (
                      <div key={account.id} className="relative flex-1 ">
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
                              : theme === "dark"
                              ? "border-neutral-700 hover:border-neutral-600 bg-neutral-900/30"
                              : "border-primary-200 hover:border-primary-300 bg-white"
                          }`}
                        >
                          <div
                            className={`w-12 h-12 rounded-lg  flex items-center justify-center flex-shrink-0 `}
                          >
                            <img src={iconSrc} alt={account.platform} />
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-medium capitalize text-sm">
                              {account.platform}
                            </div>
                            <div
                              className={`text-xs ${
                                theme === "dark"
                                  ? "text-gray-400"
                                  : "text-gray-500"
                              }`}
                            >
                              {account.account_name || account.name}
                            </div>
                          </div>

                          {isPublished && (
                            <div className="flex items-center gap-2">
                              <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                                <CheckCircle className="w-3 h-3" />
                                {t("publications.modal.publish.published")}
                              </span>
                            </div>
                          )}
                          {isPublishing && (
                            <div className="flex items-center gap-2">
                              <span className="flex items-center gap-1 text-xs font-medium text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded-full">
                                <div className="w-3 h-3 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" />
                                {t("publications.modal.publish.publishing")}
                              </span>
                            </div>
                          )}
                          {isScheduled && (
                            <div className="flex items-center gap-2">
                              <span className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                                <Clock className="w-3 h-3" />
                                {t("publications.modal.publish.scheduled")}
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
                            {(isSelected ||
                              isPublished ||
                              isFailed ||
                              isPublishing) && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActivePlatformPreview(account.platform);
                                }}
                                className={`p-1.5 rounded-lg transition-all z-10 ${
                                  theme === "dark"
                                    ? "hover:bg-neutral-700 text-gray-400"
                                    : "hover:bg-gray-100 text-gray-500"
                                }`}
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}

                            {!isPublished && !isPublishing && !isScheduled && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActivePlatformSettings(account.platform);
                                }}
                                className={`p-1.5 rounded-lg transition-all z-10 ${
                                  theme === "dark"
                                    ? "hover:bg-neutral-700 text-gray-400"
                                    : "hover:bg-gray-100 text-gray-500"
                                }`}
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
                                account.platform
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
                  <img src={IconYoutube} className="w-5 h-5" alt="YouTube" />
                  <h4
                    className={`font-semibold ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {t("publications.modal.publish.youtube.youtubeThumbnails")}
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
                        "http"
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
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                  theme === "dark"
                    ? "bg-neutral-700 hover:bg-neutral-600 text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                {t("publications.modal.publish.button.cancel")}
              </button>
              <button
                type="button"
                onClick={handlePublishWithNotifications}
                disabled={publishing || selectedPlatforms.length === 0}
                className="flex-[2] px-4 py-3 rounded-lg font-medium bg-gradient-to-r from-primary-500 to-pink-500 hover:from-primary-600 hover:to-pink-600 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {publishing || publication.status === "publishing" ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {t("publications.modal.publish.publishing")}
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    {t("publications.modal.publish.button.publish")}{" "}
                    {selectedPlatforms.length}{" "}
                    {t("publications.modal.publish.platforms")}
                  </>
                )}
              </button>
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

            <PlatformPreviewModal
              isOpen={!!activePlatformPreview}
              onClose={() => setActivePlatformPreview(null)}
              platform={activePlatformPreview || ""}
              publication={publication}
              settings={
                platformSettings[activePlatformPreview?.toLowerCase() || ""] ||
                {}
              }
              theme={theme}
            />
          </DialogPanel>
        </div>
      </Dialog>
      <ConfirmDialog />
    </>
  );
}
