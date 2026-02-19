import PlatformSettingsModal from "@/Components/ConfigSocialMedia/PlatformSettingsModal";
import { CommentsSection } from "@/Components/ManageContent/Publication/comments/CommentsSection";
import ApprovalHistoryCompacto from "@/Components/ManageContent/Publication/common/ApprovalHistoryCompacto";
import TimelineCompacto from "@/Components/ManageContent/Publication/common/TimelineCompacto";
import SocialAccountsSection from "@/Components/ManageContent/Publication/common/add/SocialAccountsSection";
import ContentSection from "@/Components/ManageContent/Publication/common/edit/ContentSection";
import { LivePreviewSection } from "@/Components/ManageContent/Publication/common/edit/LivePreviewSection";
import MediaUploadSection from "@/Components/ManageContent/Publication/common/edit/MediaUploadSection";
import MediaUploadSkeleton from "@/Components/ManageContent/Publication/common/edit/MediaUploadSkeleton";
import ModalFooter from "@/Components/ManageContent/modals/common/ModalFooter";
import ModalHeader from "@/Components/ManageContent/modals/common/ModalHeader";
import ScheduleSection from "@/Components/ManageContent/modals/common/ScheduleSection";
import YouTubeThumbnailUploader from "@/Components/common/ui/YouTubeThumbnailUploader";
import { usePublicationForm } from "@/Hooks/publication/usePublicationForm";
import { usePublicationLock } from "@/Hooks/usePublicationLock";
import { useCampaignStore } from "@/stores/campaignStore";
import { usePublicationStore } from "@/stores/publicationStore";
import { useAccountsStore } from "@/stores/socialAccountsStore";
import { useUploadQueue } from "@/stores/uploadQueueStore";
import { Publication } from "@/types/Publication";
import { usePage } from "@inertiajs/react";
import { AlertCircle, Lock, Save } from "lucide-react";
import { memo, useEffect, useMemo, useState } from "react";
import { useWatch } from "react-hook-form";
import { Trans } from "react-i18next";
import PublicationStatusTimeline from "../Publication/common/PublicationStatusTimeline";

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
    handleFileChange,
    handleRemoveMedia,

    handleHashtagChange,
    handleAccountToggle,
    handleClose,
    handleCancelPublication,
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
    durationErrors,
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
      console.error("Failed to upload cropped image", err);
    }
  };

  const { register } = form;

  const selectedSocialAccounts =
    useWatch({ control, name: "social_accounts" }) || [];
  const scheduledAt = useWatch({ control, name: "scheduled_at" });
  const useGlobalSchedule = useWatch({ control, name: "use_global_schedule" });
  const title = useWatch({ control, name: "title" });
  const description = useWatch({ control, name: "description" });
  const goal = useWatch({ control, name: "goal" });
  const hashtags = useWatch({ control, name: "hashtags" });
  const campaign_id = useWatch({ control, name: "campaign_id" });

  const watched = useMemo(
    () => ({
      social_accounts: selectedSocialAccounts,
      scheduled_at: scheduledAt,
      use_global_schedule: useGlobalSchedule,
      title,
      description,
      goal,
      hashtags,
      campaign_id,
    }),
    [
      selectedSocialAccounts,
      scheduledAt,
      useGlobalSchedule,
      title,
      description,
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

  const { publishedPlatforms, publishingPlatforms, failedPlatforms } =
    usePublicationStore();

  const fetchPublishedPlatformsFromStore = usePublicationStore(
    (s) => s.fetchPublishedPlatforms,
  );

  const { auth } = usePage<any>().props;
  const user = auth.user;
  const canManage =
    auth.current_workspace?.permissions?.includes("manage-content");

  // Fetch published platforms when modal opens
  useEffect(() => {
    if (isOpen && publication?.id) {
      fetchPublishedPlatformsFromStore(publication.id);
    }
  }, [isOpen, publication?.id, fetchPublishedPlatformsFromStore]);

  const publishedAccountIds = useMemo(() => {
    const fromStore = publishedPlatforms[publication?.id ?? 0] || [];
    const fromLogs =
      publication?.social_post_logs
        ?.filter((log: any) => log.status === "published")
        .map((log: any) => log.social_account_id) || [];
    return Array.from(new Set([...fromStore, ...fromLogs]));
  }, [publication, publishedPlatforms]);

  const publishingAccountIds = useMemo(() => {
    const fromStore = publishingPlatforms[publication?.id ?? 0] || [];
    const fromLogs =
      publication?.social_post_logs
        ?.filter((log: any) => log.status === "publishing")
        .map((log: any) => log.social_account_id) || [];

    return Array.from(new Set([...fromStore, ...fromLogs]));
  }, [publication, publishingPlatforms]);

  const failedAccountIds = useMemo(() => {
    const fromStore = failedPlatforms[publication?.id ?? 0] || [];
    const fromLogs =
      publication?.social_post_logs
        ?.filter((log: any) => log.status === "failed")
        .map((log: any) => log.social_account_id) || [];
    return Array.from(new Set([...fromStore, ...fromLogs]));
  }, [publication, failedPlatforms]);

  const selectedPlatforms = useMemo(() => {
    return Array.from(
      new Set(
        selectedSocialAccounts
          .map((id: number) => {
            const account = socialAccounts.find((a) => a.id === id);
            return account?.platform;
          })
          .filter(Boolean),
      ),
    );
  }, [selectedSocialAccounts, socialAccounts]);

  const allPlatformSettings = useMemo(() => {
    const settings: Record<string, any> = {};
    selectedPlatforms.forEach((platform) => {
      const platformKey = platform.toLowerCase();
      settings[platformKey] = platformSettings[platformKey] || {};
    });
    return settings;
  }, [selectedPlatforms, platformSettings]);

  const hasYouTubeAccount = selectedSocialAccounts.some((id: number) => {
    const account = socialAccounts.find((a) => a.id === id);
    return account?.platform?.toLowerCase() === "youtube";
  });

  // Partial locking:
  // - Global lock: only if another user has the lock
  const isLockedByOtherEditor = isLockedByOther;

  // - Media section lock: if another user has lock OR media is processing
  const isMediaSectionDisabled =
    isLockedByOtherEditor || isAnyMediaProcessing || !canManage;

  // - Content/Settings section lock: ONLY if another user has lock
  const isContentSectionDisabled = isLockedByOtherEditor || !canManage;

  const canPublish = auth.current_workspace?.permissions?.includes("publish");

  // Strict check on status to avoid stale approved_at dates on failed posts
  const isApprovedStatus =
    publication?.status === "approved" || publication?.status === "scheduled";

  // Check ownership
  const isOwner = publication?.user_id === auth.user.id;

  // Configuration allowed:
  // 1. Admin/Owner (canPublish): Always allowed
  // 2. Editor (!canPublish): Allowed if publication is Approved (regardless of ownership)
  const allowConfiguration = canPublish || isApprovedStatus;

  const previewContent = useMemo(() => {
    let text = watched.description || "";
    if (watched.hashtags) {
      const formattedHashtags = Array.isArray(watched.hashtags)
        ? watched.hashtags.join(' ')
        : watched.hashtags;
      text += `\n\n${formattedHashtags}`;
    }
    return text;
  }, [watched.description, watched.hashtags]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center sm:p-6 text-gray-900 dark:text-white transition-opacity duration-200 ${isOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"}`}
    >
      <div
        className="absolute inset-0 bg-gray-900/60 dark:bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative w-full max-w-5xl bg-white dark:bg-neutral-800 rounded-lg shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300">
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
                    className={`inline-block h-7 w-7 rounded-full ring-2 ${isTheLocker ? "ring-amber-500 z-10" : "ring-white dark:ring-neutral-800"} bg-gray-200 dark:bg-neutral-700 flex-shrink-0 relative`}
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
              {/* Left Column: Media & Content */}
              <div className="space-y-6">
                {/* Media Section */}
                <div>
                  {!isLockedByMe && isLockedByOther && (
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
                        {activeUsers.length - 1} usuario(s) en espera para
                        cuando termines.
                      </p>
                    </div>
                  )}

                  {(hasPublishedPlatform || !allowConfiguration) && (
                    <div
                      className={`p-4 mb-6 rounded-lg border flex gap-3 text-sm animate-in fade-in slide-in-from-top-4 ${
                        hasPublishedPlatform
                          ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                          : "border-amber-500 bg-amber-50/50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300"
                      }`}
                    >
                      <AlertCircle
                        className={`w-5 h-5 shrink-0 ${
                          hasPublishedPlatform
                            ? "text-blue-500"
                            : "text-amber-500"
                        }`}
                      />
                      <div>
                        <p className="font-semibold mb-1">
                          {hasPublishedPlatform
                            ? t("publications.modal.edit.contentLocked") ||
                              "Publication partially live"
                            : t(
                                "publications.modal.edit.configurationLocked",
                              ) || "Configuración Bloqueada"}
                        </p>
                        <p className="opacity-80">
                          {hasPublishedPlatform
                            ? t("publications.modal.edit.contentLockedHint") ||
                              "This publication is live on some platforms. Changes will apply to pending and future uploads."
                            : t(
                                "publications.modal.edit.configurationLockedHint",
                              ) ||
                              "Necesitas aprobación para configurar las redes y la programación. Solicita una revisión primero."}
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
                      onUpdateFile={updateFile}
                      onDragOver={() => setIsDragOver(true)}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragOver(false);
                        handleFileChange(e.dataTransfer.files);
                      }}
                      disabled={hasPublishedPlatform || isMediaSectionDisabled}
                      isAnyMediaProcessing={isAnyMediaProcessing}
                      uploadProgress={uploadProgress}
                      uploadStats={uploadStats}
                      uploadErrors={uploadErrors}
                      lockedBy={remoteLock}
                      videoMetadata={videoMetadata}
                      publicationId={publication?.id}
                      allMediaFiles={publication?.media_files || []}
                    />
                  )}

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

                {/* Content Section */}
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

                {/* Comments Section */}
                {publication?.id && (
                  <div className="pt-6 border-t border-gray-200 dark:border-neutral-700">
                    <CommentsSection
                      publicationId={publication.id}
                      currentUser={auth.user}
                    />
                  </div>
                )}
              </div>

              {/* Right Column: Social, Schedule, Preview, History */}
              <div className="space-y-6">
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
                    failedAccountIds={failedAccountIds}
                    onCancel={handleCancelPublication}
                    error={errors.social_accounts?.message as string}
                    durationErrors={durationErrors}
                    videoMetadata={videoMetadata}
                    mediaFiles={mediaFiles}
                    disabled={isContentSectionDisabled || !allowConfiguration}
                  />

                  <div className="mt-8">
                    <ScheduleSection
                      scheduledAt={watched.scheduled_at ?? undefined}
                      t={t}
                      onScheduleChange={(date) =>
                        setValue("scheduled_at", date)
                      }
                      useGlobalSchedule={watched.use_global_schedule}
                      onGlobalScheduleToggle={(val) =>
                        setValue("use_global_schedule", val)
                      }
                      error={errors.scheduled_at?.message as string}
                      disabled={isContentSectionDisabled || !allowConfiguration}
                    />
                  </div>
                </div>

                {/* Live Preview */}
                <div
                  className="pt-6 border-t border-gray-200 dark:border-neutral-700"
                  data-testid="live-preview-section"
                >
                  <LivePreviewSection
                    content={previewContent}
                    mediaUrls={stabilizedMediaPreviews.map((m) => m.url)}
                    user={{
                      name: auth.user.name,
                      username: "username",
                      avatar: auth.user.photo_url,
                    }}
                    title={watched.title}
                    publishedAt={publication?.published_at}
                    publishedLinks={publication?.social_post_logs?.reduce((acc: Record<string, string>, log: any) => {
                      if (log.status === 'published' && log.post_url && log.platform) {
                        acc[log.platform.toLowerCase()] = log.post_url;
                      }
                      return acc;
                    }, {})}
                  />
                </div>

                {/* History & Timeline */}
                <div className="pt-6 border-t border-gray-200 dark:border-neutral-700 space-y-6">
                  {publication?.approval_logs &&
                    publication.approval_logs.length > 0 && (
                      <ApprovalHistoryCompacto
                        logs={publication.approval_logs}
                        isExpanded={isApprovalHistoryExpanded}
                        onToggle={() =>
                          setIsApprovalHistoryExpanded(
                            !isApprovalHistoryExpanded,
                          )
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
        >
          {publication && (
            <PublicationStatusTimeline
              currentStatus={publication.status as string}
              scheduledAt={publication.scheduled_at ?? undefined}
              approvedAt={publication.approved_at ?? undefined}
              publishedAt={publication.published_at ?? undefined}
              rejectedAt={publication.rejected_at ?? undefined}
              compact={true}
            />
          )}
        </ModalFooter>

        <PlatformSettingsModal
          isOpen={!!activePlatformSettings}
          onClose={() => setActivePlatformSettings(null)}
          platform={activePlatformSettings || ""}
          settings={
            activePlatformSettings?.toLowerCase() === "all"
              ? {}
              : platformSettings[activePlatformSettings?.toLowerCase() || ""] || {}
          }
          onSettingsChange={(newSettings) => {
            if (activePlatformSettings && activePlatformSettings.toLowerCase() !== "all") {
              setPlatformSettings((prev) => ({
                ...prev,
                [activePlatformSettings.toLowerCase()]: newSettings,
              }));
            }
          }}
          allPlatforms={activePlatformSettings?.toLowerCase() === "all" ? selectedPlatforms : []}
          allSettings={activePlatformSettings?.toLowerCase() === "all" ? allPlatformSettings : {}}
          onAllSettingsChange={(platform, newSettings) => {
            setPlatformSettings((prev) => ({
              ...prev,
              [platform]: newSettings,
            }));
          }}
          videoMetadata={
            mediaFiles.find((m) => m.type === "video")
              ? videoMetadata[mediaFiles.find((m) => m.type === "video")!.tempId]
              : undefined
          }
        />
      </div>
    </div>
  );
};

export default memo(EditPublicationModal);
