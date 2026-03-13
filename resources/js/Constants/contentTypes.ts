/**
 * Constantes para tipos de contenido y plataformas compatibles
 */

export const CONTENT_TYPES = {
  POST: 'post',
  REEL: 'reel', 
  STORY: 'story',
  CAROUSEL: 'carousel',
  POLL: 'poll',
} as const;

/**
 * Plataformas compatibles con reels/shorts
 * IMPORTANTE: Esta debe ser la misma definición que en app/Constants/ContentTypes.php
 */
export const REEL_COMPATIBLE_PLATFORMS = ['instagram', 'tiktok', 'youtube', 'facebook'] as const;

// Tipos para la configuración de campos
export interface FieldConfig {
  required: boolean;
  label: string;
  placeholder?: string;
  maxLength?: number;
  minLength?: number;
}

export interface ContentTypeFieldsConfig {
  title?: FieldConfig;
  description?: FieldConfig;
  hashtags?: FieldConfig;
  goal?: FieldConfig;
  poll_options?: FieldConfig;
  poll_duration_hours?: FieldConfig;
}

/**
 * Configuración de tipos de contenido con sus plataformas compatibles y campos
 */
export const CONTENT_TYPE_CONFIG = {
  post: {
    platforms: ['instagram', 'twitter', 'facebook', 'linkedin', 'youtube', 'pinterest', 'tiktok'],
    media: { required: false, min_count: 0, max_count: 10, types: ['image', 'video'] },
    fields: {
      title: { required: true, label: 'publications.modal.add.title' },
      description: { required: true, label: 'publications.modal.add.description' },
      hashtags: { required: true, label: 'publications.modal.add.hashtags' },
      goal: { required: false, label: 'publications.modal.add.goal' },
    },
  },
  reel: {
    platforms: REEL_COMPATIBLE_PLATFORMS,
    media: { required: true, min_count: 1, max_count: 1, types: ['video'] },
    fields: {
      title: { required: true, label: 'publications.modal.add.title' },
      description: { required: true, label: 'publications.modal.add.description' },
      hashtags: { required: true, label: 'publications.modal.add.hashtags' },
      goal: { required: false, label: 'publications.modal.add.goal' },
    },
  },
  story: {
    platforms: ['instagram', 'facebook',  'youtube', 'pinterest'],
    media: { required: true, min_count: 1, max_count: 1, types: ['image', 'video'] },
    fields: {
      title: { required: true, label: 'publications.modal.add.title' },
      description: { required: false, label: 'publications.modal.add.description' },
      hashtags: { required: false, label: 'publications.modal.add.hashtags' },
      goal: { required: false, label: 'publications.modal.add.goal' },
    },
  },
  carousel: {
    platforms: ['instagram', 'facebook', 'twitter'],
    media: { required: true, min_count: 2, max_count: 10, types: ['image', 'video'] },
    fields: {
      title: { required: true, label: 'publications.modal.add.title' },
      description: { required: true, label: 'publications.modal.add.description' },
      hashtags: { required: true, label: 'publications.modal.add.hashtags' },
      goal: { required: false, label: 'publications.modal.add.goal' },
    },
  },
  poll: {
    platforms: ['twitter'],
    media: { required: false, min_count: 0, max_count: 4, types: ['image', 'video'] },
    fields: {
      title: { required: true, label: 'publications.modal.poll.question', placeholder: 'publications.modal.poll.questionPlaceholder' },
      description: { required: false, label: 'publications.modal.add.description' },
      hashtags: { required: false, label: 'publications.modal.add.hashtags' },
      goal: { required: false, label: 'publications.modal.add.goal' },
      poll_options: { required: true, label: 'publications.modal.poll.options' },
      poll_duration_hours: { required: true, label: 'publications.modal.poll.duration' },
    },
  },
} as const;

export type ContentType = keyof typeof CONTENT_TYPE_CONFIG;
export type Platform = typeof REEL_COMPATIBLE_PLATFORMS[number] | 'facebook' | 'twitter' | 'linkedin' | 'pinterest';

// Función helper para obtener la configuración de campos de un tipo de contenido
export const getFieldsConfig = (contentType: ContentType): ContentTypeFieldsConfig => {
  return CONTENT_TYPE_CONFIG[contentType]?.fields || {};
};

// Función helper para verificar si un campo es requerido
export const isFieldRequired = (contentType: ContentType, fieldName: keyof ContentTypeFieldsConfig): boolean => {
  const fieldsConfig = getFieldsConfig(contentType);
  return fieldsConfig[fieldName]?.required || false;
};

// Función helper para obtener el label de un campo
export const getFieldLabel = (contentType: ContentType, fieldName: keyof ContentTypeFieldsConfig): string => {
  const fieldsConfig = getFieldsConfig(contentType);
  return fieldsConfig[fieldName]?.label || '';
};

// Configuración visual para tipos de contenido
export const CONTENT_TYPE_DISPLAY = {
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

// Función helper para obtener la configuración visual de un tipo de contenido
export const getContentTypeDisplay = (contentType: ContentType) => {
  return CONTENT_TYPE_DISPLAY[contentType] || CONTENT_TYPE_DISPLAY.post;
};

// Función helper para detectar el tipo de contenido basado en la configuración de plataforma
export const detectContentType = (platformSettings: any, mediaFiles: any[]): ContentType => {
  if (!platformSettings || typeof platformSettings !== 'object') {
    return 'post';
  }

  // Primero intentar buscar directamente en el objeto
  if (platformSettings.type) {
    const type = platformSettings.type;
    if (type === 'poll') return 'poll';
    if (type === 'reel' || type === 'short') return 'reel';
    if (type === 'story') return 'story';
    if (type === 'carousel') return 'carousel';
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