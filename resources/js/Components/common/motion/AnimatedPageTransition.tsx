/**
 * Animated Page Transition Component
 * 
 * Smooth page transitions with Framer Motion
 */

import React from 'react';
import { LazyMotion, domAnimation, m, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/Hooks/useReducedMotion';

interface AnimatedPageTransitionProps {
  children: React.ReactNode;
  pageKey: string;
  variant?: 'fade' | 'slide' | 'scale';
}

export const AnimatedPageTransition: React.FC<AnimatedPageTransitionProps> = ({
  children,
  pageKey,
  variant = 'fade',
}) => {
  const reducedMotion = useReducedMotion();

  const variants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    slide: {
      initial: { opacity: 0, x: 20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -20 },
    },
    scale: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.95 },
    },
  };

  const selectedVariant = reducedMotion
    ? { initial: {}, animate: {}, exit: {} }
    : variants[variant];

  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence mode="wait">
        <m.div
          key={pageKey}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={selectedVariant}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
        >
          {children}
        </m.div>
      </AnimatePresence>
    </LazyMotion>
  );
};
