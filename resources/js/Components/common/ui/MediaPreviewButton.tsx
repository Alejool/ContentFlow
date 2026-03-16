import { Video } from 'lucide-react';
import { useState } from 'react';

interface MediaFile {
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

  const firstMedia = mediaFiles[0];
  const isVideo = firstMedia.file_type?.includes('video');
  const mediaUrl = firstMedia.file_path.startsWith('http')
    ? firstMedia.file_path
    : `/storage/${firstMedia.file_path}`;

  const handleClick = () => {
    const mediaForLightbox = mediaFiles.map((m) => ({
      url: m.file_path.startsWith('http') ? m.file_path : `/storage/${m.file_path}`,
      type: (m.file_type?.includes('video') ? 'video' : 'image') as 'image' | 'video',
      title: title,
    }));
    onPreview(mediaForLightbox, 0);
  };

  return (
    <button
      onClick={handleClick}
      className={`group relative w-full cursor-zoom-in overflow-hidden rounded-lg bg-gray-100 transition-all hover:shadow-lg dark:bg-neutral-900 ${height} ${className}`}
    >
      {isVideo ? (
        // Mostrar video real
        <video
          src={mediaUrl}
          className="h-full w-full object-cover"
          muted
          loop
          playsInline
          onError={() => setImageError(true)}
        />
      ) : !imageError && mediaUrl ? (
        // Mostrar imagen
        <img
          src={mediaUrl}
          alt={title || 'Media preview'}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={() => setImageError(true)}
        />
      ) : (
        // Fallback si hay error
        <div className="flex h-full w-full items-center justify-center bg-gray-200 dark:bg-gray-700">
          <div className="text-center">
            <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-gray-300 text-gray-500 dark:bg-gray-600">
              <Video className="h-8 w-8" />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {isVideo ? 'Video' : 'Imagen'} no disponible
            </span>
          </div>
        </div>
      )}

      {/* Video overlay indicator - solo para indicar que es clickeable */}
      {isVideo && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/30">
          <div className="rounded-full bg-white/90 p-4 shadow-lg backdrop-blur-sm dark:bg-gray-900/90">
            <Video className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          </div>
        </div>
      )}

      {/* Media count badge */}
      {mediaFiles.length > 1 && (
        <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
          +{mediaFiles.length - 1} más
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/5" />
    </button>
  );
}
