/**
 * tokens.ts — dimensional design tokens (sizes, radii, icon dimensions).
 *
 * Single source for every measurement in the system. Components never write
 * `h-10` or `text-sm` directly; they read from here so one edit re-sizes the
 * whole library consistently. Colors live in `@/lib/common/designTokens` and
 * the `@theme` block of app.css; this file owns geometry only.
 */
import type { Radius, Size } from './types';

/** Control height + horizontal padding + text size per size step. */
export const controlSize: Record<Size, string> = {
  xs: 'h-7 px-2 text-xs',
  sm: 'h-8 px-2.5 text-sm',
  md: 'h-10 px-3 text-sm',
  lg: 'h-11 px-4 text-base',
  xl: 'h-12 px-5 text-base',
};

/** Square icon-only control (no horizontal text padding). */
export const iconControlSize: Record<Size, string> = {
  xs: 'h-7 w-7',
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-11 w-11',
  xl: 'h-12 w-12',
};

/** Icon glyph size that pairs with each control size. */
export const iconSize: Record<Size, string> = {
  xs: 'h-3.5 w-3.5',
  sm: 'h-4 w-4',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
  xl: 'h-5 w-5',
};

/** Gap between icon and content per size. */
export const controlGap: Record<Size, string> = {
  xs: 'gap-1',
  sm: 'gap-1.5',
  md: 'gap-2',
  lg: 'gap-2',
  xl: 'gap-2.5',
};

/** Label text size per control size. */
export const labelSize: Record<Size, string> = {
  xs: 'text-xs',
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-sm',
  xl: 'text-base',
};

/** Corner rounding. */
export const radius: Record<Radius, string> = {
  none: 'rounded-none',
  sm: 'rounded',
  md: 'rounded-lg',
  lg: 'rounded-xl',
  xl: 'rounded-2xl',
  '2xl': 'rounded-3xl',
  full: 'rounded-full',
};

/** Padding for multi-line controls (textarea) — height comes from `rows`. */
export const textareaSize: Record<Size, string> = {
  xs: 'px-2 py-1.5 text-xs',
  sm: 'px-2.5 py-2 text-sm',
  md: 'px-3 py-2.5 text-sm',
  lg: 'px-4 py-3 text-base',
  xl: 'px-5 py-3.5 text-base',
};

/** Shared focus-ring + disabled treatment for every control. */
export const controlBase =
  'inline-flex items-center justify-center font-medium transition-colors ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ' +
  'disabled:pointer-events-none disabled:opacity-50';

/** Shared surface + focus treatment for text-entry fields. */
export const fieldBase =
  'w-full bg-white text-neutral-900 placeholder:text-neutral-400 ' +
  'transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ' +
  'disabled:cursor-not-allowed disabled:opacity-50 ' +
  'dark:bg-neutral-900 dark:text-neutral-100';
