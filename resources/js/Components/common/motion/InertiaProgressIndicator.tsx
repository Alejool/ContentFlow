import React, { useEffect, useState } from 'react';
import { LazyMotion, domAnimation, m, AnimatePresence } from 'framer-motion';
import { router } from '@inertiajs/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * Enhanced Inertia progress indicator with smooth transitions
 * Respects user's reduced motion preferences
 * 
 * Requirements: 4.1, 4.2
 */

export interface InertiaProgressIndicatorProps {
  color?: string;
  height?: number;
  showSpinner?: boolean;
  respectReducedMotion?: boolean;
}

/**
 * InertiaProgressIndicator component provides visual feedback during page navigation
 * 
 * @param color - Progress bar color (default: '#ad421e')
 * @param height - Progress bar height in pixels (default: 3)
 * @param showSpinner - Whether to show a loading spinner (default: false)
 * @param respectReducedMotion - Whether to respect reduced motion preferences (default: true)
 * 
 * @example
 * // Add to app.tsx or layout component
 * <InertiaProgressIndicator color="#ad421e" />
 */
export const InertiaProgressIndicator: React.FC<InertiaProgressIndicatorProps> = ({
  color = '#ad421e',
  height = 3,
  showSpinner = false,
  respectReducedMotion = true,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { prefersReducedMotion } = useReducedMotion();
  
  // Determine if animations should be disabled
  const shouldReduceMotion = respectReducedMotion && prefersReducedMotion;

  useEffect(() => {
    // Listen to Inertia navigation events
    const startHandler = () => {
      setIsLoading(true);
      setProgress(0);
      
      // Simulate progress with smooth increments
      const interval = setInterval(() => {
        setProgress((prev) => {
          // Slow down as we approach 90%
          if (prev >= 90) return prev;
          if (prev >= 70) return prev + 1;
          if (prev >= 50) return prev + 2;
          return prev + 5;
        });
      }, shouldReduceMotion ? 0 : 100); // Instant updates if reduced motion
      
      // Store interval ID for cleanup
      (window as any).__inertiaProgressInterval = interval;
    };

    const finishHandler = () => {
      // Clear the interval
      if ((window as any).__inertiaProgressInterval) {
        clearInterval((window as any).__inertiaProgressInterval);
        delete (window as any).__inertiaProgressInterval;
      }
      
      // Complete the progress bar
      setProgress(100);
      
      // Hide after a short delay
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, shouldReduceMotion ? 0 : 300);
    };

    const errorHandler = () => {
      // Clear the interval
      if ((window as any).__inertiaProgressInterval) {
        clearInterval((window as any).__inertiaProgressInterval);
        delete (window as any).__inertiaProgressInterval;
      }
      
      // Hide immediately on error
      setIsLoading(false);
      setProgress(0);
    };

    // Register event listeners - router.on() returns cleanup functions
    const removeStartListener = router.on('start', startHandler);
    const removeFinishListener = router.on('finish', finishHandler);
    const removeErrorListener = router.on('error', errorHandler);
    const removeExceptionListener = router.on('exception', errorHandler);

    // Cleanup
    return () => {
      removeStartListener();
      removeFinishListener();
      removeErrorListener();
      removeExceptionListener();
      
      // Clear any remaining interval
      if ((window as any).__inertiaProgressInterval) {
        clearInterval((window as any).__inertiaProgressInterval);
        delete (window as any).__inertiaProgressInterval;
      }
    };
  }, [shouldReduceMotion]);

  // Animation variants for the progress bar
  const progressBarVariants = {
    initial: { scaleX: 0, opacity: 0 },
    animate: { 
      scaleX: progress / 100, 
      opacity: 1,
      transition: shouldReduceMotion 
        ? { duration: 0 }
        : { duration: 0.3, ease: 'easeOut' }
    },
    exit: { 
      opacity: 0,
      transition: shouldReduceMotion 
        ? { duration: 0 }
        : { duration: 0.2 }
    },
  };

  const spinnerVariants = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: shouldReduceMotion 
        ? { duration: 0 }
        : { duration: 0.2 }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8,
      transition: shouldReduceMotion 
        ? { duration: 0 }
        : { duration: 0.2 }
    },
  };

  return (
    <LazyMotion features={domAnimation}>
      {/* Progress bar */}
      <AnimatePresence>
        {isLoading && (
          <m.div
            variants={progressBarVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              height: `${height}px`,
              backgroundColor: color,
              transformOrigin: 'left',
              zIndex: 9999,
            }}
          />
        )}
      </AnimatePresence>

      {/* Optional spinner */}
      {showSpinner && (
        <AnimatePresence>
          {isLoading && (
            <m.div
              variants={spinnerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
                zIndex: 9999,
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  border: `3px solid ${color}`,
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: shouldReduceMotion ? 'none' : 'spin 0.8s linear infinite',
                }}
              />
            </m.div>
          )}
        </AnimatePresence>
      )}

      {/* Spinner animation keyframes */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </LazyMotion>
  );
};

export default InertiaProgressIndicator;
