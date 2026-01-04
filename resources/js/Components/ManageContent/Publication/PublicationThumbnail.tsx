import React, { memo } from "react";
import { Publication } from "@/types/Publication";
import { File } from "lucide-react";

interface PublicationThumbnailProps {
  publication?: Publication | null;
  t?: (key: string) => string;
}

const PublicationThumbnail = memo(({
  publication,
}: PublicationThumbnailProps) => {
  if (!publication) {
    return <File className="w-6 h-6 text-gray-400" />;
  }

  const mediaFiles = publication.media_files;

  if (!mediaFiles || mediaFiles.length === 0) {
    return (
      <div className="relative w-full h-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
        <svg
          className="w-6 h-6 text-white"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
        </svg>
      </div>
    );
  }

  // Optimize: Check specifically for image first, without mapping entire array if possible
  const firstImage = mediaFiles.find((f) => f && f.file_type && f.file_type.includes("image"));

  if (firstImage) {
    let url = firstImage.file_path;
    if (!url) return <File className="w-6 h-6 text-gray-400" />;

    if (!url.startsWith("http") && !url.startsWith("/storage/")) {
      url = `/storage/${url}`;
    }

    return (
      <img
        src={url}
        className="w-full h-full object-cover"
        alt={publication.title || "Thumbnail"}
        loading="lazy"
        decoding="async"
      />
    );
  }

  // If no image but has video, return video placeholder
  const hasVideo = mediaFiles.some((f) => f && f.file_type && f.file_type.includes("video"));
  if (hasVideo) {
    return (
      <div className="relative w-full h-full bg-gray-900 flex items-center justify-center">
        <svg className="w-8 h-8 text-white opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    );
  }

  return <File className="w-6 h-6 text-gray-400" />;
});

export default PublicationThumbnail;
