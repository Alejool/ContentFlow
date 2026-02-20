/**
 * Live Region Component
 * 
 * Announces dynamic content changes to screen readers
 * WCAG 4.1.3 - Status Messages (Level AA)
 */

import React, { useEffect, useRef } from 'react';

interface LiveRegionProps {
  message: string;
  politeness?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  relevant?: 'additions' | 'removals' | 'text' | 'all';
  clearOnUnmount?: boolean;
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  message,
  politeness = 'polite',
  atomic = true,
  relevant = 'additions text',
  clearOnUnmount = true,
}) => {
  const regionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (clearOnUnmount && regionRef.current) {
        regionRef.current.textContent = '';
      }
    };
  }, [clearOnUnmount]);

  return (
    <div
      ref={regionRef}
      role="status"
      aria-live={politeness}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className="sr-only"
    >
      {message}
    </div>
  );
};

/**
 * Hook for announcing messages to screen readers
 */
export function useAnnounce() {
  const announce = (
    message: string,
    options: {
      politeness?: 'polite' | 'assertive';
      timeout?: number;
    } = {}
  ) => {
    const { politeness = 'polite', timeout = 0 } = options;

    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('role', 'status');
    liveRegion.setAttribute('aria-live', politeness);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    
    document.body.appendChild(liveRegion);

    // Delay to ensure screen reader picks up the change
    setTimeout(() => {
      liveRegion.textContent = message;

      // Clean up after announcement
      setTimeout(() => {
        document.body.removeChild(liveRegion);
      }, timeout || 1000);
    }, 100);
  };

  return { announce };
}
