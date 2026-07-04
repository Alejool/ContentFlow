/**
 * tone.ts — semantic color (tone) × visual weight (appearance) class maps.
 *
 * The two axes are orthogonal: `tone` decides the hue (primary, danger…),
 * `appearance` decides the treatment (solid, soft, outline, ghost, link).
 * Everything references `@theme` color tokens, so a rebrand — changing the
 * primary scale in app.css — recolors every component automatically.
 */
import type { Appearance, FieldStatus, Tone } from './types';

/** Base hue slug per tone (matches the `@theme` color scales). */
const toneScale: Record<Tone, string> = {
  primary: 'primary',
  secondary: 'secondary',
  neutral: 'neutral',
  success: 'success',
  warning: 'warning',
  danger: 'error',
  info: 'info',
};

/** Focus-ring color per tone. */
const toneRing: Record<Tone, string> = {
  primary: 'focus-visible:ring-primary-500',
  secondary: 'focus-visible:ring-secondary-500',
  neutral: 'focus-visible:ring-neutral-500',
  success: 'focus-visible:ring-success-500',
  warning: 'focus-visible:ring-warning-500',
  danger: 'focus-visible:ring-error-500',
  info: 'focus-visible:ring-info-500',
};

/**
 * Full class string for a tone+appearance combination.
 * Kept explicit (no runtime string interpolation of Tailwind classes) so the
 * JIT compiler can see every utility.
 */
export function toneClasses(tone: Tone, appearance: Appearance): string {
  return `${TONE_APPEARANCE[appearance][tone]} ${toneRing[tone]}`;
}

const TONE_APPEARANCE: Record<Appearance, Record<Tone, string>> = {
  solid: {
    primary: 'bg-primary-600 text-white hover:bg-primary-700',
    secondary: 'bg-secondary-600 text-neutral-900 hover:bg-secondary-700',
    neutral: 'bg-neutral-800 text-white hover:bg-neutral-900 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-neutral-300',
    success: 'bg-success-600 text-white hover:bg-success-700',
    warning: 'bg-warning-600 text-white hover:bg-warning-700',
    danger: 'bg-error-600 text-white hover:bg-error-700',
    info: 'bg-info-600 text-white hover:bg-info-700',
  },
  soft: {
    primary: 'bg-primary-100 text-primary-700 hover:bg-primary-200 dark:bg-primary-900/30 dark:text-primary-300',
    secondary: 'bg-secondary-100 text-secondary-800 hover:bg-secondary-200 dark:bg-secondary-900/30 dark:text-secondary-200',
    neutral: 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200',
    success: 'bg-success-100 text-success-700 hover:bg-success-200 dark:bg-success-900/30 dark:text-success-300',
    warning: 'bg-warning-100 text-warning-700 hover:bg-warning-200 dark:bg-warning-900/30 dark:text-warning-300',
    danger: 'bg-error-100 text-error-700 hover:bg-error-200 dark:bg-error-900/30 dark:text-error-300',
    info: 'bg-info-100 text-info-700 hover:bg-info-200 dark:bg-info-900/30 dark:text-info-300',
  },
  outline: {
    primary: 'border border-primary-300 text-primary-700 hover:bg-primary-50 dark:border-primary-700 dark:text-primary-300 dark:hover:bg-primary-900/20',
    secondary: 'border border-secondary-300 text-secondary-800 hover:bg-secondary-50 dark:border-secondary-700 dark:text-secondary-200',
    neutral: 'border border-neutral-300 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800',
    success: 'border border-success-300 text-success-700 hover:bg-success-50 dark:border-success-700 dark:text-success-300',
    warning: 'border border-warning-300 text-warning-700 hover:bg-warning-50 dark:border-warning-700 dark:text-warning-300',
    danger: 'border border-error-300 text-error-700 hover:bg-error-50 dark:border-error-700 dark:text-error-300',
    info: 'border border-info-300 text-info-700 hover:bg-info-50 dark:border-info-700 dark:text-info-300',
  },
  ghost: {
    primary: 'text-primary-700 hover:bg-primary-100 dark:text-primary-300 dark:hover:bg-primary-900/30',
    secondary: 'text-secondary-800 hover:bg-secondary-100 dark:text-secondary-200 dark:hover:bg-secondary-900/30',
    neutral: 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800',
    success: 'text-success-700 hover:bg-success-100 dark:text-success-300 dark:hover:bg-success-900/30',
    warning: 'text-warning-700 hover:bg-warning-100 dark:text-warning-300 dark:hover:bg-warning-900/30',
    danger: 'text-error-700 hover:bg-error-100 dark:text-error-300 dark:hover:bg-error-900/30',
    info: 'text-info-700 hover:bg-info-100 dark:text-info-300 dark:hover:bg-info-900/30',
  },
  link: {
    primary: 'text-primary-600 underline-offset-4 hover:underline dark:text-primary-400',
    secondary: 'text-secondary-700 underline-offset-4 hover:underline dark:text-secondary-300',
    neutral: 'text-neutral-700 underline-offset-4 hover:underline dark:text-neutral-300',
    success: 'text-success-600 underline-offset-4 hover:underline dark:text-success-400',
    warning: 'text-warning-600 underline-offset-4 hover:underline dark:text-warning-400',
    danger: 'text-error-600 underline-offset-4 hover:underline dark:text-error-400',
    info: 'text-info-600 underline-offset-4 hover:underline dark:text-info-400',
  },
};

/** Border + focus-ring treatment for a form field per validation status. */
export const fieldStatus: Record<FieldStatus, string> = {
  default:
    'border border-neutral-300 focus:border-primary-500 focus:ring-primary-500 dark:border-neutral-700',
  error: 'border border-error-500 focus:border-error-500 focus:ring-error-500',
  success: 'border border-success-500 focus:border-success-500 focus:ring-success-500',
};

export { toneScale };
