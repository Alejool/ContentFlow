import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useRef } from "react";

const schema = z.object({
  title: z.string()
    .min(1, "El título es requerido")
    .max(100, "El título no puede exceder 100 caracteres"),
  description: z.string()
    .min(10, "La descripción debe tener al menos 10 caracteres")
    .max(500, "La descripción no puede exceder 500 caracteres"),
  image: z
    .instanceof(FileList)
    .refine((files) => files.length > 0, "La imagen es requerida")
    .refine((files) => {
      if (files.length === 0) return true;
      const file = files[0];
      return file.size <= 5 * 1024 * 1024; // 5MB
    }, "La imagen debe ser menor a 5MB")
    .refine((files) => {
      if (files.length === 0) return true;
      const file = files[0];
      return ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
    }, "Solo se permiten archivos JPG, PNG o WebP"),
  objective: z.string()
    .min(5, "El objetivo debe tener al menos 5 caracteres")
    .max(200, "El objetivo no puede exceder 200 caracteres"),
  hashtags: z.string()
    .min(1, "Los hashtags son requeridos")
    .refine((val) => {
      const hashtags = val.split(' ').filter(tag => tag.startsWith('#'));
      return hashtags.length > 0;
    }, "Debe incluir al menos un hashtag válido (#ejemplo)")
    .refine((val) => {
      const hashtags = val.split(' ').filter(tag => tag.startsWith('#'));
      return hashtags.length <= 10;
    }, "Máximo 10 hashtags permitidos"),
});

export default function AddCampaignModal({ isOpen, onClose, onSubmit }) {
  const [imagePreview, setImagePreview] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
    trigger
  } = useForm({
    resolver: zodResolver(schema),
    mode: "onChange"
  });

  const watchedFields = watch();

  const handleImageChange = (files) => {
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
      
      // Crear un nuevo FileList para setValue
      const dt = new DataTransfer();
      dt.items.add(file);
      setValue("image", dt.files);
      trigger("image");
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
    setImagePreview(null);
    setValue("image", new DataTransfer().files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatHashtags = (value) => {
    return value
      .split(/\s+/)
      .map(tag => tag.startsWith('#') ? tag : `#${tag}`)
      .join(' ');
  };

  const handleHashtagChange = (e) => {
    const formatted = formatHashtags(e.target.value);
    setValue("hashtags", formatted);
  };

  const handleFormSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      reset();
      setImagePreview(null);
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
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
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              ✨ Nueva Campaña
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Crea una campaña impactante y atractiva
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
            disabled={isSubmitting}
          >
            <svg
              className="w-6 h-6 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="p-6 space-y-6"
        >
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r 
              from-red-500 to-purple-600
               h-2 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(
                  (Object.values(watchedFields).filter(Boolean).length / 5) *
                    100,
                  100
                )}%`,
              }}
            ></div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label className="flex items-center text-sm font-semibold text-gray-700">
              📝 Título de la Campaña
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              {...register("title")}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 ${
                errors.title
                  ? "border-red-300 focus:ring-red-200 bg-red-50"
                  : "border-gray-300 focus:ring-blue-200 focus:border-blue-500"
              }`}
              placeholder="Ej: Campaña de Verano 2024"
            />
            <div className="flex justify-between text-xs">
              {errors.title && (
                <p className="text-red-600 flex items-center">
                  ⚠️ {errors.title.message}
                </p>
              )}
              <p
                className={`ml-auto ${
                  (watchedFields.title?.length || 0) > 80
                    ? "text-orange-600"
                    : "text-gray-400"
                }`}
              >
                {watchedFields.title?.length || 0}/100
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="flex items-center text-sm font-semibold text-gray-700">
              📄 Descripción
              <span className="text-red-500 ml-1">*</span>
            </label>
            <textarea
              {...register("description")}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 resize-none ${
                errors.description
                  ? "border-red-300 focus:ring-red-200 bg-red-50"
                  : "border-gray-300 focus:ring-blue-200 focus:border-blue-500"
              }`}
              rows="4"
              placeholder="Describe tu campaña de manera detallada y atractiva..."
            />
            <div className="flex justify-between text-xs">
              {errors.description && (
                <p className="text-red-600 flex items-center">
                  ⚠️ {errors.description.message}
                </p>
              )}
              <p
                className={`ml-auto ${
                  (watchedFields.description?.length || 0) > 400
                    ? "text-orange-600"
                    : "text-gray-400"
                }`}
              >
                {watchedFields.description?.length || 0}/500
              </p>
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <label className="flex items-center text-sm font-semibold text-gray-700">
              🖼️ Imagen de la Campaña
              <span className="text-red-500 ml-1">*</span>
            </label>

            {!imagePreview ? (
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
                  isDragOver
                    ? "border-blue-400 bg-blue-50"
                    : errors.image
                    ? "border-red-300 bg-red-50"
                    : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="space-y-3">
                  <div className="text-4xl">📸</div>
                  <div>
                    <p className="text-gray-600 font-medium">
                      Arrastra tu imagen aquí o haz clic para seleccionar
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      JPG, PNG o WebP • Máximo 5MB
                    </p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  {...register("image")}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e.target.files)}
                />
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden bg-gray-100">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                  <button
                    type="button"
                    onClick={removeImage}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors duration-200 flex items-center space-x-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    <span>Eliminar</span>
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  {...register("image")}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e.target.files)}
                />
              </div>
            )}

            {errors.image && (
              <p className="text-red-600 text-xs flex items-center">
                ⚠️ {errors.image.message}
              </p>
            )}
          </div>

          {/* Objective */}
          <div className="space-y-2">
            <label className="flex items-center text-sm font-semibold text-gray-700">
              🎯 Objetivo de la Campaña
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              {...register("objective")}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 ${
                errors.objective
                  ? "border-red-300 focus:ring-red-200 bg-red-50"
                  : "border-gray-300 focus:ring-blue-200 focus:border-blue-500"
              }`}
              placeholder="Ej: Aumentar engagement en redes sociales"
            />
            <div className="flex justify-between text-xs">
              {errors.objective && (
                <p className="text-red-600 flex items-center">
                  ⚠️ {errors.objective.message}
                </p>
              )}
              <p
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
              🏷️ Hashtags
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              {...register("hashtags")}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 ${
                errors.hashtags
                  ? "border-red-300 focus:ring-red-200 bg-red-50"
                  : "border-gray-300 focus:ring-blue-200 focus:border-blue-500"
              }`}
              placeholder="#marketing #campaña #verano2024"
              onChange={handleHashtagChange}
            />
            <div className="flex justify-between text-xs">
              {errors.hashtags && (
                <p className="text-red-600 flex items-center">
                  ⚠️ {errors.hashtags.message}
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
              Cancelar
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
                  <span>Creando...</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>Crear Campaña</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}