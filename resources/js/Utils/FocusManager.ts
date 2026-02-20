/**
 * FocusManager - Utility for managing focus state and keyboard navigation
 * 
 * Provides comprehensive focus management including:
 * - Focus tracking (current and previous focus)
 * - Programmatic focus setting with scroll options
 * - Focus navigation (next/previous focusable elements)
 * - Focus trapping for modals and dialogs
 * - Focus restoration for cleanup
 * - Focusable element detection
 * 
 * Requirements: 5.1, 5.3, 5.5
 */

interface FocusOptions {
  scroll?: boolean;
  preventScroll?: boolean;
}

interface FocusTrapCleanup {
  (): void;
}

class FocusManagerClass {
  private currentFocusElement: HTMLElement | null = null;
  private previousFocusElement: HTMLElement | null = null;
  private focusTrapCleanups: Map<HTMLElement, FocusTrapCleanup> = new Map();

  /**
   * Get the currently focused element
   */
  get currentFocus(): HTMLElement | null {
    return this.currentFocusElement;
  }

  /**
   * Get the previously focused element
   */
  get previousFocus(): HTMLElement | null {
    return this.previousFocusElement;
  }

  /**
   * Set focus to a specific element with optional scroll behavior
   * @param element - The element to focus
   * @param options - Focus options (scroll behavior)
   */
  setFocus(element: HTMLElement, options: FocusOptions = {}): void {
    if (!element || !this.isFocusable(element)) {
      console.warn('FocusManager: Attempted to focus non-focusable element', element);
      return;
    }

    // Store previous focus
    if (this.currentFocusElement && this.currentFocusElement !== element) {
      this.previousFocusElement = this.currentFocusElement;
    }

    // Set new focus
    this.currentFocusElement = element;

    // Apply focus with options
    const focusOptions: FocusOptions = {
      preventScroll: options.scroll === false,
    };

    element.focus(focusOptions);

    // Handle scroll if explicitly requested
    if (options.scroll === true) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
    }
  }

  /**
   * Get the next focusable element in the specified direction
   * @param direction - 'forward' for next, 'backward' for previous
   * @returns The next focusable element or null
   */
  getNextFocusable(direction: 'forward' | 'backward' = 'forward'): HTMLElement | null {
    const focusableElements = this.getAllFocusableElements();
    
    if (focusableElements.length === 0) {
      return null;
    }

    const currentIndex = this.currentFocusElement
      ? focusableElements.indexOf(this.currentFocusElement)
      : -1;

    if (currentIndex === -1) {
      // No current focus, return first or last element
      return direction === 'forward' 
        ? focusableElements[0] 
        : focusableElements[focusableElements.length - 1];
    }

    // Calculate next index
    const nextIndex = direction === 'forward'
      ? (currentIndex + 1) % focusableElements.length
      : (currentIndex - 1 + focusableElements.length) % focusableElements.length;

    return focusableElements[nextIndex];
  }

  /**
   * Trap focus within a container (for modals, dialogs, etc.)
   * @param container - The container element to trap focus within
   * @returns Cleanup function to remove the focus trap
   */
  trapFocus(container: HTMLElement): FocusTrapCleanup {
    if (!container) {
      console.warn('FocusManager: Cannot trap focus in null container');
      return () => {};
    }

    // Store the element that had focus before trapping
    const previouslyFocused = document.activeElement as HTMLElement;

    // Get all focusable elements within the container
    const getFocusableElements = (): HTMLElement[] => {
      return Array.from(
        container.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter(el => this.isFocusable(el));
    };

    // Handle tab key to trap focus
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Tab') {
        return;
      }

      const focusableElements = getFocusableElements();
      
      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement;

      // Shift + Tab (backward)
      if (event.shiftKey) {
        if (activeElement === firstElement || !container.contains(activeElement)) {
          event.preventDefault();
          lastElement.focus();
        }
      } 
      // Tab (forward)
      else {
        if (activeElement === lastElement || !container.contains(activeElement)) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    // Add event listener
    container.addEventListener('keydown', handleKeyDown);

    // Focus the first focusable element
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    // Create cleanup function
    const cleanup: FocusTrapCleanup = () => {
      container.removeEventListener('keydown', handleKeyDown);
      this.focusTrapCleanups.delete(container);
      
      // Restore focus to previously focused element
      if (previouslyFocused && this.isFocusable(previouslyFocused)) {
        previouslyFocused.focus();
      }
    };

    // Store cleanup function
    this.focusTrapCleanups.set(container, cleanup);

    return cleanup;
  }

  /**
   * Restore focus to the previously focused element
   */
  restoreFocus(): void {
    if (this.previousFocusElement && this.isFocusable(this.previousFocusElement)) {
      this.setFocus(this.previousFocusElement);
    }
  }

  /**
   * Check if an element is focusable
   * @param element - The element to check
   * @returns True if the element is focusable
   */
  isFocusable(element: HTMLElement): boolean {
    if (!element || !(element instanceof HTMLElement)) {
      return false;
    }

    // Check if element is visible
    if (element.offsetParent === null && element.tagName !== 'BODY') {
      return false;
    }

    // Check if element is disabled
    if ((element as any).disabled === true) {
      return false;
    }

    // Check tabindex
    const tabindex = element.getAttribute('tabindex');
    if (tabindex === '-1') {
      return false;
    }

    // Check if element is naturally focusable or has tabindex
    const focusableSelectors = [
      'a[href]',
      'button',
      'input',
      'textarea',
      'select',
      '[tabindex]',
      '[contenteditable="true"]',
    ];

    return focusableSelectors.some(selector => {
      try {
        return element.matches(selector);
      } catch {
        return false;
      }
    });
  }

  /**
   * Get all focusable elements in the document
   * @returns Array of focusable elements
   */
  private getAllFocusableElements(): HTMLElement[] {
    const selector = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';
    const elements = Array.from(document.querySelectorAll<HTMLElement>(selector));
    return elements.filter(el => this.isFocusable(el));
  }

  /**
   * Initialize focus tracking
   * Sets up global focus event listeners to track focus changes
   */
  initialize(): void {
    // Track focus changes globally
    document.addEventListener('focusin', (event) => {
      const target = event.target as HTMLElement;
      if (target && this.isFocusable(target)) {
        if (this.currentFocusElement && this.currentFocusElement !== target) {
          this.previousFocusElement = this.currentFocusElement;
        }
        this.currentFocusElement = target;
      }
    });

    // Track focus loss
    document.addEventListener('focusout', () => {
      // Small delay to allow new focus to be set
      setTimeout(() => {
        if (!document.activeElement || document.activeElement === document.body) {
          this.previousFocusElement = this.currentFocusElement;
          this.currentFocusElement = null;
        }
      }, 0);
    });
  }

  /**
   * Cleanup all focus traps
   */
  cleanup(): void {
    this.focusTrapCleanups.forEach(cleanup => cleanup());
    this.focusTrapCleanups.clear();
  }
}

// Export singleton instance
export const FocusManager = new FocusManagerClass();

// Export type for external use
export type FocusManager = FocusManagerClass;
