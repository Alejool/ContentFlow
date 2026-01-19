import { Publication } from "@/types/Publication";
import { File, PlayCircle, Video } from "lucide-react";
import { memo } from "react";

interface PublicationThumbnailProps {
  publication?: Publication | null;
  t?: (key: string) => string;
}

const PublicationThumbnail = memo(
  ({ publication }: PublicationThumbnailProps) => {
    if (!publication) {
      return <File className="w-6 h-6 text-gray-400" />;
    }

    const mediaFiles = publication.media_files;

    if (!mediaFiles || mediaFiles.length === 0) {
      return (
        <div className="relative w-full h-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
          <Video className="w-6 h-6 text-white" />
        </div>
      );
    }

    // Optimize: Check specifically for image or video thumbnail
    const firstMedia = mediaFiles[0];
    const thumbnailFile =
      firstMedia?.thumbnail?.file_path ||
      (firstMedia?.file_type?.includes("image") ? firstMedia.file_path : null);

    if (thumbnailFile) {
      let url = thumbnailFile;
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

    // If no thumbnail but has video, return video placeholder
    const hasVideo = mediaFiles.some(
      (f) => f && f.file_type && f.file_type.includes("video"),
    );
    if (hasVideo) {
      return (
        <div className="relative w-full h-full bg-gray-900 flex items-center justify-center">
          <PlayCircle className="w-8 h-8 text-white opacity-80" />
        </div>
      );
    }

    return <File className="w-6 h-6 text-gray-400" />;
  },
);

export default PublicationThumbnail;
