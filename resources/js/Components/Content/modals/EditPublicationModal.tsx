import PlatformSettingsModal from "@/Components/ConfigSocialMedia/PlatformSettingsModal";
import { CommentsSection } from "@/Components/Content/Publication/comments/CommentsSection";
import ApprovalHistoryCompacto from "@/Components/Content/Publication/common/ApprovalHistoryCompacto";
import { ContentType } from "@/Components/Content/Publication/common/ContentTypeIconSelector";
import ContentTypeSelectorBar from "@/Components/Content/Publication/common/ContentTypeSelectorBar";
import PollFields from "@/Components/Content/Publication/common/PollFields";
import PublicationStatusTimeline from "@/Components/Content/Publication/common/PublicationStatusTimeline";
import TimelineCompacto from "@/Components/Content/Publication/common/TimelineCompacto";
import SocialAccountsSection from "@/Components/Content/Publication/common/add/SocialAccountsSection";
import ContentSection from "@/Components/Content/Publication/common/edit/ContentSection";
import { LivePreviewSection } from "@/Components/Content/Publication/common/edit/LivePreviewSection";
import MediaUploadSection from "@/Components/Content/Publication/common/edit/MediaUploadSection";
import MediaUploadSkeleton from "@/Components/Content/Publication/common/edit/MediaUploadSkeleton";
import ModalFooter from "@/Components/Content/modals/common/ModalFooter";
import ModalHeader from "@/Components/Content/modals/common/ModalHeader";
import ScheduleSection from "@/Components/Content/modals/common/ScheduleSection";
import AlertCard from "@/Components/common/Modern/AlertCard";
import { useContentType } from "@/Hooks/publication/useContentType";
import { usePublicationForm } from "@/Hooks/publication/usePublicationForm";
import { useModalFocusTrap } from "@/Hooks/useModalFocusTrap";
import { usePublicationLock } from "@/Hooks/usePublicationLock";
import toast from "@/Utils/toast";
import { useCalendarStore } from "@/stores/calendarStore";
import { useCampaignStore } from "@/stores/campaignStore";
import { usePublicationStore } from "@/stores/publicationStore";
import { useAccountsStore } from "@/stores/socialAccountsStore";
import { useUploadQueue } from "@/stores/uploadQueueStore";
import { Publication } from "@/types/Publication";
import { usePage } from "@inertiajs/react";
import axios from "axios";
import { Lock, Save } from "lucide-react";
import { memo, useEffect, useMemo, useState } from "react";
import { useWatch } from "react-hook-form";
import { Trans } from "react-i18next";

const parseUserAgent = (userAgent?: string): string => {
  if (!userAgent) return "Unknown Device";
  let browser = "Unknown Browser";
  if (userAgent.includes("Firefox")) browser = "Firefox";
  else if (userAgent.includes("Edg")) browser = "Edge";
  else if (userAgent.includes("Chrome")) browser = "Chrome";
  else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) browser = "Safari";
  else if (userAgent.includes("Opera") || userAgent.includes("OPR")) browser = "Opera";

  let os = "";
  if (userAgent.includes("Windows")) os = "Windows";
  else if (userAgent.includes("Mac")) os = "macOS";
  else if (userAgent.includes("Linux")) os = "Linux";
  else if (userAgent.includes("Android")) os = "Android";
  else if (userAgent.includes("iOS") || userAgent.includes("iPhone") || userAgent.includes("iPad"))
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
  const [isApprovalHistoryExpanded, setIsApprovalHistoryExpanded] = useState(false);
  const [isYouTubeThumbnailExpanded, setIsYouTubeThumbnailExpanded] = useState(true);

  const modalRef = useModalFocusTrap(isOpen);

  const { isLockedByMe, isLockedByOther, lockInfo, activeUsers } = usePublicationLock(
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
    i18n,
  } = usePublicationForm({
    publication,
    onClose,
    onSubmitSuccess: async (success) => {
      if (success && publication?.id) {
        try {
          // Force refresh the publication data from backend
          await usePublicationStore.getState().fetchPublicationById(publication.id);

          // Refresh published platforms to update the publish modal
          await fetchPublishedPlatformsFromStore(publication.id);

          // Small delay to ensure backend has processed everything
          await new Promise((resolve) => setTimeout(resolve, 100));

          // Refresh calendar events
          await useCalendarStore.getState().fetchEvents();
        } catch (e) {
          console.error("Error refreshing data after update:", e);
        }
      }
      onSubmit(success);
    },
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
    } catch (err) {}
  };

  // Delete reels when video is removed
  // Delete reels when video is removed
  const handleRemoveMediaWithReels = async (tempId: string) => {
    const mediaToRemove = mediaFiles.find((m) => m.tempId === tempId);
    if (!mediaToRemove) return;

    const isVideo = mediaToRemove.type === "video";

    if (isVideo && publication?.id && mediaToRemove.id) {
      // Find and delete associated reels
      const reelsToDelete =
        publication.media_files?.filter(
          (m) => m.metadata?.original_media_id === mediaToRemove.id,
        ) || [];

      if (reelsToDelete.length > 0) {
        try {
          await Promise.all(reelsToDelete.map((reel) => axios.delete(`/api/v1/media/${reel.id}`)));
          toast.success(t("reels.messages.deletedWithVideo"));
        } catch (error) {
          console.error("Failed to delete associated reels", error);
        }
      }
    }

    // Call original remove handler
    handleRemoveMedia(tempId);
  };

  const { register } = form;

  const selectedSocialAccounts = useWatch({ control, name: "social_accounts" }) || [];
  const scheduledAt = useWatch({ control, name: "scheduled_at" });
  const useGlobalSchedule = useWatch({ control, name: "use_global_schedule" });
  const title = useWatch({ control, name: "title" });
  const description = useWatch({ control, name: "description" });
  const goal = useWatch({ control, name: "goal" });
  const hashtags = useWatch({ control, name: "hashtags" });
  const campaign_id = useWatch({ control, name: "campaign_id" });
  const is_recurring = useWatch({ control, name: "is_recurring" });
  const recurrence_type = useWatch({ control, name: "recurrence_type" });
  const recurrence_interval = useWatch({
    control,
    name: "recurrence_interval",
  });
  const recurrence_days = useWatch({ control, name: "recurrence_days" });
  const recurrence_end_date = useWatch({
    control,
    name: "recurrence_end_date",
  });
  const recurrence_accounts = useWatch({
    control,
    name: "recurrence_accounts",
  });
  const content_type = (useWatch({ control, name: "content_type" }) as ContentType) || "post";
  const poll_options = useWatch({ control, name: "poll_options" }) || ["", ""];
  const poll_duration_hours = useWatch({ control, name: "poll_duration_hours" }) || 24;

  // Use content type hook for field visibility
  const { fieldVisibility } = useContentType(content_type);

  // Force re-render when content_type changes
  const [forceUpdate, setForceUpdate] = useState(0);
  useEffect(() => {
    setForceUpdate((prev) => prev + 1);
  }, [content_type]);

  // Get selected platform names for content type filtering
  const selectedPlatformNames = useMemo(() => {
    return selectedSocialAccounts
      .map((id: number) => {
        const account = socialAccounts.find((a) => a.id === id);
        return account?.platform;
      })
      .filter(Boolean) as string[];
  }, [selectedSocialAccounts, socialAccounts]);

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
      is_recurring,
      recurrence_type,
      recurrence_interval,
      recurrence_days,
      recurrence_end_date,
      recurrence_accounts,
      content_type,
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
      is_recurring,
      recurrence_type,
      recurrence_interval,
      recurrence_days,
      recurrence_end_date,
      recurrence_accounts,
      content_type,
    ],
  );

  const stabilizedMediaPreviews = useMemo(() => {
    return mediaFiles.map((m) => ({
      ...m,
      url: m.url,
    }));
  }, [mediaFiles]);

  const hasPublishedPlatform = useMemo(() => {
    return publication?.social_post_logs?.some((log: any) => log.status === "published");
  }, [publication]);

  const { publishedPlatforms, publishingPlatforms, failedPlatforms } = usePublicationStore();

  const fetchPublishedPlatformsFromStore = usePublicationStore((s) => s.fetchPublishedPlatforms);

  const { auth } = usePage<any>().props;
  const user = auth.user;
  const canManage = auth.current_workspace?.permissions?.includes("manage-content");
  const canManageAccounts = auth.current_workspace?.permissions?.includes("manage-accounts");
  const planId = auth.current_workspace?.plan?.toLowerCase() || "demo";
  const hasRecurrenceAccess = ["demo", "professional", "enterprise"].includes(planId);
  const hasAdvancedScheduling = auth.current_workspace?.features?.advanced_scheduling ?? false;

  // Fetch published platforms when modal opens
  useEffect(() => {
    if (isOpen && publication?.id) {
      fetchPublishedPlatformsFromStore(publication.id);
    }
  }, [isOpen, publication?.id, fetchPublishedPlatformsFromStore]);

  // Auto-detect if we should use global schedule or individual schedules
  // If there are different dates for different accounts, disable global schedule
  useEffect(() => {
    if (!isOpen || !publication) return;

    // Check if all account schedules are the same
    const scheduleValues = Object.values(accountSchedules);
    if (scheduleValues.length > 1) {
      const allSame = scheduleValues.every((date) => date === scheduleValues[0]);

      // If dates are different and global schedule is enabled, disable it
      if (!allSame && useGlobalSchedule) {
        setValue("use_global_schedule", false, { shouldDirty: false });
      }
      // If dates are all the same and global schedule is disabled, we could enable it
      // but let's not do that automatically to avoid confusion
    }
  }, [isOpen, publication, accountSchedules, useGlobalSchedule, setValue]);

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
          .filter((platform): platform is string => Boolean(platform)),
      ),
    );
  }, [selectedSocialAccounts, socialAccounts]);

  const allPlatformSettings = useMemo(() => {
    const settings: Record<string, any> = {};
    selectedPlatforms.forEach((platform) => {
      if (!platform) return;
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
  const allowConfiguration = canPublish || isApprovedStatus;

  const previewContent = useMemo(() => {
    let text = watched.description || "";
    if (watched.hashtags) {
      const formattedHashtags = Array.isArray(watched.hashtags)
        ? watched.hashtags.join(" ")
        : watched.hashtags;
      text += `\n\n${formattedHashtags}`;
    }
    return text;
  }, [watched.description, watched.hashtags]);

  const handleRecurrenceChange = (data: any) => {
    Object.entries(data).forEach(([key, val]) => {
      setValue(key as any, val, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    });
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center text-gray-900 transition-opacity duration-200 dark:text-white sm:p-6 ${isOpen ? "visible opacity-100" : "pointer-events-none invisible opacity-0"}`}
    >
      <div
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm dark:bg-black/70"
        onClick={handleClose}
      />

      <div
        ref={modalRef as React.RefObject<HTMLDivElement>}
        className="animate-in fade-in zoom-in relative flex max-h-[90vh] w-full max-w-5xl flex-col rounded-lg bg-white shadow-2xl backdrop-blur-2xl duration-300 dark:bg-neutral-900/90"
      >
        <ModalHeader
          t={t}
          onClose={handleClose}
          title={canManage ? "publications.modal.edit.title" : "publications.modal.show.title"}
          subtitle={
            canManage ? "publications.modal.edit.subtitle" : "publications.modal.show.subtitle"
          }
          rightElement={
            <div className="mr-2 flex -space-x-2 overflow-hidden p-2">
              {activeUsers.map((user: any) => {
                const isTheLocker = lockInfo?.user_id === user.id;
                return (
                  <div
                    key={user.id}
                    className={`inline-block h-7 w-7 rounded-full ring-2 ${isTheLocker ? "z-10 ring-amber-500" : "ring-white dark:ring-neutral-800"} relative flex-shrink-0 bg-gray-200 dark:bg-neutral-700`}
                    title={user.name + (isTheLocker ? " (Editando)" : " (Viendo)")}
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        loading="lazy"
                        className="h-full w-full rounded-full object-cover"
                        onError={(e) => {
                          // Si falla, mostrar iniciales
                          const target = e.currentTarget;
                          target.style.display = "none";
                          const parent = target.parentElement;
                          if (parent) {
                            const fallback = document.createElement("div");
                            fallback.className =
                              "h-full w-full flex items-center justify-center text-xs font-bold text-gray-500 uppercase";
                            fallback.textContent = user.name.charAt(0);
                            parent.appendChild(fallback);
                          }
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-bold uppercase text-gray-500">
                        {user.name.charAt(0)}
                      </div>
                    )}
                    {isTheLocker && (
                      <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-amber-500 p-0.5 shadow-sm">
                        <Lock className="h-2 w-2 text-white" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          }
        />

        <ContentTypeSelectorBar
          selectedType={content_type}
          selectedPlatforms={selectedPlatformNames}
          onChange={(type) => {
            setValue("content_type", type, { shouldValidate: true });
            // Reset type-specific fields when changing type
            if (type !== "poll") {
              setValue("poll_options", null);
              setValue("poll_duration_hours", null);
            }
          }}
          t={t}
          disabled={hasPublishedPlatform || isContentSectionDisabled}
          mediaFiles={mediaFiles}
        />

        <div className="custom-scrollbar flex-1 overflow-y-auto">
          <form
            id="edit-publication-form"
            onSubmit={(e) => {
              console.log("=== Form submit event triggered ===");
              console.log("Event:", e);
              handleSubmit(e);
            }}
          >
            {/* Hidden field to register content_type */}
            <input type="hidden" {...register("content_type")} />
            <input type="hidden" {...register("poll_options")} />
            <input type="hidden" {...register("poll_duration_hours")} />

            <div
              className={`grid grid-cols-1 ${fieldVisibility.showMediaSection ? "lg:grid-cols-12" : "lg:grid-cols-2"} gap-6 p-6`}
            >
              {/* ========================================
                  COLUMNA IZQUIERDA: MEDIA Y CONTENIDO
                  ======================================== */}
              <div className={` ${fieldVisibility.showMediaSection ? "lg:col-span-7" : ""}`}>
                <div className="space-y-6">
                  {!isLockedByMe &&
                    isLockedByOther &&
                    !hasPublishedPlatform &&
                    allowConfiguration &&
                    publication?.status !== "pending_review" && (
                      <AlertCard
                        type="amber"
                        title={
                          lockInfo?.locked_by === "session"
                            ? t("publications.modal.edit.lockedBySession") || "Sesión Duplicada"
                            : t("publications.modal.edit.lockedByOther") || "En cola de espera"
                        }
                        message={
                          lockInfo?.locked_by === "session" ? (
                            <div className="opacity-80">
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
                            </div>
                          ) : (
                            <div className="opacity-80">
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
                                Tomarás el control automáticamente cuando se libere.
                              </p>
                            </div>
                          )
                        }
                        className="animate-in shake duration-500"
                      />
                    )}

                  {/* Alerta: Eres el editor actual */}
                  {isLockedByMe && activeUsers.length > 1 && (
                    <AlertCard
                      type="info"
                      title={
                        t("publications.modal.edit.locking.youAreEditor") ||
                        "Eres el editor actual."
                      }
                      message={
                        t("publications.modal.edit.locking.usersWaiting", {
                          count: activeUsers.length - 1,
                        }) ||
                        `Hay ${activeUsers.length - 1} usuario(s) en espera para cuando termines.`
                      }
                      className="text-xs"
                    />
                  )}

                  {/* Alerta: Pendiente de revisión */}
                  {publication?.status === "pending_review" && (
                    <>
                      <AlertCard
                        type="warning"
                        title={
                          t("publications.modal.edit.pendingReviewWarning") ||
                          "Publicación en Revisión"
                        }
                        message={
                          t("publications.modal.edit.pendingReviewWarningHint") ||
                          "Esta publicación está esperando aprobación. Debes aprobarla o rechazarla antes de poder editarla. Si la rechazas, el creador podrá hacer cambios y volver a solicitar aprobación."
                        }
                        className="animate-in fade-in slide-in-from-top-4"
                      />

                      {/* Flujo de Aprobación */}
                      {publication?.currentApprovalStep?.workflow && (
                        <div className="animate-in fade-in slide-in-from-top-4 rounded-lg border border-primary-200 bg-gradient-to-br from-primary-50 to-blue-50 p-4 dark:border-primary-800 dark:from-primary-900/20 dark:to-blue-900/20">
                          <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-primary-900 dark:text-primary-300">
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                              />
                            </svg>
                            {t("approvals.workflow_progress") || "Progreso del Flujo"}
                          </h4>
                          <div className="space-y-2">
                            {publication.currentApprovalStep.workflow.steps?.map(
                              (step: any, index: number) => {
                                const isCurrent = step.id === publication.currentApprovalStep?.id;
                                const isPast =
                                  step.level_number <
                                  (publication.currentApprovalStep?.level_number || 0);

                                return (
                                  <div
                                    key={step.id}
                                    className={`flex items-center gap-3 rounded-lg p-2 transition-all ${
                                      isCurrent
                                        ? "border border-primary-300 bg-primary-100 dark:border-primary-700 dark:bg-primary-900/40"
                                        : isPast
                                          ? "border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                                          : "border border-gray-200 bg-white/50 dark:border-neutral-700 dark:bg-neutral-800/50"
                                    }`}
                                  >
                                    <div
                                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                                        isCurrent
                                          ? "bg-primary-500 text-white"
                                          : isPast
                                            ? "bg-green-500 text-white"
                                            : "bg-gray-300 text-gray-600 dark:bg-gray-600 dark:text-gray-300"
                                      }`}
                                    >
                                      {isPast ? "✓" : index + 1}
                                    </div>
                                    <div className="flex-1">
                                      <div className="text-xs font-semibold text-gray-900 dark:text-white">
                                        {step.name}
                                      </div>
                                      <div className="text-[10px] text-gray-600 dark:text-gray-400">
                                        {step.role?.name || "Sin rol asignado"}
                                      </div>
                                    </div>
                                    {isCurrent && (
                                      <span className="rounded-full bg-primary-200 px-2 py-0.5 text-[10px] font-bold text-primary-600 dark:bg-primary-800 dark:text-primary-400">
                                        {t("approvals.in_progress") || "En Proceso"}
                                      </span>
                                    )}
                                    {isPast && (
                                      <span className="text-[10px] font-bold text-green-600 dark:text-green-400">
                                        ✓ {t("common.completed") || "Completado"}
                                      </span>
                                    )}
                                  </div>
                                );
                              },
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Alerta: Publicación aprobada */}
                  {publication?.status === "approved" && !hasPublishedPlatform && (
                    <AlertCard
                      type="info"
                      title={
                        t("publications.modal.edit.approvedEditWarning") || "Publicación Aprobada"
                      }
                      message={
                        t("publications.modal.edit.approvedEditWarningHint") ||
                        "Esta publicación ya fue aprobada. Si realizas cambios, volverá a estado 'Pendiente' y requerirá una nueva aprobación."
                      }
                      className="animate-in fade-in slide-in-from-top-4"
                    />
                  )}

                  {fieldVisibility.showMediaSection &&
                    (!isDataReady ? (
                      <MediaUploadSkeleton />
                    ) : (
                      <MediaUploadSection
                        mediaPreviews={stabilizedMediaPreviews}
                        thumbnails={thumbnails}
                        imageError={imageError}
                        isDragOver={isDragOver}
                        t={t}
                        onFileChange={handleFileChange}
                        onRemoveMedia={handleRemoveMediaWithReels}
                        onSetThumbnail={(tempId, file) => setThumbnail(tempId, file)}
                        onClearThumbnail={(tempId) => clearThumbnail(tempId)}
                        onUpdateFile={updateFile}
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
                        videoMetadata={videoMetadata}
                        publicationId={publication?.id}
                        allMediaFiles={publication?.media_files || []}
                      />
                    ))}
                </div>

                {/* ==================== SECCIÓN: CONTENIDO DE LA PUBLICACIÓN ==================== */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-neutral-700">
                    <div className="h-5 w-1 rounded-full bg-primary-500"></div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-900 dark:text-white">
                      {t("publications.modal.edit.contentSection") || "Contenido"}
                    </h3>
                  </div>

                  {hasPublishedPlatform && (
                    <AlertCard
                      type="info"
                      title={
                        t("publications.modal.edit.contentLocked") || "Publication partially live"
                      }
                      message={
                        t("publications.modal.edit.contentLockedHint") ||
                        "This publication is live on some platforms. Changes will apply to pending and future uploads."
                      }
                      className="animate-in fade-in slide-in-from-top-4"
                    />
                  )}

                  <ContentSection
                    key={`content-section-${content_type}-${forceUpdate}`}
                    register={register}
                    setValue={setValue}
                    errors={errors}
                    watched={watched}
                    t={t}
                    campaigns={campaigns}
                    publication={publication}
                    onHashtagChange={handleHashtagChange}
                    disabled={hasPublishedPlatform || isContentSectionDisabled}
                    contentType={content_type}
                  />
                </div>

                {/* ==================== SECCIÓN: CAMPOS ESPECÍFICOS DE POLL ==================== */}
                {fieldVisibility.showPollFields && (
                  <div className="space-y-4">
                    <PollFields
                      options={poll_options}
                      duration={poll_duration_hours}
                      onChange={(data) => {
                        setValue("poll_options", data.options, {
                          shouldValidate: true,
                        });
                        setValue("poll_duration_hours", data.duration, {
                          shouldValidate: true,
                        });
                      }}
                      register={register}
                      setValue={setValue}
                      t={t}
                      errors={{
                        options: errors.poll_options?.message as string,
                        duration: errors.poll_duration_hours?.message as string,
                      }}
                    />
                  </div>
                )}

                {/* ==================== SECCIÓN: VISTA PREVIA (Solo si tiene advanced_scheduling) ==================== */}
                {hasRecurrenceAccess && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-gray-200 pb-2 pt-6 dark:border-neutral-700">
                      <div className="h-5 w-1 rounded-full bg-primary-500"></div>
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-900 dark:text-white">
                        {t("publications.modal.edit.previewSection") || "Vista Previa"}
                      </h3>
                    </div>

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
                      contentType={watched.content_type}
                      selectedPlatforms={selectedSocialAccounts
                        .map((id: number) => {
                          const account = socialAccounts.find((a) => a.id === id);
                          return account?.platform.toLowerCase() || "";
                        })
                        .filter(Boolean)}
                      pollOptions={poll_options}
                      pollDuration={poll_duration_hours}
                      publishedLinks={publication?.social_post_logs?.reduce(
                        (acc: Record<string, string>, log: any) => {
                          if (log.status === "published" && log.post_url && log.platform) {
                            acc[log.platform.toLowerCase()] = log.post_url;
                          }
                          return acc;
                        },
                        {},
                      )}
                    />
                  </div>
                )}
              </div>

              {/* ========================================
                  COLUMNA DERECHA: REDES, PROGRAMACIÓN Y VISTA PREVIA
                  ======================================== */}
              <div
                className={`space-y-6 ${fieldVisibility.showMediaSection ? "lg:col-span-5" : ""}`}
              >
                {/* ==================== SECCIÓN: CUENTAS DE REDES SOCIALES ==================== */}
                <div
                  className={`space-y-4 transition-opacity duration-200 ${!allowConfiguration || isContentSectionDisabled ? "pointer-events-none opacity-50 grayscale-[0.5]" : ""}`}
                >
                  <div className="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-neutral-700">
                    <div className="h-5 w-1 rounded-full bg-primary-500"></div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-900 dark:text-white">
                      {t("publications.modal.edit.socialAccountsSection") || "Redes Sociales"}
                    </h3>
                  </div>

                  <SocialAccountsSection
                    socialAccounts={socialAccounts as any}
                    selectedAccounts={watched.social_accounts || []}
                    accountSchedules={accountSchedules}
                    t={t}
                    onAccountToggle={handleAccountToggle}
                    onScheduleChange={(id, date) => {
                      setAccountSchedules((prev) => ({ ...prev, [id]: date }));

                      if (useGlobalSchedule && date !== scheduledAt) {
                        setValue("use_global_schedule", false, {
                          shouldDirty: true,
                        });
                      }
                    }}
                    onScheduleRemove={(id) => {
                      setAccountSchedules((prev) => {
                        const n = { ...prev };
                        delete n[id];
                        return n;
                      });

                      const remainingSchedules = Object.keys(accountSchedules).filter(
                        (key) => parseInt(key) !== id,
                      );
                      if (remainingSchedules.length === 0 && scheduledAt && !useGlobalSchedule) {
                        setValue("use_global_schedule", true, {
                          shouldDirty: true,
                        });
                      }
                    }}
                    onPlatformSettingsClick={(platform) => setActivePlatformSettings(platform)}
                    globalSchedule={watched.scheduled_at ?? undefined}
                    publishedAccountIds={publishedAccountIds}
                    publishingAccountIds={publishingAccountIds}
                    failedAccountIds={failedAccountIds}
                    onCancel={handleCancelPublication}
                    error={errors.social_accounts?.message as string}
                    durationErrors={durationErrors}
                    videoMetadata={videoMetadata}
                    mediaFiles={mediaFiles}
                    disabled={isContentSectionDisabled || !allowConfiguration || !canManageAccounts}
                    socialPostLogs={publication?.social_post_logs}
                    contentType={watched.content_type}
                    onThumbnailChange={(_videoId, file) => {
                      const video = mediaFiles.find((m) => m.type === "video");
                      if (video) {
                        if (file) {
                          setThumbnail(video.tempId, file);
                        } else {
                          clearThumbnail(video.tempId);
                        }
                      }
                    }}
                    onThumbnailDelete={(videoId) => {
                      const video = mediaFiles.find((m) => m.type === "video");
                      if (video) clearThumbnail(video.tempId);
                    }}
                    thumbnails={thumbnails as any}
                    publication={publication}
                  />
                </div>

                {/* ==================== SECCIÓN: PROGRAMACIÓN Y RECURRENCIA (Solo si tiene advanced_scheduling) ==================== */}
                {hasRecurrenceAccess ? (
                  <div
                    className={`space-y-4 transition-opacity duration-200 ${!allowConfiguration || isContentSectionDisabled ? "pointer-events-none opacity-50 grayscale-[0.5]" : ""}`}
                  >
                    <div className="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-neutral-700">
                      <div className="h-5 w-1 rounded-full bg-primary-500"></div>
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-900 dark:text-white">
                        {t("publications.modal.edit.scheduleSection") || "Programación"}
                      </h3>
                    </div>

                    <ScheduleSection
                      scheduledAt={watched.scheduled_at ?? undefined}
                      t={t}
                      onScheduleChange={(date) => {
                        let finalDate = date;
                        if (!date && !watched.scheduled_at) {
                          const defaultDate = new Date();
                          defaultDate.setMinutes(defaultDate.getMinutes() + 2);
                          finalDate = defaultDate.toISOString();
                        }

                        setValue("scheduled_at", finalDate, {
                          shouldDirty: true,
                          shouldValidate: true,
                          shouldTouch: true,
                        });
                      }}
                      useGlobalSchedule={watched.use_global_schedule}
                      onGlobalScheduleToggle={(val) => setValue("use_global_schedule", val)}
                      onClearAccountSchedules={() => {
                        setAccountSchedules({});
                      }}
                      error={errors.scheduled_at?.message as string}
                      disabled={isContentSectionDisabled || !allowConfiguration}
                      hasRecurrenceAccess={hasRecurrenceAccess}
                      recurrenceDaysError={errors.recurrence_days?.message}
                      isRecurring={watched.is_recurring}
                      recurrenceType={watched.recurrence_type as any}
                      recurrenceInterval={watched.recurrence_interval}
                      recurrenceDays={watched.recurrence_days}
                      recurrenceEndDate={watched.recurrence_end_date ?? undefined}
                      recurrenceAccounts={watched.recurrence_accounts}
                      onRecurrenceChange={handleRecurrenceChange}
                      i18n={i18n}
                      publishDate={publication?.publish_date}
                      selectedAccounts={selectedSocialAccounts}
                      socialAccounts={socialAccounts}
                      accountSchedules={accountSchedules}
                      existingScheduledPosts={publication?.scheduled_posts}
                      socialPostLogs={publication?.social_post_logs}
                    />
                  </div>
                ) : (
                  /* ==================== SECCIÓN: VISTA PREVIA (Reemplaza programación si NO tiene advanced_scheduling) ==================== */
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-neutral-700">
                      <div className="h-5 w-1 rounded-full bg-primary-500"></div>
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-900 dark:text-white">
                        {t("publications.modal.edit.previewSection") || "Vista Previa"}
                      </h3>
                    </div>

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
                      contentType={watched.content_type}
                      selectedPlatforms={selectedSocialAccounts
                        .map((id: number) => {
                          const account = socialAccounts.find((a) => a.id === id);
                          return account?.platform.toLowerCase() || "";
                        })
                        .filter(Boolean)}
                      pollOptions={poll_options}
                      pollDuration={poll_duration_hours}
                      publishedLinks={publication?.social_post_logs?.reduce(
                        (acc: Record<string, string>, log: any) => {
                          if (log.status === "published" && log.post_url && log.platform) {
                            acc[log.platform.toLowerCase()] = log.post_url;
                          }
                          return acc;
                        },
                        {},
                      )}
                    />
                  </div>
                )}

                {/* ==================== SECCIÓN: COMENTARIOS INTERNOS ==================== */}
                {publication?.id && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-gray-200 pb-2 pt-6 dark:border-neutral-700">
                      <div className="h-5 w-1 rounded-full bg-primary-500"></div>
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-900 dark:text-white">
                        {t("publications.modal.edit.commentsSection") || "Comentarios Internos"}
                      </h3>
                    </div>
                    <CommentsSection publicationId={publication.id} currentUser={auth.user} />
                  </div>
                )}

                {/* ==================== SECCIÓN: HISTORIAL Y ACTIVIDAD ==================== */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-gray-200 pb-2 pt-6 dark:border-neutral-700">
                    <div className="h-5 w-1 rounded-full bg-primary-500"></div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-900 dark:text-white">
                      {t("publications.modal.edit.historySection") || "Historial"}
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {publication?.approval_logs && publication.approval_logs.length > 0 && (
                      <ApprovalHistoryCompacto
                        logs={publication.approval_logs}
                        isExpanded={isApprovalHistoryExpanded}
                        onToggle={() => setIsApprovalHistoryExpanded(!isApprovalHistoryExpanded)}
                        workflow={
                          publication?.approval_request?.workflow ||
                          publication?.current_approval_step?.workflow
                        }
                        currentStepNumber={
                          publication?.approval_request?.current_step?.level_number ||
                          publication?.current_approval_step?.level_number
                        }
                        approvalStatus={publication?.approval_request?.status}
                      />
                    )}

                    {publication?.activities && publication.activities.length > 0 && (
                      <TimelineCompacto
                        activities={publication.activities}
                        isExpanded={isTimelineExpanded}
                        onToggle={() => setIsTimelineExpanded(!isTimelineExpanded)}
                      />
                    )}
                  </div>
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
          submitIcon={<Save className="h-4 w-4" />}
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
