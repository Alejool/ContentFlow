import { useState, useRef, useEffect, useMemo } from "react";
import {
  FileText,
  FileImage,
  Camera,
  Hash,
  Save,
  AlertTriangle,
  Edit,
  X,
  Upload,
  Target,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCampaignManagement } from "@/Hooks/useCampaignManagement";

const createEditSchema = (t) =>
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

export default function EditCampaignModal({ isOpen, onClose, campaign }) {
  const { t } = useTranslation();
  const { updateCampaign } = useCampaignManagement();
  const [imagePreview, setImagePreview] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const schema = useMemo(() => createEditSchema(t), [t]);

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

  // Preload data when campaign changes
  useEffect(() => {
    if (campaign && isOpen) {
      reset({
        title: campaign.title || "",
        description: campaign.description || "",
        goal: campaign.goal || "",
        hashtags: campaign.hashtags || "",
        image: undefined,
      });

      // If there is an existing image, show preview
      if (campaign.image) {
        setImagePreview(campaign.image);
      } else {
        setImagePreview(null);
      }
    }
  }, [campaign, isOpen, reset]);

  const handleImageChange = (files) => {
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    handleImageChange(files);
    setValue("image", files, { shouldValidate: true });
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
    setImagePreview(null);
    setValue("image", new DataTransfer().files, { shouldValidate: true });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatHashtags = (value) => {
    return value
      .split(/\s+/)
      .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
      .join(" ");
  };

  const handleHashtagChange = (e) => {
    const formatted = formatHashtags(e.target.value);
    setValue("hashtags", formatted);
  };

  const onFormSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      // Create FormData object to send files
      const submitData = new FormData();
      submitData.append("title", data.title);
      submitData.append("description", data.description);
      submitData.append("goal", data.goal);
      submitData.append("hashtags", data.hashtags);

      // Only append image if a new one was selected
      if (data.image && data.image.length > 0) {
        submitData.append("image", data.image[0]);
      } else if (campaign?.image && !imagePreview) {
        // If there was an image but it was removed, send a signal to delete it
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
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Edit className="w-6 h-6 text-indigo-600" />
              {t("manageContent.modals.edit.title")}
            </h2>
            <p className="text-gray-500 mt-1">
              {t("manageContent.modals.edit.subtitle")}
            </p>
          </div>
          <button
            onClick={onClose}
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
                        errors.image
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
                      onChange={(e) => {
                        handleImageChange(e.target.files);
                        setValue("image", e.target.files, {
                          shouldValidate: true,
                        });
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

                {/* Hashtags Field */}
                <div className="form-group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Hash className="w-4 h-4 text-indigo-600" />
                    {t("manageContent.modals.fields.hashtags")}
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
                  <div className="mt-1 flex justify-end">
                    <span className="text-xs text-gray-400">
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

              {/* Right Column - Details */}
              <div className="space-y-6">
                {/* Title Field */}
                <div className="form-group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    {t("manageContent.modals.fields.title")}
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
                </div>

                {/* Description Field */}
                <div className="form-group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    {t("manageContent.modals.fields.description")}
                  </label>
                  <textarea
                    {...register("description")}
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
                      {watchedFields.description?.length || 0}/500
                    </span>
                  </div>
                </div>

                {/* goal Field */}
                <div className="form-group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4 text-indigo-600" />
                    {t("manageContent.modals.fields.goal")}
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
                      {watchedFields.goal?.length || 0}/200
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
