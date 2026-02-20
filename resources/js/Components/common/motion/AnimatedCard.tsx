/**
 * Animated Card Component
 * 
 * Card with hover animations and accessibility features
 */

import React, { HTMLAttributes } from 'react';
import { motion, MotionProps } from 'framer-motion';
import { prefersReducedMotion } from '@/Utils/themeTransition';

interface AnimatedCardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  clickable?: boolean;
  elevated?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  hoverable = false,
  clickable = false,
  elevated = false,
  padding = 'md',
  className = '',
  ...props
}) => {
  const reducedMotion = prefersReducedMotion();

  const motionProps: MotionProps = reducedMotion
    ? {}
    : {
        whileHover: hoverable || clickable ? { y: -4, scale: 1.01 } : undefined,
        whileTap: clickable ? { scale: 0.99 } : undefined,
        transition: { duration: 0.2, ease: 'easeInOut' },
      };

  const baseClasses = `
    bg-theme-bg-secondary
    border border-theme-border-default
    rounded-lg
    transition-all duration-fast
    ${elevated ? 'shadow-lg' : 'shadow-sm'}
    ${hoverable || clickable ? 'hover:shadow-md hover:border-theme-border-strong' : ''}
    ${clickable ? 'cursor-pointer' : ''}
    ${paddingStyles[padding]}
    ${className}
  `;

  const Component = clickable ? motion.button : motion.div;

  return (
    <Component
      className={baseClasses}
      {...motionProps}
      {...(props as any)}
    >
      {children}
    </Component>
  );
};
