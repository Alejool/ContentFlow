import { useState, useRef, useEffect } from "react";

export default function EditCampaignModal({
  isOpen,
  onClose,
  onSubmit,
  campaign,
}) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    hashtags: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // Precargar datos cuando cambia la campaña
  useEffect(() => {
    if (campaign && isOpen) {
      setFormData({
        title: campaign.title || "",
        description: campaign.description || "",
        hashtags: campaign.hashtags || "",
      });

      // Si hay una imagen existente, mostrar preview
      if (campaign.image) {
        setImagePreview(campaign.image);
      }

      setErrors({});
    }
  }, [campaign, isOpen]);

  // Validation functions
  const validateForm = () => {
    const newErrors = {};

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = "El título es requerido";
    } else if (formData.title.length > 100) {
      newErrors.title = "El título no puede exceder 100 caracteres";
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = "La descripción es requerida";
    } else if (formData.description.length < 10) {
      newErrors.description =
        "La descripción debe tener al menos 10 caracteres";
    } else if (formData.description.length > 500) {
      newErrors.description = "La descripción no puede exceder 500 caracteres";
    }

    // Image validation (opcional para edición)
    if (imageFile) {
      if (imageFile.size > 5 * 1024 * 1024) {
        newErrors.image = "La imagen debe ser menor a 5MB";
      }
      if (!["image/jpeg", "image/png", "image/webp"].includes(imageFile.type)) {
        newErrors.image = "Solo se permiten archivos JPG, PNG o WebP";
      }
    }

    // Hashtags validation
    if (!formData.hashtags.trim()) {
      newErrors.hashtags = "Los hashtags son requeridos";
    } else {
      const hashtags = formData.hashtags
        .split(" ")
        .filter((tag) => tag.startsWith("#"));
      if (hashtags.length === 0) {
        newErrors.hashtags =
          "Debe incluir al menos un hashtag válido (#ejemplo)";
      } else if (hashtags.length > 10) {
        newErrors.hashtags = "Máximo 10 hashtags permitidos";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleImageChange = (files) => {
    if (files && files.length > 0) {
      const file = files[0];
      setImageFile(file);

      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);

      // Clear image error
      if (errors.image) {
        setErrors((prev) => ({ ...prev, image: "" }));
      }
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
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatHashtags = (value) => {
    return value
      .split(/\s+/)
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)
      .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
      .join(" ");
  };

  const handleHashtagChange = (e) => {
    const formatted = formatHashtags(e.target.value);
    handleInputChange("hashtags", formatted);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Create submit data
      const submitData = {
        ...formData,
        image:
          imageFile || (campaign?.image && !imageFile ? campaign.image : null),
      };

      await onSubmit(submitData);
      onClose();
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: "",
      description: "",
      hashtags: "",
    });
    setImageFile(null);
    setImagePreview(null);
    setErrors({});
    setIsSubmitting(false);
    onClose();
  };

  // Calculate form completion percentage
  const getFormCompletion = () => {
    const fields = [formData.title, formData.description, formData.hashtags];
    const completed = fields.filter((field) => field && field.trim()).length;
    // Add image if exists (either new or existing)
    if (imageFile || (campaign?.image && imagePreview)) {
      return Math.min(((completed + 1) / 4) * 100, 100);
    }
    return Math.min((completed / 4) * 100, 100);
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
              ✏️ Editar Campaña
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Actualiza tu campaña con nueva información
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

        <form onSubmit={handleFormSubmit} className="p-6 space-y-6">
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-green-500 to-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${getFormCompletion()}%` }}
            ></div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label className="flex items-center text-sm font-semibold text-gray-700">
              📝 Título de la Campaña
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
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
                  ⚠️ {errors.title}
                </p>
              )}
              <p
                className={`ml-auto ${
                  formData.title.length > 80
                    ? "text-orange-600"
                    : "text-gray-400"
                }`}
              >
                {formData.title.length}/100
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
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
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
                  ⚠️ {errors.description}
                </p>
              )}
              <p
                className={`ml-auto ${
                  formData.description.length > 400
                    ? "text-orange-600"
                    : "text-gray-400"
                }`}
              >
                {formData.description.length}/500
              </p>
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <label className="flex items-center text-sm font-semibold text-gray-700">
              🖼️ Imagen de la Campaña
              <span className="text-gray-400 ml-1 text-xs">(Opcional)</span>
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
                      Arrastra una nueva imagen o haz clic para seleccionar
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      JPG, PNG o WebP • Máximo 5MB
                    </p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
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
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200 flex items-center space-x-2"
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
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span>Cambiar</span>
                    </button>
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
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e.target.files)}
                />
              </div>
            )}

            {errors.image && (
              <p className="text-red-600 text-xs flex items-center">
                ⚠️ {errors.image}
              </p>
            )}
          </div>

          {/* Hashtags */}
          <div className="space-y-2">
            <label className="flex items-center text-sm font-semibold text-gray-700">
              🏷️ Hashtags
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              value={formData.hashtags}
              onChange={handleHashtagChange}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 ${
                errors.hashtags
                  ? "border-red-300 focus:ring-red-200 bg-red-50"
                  : "border-gray-300 focus:ring-blue-200 focus:border-blue-500"
              }`}
              placeholder="#marketing #campaña #verano2024"
            />
            <div className="flex justify-between text-xs">
              {errors.hashtags && (
                <p className="text-red-600 flex items-center">
                  ⚠️ {errors.hashtags}
                </p>
              )}
              <p className="text-gray-400 ml-auto">
                {formData.hashtags
                  ? formData.hashtags
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
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl hover:from-green-700 hover:to-blue-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
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
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <span>💾</span>
                  <span>Guardar Cambios</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
