import { useTheme } from "@/Hooks/useTheme";
import { Trash2, Upload, X, ZoomIn } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

interface YouTubeThumbnailUploaderProps {
  videoId: number;
  existingThumbnail?: {
    url: string;
    id: number;
  } | null;
  onThumbnailChange: (file: File | null) => void;
  onThumbnailDelete?: () => void;
}

export default function YouTubeThumbnailUploader({
  videoId,
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

  const validateThumbnail = (file: File): string | null => {
    // Check file type
    if (!file.type.startsWith("image/")) {
      return "Only image files are allowed";
    }

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return "Image must be smaller than 2MB";
    }

    return null;
  };

  const handleFileSelect = (file: File) => {
    const validationError = validateThumbnail(file);
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
              <button
                type="button"
                onClick={() => setShowFullSize(true)}
                className="p-2 bg-white/90 hover:bg-white rounded-full transition-colors"
                title="View full size"
              >
                <ZoomIn className="w-4 h-4 text-gray-900" />
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="p-2 bg-red-500/90 hover:bg-red-500 rounded-full transition-colors"
                title="Delete thumbnail"
              >
                <Trash2 className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Change button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`w-full px-3 py-2 text-sm rounded-lg border ${borderColor} ${bgColor} hover:bg-opacity-80 transition-colors ${textColor}`}
          >
            Change Thumbnail
          </button>
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
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-gray-500">PNG, JPG, WebP (max 2MB)</p>
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
            <button
              onClick={() => setShowFullSize(false)}
              className="absolute -top-10 right-0 p-2 text-white hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
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
