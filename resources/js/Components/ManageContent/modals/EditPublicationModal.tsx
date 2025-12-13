import ModernDatePicker from "@/Components/common/ui/ModernDatePicker";
import YouTubeThumbnailUploader from "@/Components/common/ui/YouTubeThumbnailUploader";
import { useConfirm } from "@/Hooks/useConfirm";
import { useTheme } from "@/Hooks/useTheme";
import { publicationSchema } from "@/schemas/publication";
import { useCampaignStore } from "@/stores/campaignStore";
import { usePublicationStore } from "@/stores/publicationStore";
import { useAccountsStore } from "@/stores/socialAccountsStore";
import { Publication } from "@/types/Publication";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { format } from "date-fns";
import {
  AlertTriangle,
  Clock,
  FileImage,
  FileText,
  Hash,
  Sparkles,
  Target,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

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
  const { campaigns, fetchCampaigns } = useCampaignStore();

  const { confirm } = useConfirm();
  const { accounts: socialAccounts, fetchAccounts: fetchSocialAccounts } =
    useAccountsStore();
  const [accountSchedules, setAccountSchedules] = useState<
    Record<number, string>
  >({});
  const [activePopover, setActivePopover] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<
    {
      id?: number;
      tempId: string;
      url: string;
      type: string;
      isNew: boolean;
      thumbnailUrl?: string;
    }[]
  >([]);
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

  // useEffect(() => {
  //   if (isOpen) {
  //     fetchSocialAccounts();
  //     if (campaigns.length === 0) {
  //       fetchCampaigns().catch(console.error);
  //     }
  //   }
  // }, [isOpen]);

  useEffect(() => {
    if (publication) {
      const schedules: Record<number, string> = {};
      const scheduledAccountIds: number[] = [];

      publication.scheduled_posts?.forEach((post) => {
        if (post.scheduled_at) {
          schedules[post.social_account_id] = post.scheduled_at;
          scheduledAccountIds.push(post.social_account_id);
        }
      });
      setAccountSchedules(schedules);

      reset({
        title: publication.title || "",
        description: publication.description || "",
        goal: (publication as any).goal || "",
        hashtags: publication.hashtags || "",
        scheduled_at:
          publication.scheduled_at &&
          new Date(publication.scheduled_at) > new Date()
            ? new Date(publication.scheduled_at).toISOString().slice(0, 16)
            : "",
        social_accounts: scheduledAccountIds,
        campaign_id: publication.campaigns?.[0]?.id?.toString() || "",
      });

      const previews: {
        id?: number;
        tempId: string;
        url: string;
        type: string;
        isNew: boolean;
        thumbnailUrl?: string;
      }[] = [];

      publication.media_files?.forEach((media: any) => {
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

      if (!publication.media_files || publication.media_files.length === 0) {
        if ((publication as any).image) {
          previews.push({
            tempId: "legacy_image",
            url: (publication as any).image,
            type: "image/jpeg",
            isNew: false,
          });
        }
      }

      setMediaPreviews(previews);
      setMediaFiles([]);
    }
  }, [publication, isOpen, reset]);

  // Styles
  const modalBg = theme === "dark" ? "bg-neutral-800" : "bg-white";
  const modalHeaderBg =
    theme === "dark"
      ? "bg-gradient-to-r from-neutral-900 to-neutral-800"
      : "bg-gradient-to-r from-gray-50 to-white";
  const modalHeaderBorder =
    theme === "dark" ? "border-neutral-700" : "border-gray-100";
  const textPrimary = theme === "dark" ? "text-gray-100" : "text-gray-900";
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-500";
  const textTertiary = theme === "dark" ? "text-gray-500" : "text-gray-400";
  const borderColor =
    theme === "dark" ? "border-neutral-600" : "border-gray-200";
  const focusBorder =
    theme === "dark"
      ? "focus:border-primary-500 focus:ring-primary-500/20"
      : "focus:border-primary-500 focus:ring-primary-200";
  const errorBorder =
    theme === "dark"
      ? "border-primary-500 focus:border-primary-500 focus:ring-primary-500/20"
      : "border-primary-300 focus:border-primary-500 focus:ring-primary-200";
  const inputBg = theme === "dark" ? "bg-neutral-700" : "bg-white";
  const labelText = theme === "dark" ? "text-gray-300" : "text-gray-700";
  const iconColor = theme === "dark" ? "text-primary-400" : "text-primary-600";
  const uploadBg = theme === "dark" ? "bg-neutral-700" : "bg-gray-50";
  const uploadBorder =
    theme === "dark"
      ? "border-neutral-600 hover:border-primary-400"
      : "border-gray-200 hover:border-primary-300";
  const dragOverBg =
    theme === "dark"
      ? "bg-primary-900/20 border-primary-400"
      : "bg-primary-50 border-primary-500";
  const colorIconInput =
    theme === "dark"
      ? `[&::-webkit-calendar-picker-indicator]:invert 
         [&::-webkit-calendar-picker-indicator]:opacity-80
         [&::-webkit-calendar-picker-indicator]:cursor-pointer`
      : "";

  const handleFileChange = (files: FileList | null) => {
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      const validFiles: File[] = [];
      const newPreviews: {
        tempId: string;
        url: string;
        type: string;
        isNew: boolean;
      }[] = [];
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
    }
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

    // Clean up thumbnails state to avoid leaks
    if (thumbnails[previewToRemove.tempId]) {
      const newThumbs = { ...thumbnails };
      delete newThumbs[previewToRemove.tempId];
      setThumbnails(newThumbs);
    }

    setMediaPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer?.files;
    handleFileChange(files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleHashtagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
      .split(/\s+/)
      .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
      .join(" ");
    setValue("hashtags", val);
  };

  const toggleSchedulePopover = (accountId: number) => {
    setActivePopover(activePopover === accountId ? null : accountId);
  };

  const onFormSubmit = async (data: EditPublicationFormData) => {
    if (!publication) return;
    setIsSubmitting(true);
    try {
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

      // Pass all collected thumbnails
      // Pass all collected thumbnails using stable tempId mapping
      Object.entries(thumbnails).forEach(([tempId, file]) => {
        const preview = mediaPreviews.find((p) => p.tempId === tempId);

        if (preview && !preview.isNew && preview.id) {
          // Existing media: key by database ID
          submitData.append(`thumbnails[${preview.id}]`, file);
        } else if (preview && preview.isNew) {
          // New media: find relative index among new files
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

      if (data.scheduled_at)
        submitData.append("scheduled_at", data.scheduled_at);

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

      // Add YouTube thumbnail if present
      if (youtubeThumbnail) {
        const videoId = mediaPreviews.find((p) => p.type.includes("video"))?.id;
        if (videoId) {
          submitData.append("youtube_thumbnail", youtubeThumbnail);
          submitData.append("youtube_thumbnail_video_id", videoId.toString());
        }
      }

      submitData.append("_method", "PUT");
      const response = await axios.post(
        `/publications/${publication.id}`,
        submitData
      );

      if (
        response.data &&
        (response.data.publication || response.data.success)
      ) {
        const updatedPub = response.data.publication || response.data.data;
        // Update store
        if (updatedPub) {
          updatePublication(publication.id, updatedPub);
        } else {
          // Fallback if API doesn't return object: fetch details or just close
          // But usually we get it. If not, maybe just re-fetch list handled by parent?
          // Actually parent's onSuccess fetches list? No, parent passes onSubmit(success).
        }

        reset();
        setMediaPreviews([]);
        setMediaFiles([]);
        onClose();
        onSubmit(true); 
        toast.success(
          t("publications.messages.updateSuccess") || "Publication updated"
        );
      }
    } catch (error: any) {
      console.error("Error updating publication:", error);
      toast.error(
        error.response?.data?.message || t("publications.messages.updateError")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !publication) return null;

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
        <div
          className={`px-8 py-6 border-b ${modalHeaderBorder} ${modalHeaderBg} flex items-center justify-between sticky top-0 z-10`}
        >
          <div>
            <h2
              className={`text-2xl font-bold ${textPrimary} flex items-center gap-2`}
            >
              <Sparkles className={`w-6 h-6 ${iconColor}`} />
              {t("publications.modal.edit.title") || "Edit Publication"}
            </h2>
            <p className={`${textSecondary} mt-1`}>
              {t("publications.modal.add.subtitle") ||
                "Update your content details"}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 hover:${
              theme === "dark" ? "bg-neutral-700" : "bg-gray-100"
            } rounded-full transition-colors ${textTertiary}`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="form-group">
                  <label
                    className={`block text-sm font-semibold ${labelText} mb-2 flex items-center gap-2`}
                  >
                    <FileImage className={`w-4 h-4 ${iconColor}`} />
                    Media
                    <span className="text-primary-500 ml-1">*</span>
                  </label>

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
                      className={`min-h-[200px] rounded-lg border-2 border-dashed flex flex-col items-center justify-center p-6 text-center transition-colors overflow-hidden ${
                        imageError
                          ? theme === "dark"
                            ? "border-primary-500 bg-primary-900/20"
                            : "border-primary-300 bg-primary-50"
                          : isDragOver
                          ? dragOverBg
                          : `${uploadBorder} hover:${
                              theme === "dark"
                                ? "bg-neutral-600"
                                : "bg-gray-100"
                            } ${uploadBg}`
                      }`}
                    >
                      {mediaPreviews.length > 0 ? (
                        <div className="grid grid-cols-2 gap-4 w-full">
                          {mediaPreviews.map((preview, index) => (
                            <div
                              key={index}
                              className="relative group/item aspect-video border rounded-lg overflow-hidden bg-gray-900"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {preview.type.includes("video") ? (
                                <>
                                  <video
                                    src={preview.url}
                                    className="w-full h-full object-cover opacity-80"
                                  />
                                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                                    <span className="text-white/80 text-xs font-medium bg-black/50 px-2 py-1 rounded">
                                      Video
                                    </span>
                                    <div
                                      className="relative"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <input
                                        type="file"
                                        id={`edit-thumb-${preview.tempId}`}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file)
                                            setThumbnails((prev) => ({
                                              ...prev,
                                              [preview.tempId]: file,
                                            }));
                                        }}
                                      />
                                      <label
                                        htmlFor={`edit-thumb-${preview.tempId}`}
                                        className="cursor-pointer bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm transition-colors flex items-center gap-1 border border-white/20"
                                      >
                                        <FileImage className="w-3 h-3" />
                                        {thumbnails[preview.tempId] ||
                                        preview.thumbnailUrl
                                          ? "Change Thumb"
                                          : "Set Thumb"}
                                      </label>
                                    </div>
                                  </div>
                                  {(thumbnails[preview.tempId] ||
                                    preview.thumbnailUrl) && (
                                    <div className="absolute top-2 left-2 w-8 h-8 rounded border border-white/30 overflow-hidden shadow-lg z-10">
                                      <img
                                        src={
                                          thumbnails[preview.tempId]
                                            ? URL.createObjectURL(
                                                thumbnails[preview.tempId]
                                              )
                                            : preview.thumbnailUrl
                                        }
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  )}
                                </>
                              ) : (
                                <img
                                  src={preview.url}
                                  className="w-full h-full object-cover"
                                />
                              )}

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeMedia(index);
                                }}
                                className="absolute top-2 right-2 p-1.5 bg-red-500/80 text-white rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover/item:opacity-100 backdrop-blur-sm"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}

                          <div
                            className="flex items-center justify-center aspect-video border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <div className="text-center">
                              <Upload className="w-6 h-6 mx-auto text-gray-400" />
                              <span className="text-xs text-gray-500">
                                Add more
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div
                            className={`w-16 h-16 rounded-full ${
                              theme === "dark"
                                ? "bg-primary-900/30"
                                : "bg-primary-100"
                            } flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300`}
                          >
                            <Upload className={`w-8 h-8 ${iconColor}`} />
                          </div>
                          <div>
                            <p className={`${textPrimary} font-medium text-lg`}>
                              {t("publications.modal.edit.dragDrop.title")}
                            </p>
                            <p className={`${textSecondary} text-sm mt-1`}>
                              {t("publications.modal.edit.dragDrop.subtitle")}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
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

                <div className="form-group">
                  <label
                    className={`block text-sm font-semibold ${labelText} mb-2 flex items-center gap-2`}
                  >
                    <Hash className={`w-4 h-4 ${iconColor}`} />
                    {t("publications.modal.edit.hashtags")}
                  </label>
                  <div className="relative">
                    <input
                      {...register("hashtags")}
                      className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-offset-0 transition-all ${inputBg} ${
                        errors.hashtags
                          ? errorBorder
                          : `${borderColor} ${focusBorder}`
                      }`}
                      placeholder={t(
                        "publications.modal.edit.placeholders.hashtags"
                      )}
                      onChange={handleHashtagChange}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-xs">
                    <span className={textTertiary}>
                      {watched.hashtags
                        ? watched.hashtags
                            .split(" ")
                            .filter((tag: string) => tag.startsWith("#")).length
                        : 0}
                      /10 hashtags
                    </span>
                  </div>
                </div>

                <div className="form-group">
                  <label
                    className={`block text-sm font-semibold ${labelText} mb-2 flex items-center gap-2`}
                  >
                    <Clock className={`w-4 h-4 ${iconColor}`} />
                    {t("publications.modal.edit.schedulePublication")}
                  </label>
                  <div className={colorIconInput}>
                    <ModernDatePicker
                      selected={
                        watch("scheduled_at")
                          ? new Date(watch("scheduled_at")!)
                          : null
                      }
                      onChange={(date) =>
                        setValue(
                          "scheduled_at",
                          date ? format(date, "yyyy-MM-dd'T'HH:mm") : ""
                        )
                      }
                      showTimeSelect
                      placeholder="Select general date & time"
                      dateFormat="Pp"
                      minDate={new Date()}
                      withPortal
                      popperPlacement="bottom-start"
                    />
                  </div>
                </div>

                {watched.scheduled_at && (
                  <div className="form-group animate-in fade-in slide-in-from-top-2">
                    <label
                      className={`block text-sm font-semibold ${labelText} mb-2 flex items-center gap-2`}
                    >
                      <Target className={`w-4 h-4 ${iconColor}`} />
                      Select Platforms
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {socialAccounts.map((account) => {
                        const isChecked =
                          watched?.social_accounts?.includes(account.id) ||
                          false;
                        const customSchedule = accountSchedules[account.id];

                        return (
                          <div
                            key={account.id}
                            className={`relative flex items-center p-3 rounded-lg border transition-all ${
                              isChecked
                                ? `border-primary-500 bg-primary-50 dark:bg-primary-900/20`
                                : `${borderColor} ${inputBg}`
                            }`}
                          >
                            <label className="flex items-center gap-3 flex-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  const current = watched.social_accounts || [];
                                  const id = Number(account.id);
                                  if (e.target.checked) {
                                    setValue("social_accounts", [
                                      ...current,
                                      id,
                                    ]);
                                  } else {
                                    setValue(
                                      "social_accounts",
                                      current.filter((x: number) => x !== id)
                                    );
                                    const newScheds = { ...accountSchedules };
                                    delete newScheds[id];
                                    setAccountSchedules(newScheds);
                                  }
                                }}
                                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                              />
                              <div className="flex flex-col">
                                <span
                                  className={`text-sm font-medium ${textPrimary}`}
                                >
                                  {account.platform}
                                </span>
                                {customSchedule && isChecked && (
                                  <span className="text-xs text-primary-600 dark:text-primary-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(customSchedule).toLocaleString(
                                      [],
                                      { dateStyle: "short", timeStyle: "short" }
                                    )}
                                  </span>
                                )}
                              </div>
                            </label>

                            {isChecked && (
                              <div className="ml-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleSchedulePopover(account.id)
                                  }
                                  className={`p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 ${
                                    customSchedule
                                      ? "text-primary-500"
                                      : textSecondary
                                  }`}
                                >
                                  <Clock className="w-4 h-4" />
                                </button>

                                {activePopover === account.id && (
                                  <div
                                    className={`absolute right-0 top-full mt-2 z-50 p-4 rounded-lg shadow-xl border w-64 ${modalBg} ${borderColor} animate-in fade-in zoom-in-95`}
                                  >
                                    <div className="flex justify-between items-center mb-3">
                                      <h4
                                        className={`text-sm font-semibold ${textPrimary}`}
                                      >
                                        Schedule for {account.platform}
                                      </h4>
                                      <button
                                        type="button"
                                        onClick={() => setActivePopover(null)}
                                      >
                                        <X
                                          className={`w-4 h-4 ${textSecondary}`}
                                        />
                                      </button>
                                    </div>
                                    <div className={colorIconInput}>
                                      <ModernDatePicker
                                        selected={
                                          customSchedule
                                            ? new Date(customSchedule)
                                            : null
                                        }
                                        onChange={(date) => {
                                          setAccountSchedules((prev) => ({
                                            ...prev,
                                            [account.id]: date
                                              ? format(
                                                  date,
                                                  "yyyy-MM-dd'T'HH:mm"
                                                )
                                              : "",
                                          }));
                                        }}
                                        showTimeSelect
                                        placeholder="Select date & time"
                                        dateFormat="Pp"
                                        minDate={new Date()}
                                        withPortal
                                        popperPlacement="bottom-start"
                                      />
                                    </div>
                                    <div className="flex justify-end gap-2 mt-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newScheds = {
                                            ...accountSchedules,
                                          };
                                          delete newScheds[account.id];
                                          setAccountSchedules(newScheds);
                                          setActivePopover(null);
                                        }}
                                        className="text-xs text-primary-500 hover:text-primary-700 font-medium px-2 py-1"
                                      >
                                        Clear
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setActivePopover(null)}
                                        className="text-xs bg-primary-600 text-white px-3 py-1.5 rounded hover:bg-primary-700"
                                      >
                                        Done
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {watched.social_accounts?.some((id: number) => {
                  const account = socialAccounts.find((a) => a.id === id);
                  return account?.platform?.toLowerCase() === "youtube";
                }) && (
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
                <div className="form-group">
                  <label
                    className={`block text-sm font-semibold ${labelText} mb-2 flex items-center gap-2`}
                  >
                    <FileText className={`w-4 h-4 ${iconColor}`} />
                    {t("publications.modal.edit.titleField")}
                    <span className="text-primary-500 ml-1">*</span>
                  </label>
                  <input
                    {...register("title")}
                    className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-offset-0 transition-all ${inputBg} ${
                      errors.title
                        ? errorBorder
                        : `${borderColor} ${focusBorder}`
                    }`}
                    placeholder={t(
                      "publications.modal.edit.placeholders.title"
                    )}
                  />
                  {errors.title && (
                    <p className="mt-2 text-sm text-primary-500 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      {errors.title.message}
                    </p>
                  )}
                </div>

                <div className="form-group">
                  <label
                    className={`block text-sm font-semibold ${labelText} mb-2 flex items-center gap-2`}
                  >
                    <FileText className={`w-4 h-4 ${iconColor}`} />
                    {t("publications.modal.edit.description")}
                    <span className="text-primary-500 ml-1">*</span>
                  </label>
                  <textarea
                    {...register("description")}
                    rows={8}
                    className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-offset-0 transition-all resize-none ${inputBg} ${
                      errors.description
                        ? errorBorder
                        : `${borderColor} ${focusBorder}`
                    }`}
                    placeholder={t(
                      "publications.modal.edit.placeholders.description"
                    )}
                  />
                  {errors.description && (
                    <p className="mt-2 text-sm text-primary-500 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      {errors.description.message}
                    </p>
                  )}
                </div>

                {(!publication?.scheduled_posts ||
                  publication.scheduled_posts.length === 0) && (
                  <div className="form-group animate-in fade-in slide-in-from-top-3">
                    <label
                      className={`block text-sm font-semibold ${labelText} mb-2 flex items-center gap-2`}
                    >
                      <Target className={`w-4 h-4 ${iconColor}`} />
                      {t("publications.modal.edit.addCampaign") ||
                        "Add to Campaign"}
                    </label>
                    <div className="relative">
                      <select
                        {...register("campaign_id")}
                        className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 outline-none appearance-none ${
                          errors.campaign_id
                            ? "border-red-500 focus:ring-2 focus:ring-red-200"
                            : `${borderColor} ${focusBorder}`
                        } ${inputBg} ${
                          theme === "dark" ? "text-white" : "text-gray-900"
                        }`}
                      >
                        <option value="">
                          {t("common.select") || "Select a campaign..."}
                        </option>
                        {Array.isArray(campaigns) &&
                          campaigns.map((campaign) => (
                            <option key={campaign.id} value={campaign.id}>
                              {campaign.name || campaign.title}
                            </option>
                          ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                        <svg
                          className={`w-4 h-4 ${
                            theme === "dark" ? "text-gray-400" : "text-gray-500"
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div
              className={`pt-6 border-t ${borderColor} flex justify-end gap-3`}
            >
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  theme === "dark"
                    ? "hover:bg-neutral-700 text-gray-300"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                {t("publications.modal.edit.button.cancel")}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-6 py-2 rounded-lg font-medium text-white shadow-lg transition-all flex items-center gap-2 ${
                  isSubmitting
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:shadow-primary-500/25 active:scale-95"
                } bg-gradient-to-r from-primary-600 to-primary-700`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    {t("publications.modal.edit.button.save")}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
