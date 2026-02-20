import React, { HTMLAttributes, forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { hoverVariants, getVariant, getTransition } from '@/config/animationVariants';

/**
 * Hover effect variants for cards
 */
export type CardHoverEffect = 'lift' | 'glow' | 'scale';

/**
 * Props for MotionCard component
 */
export interface MotionCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag'> {
  /**
   * Hover effect to apply
   * @default 'lift'
   */
  hoverEffect?: CardHoverEffect;
  
  /**
   * Whether to respect reduced motion preferences
   * @default true
   */
  respectReducedMotion?: boolean;
  
  /**
   * Additional Framer Motion props
   */
  motionProps?: Omit<HTMLMotionProps<'div'>, 'ref'>;
}

/**
 * MotionCard Component
 * 
 * A div component wrapped with Framer Motion for card microinteractions.
 * Provides hover effects (lift, glow, scale) with reduced motion support.
 * 
 * Requirements: 3.1, 3.5
 * 
 * @example
 * ```tsx
 * <MotionCard hoverEffect="lift" className="p-4 bg-white rounded-lg">
 *   <h3>Card Title</h3>
 *   <p>Card content</p>
 * </MotionCard>
 * ```
 */
export const MotionCard = forwardRef<HTMLDivElement, MotionCardProps>(
  (
    {
      hoverEffect = 'lift',
      respectReducedMotion = true,
      motionProps,
      children,
      className,
      ...divProps
    },
    ref
  ) => {
    const { prefersReducedMotion } = useReducedMotion();
    const shouldReduceMotion = respectReducedMotion && prefersReducedMotion;

    // Get hover variants based on selected effect
    const selectedHoverVariant = hoverVariants[hoverEffect];

    // Determine which hover state to use
    const hoverState = shouldReduceMotion ? 'hoverReduced' : 'hover';

    return (
      <motion.div
        ref={ref}
        className={className}
        initial="initial"
        whileHover={getVariant(selectedHoverVariant, hoverState, shouldReduceMotion)}
        transition={getTransition(
          selectedHoverVariant.transition || { duration: 0.25 },
          shouldReduceMotion
        )}
        {...divProps}
        {...motionProps}
      >
        {children}
      </motion.div>
    );
  }
);

MotionCard.displayName = 'MotionCard';

export default MotionCard;
