import { Publication } from "@/types/Publication";
import { File, Loader2, PlayCircle, Video } from "lucide-react";
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
    const isLockedForMedia = !!publication.media_locked_by;

    let content;

    if (!mediaFiles || mediaFiles.length === 0) {
      content = (
        <div className="relative w-full h-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
          <Video className="w-6 h-6 text-white" />
        </div>
      );
    } else {
      // Optimize: Check specifically for image or video thumbnail
      const firstMedia = mediaFiles[0];
      const thumbnailFile =
        firstMedia?.thumbnail?.file_path ||
        (firstMedia?.file_type?.includes("image")
          ? firstMedia.file_path
          : null);

      if (thumbnailFile) {
        let url = thumbnailFile;
        if (!url.startsWith("http") && !url.startsWith("/storage/")) {
          url = `/storage/${url}`;
        }

        content = (
          <img
            src={url}
            className="w-full h-full object-cover"
            alt={publication.title || "Thumbnail"}
            loading="lazy"
            decoding="async"
          />
        );
      } else {
        // If no thumbnail but has video, return video placeholder
        const hasVideo = mediaFiles.some(
          (f) => f && f.file_type && f.file_type.includes("video"),
        );
        if (hasVideo) {
          content = (
            <div className="relative w-full h-full bg-gray-900 flex items-center justify-center">
              <PlayCircle className="w-8 h-8 text-white opacity-80" />
            </div>
          );
        } else {
          content = <File className="w-6 h-6 text-gray-400" />;
        }
      }
    }

    return (
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        {content}
        {isLockedForMedia && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex flex-col items-center justify-center z-10">
            <Loader2 className="w-5 h-5 text-white animate-spin mb-1" />
            <span className="text-[8px] font-bold text-white uppercase tracking-wider leading-none">
              Subiendo
            </span>
          </div>
        )}
      </div>
    );
  },
);

export default PublicationThumbnail;
