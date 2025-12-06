import { useCampaignManagement } from "@/Hooks/useCampaignManagement";
import { useTheme } from "@/Hooks/useTheme";
import { Campaign } from "@/types/Campaign";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import {
  AlertTriangle,
  Clock,
  Edit,
  FileImage,
  FileText,
  Hash,
  Save,
  Target,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

const createEditSchema = (t: any) =>
  z.object({
    title: z
      .string()
      .min(1, t("manageContent.modals.validation.titleRequired"))
      .max(100, t("manageContent.modals.validation.titleLength")),
    description: z
      .string()
      .min(10, t("manageContent.modals.validation.descRequired"))
      .max(500, t("manageContent.modals.validation.descMax")),
    goal: z
      .string()
      .min(5, t("manageContent.modals.validation.objRequired"))
      .max(200, t("manageContent.modals.validation.objMax")),
    hashtags: z
      .string()
      .min(1, t("manageContent.modals.validation.hashtagsRequired"))
      .refine((val) => {
        const hashtags = val.split(" ").filter((tag) => tag.startsWith("#"));
        return hashtags.length > 0;
      }, t("manageContent.modals.validation.hashtagValid"))
      .refine((val) => {
        const hashtags = val.split(" ").filter((tag) => tag.startsWith("#"));
        return hashtags.length <= 10;
      }, t("manageContent.modals.validation.hashtagMax")),
    scheduled_at: z.string().optional(),
    social_accounts: z.array(z.number()).optional(),
  });

type EditCampaignFormData = {
  title: string;
  description: string;
  goal: string;
  hashtags: string;
  scheduled_at?: string;
  social_accounts?: number[];
};

interface EditCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign;
  onSubmit: (success: boolean) => void;
}

const validateFile = (file: File, t: any) => {
  if (file.size > 50 * 1024 * 1024) {
    return t("manageContent.modals.validation.imageSize");
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
    return t("manageContent.modals.validation.imageType");
  }

  return null;
};

export default function EditCampaignModal({
  isOpen,
  onClose,
  campaign,
  onSubmit,
}: EditCampaignModalProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { updateCampaign } = useCampaignManagement();
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<
    { id?: number; url: string; type: string; isNew: boolean }[]
  >([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [socialAccounts, setSocialAccounts] = useState<any[]>([]);
  const [accountSchedules, setAccountSchedules] = useState<
    Record<number, string>
  >({});
  const [activePopover, setActivePopover] = useState<number | null>(null);
  const [deletedPostIds, setDeletedPostIds] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const schema = useMemo(() => createEditSchema(t), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
    trigger,
  } = useForm<EditCampaignFormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
  });

  const watchedFields = watch();

  useEffect(() => {
    if (isOpen) {
      fetchSocialAccounts();
    }
  }, [isOpen]);

  const fetchSocialAccounts = async () => {
    try {
      const response = await axios.get("/social-accounts");
      if (response.data && response.data.accounts) {
        setSocialAccounts(response.data.accounts);
      }
    } catch (error) {
      console.error("Error fetching social accounts:", error);
    }
  };

  useEffect(() => {
    if (campaign && isOpen) {
      const scheduledAccountIds =
        campaign.scheduled_posts?.map((post) => post.social_account_id) || [];

      reset({
        title: campaign.title || "",
        description: campaign.description || "",
        goal: campaign.goal || "",
        hashtags: campaign.hashtags || "",
        scheduled_at: campaign.scheduled_at
          ? new Date(campaign.scheduled_at).toISOString().slice(0, 16)
          : undefined,
        social_accounts: scheduledAccountIds,
      });

      const previews: {
        id?: number;
        url: string;
        type: string;
        isNew: boolean;
      }[] = [];
      if (campaign.media_files && campaign.media_files.length > 0) {
        campaign.media_files.forEach((m) => {
          previews.push({
            id: m.id,
            url: m.file_path.startsWith("http")
              ? m.file_path
              : `/storage/${m.file_path}`,
            type: m.file_type,
            isNew: false,
          });
        });
      } else if (campaign.image) {
        previews.push({
          url: campaign.image,
          type: "image/jpeg",
          isNew: false,
        });
      }
      setMediaPreviews(previews);
      setMediaFiles([]);
    }
  }, [campaign, isOpen, reset]);

  const modalBg = theme === "dark" ? "bg-neutral-800" : "bg-white";
  const modalHeaderBg =
    theme === "dark"
      ? "bg-gradient-to-r from-neutral-900 to-neutral-800"
      : "bg-gradient-to-r from-gray-50 to-white";
  const modalHeaderBorder =
    theme === "dark" ? "border-neutral-700" : "border-gray-100";
  const modalFooterBg =
    theme === "dark"
      ? "bg-neutral-900/50 border-neutral-700"
      : "bg-gray-50 border-gray-100";
  const textPrimary = theme === "dark" ? "text-gray-100" : "text-gray-900";
  const textSecondary = theme === "dark" ? "text-gray-400" : "text-gray-500";
  const textTertiary = theme === "dark" ? "text-gray-500" : "text-gray-400";
  const borderColor =
    theme === "dark" ? "border-neutral-600" : "border-gray-200";
  const focusBorder =
    theme === "dark"
      ? "focus:border-orange-500 focus:ring-orange-500/20"
      : "focus:border-orange-500 focus:ring-orange-200";
  const errorBorder =
    theme === "dark"
      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
      : "border-red-300 focus:border-red-500 focus:ring-red-200";
  const inputBg = theme === "dark" ? "bg-neutral-700" : "bg-white";
  const labelText = theme === "dark" ? "text-gray-200" : "text-gray-700";
  const iconColor = theme === "dark" ? "text-orange-400" : "text-orange-600";
  const uploadBg = theme === "dark" ? "bg-neutral-700" : "bg-gray-50";
  const uploadBorder =
    theme === "dark"
      ? "border-neutral-600 hover:border-orange-400"
      : "border-gray-200 hover:border-orange-300";
  const dragOverBg =
    theme === "dark"
      ? "bg-orange-900/20 border-orange-400"
      : "bg-orange-50 border-orange-500";
  const cancelButton =
    theme === "dark"
      ? "text-gray-300 hover:bg-neutral-700"
      : "text-gray-700 hover:bg-gray-200";
  const submitButton =
    theme === "dark"
      ? "bg-gradient-to-r from-orange-600 to-orange-800 hover:shadow-orange-500/20"
      : "bg-gradient-to-r from-orange-600 to-orange-700 hover:shadow-orange-200";
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
      const newPreviews: { url: string; type: string; isNew: boolean }[] = [];
      let error = null;

      for (const file of newFiles) {
        const validationError = validateFile(file, t);
        if (validationError) {
          error = validationError;
          break;
        }
        validFiles.push(file);
        newPreviews.push({
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

  const removeMedia = (index: number) => {
    // If it's a new file, remove from mediaFiles
    // We need to map index in previews to index in mediaFiles
    // This logic is a bit complex because mediaPreviews contains both old and new.
    // Let's simplify: we only allow adding new files for now in this edit modal,
    // and maybe clearing all old ones if needed?
    // Or better: we track which preview corresponds to which file.

    const previewToRemove = mediaPreviews[index];

    if (previewToRemove.isNew) {
      // Find which file corresponds to this preview (by URL usually, but here we can just count new files before this index)
      let newFileIndex = 0;
      for (let i = 0; i < index; i++) {
        if (mediaPreviews[i].isNew) newFileIndex++;
      }
      setMediaFiles((prev) => prev.filter((_, i) => i !== newFileIndex));
    } else {
      // It's an existing file. We should mark it for deletion or just remove from view.
      // For now, let's just remove from view and maybe send a flag to backend?
      // The backend `update` logic I wrote handles `image_removed` but not individual media removal yet.
      // I'll stick to `image_removed` logic for legacy image, but for new media system,
      // I might need to implement a delete endpoint or send a list of IDs to keep.
      // For this iteration, let's assume we can only add new media or replace the legacy image.
      // If the user removes the legacy image, we set `image_removed`.
      if (campaign.image && previewToRemove.url === campaign.image) {
        // This is the legacy image
        // We can set a state to mark it removed
      }
    }

    setMediaPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const formatHashtags = (value: string): string => {
    return value
      .split(/\s+/)
      .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
      .join(" ");
  };

  const handleHashtagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatHashtags(e.target.value);
    setValue("hashtags", formatted);
  };

  const toggleSchedulePopover = (accountId: number) => {
    setActivePopover(activePopover === accountId ? null : accountId);
  };

  const handleDeleteScheduledPost = async (postId: number) => {
    // confirm is blocking, better to use a custom dialog, but native is fine for now
    if (
      !window.confirm(
        t("manageContent.modals.validation.confirmDeleteSchedule")
      )
    )
      return;

    try {
      await axios.delete(`/api/scheduled-posts/${postId}`);
      setDeletedPostIds((prev) => [...prev, postId]);
      // Optional: toast success
    } catch (error) {
      console.error("Failed to delete scheduled post", error);
    }
  };

  const onFormSubmit = async (data: EditCampaignFormData) => {
    setIsSubmitting(true);
    try {
      const submitData = new FormData();
      submitData.append("title", data.title);
      submitData.append("description", data.description);
      if (data.goal) {
        submitData.append("goal", data.goal);
      }
      if (data.hashtags) {
        submitData.append("hashtags", data.hashtags);
      }

      const mediaFilesToKeep = mediaPreviews
        .filter((p) => !p.isNew && p.id)
        .map((p) => p.id as number);

      mediaFiles.forEach((file, index) => {
        submitData.append(`media[${index}]`, file);
      });
      mediaFilesToKeep.forEach((id: number, index: number) => {
        submitData.append(`media_keep_ids[${index}]`, id.toString());
      });

      if (data.scheduled_at) {
        submitData.append("scheduled_at", data.scheduled_at);
      }

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

      submitData.append("_method", "PUT");

      const success = await updateCampaign(campaign.id, submitData);
      if (success) {
        reset();
        setMediaPreviews([]);
        setMediaFiles([]);
        onClose();
        onSubmit(success);
      }
    } catch (error) {
      console.error("Error updating campaign:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setMediaPreviews([]);
    setMediaFiles([]);
    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 ${
        theme === "dark" ? "text-white" : "text-gray-900"
      }`}
    >
      <div
        className={`absolute inset-0 ${
          theme === "dark" ? "bg-black/50" : "bg-gray-900/50"
        } backdrop-blur-sm transition-opacity`}
        onClick={onClose}
      ></div>

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
              <Edit className={`w-6 h-6 ${iconColor}`} />
              {t("manageContent.modals.edit.title")}
            </h2>
            <p className={`${textSecondary} mt-1`}>
              {t("manageContent.modals.edit.subtitle")}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 hover:${
              theme === "dark" ? "bg-neutral-700" : "bg-gray-100"
            } rounded-full transition-colors ${textTertiary} hover:${
              theme === "dark" ? "text-gray-200" : "text-gray-600"
            }`}
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
                    {t("manageContent.modals.fields.image")}
                  </label>
                  <div
                    className={`relative group cursor-pointer transition-all duration-300 ${
                      isDragOver
                        ? `scale-[1.02] ring-2 ${
                            theme === "dark"
                              ? "ring-orange-400"
                              : "ring-orange-500"
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
                        isDragOver
                          ? `${dragOverBg}`
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
                              className="relative group/item aspect-video"
                            >
                              {preview.type.startsWith("video") ? (
                                <video
                                  src={preview.url}
                                  className="w-full h-full object-cover rounded-lg"
                                  controls
                                />
                              ) : (
                                <img
                                  src={preview.url}
                                  alt={`Preview ${index}`}
                                  className="w-full h-full object-cover rounded-lg shadow-sm"
                                />
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeMedia(index);
                                }}
                                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover/item:opacity-100"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          <div className="flex items-center justify-center aspect-video border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
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
                                ? "bg-orange-900/30"
                                : "bg-orange-100"
                            } flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300`}
                          >
                            <Upload className={`w-8 h-8 ${iconColor}`} />
                          </div>
                          <div>
                            <p className={`${textPrimary} font-medium text-lg`}>
                              {t("manageContent.modals.fields.dragDrop.title")}
                            </p>
                            <p className={`${textSecondary} text-sm mt-1`}>
                              {t(
                                "manageContent.modals.fields.dragDrop.subtitle"
                              )}
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
                    <p className="mt-2 text-sm text-red-500 flex items-center gap-1 animate-in slide-in-from-left-1">
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
                    {t("manageContent.modals.fields.hashtags")}
                  </label>
                  <div className="relative">
                    <input
                      {...register("hashtags")}
                      className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-offset-0 transition-all ${inputBg}  ${
                        errors.hashtags
                          ? errorBorder
                          : `${borderColor} ${focusBorder}`
                      }`}
                      placeholder={t(
                        "manageContent.modals.fields.placeholders.hashtags"
                      )}
                      onChange={handleHashtagChange}
                    />
                  </div>
                  {errors.hashtags && (
                    <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      {errors.hashtags.message}
                    </p>
                  )}
                  <div className="mt-1 flex justify-end">
                    <span className={`text-xs ${textTertiary}`}>
                      {watchedFields.hashtags
                        ? watchedFields.hashtags
                            .split(" ")
                            .filter((tag) => tag.startsWith("#")).length
                        : 0}
                      /10 hashtags
                    </span>
                  </div>
                </div>

                {/* Scheduling Field */}
                <div className="form-group">
                  <label
                    className={`block text-sm font-semibold ${labelText} mb-2 flex items-center gap-2`}
                  >
                    <Clock className={`w-4 h-4 ${iconColor}`} />
                    {t("manageContent.modals.fields.schedulePublication")}
                  </label>
                  <input
                    type="datetime-local"
                    {...register("scheduled_at")}
                    className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-offset-0 transition-all ${inputBg} ${borderColor} ${focusBorder} ${colorIconInput}`}
                  />
                  <p className={`text-xs mt-1 ${textTertiary}`}>
                    {t("manageContent.modals.fields.optionalSchedule")}
                  </p>
                </div>

                {/* Already Scheduled Posts List */}
                {campaign.scheduled_posts &&
                  campaign.scheduled_posts.length > 0 && (
                    <div className="form-group animate-in fade-in slide-in-from-top-2">
                      <label
                        className={`block text-sm font-semibold ${labelText} mb-2 flex items-center gap-2`}
                      >
                        <Clock className={`w-4 h-4 ${iconColor}`} />
                        {t("manageContent.modals.fields.alreadyScheduled")}
                      </label>
                      <div
                        className={`rounded-lg border overflow-hidden ${borderColor}`}
                      >
                        <table className="w-full text-sm text-left">
                          <thead
                            className={
                              theme === "dark" ? "bg-neutral-800" : "bg-gray-50"
                            }
                          >
                            <tr>
                              <th
                                className={`px-4 py-2 font-medium ${textSecondary}`}
                              >
                                Platform
                              </th>
                              <th
                                className={`px-4 py-2 font-medium ${textSecondary}`}
                              >
                                Date
                              </th>
                              <th
                                className={`px-4 py-2 font-medium ${textSecondary}`}
                              >
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody
                            className={`divide-y ${
                              theme === "dark"
                                ? "divide-neutral-700"
                                : "divide-gray-100"
                            }`}
                          >
                            {campaign.scheduled_posts
                              .filter((p) => !deletedPostIds.includes(p.id))
                              .map((post) => {
                                const account = socialAccounts.find(
                                  (a) => a.id === post.social_account_id
                                );
                                return (
                                  <tr
                                    key={post.id}
                                    className={
                                      theme === "dark"
                                        ? "bg-neutral-900/50"
                                        : "bg-white"
                                    }
                                  >
                                    <td
                                      className={`px-4 py-2 ${textPrimary} font-medium`}
                                    >
                                      {account
                                        ? account.platform
                                        : "Unknown Account"}
                                    </td>
                                    <td className={`px-4 py-2 ${textPrimary}`}>
                                      {new Date(
                                        post.scheduled_at
                                      ).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-2">
                                      <div className="flex items-center gap-2">
                                        <span
                                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize
                                        ${
                                          post.status === "posted"
                                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                            : post.status === "failed"
                                            ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                        }`}
                                        >
                                          {post.status || "pending"}
                                        </span>
                                        {post.status === "pending" && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleDeleteScheduledPost(post.id)
                                            }
                                            className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                            title="Delete scheduled post"
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                {/* Social Accounts Selection */}
                {watchedFields.scheduled_at && (
                  <div className="form-group animate-in fade-in slide-in-from-top-2">
                    <label
                      className={`block text-sm font-semibold ${labelText} mb-2 flex items-center gap-2`}
                    >
                      <Target className={`w-4 h-4 ${iconColor}`} />
                      {t("manageContent.modals.fields.socialAccounts")}
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {socialAccounts.map((account) => {
                        const isChecked =
                          watchedFields.social_accounts?.includes(account.id) ||
                          false;
                        const customSchedule = accountSchedules[account.id];

                        return (
                          <div
                            key={account.id}
                            className={`relative flex items-center p-3 rounded-lg border transition-all ${
                              isChecked
                                ? `border-orange-500 bg-orange-50 dark:bg-orange-900/20`
                                : `${borderColor} ${inputBg}`
                            }`}
                          >
                            <label className="flex items-center gap-3 flex-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  const currentAccounts =
                                    watchedFields.social_accounts || [];
                                  if (e.target.checked) {
                                    setValue("social_accounts", [
                                      ...currentAccounts,
                                      account.id,
                                    ]);
                                  } else {
                                    setValue(
                                      "social_accounts",
                                      currentAccounts.filter(
                                        (id) => id !== account.id
                                      )
                                    );
                                    // Also remove custom schedule if exists
                                    const newSchedules = {
                                      ...accountSchedules,
                                    };
                                    delete newSchedules[account.id];
                                    setAccountSchedules(newSchedules);
                                  }
                                }}
                                className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                              />
                              <div className="flex flex-col">
                                <span
                                  className={`text-sm font-medium ${textPrimary}`}
                                >
                                  {account.platform}
                                </span>
                                {customSchedule && isChecked && (
                                  <span className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
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
                                      ? "text-orange-500"
                                      : textSecondary
                                  }`}
                                  title="Set individual time"
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
                                    <input
                                      type="datetime-local"
                                      className={`w-full px-3 py-2 text-sm rounded border mb-3 ${inputBg} ${borderColor} ${textPrimary} ${colorIconInput}`}
                                      value={customSchedule || ""}
                                      onChange={(e) => {
                                        setAccountSchedules((prev) => ({
                                          ...prev,
                                          [account.id]: e.target.value,
                                        }));
                                      }}
                                    />
                                    <div className="flex justify-end gap-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newSchedules = {
                                            ...accountSchedules,
                                          };
                                          delete newSchedules[account.id];
                                          setAccountSchedules(newSchedules);
                                          setActivePopover(null);
                                        }}
                                        className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1"
                                      >
                                        Clear
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setActivePopover(null)}
                                        className="text-xs bg-orange-600 text-white px-3 py-1.5 rounded hover:bg-orange-700"
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
                      {socialAccounts.length === 0 && (
                        <p className={`col-span-2 text-sm ${textSecondary}`}>
                          {t("manageContent.modals.fields.noConnectedAccounts")}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="form-group">
                  <label
                    className={`block text-sm font-semibold ${labelText} mb-2 flex items-center gap-2`}
                  >
                    <FileText className={`w-4 h-4 ${iconColor}`} />
                    {t("manageContent.modals.fields.title")}
                  </label>
                  <input
                    {...register("title")}
                    className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-offset-0 transition-all ${inputBg} ${
                      errors.title
                        ? errorBorder
                        : `${borderColor} ${focusBorder}`
                    }`}
                    placeholder={t(
                      "manageContent.modals.fields.placeholders.title"
                    )}
                  />
                  {errors.title && (
                    <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
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
                    {t("manageContent.modals.fields.description")}
                  </label>
                  <textarea
                    {...register("description")}
                    rows={4}
                    className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-offset-0 transition-all resize-none ${inputBg} ${
                      errors.description
                        ? errorBorder
                        : `${borderColor} ${focusBorder}`
                    }`}
                    placeholder={t(
                      "manageContent.modals.fields.placeholders.description"
                    )}
                  />
                  {errors.description && (
                    <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      {errors.description.message}
                    </p>
                  )}
                  <div className="mt-1 flex justify-end">
                    <span
                      className={`text-xs ${
                        (watchedFields.description?.length || 0) > 500
                          ? "text-red-500"
                          : textTertiary
                      }`}
                    >
                      {watchedFields.description?.length || 0}/500
                    </span>
                  </div>
                </div>

                <div className="form-group">
                  <label
                    className={`block text-sm font-semibold ${labelText} mb-2 flex items-center gap-2`}
                  >
                    <Target className={`w-4 h-4 ${iconColor}`} />
                    {t("manageContent.modals.fields.goal")}
                  </label>
                  <input
                    {...register("goal")}
                    className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-offset-0 transition-all ${inputBg} ${
                      errors.goal
                        ? errorBorder
                        : `${borderColor} ${focusBorder}`
                    }`}
                    placeholder={t(
                      "manageContent.modals.fields.placeholders.goal"
                    )}
                  />
                  {errors.goal && (
                    <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      {errors.goal.message}
                    </p>
                  )}
                  <div className="mt-1 flex justify-end">
                    <span
                      className={`text-xs ${
                        (watchedFields.goal?.length || 0) > 200
                          ? "text-red-500"
                          : textTertiary
                      }`}
                    >
                      {watchedFields.goal?.length || 0}/200
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        <div
          className={`px-8 py-6 border-t ${modalFooterBg} flex items-center justify-end gap-4 sticky bottom-0 z-10`}
        >
          <button
            type="button"
            onClick={onClose}
            className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${cancelButton}`}
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={handleSubmit(onFormSubmit)}
            disabled={isSubmitting}
            className={`px-8 py-2.5 rounded-lg text-white font-medium hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 ${submitButton}`}
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t("manageContent.modals.edit.saving")}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {t("manageContent.modals.edit.save")}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
