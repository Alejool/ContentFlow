import { Publication } from '@/types/Publication';
import { hasMedia, isProcessing, prepareMediaForPreview } from '@/Utils/publicationHelpers';
import { Calendar, Clock, Image as ImageIcon, Video } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface PublicationThumbnailCardProps {
  publication: Publication;
  mediaUrl?: string;
  isVideo?: boolean;
  mediaCount?: number;
  size?: 'sm' | 'md' | 'lg' | 'responsive' | 'card';
  onClick?: () => void;
  onPreviewMedia?: (
    media: {
      url: string;
      type: 'image' | 'video';
      title?: string;
    }[],
    initialIndex?: number,
  ) => void;
  onViewDetails?: () => void;
  className?: string;
}

const sizeClasses = {
  sm: 'h-16 w-16',
  md: 'h-20 w-20',
  lg: 'h-32 w-32',
  responsive: 'h-48 w-full md:h-20 md:w-20',
  card: 'h-40 w-full',
};

export default function PublicationThumbnailCard({
  publication,
  mediaUrl,
  isVideo = false,
  mediaCount = 0,
  size = 'md',
  onClick,
  onPreviewMedia,
  onViewDetails,
  className = '',
}: PublicationThumbnailCardProps) {
  const { t } = useTranslation();
  const [imageError, setImageError] = useState(false);
  const itemIsProcessing = isProcessing(publication);
  const isUserEvent = (publication as Publication & { type?: string }).type === 'user_event';
  const itemHasMedia = hasMedia(publication);

  const handleClick = (e: React.MouseEvent) => {
    // NO hacer stopPropagation aquí para que el click funcione en tablas

    // Si hay un onClick personalizado, usarlo
    if (onClick) {
      e.stopPropagation();
      onClick();
      return;
    }

    // PRIORIDAD 1: Si hay media, abrir preview de media
    if (onPreviewMedia && itemHasMedia && !itemIsProcessing) {
      e.stopPropagation();
      const allMedia = prepareMediaForPreview(publication);
      onPreviewMedia(allMedia, 0);
      return;
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`relative flex-shrink-0 overflow-hidden rounded-lg border-2 border-gray-200 bg-gray-100 shadow-sm transition-all hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:border-neutral-700 dark:bg-neutral-800 ${sizeClasses[size]} ${className} cursor-pointer`}
    >
      <div className="relative h-full w-full">
        {/* User Event Icon */}
        {isUserEvent ? (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20">
            <Calendar className="h-10 w-10 text-primary-600 dark:text-primary-400" />
          </div>
        ) : itemIsProcessing ? (
          <div className="flex h-full w-full animate-pulse flex-col items-center justify-center bg-gray-100 dark:bg-gray-800">
            <div className="mb-2 flex items-center justify-center rounded-lg bg-blue-100 p-3 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <Clock className="h-6 w-6 animate-spin" />
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {t('common.processing')}...
            </span>
          </div>
        ) : isVideo && !imageError && mediaUrl ? (
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
            alt={publication.title || 'Media'}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-200 dark:bg-gray-700">
            <div className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gray-300 p-3 text-gray-500 dark:bg-gray-600">
                {isVideo ? <Video className="h-6 w-6" /> : <ImageIcon className="h-6 w-6" />}
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {isVideo ? t('common.videoTypes.video') : t('common.videoTypes.post')}
              </span>
            </div>
          </div>
        )}
        {!itemIsProcessing && isVideo && !isUserEvent && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 transition-colors group-hover:bg-black/20">
            <div className="rounded-full bg-white/90 p-2.5 shadow-lg backdrop-blur-sm dark:bg-gray-900/90">
              <Video className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        )}
      </div>

      {/* Media Count Badge */}
      {mediaCount > 1 && (
        <div className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-primary-600 text-[11px] font-bold text-white shadow-md dark:border-neutral-900">
          +{mediaCount - 1}
        </div>
      )}
    </button>
  );
}
