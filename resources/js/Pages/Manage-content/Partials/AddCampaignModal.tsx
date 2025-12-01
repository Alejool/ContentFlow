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
  CheckCircle2,
} from "lucide-react";
import { useTranslation } from "react-i18next";

const createSchema = (t) => z.object({
  title: z
    .string()
    .min(1, t('manageContent.modals.validation.titleRequired'))
    .max(100, t('manageContent.modals.validation.titleLength')),
  description: z
    .string()
    .min(10, t('manageContent.modals.validation.descRequired'))
    .max(500, t('manageContent.modals.validation.descMax')),
  image: z
    .instanceof(FileList)
    .refine((files) => files.length > 0, t('manageContent.modals.validation.imageRequired'))
    .refine((files) => {
      if (files.length === 0) return true;
      const file = files[0];
      return file.size <= 5 * 1024 * 1024; // 5MB
    }, t('manageContent.modals.validation.imageSize'))
    .refine((files) => {
      if (files.length === 0) return true;
      const file = files[0];
      return ["image/jpeg", "image/png", "image/webp"].includes(file.type);
    }, t('manageContent.modals.validation.imageType')),
  objective: z
    .string()
    .min(5, t('manageContent.modals.validation.objRequired'))
    .max(200, t('manageContent.modals.validation.objMax')),
  hashtags: z
    .string()
    .min(1, t('manageContent.modals.validation.hashtagsRequired'))
    .refine((val) => {
      const hashtags = val.split(" ").filter((tag) => tag.startsWith("#"));
      return hashtags.length > 0;
    }, t('manageContent.modals.validation.hashtagValid'))
    .refine((val) => {
      const hashtags = val.split(" ").filter((tag) => tag.startsWith("#"));
      return hashtags.length <= 10;
    }, t('manageContent.modals.validation.hashtagMax')),
});

export default function AddCampaignModal({ isOpen, onClose, onSubmit }) {
  const { t } = useTranslation();
  const [imagePreview, setImagePreview] = useState(null);
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
    setValue("image", new DataTransfer().files);
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
      await onSubmit(data);
      reset();
      setImagePreview(null);
      onClose();
    } catch (error) {
      console.error("Error submitting form:", error);
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
              <Sparkles className="w-6 h-6 text-indigo-600" />
              {t('manageContent.modals.add.title')}
            </h2>
            <p className="text-gray-500 mt-1">
              {t('manageContent.modals.add.subtitle')}
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
                    {t('manageContent.modals.fields.image')}
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
                              {t('manageContent.campaigns.change')}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                            <Upload className="w-8 h-8 text-indigo-600" />
                          </div>
                          <div>
                            <p className="text-gray-900 font-medium text-lg">
                              {t('manageContent.modals.fields.dragDrop.title')}
                            </p>
                            <p className="text-gray-500 text-sm mt-1">
                              {t('manageContent.modals.fields.dragDrop.subtitle')}
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
                        register("image").onChange(e);
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
                    {t('manageContent.modals.fields.hashtags')}
                  </label>
                  <div className="relative">
                    <input
                      {...register("hashtags")}
                      className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-offset-0 transition-all ${
                        errors.hashtags
                          ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                          : "border-gray-200 focus:border-indigo-500 focus:ring-indigo-200"
                      }`}
                      placeholder={t('manageContent.modals.fields.placeholders.hashtags')}
                      onChange={handleHashtagChange}
                    />
                  </div>
                  {errors.hashtags && (
                    <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      {errors.hashtags.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Right Column - Details */}
              <div className="space-y-6">
                {/* Title Field */}
                <div className="form-group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    {t('manageContent.modals.fields.title')}
                  </label>
                  <input
                    {...register("title")}
                    className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-offset-0 transition-all ${
                      errors.title
                        ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                        : "border-gray-200 focus:border-indigo-500 focus:ring-indigo-200"
                    }`}
                    placeholder={t('manageContent.modals.fields.placeholders.title')}
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
                    {t('manageContent.modals.fields.description')}
                  </label>
                  <textarea
                    {...register("description")}
                    rows={4}
                    className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-offset-0 transition-all resize-none ${
                      errors.description
                        ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                        : "border-gray-200 focus:border-indigo-500 focus:ring-indigo-200"
                    }`}
                    placeholder={t('manageContent.modals.fields.placeholders.description')}
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

                {/* Objective Field */}
                <div className="form-group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4 text-indigo-600" />
                    {t('manageContent.modals.fields.objective')}
                  </label>
                  <input
                    {...register("objective")}
                    className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-offset-0 transition-all ${
                      errors.objective
                        ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                        : "border-gray-200 focus:border-indigo-500 focus:ring-indigo-200"
                    }`}
                    placeholder={t('manageContent.modals.fields.placeholders.objective')}
                  />
                  {errors.objective && (
                    <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      {errors.objective.message}
                    </p>
                  )}
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
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSubmit(onFormSubmit)}
            disabled={isSubmitting}
            className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-medium hover:shadow-lg hover:shadow-indigo-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t('manageContent.modals.add.creating')}
              </>
            ) : (
                className={`ml-auto ${
                  (watchedFields.objective?.length || 0) > 160
                    ? "text-orange-600"
                    : "text-gray-400"
                }`}
              >
                {watchedFields.objective?.length || 0}/200
              </p>
            </div>
          </div>

          {/* Hashtags */}
          <div className="space-y-2">
            <label className="flex items-center text-sm font-semibold text-gray-700">
              <Hash className="inline h-4 w-4 mr-1" />
              Hashtags
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              {...register("hashtags")}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 ${
                errors.hashtags
                  ? "border-red-300 focus:ring-red-200 bg-red-50"
                  : "border-gray-300 focus:ring-blue-200 focus:border-blue-500"
              }`}
              placeholder="#marketing #campaign #summer2024"
              onChange={handleHashtagChange}
            />
            <div className="flex justify-between text-xs">
              {errors.hashtags && (
                <p className="text-red-600 flex items-center">
                  <AlertTriangle className="inline h-3 w-3 mr-1" />
                  {errors.hashtags.message}
                </p>
              )}
              <p className="text-gray-400 ml-auto">
                {watchedFields.hashtags
                  ? watchedFields.hashtags
                      .split(" ")
                      .filter((tag) => tag.startsWith("#")).length
                  : 0}
                /10 hashtags
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300 font-medium disabled:opacity-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r 
               from-red-500 to-orange-700 
              hover:from-red-700 hover:to-orange-900 
               text-white rounded-xl 
               transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Rocket className="inline h-4 w-4" />
                  <span>Create Campaign</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
