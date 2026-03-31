import { CONTENT_TYPE_CONFIG, ContentType } from '@/Constants/contentTypes';

/**
 * Check if a platform is compatible with the selected content type
 * IMPORTANT: This only checks if the platform SUPPORTS the content type
 * NOT if the content meets the platform's limits (duration, file size, etc.)
 */
export function isPlatformCompatible(platform: string, contentType?: ContentType): boolean {
  if (!contentType) return true;
  const rules = CONTENT_TYPE_CONFIG[contentType];
  return (rules.platforms as readonly string[]).includes(platform.toLowerCase());
}
