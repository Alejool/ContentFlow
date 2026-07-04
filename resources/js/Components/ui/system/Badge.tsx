/**
 * Badge — compact status/label token sharing the system's tone + appearance.
 *
 * Same colour vocabulary as Button (`tone` × `appearance`) so a "danger" badge
 * and a "danger" button read as the same intent. Supports icon slots and a
 * leading status dot.
 */
import { cn } from '@/lib/common/utils';
import type { HTMLAttributes } from 'react';
import { renderIcon } from './Icon';
import { radius as radiusTokens } from './tokens';
import { toneClasses } from './tone';
import type { Appearance, IconLike, Radius, Tone } from './types';

export interface BadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'className'> {
  tone?: Tone;
  appearance?: Extract<Appearance, 'solid' | 'soft' | 'outline'>;
  size?: 'sm' | 'md' | 'lg';
  radius?: Radius;
  leftIcon?: IconLike;
  rightIcon?: IconLike;
  /** Show a leading status dot in the tone colour. */
  dot?: boolean;
  className?: string;
}

const badgeSize = {
  sm: 'h-5 px-1.5 text-xs gap-1',
  md: 'h-6 px-2 text-xs gap-1',
  lg: 'h-7 px-2.5 text-sm gap-1.5',
};

const badgeIcon = { sm: 'h-3 w-3', md: 'h-3.5 w-3.5', lg: 'h-4 w-4' } as const;

export function Badge({
  tone = 'primary',
  appearance = 'soft',
  size = 'md',
  radius = 'full',
  leftIcon,
  rightIcon,
  dot = false,
  children,
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium',
        badgeSize[size],
        radiusTokens[radius],
        toneClasses(tone, appearance),
        'cursor-default select-none',
        className,
      )}
      {...props}
    >
      {dot && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-70" />}
      {renderIcon(leftIcon, badgeIcon[size])}
      {children}
      {renderIcon(rightIcon, badgeIcon[size])}
    </span>
  );
}
