/**
 * Keyboard Navigation Hook
 * 
 * Provides keyboard navigation utilities for accessible components
 */

import { useEffect, useCallback, RefObject } from 'react';

interface KeyboardNavigationOptions {
  onEscape?: () => void;
  onEnter?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onTab?: (shiftKey: boolean) => void;
  onHome?: () => void;
  onEnd?: () => void;
  enabled?: boolean;
}

export function useKeyboardNavigation(
  ref: RefObject<HTMLElement>,
  options: KeyboardNavigationOptions
): void {
  const {
    onEscape,
    onEnter,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onTab,
    onHome,
    onEnd,
    enabled = true,
  } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      switch (event.key) {
        case 'Escape':
          if (onEscape) {
            event.preventDefault();
            onEscape();
          }
          break;

        case 'Enter':
          if (onEnter) {
            event.preventDefault();
            onEnter();
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
          if (onTab) {
            event.preventDefault();
            onTab(event.shiftKey);
          }
          break;

        case 'Home':
          if (onHome) {
            event.preventDefault();
            onHome();
          }
          break;

        case 'End':
          if (onEnd) {
            event.preventDefault();
            onEnd();
          }
          break;
      }
    },
    [enabled, onEscape, onEnter, onArrowUp, onArrowDown, onArrowLeft, onArrowRight, onTab, onHome, onEnd]
  );

  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return;

    element.addEventListener('keydown', handleKeyDown);

    return () => {
      element.removeEventListener('keydown', handleKeyDown);
    };
  }, [ref, handleKeyDown, enabled]);
}

/**
 * Focus trap hook for modals and dialogs
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement>,
  enabled: boolean = true
): void {
  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    // Focus first element on mount
    firstElement?.focus();

    container.addEventListener('keydown', handleTabKey);

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, [containerRef, enabled]);
}

/**
 * Roving tabindex hook for lists and menus
 */
export function useRovingTabIndex(
  containerRef: RefObject<HTMLElement>,
  itemSelector: string = '[role="menuitem"], [role="option"]',
  orientation: 'horizontal' | 'vertical' = 'vertical'
): void {
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    let currentIndex = 0;

    const updateTabIndex = () => {
      const items = Array.from(container.querySelectorAll<HTMLElement>(itemSelector));
      
      items.forEach((item, index) => {
        if (index === currentIndex) {
          item.setAttribute('tabindex', '0');
        } else {
          item.setAttribute('tabindex', '-1');
        }
      });

      return items;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const items = updateTabIndex();
      const nextKey = orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight';
      const prevKey = orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft';

      if (e.key === nextKey) {
        e.preventDefault();
        currentIndex = (currentIndex + 1) % items.length;
        updateTabIndex();
        items[currentIndex]?.focus();
      } else if (e.key === prevKey) {
        e.preventDefault();
        currentIndex = (currentIndex - 1 + items.length) % items.length;
        updateTabIndex();
        items[currentIndex]?.focus();
      } else if (e.key === 'Home') {
        e.preventDefault();
        currentIndex = 0;
        updateTabIndex();
        items[currentIndex]?.focus();
      } else if (e.key === 'End') {
        e.preventDefault();
        currentIndex = items.length - 1;
        updateTabIndex();
        items[currentIndex]?.focus();
      }
    };

    updateTabIndex();
    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [containerRef, itemSelector, orientation]);
}
