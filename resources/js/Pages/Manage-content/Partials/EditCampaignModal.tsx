import { useState, useRef, useEffect } from "react";
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
} from "lucide-react";
import { useTranslation } from "react-i18next";

export default function EditCampaignModal({
  isOpen,
  onClose,
  onSubmit,
  campaign,
}) {
  const { t } = useTranslation();
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

  // Preload data when campaign changes
  useEffect(() => {
    if (campaign && isOpen) {
      setFormData({
        title: campaign.title || "",
        description: campaign.description || "",
        hashtags: campaign.hashtags || "",
      });

      // If there is an existing image, show preview
      if (campaign.image) {
        setImagePreview(campaign.image);
      } else {
        setImagePreview(null);
      }
      setImageFile(null); // Clear any previously selected new file

      setErrors({});
    }
  }, [campaign, isOpen]);

  // Validation functions
  const validateForm = () => {
    const newErrors = {};

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = t('manageContent.modals.validation.titleRequired');
    } else if (formData.title.length > 100) {
      newErrors.title = t('manageContent.modals.validation.titleLength');
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = t('manageContent.modals.validation.descRequired');
    } else if (formData.description.length < 10) {
      newErrors.description = t('manageContent.modals.validation.descMin');
    } else if (formData.description.length > 500) {
      newErrors.description = t('manageContent.modals.validation.descMax');
    }

    // Image validation (optional for editing)
    if (imageFile) {
      if (imageFile.size > 5 * 1024 * 1024) {
        newErrors.image = t('manageContent.modals.validation.imageSize');
      }
      if (!["image/jpeg", "image/png", "image/webp"].includes(imageFile.type)) {
        newErrors.image = t('manageContent.modals.validation.imageType');
      }
    }

    // Hashtags validation
    if (!formData.hashtags.trim()) {
      newErrors.hashtags = t('manageContent.modals.validation.hashtagsRequired');
    } else {
      const hashtags = formData.hashtags
        .split(" ")
        .filter((tag) => tag.startsWith("#"));
      if (hashtags.length === 0) {
        newErrors.hashtags = t('manageContent.modals.validation.hashtagValid');
      } else if (hashtags.length > 10) {
        newErrors.hashtags = t('manageContent.modals.validation.hashtagMax');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Clear image error
      if (errors.image) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.image;
          return newErrors;
        });
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      // Create a synthetic event to reuse handleImageChange
      handleImageChange({ target: { files: [file] } });
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const removeImage = (e) => {
    e.stopPropagation();
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Create FormData object to send files
      const submitData = new FormData();
      submitData.append("title", formData.title);
      submitData.append("description", formData.description);
      submitData.append("hashtags", formData.hashtags);
      
      // Only append image if a new one was selected
      if (imageFile) {
        submitData.append("image", imageFile);
      } else if (campaign?.image && !imagePreview) {
        // If there was an image but it was removed, send a signal to delete it
        submitData.append("image_removed", "true");
      }
      
      // Important: for PUT/PATCH requests with FormData in Laravel/Inertia, 
      // we often need to use POST with _method field
      submitData.append("_method", "PUT");

      await onSubmit(submitData);
      onClose();
    } catch (error) {
      console.error("Error updating campaign:", error);
    } finally {
      setIsSubmitting(false);
    }
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
              {t('manageContent.modals.edit.title')}
            </h2>
            <p className="text-gray-500 mt-1">
              {t('manageContent.modals.edit.subtitle')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

              value={formData.hashtags}
              onChange={handleHashtagChange}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 ${
                errors.hashtags
                  ? "border-red-300 focus:ring-red-200 bg-red-50"
                  : "border-gray-300 focus:ring-blue-200 focus:border-blue-500"
              }`}
              placeholder="#marketing #campaign #summer2024"
            />
            <div className="flex justify-between text-xs">
              {errors.hashtags && (
                <p className="text-red-600 flex items-center">
                  <AlertTriangle className="inline h-3 w-3 mr-1" />
                  {errors.hashtags}
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
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r 
               text-white rounded-xl 
              from-red-500 to-orange-700 
              hover:from-red-700 hover:to-orange-900 
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
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="inline h-4 w-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
