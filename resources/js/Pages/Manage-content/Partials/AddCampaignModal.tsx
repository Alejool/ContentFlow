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

// Validación separada para la imagen
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
  const { addCampaign } = useCampaignManagement(); // Mover dentro del componente
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

      // Validar otros campos cuando se cambia la imagen
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
    // Validar imagen
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
      // Crear FormData para enviar la imagen
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
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      ></div>

      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-600" />
              {t("manageContent.modals.add.title")}
            </h2>
            <p className="text-gray-500 mt-1">
              {t("manageContent.modals.add.subtitle")}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <FileImage className="w-4 h-4 text-indigo-600" />
                    {t("manageContent.modals.fields.image")}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div
                    className={`relative group cursor-pointer transition-all duration-300 ${
                      isDragOver
                        ? "scale-[1.02] ring-2 ring-indigo-500 ring-offset-2"
                        : ""
                    }`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div
                      className={`aspect-[4/3] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center transition-colors overflow-hidden bg-gray-50 ${
                        imageError
                          ? "border-red-300 bg-red-50"
                          : isDragOver
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-gray-200 hover:border-indigo-300 hover:bg-gray-100"
                      }`}
                    >
                      {imagePreview ? (
                        <div className="relative w-full h-full group-hover:opacity-90 transition-opacity">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-full object-cover rounded-xl shadow-sm"
                          />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-xl">
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
                          <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                            <Upload className="w-8 h-8 text-indigo-600" />
                          </div>
                          <div>
                            <p className="text-gray-900 font-medium text-lg">
                              {t("manageContent.modals.fields.dragDrop.title")}
                            </p>
                            <p className="text-gray-500 text-sm mt-1">
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Hash className="w-4 h-4 text-indigo-600" />
                    {t("manageContent.modals.fields.hashtags")}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <input
                      {...register("hashtags")}
                      className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-offset-0 transition-all ${
                        errors.hashtags
                          ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                          : "border-gray-200 focus:border-indigo-500 focus:ring-indigo-200"
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
                    <span className="text-gray-400">
                      {watchedFields.hashtags
                        ? watchedFields.hashtags
                            .split(" ")
                            .filter((tag) => tag.startsWith("#")).length
                        : 0}
                      /10 hashtags
                    </span>
                    <span className="text-gray-400">
                      {watchedFields.hashtags?.length || 0} caracteres
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column - Details */}
              <div className="space-y-6">
                {/* Title Field */}
                <div className="form-group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    {t("manageContent.modals.fields.title")}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    {...register("title")}
                    className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-offset-0 transition-all ${
                      errors.title
                        ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                        : "border-gray-200 focus:border-indigo-500 focus:ring-indigo-200"
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
                    <span className="text-gray-400">
                      {watchedFields.title?.length || 0}/100 caracteres
                    </span>
                  </div>
                </div>

                {/* Description Field */}
                <div className="form-group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    {t("manageContent.modals.fields.description")}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <textarea
                    {...register("description")}
                    name="description"
                    rows={4}
                    className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-offset-0 transition-all resize-none ${
                      errors.description
                        ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                        : "border-gray-200 focus:border-indigo-500 focus:ring-indigo-200"
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
                          : "text-gray-400"
                      }`}
                    >
                      {watchedFields.description?.length || 0}/500 caracteres
                    </span>
                  </div>
                </div>

                {/* goal Field */}
                <div className="form-group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4 text-indigo-600" />
                    {t("manageContent.modals.fields.goal")}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    {...register("goal")}
                    className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-offset-0 transition-all ${
                      errors.goal
                        ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                        : "border-gray-200 focus:border-indigo-500 focus:ring-indigo-200"
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
                          : "text-gray-400"
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
        <div className="px-8 py-6 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-4 sticky bottom-0 z-10">
          <button
            type="button"
            onClick={handleClose}
            className="px-6 py-2.5 rounded-xl text-gray-700 font-medium hover:bg-gray-200 transition-colors"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={handleSubmit(onFormSubmit)}
            disabled={isSubmitting}
            className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-medium hover:shadow-lg hover:shadow-indigo-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
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
