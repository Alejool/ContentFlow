import React, { AnchorHTMLAttributes, forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { hoverVariants, getVariant, getTransition } from '@/config/animationVariants';

/**
 * Hover effect variants for links
 */
export type LinkHoverEffect = 'subtle' | 'underline' | 'glow';

/**
 * Props for MotionLink component
 */
export interface MotionLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag'> {
  /**
   * Hover effect to apply
   * @default 'subtle'
   */
  hoverEffect?: LinkHoverEffect;
  
  /**
   * Whether to respect reduced motion preferences
   * @default true
   */
  respectReducedMotion?: boolean;
  
  /**
   * Additional Framer Motion props
   */
  motionProps?: Omit<HTMLMotionProps<'a'>, 'ref'>;
}

/**
 * MotionLink Component
 * 
 * An anchor component wrapped with Framer Motion for link microinteractions.
 * Provides hover effects (subtle, underline, glow) with reduced motion support.
 * 
 * Requirements: 3.1, 3.5
 * 
 * @example
 * ```tsx
 * <MotionLink href="/about" hoverEffect="subtle">
 *   About Us
 * </MotionLink>
 * ```
 */
export const MotionLink = forwardRef<HTMLAnchorElement, MotionLinkProps>(
  (
    {
      hoverEffect = 'subtle',
      respectReducedMotion = true,
      motionProps,
      children,
      className,
      ...anchorProps
    },
    ref
  ) => {
    const { prefersReducedMotion } = useReducedMotion();
    const shouldReduceMotion = respectReducedMotion && prefersReducedMotion;

    // Map link hover effects to available hover variants
    // 'underline' maps to 'subtle' with additional CSS for underline effect
    const variantMap: Record<LinkHoverEffect, keyof typeof hoverVariants> = {
      subtle: 'subtle',
      underline: 'subtle',
      glow: 'glow',
    };

    const selectedHoverVariant = hoverVariants[variantMap[hoverEffect]];

    // Determine which hover state to use
    const hoverState = shouldReduceMotion ? 'hoverReduced' : 'hover';

    // Add underline effect via className if needed
    const linkClassName = hoverEffect === 'underline' 
      ? `${className || ''} hover:underline`.trim()
      : className;

    return (
      <motion.a
        ref={ref}
        className={linkClassName}
        initial="initial"
        whileHover={getVariant(selectedHoverVariant, hoverState, shouldReduceMotion)}
        transition={getTransition(
          selectedHoverVariant.transition || { duration: 0.15 },
          shouldReduceMotion
        )}
        {...anchorProps}
        {...motionProps}
      >
        {children}
      </motion.a>
    );
  }
);

MotionLink.displayName = 'MotionLink';

export default MotionLink;
