import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useRef, useMemo } from "react";
import {
  FileText,
  FileImage,
  Camera,
  Target,
  Hash,
  Rocket,
  AlertTriangle,
  Sparkles,
  X,
  Upload,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCampaignManagement } from "@/Hooks/useCampaignManagement";
import { useTheme } from "@/Hooks/useTheme"; // Importar useTheme

const createSchema = (t) =>
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
  });

const validateImage = (file, t) => {
  if (!file) {
    return t("manageContent.modals.validation.imageRequired");
  }

  if (file.size > 5 * 1024 * 1024) {
    return t("manageContent.modals.validation.imageSize");
  }

  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return t("manageContent.modals.validation.imageType");
  }

  return null;
};

export default function AddCampaignModal({ isOpen, onClose, onSubmit }) {
  const { t } = useTranslation();
  const { theme } = useTheme(); 
  const { addCampaign } = useCampaignManagement();
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageError, setImageError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

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

  const handleImageChange = (files) => {
    if (files && files.length > 0) {
      const file = files[0];
      const error = validateImage(file, t);

      if (error) {
        setImageError(error);
        setImageFile(null);
        setImagePreview(null);
        return;
      }

      setImageError(null);
      setImageFile(file);

      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);

      trigger(["title", "description", "goal", "hashtags"]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    handleImageChange(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatHashtags = (value) => {
    if (!value.trim()) return "";

    return value
      .split(/\s+/)
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)
      .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
      .join(" ");
  };

  const handleHashtagChange = (e) => {
    const formatted = formatHashtags(e.target.value);
    setValue("hashtags", formatted, { shouldValidate: true });
  };

  const onFormSubmit = async (data) => {
    if (!imageFile) {
      setImageError(t("manageContent.modals.validation.imageRequired"));
      return;
    }

    const imageValidationError = validateImage(imageFile, t);
    if (imageValidationError) {
      setImageError(imageValidationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("goal", data.goal);
      formData.append("hashtags", data.hashtags);
      formData.append("image", imageFile);

      const success = await addCampaign(formData);
      if (success) {
        if (onSubmit) {
          onSubmit();
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
    setImageFile(null);
    setImagePreview(null);
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
        className={`relative w-full max-w-4xl ${modalBg} rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300`}
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
                      className={`aspect-[4/3] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center transition-colors overflow-hidden ${
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
                      onChange={(e) => handleImageChange(e.target.files)}
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
                  <div className="mt-1 flex justify-between text-xs">
                    <span className={textTertiary}>
                      {watchedFields.hashtags
                        ? watchedFields.hashtags
                            .split(" ")
                            .filter((tag) => tag.startsWith("#")).length
                        : 0}
                      /10 hashtags
                    </span>
                    <span className={textTertiary}>
                      {watchedFields.hashtags?.length || 0} caracteres
                    </span>
                  </div>
                </div>
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
