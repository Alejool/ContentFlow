import { Play, Trash2, Upload, X, ZoomIn } from "lucide-react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

interface YouTubeThumbnailUploaderProps {
  videoId: number;
  videoFileName?: string;
  videoPreviewUrl?: string;
  existingThumbnail?: {
    url: string;
    id: number;
  } | null;
  onThumbnailChange: (videoId: number, file: File | null) => void;
  onThumbnailDelete?: (videoId: number) => void;
}

const YouTubeThumbnailUploader = function YouTubeThumbnailUploader({
  videoId,
  videoFileName,
  videoPreviewUrl,
  existingThumbnail,
  onThumbnailChange,
  onThumbnailDelete,
}: YouTubeThumbnailUploaderProps) {
  const { t } = useTranslation();
  const [preview, setPreview] = useState<string | null>(
    existingThumbnail?.url || null
  );
  const [showFullSize, setShowFullSize] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setPreview(existingThumbnail?.url || null);
  }, [existingThumbnail?.url]);

  const validateThumbnail = useCallback((file: File): Promise<string | null> => {
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
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        if (img.width < 1280 || img.height < 720) {
          resolve("Image must be at least 1280x720 pixels");
        } else {
          resolve(null);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve("Failed to load image");
      };
      img.src = objectUrl;
    });
  }, []);

  const handleFileSelect = useCallback(async (file: File) => {
    const validationError = await validateThumbnail(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
      onThumbnailChange(videoId, file);
    };
    reader.readAsDataURL(file);
  }, [validateThumbnail, onThumbnailChange, videoId]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDelete = useCallback(() => {
    setPreview(null);
    setError(null);
    onThumbnailChange(videoId, null);
    if (onThumbnailDelete) {
      onThumbnailDelete(videoId);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [onThumbnailChange, onThumbnailDelete, videoId]);

  const handleInputClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleShowFullSize = useCallback(() => {
    setShowFullSize(true);
  }, []);

  const handleCloseFullSize = useCallback(() => {
    setShowFullSize(false);
  }, []);

  const handleShowVideoModal = useCallback(() => {
    setShowVideoModal(true);
  }, []);

  const handleCloseVideoModal = useCallback(() => {
    setShowVideoModal(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, []);

  return (
    <div className="space-y-3">
      {/* Video Preview */}
      {videoPreviewUrl && (
        <div className="p-3 rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800">
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0 group cursor-pointer" onClick={handleShowVideoModal}>
              {/* Thumbnail estático sin cargar el video */}
              <div className="w-32 h-20 bg-gradient-to-br from-gray-800 to-gray-900 rounded border border-gray-300 dark:border-gray-600 overflow-hidden relative flex items-center justify-center">
                <Play className="w-12 h-12 text-white/60" />
              </div>
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                <Play className="w-8 h-8 text-white" fill="white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Video:</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                {videoFileName || `Video #${videoId}`}
              </p>
              <button
                type="button"
                onClick={handleShowVideoModal}
                className="text-xs text-primary-500 hover:text-primary-600 mt-1"
              >
                Click to preview
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
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
              className="w-full h-32 object-cover rounded-lg border-2 border-gray-200 dark:border-neutral-700"
            />

            {/* Overlay with actions */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={handleShowFullSize}
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
            onClick={handleInputClick}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 hover:bg-opacity-80 transition-colors text-gray-700 dark:text-gray-300"
          >
            {t("publications.modal.publish.button.change")}
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleInputClick}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
            isDragging
              ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
              : "border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 hover:border-primary-400"
          }`}
        >
          <Upload
            className={`w-8 h-8 mx-auto mb-2 ${
              isDragging ? "text-primary-500" : "text-gray-400"
            }`}
          />
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
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
        accept="image/jpeg,image/jpg,image/png,image/gif"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
        }}
        className="hidden"
      />

      {/* Full Size Thumbnail Modal */}
      {showFullSize && preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
          onClick={handleCloseFullSize}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={handleCloseFullSize}
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

      {/* Video Preview Modal */}
      {showVideoModal && videoPreviewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90"
          onClick={handleCloseVideoModal}
        >
          <div className="relative max-w-4xl w-full">
            <button
              onClick={handleCloseVideoModal}
              className="absolute -top-10 right-0 p-2 text-white hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
            <video
              ref={videoRef}
              src={videoPreviewUrl}
              className="w-full max-h-[80vh] rounded-lg"
              controls
              autoPlay
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Comparación personalizada para React.memo
YouTubeThumbnailUploader.displayName = 'YouTubeThumbnailUploader';

// Función de comparación que verifica si las props realmente cambiaron
const arePropsEqual = (
  prevProps: YouTubeThumbnailUploaderProps,
  nextProps: YouTubeThumbnailUploaderProps
) => {
  // Comparar props primitivas
  if (
    prevProps.videoId !== nextProps.videoId ||
    prevProps.videoFileName !== nextProps.videoFileName ||
    prevProps.videoPreviewUrl !== nextProps.videoPreviewUrl
  ) {
    return false;
  }

  // Comparar existingThumbnail por contenido, no por referencia
  const prevThumb = prevProps.existingThumbnail;
  const nextThumb = nextProps.existingThumbnail;
  
  if (prevThumb === nextThumb) return true;
  if (!prevThumb && !nextThumb) return true;
  if (!prevThumb || !nextThumb) return false;
  if (prevThumb.url !== nextThumb.url || prevThumb.id !== nextThumb.id) {
    return false;
  }

  // Las funciones deberían ser estables si están memoizadas correctamente
  // pero no las comparamos porque pueden cambiar por referencia
  return true;
};

export default memo(YouTubeThumbnailUploader, arePropsEqual);
