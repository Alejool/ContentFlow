import PlatformSettingsModal from "@/Components/ConfigSocialMedia/PlatformSettingsModal";
import ApprovalHistoryCompacto from "@/Components/ManageContent/Publication/common/ApprovalHistoryCompacto";
import TimelineCompacto from "@/Components/ManageContent/Publication/common/TimelineCompacto";
import SocialAccountsSection from "@/Components/ManageContent/Publication/common/add/SocialAccountsSection";
import ContentSection from "@/Components/ManageContent/Publication/common/edit/ContentSection";
import MediaUploadSection from "@/Components/ManageContent/Publication/common/edit/MediaUploadSection";
import MediaUploadSkeleton from "@/Components/ManageContent/Publication/common/edit/MediaUploadSkeleton";
import ModalFooter from "@/Components/ManageContent/modals/common/ModalFooter";
import ModalHeader from "@/Components/ManageContent/modals/common/ModalHeader";
import ScheduleSection from "@/Components/ManageContent/modals/common/ScheduleSection";
import YouTubeThumbnailUploader from "@/Components/common/ui/YouTubeThumbnailUploader";
import { usePublicationForm } from "@/Hooks/publication/usePublicationForm";
import { usePublicationLock } from "@/Hooks/usePublicationLock";
import { useCampaignStore } from "@/stores/campaignStore";
import { useAccountsStore } from "@/stores/socialAccountsStore";
import { Publication } from "@/types/Publication";
import { usePage } from "@inertiajs/react";
import { AlertCircle, Save } from "lucide-react";
import { memo, useMemo, useState } from "react";
import { useWatch } from "react-hook-form";
import { Trans } from "react-i18next";

const parseUserAgent = (userAgent?: string): string => {
  if (!userAgent) return "Unknown Device";
  let browser = "Unknown Browser";
  if (userAgent.includes("Firefox")) browser = "Firefox";
  else if (userAgent.includes("Edg")) browser = "Edge";
  else if (userAgent.includes("Chrome")) browser = "Chrome";
  else if (userAgent.includes("Safari") && !userAgent.includes("Chrome"))
    browser = "Safari";
  else if (userAgent.includes("Opera") || userAgent.includes("OPR"))
    browser = "Opera";

  let os = "";
  if (userAgent.includes("Windows")) os = "Windows";
  else if (userAgent.includes("Mac")) os = "macOS";
  else if (userAgent.includes("Linux")) os = "Linux";
  else if (userAgent.includes("Android")) os = "Android";
  else if (
    userAgent.includes("iOS") ||
    userAgent.includes("iPhone") ||
    userAgent.includes("iPad")
  )
    os = "iOS";

  return os ? `${browser} on ${os}` : browser;
};

const maskIpAddress = (ip?: string): string => {
  if (!ip) return "";
  const parts = ip.split(".");
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.x.x`;
  return ip.split(":")[0] + ":...";
};

interface EditPublicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  publication: Publication | null;
  onSubmit: (success: boolean) => void;
}

const EditPublicationModal = ({
  isOpen,
  onClose,
  publication,
  onSubmit,
}: EditPublicationModalProps) => {
  const { campaigns } = useCampaignStore();
  const { accounts: socialAccounts } = useAccountsStore();
  const [isTimelineExpanded, setIsTimelineExpanded] = useState(false);
  const [isApprovalHistoryExpanded, setIsApprovalHistoryExpanded] =
    useState(false);

  const { isLockedByOther, lockInfo } = usePublicationLock(
    publication?.id ?? null,
    isOpen,
  );

  const {
    t,
    form,
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
    accountSchedules,
    setAccountSchedules,
    setValue,
    control,
    isDataReady,
  } = usePublicationForm({
    publication,
    onClose,
    onSubmitSuccess: onSubmit,
    isOpen,
  });

  const { register } = form;

  const selectedSocialAccounts =
    useWatch({ control, name: "social_accounts" }) || [];
  const scheduledAt = useWatch({ control, name: "scheduled_at" });
  const useGlobalSchedule = useWatch({ control, name: "use_global_schedule" });
  const title = useWatch({ control, name: "title" });
  const goal = useWatch({ control, name: "goal" });
  const hashtags = useWatch({ control, name: "hashtags" });
  const campaign_id = useWatch({ control, name: "campaign_id" });

  const watched = useMemo(
    () => ({
      social_accounts: selectedSocialAccounts,
      scheduled_at: scheduledAt,
      use_global_schedule: useGlobalSchedule,
      title,
      goal,
      hashtags,
      campaign_id,
    }),
    [
      selectedSocialAccounts,
      scheduledAt,
      useGlobalSchedule,
      title,
      goal,
      hashtags,
      campaign_id,
    ],
  );

  const stabilizedMediaPreviews = useMemo(() => {
    return mediaFiles.map((m) => ({
      ...m,
      url: m.url,
    }));
  }, [mediaFiles]);

  const hasPublishedPlatform = useMemo(() => {
    return publication?.social_post_logs?.some(
      (log: any) => log.status === "published",
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

  const hasYouTubeAccount = selectedSocialAccounts.some((id: number) => {
    const account = socialAccounts.find((a) => a.id === id);
    return account?.platform?.toLowerCase() === "youtube";
  });

  const { auth } = usePage<any>().props;
  const canManage =
    auth.current_workspace?.permissions?.includes("manage-content");
  const isDisabled = isLockedByOther || !canManage;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center sm:p-6 text-gray-900 dark:text-white transition-opacity duration-200 ${isOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"}`}
    >
      <div
        className="absolute inset-0 bg-gray-900/60 dark:bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative w-full max-w-4xl bg-white dark:bg-neutral-800 rounded-lg shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300">
        <ModalHeader
          t={t}
          onClose={handleClose}
          title={
            canManage
              ? "publications.modal.edit.title"
              : "publications.modal.show.title"
          }
          subtitle={
            canManage
              ? "publications.modal.edit.subtitle"
              : "publications.modal.show.subtitle"
          }
        />

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <form
            id="edit-publication-form"
            onSubmit={handleSubmit}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
              <div className="space-y-6">
                {isLockedByOther && (
                  <div className="p-4 mb-6 rounded-lg border border-amber-500 bg-amber-50 dark:bg-amber-900/20 flex gap-3 text-sm text-amber-700 dark:text-amber-300 animate-in shake duration-500">
                    <AlertCircle className="w-5 h-5 shrink-0 text-amber-500" />
                    <div>
                      <p className="font-semibold mb-1">
                        {lockInfo?.locked_by === "session"
                          ? t("publications.modal.edit.lockedBySession") ||
                            "Sesión Duplicada"
                          : t("publications.modal.edit.lockedByOther") ||
                            "Publicación Bloqueada"}
                      </p>
                      <p className="opacity-80">
                        {lockInfo?.locked_by === "session" ? (
                          <>
                            <Trans
                              i18nKey="publications.modal.edit.locking.sessionMessage"
                              values={{
                                browser: parseUserAgent(lockInfo?.user_agent),
                              }}
                              components={{
                                1: <span className="font-medium" />,
                              }}
                            />
                            {lockInfo?.ip_address && (
                              <span className="text-xs opacity-70">
                                {" "}
                                ({maskIpAddress(lockInfo.ip_address)})
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <Trans
                              i18nKey="publications.modal.edit.locking.userMessage"
                              values={{
                                user: lockInfo?.user_name,
                                browser: parseUserAgent(lockInfo?.user_agent),
                              }}
                              components={{
                                1: <span className="font-medium" />,
                              }}
                            />
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                )}

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

                {!isDataReady ? (
                  <MediaUploadSkeleton />
                ) : (
                  <MediaUploadSection
                    mediaPreviews={stabilizedMediaPreviews}
                    thumbnails={thumbnails}
                    imageError={imageError}
                    isDragOver={isDragOver}
                    t={t}
                    onFileChange={handleFileChange}
                    onRemoveMedia={handleRemoveMedia}
                    onSetThumbnail={(tempId, file) =>
                      setThumbnail(tempId, file)
                    }
                    onClearThumbnail={(tempId) => clearThumbnail(tempId)}
                    onDragOver={() => setIsDragOver(true)}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragOver(false);
                      handleFileChange(e.dataTransfer.files);
                    }}
                    disabled={hasPublishedPlatform || isDisabled}
                  />
                )}

                <SocialAccountsSection
                  socialAccounts={socialAccounts as any}
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
                  globalSchedule={watched.scheduled_at ?? undefined}
                  publishedAccountIds={publishedAccountIds}
                  publishingAccountIds={publishingAccountIds}
                  error={errors.social_accounts?.message as string}
                  disabled={isDisabled}
                />

                <ScheduleSection
                  scheduledAt={watched.scheduled_at ?? undefined}
                  t={t}
                  onScheduleChange={(date) => setValue("scheduled_at", date)}
                  useGlobalSchedule={watched.use_global_schedule}
                  onGlobalScheduleToggle={(val) =>
                    setValue("use_global_schedule", val)
                  }
                  error={errors.scheduled_at?.message as string}
                  disabled={isDisabled}
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
                        publication?.media_files?.find(
                          (m) =>
                            m.file_type === "video" ||
                            m.mime_type?.startsWith("video/"),
                        )?.file_name
                      }
                      existingThumbnail={(() => {
                        const video = mediaFiles.find(
                          (m) => m.type === "video",
                        );
                        return video?.thumbnailUrl
                          ? { url: video.thumbnailUrl, id: video.id || 0 }
                          : null;
                      })()}
                      onThumbnailChange={(file: File | null) => {
                        const video = mediaFiles.find(
                          (m) => m.type === "video",
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
                          (m) => m.type === "video",
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
                  disabled={hasPublishedPlatform || isDisabled}
                />

                {publication?.approval_logs &&
                  publication.approval_logs.length > 0 && (
                    <ApprovalHistoryCompacto
                      logs={publication.approval_logs}
                      isExpanded={isApprovalHistoryExpanded}
                      onToggle={() =>
                        setIsApprovalHistoryExpanded(!isApprovalHistoryExpanded)
                      }
                    />
                  )}

                {publication?.activities &&
                  publication.activities.length > 0 && (
                    <TimelineCompacto
                      activities={publication.activities}
                      isExpanded={isTimelineExpanded}
                      onToggle={() =>
                        setIsTimelineExpanded(!isTimelineExpanded)
                      }
                    />
                  )}
              </div>
            </div>
          </form>
        </div>
        <ModalFooter
          onClose={handleClose}
          isSubmitting={isSubmitting || isDisabled}
          formId="edit-publication-form"
          submitText={t("publications.button.edit") || "Edit Publication"}
          submitIcon={<Save className="w-4 h-4" />}
          cancelText={t("common.cancel") || "Close"}
          hideSubmit={!canManage}
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
      </div>
    </div>
  );
};

export default memo(EditPublicationModal);
