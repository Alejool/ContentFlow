import { BarChart3, Circle, FileText, Images, Video } from 'lucide-react';
import { memo } from 'react';

interface SimpleContentTypeBadgeProps {
  contentType?: string;
  mediaFiles?: any[];
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SimpleContentTypeBadge = memo(
  ({ contentType, mediaFiles, size = 'md', className = '' }: SimpleContentTypeBadgeProps) => {
    // Mapeo de strings a componentes de iconos
    const iconMap = {
      FileText,
      Video,
      Circle,
      Images,
      BarChart3,
    };

    // Usar directamente el contentType, con fallback a detección por media
    let type = contentType || 'post';
    let iconName = 'FileText';
    let color = 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    let borderColor = 'border-blue-200 dark:border-blue-800';

    // Si no hay contentType explícito, intentar detectar por archivos multimedia
    if (!contentType && mediaFiles && Array.isArray(mediaFiles)) {
      const videoCount = mediaFiles.filter((f) => f?.file_type?.includes('video')).length;
      const imageCount = mediaFiles.filter((f) => f?.file_type?.includes('image')).length;

      if (videoCount === 1 && imageCount === 0) {
        // Un solo video podría ser reel
        const video = mediaFiles.find((f) => f?.file_type?.includes('video'));
        if (video?.metadata?.duration && video.metadata.duration <= 90) {
          type = 'reel';
        }
      } else if (imageCount > 1) {
        type = 'carousel';
      }
    }

    // Configurar según el tipo
    switch (type) {
      case 'poll':
        iconName = 'BarChart3';
        color = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
        borderColor = 'border-green-200 dark:border-green-800';
        break;
      case 'reel':
        iconName = 'Video';
        color = 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
        borderColor = 'border-purple-200 dark:border-purple-800';
        break;
      case 'story':
        iconName = 'Circle';
        color = 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400';
        borderColor = 'border-pink-200 dark:border-pink-800';
        break;
      case 'carousel':
        iconName = 'Images';
        color = 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400';
        borderColor = 'border-indigo-200 dark:border-indigo-800';
        break;
      default: // 'post'
        iconName = 'FileText';
        color = 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
        borderColor = 'border-blue-200 dark:border-blue-800';
        break;
    }

    const sizeClasses = {
      sm: 'px-1.5 py-0.5 text-[9px] gap-1',
      md: 'px-2 py-1 text-[10px] gap-1.5',
      lg: 'px-3 py-1.5 text-xs gap-2',
    };

    const iconSizes = {
      sm: 'w-3 h-3',
      md: 'w-3.5 h-3.5',
      lg: 'w-4 h-4',
    };

    const labels = {
      post: 'Post',
      reel: 'Reel',
      story: 'Story',
      carousel: 'Carousel',
      poll: 'Encuesta',
    };

    const IconComponent = iconMap[iconName as keyof typeof iconMap];

    return (
      <div
        className={`inline-flex items-center rounded-full border font-bold uppercase tracking-wider ${borderColor} ${color} ${sizeClasses[size]} ${className} `}
      >
        {IconComponent && (
          <IconComponent
            className={iconSizes[size]}
            aria-label={labels[type as keyof typeof labels]}
          />
        )}
        <span>{labels[type as keyof typeof labels]}</span>
      </div>
    );
  },
);

SimpleContentTypeBadge.displayName = 'SimpleContentTypeBadge';

export default SimpleContentTypeBadge;
