import { useMemo } from "react";
// Hooks
import { usePublicationForm } from "@/Hooks/publication/usePublicationForm";
// Stores
import { useCampaignStore } from "@/stores/campaignStore";
import { useAccountsStore } from "@/stores/socialAccountsStore";
// Type
import { Publication } from "@/types/Publication";
// Componentes
import PlatformSettingsModal from "@/Components/ConfigSocialMedia/PlatformSettingsModal";
import SocialAccountsSection from "@/Components/ManageContent/Publication/common/add/SocialAccountsSection";
import ContentSection from "@/Components/ManageContent/Publication/common/edit/ContentSection";
import MediaUploadSection from "@/Components/ManageContent/Publication/common/edit/MediaUploadSection";
import ModalFooter from "@/Components/ManageContent/modals/common/ModalFooter";
import ModalHeader from "@/Components/ManageContent/modals/common/ModalHeader";
import PlatformPreviewModal from "@/Components/ManageContent/modals/common/PlatformPreviewModal";
import ScheduleSection from "@/Components/ManageContent/modals/common/ScheduleSection";
import YouTubeThumbnailUploader from "@/Components/common/ui/YouTubeThumbnailUploader";
import { AlertCircle, Save } from "lucide-react";

interface EditPublicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  publication: Publication | null;
  onSubmit: (success: boolean) => void;
}

export default function EditPublicationModal({
  isOpen,
  onClose,
  publication,
  onSubmit,
}: EditPublicationModalProps) {
  const { campaigns } = useCampaignStore();
  const { accounts: socialAccounts } = useAccountsStore();

  const {
    t,
    form,
    watched,
    errors,
    isSubmitting,
    isDragOver,
    setIsDragOver,
    mediaFiles,
    imageError,
    videoMetadata,
    thumbnails,
    setThumbnail,
    clearThumbnail,
    setVideoMetadata,
    handleFileChange,
    handleRemoveMedia,
    handleHashtagChange,
    handleAccountToggle,
    handleClose,
    handleSubmit,
    platformSettings,
    setPlatformSettings,
    activePlatformSettings,
    setActivePlatformSettings,
    activePlatformPreview,
    setActivePlatformPreview,
    accountSchedules,
    setAccountSchedules,
    setValue,
  } = usePublicationForm({
    publication,
    onClose,
    onSubmitSuccess: onSubmit,
    isOpen,
  });

  const { register } = form;

  const hasPublishedPlatform = useMemo(() => {
    return publication?.social_post_logs?.some(
      (log: any) => log.status === "published"
    );
  }, [publication]);

  const publishedAccountIds = useMemo(() => {
    return (
      publication?.social_post_logs
        ?.filter((log: any) => log.status === "published")
        .map((log: any) => log.social_account_id) || []
    );
  }, [publication]);

  const publishingAccountIds = useMemo(() => {
    return (
      publication?.social_post_logs
        ?.filter((log: any) => log.status === "publishing")
        .map((log: any) => log.social_account_id) || []
    );
  }, [publication]);

  if (!isOpen || !publication) return null;

  const hasYouTubeAccount = watched.social_accounts?.some((id: number) => {
    const account = socialAccounts.find((a) => a.id === id);
    return account?.platform?.toLowerCase() === "youtube";
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center sm:p-6 text-gray-900 dark:text-white"
    >
      <div
        className="absolute inset-0 bg-gray-900/60 dark:bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div
        className="relative w-full max-w-4xl bg-white dark:bg-neutral-800 rounded-lg shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300"
      >
        <ModalHeader
          t={t}
          onClose={handleClose}
          title="publications.modal.edit.title"
          subtitle="publications.modal.edit.subtitle"
        />

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <form
            id="edit-publication-form"
            onSubmit={handleSubmit}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
              <div className="space-y-6">
                {hasPublishedPlatform && (
                  <div className="p-4 mb-6 rounded-lg border border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 flex gap-3 text-sm text-blue-700 dark:text-blue-300 animate-in fade-in slide-in-from-top-4">
                    <AlertCircle className="w-5 h-5 shrink-0 text-blue-500" />
                    <div>
                      <p className="font-semibold mb-1">
                        {t("publications.modal.edit.contentLocked") ||
                          "Content Locked"}
                      </p>
                      <p className="opacity-80">
                        {t("publications.modal.edit.contentLockedHint") ||
                          "This publication is live on some platforms. While you can update schedules and thumbnails, core content (title/description) is locked. To edit everything, unpublish from all platforms."}
                      </p>
                    </div>
                  </div>
                )}

                <MediaUploadSection
                  mediaPreviews={mediaFiles.map((m) => ({
                    ...m,
                    url: m.url,
                  }))}
                  thumbnails={thumbnails}
                  imageError={imageError}
                  isDragOver={isDragOver}
                  t={t}
                  onFileChange={handleFileChange}
                  onRemoveMedia={handleRemoveMedia}
                  onSetThumbnail={(tempId, file) => setThumbnail(tempId, file)}
                  onClearThumbnail={(tempId) => clearThumbnail(tempId)}
                  onDragOver={() => setIsDragOver(true)}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    handleFileChange(e.dataTransfer.files);
                  }}
                  disabled={hasPublishedPlatform}
                />

                <SocialAccountsSection
                  socialAccounts={socialAccounts}
                  selectedAccounts={watched.social_accounts || []}
                  accountSchedules={accountSchedules}
                  t={t}
                  onAccountToggle={handleAccountToggle}
                  onScheduleChange={(id, date) =>
                    setAccountSchedules((prev) => ({ ...prev, [id]: date }))
                  }
                  onScheduleRemove={(id) =>
                    setAccountSchedules((prev) => {
                      const n = { ...prev };
                      delete n[id];
                      return n;
                    })
                  }
                  onPlatformSettingsClick={(platform) =>
                    setActivePlatformSettings(platform)
                  }
                  onPreviewClick={(platform) =>
                    setActivePlatformPreview(platform)
                  }
                  globalSchedule={watched.scheduled_at ?? undefined}
                  publishedAccountIds={publishedAccountIds}
                  publishingAccountIds={publishingAccountIds}
                  error={errors.social_accounts?.message as string}
                />

                <ScheduleSection
                  scheduledAt={watched.scheduled_at ?? undefined}
                  t={t}
                  onScheduleChange={(date) => setValue("scheduled_at", date)}
                />

                {hasYouTubeAccount && (
                  <div className="mt-6">
                    <YouTubeThumbnailUploader
                      videoId={
                        mediaFiles.find((m) => m.type === "video")?.id || 0
                      }
                      videoPreviewUrl={
                        mediaFiles.find((m) => m.type === "video")?.url
                      }
                      videoFileName={
                        publication.media_files?.find(
                          (m) =>
                            m.file_type === "video" ||
                            m.mime_type?.startsWith("video/")
                        )?.file_name
                      }
                      existingThumbnail={(() => {
                        const video = mediaFiles.find(
                          (m) => m.type === "video"
                        );
                        return video?.thumbnailUrl
                          ? { url: video.thumbnailUrl, id: video.id || 0 }
                          : null;
                      })()}
                      onThumbnailChange={(file: File | null) => {
                        const video = mediaFiles.find(
                          (m) => m.type === "video"
                        );
                        if (video) {
                          if (file) {
                            setThumbnail(video.tempId, file);
                          } else {
                            clearThumbnail(video.tempId);
                          }
                        }
                      }}
                      onThumbnailDelete={() => {
                        const video = mediaFiles.find(
                          (m) => m.type === "video"
                        );
                        if (video) clearThumbnail(video.tempId);
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <ContentSection
                  register={register}
                  setValue={setValue}
                  errors={errors}
                  watched={watched}
                  t={t}
                  campaigns={campaigns}
                  publication={publication}
                  onHashtagChange={handleHashtagChange}
                  disabled={hasPublishedPlatform}
                />
              </div>
            </div>
          </form>
        </div>
        <ModalFooter
          onClose={handleClose}
          isSubmitting={isSubmitting}
          formId="edit-publication-form"
          submitText={t("publications.button.edit") || "Edit Publication"}
          submitIcon={<Save className="w-4 h-4" />}
          cancelText={t("common.cancel") || "Close"}
        />

        <PlatformSettingsModal
          isOpen={!!activePlatformSettings}
          onClose={() => setActivePlatformSettings(null)}
          platform={activePlatformSettings || ""}
          settings={
            platformSettings[activePlatformSettings?.toLowerCase() || ""] || {}
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
          publication={{
            ...publication,
            ...watched,
            media: mediaFiles.map((m) => ({
              preview: m.url,
              file_type: m.type,
            })),
          }}
          settings={
            platformSettings[activePlatformPreview?.toLowerCase() || ""] || {}
          }
        />
      </div>
    </div>
  );
}
