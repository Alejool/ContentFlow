import type { Publication } from '@/types/Publications/Publication';
import { usePresignedUrl } from '@/Hooks/Upload/usePresignedUrl';
import { File, Loader2, PlayCircle, Video } from 'lucide-react';
import { memo } from 'react';

interface PublicationThumbnailProps {
  publication?: Publication | null;
  t?: (key: string) => string;
}

const PublicationThumbnail = memo(function PublicationThumbnail({
  publication,
}: PublicationThumbnailProps) {
  if (!publication) {
    return <File className="h-6 w-6 text-gray-400" />;
  }

  const mediaFiles = publication.media_files;
  const isLockedForMedia = !!publication.media_locked_by;

  let content;

  if (!mediaFiles || mediaFiles.length === 0) {
    content = (
      <div className="relative flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
        <Video className="h-6 w-6 text-white" />
      </div>
    );
  } else {
    const firstMedia = mediaFiles[0];
    const thumbnailFileId = firstMedia?.thumbnail?.id;
    const imageDirect = firstMedia?.file_type?.includes('image') ? firstMedia.id : null;
    const mediaIdToFetch = thumbnailFileId || imageDirect;

    if (mediaIdToFetch) {
      content = (
        <ThumbnailImage mediaFileId={mediaIdToFetch} title={publication.title} />
      );
    } else {
      const hasVideo = mediaFiles.some((f) => f && f.file_type && f.file_type.includes('video'));
      if (hasVideo) {
        content = (
          <div className="relative flex h-full w-full items-center justify-center bg-gray-900">
            <PlayCircle className="h-8 w-8 text-white opacity-80" />
          </div>
        );
      } else {
        content = <File className="h-6 w-6 text-gray-400" />;
      }
    }
  }

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      {content}
      {isLockedForMedia && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[1px]">
          <Loader2 className="mb-1 h-5 w-5 animate-spin text-white" />
          <span className="text-[8px] font-bold uppercase leading-none tracking-wider text-white">
            Subiendo
          </span>
        </div>
      )}
    </div>
  );
});

function ThumbnailImage({ mediaFileId, title }: { mediaFileId: number; title?: string }) {
  const { data, isLoading } = usePresignedUrl(mediaFileId, { mediaType: 'image' });

  if (isLoading || !data?.preview_url) {
    return (
      <div className="h-full w-full bg-gray-200 animate-pulse" />
    );
  }

  return (
    <img
      src={data.preview_url}
      className="h-full w-full object-cover"
      alt={title || 'Thumbnail'}
      loading="lazy"
      decoding="async"
    />
  );
}

export default PublicationThumbnail;
