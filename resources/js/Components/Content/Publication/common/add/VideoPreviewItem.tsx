import { AlertTriangle, FileImage, X } from "lucide-react";
import React, { useState } from "react";
import Button from "@/Components/common/Modern/Button";

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
  const [isTooLong, setIsTooLong] = useState(
    duration && duration > 60 && youtubeType === "short"
  );

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
    <div className="relative group/item aspect-video border rounded-lg overflow-hidden bg-gray-900">
      <video src={preview} className="w-full h-full object-cover opacity-80" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <span className="text-white/80 text-xs font-medium bg-black/50 px-2 py-1 rounded">
          Video
        </span>
        <div className="relative">
          <input
            type="file"
            id={`thumbnail-${index}`}
            className="hidden"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onThumbnailChange(file);
            }}
            onClick={(e) => e.stopPropagation()}
          />
          <label
            htmlFor={`thumbnail-${index}`}
            className="cursor-pointer bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm transition-colors flex items-center gap-1 border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            <FileImage className="w-3 h-3" />
            {thumbnail || thumbnailUrl ? "Change Thumb" : "Add Thumb"}
          </label>
        </div>
      </div>

      {(thumbnail || thumbnailUrl) && (
        <div className="absolute top-2 left-2 w-8 h-8 rounded border border-white/30 overflow-hidden shadow-lg z-10">
          <img
            src={thumbnail ? URL.createObjectURL(thumbnail) : thumbnailUrl}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <Button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        buttonStyle="solid"
        variant="danger"
        size="sm"
        icon={X}
        className="absolute top-2 right-2 opacity-0 group-hover/item:opacity-100"
      />

      {duration && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 space-y-1">
          <div className="flex items-center justify-between text-xs text-white">
            <span className="font-medium">{formatDuration(duration)}</span>
            <div className="flex gap-1">
              <Button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleTypeChange("short");
                }}
                disabled={duration > 60}
                buttonStyle={youtubeType === "short" ? "solid" : "ghost"}
                variant={youtubeType === "short" ? "primary" : "ghost"}
                size="xs"
                className={duration > 60 ? "cursor-not-allowed" : ""}
                title={
                  duration > 60
                    ? `Video too long for Short (${duration}s > 60s)`
                    : ""
                }
              >
                Short
              </Button>
              <Button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleTypeChange("video");
                }}
                buttonStyle={youtubeType === "video" ? "solid" : "ghost"}
                variant={youtubeType === "video" ? "primary" : "ghost"}
                size="xs"
              >
                Video
              </Button>
            </div>
          </div>
          {isTooLong && (
            <div className="text-[9px] text-yellow-300 flex items-center gap-1">
              <AlertTriangle className="w-2.5 h-2.5" />
              Too long for Short
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoPreviewItem;
