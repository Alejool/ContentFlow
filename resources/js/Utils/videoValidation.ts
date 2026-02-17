/**
 * Validación de formato de video para plataformas sociales
 * Verifica duración, resolución, aspect ratio y tipo de publicación
 */

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  aspectRatio: number;
  size: number;
  format: string;
}

export interface PlatformRequirements {
  name: string;
  short?: {
    maxDuration: number;
    minDuration?: number;
    aspectRatio: { min: number; max: number };
    resolution: { minWidth: number; minHeight: number };
  };
  video?: {
    maxDuration: number;
    minDuration?: number;
    aspectRatio?: { min: number; max: number };
    resolution?: { minWidth: number; minHeight: number };
  };
  reel?: {
    maxDuration: number;
    minDuration?: number;
    aspectRatio: { min: number; max: number };
    resolution: { minWidth: number; minHeight: number };
  };
}

export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  suggestedType?: string;
  meetsShortRequirements: boolean;
  meetsReelRequirements: boolean;
  meetsVideoRequirements: boolean;
}

// Requisitos de cada plataforma
export const PLATFORM_REQUIREMENTS: Record<string, PlatformRequirements> = {
  youtube: {
    name: 'YouTube',
    short: {
      maxDuration: 60,
      minDuration: 1,
      aspectRatio: { min: 0.5, max: 1.0 }, // Vertical: 9:16 a 1:1
      resolution: { minWidth: 720, minHeight: 1280 },
    },
    video: {
      maxDuration: 43200, // 12 horas
      minDuration: 1,
    },
  },
  facebook: {
    name: 'Facebook',
    reel: {
      maxDuration: 90,
      minDuration: 3,
      aspectRatio: { min: 0.5, max: 1.0 }, // Vertical
      resolution: { minWidth: 540, minHeight: 960 },
    },
    video: {
      maxDuration: 14400, // 4 horas
      minDuration: 1,
    },
  },
  instagram: {
    name: 'Instagram',
    reel: {
      maxDuration: 90,
      minDuration: 3,
      aspectRatio: { min: 0.5, max: 1.0 }, // Vertical: 9:16
      resolution: { minWidth: 720, minHeight: 1280 },
    },
    video: {
      maxDuration: 60,
      minDuration: 3,
    },
  },
  tiktok: {
    name: 'TikTok',
    video: {
      maxDuration: 600, // 10 minutos
      minDuration: 3,
      aspectRatio: { min: 0.5, max: 1.0 }, // Vertical
      resolution: { minWidth: 720, minHeight: 1280 },
    },
  },
};

/**
 * Obtiene los metadatos de un video
 */
export async function getVideoMetadata(file: File): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      const metadata: VideoMetadata = {
        duration: Math.floor(video.duration),
        width: video.videoWidth,
        height: video.videoHeight,
        aspectRatio: video.videoWidth / video.videoHeight,
        size: file.size,
        format: file.type,
      };
      
      URL.revokeObjectURL(video.src);
      resolve(metadata);
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('No se pudo cargar el video'));
    };
    
    video.src = URL.createObjectURL(file);
  });
}

/**
 * Valida si un video cumple con los requisitos de una plataforma y tipo específico
 */
export function validateVideoForPlatform(
  metadata: VideoMetadata,
  platform: string,
  type: string,
  t: (key: string, params?: any) => string
): ValidationResult {
  const requirements = PLATFORM_REQUIREMENTS[platform];
  
  if (!requirements) {
    return {
      isValid: false,
      warnings: [],
      errors: [t('videoValidation.platformNotSupported', { platform })],
      meetsShortRequirements: false,
      meetsReelRequirements: false,
      meetsVideoRequirements: false,
    };
  }

  const result: ValidationResult = {
    isValid: true,
    warnings: [],
    errors: [],
    meetsShortRequirements: false,
    meetsReelRequirements: false,
    meetsVideoRequirements: false,
  };

  // Validar según el tipo seleccionado
  if (type === 'short' && requirements.short) {
    validateAgainstRequirements(metadata, requirements.short, result, 'Short', t);
    result.meetsShortRequirements = result.isValid;
  } else if (type === 'reel' && requirements.reel) {
    validateAgainstRequirements(metadata, requirements.reel, result, 'Reel', t);
    result.meetsReelRequirements = result.isValid;
  } else if (type === 'video' && requirements.video) {
    validateAgainstRequirements(metadata, requirements.video, result, 'Video', t);
    result.meetsVideoRequirements = result.isValid;
  }

  // Verificar compatibilidad con otros tipos para sugerencias
  if (requirements.short) {
    const shortCheck = checkRequirements(metadata, requirements.short);
    result.meetsShortRequirements = shortCheck;
  }
  if (requirements.reel) {
    const reelCheck = checkRequirements(metadata, requirements.reel);
    result.meetsReelRequirements = reelCheck;
  }
  if (requirements.video) {
    const videoCheck = checkRequirements(metadata, requirements.video);
    result.meetsVideoRequirements = videoCheck;
  }

  // Sugerir tipo alternativo si el actual no es válido
  if (!result.isValid) {
    if (result.meetsShortRequirements) {
      result.suggestedType = 'short';
    } else if (result.meetsReelRequirements) {
      result.suggestedType = 'reel';
    } else if (result.meetsVideoRequirements) {
      result.suggestedType = 'video';
    }
  }

  return result;
}

/**
 * Valida metadatos contra requisitos específicos
 */
function validateAgainstRequirements(
  metadata: VideoMetadata,
  reqs: any,
  result: ValidationResult,
  typeName: string,
  t: (key: string, params?: any) => string
): void {
  // Validar duración
  if (reqs.maxDuration && metadata.duration > reqs.maxDuration) {
    result.isValid = false;
    result.errors.push(
      t('videoValidation.durationTooLong', {
        type: typeName,
        max: formatDuration(reqs.maxDuration),
        current: formatDuration(metadata.duration),
      })
    );
  }

  if (reqs.minDuration && metadata.duration < reqs.minDuration) {
    result.isValid = false;
    result.errors.push(
      t('videoValidation.durationTooShort', {
        type: typeName,
        min: formatDuration(reqs.minDuration),
        current: formatDuration(metadata.duration),
      })
    );
  }

  // Validar aspect ratio
  if (reqs.aspectRatio) {
    const { min, max } = reqs.aspectRatio;
    if (metadata.aspectRatio < min || metadata.aspectRatio > max) {
      result.isValid = false;
      result.errors.push(
        t('videoValidation.invalidAspectRatio', {
          type: typeName,
          expected: formatAspectRatio(min, max),
          current: formatAspectRatio(metadata.aspectRatio, metadata.aspectRatio),
        })
      );
    }
  }

  // Validar resolución
  if (reqs.resolution) {
    const { minWidth, minHeight } = reqs.resolution;
    if (metadata.width < minWidth || metadata.height < minHeight) {
      result.warnings.push(
        t('videoValidation.lowResolution', {
          type: typeName,
          min: `${minWidth}x${minHeight}`,
          current: `${metadata.width}x${metadata.height}`,
        })
      );
    }
  }
}

/**
 * Verifica si los metadatos cumplen con los requisitos (sin agregar errores)
 */
function checkRequirements(metadata: VideoMetadata, reqs: any): boolean {
  // Duración
  if (reqs.maxDuration && metadata.duration > reqs.maxDuration) return false;
  if (reqs.minDuration && metadata.duration < reqs.minDuration) return false;

  // Aspect ratio
  if (reqs.aspectRatio) {
    const { min, max } = reqs.aspectRatio;
    if (metadata.aspectRatio < min || metadata.aspectRatio > max) return false;
  }

  // Resolución (solo advertencia, no bloquea)
  return true;
}

/**
 * Formatea duración en segundos a formato legible
 */
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

/**
 * Formatea aspect ratio a formato legible
 */
function formatAspectRatio(min: number, max: number): string {
  if (min === max) {
    // Convertir a ratio común
    if (Math.abs(min - 0.5625) < 0.01) return '9:16';
    if (Math.abs(min - 1.0) < 0.01) return '1:1';
    if (Math.abs(min - 1.7778) < 0.01) return '16:9';
    return min.toFixed(2);
  }
  return `${formatAspectRatio(min, min)} - ${formatAspectRatio(max, max)}`;
}

/**
 * Determina automáticamente el mejor tipo de publicación para un video
 */
export function suggestPublicationType(
  metadata: VideoMetadata,
  platform: string
): string | null {
  const requirements = PLATFORM_REQUIREMENTS[platform];
  if (!requirements) return null;

  // Prioridad: Short/Reel > Video
  if (requirements.short && checkRequirements(metadata, requirements.short)) {
    return 'short';
  }
  if (requirements.reel && checkRequirements(metadata, requirements.reel)) {
    return 'reel';
  }
  if (requirements.video && checkRequirements(metadata, requirements.video)) {
    return 'video';
  }

  return null;
}
