/**
 * platformMeta.ts — the single source of truth for social platforms.
 *
 * Colors, label and icon for every supported network in one place. Components
 * stop hand-mapping platform → color/icon and call these helpers instead.
 *
 * Colors re-use `designTokens.PLATFORM_COLORS` (which owns the palette); this
 * file adds the canonical label + brand icon on top.
 */
import type { IconType } from 'react-icons';
import {
  FaFacebook,
  FaGoogle,
  FaInstagram,
  FaLinkedin,
  FaPinterest,
  FaTiktok,
  FaXTwitter,
  FaYoutube,
} from 'react-icons/fa6';
import { PLATFORM_COLORS, PRIMARY_UI } from './designTokens';

export type Platform =
  | 'facebook'
  | 'instagram'
  | 'twitter'
  | 'linkedin'
  | 'youtube'
  | 'tiktok'
  | 'pinterest'
  | 'google';

export interface PlatformColors {
  iconBg: string;
  iconColor: string;
  badge: string;
}

export interface PlatformMeta {
  platform: Platform;
  label: string;
  Icon: IconType;
  colors: PlatformColors;
}

/** Label + brand icon per platform. Colors come from PLATFORM_COLORS. */
const PLATFORM_LABEL_ICON: Record<Platform, { label: string; Icon: IconType }> = {
  facebook: { label: 'Facebook', Icon: FaFacebook },
  instagram: { label: 'Instagram', Icon: FaInstagram },
  twitter: { label: 'X (Twitter)', Icon: FaXTwitter },
  linkedin: { label: 'LinkedIn', Icon: FaLinkedin },
  youtube: { label: 'YouTube', Icon: FaYoutube },
  tiktok: { label: 'TikTok', Icon: FaTiktok },
  pinterest: { label: 'Pinterest', Icon: FaPinterest },
  google: { label: 'Google', Icon: FaGoogle },
};

/** `x` is an alias for twitter. */
function normalize(platform?: string): Platform | null {
  const key = (platform ?? '').toLowerCase();
  const alias = key === 'x' ? 'twitter' : key;
  return alias in PLATFORM_LABEL_ICON ? (alias as Platform) : null;
}

/** Full metadata bundle for a platform (colors + label + icon), or null. */
export function getPlatformMeta(platform?: string): PlatformMeta | null {
  const key = normalize(platform);
  if (!key) return null;
  return {
    platform: key,
    ...PLATFORM_LABEL_ICON[key],
    colors: PLATFORM_COLORS[key] as PlatformColors,
  };
}

/** Platform color set; falls back to neutral primary for unknown platforms. */
export function getPlatformColors(platform?: string): PlatformColors {
  const key = normalize(platform);
  return key ? (PLATFORM_COLORS[key] as PlatformColors) : (PRIMARY_UI.default as PlatformColors);
}

/** Human-readable platform label (capitalised fallback for unknowns). */
export function getPlatformLabel(platform?: string): string {
  const key = normalize(platform);
  if (key) return PLATFORM_LABEL_ICON[key].label;
  const raw = platform ?? '';
  return raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : '';
}

/** Platform brand icon, or null for unknown platforms. */
export function getPlatformIcon(platform?: string): IconType | null {
  const key = normalize(platform);
  return key ? PLATFORM_LABEL_ICON[key].Icon : null;
}
