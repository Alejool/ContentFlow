/**
 * Icon.tsx — normalizes the many ways a caller can pass an icon.
 *
 * Every DS component accepts `IconLike`, which is either a Lucide-style
 * component (`Search`) or an already-rendered node (`<Search />`, an <img>…).
 * `renderIcon` turns either form into a correctly-sized element so components
 * never branch on the icon shape themselves.
 */
import { cn } from '@/lib/common/utils';
import { cloneElement, createElement, isValidElement } from 'react';
import type { ComponentType, ReactElement } from 'react';
import type { IconLike } from './types';

export function renderIcon(icon: IconLike | undefined, sizeClass: string) {
  if (!icon) return null;

  if (isValidElement(icon)) {
    const node = icon as ReactElement<{ className?: string }>;
    return cloneElement(node, {
      className: cn(node.props?.className, 'shrink-0', sizeClass),
    });
  }

  // Component reference (e.g. a Lucide icon).
  const IconComponent = icon as ComponentType<{ className?: string }>;
  return createElement(IconComponent, {
    className: cn('shrink-0', sizeClass),
    'aria-hidden': true,
  } as Record<string, unknown>);
}
