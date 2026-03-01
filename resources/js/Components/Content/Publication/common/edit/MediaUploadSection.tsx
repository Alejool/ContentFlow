import Label from "@/Components/common/Modern/Label";
import {
  AlertTriangle,
  Crop,
  FileImage,
  Loader2,
  Upload,
  Video,
  X,
} from "lucide-react";
import React, { memo, useRef, useState } from "react";
import ImageCropper from "./ImageCropper";

interface MediaUploadSectionProps {
  mediaPreviews: {
    id?: number;
    tempId: string;
    url: string;
    type: string;
    isNew: boolean;
    thumbnailUrl?: string;
    file?: File;
    status?: string;
  }[];
  thumbnails: Record<string, File>;
  imageError: string | null;
  isDragOver: boolean;
  t: (key: string) => string;
  onFileChange: (files: FileList | null) => void;
  onRemoveMedia: (index: number) => void;
  onSetThumbnail: (tempId: string, file: File) => void;
  onClearThumbnail: (tempId: string) => void;
  onUpdateFile?: (tempId: string, file: File) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  disabled?: boolean;
  isAnyMediaProcessing?: boolean;
  uploadProgress?: Record<string, number>;
  uploadStats?: Record<string, { eta?: number; speed?: number }>;
  uploadErrors?: Record<string, string>;
  lockedBy?: {
    id: number;
    name: string;
    photo_url: string;
    isSelf: boolean;
  } | null;
}

const MediaUploadSection = memo(
  ({
    mediaPreviews,
    thumbnails,
    imageError,
    isDragOver,
    t,
    onFileChange,
    onRemoveMedia,
    onSetThumbnail,
    onClearThumbnail,
    onUpdateFile,
    onDragOver,
    onDragLeave,
    onDrop,
    disabled,
    isAnyMediaProcessing,
    uploadProgress,
    uploadStats,
    uploadErrors,
    lockedBy,
  }: MediaUploadSectionProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [croppingImage, setCroppingImage] = useState<{
      tempId: string;
      url: string;
    } | null>(null);

    const handleCropComplete = (croppedBlob: Blob) => {
      if (!croppingImage || !onUpdateFile) return;

      const file = new File([croppedBlob], "cropped-image.jpg", {
        type: "image/jpeg",
      });

      onUpdateFile(croppingImage.tempId, file);
      setCroppingImage(null);
    };

    const getUploadAreaStyles = () => {
      if (disabled || isAnyMediaProcessing || (lockedBy && !lockedBy.isSelf)) {
        return "bg-gray-100 dark:bg-neutral-900/50 cursor-not-allowed opacity-60 border-gray-300 dark:border-neutral-700";
      }
      if (imageError) {
        return "border-primary-300 dark:border-primary-500 bg-primary-50 dark:bg-primary-900/20";
      }
      if (isDragOver) {
        return "bg-primary-50 dark:bg-primary-900/20 border-primary-500 dark:border-primary-400";
      }
      return "border-gray-200 dark:border-neutral-600 hover:border-primary-300 dark:hover:border-primary-400 bg-gray-50 dark:bg-neutral-900";
    };

    return (
      <>
        <div
          className={`space-y-4 ${disabled ? "pointer-events-none select-none" : ""}`}
        >
          <Label
            htmlFor="media-upload"
            icon={FileImage}
            required
            variant="bold"
            size="lg"
          >
            Media
          </Label>

          <label
            htmlFor="media-file-input-content"
            className={`relative group transition-all duration-300 block ${
              isDragOver && !disabled
                ? "scale-[1.02] ring-2 ring-primary-500 dark:ring-primary-900 ring-offset-2"
                : ""
            } ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
            onDrop={disabled ? undefined : onDrop}
            onDragOver={disabled ? undefined : onDragOver}
            onDragLeave={disabled ? undefined : onDragLeave}
          >
            <div
              className={`min-h-[200px] rounded-lg border-2 border-dashed flex flex-col items-center justify-center p-6 text-center transition-colors overflow-hidden ${getUploadAreaStyles()}`}
            >
              {mediaPreviews.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 w-full">
                  {mediaPreviews.map((preview, index) => (
                    <MediaPreviewItem
                      key={preview.tempId}
                      preview={preview}
                      index={index}
                      thumbnail={thumbnails[preview.tempId]}
                      onRemove={() => onRemoveMedia(index)}
                      onSetThumbnail={(file) =>
                        onSetThumbnail(preview.tempId, file)
                      }
                      onCrop={(tempId, url) =>
                        setCroppingImage({ tempId, url })
                      }
                      onClearThumbnail={() => onClearThumbnail(preview.tempId)}
                      disabled={disabled || isAnyMediaProcessing}
                      progress={uploadProgress?.[preview.file?.name || ""]}
                      stats={uploadStats?.[preview.file?.name || ""]}
                      error={uploadErrors?.[preview.file?.name || ""]}
                      isExternalProcessing={preview.status === "processing"}
                    />
                  ))}
                  {!disabled && !isAnyMediaProcessing && (
                    <AddMoreButton />
                  )}
                </div>
              ) : (
                <EmptyUploadState
                  t={t}
                  isProcessing={isAnyMediaProcessing}
                  lockedBy={lockedBy}
                />
              )}

              {/* Global Processing Indicator for the whole area */}
              {isAnyMediaProcessing && (
                <div className="absolute inset-x-0 bottom-0 py-1.5 px-4 bg-primary-500/10 backdrop-blur-md border-t border-primary-500/20 animate-in slide-in-from-bottom-2">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-gray-200 dark:bg-neutral-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 transition-all duration-500 ease-out"
                        style={{
                          width: `${
                            Object.values(uploadProgress || {}).length > 0
                              ? Object.values(uploadProgress || {}).reduce(
                                  (a, b) => a + b,
                                  0,
                                ) / Object.values(uploadProgress || {}).length
                              : 100
                          }%`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase whitespace-nowrap">
                      {Object.values(uploadProgress || {}).length > 0
                        ? "Subiendo..."
                        : "Procesando S3..."}
                    </span>
                  </div>
                </div>
              )}
            </div>
            {!disabled && !isAnyMediaProcessing && (
              <input
                ref={fileInputRef}
                id="media-file-input-content"
                type="file"
                className="hidden"
                multiple
                accept="image/*,video/*"
                onChange={(e) => onFileChange(e.target.files)}
              />
            )}
          </label>

          {imageError && (
            <div className="mt-2 flex items-center gap-2 text-sm text-primary-500 animate-in slide-in-from-left-1">
              <AlertTriangle className="w-4 h-4" />
              {imageError}
            </div>
          )}
        </div>

        {croppingImage && (
          <ImageCropper
            isOpen={true}
            onClose={() => setCroppingImage(null)}
            image={croppingImage.url}
            onCropComplete={handleCropComplete}
          />
        )}
      </>
    );
  },
);

const MediaPreviewItem = memo(
  ({
    preview,
    index,
    thumbnail,
    onRemove,
    onSetThumbnail,
    onCrop,
    onClearThumbnail,
    disabled,
    progress,
    stats,
    error,
    isExternalProcessing,
  }: {
    preview: any;
    index: number;
    thumbnail?: File;
    onRemove: () => void;
    onSetThumbnail: (file: File) => void;
    onCrop: (tempId: string, url: string) => void;
    onClearThumbnail: () => void;
    disabled?: boolean;
    progress?: number;
    stats?: { eta?: number; speed?: number };
    error?: string;
    isExternalProcessing?: boolean;
  }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const formatETA = (seconds?: number) => {
      if (!seconds) return "";
      if (seconds < 60) return `${seconds}s`;
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}m ${secs}s`;
    };

    const isProcessing =
      preview.status === "processing" ||
      (progress !== undefined &&
        progress >= 100 &&
        preview.status !== "completed") ||
      isExternalProcessing;
    const isUploading =
      preview.status === "uploading" ||
      (progress !== undefined && progress < 100);

    return (
      <div
        className={`relative group/item aspect-video border rounded-lg overflow-hidden bg-gray-900 ${
          disabled ? "opacity-90" : ""
        } ${error ? "border-red-500 ring-2 ring-red-500/20" : ""} ${isProcessing || isUploading ? "animate-pulse" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {isProcessing || isUploading ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800 text-white p-4">
            <div className="p-3 rounded-full bg-white/10 mb-2">
              {preview.type.includes("video") ? (
                <Video className="w-8 h-8 text-white/50" />
              ) : (
                <FileImage className="w-8 h-8 text-white/50" />
              )}
            </div>
            <span className="text-xs font-bold uppercase tracking-wider opacity-70">
              {isUploading ? "Uploading..." : "Processing..."}
            </span>
          </div>
        ) : preview.type.includes("video") ? (
          <VideoPreview
            preview={preview}
            thumbnail={thumbnail}
            onSetThumbnail={onSetThumbnail}
            onClearThumbnail={onClearThumbnail}
            fileInputRef={fileInputRef}
            disabled={disabled}
          />
        ) : (
          <img src={preview.url} className="w-full h-full object-cover" alt="Media preview" />
        )}

        {/* Upload Overlay (Matching Outside Style) */}
        {!error && isUploading && (
          <div className="absolute inset-x-0 bottom-0 bg-black/60 p-3 backdrop-blur-md border-t border-white/10 z-20">
            <div className="w-full bg-gray-700/50 h-1.5 rounded-full overflow-hidden mb-1.5">
              <div
                className="bg-primary-500 h-full transition-all duration-500 linear"
                style={{ width: `${progress || 0}%` }}
              />
            </div>
            <div className="text-[10px] text-white/90 font-bold flex justify-between w-full uppercase tracking-tighter">
              <span>{Math.round(progress || 0)}%</span>
              {stats?.eta && <span>~{formatETA(stats.eta)}</span>}
            </div>
          </div>
        )}

        {/* Error Overlay */}
        {error && (
          <div className="absolute inset-0 bg-red-900/80 flex flex-col items-center justify-center p-4 backdrop-blur-sm z-20 text-center animate-in fade-in zoom-in duration-300">
            <AlertTriangle className="w-8 h-8 text-white mb-2" />
            <span className="text-white text-sm font-bold">Upload Failed</span>
            <span className="text-white/80 text-xs mt-1 px-2 line-clamp-2">
              {error}
            </span>
          </div>
        )}

        {!disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="absolute top-2 right-2 p-1.5 bg-red-500/80 text-white rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover/item:opacity-100 backdrop-blur-sm z-30"
          >
            <X className="w-3 h-3" />
          </button>
        )}

        {!disabled && !preview.type.includes("video") && !isProcessing && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onCrop(preview.tempId, preview.url);
            }}
            className="absolute top-2 right-10 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors opacity-0 group-hover/item:opacity-100 backdrop-blur-sm z-30"
            title="Crop Image"
          >
            <Crop className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  },
);

const VideoPreview = memo(
  ({
    preview,
    thumbnail,
    onSetThumbnail,
    onClearThumbnail,
    fileInputRef,
    disabled,
  }: {
    preview: any;
    thumbnail?: File;
    onSetThumbnail: (file: File) => void;
    onClearThumbnail: () => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    disabled?: boolean;
  }) => (
    <>
      <video
        src={preview.url}
        className="w-full h-full object-cover opacity-80"
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <span className="text-white/80 text-xs font-medium bg-black/50 px-2 py-1 rounded">
          Video
        </span>
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <input
            type="file"
            id={`edit-thumb-${preview.tempId}`}
            className="hidden"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onSetThumbnail(file);
            }}
          />
          <label
            htmlFor={disabled ? undefined : `edit-thumb-${preview.tempId}`}
            className={`text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm transition-colors flex items-center gap-1 border border-white/20 ${disabled ? "cursor-default opacity-50" : "cursor-pointer bg-white/10 hover:bg-white/20"}`}
          >
            <FileImage className="w-3 h-3" />
            {thumbnail || preview.thumbnailUrl ? "Change Thumb" : "Set Thumb"}
          </label>
          {(thumbnail || preview.thumbnailUrl) && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClearThumbnail();
              }}
              className="bg-red-500/80 hover:bg-red-600 text-white p-1.5 rounded-full backdrop-blur-sm transition-colors border border-red-400/50 shadow-lg"
              title="Remove Thumbnail"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
      {(thumbnail || preview.thumbnailUrl) && (
        <div className="absolute top-2 left-2 w-8 h-8 rounded border border-white/30 overflow-hidden shadow-lg z-10">
          <img
            src={
              thumbnail ? URL.createObjectURL(thumbnail) : preview.thumbnailUrl
            }
            className="w-full h-full object-cover"
            alt="Video thumbnail"
          />
        </div>
      )}
    </>
  ),
);

const AddMoreButton = memo(() => (
  <label
    htmlFor="media-file-input-content"
    className="flex items-center justify-center aspect-video border-2 border-dashed border-gray-300 rounded-lg hover:bg-primary-50 transition-colors cursor-pointer"
  >
    <div className="text-center">
      <Upload className="w-6 h-6 mx-auto text-gray-400" />
      <span className="text-xs text-gray-500">Add more</span>
    </div>
  </label>
));

const EmptyUploadState = memo(
  ({
    t,
    isProcessing,
    lockedBy,
  }: {
    t: (key: string) => string;
    isProcessing?: boolean;
    lockedBy?: { name: string; isSelf: boolean } | null;
  }) => (
    <div className="space-y-4">
      <div
        className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto transition-all duration-300 ${isProcessing || (lockedBy && !lockedBy.isSelf) ? "bg-gray-200 dark:bg-gray-800" : "bg-primary-100 dark:bg-primary-900/30 group-hover:scale-110"}`}
      >
        {isProcessing ? (
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        ) : lockedBy && !lockedBy.isSelf ? (
          <AlertTriangle className="w-8 h-8 text-yellow-500" />
        ) : (
          <Upload className="w-8 h-8 text-primary-500" />
        )}
      </div>
      <div>
        <p className="font-medium text-lg">
          {isProcessing
            ? "Procesando archivos..."
            : lockedBy && !lockedBy.isSelf
              ? `Subida bloqueada por ${lockedBy.name}`
              : t("publications.modal.edit.dragDrop.title")}
        </p>
        <p className="text-sm mt-1 opacity-70">
          {isProcessing
            ? "Por favor, espera a que termine la subida actual."
            : lockedBy && !lockedBy.isSelf
              ? "Solo una persona puede subir archivos a la vez."
              : t("publications.modal.edit.dragDrop.subtitle")}
        </p>
      </div>
    </div>
  ),
);

export default MediaUploadSection;
