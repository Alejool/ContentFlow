import { PageProps } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePage } from "@inertiajs/react";
import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
// Hooks
import { useTheme } from "@/Hooks/useTheme";
// Stores
import { useCampaignStore } from "@/stores/campaignStore";
import { usePublicationStore } from "@/stores/publicationStore";
import { useAccountsStore } from "@/stores/socialAccountsStore";
// Schemas
import { publicationSchema } from "@/schemas/publication";
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
import { AlertCircle } from "lucide-react";

type EditPublicationFormData = {
  title: string;
  description: string;
  goal?: string;
  hashtags?: string;
  scheduled_at?: string;
  social_accounts?: number[];
  campaign_id?: string;
};

interface EditPublicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  publication: Publication | null;
  onSubmit: (success: boolean) => void;
}

const validateFile = (file: File, t: any) => {
  if (file.size > 50 * 1024 * 1024) {
    return t("publications.modal.validation.imageSize");
  }

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "video/mp4",
    "video/quicktime",
    "video/x-msvideo",
  ];
  if (!allowedTypes.includes(file.type)) {
    return t("publications.modal.validation.imageType");
  }

  return null;
};

export default function EditPublicationModal({
  isOpen,
  onClose,
  publication,
  onSubmit,
}: EditPublicationModalProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const { updatePublication } = usePublicationStore();
  const { campaigns } = useCampaignStore();
  const { accounts: socialAccounts } = useAccountsStore();
  const { props } = usePage<PageProps>();
  const user = props.auth.user;

  const [accountSchedules, setAccountSchedules] = useState<
    Record<number, string>
  >({});
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<any[]>([]);
  const [thumbnails, setThumbnails] = useState<Record<string, File>>({});
  const [imageError, setImageError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [youtubeThumbnail, setYoutubeThumbnail] = useState<File | null>(null);
  const [existingThumbnail, setExistingThumbnail] = useState<{
    url: string;
    id: number;
  } | null>(null);

  const [platformSettings, setPlatformSettings] = useState<Record<string, any>>(
    {}
  );
  const [activePlatformSettings, setActivePlatformSettings] = useState<
    string | null
  >(null);
  const [activePlatformPreview, setActivePlatformPreview] = useState<
    string | null
  >(null);
  const [removedMediaIds, setRemovedMediaIds] = useState<number[]>([]);

  const hasPublishedPlatform = useMemo(() => {
    if (!publication) return false;
    return publication.social_post_logs?.some(
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

  const allConnectedArePublished = useMemo(() => {
    if (!publication || !publication.social_post_logs) return false;
    // This is hard to check accurately without knowing connected accounts from here,
    // but we can assume if there are any that are NOT published, it's not "all".
    // For now, let's stick to the logic that if at least one is published, we lock main content.
    return hasPublishedPlatform;
  }, [publication, hasPublishedPlatform]);

  const schema = useMemo(() => publicationSchema(t), [t]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      goal: "",
      hashtags: "",
      scheduled_at: "",
      social_accounts: [],
      campaign_id: "",
    },
  });

  const watched = watch();
  const modalBg = theme === "dark" ? "bg-neutral-800" : "bg-white";

  useEffect(() => {
    if (publication) {
      initializeFormData(publication);
    }
  }, [publication, isOpen, reset]);

  const initializeFormData = (pub: Publication) => {
    const schedules: Record<number, string> = {};
    const scheduledAccountIds: number[] = [];

    pub.scheduled_posts?.forEach((post) => {
      if (post.scheduled_at) {
        schedules[post.social_account_id] = post.scheduled_at;
        scheduledAccountIds.push(post.social_account_id);
      }
    });
    setAccountSchedules(schedules);

    reset({
      title: pub.title || "",
      description: pub.description || "",
      goal: (pub as any).goal || "",
      hashtags: pub.hashtags || "",
      scheduled_at:
        pub.scheduled_at && new Date(pub.scheduled_at) > new Date()
          ? new Date(pub.scheduled_at).toISOString().slice(0, 16)
          : "",
      social_accounts: scheduledAccountIds,
      campaign_id: pub.campaigns?.[0]?.id?.toString() || "",
    });

    if (pub.platform_settings) {
      let settings = pub.platform_settings;
      if (typeof settings === "string") {
        try {
          settings = JSON.parse(settings);
        } catch (e) {
          settings = {};
        }
      }
      setPlatformSettings(Array.isArray(settings) ? {} : settings);
    } else {
      setPlatformSettings(user?.global_platform_settings || {});
    }

    const previews = initializeMediaPreviews(pub);
    setMediaPreviews(previews);
    setMediaFiles([]);
    setRemovedMediaIds([]); // Reset removed media IDs on initialization
  };

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "metadata";

      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(Math.floor(video.duration));
      };

      video.onerror = () => {
        reject(new Error("Failed to load video metadata"));
      };

      video.src = URL.createObjectURL(file);
    });
  };

  const [videoMetadata, setVideoMetadata] = useState<
    Record<string, { duration: number; youtubeType: "short" | "video" }>
  >({});

  const initializeMediaPreviews = (pub: Publication) => {
    const previews: any[] = [];

    pub.media_files?.forEach((media: any) => {
      if (!media.file_path) return;
      const url = media.file_path.startsWith("http")
        ? media.file_path
        : `/storage/${media.file_path}`;

      let thumbnailUrl;
      if (media.file_type.includes("video")) {
        const thumbnail = media.derivatives?.find(
          (d: any) =>
            d.derivative_type === "thumbnail" &&
            (d.platform === "youtube" ||
              d.platform === "all" ||
              d.platform === "generic")
        );
        if (thumbnail) {
          if (!thumbnail.file_path) return;
          thumbnailUrl = thumbnail.file_path.startsWith("http")
            ? thumbnail.file_path
            : `/storage/${thumbnail.file_path}`;

          setExistingThumbnail({
            url: thumbnailUrl,
            id: thumbnail.id,
          });
        }
      }

      previews.push({
        id: media.id,
        tempId: `existing_${media.id}`,
        url,
        type: media.file_type,
        isNew: false,
        thumbnailUrl,
      });
    });

    if (!pub.media_files || pub.media_files.length === 0) {
      if ((pub as any).image) {
        previews.push({
          tempId: "legacy_image",
          url: (pub as any).image,
          type: "image/jpeg",
          isNew: false,
        });
      }
    }

    return previews;
  };

  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    const validFiles: File[] = [];
    const newPreviews: any[] = [];
    let error = null;

    for (const file of newFiles) {
      const validationError = validateFile(file, t);
      if (validationError) {
        error = validationError;
        break;
      }
      validFiles.push(file);
      const tempId = `new_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      newPreviews.push({
        tempId,
        url: URL.createObjectURL(file),
        type: file.type,
        isNew: true,
      });

      if (file.type.startsWith("video/")) {
        try {
          const duration = await getVideoDuration(file);
          const youtubeType = duration <= 60 ? "short" : "video";

          setVideoMetadata((prev) => ({
            ...prev,
            [tempId]: {
              duration,
              youtubeType,
            },
          }));

          // Auto-sync with platform settings
          setPlatformSettings((prev) => {
            const updated = { ...prev };

            // YouTube sync
            if (!updated.youtube) updated.youtube = {};
            updated.youtube.type = youtubeType;

            // Instagram sync - Default to Reels for videos
            if (!updated.instagram) updated.instagram = {};
            if (!updated.instagram.type) updated.instagram.type = "reel";

            return updated;
          });
        } catch (err) {
          console.error("Failed to get video duration:", err);
        }
      }
    }

    if (error) {
      setImageError(error);
      return;
    }

    setImageError(null);
    setMediaFiles((prev) => [...prev, ...validFiles]);
    setMediaPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeMedia = (index: number) => {
    const previewToRemove = mediaPreviews[index];
    if (previewToRemove.isNew) {
      let newFileIndex = 0;
      for (let i = 0; i < index; i++) {
        if (mediaPreviews[i].isNew) newFileIndex++;
      }
      setMediaFiles((prev) => prev.filter((_, i) => i !== newFileIndex));
    } else if (previewToRemove.id) {
      // If it's an existing media file, add its ID to the removedMediaIds list
      setRemovedMediaIds((prev) => [...prev, previewToRemove.id]);
    }

    if (thumbnails[previewToRemove.tempId]) {
      const newThumbs = { ...thumbnails };
      delete newThumbs[previewToRemove.tempId];
      setThumbnails(newThumbs);
    }

    setMediaPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer?.files;
    handleFileChange(files);
  };

  const handleHashtagChange = (value: string) => {
    const formatted = value
      .split(/\s+/)
      .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
      .join(" ");
    setValue("hashtags", formatted, { shouldValidate: true });
  };

  const handleAccountToggle = (accountId: number) => {
    // Don't allow toggling off if already published or publishing
    if (
      publishedAccountIds.includes(accountId) ||
      publishingAccountIds.includes(accountId)
    ) {
      return;
    }

    const current = watched.social_accounts || [];
    const isChecked = current.includes(accountId);

    if (!isChecked) {
      setValue("social_accounts", [...current, accountId]);
    } else {
      setValue(
        "social_accounts",
        current.filter((id) => id !== accountId)
      );
      // Also remove its individual schedule if it exists
      const newSchedules = { ...accountSchedules };
      delete newSchedules[accountId];
      setAccountSchedules(newSchedules);
    }
  };

  const handleScheduleChange = (accountId: number, schedule: string) => {
    setAccountSchedules((prev) => ({
      ...prev,
      [accountId]: schedule,
    }));
  };

  const handleScheduleRemove = (accountId: number) => {
    const newSchedules = { ...accountSchedules };
    delete newSchedules[accountId];
    setAccountSchedules(newSchedules);
  };

  const onFormSubmit = async (data: EditPublicationFormData) => {
    if (!publication) return;
    if (data.social_accounts && data.social_accounts.length > 0) {
      const hasSomeSchedule =
        data.scheduled_at ||
        data.social_accounts.some((id: number) => accountSchedules[id]);
      if (!hasSomeSchedule) {
        toast.error(t("publications.modal.validation.scheduleDateRequired"));
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await submitPublicationData(data, publication);
      onSubmit(true);
      toast.success(
        t("publications.messages.updateSuccess") || "Publication updated"
      );
    } catch (error: any) {
      console.error("Error updating publication:", error);
      toast.error(
        error.response?.data?.message || t("publications.messages.updateError")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitPublicationData = async (
    data: EditPublicationFormData,
    pub: Publication
  ) => {
    const submitData = new FormData();
    submitData.append("title", data.title);
    submitData.append("description", data.description);
    if (data.goal) submitData.append("goal", data.goal);
    if (data.hashtags) submitData.append("hashtags", data.hashtags);

    const mediaFilesToKeep = mediaPreviews
      .filter((p) => !p.isNew && p.id)
      .map((p) => p.id as number);

    mediaFiles.forEach((file, index) => {
      submitData.append(`media[${index}]`, file);

      // Find the tempId for this new file to get its metadata
      const newPreviews = mediaPreviews.filter((p) => p.isNew);
      if (newPreviews[index]) {
        const metadata = videoMetadata[newPreviews[index].tempId];
        if (metadata) {
          submitData.append(
            `youtube_types_new[${index}]`,
            metadata.youtubeType
          );
          submitData.append(
            `durations_new[${index}]`,
            metadata.duration.toString()
          );
        }
      }
    });

    Object.entries(thumbnails).forEach(([tempId, file]) => {
      const preview = mediaPreviews.find((p) => p.tempId === tempId);

      if (preview && !preview.isNew && preview.id) {
        submitData.append(`thumbnails[${preview.id}]`, file);
      } else if (preview && preview.isNew) {
        const newPreviews = mediaPreviews.filter((p) => p.isNew);
        const indexInNew = newPreviews.findIndex((p) => p.tempId === tempId);

        if (indexInNew !== -1) {
          submitData.append(`thumbnails[new_${indexInNew}]`, file);
        }
      }
    });

    mediaFilesToKeep.forEach((id: number, index: number) => {
      submitData.append(`media_keep_ids[${index}]`, id.toString());
    });

    // Add removed media IDs to the form data
    removedMediaIds.forEach((id: number, index: number) => {
      submitData.append(`media_remove_ids[${index}]`, id.toString());
    });

    submitData.append("scheduled_at", data.scheduled_at || "");

    if (data.social_accounts) {
      if (data.social_accounts.length === 0) {
        // Send a marker to ensure the backend identifies this as "clear all"
        submitData.append("social_accounts", "");
        submitData.append("social_accounts_sync", "1");
      } else {
        data.social_accounts.forEach((id: number, index: number) => {
          submitData.append(`social_accounts[${index}]`, id.toString());
          if (accountSchedules[id]) {
            submitData.append(
              `social_account_schedules[${id}]`,
              accountSchedules[id]
            );
          }
        });
      }
    }

    if (data.campaign_id) {
      submitData.append("campaign_id", data.campaign_id);
    }

    if (youtubeThumbnail) {
      const videoId = mediaPreviews.find((p) => p.type.includes("video"))?.id;
      if (videoId) {
        submitData.append("youtube_thumbnail", youtubeThumbnail);
        submitData.append("youtube_thumbnail_video_id", videoId.toString());
      }
    }

    if (Object.keys(platformSettings).length > 0) {
      submitData.append("platform_settings", JSON.stringify(platformSettings));
    }

    submitData.append("_method", "PUT");
    const response = await axios.post(`/publications/${pub.id}`, submitData);

    if (response.data && (response.data.publication || response.data.success)) {
      const updatedPub = response.data.publication || response.data.data;
      if (updatedPub) {
        updatePublication(pub.id, updatedPub);
      }

      reset();
      setMediaPreviews([]);
      setMediaFiles([]);
      setRemovedMediaIds([]); // Clear removed media IDs after successful submission
      onClose();
    }
  };

  if (!isOpen || !publication) return null;

  const hasYouTubeAccount = watched.social_accounts?.some((id: number) => {
    const account = socialAccounts.find((a) => a.id === id);
    return account?.platform?.toLowerCase() === "youtube";
  });

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center sm:p-6 ${
        theme === "dark" ? "text-white" : "text-gray-900"
      }`}
    >
      <div
        className={`absolute inset-0 ${
          theme === "dark" ? "bg-black/70" : "bg-gray-900/60"
        } backdrop-blur-sm`}
        onClick={onClose}
      />

      <div
        className={`relative w-full max-w-4xl ${modalBg} rounded-lg shadow-2xl  flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300`}
      >
        <ModalHeader
          theme={theme}
          t={t}
          onClose={onClose}
          title="publications.modal.edit.title"
          subtitle="publications.modal.edit.subtitle"
        />

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <form
            id="editPublicationForm"
            onSubmit={handleSubmit(onFormSubmit)}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                  mediaPreviews={mediaPreviews}
                  thumbnails={thumbnails}
                  imageError={imageError}
                  isDragOver={isDragOver}
                  theme={theme}
                  t={t}
                  onFileChange={handleFileChange}
                  onRemoveMedia={removeMedia}
                  onSetThumbnail={(tempId, file) =>
                    setThumbnails((prev) => ({ ...prev, [tempId]: file }))
                  }
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  disabled={hasPublishedPlatform}
                />

                <SocialAccountsSection
                  socialAccounts={socialAccounts}
                  selectedAccounts={watched.social_accounts || []}
                  accountSchedules={accountSchedules}
                  theme={theme}
                  t={t}
                  onAccountToggle={handleAccountToggle}
                  onScheduleChange={handleScheduleChange}
                  onScheduleRemove={handleScheduleRemove}
                  onPlatformSettingsClick={(platform) =>
                    setActivePlatformSettings(platform)
                  }
                  onPreviewClick={(platform) =>
                    setActivePlatformPreview(platform)
                  }
                  globalSchedule={watched.scheduled_at}
                  publishedAccountIds={publishedAccountIds}
                  publishingAccountIds={publishingAccountIds}
                />

                <ScheduleSection
                  scheduledAt={watched.scheduled_at}
                  theme={theme}
                  t={t}
                  onScheduleChange={(date) => setValue("scheduled_at", date)}
                />

                {hasYouTubeAccount && (
                  <div className="mt-6">
                    <YouTubeThumbnailUploader
                      videoId={
                        mediaPreviews.find((p) => p.type.includes("video"))
                          ?.id || 0
                      }
                      existingThumbnail={existingThumbnail}
                      onThumbnailChange={(file: File | null) =>
                        setYoutubeThumbnail(file)
                      }
                      onThumbnailDelete={() => {
                        setExistingThumbnail(null);
                        setYoutubeThumbnail(null);
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
                  theme={theme}
                  t={t}
                  campaigns={campaigns}
                  publication={publication}
                  onHashtagChange={handleHashtagChange}
                  disabled={hasPublishedPlatform}
                />
              </div>
            </div>

            <ModalFooter
              isSubmitting={isSubmitting}
              onClose={onClose}
              submitText={t("publications.button.edit") || "Edit Campaign"}
              cancelText={t("publications.button.close") || "Close"}
              formId="editPublicationForm"
            />
          </form>
        </div>

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
            media: mediaPreviews
              .filter((p) => p.isNew)
              .map((p) => ({
                preview: p.url,
                file_type: p.type.startsWith("video") ? "video" : "image",
              }))
              .concat(
                (publication.media_files || [])
                  .filter((m: any) => !removedMediaIds.includes(m.id))
                  .map((m: any) => ({
                    preview: m.file_path,
                    file_type: m.file_type,
                  }))
              ),
          }}
          settings={
            platformSettings[activePlatformPreview?.toLowerCase() || ""] || {}
          }
          theme={theme}
        />
      </div>
    </div>
  );
}
