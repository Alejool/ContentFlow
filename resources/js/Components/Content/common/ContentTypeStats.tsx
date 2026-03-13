import { CONTENT_TYPES } from "@/constants/contentTypes";
import { BarChart3, Circle, FileText, Images, TrendingUp, Video } from "lucide-react";
import { memo, useMemo } from "react";

interface ContentTypeStatsProps {
  publications: any[];
  className?: string;
}

// Configuración visual local
const CONTENT_TYPE_DISPLAY = {
  post: {
    label: 'Post',
    icon: 'FileText',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  reel: {
    label: 'Reel',
    icon: 'Video',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    borderColor: 'border-purple-200 dark:border-purple-800',
  },
  story: {
    label: 'Story',
    icon: 'Circle',
    color: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
    borderColor: 'border-pink-200 dark:border-pink-800',
  },
  carousel: {
    label: 'Carousel',
    icon: 'Images',
    color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
    borderColor: 'border-indigo-200 dark:border-indigo-800',
  },
  poll: {
    label: 'Encuesta',
    icon: 'BarChart3',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    borderColor: 'border-green-200 dark:border-green-800',
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

const ContentTypeStats = memo(({ publications, className = '' }: ContentTypeStatsProps) => {
  const stats = useMemo(() => {
    const typeCount = {
      [CONTENT_TYPES.POST]: 0,
      [CONTENT_TYPES.REEL]: 0,
      [CONTENT_TYPES.STORY]: 0,
      [CONTENT_TYPES.CAROUSEL]: 0,
      [CONTENT_TYPES.POLL]: 0,
    };

    publications.forEach(pub => {
      const type = detectContentType(pub.platform_settings, pub.media_files);
      if (typeCount.hasOwnProperty(type)) {
        typeCount[type as keyof typeof typeCount]++;
      }
    });

    const total = publications.length;
    
    return Object.entries(typeCount)
      .map(([type, count]) => ({
        type: type as keyof typeof CONTENT_TYPES,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        display: CONTENT_TYPE_DISPLAY[type as keyof typeof CONTENT_TYPE_DISPLAY] || CONTENT_TYPE_DISPLAY.post
      }))
      .filter(stat => stat.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [publications]);

  if (stats.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        <h3 className="font-semibold text-gray-900 dark:text-white">Tipos de Contenido</h3>
      </div>
      
      <div className="space-y-3">
        {stats.map(({ type, count, percentage, display }) => {
          const IconComponent = iconMap[display.icon as keyof typeof iconMap];
          return (
            <div key={type} className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className={`
                  inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold
                  ${display.color} ${display.borderColor} border
                `}>
                  {IconComponent && <IconComponent className="w-3 h-3" aria-label={display.label} />}
                  <span>{display.label}</span>
                </div>
                
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${display.color.replace('text-', 'bg-').replace('100', '500')}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2 ml-3">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {count}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ({percentage}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Total de publicaciones</span>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="font-semibold text-gray-900 dark:text-white">{publications.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

ContentTypeStats.displayName = 'ContentTypeStats';

export default ContentTypeStats;