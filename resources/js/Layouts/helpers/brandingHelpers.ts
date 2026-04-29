/**
 * Branding Helpers
 *
 * Pure DOM-manipulation utilities for white-label customisation.
 * Kept outside the React component tree so they can be tested independently.
 */

import { cssPropertiesManager } from '@/Utils/CSSCustomPropertiesManager';

// ---------------------------------------------------------------------------
// Primary color
// ---------------------------------------------------------------------------

/**
 * Resolves and applies the primary brand colour.
 *
 * Priority order (highest → lowest):
 *  1. User's personal theme colour (`themeColor`)
 *  2. Workspace white-label colour (`brandingColor`)
 *  3. Application default (`'orange'`)
 */
export function applyBrandingColor(
  themeColor: string | undefined,
  brandingColor: string | undefined,
): void {
  const color = themeColor ?? brandingColor ?? 'orange';
  cssPropertiesManager.applyPrimaryColor(color);
}

// ---------------------------------------------------------------------------
// Favicon
// ---------------------------------------------------------------------------

/**
 * Updates all `<link rel="*icon">` elements in `<head>` to the given URL.
 * Appends a cache-busting timestamp so the browser always fetches the latest.
 *
 * Falls back to `/favicon.ico` when no custom URL is provided.
 */
export function applyFavicon(faviconUrl: string | undefined): void {
  const url = faviconUrl ?? '/favicon.ico';
  const timestamp = Date.now();
  const newHref = `${url}?v=${timestamp}`;

  const existingLinks = document.querySelectorAll<HTMLLinkElement>("link[rel*='icon']");

  if (existingLinks.length > 0) {
    existingLinks.forEach((link) => {
      link.href = newHref;
    });
  } else {
    const link = document.createElement('link');
    link.rel = 'icon';
    link.href = newHref;
    document.head.appendChild(link);
  }
}
