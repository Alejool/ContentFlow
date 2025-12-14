import { useTheme } from "@/Hooks/useTheme";
import { publicationSchema } from "@/schemas/publication";
import { usePublicationStore } from "@/stores/publicationStore";
import { useAccountsStore } from "@/stores/socialAccountsStore";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

// Componentes reutilizables
import SocialAccountsSection from "@/Components/ManageContent/Publication/common/add/SocialAccountsSection";
import ModalHeader from "@/Components/ManageContent/modals/common/ModalHeader";
import ScheduleSection from "@/Components/ManageContent/modals/common/ScheduleSection";
import Input from "@/Components/common/Modern/Input";
import Select from "@/Components/common/Modern/Select";
import Textarea from "@/Components/common/Modern/Textarea";
import { FileText, Hash, Target, Upload } from "lucide-react";

// Componentes nuevos específicos
import AddMoreButton from "@/Components/ManageContent/Publication/common/add/AddMoreButton";
import ImagePreviewItem from "@/Components/ManageContent/Publication/common/add/ImagePreviewItem";
import VideoPreviewItem from "@/Components/ManageContent/Publication/common/add/VideoPreviewItem";

// Hooks
import { useCampaigns } from "@/Hooks/campaign/useCampaigns";

// Iconos
import ModalFooter from "@/Components/ManageContent/modals/common/ModalFooter";
import { AlertTriangle } from "lucide-react";

interface AddPublicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
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

export default function AddPublicationModal({
  isOpen,
  onClose,
  onSubmit,
}: AddPublicationModalProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { addPublication } = usePublicationStore();
  const { accounts: socialAccounts, fetchAccounts: fetchSocialAccounts } =
    useAccountsStore();
  const { campaigns } = useCampaigns();

  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [thumbnails, setThumbnails] = useState<Record<number, File>>({});
  const [videoMetadata, setVideoMetadata] = useState<
    Record<number, { duration: number; youtubeType: "short" | "video" }>
  >({});
  const [imageError, setImageError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accountSchedules, setAccountSchedules] = useState<
    Record<number, string>
  >({});
  const [activePopover, setActivePopover] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const schema = useMemo(() => publicationSchema(t), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm({
    resolver: zodResolver(schema),
    mode: "onChange",
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

  useEffect(() => {
    if (isOpen) {
      fetchSocialAccounts();
    }
  }, [isOpen]);

  // Estilos
  const modalBg = theme === "dark" ? "bg-neutral-800" : "bg-white";
  const modalFooterBg =
    theme === "dark"
      ? "bg-neutral-900/50 border-neutral-700"
      : "bg-gray-50 border-gray-100";
  const borderColor =
    theme === "dark" ? "border-neutral-600" : "border-gray-200";
  const cancelButton =
    theme === "dark"
      ? "text-gray-300 hover:bg-neutral-700"
      : "text-gray-700 hover:bg-gray-200";
  const submitButton =
    theme === "dark"
      ? "bg-gradient-to-r from-primary-600 to-primary-800 hover:shadow-primary-500/20"
      : "bg-gradient-to-r from-primary-600 to-primary-700 hover:shadow-primary-200";

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

  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    const validFiles: File[] = [];
    const newPreviews: string[] = [];
    let error = null;

    for (const file of newFiles) {
      const validationError = validateFile(file, t);
      if (validationError) {
        error = validationError;
        break;
      }
      validFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }

    if (error) {
      setImageError(error);
      return;
    }

    setImageError(null);
    const currentLength = mediaFiles.length;
    setMediaFiles((prev) => [...prev, ...validFiles]);
    setMediaPreviews((prev) => [...prev, ...newPreviews]);

    // Extract duration for videos
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      if (file.type.startsWith("video/")) {
        try {
          const duration = await getVideoDuration(file);
          const index = currentLength + i;
          setVideoMetadata((prev) => ({
            ...prev,
            [index]: {
              duration,
              youtubeType: duration <= 60 ? "short" : "video",
            },
          }));
        } catch (err) {
          console.error("Failed to get video duration:", err);
        }
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    handleFileChange(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const removeMedia = (index: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
    setMediaPreviews((prev) => prev.filter((_, i) => i !== index));

    // Remove video metadata
    setVideoMetadata((prev) => {
      const newMetadata = { ...prev };
      delete newMetadata[index];
      // Reindex remaining items
      const reindexed: Record<
        number,
        { duration: number; youtubeType: "short" | "video" }
      > = {};
      Object.keys(newMetadata).forEach((key) => {
        const oldIndex = parseInt(key);
        if (oldIndex > index) {
          reindexed[oldIndex - 1] = newMetadata[oldIndex];
        } else {
          reindexed[oldIndex] = newMetadata[oldIndex];
        }
      });
      return reindexed;
    });

    if (mediaFiles.length === 1) {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const formatHashtags = (value: string) => {
    if (!value.trim()) return "";

    return value
      .split(/\s+/)
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)
      .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
      .join(" ");
  };

  const handleHashtagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatHashtags(e.target.value);
    setValue("hashtags", formatted, { shouldValidate: true });
  };

  const toggleSchedulePopover = (accountId: number) => {
    setActivePopover(activePopover === accountId ? null : accountId);
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

  const onFormSubmit = async (data: any) => {
    if (mediaFiles.length === 0) {
      setImageError(t("publications.modal.validation.imageRequired"));
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("goal", data.goal);
      formData.append("hashtags", data.hashtags);

      mediaFiles.forEach((file, index) => {
        formData.append(`media[${index}]`, file);
        if (thumbnails[index]) {
          formData.append(`thumbnails[${index}]`, thumbnails[index]);
        }
        if (videoMetadata[index]) {
          formData.append(
            `youtube_types[${index}]`,
            videoMetadata[index].youtubeType
          );
          formData.append(
            `durations[${index}]`,
            videoMetadata[index].duration.toString()
          );
        }
      });

      if (data.scheduled_at) {
        formData.append("scheduled_at", data.scheduled_at);
      }

      if (data.social_accounts && data.social_accounts.length > 0) {
        data.social_accounts.forEach((id: number, index: number) => {
          formData.append(`social_accounts[${index}]`, id.toString());
          if (accountSchedules[id]) {
            formData.append(
              `social_account_schedules[${id}]`,
              accountSchedules[id]
            );
          }
        });
      }

      if (data.campaign_id) {
        formData.append("campaign_id", data.campaign_id);
      }

      const response = await axios.post("/publications", formData);

      if (response.data && response.data.publication) {
        addPublication(response.data.publication);
        if (onSubmit) {
          onSubmit(true);
        }
        handleClose();
        toast.success(
          t("publications.messages.createSuccess") ||
            "Publication created successfully"
        );
      }
    } catch (error: any) {
      console.error("Error submitting form:", error);
      toast.error(
        error.response?.data?.message || t("publications.messages.createError")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setMediaFiles([]);
    setMediaPreviews([]);
    setVideoMetadata({});
    setImageError(null);
    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  const renderMediaPreviews = () => {
    if (mediaPreviews.length === 0) return null;

    return (
      <div className="grid grid-cols-2 gap-4 w-full">
        {mediaPreviews.map((preview, index) => {
          const file = mediaFiles[index];
          const isVideo = file.type.startsWith("video");

          if (isVideo) {
            return (
              <VideoPreviewItem
                key={index}
                preview={preview}
                index={index}
                duration={videoMetadata[index]?.duration}
                youtubeType={videoMetadata[index]?.youtubeType || "video"}
                thumbnail={thumbnails[index]}
                onRemove={() => removeMedia(index)}
                onThumbnailChange={(file) =>
                  setThumbnails((prev) => ({ ...prev, [index]: file }))
                }
                onYoutubeTypeChange={(type) =>
                  setVideoMetadata((prev) => ({
                    ...prev,
                    [index]: { ...prev[index], youtubeType: type },
                  }))
                }
              />
            );
          }

          return (
            <ImagePreviewItem
              key={index}
              preview={preview}
              index={index}
              onRemove={() => removeMedia(index)}
            />
          );
        })}
        <AddMoreButton onClick={() => fileInputRef.current?.click()} />
      </div>
    );
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center  ${
        theme === "dark" ? "text-white" : "text-gray-900"
      }`}
    >
      <div
        className={`absolute inset-0 ${
          theme === "dark" ? "bg-black/70" : "bg-gray-900/60"
        } backdrop-blur-sm transition-opacity`}
        onClick={handleClose}
      />

      <div
        className={`relative w-full max-w-4xl ${modalBg} rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300`}
      >
        <ModalHeader
          theme={theme}
          t={t}
          onClose={handleClose}
          title="publications.modal.add.title"
          subtitle="publications.modal.add.subtitle"
        />
        <main className="flex-1  overflow-y-auto custom-scrollbar">
          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="form-group">
                  <div
                    className={`relative group cursor-pointer transition-all duration-300 ${
                      isDragOver
                        ? `scale-[1.02] ring-2 ${
                            theme === "dark"
                              ? "ring-primary-400"
                              : "ring-primary-500"
                          } ring-offset-2`
                        : ""
                    }`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div
                      className={`min-h-[200px] rounded-lg border-2 border-dashed flex flex-col items-center justify-center  text-center transition-colors overflow-hidden ${
                        imageError
                          ? theme === "dark"
                            ? "border-primary-500 bg-primary-900/20"
                            : "border-primary-300 bg-primary-50"
                          : isDragOver
                          ? theme === "dark"
                            ? "bg-primary-900/20 border-primary-400"
                            : "bg-primary-50 border-primary-500"
                          : theme === "dark"
                          ? "border-neutral-600 hover:border-primary-400 bg-neutral-700"
                          : "border-gray-200 hover:border-primary-300 bg-gray-50"
                      }`}
                    >
                      {renderMediaPreviews() || (
                        <div className="space-y-4">
                          <div
                            className={`w-16 h-16 rounded-full ${
                              theme === "dark"
                                ? "bg-primary-900/30"
                                : "bg-primary-100"
                            } flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300`}
                          >
                            <Upload className="w-8 h-8 text-primary-500" />
                          </div>
                          <div>
                            <p className="font-medium text-lg">
                              {t("publications.modal.add.dragDrop.title")}
                            </p>
                            <p className="text-sm mt-1">
                              {t("publications.modal.add.dragDrop.subtitle")}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      multiple
                      accept="image/*,video/*"
                      onChange={(e) => handleFileChange(e.target.files)}
                    />
                  </div>
                  {imageError && (
                    <p className="mt-2 text-sm text-primary-500 flex items-center gap-1 animate-in slide-in-from-left-1">
                      <AlertTriangle className="w-4 h-4" />
                      {imageError}
                    </p>
                  )}
                </div>

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
              </div>

              {/* Columna derecha: Contenido */}
              <div className="space-y-6">
                <Input
                  id="title"
                  label={t("publications.modal.add.titleField")}
                  type="text"
                  register={register}
                  name="title"
                  placeholder={t("publications.modal.add.placeholders.title")}
                  error={errors.title?.message as string}
                  icon={FileText}
                  theme={theme}
                  variant="filled"
                  required
                  size="md"
                  hint={`${watched.title?.length || 0}/70 characters`}
                />

                <Textarea
                  id="description"
                  label={t("publications.modal.add.description")}
                  register={register}
                  name="description"
                  placeholder={t(
                    "publications.modal.add.placeholders.description"
                  )}
                  error={errors.description?.message as string}
                  icon={FileText}
                  theme={theme}
                  variant="filled"
                  rows={4}
                  maxLength={200}
                  required
                  showCharCount
                  hint="Maximum 200 characters"
                />

                <Input
                  id="goal"
                  label={t("publications.modal.add.goal")}
                  type="text"
                  register={register}
                  name="goal"
                  placeholder={t("publications.modal.add.placeholders.goal")}
                  error={errors.goal?.message as string}
                  icon={Target}
                  theme={theme}
                  variant="filled"
                  required
                  size="md"
                  hint={`${watched.goal?.length || 0}/200 characters`}
                />

                <Input
                  id="hashtags"
                  label={t("publications.modal.add.hashtags")}
                  type="text"
                  register={register}
                  name="hashtags"
                  placeholder={t(
                    "publications.modal.add.placeholders.hashtags"
                  )}
                  error={errors.hashtags?.message as string}
                  onChange={handleHashtagChange}
                  icon={Hash}
                  theme={theme}
                  variant="filled"
                  required
                  size="md"
                  hint={`${
                    watched.hashtags
                      ? watched.hashtags
                          .split(" ")
                          .filter((tag: string) => tag.startsWith("#")).length
                      : 0
                  }/10 hashtags`}
                />

                <Select
                  id="campaign_id"
                  label={
                    t("publications.modal.edit.addCampaign") ||
                    "Add to Campaign"
                  }
                  options={(campaigns || []).map((campaign: any) => ({
                    value: campaign.id,
                    label:
                      campaign.name ||
                      campaign.title ||
                      `Campaign ${campaign.id}`,
                  }))}
                  register={register}
                  name="campaign_id"
                  placeholder={t("common.select") || "Select a campaign..."}
                  error={errors.campaign_id?.message as string}
                  icon={Target}
                  theme={theme}
                  variant="filled"
                  size="md"
                  clearable
                />
              </div>
            </div>
          </form>
        </main>

        <ModalFooter
          onClose={handleClose}
          onSubmit={handleSubmit(onFormSubmit)}
          isSubmitting={isSubmitting}
          theme={theme}
          cancelButton={cancelButton}
          submitButton={submitButton}
          borderColor={borderColor}
          modalFooterBg={modalFooterBg}
        />
      </div>
    </div>
  );
}
