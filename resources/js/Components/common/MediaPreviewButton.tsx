import { usePresignedUrl } from '@/Hooks/Upload/usePresignedUrl';
import { useFileAccess } from '@/Hooks/Upload/useSignedUrls';
import { Loader2, Video } from 'lucide-react';
import { useState, useEffect } from 'react';

interface MediaFile {
  id?: number;
  file_path: string;
  file_type?: string;
  [key: string]: any;
}

interface MediaPreviewButtonProps {
  mediaFiles: MediaFile[];
  title?: string;
  onPreview: (
    media: {
      url: string;
      type: 'image' | 'video';
      title?: string;
    }[],
    initialIndex: number,
  ) => void;
  className?: string;
  height?: string;
}

export default function MediaPreviewButton({
  mediaFiles,
  title,
  onPreview,
  className = '',
  height = 'h-64',
}: MediaPreviewButtonProps) {
  const [imageError, setImageError] = useState(false);

  if (!mediaFiles || mediaFiles.length === 0) return null;

  const firstMedia = mediaFiles[0]!;

  return (
    <PreviewThumbnail
      mediaFile={firstMedia}
      title={title}
      onPreview={onPreview}
      mediaFiles={mediaFiles}
      className={className}
      height={height}
    />
  );
}

function PreviewThumbnail({
  mediaFile,
  title,
  onPreview,
  mediaFiles,
  className,
  height,
}: {
  mediaFile: MediaFile;
  title?: string;
  onPreview: any;
  mediaFiles: MediaFile[];
  className: string;
  height: string;
}) {
  const [imageError, setImageError] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<Record<number, string>>({});
  const isVideo = mediaFile.file_type?.includes('video');
  const mediaId = mediaFile.id;
  const { data, isLoading } = usePresignedUrl(mediaId, { mediaType: isVideo ? 'video' : 'image' });
  const { getAccessUrl } = useFileAccess();

  const mediaUrl = data?.preview_url;

  // Pre-load all media URLs on component mount
  useEffect(() => {
    const loadMediaUrls = async () => {
      const urls: Record<number, string> = {};

      for (const m of mediaFiles) {
        if (m.id) {
          try {
            const result = await getAccessUrl(m.id);
            urls[m.id] = typeof result === 'string' ? result : (result as any)?.url ?? '';
          } catch (error) {
            console.error(`Failed to fetch URL for media ${m.id}:`, error);
          }
        }
      }

      setMediaUrls(urls);
    };

    if (mediaFiles.some((m) => m.id)) {
      loadMediaUrls();
    }
  }, [mediaFiles, getAccessUrl]);

  const handleClick = async () => {
    const mediaForLightbox = mediaFiles.map((m) => {
      // For files without IDs, use legacy paths (backward compatibility)
      if (!m.id) {
        return {
          url: m.file_path.startsWith('http') ? m.file_path : `/storage/${m.file_path}`,
          type: (m.file_type?.includes('video') ? 'video' : 'image') as 'image' | 'video',
          ...(title && { title }),
        };
      }

      // For files with IDs, use pre-loaded signed URLs
      return {
        url: mediaUrls[m.id] || '',
        type: (m.file_type?.includes('video') ? 'video' : 'image') as 'image' | 'video',
        ...(title && { title }),
      };
    });

    onPreview(mediaForLightbox, 0);
  };

  return (
    <button
      onClick={handleClick}
      className={`group relative w-full cursor-zoom-in overflow-hidden rounded-lg bg-gray-100 transition-all hover:shadow-lg dark:bg-theme-bg-secondary ${height} ${className}`}
    >
      {isLoading ? (
        <div className="h-full w-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
          <Loader2 className="h-6 w-6 animate-spin text-gray-600" />
        </div>
      ) : isVideo ? (
        mediaUrl && !imageError ? (
          <>
            <video
              src={mediaUrl}
              className="h-full w-full object-cover"
              muted
              loop
              playsInline
              onError={() => setImageError(true)}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/30">
              <div className="rounded-full bg-white/90 p-4 shadow-lg backdrop-blur-sm dark:bg-gray-900/90">
                <Video className="h-8 w-8 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-200 dark:bg-gray-700">
            <div className="text-center">
              <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-gray-300 text-gray-500 dark:bg-gray-600">
                <Video className="h-8 w-8" />
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Video no disponible</span>
            </div>
          </div>
        )
      ) : !imageError && mediaUrl ? (
        <>
          <img
            src={mediaUrl}
            alt={title || 'Media preview'}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
          <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/5" />
        </>
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gray-200 dark:bg-gray-700">
          <div className="text-center">
            <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-gray-300 text-gray-500 dark:bg-gray-600">
              <Video className="h-8 w-8" />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Imagen no disponible</span>
          </div>
        </div>
      )}

      {/* Media count badge */}
      {mediaFiles.length > 1 && (
        <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
          +{mediaFiles.length - 1} más
        </div>
      )}
    </button>
  );
}
