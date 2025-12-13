import Label from "@/Components/common/Modern/Label";
import { AlertTriangle, FileImage, Upload, X } from "lucide-react";
import React, { useRef } from "react";

interface MediaUploadSectionProps {
  mediaPreviews: {
    id?: number;
    tempId: string;
    url: string;
    type: string;
    isNew: boolean;
    thumbnailUrl?: string;
  }[];
  thumbnails: Record<string, File>;
  imageError: string | null;
  isDragOver: boolean;
  theme: "dark" | "light";
  t: (key: string) => string;
  onFileChange: (files: FileList | null) => void;
  onRemoveMedia: (index: number) => void;
  onSetThumbnail: (tempId: string, file: File) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
}

const MediaUploadSection: React.FC<MediaUploadSectionProps> = ({
  mediaPreviews,
  thumbnails,
  imageError,
  isDragOver,
  theme,
  t,
  onFileChange,
  onRemoveMedia,
  onSetThumbnail,
  onDragOver,
  onDragLeave,
  onDrop,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getUploadAreaStyles = () => {
    if (imageError) {
      return theme === "dark"
        ? "border-primary-500 bg-primary-900/20"
        : "border-primary-300 bg-primary-50";
    }
    if (isDragOver) {
      return theme === "dark"
        ? "bg-primary-900/20 border-primary-400"
        : "bg-primary-50 border-primary-500";
    }
    return theme === "dark"
      ? "border-neutral-600 hover:border-primary-400 bg-neutral-700"
      : "border-gray-200 hover:border-primary-300 bg-gray-50";
  };

  return (
    <div className="space-y-4">
      <Label
        htmlFor="media-upload"
        icon={FileImage}
        required
        variant="bold"
        size="lg"
      >
        Media
      </Label>

      <div
        className={`relative group cursor-pointer transition-all duration-300 ${
          isDragOver
            ? `scale-[1.02] ring-2 ${
                theme === "dark" ? "ring-primary-400" : "ring-primary-500"
              } ring-offset-2`
            : ""
        }`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => fileInputRef.current?.click()}
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
                  theme={theme}
                />
              ))}
              <AddMoreButton onClick={() => fileInputRef.current?.click()} />
            </div>
          ) : (
            <EmptyUploadState theme={theme} t={t} />
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          accept="image/*,video/*"
          onChange={(e) => onFileChange(e.target.files)}
        />
      </div>

      {imageError && (
        <div className="mt-2 flex items-center gap-2 text-sm text-primary-500 animate-in slide-in-from-left-1">
          <AlertTriangle className="w-4 h-4" />
          {imageError}
        </div>
      )}
    </div>
  );
};

const MediaPreviewItem: React.FC<{
  preview: any;
  index: number;
  thumbnail?: File;
  onRemove: () => void;
  onSetThumbnail: (file: File) => void;
  theme: "dark" | "light";
}> = ({ preview, index, thumbnail, onRemove, onSetThumbnail, theme }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className="relative group/item aspect-video border rounded-lg overflow-hidden bg-gray-900"
      onClick={(e) => e.stopPropagation()}
    >
      {preview.type.includes("video") ? (
        <VideoPreview
          preview={preview}
          thumbnail={thumbnail}
          onSetThumbnail={onSetThumbnail}
          fileInputRef={fileInputRef}
        />
      ) : (
        <img src={preview.url} className="w-full h-full object-cover" />
      )}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute top-2 right-2 p-1.5 bg-red-500/80 text-white rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover/item:opacity-100 backdrop-blur-sm"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};

const VideoPreview: React.FC<{
  preview: any;
  thumbnail?: File;
  onSetThumbnail: (file: File) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}> = ({ preview, thumbnail, onSetThumbnail, fileInputRef }) => (
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
          htmlFor={`edit-thumb-${preview.tempId}`}
          className="cursor-pointer bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm transition-colors flex items-center gap-1 border border-white/20"
        >
          <FileImage className="w-3 h-3" />
          {thumbnail || preview.thumbnailUrl ? "Change Thumb" : "Set Thumb"}
        </label>
      </div>
    </div>
    {(thumbnail || preview.thumbnailUrl) && (
      <div className="absolute top-2 left-2 w-8 h-8 rounded border border-white/30 overflow-hidden shadow-lg z-10">
        <img
          src={
            thumbnail ? URL.createObjectURL(thumbnail) : preview.thumbnailUrl
          }
          className="w-full h-full object-cover"
        />
      </div>
    )}
  </>
);

const AddMoreButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <div
    className="flex items-center justify-center aspect-video border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
    onClick={onClick}
  >
    <div className="text-center">
      <Upload className="w-6 h-6 mx-auto text-gray-400" />
      <span className="text-xs text-gray-500">Add more</span>
    </div>
  </div>
);

const EmptyUploadState: React.FC<{
  theme: "dark" | "light";
  t: (key: string) => string;
}> = ({ theme, t }) => (
  <div className="space-y-4">
    <div
      className={`w-16 h-16 rounded-full ${
        theme === "dark" ? "bg-primary-900/30" : "bg-primary-100"
      } flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300`}
    >
      <Upload className="w-8 h-8 text-primary-500" />
    </div>
    <div>
      <p className="font-medium text-lg">
        {t("publications.modal.edit.dragDrop.title")}
      </p>
      <p className="text-sm mt-1">
        {t("publications.modal.edit.dragDrop.subtitle")}
      </p>
    </div>
  </div>
);

export default MediaUploadSection;
