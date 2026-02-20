/**
 * Visually Hidden Component
 * 
 * Hides content visually but keeps it accessible to screen readers
 * WCAG 1.3.1 - Info and Relationships (Level A)
 */

import React from 'react';

interface VisuallyHiddenProps {
  children: React.ReactNode;
  focusable?: boolean;
}

export const VisuallyHidden: React.FC<VisuallyHiddenProps> = ({ 
  children, 
  focusable = false 
}) => {
  return (
    <span className={focusable ? 'sr-only-focusable' : 'sr-only'}>
      {children}
    </span>
  );
};
