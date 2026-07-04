/**
 * types.ts — the shared prop vocabulary of the Design System.
 *
 * Every base component speaks these same words. A consumer who learns them
 * once (size, tone, appearance, radius, disabled, loading, error, success,
 * icons) can drive any component predictably.
 */
import type { ComponentType, ReactNode } from 'react';

/** Dimensional scale — one ladder for the whole system. */
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/** Corner rounding — maps to the Tailwind radius scale. */
export type Radius = 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

/** Semantic color intent. Never raw hex — always a tone. */
export type Tone =
  | 'primary'
  | 'secondary'
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

/** Visual weight of a control, orthogonal to its tone. */
export type Appearance = 'solid' | 'soft' | 'outline' | 'ghost' | 'link';

/** Validation state shared by every form control. */
export type FieldStatus = 'default' | 'error' | 'success';

/** A Lucide-style icon component or a rendered node. */
export type IconLike = ComponentType<{ className?: string }> | ReactNode;

/** Props every interactive component accepts. */
export interface BaseControlProps {
  size?: Size;
  radius?: Radius;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}

/** Icon slots shared by every component where icons make sense. */
export interface WithIcons {
  /** Icon before the content. */
  leftIcon?: IconLike;
  /** Icon after the content. */
  rightIcon?: IconLike;
}

/** Field chrome shared by Input, Textarea, Select and every form control. */
export interface FieldChromeProps {
  label?: ReactNode | undefined;
  hint?: ReactNode | undefined;
  error?: string | undefined;
  success?: string | undefined;
  required?: boolean | undefined;
  /** Content rendered inside the control, before the value (e.g. `$`, `@`). */
  prefix?: ReactNode | undefined;
  /** Content rendered inside the control, after the value. */
  suffix?: ReactNode | undefined;
}
