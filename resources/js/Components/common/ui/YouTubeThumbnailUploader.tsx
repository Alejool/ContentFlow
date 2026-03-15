import { Play, Trash2, Upload, X, ZoomIn } from 'lucide-react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

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
  const [preview, setPreview] = useState<string | null>(existingThumbnail?.url || null);
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
      if (!file.type.startsWith('image/')) {
        resolve('Only image files are allowed');
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        resolve('Image must be smaller than 2MB');
        return;
      }

      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        if (img.width < 1280 || img.height < 720) {
          resolve('Image must be at least 1280x720 pixels');
        } else {
          resolve(null);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve('Failed to load image');
      };
      img.src = objectUrl;
    });
  }, []);

  const handleFileSelect = useCallback(
    async (file: File) => {
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
    },
    [validateThumbnail, onThumbnailChange, videoId],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect],
  );

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
      fileInputRef.current.value = '';
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
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-neutral-700 dark:bg-neutral-800">
          <div className="flex items-center gap-3">
            <div
              className="group relative flex-shrink-0 cursor-pointer"
              onClick={handleShowVideoModal}
            >
              {/* Thumbnail estático sin cargar el video */}
              <div className="relative flex h-20 w-32 items-center justify-center overflow-hidden rounded border border-gray-300 bg-gradient-to-br from-gray-800 to-gray-900 dark:border-gray-600">
                <Play className="h-12 w-12 text-white/60" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center rounded bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <Play className="h-8 w-8 text-white" fill="white" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">Video:</p>
              <p className="truncate text-sm text-gray-600 dark:text-gray-400">
                {videoFileName || `Video #${videoId}`}
              </p>
              <button
                type="button"
                onClick={handleShowVideoModal}
                className="mt-1 text-xs text-primary-500 hover:text-primary-600"
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
          <span className="ml-2 text-xs text-gray-500">(Recommended: 1280x720)</span>
        </label>
      </div>

      {preview ? (
        <div className="space-y-2">
          {/* Small Preview */}
          <div className="group relative">
            <img
              src={preview}
              alt="YouTube Thumbnail"
              className="h-32 w-full rounded-lg border-2 border-gray-200 object-cover dark:border-neutral-700"
            />

            {/* Overlay with actions */}
            <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-lg bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                onClick={handleShowFullSize}
                className="rounded-full bg-white/90 p-2 transition-colors hover:bg-white"
                title="View full size"
              >
                <ZoomIn className="h-4 w-4 text-gray-900" />
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-full bg-red-500/90 p-2 transition-colors hover:bg-red-500"
                title="Delete thumbnail"
              >
                <Trash2 className="h-4 w-4 text-white" />
              </button>
            </div>
          </div>

          {/* Change button */}
          <button
            type="button"
            onClick={handleInputClick}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-opacity-80 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-300"
          >
            {t('publications.modal.publish.button.change')}
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleInputClick}
          className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-all ${
            isDragging
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'border-gray-200 bg-gray-50 hover:border-primary-400 dark:border-neutral-700 dark:bg-neutral-800'
          }`}
        >
          <Upload
            className={`mx-auto mb-2 h-8 w-8 ${isDragging ? 'text-primary-500' : 'text-gray-400'}`}
          />
          <p className="mb-1 text-sm text-gray-700 dark:text-gray-300">
            {t('publications.modal.publish.dragDrop.title')}
          </p>
          <p className="text-xs text-gray-500">
            {t('publications.modal.publish.dragDrop.subtitle')}
          </p>
        </div>
      )}

      {error && (
        <p className="flex items-center gap-1 text-sm text-red-500">
          <X className="h-4 w-4" />
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={handleCloseFullSize}
        >
          <div className="relative max-h-[90vh] max-w-4xl">
            <button
              onClick={handleCloseFullSize}
              className="absolute -top-10 right-0 p-2 text-white hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={preview}
              alt="YouTube Thumbnail Full Size"
              className="max-h-[90vh] max-w-full rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Video Preview Modal */}
      {showVideoModal && videoPreviewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={handleCloseVideoModal}
        >
          <div className="relative w-full max-w-4xl">
            <button
              onClick={handleCloseVideoModal}
              className="absolute -top-10 right-0 p-2 text-white hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
            <video
              ref={videoRef}
              src={videoPreviewUrl}
              className="max-h-[80vh] w-full rounded-lg"
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
  nextProps: YouTubeThumbnailUploaderProps,
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
