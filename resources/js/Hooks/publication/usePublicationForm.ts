import { PublicationFormData, publicationSchema } from "@/schemas/publication";
import { useMediaStore } from "@/stores/mediaStore";
import { usePublicationStore } from "@/stores/publicationStore";
import { PageProps } from "@/types";
import { Publication } from "@/types/Publication";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePage } from "@inertiajs/react";
import { useEffect, useMemo, useRef, useState } from "react";
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
    (s) => s.updatePublicationStore
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

  // Platform settings and previews
  const [platformSettings, setPlatformSettings] = useState<Record<string, any>>(
    {}
  );
  const [activePlatformSettings, setActivePlatformSettings] = useState<
    string | null
  >(null);
  const [activePlatformPreview, setActivePlatformPreview] = useState<
    string | null
  >(null);
  const [accountSchedules, setAccountSchedules] = useState<
    Record<number, string>
  >({});

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
      status: "published",
    },
  });

  const {
    reset,
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
    trigger,
    getValues,
  } = form;
  const watched = watch();

  // Unified logging for errors
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.warn("Publication Form Errors:", errors);
    }
  }, [errors]);

  // Load initial data
  useEffect(() => {
    if (isOpen) {
      if (publication) {
        reset({
          title: publication.title || "",
          description: publication.description || "",
          goal: publication.goal || "",
          hashtags: publication.hashtags || "",
          campaign_id: publication.campaigns?.[0]?.id?.toString() || null,
          // Only include accounts with pending schedules, not published ones
          // Published accounts are managed separately and shouldn't be in social_accounts
          social_accounts: Array.from(
            new Set(
              publication.scheduled_posts
                ?.filter((sp) => sp.status === "pending")
                .map((sp) => sp.social_account_id) || []
            )
          ),
          scheduled_at: publication.scheduled_at || null,
          status:
            publication.status === "published" ||
            publication.status === "scheduled" ||
            publication.status === "publishing"
              ? "published"
              : "draft",
          lock_content: !!publication.social_post_logs?.some(
            (l) => l.status === "published" || l.status === "publishing"
          ),
        });

        setPlatformSettings(publication.platform_settings || {});

        // Get published and publishing account IDs to exclude from schedules
        const publishedAccountIds = new Set(
          publication.social_post_logs
            ?.filter(
              (l) => l.status === "published" || l.status === "publishing"
            )
            .map((l) => l.social_account_id) || []
        );

        const initialAccountSchedules: Record<number, string> = {};
        const scheds =
          publication.scheduled_posts || (publication as any).scheduledPosts;
        if (scheds) {
          scheds.forEach((sp: any) => {
            // Only load schedule if account is NOT published or publishing
            if (
              sp.social_account_id &&
              sp.scheduled_at &&
              !publishedAccountIds.has(sp.social_account_id)
            ) {
              initialAccountSchedules[sp.social_account_id] = sp.scheduled_at;
            }
          });
        }
        setAccountSchedules(initialAccountSchedules);

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

            // Map thumbnail from derivatives if available
            const thumbDerivative = media.derivatives?.find(
              (d: any) =>
                d.derivative_type === "thumbnail" ||
                d.derivative_type === "thumb"
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
            };
          }) || [];

        // Fallback for single image publications without media_files relationship
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
      } else {
        reset({
          title: "",
          description: "",
          goal: "",
          hashtags: "",
          campaign_id: null,
          social_accounts: [],
          scheduled_at: null,
          lock_content: false,
        });
        setPlatformSettings(user?.global_platform_settings || {});
        clearMedia();
      }
    }
  }, [
    isOpen,
    publication,
    reset,
    setMediaFiles,
    clearMedia,
    user?.global_platform_settings,
  ]);

  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newMediaItems = Array.from(files).map((file) => ({
      tempId: Math.random().toString(36).substring(7),
      url: URL.createObjectURL(file),
      type: file.type.startsWith("image/") ? "image" : "video",
      isNew: true,
      file,
    }));

    addFiles(newMediaItems);
    setImageError(null);

    for (const item of newMediaItems) {
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
    const formatted = value
      .split(/\s+/)
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)
      .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
      .join(" ");
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

    // Validation: Require dates if social accounts are selected
    if (data.social_accounts && data.social_accounts.length > 0) {
      const hasGlobalSchedule = !!data.scheduled_at;
      const allAccountsHaveSchedule = data.social_accounts.every(
        (id) => accountSchedules[id] || hasGlobalSchedule
      );

      if (!allAccountsHaveSchedule && !data.scheduled_at) {
        toast.error(
          t("publications.modal.validation.scheduleRequired") ||
            "Debes programar una fecha para todas las redes seleccionadas o establecer una fecha global."
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

      // Fix campaign_id handling
      if (data.campaign_id && data.campaign_id !== "") {
        formData.append("campaign_id", data.campaign_id.toString());
      } else {
        formData.append("campaign_id", "");
      }

      const socialAccounts = data.social_accounts || [];

      // If no accounts selected and no date selected, it's effectively a draft now
      const finalStatus =
        socialAccounts.length === 0 && !data.scheduled_at
          ? "draft"
          : getValues("status") || "draft";

      formData.append("status", finalStatus);

      // Always send scheduled_at, even if null, to allow clearing it on the backend
      formData.append("scheduled_at", data.scheduled_at || "");

      // Flag to tell the backend to sync social accounts, even if the list is empty
      formData.append("social_accounts_sync", "true");

      socialAccounts.forEach((id, index) => {
        formData.append(`social_accounts[${index}]`, id.toString());
        if (id && accountSchedules[id]) {
          formData.append(
            `social_account_schedules[${id}]`,
            accountSchedules[id]
          );
        }
      });

      (mediaFiles || []).forEach((media, index) => {
        const hasNewThumbnail = thumbnails[media.tempId];

        if (media.isNew && media.file) {
          formData.append(`media[${index}]`, media.file);

          if (videoMetadata[media.tempId]) {
            formData.append(
              `youtube_types_new[${index}]`,
              videoMetadata[media.tempId].youtubeType
            );
            formData.append(
              `durations_new[${index}]`,
              videoMetadata[media.tempId].duration.toString()
            );
          }

          if (hasNewThumbnail) {
            // For new videos, we also send as standard thumbnails array
            formData.append(`thumbnails[${index}]`, hasNewThumbnail);

            // If it's the first video, also send as youtube_thumbnail for broader compatibility
            if (media.type === "video") {
              formData.append("youtube_thumbnail", hasNewThumbnail);
            }
          }
        } else if (!media.isNew && media.id) {
          // Tell backend to keep this existing media
          formData.append("media_keep_ids[]", media.id.toString());

          // If a new thumbnail was set for this existing media
          if (hasNewThumbnail) {
            formData.append(`thumbnails[${media.id}]`, hasNewThumbnail);

            // Special handling for video thumbnails to match specialized uploader format
            if (media.type === "video") {
              formData.append("youtube_thumbnail", hasNewThumbnail);
              formData.append(
                "youtube_thumbnail_video_id",
                media.id.toString()
              );
            }
          }
        }
      });

      if (removedMediaIds && removedMediaIds.length > 0) {
        removedMediaIds.forEach((id) =>
          formData.append("removed_media_ids[]", id.toString())
        );
      }

      if (removedThumbnailIds && removedThumbnailIds.length > 0) {
        removedThumbnailIds.forEach((id) =>
          formData.append("removed_thumbnail_ids[]", id.toString())
        );
      }

      if (platformSettings) {
        formData.append("platform_settings", JSON.stringify(platformSettings));
      }

      let result;
      if (publication) {
        result = await updatePublicationStore(publication.id, formData);
      } else {
        result = await createPublication(formData);
      }

      if (result) {
        toast.success(
          publication
            ? t("publications.messages.updateSuccess")
            : t("publications.messages.createSuccess")
        );
        onSubmitSuccess?.(true);
        handleClose();
      }
    } catch (error: any) {
      console.error(
        "Submission error details:",
        error.response?.data || error.message
      );
      toast.error(
        error.response?.data?.message || t("publications.messages.error")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const onInvalidSubmit = (errs: any) => {
    console.error("Form Validation Errors:", errs);

    // Get field names for a more helpful message
    const errorFields = Object.keys(errs)
      .map((key) => t(`publications.modal.add.${key}`) || key)
      .join(", ");

    toast.error(
      `${t("common.errors.checkFormErrors")}${
        errorFields ? `: ${errorFields}` : ""
      }`
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
  };
};
