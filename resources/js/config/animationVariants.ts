import { Variants, Transition } from 'framer-motion';

/**
 * Animation variants configuration for Framer Motion
 * Provides consistent microinteractions across the application
 * All variants include reduced motion alternatives
 */

// Base transition configurations
const transitions = {
  fast: { duration: 0.15, ease: [0.4, 0, 0.2, 1] },
  normal: { duration: 0.25, ease: [0.4, 0, 0.2, 1] },
  slow: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
  spring: { type: 'spring' as const, stiffness: 300, damping: 30 },
  instant: { duration: 0 },
} as const;

// Hover animation variants
export const hoverVariants = {
  // Subtle hover effect with slight opacity change
  subtle: {
    initial: { opacity: 1 },
    hover: { opacity: 0.8 },
    hoverReduced: { opacity: 0.8 },
    transition: transitions.fast,
  } as Variants,

  // Lift effect with shadow and translation
  lift: {
    initial: { y: 0, boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' },
    hover: { 
      y: -4, 
      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    },
    hoverReduced: { 
      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    },
    transition: transitions.normal,
  } as Variants,

  // Scale effect
  scale: {
    initial: { scale: 1 },
    hover: { scale: 1.05 },
    hoverReduced: { scale: 1.02 },
    transition: transitions.fast,
  } as Variants,

  // Glow effect with brightness increase
  glow: {
    initial: { filter: 'brightness(1)' },
    hover: { filter: 'brightness(1.1)' },
    hoverReduced: { filter: 'brightness(1.1)' },
    transition: transitions.normal,
  } as Variants,
};

// Focus animation variants
export const focusVariants = {
  // Ring focus indicator
  ring: {
    initial: { 
      boxShadow: '0 0 0 0px rgba(255, 109, 31, 0)',
      outline: 'none',
    },
    focus: { 
      boxShadow: '0 0 0 2px rgba(255, 109, 31, 0.4)',
      outline: '2px solid rgba(255, 109, 31, 0.5)',
      outlineOffset: '2px',
    },
    focusReduced: { 
      boxShadow: '0 0 0 2px rgba(255, 109, 31, 0.4)',
      outline: '2px solid rgba(255, 109, 31, 0.5)',
      outlineOffset: '2px',
    },
    transition: transitions.fast,
  } as Variants,

  // Scale focus effect
  scaleFocus: {
    initial: { scale: 1 },
    focus: { scale: 1.02 },
    focusReduced: { scale: 1 },
    transition: transitions.fast,
  } as Variants,

  // Highlight focus effect with background
  highlight: {
    initial: { backgroundColor: 'transparent' },
    focus: { backgroundColor: 'rgba(255, 109, 31, 0.1)' },
    focusReduced: { backgroundColor: 'rgba(255, 109, 31, 0.1)' },
    transition: transitions.fast,
  } as Variants,
};

// Action feedback variants
export const actionVariants = {
  // Press/tap feedback
  press: {
    initial: { scale: 1 },
    tap: { scale: 0.95 },
    tapReduced: { scale: 0.98 },
    transition: transitions.fast,
  } as Variants,

  // Success feedback with scale and color
  success: {
    initial: { scale: 1, backgroundColor: 'transparent' },
    animate: { 
      scale: [1, 1.05, 1],
      backgroundColor: ['transparent', 'rgba(34, 197, 94, 0.1)', 'transparent'],
    },
    animateReduced: { 
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
    },
    transition: { duration: 0.5, ease: 'easeInOut' },
  } as Variants,

  // Error feedback with shake
  error: {
    initial: { x: 0, backgroundColor: 'transparent' },
    animate: { 
      x: [-10, 10, -10, 10, 0],
      backgroundColor: ['transparent', 'rgba(239, 68, 68, 0.1)', 'transparent'],
    },
    animateReduced: { 
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
    },
    transition: { duration: 0.4, ease: 'easeInOut' },
  } as Variants,

  // Loading feedback with pulse
  loading: {
    initial: { opacity: 1 },
    animate: { 
      opacity: [1, 0.5, 1],
    },
    animateReduced: { 
      opacity: 0.7,
    },
    transition: { 
      duration: 1.5, 
      repeat: Infinity, 
      ease: 'easeInOut',
    },
  } as Variants,
};

// Page transition variants
export const pageVariants = {
  // Fade in transition
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    animateReduced: { opacity: 1 },
    exitReduced: { opacity: 1 },
    transition: transitions.normal,
  } as Variants,

  // Slide in from right
  slideIn: {
    initial: { x: 20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -20, opacity: 0 },
    animateReduced: { opacity: 1 },
    exitReduced: { opacity: 1 },
    transition: transitions.normal,
  } as Variants,

  // Scale in transition
  scaleIn: {
    initial: { scale: 0.95, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.95, opacity: 0 },
    animateReduced: { opacity: 1 },
    exitReduced: { opacity: 1 },
    transition: transitions.normal,
  } as Variants,
};

/**
 * Helper function to get the appropriate variant based on reduced motion preference
 * @param variants - The variants object
 * @param state - The animation state (hover, focus, animate, etc.)
 * @param prefersReducedMotion - Whether reduced motion is preferred
 * @returns The appropriate variant for the state
 */
export function getVariant(
  variants: Variants,
  state: string,
  prefersReducedMotion: boolean
): any {
  if (prefersReducedMotion && `${state}Reduced` in variants) {
    return variants[`${state}Reduced`];
  }
  return variants[state];
}

/**
 * Helper function to get transition configuration based on reduced motion preference
 * @param transition - The transition configuration
 * @param prefersReducedMotion - Whether reduced motion is preferred
 * @returns The appropriate transition configuration
 */
export function getTransition(
  transition: Transition,
  prefersReducedMotion: boolean
): Transition {
  if (prefersReducedMotion) {
    return transitions.instant;
  }
  return transition;
}

// Export all variants as a single object for convenience
export const animationVariants = {
  hover: hoverVariants,
  focus: focusVariants,
  action: actionVariants,
  page: pageVariants,
};

export default animationVariants;
