import { useTheme } from "@/Hooks/useTheme";
import { Trash2, Upload, X, ZoomIn } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/Components/common/Modern/Button";

interface YouTubeThumbnailUploaderProps {
  videoId: number;
  videoFileName?: string;
  videoPreviewUrl?: string;
  existingThumbnail?: {
    url: string;
    id: number;
  } | null;
  onThumbnailChange: (file: File | null) => void;
  onThumbnailDelete?: () => void;
}

export default function YouTubeThumbnailUploader({
  videoId,
  videoFileName,
  videoPreviewUrl,
  existingThumbnail,
  onThumbnailChange,
  onThumbnailDelete,
}: YouTubeThumbnailUploaderProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [preview, setPreview] = useState<string | null>(
    existingThumbnail?.url || null
  );
  const [showFullSize, setShowFullSize] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreview(existingThumbnail?.url || null);
  }, [existingThumbnail]);

  const validateThumbnail = (file: File): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith("image/")) {
        resolve("Only image files are allowed");
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        resolve("Image must be smaller than 2MB");
        return;
      }

      const img = new Image();
      img.onload = () => {
        if (img.width < 1280 || img.height < 720) {
          resolve("Image must be at least 1280x720 pixels");
        } else {
          resolve(null);
        }
      };
      img.onerror = () => resolve("Failed to load image");
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (file: File) => {
    const validationError = await validateThumbnail(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
      onThumbnailChange(file);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDelete = () => {
    setPreview(null);
    setError(null);
    onThumbnailChange(null);
    if (onThumbnailDelete) {
      onThumbnailDelete();
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const borderColor =
    theme === "dark" ? "border-neutral-700" : "border-gray-200";
  const bgColor = theme === "dark" ? "bg-neutral-800" : "bg-gray-50";
  const textColor = theme === "dark" ? "text-gray-300" : "text-gray-700";

  return (
    <div className="space-y-3">
      {/* Video Information */}
      {(videoFileName || videoPreviewUrl) && (
        <div className={`p-3 rounded-lg border ${borderColor} ${bgColor}`}>
          <div className="flex items-center gap-3">
            {videoPreviewUrl && (
              <div className="flex-shrink-0">
                <video
                  src={videoPreviewUrl}
                  className="w-24 h-16 object-cover rounded border border-gray-300 dark:border-gray-600"
                  muted
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium ${textColor} mb-1`}>Video:</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                {videoFileName || `Video #${videoId}`}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <label className={`text-sm font-medium ${textColor}`}>
          YouTube Thumbnail
          <span className="text-xs text-gray-500 ml-2">
            (Recommended: 1280x720)
          </span>
        </label>
      </div>

      {preview ? (
        <div className="space-y-2">
          {/* Small Preview */}
          <div className="relative group">
            <img
              src={preview}
              alt="YouTube Thumbnail"
              className={`w-full h-32 object-cover rounded-lg border-2 ${borderColor}`}
            />

            {/* Overlay with actions */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
              <Button
                type="button"
                onClick={() => setShowFullSize(true)}
                variant="ghost"
                buttonStyle="solid"
                size="sm"
                className="p-2 bg-white/90 hover:bg-white rounded-full transition-colors"
                title="View full size"
                icon={ZoomIn}
              >
                
              </Button>
              <Button
                type="button"
                onClick={handleDelete}
                variant="danger"
                buttonStyle="solid"
                size="sm"
                className="p-2 bg-red-500/90 hover:bg-red-500 rounded-full transition-colors"
                title="Delete thumbnail"
                icon={Trash2}
              >
                
              </Button>
            </div>
          </div>

          {/* Change button */}
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            variant="ghost"
            buttonStyle="ghost"
            size="sm"
            fullWidth
            className={`w-full px-3 py-2 text-sm rounded-lg border ${borderColor} ${bgColor} hover:bg-opacity-80 transition-colors ${textColor}`}
          >
            {t("publications.modal.publish.button.change")}
          </Button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
            isDragging
              ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
              : `${borderColor} ${bgColor} hover:border-primary-400`
          }`}
        >
          <Upload
            className={`w-8 h-8 mx-auto mb-2 ${
              isDragging ? "text-primary-500" : "text-gray-400"
            }`}
          />
          <p className={`text-sm ${textColor} mb-1`}>
            {t("publications.modal.publish.dragDrop.title")}
          </p>
          <p className="text-xs text-gray-500">
            {t("publications.modal.publish.dragDrop.subtitle")}
          </p>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <X className="w-4 h-4" />
          {error}
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
        }}
        className="hidden"
      />

      {/* Full Size Modal */}
      {showFullSize && preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
          onClick={() => setShowFullSize(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <Button
              onClick={() => setShowFullSize(false)}
              variant="ghost"
              buttonStyle="ghost"
              size="md"
              className="absolute -top-10 right-0 p-2 text-white hover:text-gray-300"
              icon={X}
            >
              
            </Button>
            <img
              src={preview}
              alt="YouTube Thumbnail Full Size"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
