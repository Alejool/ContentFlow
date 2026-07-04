/**
 * Button — the canonical action primitive of the Design System.
 *
 * Unified API shared with every other control: `size`, `tone`, `appearance`,
 * `radius`, `disabled`, `loading`, plus first-class icon slots
 * (`leftIcon` / `rightIcon` / `iconOnly`). No bespoke `buttonStyle` axis —
 * colour (`tone`) and weight (`appearance`) are cleanly separated.
 */
import { cn } from '@/lib/common/utils';
import { Loader2 } from 'lucide-react';
import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { renderIcon } from './Icon';
import {
  controlBase,
  controlGap,
  controlSize,
  iconControlSize,
  iconSize,
  radius as radiusTokens,
} from './tokens';
import { toneClasses } from './tone';
import type { Appearance, BaseControlProps, IconLike, Size, Tone } from './types';

export interface ButtonProps
  extends BaseControlProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  tone?: Tone;
  appearance?: Appearance;
  leftIcon?: IconLike;
  rightIcon?: IconLike;
  /** Render a square, content-less button around a single icon. */
  iconOnly?: IconLike;
}

const DEFAULTS = { size: 'md' as Size, tone: 'primary' as Tone, appearance: 'solid' as Appearance };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      type = 'button',
      size = DEFAULTS.size,
      tone = DEFAULTS.tone,
      appearance = DEFAULTS.appearance,
      radius = 'md',
      disabled = false,
      loading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      iconOnly,
      className,
      ...props
    },
    ref,
  ) => {
    const isIconOnly = Boolean(iconOnly);
    const showSpinner = loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(
          controlBase,
          controlGap[size],
          isIconOnly ? iconControlSize[size] : controlSize[size],
          radiusTokens[radius],
          toneClasses(tone, appearance),
          fullWidth && 'w-full',
          className,
        )}
        {...props}
      >
        {showSpinner && <Loader2 className={cn('animate-spin', iconSize[size])} aria-hidden />}
        {!showSpinner && isIconOnly && renderIcon(iconOnly, iconSize[size])}
        {!isIconOnly && (
          <>
            {!showSpinner && renderIcon(leftIcon, iconSize[size])}
            {children}
            {!showSpinner && renderIcon(rightIcon, iconSize[size])}
          </>
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';
