import { useCampaignManagement } from "@/Hooks/useCampaignManagement";
import { useTheme } from "@/Hooks/useTheme";
import { Campaign } from "@/types/Campaign";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  Camera,
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
    image: z
      .any()
      .optional()
      .refine((files) => {
        if (!files || files.length === 0) return true;
        const file = files[0];
        return file.size <= 5 * 1024 * 1024;
      }, t("manageContent.modals.validation.imageSize"))
      .refine((files) => {
        if (!files || files.length === 0) return true;
        const file = files[0];
        return ["image/jpeg", "image/png", "image/webp"].includes(file.type);
      }, t("manageContent.modals.validation.imageType")),
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
  });

type EditCampaignFormData = {
  title: string;
  description: string;
  goal: string;
  hashtags: string;
  image?: FileList;
};

interface EditCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign;
}

export default function EditCampaignModal({
  isOpen,
  onClose,
  campaign,
}: EditCampaignModalProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { updateCampaign } = useCampaignManagement();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    if (campaign && isOpen) {
      reset({
        title: campaign.title || "",
        description: campaign.description || "",
        goal: campaign.goal || "",
        hashtags: campaign.hashtags || "",
        image: undefined,
      });
      if (campaign.image) {
        setImagePreview(campaign.image);
      } else {
        setImagePreview(null);
      }
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

  const handleImageChange = (files: FileList) => {
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer?.files;
    if (files) {
      handleImageChange(files);
      setValue("image", files, { shouldValidate: true });
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const removeImage = () => {
    setImagePreview(null);
    setValue("image", new DataTransfer().files, { shouldValidate: true });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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

      if (data.image && data.image.length > 0) {
        submitData.append("image", data.image[0]);
      } else if (campaign?.image && !imagePreview) {
        submitData.append("image_removed", "true");
      }

      submitData.append("_method", "PUT");

      const success = await updateCampaign(campaign.id, submitData);

      if (success) {
        reset();
        setImagePreview(null);
        onClose();
      }
    } catch (error) {
      console.error("Error updating campaign:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setImagePreview(null);
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
        onClick={onClose}
      ></div>

      <div
        className={`relative w-full max-w-4xl ${modalBg} rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300`}
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
                      className={`aspect-[4/3] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center transition-colors overflow-hidden ${
                        errors.image
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
                      {imagePreview ? (
                        <div className="relative w-full h-full group-hover:opacity-90 transition-opacity">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-full object-cover rounded-xl shadow-sm"
                          />
                          <div
                            className={`absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${
                              theme === "dark" ? "bg-black/60" : "bg-black/40"
                            } rounded-xl`}
                          >
                            <p className="text-white font-medium flex items-center gap-2">
                              <Camera className="w-5 h-5" />
                              {t("manageContent.campaigns.change")}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage();
                            }}
                            className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
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
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files) {
                          handleImageChange(files);
                          setValue("image", files, {
                            shouldValidate: true,
                          });
                        }
                      }}
                    />
                  </div>
                  {errors.image && (
                    <p className="mt-2 text-sm text-red-500 flex items-center gap-1 animate-in slide-in-from-left-1">
                      <AlertTriangle className="w-4 h-4" />
                      {errors.image.message}
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
                      className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-offset-0 transition-all ${inputBg} ${
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
                    className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-offset-0 transition-all ${inputBg} ${
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
                    className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-offset-0 transition-all resize-none ${inputBg} ${
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
                    className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-offset-0 transition-all ${inputBg} ${
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
            onClick={handleClose}
            className={`px-6 py-2.5 rounded-xl font-medium transition-colors ${cancelButton}`}
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={handleSubmit(onFormSubmit)}
            disabled={isSubmitting}
            className={`px-8 py-2.5 rounded-xl text-white font-medium hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 ${submitButton}`}
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
