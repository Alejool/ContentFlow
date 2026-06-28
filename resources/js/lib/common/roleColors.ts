/**
 * roleColors.ts — Dynamic role color system.
 *
 * Converts a role's hex color (from the database) into a complete set of
 * Tailwind-compatible inline styles. Because Tailwind cannot build arbitrary
 * hex-based classes at runtime, we use CSS custom properties injected as
 * inline styles and a small set of computed RGBA values.
 *
 * Usage:
 *   const styles = buildRoleColorStyles('#6366f1');
 *   <div style={styles.iconBg} className="flex items-center...">
 *
 * If no hex is provided the helper falls back to the primary palette tokens
 * so the UI stays coherent even for roles with no custom color.
 */

export interface RoleColorStyles {
  /** Inline style for icon container background (rgba, 10% opacity) */
  iconBg: React.CSSProperties;
  /** Inline style for badge background (rgba, 15% opacity) + text (full color) */
  badge: React.CSSProperties;
  /** Inline style for left/top accent border (full color) */
  accent: React.CSSProperties;
  /** Inline style for subtle card background tint (rgba, 5% opacity) */
  cardBg: React.CSSProperties;
  /** CSS hex string for text color */
  textColor: string;
  /** CSS hex string for the full primary color */
  hex: string;
}

/** Hex → { r, g, b } */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return null;
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

/** WCAG relative luminance */
function relativeLuminance(r: number, g: number, b: number): number {
  const sRGB = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * sRGB[0]! + 0.7152 * sRGB[1]! + 0.0722 * sRGB[2]!;
}

/** Returns '#ffffff' or '#111827' based on WCAG contrast against the bg */
function contrastText(hex: string): '#ffffff' | '#111827' {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#111827';
  const lum = relativeLuminance(rgb.r, rgb.g, rgb.b);
  // contrast ratio with white vs. dark — pick whichever is ≥ 4.5:1
  const contrastWhite = (1 + 0.05) / (lum + 0.05);
  return contrastWhite >= 4.5 ? '#ffffff' : '#111827';
}

const FALLBACK_HEX = '#6366f1'; // primary-500

export function buildRoleColorStyles(colorHex: string | null | undefined): RoleColorStyles {
  const hex = colorHex ?? FALLBACK_HEX;
  const rgb = hexToRgb(hex) ?? hexToRgb(FALLBACK_HEX)!;
  const { r, g, b } = rgb;

  return {
    hex,
    textColor: hex,
    iconBg: { backgroundColor: `rgba(${r},${g},${b},0.12)` },
    badge:  { backgroundColor: `rgba(${r},${g},${b},0.14)`, color: hex },
    accent: { borderColor: hex, backgroundColor: hex },
    cardBg: { backgroundColor: `rgba(${r},${g},${b},0.05)` },
  };
}

/** Text color (white or very dark) that is readable on top of the role's hex bg */
export function getRoleTextOnColor(colorHex: string | null | undefined): string {
  return contrastText(colorHex ?? FALLBACK_HEX);
}
