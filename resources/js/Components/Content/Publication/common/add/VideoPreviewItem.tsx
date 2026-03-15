import { AlertTriangle, FileImage, X } from "lucide-react";
import React, { useState } from "react";

interface VideoPreviewItemProps {
  preview: string;
  index: number;
  duration?: number;
  youtubeType: "short" | "video";
  thumbnail?: File;
  thumbnailUrl?: string;
  onRemove: () => void;
  onThumbnailChange: (file: File) => void;
  onYoutubeTypeChange: (type: "short" | "video") => void;
}

const VideoPreviewItem: React.FC<VideoPreviewItemProps> = ({
  preview,
  index,
  duration,
  youtubeType,
  thumbnail,
  thumbnailUrl,
  onRemove,
  onThumbnailChange,
  onYoutubeTypeChange,
}) => {
  const [isTooLong, setIsTooLong] = useState(duration && duration > 60 && youtubeType === "short");

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleTypeChange = (type: "short" | "video") => {
    if (duration && duration > 60 && type === "short") {
      setIsTooLong(true);
    } else {
      setIsTooLong(false);
    }
    onYoutubeTypeChange(type);
  };

  return (
    <div className="group/item relative aspect-video overflow-hidden rounded-lg border bg-gray-900">
      <video src={preview} className="h-full w-full object-cover opacity-80" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <span className="rounded bg-black/50 px-2 py-1 text-xs font-medium text-white/80">
          Video
        </span>
        <div className="relative">
          <input
            type="file"
            id={`thumbnail-${index}`}
            className="hidden"
            accept="image/jpeg,image/jpg,image/png,image/gif"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onThumbnailChange(file);
            }}
            onClick={(e) => e.stopPropagation()}
          />
          <label
            htmlFor={`thumbnail-${index}`}
            className="flex cursor-pointer items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            <FileImage className="h-3 w-3" />
            {thumbnail || thumbnailUrl ? "Change Thumb" : "Add Thumb"}
          </label>
        </div>
      </div>

      {(thumbnail || thumbnailUrl) && (
        <div className="absolute left-2 top-2 z-10 h-8 w-8 overflow-hidden rounded border border-white/30 shadow-lg">
          <img
            src={thumbnail ? URL.createObjectURL(thumbnail) : thumbnailUrl}
            className="h-full w-full object-cover"
            alt="Video thumbnail"
          />
        </div>
      )}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute right-2 top-2 rounded-full bg-red-500/80 p-1.5 text-white opacity-0 backdrop-blur-sm transition-colors hover:bg-red-600 group-hover/item:opacity-100"
      >
        <X className="h-3 w-3" />
      </button>

      {duration && (
        <div className="absolute bottom-0 left-0 right-0 space-y-1 bg-gradient-to-t from-black/80 to-transparent p-2">
          <div className="flex items-center justify-between text-xs text-white">
            <span className="font-medium">{formatDuration(duration)}</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleTypeChange("short");
                }}
                disabled={duration > 60}
                className={`rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${
                  youtubeType === "short"
                    ? "bg-primary-500 text-white"
                    : duration > 60
                      ? "cursor-not-allowed bg-gray-600/50 text-gray-400"
                      : "bg-white/20 text-white hover:bg-white/30"
                }`}
                title={duration > 60 ? `Video too long for Short (${duration}s > 60s)` : ""}
              >
                Short
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleTypeChange("video");
                }}
                className={`rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${
                  youtubeType === "video"
                    ? "bg-primary-500 text-white"
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
              >
                Video
              </button>
            </div>
          </div>
          {isTooLong && (
            <div className="flex items-center gap-1 text-[9px] text-yellow-300">
              <AlertTriangle className="h-2.5 w-2.5" />
              Too long for Short
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoPreviewItem;
