import React, { useEffect, useState, useCallback } from 'react';
import { Tooltip } from './Tooltip';
import { useOnboardingStore } from '@/stores/onboardingStore';
import type { TooltipDefinition } from '@/types/onboarding';

export interface TooltipManagerProps {
  tooltips: TooltipDefinition[];
  enabled?: boolean;
}

/**
 * TooltipManager Component
 * 
 * Manages the display and lifecycle of contextual tooltips throughout the application.
 * Enforces mutual exclusion (only one tooltip visible at a time) and handles
 * dismissed tooltip persistence.
 * 
 * Requirements: 2.5, 2.6, 2.7
 */
export const TooltipManager: React.FC<TooltipManagerProps> = ({
  tooltips,
  enabled = true,
}) => {
  const { dismissedTooltips, dismissTooltip } = useOnboardingStore();
  const [activeTooltipId, setActiveTooltipId] = useState<string | null>(null);
  const [tooltipElements, setTooltipElements] = useState<Map<string, HTMLElement>>(
    new Map()
  );

  // Find and cache target elements for tooltips
  useEffect(() => {
    if (!enabled) return;

    const elements = new Map<string, HTMLElement>();
    
    tooltips.forEach((tooltip) => {
      // Skip dismissed tooltips (Requirement 2.5)
      if (dismissedTooltips.includes(tooltip.id)) {
        return;
      }

      const element = document.querySelector(tooltip.targetSelector) as HTMLElement;
      if (element) {
        elements.set(tooltip.id, element);
      }
    });

    setTooltipElements(elements);

    // Re-run when DOM changes (for dynamic content)
    const observer = new MutationObserver(() => {
      const updatedElements = new Map<string, HTMLElement>();
      
      tooltips.forEach((tooltip) => {
        if (dismissedTooltips.includes(tooltip.id)) {
          return;
        }

        const element = document.querySelector(tooltip.targetSelector) as HTMLElement;
        if (element) {
          updatedElements.set(tooltip.id, element);
        }
      });

      setTooltipElements(updatedElements);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [tooltips, dismissedTooltips, enabled]);

  // Handle tooltip open/close with mutual exclusion (Requirement 2.6)
  const handleTooltipOpenChange = useCallback(
    (tooltipId: string, isOpen: boolean) => {
      if (isOpen) {
        // Enforce mutual exclusion: close any other open tooltip
        setActiveTooltipId(tooltipId);
      } else {
        // Only clear if this tooltip was the active one
        setActiveTooltipId((current) => (current === tooltipId ? null : current));
      }
    },
    []
  );

  // Handle tooltip dismissal (Requirement 2.4, 2.7)
  const handleDismiss = useCallback(
    async (tooltipId: string) => {
      setActiveTooltipId(null);
      // Persist dismissal to backend (Requirement 2.7)
      await dismissTooltip(tooltipId);
    },
    [dismissTooltip]
  );

  if (!enabled) {
    return null;
  }

  return (
    <>
      {tooltips.map((tooltip) => {
        // Don't render dismissed tooltips (Requirement 2.5)
        if (dismissedTooltips.includes(tooltip.id)) {
          return null;
        }

        const targetElement = tooltipElements.get(tooltip.id);
        if (!targetElement) {
          return null;
        }

        // Enforce mutual exclusion: only the active tooltip can be open
        const isOpen = activeTooltipId === tooltip.id;

        return (
          <Tooltip
            key={tooltip.id}
            id={tooltip.id}
            content={tooltip.content}
            targetElement={targetElement}
            position={tooltip.position}
            dismissible={tooltip.dismissible}
            onDismiss={handleDismiss}
            isOpen={isOpen}
            onOpenChange={(open) => handleTooltipOpenChange(tooltip.id, open)}
          />
        );
      })}
    </>
  );
};
