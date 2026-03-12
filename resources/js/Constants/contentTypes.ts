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

/**
 * Configuración de tipos de contenido con sus plataformas compatibles
 */
export const CONTENT_TYPE_CONFIG = {
  post: {
    platforms: ['instagram', 'twitter', 'facebook', 'linkedin', 'youtube', 'pinterest', 'tiktok'],
    media: { required: false, min_count: 0, max_count: 10, types: ['image', 'video'] },
  },
  reel: {
    platforms: REEL_COMPATIBLE_PLATFORMS,
    media: { required: true, min_count: 1, max_count: 1, types: ['video'] },
  },
  story: {
    platforms: ['instagram', 'facebook', 'twitter', 'linkedin', 'youtube', 'pinterest', 'tiktok'],
    media: { required: true, min_count: 1, max_count: 1, types: ['image', 'video'] },
  },
  carousel: {
    platforms: ['instagram', 'facebook', 'linkedin', 'twitter', 'youtube', 'pinterest', 'tiktok'],
    media: { required: true, min_count: 2, max_count: 10, types: ['image', 'video'] },
  },
  poll: {
    platforms: ['twitter', 'facebook', 'instagram', 'linkedin', 'youtube', 'pinterest', 'tiktok'],
    media: { required: false, min_count: 0, max_count: 4, types: ['image', 'video'] },
  },
} as const;

export type ContentType = keyof typeof CONTENT_TYPE_CONFIG;
export type Platform = typeof REEL_COMPATIBLE_PLATFORMS[number] | 'facebook' | 'twitter' | 'linkedin' | 'pinterest';