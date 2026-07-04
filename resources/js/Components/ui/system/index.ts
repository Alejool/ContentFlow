/**
 * @/Components/ui/system — the Design System foundation.
 *
 * Import base primitives and the shared vocabulary from here:
 *
 *   import { Button, Input, Badge, type Tone, type Size } from '@/Components/ui/system';
 *
 * Every component in this folder speaks the same prop language (size, tone,
 * appearance, radius, disabled, loading, error, success, icons) and reads its
 * geometry/colour from the shared tokens, so a rebrand touches tokens only.
 */

// Foundation
export { createVariants } from './variants';
export type { VariantConfig, VariantProps } from './variants';
export { renderIcon } from './Icon';
export { FieldShell, fieldPadding } from './FieldShell';
export * from './tokens';
export { toneClasses, fieldStatus, toneScale } from './tone';
export type {
  Size,
  Radius,
  Tone,
  Appearance,
  FieldStatus,
  IconLike,
  BaseControlProps,
  WithIcons,
  FieldChromeProps,
} from './types';

// Base primitives
export { Button } from './Button';
export type { ButtonProps } from './Button';
export { Input } from './Input';
export type { InputProps } from './Input';
export { Textarea } from './Textarea';
export type { TextareaProps } from './Textarea';
export { Select } from './Select';
export type { SelectProps, SelectOption } from './Select';
export { Checkbox } from './Checkbox';
export type { CheckboxProps } from './Checkbox';
export { Badge } from './Badge';
export type { BadgeProps } from './Badge';
