import { BarChart3, Circle, FileText, Images, Video } from 'lucide-react';
import { memo } from "react";

interface ContentTypeBadgeProps {
  contentType?: string;
  platformSettings?: any;
  mediaFiles?: any[];
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showDescription?: boolean;
  className?: string;
}

// Configuración visual local para evitar problemas de importación
const CONTENT_TYPE_DISPLAY = {
  post: {
    label: 'Post',
    icon: 'FileText',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    borderColor: 'border-blue-200 dark:border-blue-800',
    description: 'Publicación estándar'
  },
  reel: {
    label: 'Reel',
    icon: 'Video',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    borderColor: 'border-purple-200 dark:border-purple-800',
    description: 'Video corto vertical'
  },
  story: {
    label: 'Story',
    icon: 'Circle',
    color: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
    borderColor: 'border-pink-200 dark:border-pink-800',
    description: 'Historia temporal'
  },
  carousel: {
    label: 'Carousel',
    icon: 'Images',
    color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
    borderColor: 'border-indigo-200 dark:border-indigo-800',
    description: 'Múltiples imágenes'
  },
  poll: {
    label: 'Encuesta',
    icon: 'BarChart3',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    borderColor: 'border-green-200 dark:border-green-800',
    description: 'Encuesta interactiva'
  }
} as const;

// Mapeo de strings a componentes de iconos
const iconMap = {
  FileText,
  Video,
  Circle,
  Images,
  BarChart3
};

// Función local para detectar tipo de contenido
const detectContentType = (platformSettings: any, mediaFiles: any[]): string => {
  if (!platformSettings || typeof platformSettings !== 'object') {
    return 'post';
  }

  // Buscar en las configuraciones de plataforma
  for (const [platform, settings] of Object.entries(platformSettings)) {
    if (settings && typeof settings === 'object' && (settings as any).type) {
      const type = (settings as any).type;
      if (type === 'poll') return 'poll';
      if (type === 'reel' || type === 'short') return 'reel';
      if (type === 'story') return 'story';
      if (type === 'carousel') return 'carousel';
    }
  }

  // Detectar basado en archivos multimedia
  if (mediaFiles && Array.isArray(mediaFiles)) {
    const videoCount = mediaFiles.filter(f => f?.file_type?.includes('video')).length;
    const imageCount = mediaFiles.filter(f => f?.file_type?.includes('image')).length;
    
    if (videoCount === 1 && imageCount === 0) {
      // Un solo video podría ser reel
      const video = mediaFiles.find(f => f?.file_type?.includes('video'));
      if (video?.metadata?.duration && video.metadata.duration <= 90) {
        return 'reel';
      }
    }
    
    if (imageCount > 1) {
      return 'carousel';
    }
  }

  return 'post';
};

const ContentTypeBadge = memo(({
  contentType,
  platformSettings,
  mediaFiles,
  size = 'md',
  showIcon = true,
  showDescription = false,
  className = ''
}: ContentTypeBadgeProps) => {
  // Detectar tipo de contenido si no se proporciona
  const detectedType = contentType || detectContentType(platformSettings, mediaFiles);
  const display = CONTENT_TYPE_DISPLAY[detectedType as keyof typeof CONTENT_TYPE_DISPLAY] || CONTENT_TYPE_DISPLAY.post;

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[9px] gap-1',
    md: 'px-2 py-1 text-[10px] gap-1.5',
    lg: 'px-3 py-1.5 text-xs gap-2'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4'
  };

  const IconComponent = iconMap[display.icon as keyof typeof iconMap];

  return (
    <div className={`
      inline-flex items-center rounded-full font-bold uppercase tracking-wider
      border ${display.borderColor} ${display.color} ${sizeClasses[size]}
      ${className}
    `}>
      {showIcon && IconComponent && (
        <IconComponent className={iconSizes[size]} aria-label={display.label} />
      )}
      <span>{display.label}</span>
      {showDescription && size === 'lg' && (
        <span className="font-normal normal-case text-[10px] opacity-75 ml-1">
          {display.description}
        </span>
      )}
    </div>
  );
});

ContentTypeBadge.displayName = 'ContentTypeBadge';

export default ContentTypeBadge;