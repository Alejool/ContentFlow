import { useEffect, useCallback, useRef } from 'react';

/**
 * Hook for implementing keyboard shortcuts and navigation
 * Handles Enter, Escape, Arrow keys, Tab, and Shift+Tab
 * 
 * Requirements: 5.2, 5.3
 * 
 * @example
 * const { handleKeyDown, registerElement } = useKeyboardNavigation({
 *   onEnter: () => console.log('Enter pressed'),
 *   onEscape: () => console.log('Escape pressed'),
 *   onArrowUp: () => console.log('Arrow up pressed'),
 * });
 * 
 * // Use in component
 * <div onKeyDown={handleKeyDown} ref={registerElement}>
 *   Content
 * </div>
 */

interface UseKeyboardNavigationOptions {
  onEnter?: () => void;
  onEscape?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onTab?: () => void;
  onShiftTab?: () => void;
  enabled?: boolean;
}

interface UseKeyboardNavigationReturn {
  handleKeyDown: (event: React.KeyboardEvent | KeyboardEvent) => void;
  registerElement: (element: HTMLElement | null) => void;
}

export function useKeyboardNavigation(
  options: UseKeyboardNavigationOptions = {}
): UseKeyboardNavigationReturn {
  const {
    onEnter,
    onEscape,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onTab,
    onShiftTab,
    enabled = true,
  } = options;

  const elementRef = useRef<HTMLElement | null>(null);

  /**
   * Handle keyboard events
   */
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent | KeyboardEvent) => {
      if (!enabled) {
        return;
      }

      switch (event.key) {
        case 'Enter':
          if (onEnter) {
            event.preventDefault();
            onEnter();
          }
          break;

        case 'Escape':
          if (onEscape) {
            event.preventDefault();
            onEscape();
          }
          break;

        case 'ArrowUp':
          if (onArrowUp) {
            event.preventDefault();
            onArrowUp();
          }
          break;

        case 'ArrowDown':
          if (onArrowDown) {
            event.preventDefault();
            onArrowDown();
          }
          break;

        case 'ArrowLeft':
          if (onArrowLeft) {
            event.preventDefault();
            onArrowLeft();
          }
          break;

        case 'ArrowRight':
          if (onArrowRight) {
            event.preventDefault();
            onArrowRight();
          }
          break;

        case 'Tab':
          if (event.shiftKey && onShiftTab) {
            event.preventDefault();
            onShiftTab();
          } else if (!event.shiftKey && onTab) {
            event.preventDefault();
            onTab();
          }
          break;

        default:
          // No action for other keys
          break;
      }
    },
    [
      enabled,
      onEnter,
      onEscape,
      onArrowUp,
      onArrowDown,
      onArrowLeft,
      onArrowRight,
      onTab,
      onShiftTab,
    ]
  );

  /**
   * Register an element for keyboard navigation
   * This allows the hook to attach event listeners to a specific element
   */
  const registerElement = useCallback((element: HTMLElement | null) => {
    elementRef.current = element;
  }, []);

  /**
   * Attach global keyboard listener if no specific element is registered
   */
  useEffect(() => {
    if (!enabled || elementRef.current) {
      return;
    }

    // Add global keyboard listener
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      handleKeyDown(event);
    };

    window.addEventListener('keydown', handleGlobalKeyDown);

    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [enabled, handleKeyDown]);

  return {
    handleKeyDown,
    registerElement,
  };
}

export default useKeyboardNavigation;
