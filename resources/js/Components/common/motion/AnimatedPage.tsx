import React, { ReactNode } from 'react';
import { LazyMotion, domAnimation, m, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { pageVariants, getVariant, getTransition } from '@/config/animationVariants';

/**
 * AnimatedPage wrapper component for page transitions
 * Integrates with Inertia.js navigation system
 * Respects user's reduced motion preferences
 * 
 * Requirements: 4.1, 4.2, 4.4
 */

export type PageTransitionVariant = 'fade' | 'slide' | 'scale';

export interface AnimatedPageProps {
  children: ReactNode;
  variant?: PageTransitionVariant;
  duration?: number;
  respectReducedMotion?: boolean;
  pageKey?: string; // For Inertia.js integration
}

/**
 * AnimatedPage component wraps page content with Framer Motion transitions
 * 
 * @param children - Page content to animate
 * @param variant - Transition type: 'fade', 'slide', or 'scale' (default: 'fade')
 * @param duration - Animation duration in milliseconds (default: 300ms, within 300-500ms requirement)
 * @param respectReducedMotion - Whether to respect reduced motion preferences (default: true)
 * @param pageKey - Unique key for page transitions (typically from Inertia.js)
 * 
 * @example
 * <AnimatedPage variant="fade" pageKey={page.url}>
 *   <YourPageContent />
 * </AnimatedPage>
 */
export const AnimatedPage: React.FC<AnimatedPageProps> = ({
  children,
  variant = 'fade',
  duration = 300, // Default 300ms (within 300-500ms requirement for page transitions)
  respectReducedMotion = true,
  pageKey,
}) => {
  const { prefersReducedMotion } = useReducedMotion();
  
  // Determine if animations should be disabled
  const shouldReduceMotion = respectReducedMotion && prefersReducedMotion;
  
  // Select the appropriate variant based on the variant prop
  const variantMap = {
    fade: pageVariants.fadeIn,
    slide: pageVariants.slideIn,
    scale: pageVariants.scaleIn,
  };
  
  const selectedVariant = variantMap[variant] || pageVariants.fadeIn;
  
  // Get the appropriate animation states based on reduced motion preference
  const initial = shouldReduceMotion 
    ? getVariant(selectedVariant, 'animateReduced', true)
    : selectedVariant.initial;
    
  const animate = shouldReduceMotion
    ? getVariant(selectedVariant, 'animateReduced', true)
    : selectedVariant.animate;
    
  const exit = shouldReduceMotion
    ? getVariant(selectedVariant, 'exitReduced', true)
    : selectedVariant.exit;
  
  // Adjust transition duration based on reduced motion preference
  const transition = shouldReduceMotion
    ? { duration: 0 }
    : { 
        duration: duration / 1000, // Convert ms to seconds for Framer Motion
        ease: [0.4, 0, 0.2, 1], // easeInOut
      };

  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence mode="wait">
        <m.div
          key={pageKey}
          initial={initial}
          animate={animate}
          exit={exit}
          transition={transition}
          style={{ width: '100%', height: '100%' }}
        >
          {children}
        </m.div>
      </AnimatePresence>
    </LazyMotion>
  );
};

export default AnimatedPage;
