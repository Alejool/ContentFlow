import { zodResolver } from "@hookform/resolvers/zod";
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
import SocialAccountsSection from "@/Components/ManageContent/Publication/common/add/SocialAccountsSection";
import ContentSection from "@/Components/ManageContent/Publication/common/edit/ContentSection";
import MediaUploadSection from "@/Components/ManageContent/Publication/common/edit/MediaUploadSection";
import ModalFooter from "@/Components/ManageContent/modals/common/ModalFooter";
import ModalHeader from "@/Components/ManageContent/modals/common/ModalHeader";
import ScheduleSection from "@/Components/ManageContent/modals/common/ScheduleSection";
import YouTubeThumbnailUploader from "@/Components/common/ui/YouTubeThumbnailUploader";

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

  // Estilos
  const modalBg = theme === "dark" ? "bg-neutral-800" : "bg-white";
  const borderColor =
    theme === "dark" ? "border-neutral-600" : "border-gray-200";

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

    const previews = initializeMediaPreviews(pub);
    setMediaPreviews(previews);
    setMediaFiles([]);
  };

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

  const handleFileChange = (files: FileList | null) => {
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
    const current = watched.social_accounts || [];
    const id = Number(accountId);
    const isChecked = current.includes(id);

    if (!isChecked) {
      setValue("social_accounts", [...current, id]);
    } else {
      setValue(
        "social_accounts",
        current.filter((x: number) => x !== id)
      );
      const newScheds = { ...accountSchedules };
      delete newScheds[id];
      setAccountSchedules(newScheds);
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

    if (data.scheduled_at) submitData.append("scheduled_at", data.scheduled_at);

    if (data.social_accounts && data.social_accounts.length > 0) {
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
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 ${
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
        className={`relative w-full max-w-4xl ${modalBg} rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300`}
      >
        <ModalHeader theme={theme} t={t} onClose={onClose} />

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Columna izquierda: Medios y programación */}
              <div className="space-y-6">
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
                />

                <ScheduleSection
                  scheduledAt={watched.scheduled_at}
                  theme={theme}
                  t={t}
                  onScheduleChange={(date) => setValue("scheduled_at", date)}
                />

                {watched.scheduled_at && (
                  <SocialAccountsSection
                    socialAccounts={socialAccounts}
                    selectedAccounts={watched.social_accounts || []}
                    accountSchedules={accountSchedules}
                    theme={theme}
                    t={t}
                    onAccountToggle={handleAccountToggle}
                    onScheduleChange={handleScheduleChange}
                    onScheduleRemove={handleScheduleRemove}
                  />
                )}

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
                      theme={theme}
                    />
                  </div>
                )}
              </div>

              {/* Columna derecha: Contenido */}
              <div className="space-y-6">
                <ContentSection
                  register={register}
                  errors={errors}
                  watched={watched}
                  theme={theme}
                  t={t}
                  campaigns={campaigns}
                  publication={publication}
                  onHashtagChange={handleHashtagChange}
                />
              </div>
            </div>

            <ModalFooter
              theme={theme}
              t={t}
              isSubmitting={isSubmitting}
              onClose={onClose}
              borderColor={borderColor}
            />
          </form>
        </div>
      </div>
    </div>
  );
}
