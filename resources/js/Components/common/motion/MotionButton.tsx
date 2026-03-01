import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { LazyMotion, domAnimation, m, HTMLMotionProps } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { hoverVariants, actionVariants, getVariant, getTransition } from '@/config/animationVariants';

/**
 * Variant types for hover effects
 */
export type HoverVariant = 'subtle' | 'lift' | 'scale' | 'glow';

/**
 * Variant types for action feedback
 */
export type ActionFeedback = 'press' | 'success' | 'error' | 'loading';

/**
 * Props for MotionButton component
 */
export interface MotionButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag'> {
  /**
   * Hover effect variant
   * @default 'subtle'
   */
  variant?: HoverVariant;
  
  /**
   * Action feedback variant
   * @default 'press'
   */
  actionFeedback?: ActionFeedback;
  
  /**
   * Whether to respect reduced motion preferences
   * @default true
   */
  respectReducedMotion?: boolean;
  
  /**
   * Additional Framer Motion props
   */
  motionProps?: Omit<HTMLMotionProps<'button'>, 'ref'>;
}

/**
 * MotionButton Component
 * 
 * A button component wrapped with Framer Motion for microinteractions.
 * Provides hover effects and action feedback with reduced motion support.
 * 
 * Requirements: 3.1, 3.3, 3.5
 * 
 * @example
 * ```tsx
 * <MotionButton variant="lift" actionFeedback="press">
 *   Click me
 * </MotionButton>
 * ```
 */
export const MotionButton = forwardRef<HTMLButtonElement, MotionButtonProps>(
  (
    {
      variant = 'subtle',
      actionFeedback = 'press',
      respectReducedMotion = true,
      motionProps,
      children,
      className,
      ...buttonProps
    },
    ref
  ) => {
    const { prefersReducedMotion } = useReducedMotion();
    const shouldReduceMotion = respectReducedMotion && prefersReducedMotion;

    // Get hover variants based on selected variant
    const selectedHoverVariant = hoverVariants[variant];
    
    // Get action feedback variants
    const selectedActionVariant = actionVariants[actionFeedback];

    // Determine which hover state to use
    const hoverState = shouldReduceMotion ? 'hoverReduced' : 'hover';
    const tapState = shouldReduceMotion ? 'tapReduced' : 'tap';

    return (
      <motion.button
        ref={ref}
        className={className}
        initial="initial"
        whileHover={getVariant(selectedHoverVariant, hoverState, shouldReduceMotion)}
        whileTap={
          actionFeedback === 'press' 
            ? getVariant(selectedActionVariant, tapState, shouldReduceMotion)
            : undefined
        }
        transition={getTransition(
          selectedHoverVariant.transition || { duration: 0.15 },
          shouldReduceMotion
        )}
        {...buttonProps}
        {...motionProps}
      >
        {children}
      </motion.button>
    );
  }
);

MotionButton.displayName = 'MotionButton';

export default MotionButton;
