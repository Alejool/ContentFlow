import { useCampaignManagement } from "@/Hooks/useCampaignManagement";
import { useTheme } from "@/Hooks/useTheme";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import {
  AlertTriangle,
  Clock,
  FileImage,
  FileText,
  Hash,
  Rocket,
  Sparkles,
  Target,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

interface AddCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const createSchema = (t: any) =>
  z.object({
    title: z
      .string()
      .min(1, t("manageContent.modals.validation.titleRequired"))
      .max(100, t("manageContent.modals.validation.titleLength")),
    description: z
      .string()
      .min(10, t("manageContent.modals.validation.descMin"))
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

export default function AddCampaignModal({
  isOpen,
  onClose,
  onSubmit,
}: AddCampaignModalProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { addCampaign } = useCampaignManagement();
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [socialAccounts, setSocialAccounts] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const schema = useMemo(() => createSchema(t), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
    trigger,
  } = useForm({
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
  const labelText = theme === "dark" ? "text-gray-300" : "text-gray-700";
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

  const handleFileChange = (files: FileList | null) => {
    if (files && files.length > 0) {
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
      setMediaFiles((prev) => [...prev, ...validFiles]);
      setMediaPreviews((prev) => [...prev, ...newPreviews]);
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

  const onFormSubmit = async (data: any) => {
    if (mediaFiles.length === 0) {
      setImageError(t("manageContent.modals.validation.imageRequired"));
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
      });

      if (data.scheduled_at) {
        formData.append("scheduled_at", data.scheduled_at);
      }

      if (data.social_accounts && data.social_accounts.length > 0) {
        data.social_accounts.forEach((id: number, index: number) => {
          formData.append(`social_accounts[${index}]`, id.toString());
        });
      }

      const success = await addCampaign(formData);
      if (success) {
        if (onSubmit) {
          onSubmit(data);
        }
        handleClose();
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setMediaFiles([]);
    setMediaPreviews([]);
    setImageError(null);
    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className={`absolute inset-0 ${
          theme === "dark" ? "bg-black/70" : "bg-gray-900/60"
        } backdrop-blur-sm transition-opacity`}
        onClick={handleClose}
      ></div>

      <div
        className={`relative w-full max-w-4xl ${modalBg} rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300`}
      >
        {/* Header */}
        <div
          className={`px-8 py-6 border-b ${modalHeaderBorder} ${modalHeaderBg} flex items-center justify-between sticky top-0 z-10`}
        >
          <div>
            <h2
              className={`text-2xl font-bold ${textPrimary} flex items-center gap-2`}
            >
              <Sparkles className={`w-6 h-6 ${iconColor}`} />
              {t("manageContent.modals.add.title")}
            </h2>
            <p className={`${textSecondary} mt-1`}>
              {t("manageContent.modals.add.subtitle")}
            </p>
          </div>
          <button
            onClick={handleClose}
            className={`p-2 hover:${
              theme === "dark" ? "bg-neutral-700" : "bg-gray-100"
            } rounded-full transition-colors ${textTertiary} hover:${
              theme === "dark" ? "text-gray-200" : "text-gray-600"
            }`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Image Upload */}
              <div className="space-y-6">
                <div className="form-group">
                  <label
                    className={`block text-sm font-semibold ${labelText} mb-2 flex items-center gap-2`}
                  >
                    <FileImage className={`w-4 h-4 ${iconColor}`} />
                    {t("manageContent.modals.fields.image")}
                    <span className="text-red-500 ml-1">*</span>
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
                        imageError
                          ? `${
                              theme === "dark"
                                ? "border-red-500 bg-red-900/20"
                                : "border-red-300 bg-red-50"
                            }`
                          : isDragOver
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
                              {mediaFiles[index].type.startsWith("video") ? (
                                <video
                                  src={preview}
                                  className="w-full h-full object-cover rounded-lg"
                                  controls
                                />
                              ) : (
                                <img
                                  src={preview}
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

                {/* Hashtags Field */}
                <div className="form-group">
                  <label
                    className={`block text-sm font-semibold ${labelText} mb-2 flex items-center gap-2`}
                  >
                    <Hash className={`w-4 h-4 ${iconColor}`} />
                    {t("manageContent.modals.fields.hashtags")}
                    <span className="text-red-500 ml-1">*</span>
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
                  <div className="mt-1 flex justify-between text-xs">
                    <span className={textTertiary}>
                      {watchedFields.hashtags
                        ? watchedFields.hashtags
                            .split(" ")
                            .filter((tag: string) => tag.startsWith("#")).length
                        : 0}
                      /10 hashtags
                    </span>
                    <span className={textTertiary}>
                      {watchedFields.hashtags?.length || 0} caracteres
                    </span>
                  </div>
                </div>

                {/* Scheduling Field */}
                <div className="form-group">
                  <label
                    className={`block text-sm font-semibold ${labelText} mb-2 flex items-center gap-2`}
                  >
                    <Clock className={`w-4 h-4 ${iconColor}`} />
                    Schedule Publication (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    {...register("scheduled_at")}
                    className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-offset-0 transition-all ${inputBg} ${borderColor} ${focusBorder}`}
                  />
                  <p className={`text-xs mt-1 ${textTertiary}`}>
                    Leave empty to save as draft or publish immediately.
                  </p>
                </div>

                {/* Social Accounts Selection */}
                {watchedFields.scheduled_at && (
                  <div className="form-group animate-in fade-in slide-in-from-top-2">
                    <label
                      className={`block text-sm font-semibold ${labelText} mb-2 flex items-center gap-2`}
                    >
                      <Target className={`w-4 h-4 ${iconColor}`} />
                      Select Social Networks
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {socialAccounts.map((account) => (
                        <label
                          key={account.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            watchedFields.social_accounts?.includes(account.id)
                              ? `border-orange-500 bg-orange-50 dark:bg-orange-900/20`
                              : `${borderColor} ${inputBg}`
                          }`}
                        >
                          <input
                            type="checkbox"
                            value={account.id}
                            {...register("social_accounts")}
                            className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                          />
                          <span
                            className={`text-sm font-medium ${textPrimary}`}
                          >
                            {account.platform}
                          </span>
                        </label>
                      ))}
                      {socialAccounts.length === 0 && (
                        <p className={`col-span-2 text-sm ${textSecondary}`}>
                          No connected accounts found.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Details */}
              <div className="space-y-6">
                {/* Title Field */}
                <div className="form-group">
                  <label
                    className={`block text-sm font-semibold ${labelText} mb-2 flex items-center gap-2`}
                  >
                    <FileText className={`w-4 h-4 ${iconColor}`} />
                    {t("manageContent.modals.fields.title")}
                    <span className="text-red-500 ml-1">*</span>
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
                  <div className="mt-1 flex justify-end text-xs">
                    <span className={textTertiary}>
                      {watchedFields.title?.length || 0}/100 caracteres
                    </span>
                  </div>
                </div>

                {/* Description Field */}
                <div className="form-group">
                  <label
                    className={`block text-sm font-semibold ${labelText} mb-2 flex items-center gap-2`}
                  >
                    <FileText className={`w-4 h-4 ${iconColor}`} />
                    {t("manageContent.modals.fields.description")}
                    <span className="text-red-500 ml-1">*</span>
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
                      {watchedFields.description?.length || 0}/500 caracteres
                    </span>
                  </div>
                </div>

                {/* Goal Field */}
                <div className="form-group">
                  <label
                    className={`block text-sm font-semibold ${labelText} mb-2 flex items-center gap-2`}
                  >
                    <Target className={`w-4 h-4 ${iconColor}`} />
                    {t("manageContent.modals.fields.goal")}
                    <span className="text-red-500 ml-1">*</span>
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
                      {watchedFields.goal?.length || 0}/200 caracteres
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div
          className={`px-8 py-6 border-t ${modalFooterBg} flex items-center justify-end gap-4 sticky bottom-0 z-10`}
        >
          <button
            type="button"
            onClick={handleClose}
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
                {t("manageContent.modals.add.creating")}
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4" />
                {t("manageContent.modals.add.save")}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
