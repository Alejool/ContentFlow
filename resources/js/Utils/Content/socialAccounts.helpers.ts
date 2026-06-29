import type { ContentType } from '@/Constants/Content/contentTypes';
import { CONTENT_TYPE_CONFIG } from '@/Constants/Content/contentTypes';

/**
 * Check if a platform supports a content type.
 * Single source of truth — reads from CONTENT_TYPE_CONFIG.
 * Does NOT check media-size / duration limits; only type support.
 */
export function isPlatformCompatible(platform: string, contentType?: ContentType): boolean {
  if (!contentType) return true;
  const rules = CONTENT_TYPE_CONFIG[contentType];
  return (rules.platforms as readonly string[]).includes(platform.toLowerCase());
}

/**
 * Return every content type a platform supports.
 * Inverse of isPlatformCompatible — used to filter type selectors.
 */
export function getSupportedTypesForPlatform(platform: string): ContentType[] {
  const lower = platform.toLowerCase();
  return (Object.keys(CONTENT_TYPE_CONFIG) as ContentType[]).filter((type) =>
    (CONTENT_TYPE_CONFIG[type].platforms as readonly string[]).includes(lower),
  );
}

/**
 * Filter a list of social accounts to those compatible with a content type.
 * Use this everywhere accounts need to be narrowed by type — modal, create, edit.
 */
export function getCompatibleAccounts<T extends { platform: string }>(
  contentType: ContentType | undefined | null,
  accounts: T[],
): T[] {
  if (!contentType) return accounts;
  return accounts.filter((acc) => isPlatformCompatible(acc.platform, contentType));
}
