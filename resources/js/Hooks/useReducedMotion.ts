import { useState, useEffect } from 'react';

/**
 * Hook to detect user's reduced motion preference
 * Respects the prefers-reduced-motion media query
 * 
 * @returns Object containing:
 *   - prefersReducedMotion: boolean indicating if reduced motion is preferred
 *   - shouldAnimate: boolean indicating if animations should be enabled (inverse of prefersReducedMotion)
 *   - getAnimationDuration: function to get animation duration based on preference
 * 
 * @example
 * const { prefersReducedMotion, shouldAnimate, getAnimationDuration } = useReducedMotion();
 * 
 * // Use shouldAnimate to conditionally enable animations
 * <motion.div animate={shouldAnimate ? { x: 100 } : {}} />
 * 
 * // Use getAnimationDuration to adjust timing
 * const duration = getAnimationDuration(300); // Returns 0 if reduced motion is preferred
 */
export function useReducedMotion() {
  // Initialize with media query check
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    // Check if window is available (SSR safety)
    if (typeof window === 'undefined') {
      return false;
    }
    
    // Check if matchMedia is supported
    if (!window.matchMedia) {
      return false;
    }
    
    // Query the prefers-reduced-motion media query
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    return mediaQuery.matches;
  });

  useEffect(() => {
    // Skip if not in browser environment
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    // Create media query
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    // Update state when preference changes
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setPrefersReducedMotion(event.matches);
    };

    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches);

    // Listen for changes
    // Use addEventListener if available (modern browsers)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    } 
    // Fallback to addListener for older browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      
      return () => {
        mediaQuery.removeListener(handleChange);
      };
    }
  }, []);

  /**
   * Get animation duration based on reduced motion preference
   * Returns 0 if reduced motion is preferred, otherwise returns the default duration
   * 
   * @param defaultDuration - The default animation duration in milliseconds
   * @returns The adjusted duration (0 if reduced motion is preferred)
   */
  const getAnimationDuration = (defaultDuration: number): number => {
    return prefersReducedMotion ? 0 : defaultDuration;
  };

  return {
    prefersReducedMotion,
    shouldAnimate: !prefersReducedMotion,
    getAnimationDuration,
  };
}

export default useReducedMotion;
