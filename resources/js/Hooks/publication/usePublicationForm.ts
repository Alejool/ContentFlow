import { useS3Upload } from "@/Hooks/useS3Upload";
import { PublicationFormData, publicationSchema } from "@/schemas/publication";
import { useMediaStore } from "@/stores/mediaStore";
import { usePublicationStore } from "@/stores/publicationStore";
import { useUploadQueue } from "@/stores/uploadQueueStore";
import { PageProps } from "@/types";
import { Publication } from "@/types/Publication";
import { zodResolver } from "@hookform/resolvers/zod";
import { router, usePage } from "@inertiajs/react";
import axios from "axios";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

interface UsePublicationFormProps {
  publication?: Publication | null;
  onClose: () => void;
  onSubmitSuccess?: (success: boolean) => void;
  isOpen?: boolean;
}

export const usePublicationForm = ({
  publication,
  onClose,
  onSubmitSuccess,
  isOpen,
}: UsePublicationFormProps) => {
  const { t } = useTranslation();
  const schema = useMemo(() => publicationSchema(t), [t]);

  const { props } = usePage<PageProps>();
  const user = props.auth.user;

  // Selectors for Publication Store
  const createPublication = usePublicationStore((s) => s.createPublication);
  const updatePublicationStore = usePublicationStore(
    (s) => s.updatePublicationStore,
  );

  // Selectors for Media Store
  const mediaFiles = useMediaStore((s) => s.mediaFiles);
  const addFiles = useMediaStore((s) => s.addFiles);
  const removeFile = useMediaStore((s) => s.removeFile);
  const clearMedia = useMediaStore((s) => s.clear);
  const setMediaFiles = useMediaStore((s) => s.setMediaFiles);
  const setVideoMetadata = useMediaStore((s) => s.setVideoMetadata);
  const videoMetadata = useMediaStore((s) => s.videoMetadata);
  const thumbnails = useMediaStore((s) => s.thumbnails);
  const setThumbnail = useMediaStore((s) => s.setThumbnail);
  const clearThumbnail = useMediaStore((s) => s.clearThumbnail);
  const removedThumbnailIds = useMediaStore((s) => s.removedThumbnailIds);
  const setImageError = useMediaStore((s) => s.setImageError);
  const imageError = useMediaStore((s) => s.imageError);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removedMediaIds, setRemovedMediaIds] = useState<number[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDataReady, setIsDataReady] = useState(false);
  const [remoteLock, setRemoteLock] = useState<{
    id: number;
    name: string;
    photo_url: string;
    isSelf: boolean;
  } | null>(null);

  // Platform settings and previews
  const [platformSettings, setPlatformSettings] = useState<Record<string, any>>(
    {},
  );
  const [activePlatformSettings, setActivePlatformSettings] = useState<
    string | null
  >(null);

  // Direct S3 Upload Hooks
  const {
    uploadFile,
    progress: uploadProgress,
    stats: uploadStats,
    uploading: isS3Uploading,
    errors: uploadErrors,
  } = useS3Upload();
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  const [activePlatformPreview, setActivePlatformPreview] = useState<
    string | null
  >(null);
  const [accountSchedules, setAccountSchedules] = useState<
    Record<number, string>
  >({});

  const prevHashtagsRef = useRef<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<PublicationFormData>({
    resolver: zodResolver(schema),
    mode: "all",
    defaultValues: {
      title: "",
      description: "",
      goal: "",
      hashtags: "",
      campaign_id: null,
      social_accounts: [],
      scheduled_at: null,
      lock_content: false,
      status: "draft",
    },
  });

  const {
    reset,
    watch,
    setValue,
    handleSubmit,
    formState: { errors, isDirty },
    trigger,
    getValues,
    getFieldState,
    control,
  } = form;
  const watched = watch();

  // Unified logging for errors
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.warn("Publication Form Errors:", errors);
    }
  }, [errors]);

  // Phase 1: Load critical data IMMEDIATELY for instant modal display
  // We explicitly watch for publication object changes to enable real-time reactive updates
  useEffect(() => {
    if (isOpen && publication) {
      const isInitialLoad = !isDataReady;

      console.log(
        `🔄 SYNC: Publication ${publication.id} (${isInitialLoad ? "Initial" : "Live"})`,
      );

      const resetData = {
        title: publication.title || "",
        description: publication.description || "",
        goal: publication.goal || "",
        hashtags: publication.hashtags || "",
        campaign_id: publication.campaigns?.[0]?.id?.toString() || null,
        social_accounts: getValues("social_accounts") || [], // Phase 2 will refine this
        scheduled_at: publication.scheduled_at || null,
        status: ((publication as any).status === "published" ||
        (publication as any).status === "scheduled" ||
        (publication as any).status === "publishing" ||
        (publication as any).status === "approved" ||
        (publication as any).status === "pending_review" ||
        (publication as any).status === "failed" ||
        (publication as any).status === "rejected" ||
        (publication as any).status === "draft"
          ? (publication as any).status
          : "draft") as any,
        lock_content: !!publication.social_post_logs?.some(
          (l) => l.status === "published" || l.status === "publishing",
        ),
        use_global_schedule: !!publication.scheduled_at,
      };

      if (isInitialLoad) {
        reset(resetData as any);
        setIsDataReady(false); // Trigger Phase 2 re-processing safely
      } else {
        // LIVE SYNC: Only update fields that the user hasn't touched
        reset(resetData as any, { keepDirtyValues: true });
        // NOTE: We don't set isDataReady(false) here to avoid flickering the modal
      }

      // Sync platform settings (complex JSON, not in reset)
      // Check if user has touched platform settings locally? No easy way, but usually safe
      setPlatformSettings(publication.platform_settings || {});
    } else if (isOpen && !publication) {
      // Logic for NEW publication
      reset({
        title: "",
        description: "",
        goal: "",
        hashtags: "",
        campaign_id: null,
        social_accounts: [] as number[],
        scheduled_at: null,
        status: "draft",
        use_global_schedule: false,
        lock_content: false,
      });
      setPlatformSettings(user?.global_platform_settings || {});
      clearMedia();
      setIsDataReady(true);
    }
  }, [isOpen, publication, user?.global_platform_settings, reset]);

  // Phase 1.5: Real-time Lock & Update Listener (Global sync is handled by useWorkspaceLocks)
  useEffect(() => {
    if (!isOpen || !publication?.id || !user?.current_workspace_id) return;

    const channelName = `workspace.${user.current_workspace_id}`;
    const channel = window.Echo.private(channelName);

    // We still listen for lock changes to handle the remoteLock state in the modal
    const handleLockChange = (e: any) => {
      const pubId = Number(e.publicationId || e.publication_id);
      if (pubId === publication.id) {
        if (e.lock) {
          setRemoteLock({
            ...e.lock,
            isSelf: e.lock.user_id === user.id,
          });
        } else {
          setRemoteLock(null);
        }
      }
    };

    channel.listen(".publication.lock.changed", handleLockChange);

    return () => {
      channel.stopListening(".publication.lock.changed", handleLockChange);
    };
  }, [isOpen, publication?.id, user?.current_workspace_id, user?.id]);

  // Phase 2: Defer HEAVY processing using startTransition
  useEffect(() => {
    if (isOpen && publication) {
      startTransition(() => {
        // Process scheduled posts and social accounts
        const publishedAccountIds = new Set(
          publication.social_post_logs
            ?.filter(
              (l) => l.status === "published" || l.status === "publishing",
            )
            .map((l) => l.social_account_id) || [],
        );

        const pendingSocialAccounts = Array.from(
          new Set(
            publication.scheduled_posts
              ?.filter((sp) => sp.status === "pending")
              .map((sp) => sp.social_account_id) || [],
          ),
        );

        // LIVE SYNC PROTECTION: Only update social accounts if untouched
        if (!getFieldState("social_accounts").isDirty) {
          setValue("social_accounts", pendingSocialAccounts, {
            shouldValidate: false,
          });
        }

        // Process account schedules
        const initialAccountSchedules: Record<number, string> = {};
        const scheds =
          publication.scheduled_posts || (publication as any).scheduledPosts;
        if (scheds) {
          scheds.forEach((sp: any) => {
            if (
              sp.social_account_id &&
              sp.scheduled_at &&
              !publishedAccountIds.has(sp.social_account_id)
            ) {
              initialAccountSchedules[sp.social_account_id] = sp.scheduled_at;
            }
          });
        }
        setAccountSchedules((prev) => {
          // Merge? No, use server state as base but maybe keep some?
          // For now, simple update. User-changed schedules are hard to track without custom isDirty
          return initialAccountSchedules;
        });

        // Process media files (ALWAYS refesh media files from store)
        const existingMedia: any[] =
          publication.media_files?.map((media: any) => {
            const isVideo =
              media.file_type === "video" ||
              media.mime_type?.startsWith("video/");
            const tempId = `existing-${media.id}`;

            let url = media.file_path || media.url;
            if (url && !url.startsWith("http") && !url.startsWith("blob:")) {
              if (url.startsWith("/storage/")) {
                // Already has leading slash and storage
              } else if (url.startsWith("storage/")) {
                url = `/${url}`;
              } else if (!url.startsWith("/")) {
                url = `/storage/${url}`;
              }
            }

            const thumbDerivative = media.derivatives?.find(
              (d: any) =>
                d.derivative_type === "thumbnail" ||
                d.derivative_type === "thumb",
            );
            let thumbnailUrl = thumbDerivative?.file_path;
            if (
              thumbnailUrl &&
              !thumbnailUrl.startsWith("http") &&
              !thumbnailUrl.startsWith("blob:")
            ) {
              if (thumbnailUrl.startsWith("/storage/")) {
              } else if (thumbnailUrl.startsWith("storage/")) {
                thumbnailUrl = `/${thumbnailUrl}`;
              } else if (!thumbnailUrl.startsWith("/")) {
                thumbnailUrl = `/storage/${thumbnailUrl}`;
              }
            }

            if (isVideo) {
              setVideoMetadata(tempId, {
                duration: media.metadata?.duration || 0,
                youtubeType: media.metadata?.youtubeType || "video",
              });
            }

            return {
              id: media.id,
              tempId: tempId,
              url: url,
              thumbnailUrl: thumbnailUrl,
              type: isVideo ? "video" : "image",
              isNew: false,
              status: media.status || "completed",
              file_name: media.file_name,
              size: media.size,
            };
          }) || [];

        // RECOVERY: Check global upload queue for files currently uploading/linked to this publication
        // This ensures if User A closes/reopens while uploading, they see their progress.
        const queue = useUploadQueue.getState().queue;
        Object.values(queue).forEach((item) => {
          if (item.publicationId === publication.id) {
            // DEDUPLICATION: Check if this file is already in existingMedia (server-side version)
            const isDuplicate = existingMedia.some((m) => {
              const nameMatch = m.file_name === item.file.name;
              const sizeMatch = Number(m.size) === Number(item.file.size);
              return nameMatch && sizeMatch;
            });

            if (
              !isDuplicate &&
              !existingMedia.some((m) => m.tempId === item.id)
            ) {
              existingMedia.push({
                tempId: item.id,
                url: URL.createObjectURL(item.file),
                type: item.file.type.startsWith("image/") ? "image" : "video",
                isNew: true,
                file: item.file,
                status: item.status === "completed" ? "completed" : "uploading",
              });
            }
          }
        });

        if (existingMedia.length === 0 && publication.image) {
          let url = publication.image;
          if (url && !url.startsWith("http") && !url.startsWith("/storage/")) {
            url = `/storage/${url}`;
          }
          existingMedia.push({
            id: undefined,
            tempId: "existing-main-image",
            url: url,
            thumbnailUrl: undefined,
            type: "image",
            isNew: false,
          });
        }

        setMediaFiles(existingMedia);
        setImageError(null);
        setIsDataReady(true);
      });
    }
  }, [isOpen, publication]); // REMOVED isDirty dependency to allow media sync

  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    // Check if there's already a video
    const hasVideo = mediaFiles.some((m) => m.type.includes("video"));

    const newFiles = Array.from(files);
    const newVideos = newFiles.filter((f) => f.type.startsWith("video/"));

    if (hasVideo && newVideos.length > 0) {
      toast.error(
        t("publications.modal.validation.singleVideo") ||
          "Solo puedes subir un video por publicación.",
      );
      return;
    }

    if (newVideos.length > 1) {
      toast.error(
        t("publications.modal.validation.singleVideo") ||
          "Solo puedes subir un video por publicación.",
      );
      return;
    }

    const newMediaItems = newFiles.map((file) => ({
      tempId: Math.random().toString(36).substring(7),
      url: URL.createObjectURL(file), // Still keep for images if possible, but we'll show placeholder if uploading
      type: file.type.startsWith("image/") ? "image" : "video",
      isNew: true,
      file,
      status: "uploading" as const,
    }));

    addFiles(newMediaItems);
    setImageError(null);

    // Get upload queue functions
    const { linkUploadToPublication } = useUploadQueue.getState();

    for (const item of newMediaItems) {
      // Auto-start upload immediately
      if (item.file) {
        uploadFile(item.file, item.tempId).catch((err) =>
          console.error("Auto-upload failed", err),
        );
        // CRITICAL FIX: If editing an existing publication, link immediately
        // so attachMedia gets called when upload completes
        if (publication?.id) {
          linkUploadToPublication(
            item.tempId,
            publication.id,
            publication.title,
          );
        }
      }

      if (item.type === "video" && item.file) {
        try {
          const duration = await getVideoDuration(item.file);
          const youtubeType = duration <= 60 ? "short" : "video";
          setVideoMetadata(item.tempId, { duration, youtubeType });

          setPlatformSettings((prev) => {
            const updated = { ...prev };
            if (!updated.youtube) updated.youtube = {};
            updated.youtube.type = youtubeType;
            if (!updated.instagram) updated.instagram = {};
            if (!updated.instagram.type) updated.instagram.type = "reel";
            return updated;
          });
        } catch (e) {
          console.error("Video duration error", e);
        }
      }
    }
  };

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(Math.floor(video.duration));
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const handleRemoveMedia = (index: number) => {
    const file = mediaFiles[index];
    if (file && !file.isNew && file.id) {
      setRemovedMediaIds((prev) => [...prev, file.id!]);
    }
    removeFile(index);
  };

  const handleHashtagChange = (value: string) => {
    const isDeleting = value.length < prevHashtagsRef.current.length;
    const endsWithSpace = value.endsWith(" ");

    let formatted = value;

    if (!isDeleting && endsWithSpace && value.trim().length > 0) {
      const tags = value.trim().split(/\s+/);
      const processedTags = tags.map((tag) =>
        tag.startsWith("#") ? tag : `#${tag}`,
      );
      formatted = processedTags.join(" ") + " #";
    } else if (!endsWithSpace) {
      const tags = value.split(/\s+/);
      formatted = tags
        .map((tag, index) => {
          if (tag.length === 0) return "";
          if (tag === "#") return "#";
          return tag.startsWith("#") ? tag : `#${tag}`;
        })
        .join(" ");
    }

    prevHashtagsRef.current = formatted;
    setValue("hashtags", formatted, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const handleAccountToggle = (accountId: number) => {
    const current = watched.social_accounts || [];
    const isAlreadySelected = current.includes(accountId);

    let nextAccounts;
    if (!isAlreadySelected) {
      nextAccounts = [...current, accountId];
    } else {
      nextAccounts = current.filter((x) => x !== accountId);
      const newScheds = { ...accountSchedules };
      delete newScheds[accountId];
      setAccountSchedules(newScheds);
    }

    setValue("social_accounts", nextAccounts, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const handleClose = () => {
    reset();
    clearMedia();
    setRemovedMediaIds([]);
    setAccountSchedules({});
    setImageError(null);
    onClose();
  };

  const onFormSubmit = async (data: PublicationFormData) => {
    if (mediaFiles.length === 0) {
      setImageError(t("publications.modal.validation.imageRequired"));
      return;
    }

    if (data.social_accounts && data.social_accounts.length > 0) {
      const hasGlobalSchedule = !!data.scheduled_at;
      const allAccountsHaveSchedule = data.social_accounts.every(
        (id) => accountSchedules[id] || hasGlobalSchedule,
      );

      if (!allAccountsHaveSchedule && !data.scheduled_at) {
        toast.error(
          t("publications.modal.validation.scheduleRequired") ||
            "Debes programar una fecha para todas las redes seleccionadas o establecer una fecha global.",
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description || "");
      formData.append("goal", data.goal || "");
      formData.append("hashtags", data.hashtags || "");

      if (data.campaign_id && data.campaign_id !== "") {
        formData.append("campaign_id", data.campaign_id.toString());
      } else {
        formData.append("campaign_id", "");
      }

      const socialAccounts = data.social_accounts || [];
      const currentStatus = getValues("status") || "draft";
      const validStatuses = [
        "draft",
        "published",
        "publishing",
        "failed",
        "pending_review",
        "approved",
        "scheduled",
        "rejected",
      ];
      const finalStatus =
        socialAccounts.length === 0 && !data.scheduled_at
          ? "draft"
          : validStatuses.includes(currentStatus)
            ? currentStatus
            : "draft";

      formData.append("status", finalStatus);
      formData.append("scheduled_at", data.scheduled_at || "");
      formData.append("social_accounts_sync", "true");

      socialAccounts.forEach((id, index) => {
        formData.append(`social_accounts[${index}]`, id.toString());
        if (id && accountSchedules[id]) {
          formData.append(
            `social_account_schedules[${id}]`,
            accountSchedules[id],
          );
        }
      });

      // CRITICAL: Read mediaFiles FRESH from store (not from stale selector)
      // This ensures we get the updated metadata after S3 upload
      const currentMediaFiles = useMediaStore.getState().mediaFiles;

      // 1. Filter out files that are still uploading (File objects)
      // We will link them later via background process
      const readyMediaFiles = (currentMediaFiles || []).filter((media) => {
        // Keep key-based (uploaded) files or existing IDs
        const isUploaded =
          typeof media.file === "object" && "key" in media.file;
        const isExisting = !media.isNew && media.id;
        return isUploaded || isExisting;
      });

      readyMediaFiles.forEach((media, index) => {
        const hasNewThumbnail = thumbnails[media.tempId];

        if (media.isNew && media.file) {
          // It's S3 metadata, send it as-is
          formData.append(`media[${index}][key]`, (media.file as any).key);
          formData.append(
            `media[${index}][filename]`,
            (media.file as any).filename,
          );
          formData.append(
            `media[${index}][mime_type]`,
            (media.file as any).mime_type,
          );
          formData.append(
            `media[${index}][size]`,
            (media.file as any).size.toString(),
          );

          if (videoMetadata[media.tempId]) {
            formData.append(
              `youtube_types_new[${index}]`,
              videoMetadata[media.tempId].youtubeType,
            );
            formData.append(
              `durations_new[${index}]`,
              videoMetadata[media.tempId].duration.toString(),
            );
          }

          if (hasNewThumbnail) {
            formData.append(`thumbnails[${index}]`, hasNewThumbnail);
            if (media.type === "video") {
              formData.append("youtube_thumbnail", hasNewThumbnail);
            }
          }
        } else if (!media.isNew && media.id) {
          // Send media_keep_ids to the backend to track existing media
          formData.append("media_keep_ids[]", media.id.toString());

          // ONLY add to formData if it's new or modified.
          // BUT UpdatePublicationAction doesn't currently use a 'media' array for existing items
          // unless they are new uploads. So we only need to send the ID in media_keep_ids.

          if (hasNewThumbnail) {
            formData.append(`thumbnails[${media.id}]`, hasNewThumbnail);
            if (media.type === "video") {
              formData.append("youtube_thumbnail", hasNewThumbnail);
              formData.append(
                "youtube_thumbnail_video_id",
                media.id.toString(),
              );
            }
          }
        }
      });

      if (removedMediaIds && removedMediaIds.length > 0) {
        removedMediaIds.forEach((id) =>
          formData.append("removed_media_ids[]", id.toString()),
        );
      }

      if (removedThumbnailIds && removedThumbnailIds.length > 0) {
        removedThumbnailIds.forEach((id) =>
          formData.append("removed_thumbnail_ids[]", id.toString()),
        );
      }

      if (platformSettings) {
        formData.append("platform_settings", JSON.stringify(platformSettings));
      }

      let result: any;
      if (publication) {
        result = await updatePublicationStore(publication.id, formData);
      } else {
        result = await createPublication(formData);
      }

      if (result) {
        toast.success(
          publication
            ? t("publications.messages.updateSuccess")
            : t("publications.messages.createSuccess"),
        );
      }

      // 2. LINK PENDING UPLOADS (Moving this to background, non-awaited for UI snappiness)
      // Identify files that were filtered out (File objects)
      const pendingFiles = (currentMediaFiles || []).filter(
        (media) => media.isNew && media.file instanceof File,
      );

      const handleBackgroundLinking = async (
        pubId: number,
        pubTitle?: string,
      ) => {
        // 2.a Lock Media for others
        try {
          await axios.post(route("api.v1.publications.lock-media", pubId));
        } catch (err) {
          console.error("Failed to lock media", err);
        }

        // 2.b Link in Store and handle already completed
        const uploadQueueState = useUploadQueue.getState();
        const linkUploadToPublication =
          uploadQueueState.linkUploadToPublication;
        const removeUpload = uploadQueueState.removeUpload;
        const queueObj = uploadQueueState.queue;

        let attachedImmediately = false;

        for (const media of pendingFiles) {
          const queueItem = queueObj[media.tempId];

          // If already finished uploading before we saved, we must attach manually NOW
          if (
            queueItem &&
            queueItem.status === "completed" &&
            !queueItem.publicationId
          ) {
            try {
              const { data: attachResult } = await axios.post(
                route("api.v1.publications.attach-media", pubId),
                {
                  key: queueItem.s3Key,
                  filename: queueItem.file.name,
                  mime_type: queueItem.file.type,
                  size: queueItem.file.size,
                },
              );

              // Also sync DB ID to mediaStore here
              if (attachResult.media_file?.id) {
                useMediaStore.getState().updateFile(media.tempId, {
                  id: attachResult.media_file.id,
                  isNew: false,
                });
              }

              // removeUpload(media.tempId); // REMOVED: Keep in queue so user sees completion
              attachedImmediately = true;
            } catch (e) {
              console.error("Failed to attach completed media", e);
            }
          } else {
            // Otherwise, link it so useS3Upload attaches it when done
            linkUploadToPublication(media.tempId, pubId, pubTitle);
          }
        }

        if (attachedImmediately) {
          router.reload({ only: ["publications", "publication"] });
        }
      };

      if (pendingFiles.length > 0 && result) {
        const pubId = (result as any).id || (result as any).publication?.id;
        const pubTitle =
          (result as any).title || (result as any).publication?.title;

        if (pubId) {
          handleBackgroundLinking(pubId, pubTitle);
          toast.success(
            t("publications.modal.media.backgroundUpload") ||
              "Saved! Media is uploading in background.",
          );
        }
      }

      // CLOSE IMMEDIATELY - Don't wait for background linking or status checks
      setIsSubmitting(false);
      handleClose();
      if (onSubmitSuccess) onSubmitSuccess(true);
    } catch (error: any) {
      console.error(
        "Submission error details:",
        error.response?.data || error.message,
      );
      toast.error(
        error.response?.data?.message || t("publications.messages.error"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const onInvalidSubmit = (errs: any) => {
    console.error("Form Validation Errors:", errs);

    const errorFields = Object.keys(errs)
      .map((key) => t(`publications.modal.add.${key}`) || key)
      .join(", ");

    toast.error(
      `${t("common.errors.checkFormErrors")}${
        errorFields ? `: ${errorFields}` : ""
      }`,
    );

    if (mediaFiles.length === 0) {
      setImageError(t("publications.modal.validation.imageRequired"));
    }
  };

  return {
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
    removedThumbnailIds,
    setThumbnail,
    clearThumbnail,
    setVideoMetadata,
    handleFileChange,
    handleRemoveMedia,
    handleHashtagChange,
    handleAccountToggle,
    handleClose,
    handleSubmit: handleSubmit(onFormSubmit, onInvalidSubmit),
    fileInputRef,

    // Platform control
    platformSettings,
    setPlatformSettings,
    activePlatformSettings,
    setActivePlatformSettings,
    activePlatformPreview,
    setActivePlatformPreview,
    accountSchedules,
    setAccountSchedules,

    setValue,
    trigger,
    control,

    // Data loading state
    isDataReady,
    remoteLock,

    // Upload state
    uploadingFiles,
    isS3Uploading,
    uploadProgress,
    uploadStats: isS3Uploading ? uploadStats : {},
    uploadErrors,
    isAnyMediaProcessing:
      mediaFiles.some(
        (m) => m.status === "uploading" || m.status === "processing",
      ) ||
      isS3Uploading ||
      (publication?.status as string) === "processing" ||
      (!!publication?.media_locked_by &&
        (publication.media_locked_by as any).id !== user?.id),
  };
};
