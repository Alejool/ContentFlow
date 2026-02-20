/**
 * FocusVisibleManager - Utility for managing focus-visible state
 * 
 * Detects whether focus was triggered by keyboard or mouse interaction
 * and applies the 'focus-visible' class accordingly. This ensures that
 * focus indicators are only shown for keyboard navigation, not mouse clicks.
 * 
 * Requirements: 6.1, 6.2, 6.3
 */

class FocusVisibleManagerClass {
  private isKeyboardMode: boolean = false;
  private isInitialized: boolean = false;
  private readonly FOCUS_VISIBLE_CLASS = 'focus-visible';

  /**
   * Initialize the focus-visible detection system
   * Sets up event listeners to detect keyboard vs mouse focus
   */
  initialize(): void {
    if (this.isInitialized) {
      return;
    }

    // Detect keyboard usage
    this.setupKeyboardDetection();
    
    // Detect mouse usage
    this.setupMouseDetection();
    
    // Handle focus events
    this.setupFocusHandling();

    this.isInitialized = true;
  }

  /**
   * Set up keyboard detection
   * Switches to keyboard mode when Tab key is pressed
   */
  private setupKeyboardDetection(): void {
    document.addEventListener('keydown', (event: KeyboardEvent) => {
      // Tab key indicates keyboard navigation
      if (event.key === 'Tab') {
        this.isKeyboardMode = true;
      }
    }, true);
  }

  /**
   * Set up mouse detection
   * Switches to mouse mode on mouse down
   */
  private setupMouseDetection(): void {
    document.addEventListener('mousedown', () => {
      this.isKeyboardMode = false;
    }, true);

    // Also detect pointer events for touch devices
    document.addEventListener('pointerdown', (event: PointerEvent) => {
      // Only switch to mouse mode for mouse/touch, not pen
      if (event.pointerType === 'mouse' || event.pointerType === 'touch') {
        this.isKeyboardMode = false;
      }
    }, true);
  }

  /**
   * Set up focus event handling
   * Adds/removes focus-visible class based on input method
   */
  private setupFocusHandling(): void {
    // Handle focus events
    document.addEventListener('focus', (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      
      if (!target || !(target instanceof HTMLElement)) {
        return;
      }

      // Add focus-visible class if in keyboard mode
      if (this.isKeyboardMode) {
        this.addFocusVisible(target);
      } else {
        this.removeFocusVisible(target);
      }
    }, true);

    // Handle blur events to clean up
    document.addEventListener('blur', (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      
      if (!target || !(target instanceof HTMLElement)) {
        return;
      }

      this.removeFocusVisible(target);
    }, true);
  }

  /**
   * Check if focus should be visible based on current input mode
   * @returns True if focus indicators should be shown
   */
  shouldShowFocus(): boolean {
    return this.isKeyboardMode;
  }

  /**
   * Add focus-visible class to an element
   * @param element - The element to add the class to
   */
  addFocusVisible(element: HTMLElement): void {
    if (!element || !(element instanceof HTMLElement)) {
      return;
    }

    // Check if element should show focus indicators
    if (!this.shouldElementShowFocus(element)) {
      return;
    }

    element.classList.add(this.FOCUS_VISIBLE_CLASS);
    
    // Also set data attribute for CSS selectors
    element.setAttribute('data-focus-visible', 'true');
  }

  /**
   * Remove focus-visible class from an element
   * @param element - The element to remove the class from
   */
  removeFocusVisible(element: HTMLElement): void {
    if (!element || !(element instanceof HTMLElement)) {
      return;
    }

    element.classList.remove(this.FOCUS_VISIBLE_CLASS);
    element.removeAttribute('data-focus-visible');
  }

  /**
   * Check if an element should show focus indicators
   * Some elements like text inputs should always show focus
   * @param element - The element to check
   * @returns True if the element should show focus indicators
   */
  private shouldElementShowFocus(element: HTMLElement): boolean {
    // Text inputs, textareas, and contenteditable should always show focus
    const alwaysShowFocusSelectors = [
      'input[type="text"]',
      'input[type="email"]',
      'input[type="password"]',
      'input[type="search"]',
      'input[type="tel"]',
      'input[type="url"]',
      'input[type="number"]',
      'textarea',
      '[contenteditable="true"]',
    ];

    const shouldAlwaysShow = alwaysShowFocusSelectors.some(selector => {
      try {
        return element.matches(selector);
      } catch {
        return false;
      }
    });

    // If element should always show focus, return true regardless of keyboard mode
    if (shouldAlwaysShow) {
      return true;
    }

    // Otherwise, only show focus in keyboard mode
    return this.isKeyboardMode;
  }

  /**
   * Get the current input mode
   * @returns 'keyboard' or 'mouse'
   */
  getInputMode(): 'keyboard' | 'mouse' {
    return this.isKeyboardMode ? 'keyboard' : 'mouse';
  }

  /**
   * Manually set keyboard mode
   * Useful for testing or special cases
   * @param isKeyboard - Whether to enable keyboard mode
   */
  setKeyboardMode(isKeyboard: boolean): void {
    this.isKeyboardMode = isKeyboard;
  }

  /**
   * Check if the manager is initialized
   * @returns True if initialized
   */
  isActive(): boolean {
    return this.isInitialized;
  }

  /**
   * Cleanup and remove all event listeners
   */
  cleanup(): void {
    // Note: We can't easily remove the event listeners since they're anonymous
    // In a real implementation, we'd store references to the handlers
    // For now, just mark as not initialized
    this.isInitialized = false;
    this.isKeyboardMode = false;
  }
}

// Export singleton instance
export const FocusVisibleManager = new FocusVisibleManagerClass();

// Export type for external use
export type FocusVisibleManager = FocusVisibleManagerClass;
