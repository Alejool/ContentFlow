import { KeyboardEvent } from 'react';

/**
 * Hook para manejar clicks con teclado en elementos no interactivos
 * Cumple con WCAG 2.1 - permite activación con Enter y Space
 */
export const useKeyboardClick = (onClick: () => void) => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return {
    role: 'button' as const,
    tabIndex: 0,
    onClick,
    onKeyDown: handleKeyDown,
  };
};
