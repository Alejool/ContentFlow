import { Publication } from "@/types/Publication";
import { File } from "lucide-react";

interface PublicationThumbnailProps {
  publication: Publication;
}

export default function PublicationThumbnail({
  publication,
}: PublicationThumbnailProps) {
  const getThumbnail = (pub: Publication) => {
    if (!pub.media_files || pub.media_files.length === 0) return null;

    const firstImage = pub.media_files.find((f) =>
      f.file_type.includes("image")
    );
    if (firstImage) {
      let url = firstImage.file_path;
      if (!url.startsWith("http") && !url.startsWith("/storage/")) {
        url = `/storage/${url}`;
      }
      return { url, type: "image" };
    }

    const hasVideo = pub.media_files.some((f) => f.file_type.includes("video"));
    if (hasVideo) {
      return { url: null, type: "video" };
    }

    return null;
  };

  const thumbnail = getThumbnail(publication);

  if (!thumbnail) {
    return <File className="w-6 h-6 text-gray-400" />;
  }

  if (thumbnail.type === "image" && thumbnail.url) {
    return (
      <img
        src={thumbnail.url}
        className="w-full h-full object-cover"
        alt="Thumbnail"
      />
    );
  }

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
