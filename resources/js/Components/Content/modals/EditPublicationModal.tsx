import PlatformSettingsModal from "@/Components/ConfigSocialMedia/PlatformSettingsModal";
import { CommentsSection } from "@/Components/Content/Publication/comments/CommentsSection";
import ApprovalHistoryCompacto from "@/Components/Content/Publication/common/ApprovalHistoryCompacto";
import TimelineCompacto from "@/Components/Content/Publication/common/TimelineCompacto";
import SocialAccountsSection from "@/Components/Content/Publication/common/add/SocialAccountsSection";
import ContentSection from "@/Components/Content/Publication/common/edit/ContentSection";
import { LivePreviewSection } from "@/Components/Content/Publication/common/edit/LivePreviewSection";
import MediaUploadSection from "@/Components/Content/Publication/common/edit/MediaUploadSection";
import MediaUploadSkeleton from "@/Components/Content/Publication/common/edit/MediaUploadSkeleton";
import ModalFooter from "@/Components/Content/modals/common/ModalFooter";
import ModalHeader from "@/Components/Content/modals/common/ModalHeader";
import ScheduleSection from "@/Components/Content/modals/common/ScheduleSection";
import YouTubeThumbnailUploader from "@/Components/common/ui/YouTubeThumbnailUploader";
import { usePublicationForm } from "@/Hooks/publication/usePublicationForm";
import { usePublicationLock } from "@/Hooks/usePublicationLock";
import { useCampaignStore } from "@/stores/campaignStore";
import { useAccountsStore } from "@/stores/socialAccountsStore";
import { useUploadQueue } from "@/stores/uploadQueueStore";
import { Publication } from "@/types/Publication";
import { usePage } from "@inertiajs/react";
import { AlertCircle, Lock, Save } from "lucide-react";
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

  const { isLockedByMe, isLockedByOther, lockInfo, activeUsers } =
    usePublicationLock(publication?.id ?? null, isOpen);

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
    uploadProgress,
    uploadStats,
    uploadErrors,
    isS3Uploading: uploading,
    isAnyMediaProcessing,
    remoteLock,
    publishedAccountIds,
    publishingAccountIds,
    updateFile: baseUpdateFile,
    uploadFile,
  } = usePublicationForm({
    publication,
    onClose,
    onSubmitSuccess: onSubmit,
    isOpen,
  });

  const updateFile = async (tempId: string, file: File) => {
    // 1. Update the store immediately with the new local URL for preview
    const localUrl = URL.createObjectURL(file);
    baseUpdateFile(tempId, {
      file,
      url: localUrl,
      status: "uploading",
      isNew: true,
    });

    // 2. Trigger the S3 upload
    try {
      const result = await uploadFile(file, tempId);
      // If it's an existing publication, ensure it's linked
      if (publication?.id) {
        const { linkUploadToPublication } = useUploadQueue.getState();
        linkUploadToPublication(tempId, publication.id, publication.title);
      }
      return result;
    } catch (err) {
      }
  };

  const { register } = form;

  const selectedSocialAccounts =
    useWatch({ control, name: "social_accounts" }) || [];
  const scheduledAt = useWatch({ control, name: "scheduled_at" });
  const useGlobalSchedule = useWatch({ control, name: "use_global_schedule" });
  const title = useWatch({ control, name: "title" });
  const goal = useWatch({ control, name: "goal" });
  const hashtags = useWatch({ control, name: "hashtags" });
  const campaign_id = useWatch({ control, name: "campaign_id" });
  const description = useWatch({ control, name: "description" });

  const watched = useMemo(
    () => ({
      social_accounts: selectedSocialAccounts,
      scheduled_at: scheduledAt,
      use_global_schedule: useGlobalSchedule,
      title,
      goal,
      hashtags,
      campaign_id,
      description,
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

  const hasYouTubeAccount = selectedSocialAccounts.some((id: number) => {
    const account = socialAccounts.find((a) => a.id === id);
    return account?.platform?.toLowerCase() === "youtube";
  });

  const { auth } = usePage<any>().props;
  const canManage = auth.current_workspace?.permissions?.includes("content");

  // Partial locking:
  // - Global lock: only if another user has the lock
  const isLockedByOtherEditor = isLockedByOther;

  // - Media section lock: if another user has lock OR media is processing OR pending review
  const isPendingReview = publication?.status === "pending_review";
  const isMediaSectionDisabled =
    isLockedByOtherEditor || isAnyMediaProcessing || !canManage || isPendingReview;

  // - Content/Settings section lock: ONLY if another user has lock OR pending review
  const isContentSectionDisabled = isLockedByOtherEditor || !canManage || isPendingReview;

  const canPublish = auth.current_workspace?.permissions?.includes("publish");

  // Strict check on status to avoid stale approved_at dates on failed posts
  const isApprovedStatus =
    publication?.status === "approved" || publication?.status === "scheduled";

  // Check ownership
  const isOwner = publication?.user_id === auth.user.id;

  // Configuration allowed:
  // 1. Admin/Owner (canPublish): Always allowed
  // 2. Editor (!canPublish): Allowed if publication is Approved (regardless of ownership)
  // Note: Editing an approved publication will revert it to 'pending' status (handled by backend)
  const allowConfiguration = canPublish || isApprovedStatus;

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
          rightElement={
            <div className="flex -space-x-2 overflow-hidden mr-2 p-2">
              {activeUsers.map((user: any) => {
                const isTheLocker = lockInfo?.user_id === user.id;
                return (
                  <div
                    key={user.id}
                    className={`inline-block h-7 w-7 rounded-full ring-2 ${isTheLocker ? "ring-primary-500 z-10" : "ring-white dark:ring-neutral-800"} bg-gray-200 dark:bg-neutral-700 flex-shrink-0 relative`}
                    title={
                      user.name + (isTheLocker ? " (Editando)" : " (Viendo)")
                    }
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-xs font-bold text-gray-500 uppercase">
                        {user.name.charAt(0)}
                      </div>
                    )}
                    {isTheLocker && (
                      <div className="absolute -bottom-0.5 -right-0.5 bg-amber-500 rounded-full p-0.5 shadow-sm">
                        <Lock className="w-2 h-2 text-white" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          }
        />

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <form
            id="edit-publication-form"
            onSubmit={handleSubmit}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
              <div className="space-y-6">
                {!isLockedByMe && isLockedByOther && !hasPublishedPlatform && allowConfiguration && publication?.status !== "approved" && (
                  <div className="p-4 mb-6 rounded-lg border border-amber-500 bg-amber-50 dark:bg-amber-900/20 flex gap-3 text-sm text-amber-700 dark:text-amber-300 animate-in shake duration-500">
                    <AlertCircle className="w-5 h-5 shrink-0 text-amber-500" />
                    <div>
                      <p className="font-semibold mb-1">
                        {lockInfo?.locked_by === "session"
                          ? t("publications.modal.edit.lockedBySession") ||
                            "Sesión Duplicada"
                          : t("publications.modal.edit.lockedByOther") ||
                            "En cola de espera"}
                      </p>
                      <div className="opacity-80">
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
                            <p className="mt-1 font-medium text-amber-600 dark:text-amber-400">
                              Tomarás el control automáticamente cuando se
                              libere.
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {isLockedByMe && activeUsers.length > 1 && (
                  <div className="p-3 mb-6 rounded-lg border border-blue-500 bg-blue-50 dark:bg-blue-900/20 flex gap-2 text-xs text-blue-700 dark:text-blue-300">
                    <Lock className="w-4 h-4 shrink-0" />
                    <p>
                      <strong>Eres el editor actual.</strong> Hay{" "}
                      {activeUsers.length - 1} usuario(s) en espera para cuando
                      termines.
                    </p>
                  </div>
                )}

                {publication?.status === "pending_review" && (
                  <div className="p-4 mb-6 rounded-lg border border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 flex gap-3 text-sm animate-in fade-in slide-in-from-top-4">
                    <AlertCircle className="w-5 h-5 shrink-0 text-yellow-500" />
                    <div>
                      <p className="font-semibold mb-1">
                        {t("publications.modal.edit.pendingReviewWarning") ||
                          "Publicación en Revisión"}
                      </p>
                      <p className="opacity-90">
                        {t("publications.modal.edit.pendingReviewWarningHint") ||
                          "Esta publicación está esperando aprobación. Debes aprobarla o rechazarla antes de poder editarla. Si la rechazas, el creador podrá hacer cambios y volver a solicitar aprobación."}
                      </p>
                    </div>
                  </div>
                )}

                {publication?.status === "approved" && !hasPublishedPlatform && (
                  <div className="p-4 mb-6 rounded-lg border border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 flex gap-3 text-sm animate-in fade-in slide-in-from-top-4">
                    <AlertCircle className="w-5 h-5 shrink-0 text-blue-500" />
                    <div>
                      <p className="font-semibold mb-1">
                        {t("publications.modal.edit.approvedEditWarning") ||
                          "Publicación Aprobada"}
                      </p>
                      <p className="opacity-80">
                        {t("publications.modal.edit.approvedEditWarningHint") ||
                          "Esta publicación ya fue aprobada. Si realizas cambios, volverá a estado 'Pendiente' y requerirá una nueva aprobación."}
                      </p>
                    </div>
                  </div>
                )}

                {hasPublishedPlatform && (
                  <div className="p-4 mb-6 rounded-lg border border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 flex gap-3 text-sm animate-in fade-in slide-in-from-top-4">
                    <AlertCircle className="w-5 h-5 shrink-0 text-blue-500" />
                    <div>
                      <p className="font-semibold mb-1">
                        {t("publications.modal.edit.contentLocked") ||
                          "Publication partially live"}
                      </p>
                      <p className="opacity-80">
                        {t("publications.modal.edit.contentLockedHint") ||
                          "This publication is live on some platforms. Changes will apply to pending and future uploads."}
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
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDragOver(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDragOver(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDragOver(false);
                      handleFileChange(e.dataTransfer.files);
                    }}
                    disabled={hasPublishedPlatform || isMediaSectionDisabled}
                    isAnyMediaProcessing={isAnyMediaProcessing}
                    uploadProgress={uploadProgress}
                    uploadStats={uploadStats}
                    uploadErrors={uploadErrors}
                    lockedBy={remoteLock}
                    onUpdateFile={updateFile}
                  />
                )}

                <div
                  className={`transition-opacity duration-200 ${!allowConfiguration || isContentSectionDisabled ? "opacity-50 pointer-events-none grayscale-[0.5]" : ""}`}
                >
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
                    disabled={isContentSectionDisabled || !allowConfiguration}
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
                    disabled={isContentSectionDisabled || !allowConfiguration}
                  />
                </div>

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

              <div className="space-y-6 h-full flex flex-col">
                <ContentSection
                  register={register}
                  setValue={setValue}
                  errors={errors}
                  watched={watched}
                  t={t}
                  campaigns={campaigns}
                  publication={publication}
                  onHashtagChange={handleHashtagChange}
                  disabled={hasPublishedPlatform || isContentSectionDisabled}
                />

                <LivePreviewSection
                  content={`${watched.description || ""}\n\n${
                    watched.hashtags
                      ? Array.isArray(watched.hashtags)
                        ? watched.hashtags.join(' ')
                        : watched.hashtags
                      : ""
                  }`}
                  mediaUrls={stabilizedMediaPreviews.map((m) => m.url)}
                  user={{
                    name: auth.user.name,
                    username: auth.user.email.split("@")[0],
                    avatar: auth.user.photo_url,
                  }}
                  publishedLinks={publication?.social_post_logs?.reduce((acc: Record<string, string>, log: any) => {
                    if (log.status === 'published' && log.post_url && log.platform) {
                      acc[log.platform.toLowerCase()] = log.post_url;
                    }
                    return acc;
                  }, {})}
                />

                {publication?.id && (
                  <CommentsSection
                    publicationId={publication.id}
                    currentUser={auth.user}
                  />
                )}

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
          isSubmitting={isSubmitting || isContentSectionDisabled}
          formId="edit-publication-form"
          submitText={
            uploading
              ? t("publications.modal.button.saveBackground", {
                  defaultValue: "Save & Background Upload",
                })
              : t("publications.button.edit") || "Edit Publication"
          }
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
