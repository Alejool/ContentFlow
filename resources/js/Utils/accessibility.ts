/**
 * Accessibility utility functions for React components
 */

/**
 * Handle keyboard events for clickable elements
 * Use this for div/span elements that need to be clickable
 * 
 * @example
 * <div
 *   onClick={handleClick}
 *   onKeyDown={handleKeyboardClick(handleClick)}
 *   role="button"
 *   tabIndex={0}
 * >
 *   Click me
 * </div>
 */
export const handleKeyboardClick = (callback: () => void) => {
  return (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      callback();
    }
  };
};

/**
 * Props for making a div/span clickable and accessible
 * 
 * @example
 * <div {...makeClickable(handleClick)}>
 *   Click me
 * </div>
 */
export const makeClickable = (onClick: () => void) => {
  return {
    role: 'button' as const,
    tabIndex: 0,
    onClick,
    onKeyDown: handleKeyboardClick(onClick),
  };
};

/**
 * Empty array constant to use as default prop value
 * Prevents creating new array references on every render
 * 
 * @example
 * function MyComponent({ items = EMPTY_ARRAY }: { items?: Item[] }) {
 *   // items will always be the same reference when empty
 * }
 */
export const EMPTY_ARRAY: readonly any[] = [];

/**
 * Empty object constant to use as default prop value
 * Prevents creating new object references on every render
 */
export const EMPTY_OBJECT: Readonly<Record<string, never>> = {};
