/**
 * CSS Custom Properties Manager
 * 
 * Manages CSS custom properties for theme colors with WCAG AAA compliance
 */

import { enhancedTheme } from '../theme';

class CSSPropertiesManager {
  private root: HTMLElement | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.root = document.documentElement;
    }
  }

  /**
   * Apply theme-specific CSS custom properties
   */
  applyThemeProperties(theme: 'light' | 'dark'): void {
    if (!this.root) return;

    const colors = theme === 'dark' ? enhancedTheme.darkMode : enhancedTheme.lightMode;
    const focusColors = enhancedTheme.focus;

    // Background colors
    this.root.style.setProperty('--theme-bg-primary', colors.background.primary);
    this.root.style.setProperty('--theme-bg-secondary', colors.background.secondary);
    this.root.style.setProperty('--theme-bg-tertiary', colors.background.tertiary);
    this.root.style.setProperty('--theme-bg-elevated', colors.background.elevated);

    // Text colors
    this.root.style.setProperty('--theme-text-primary', colors.text.primary);
    this.root.style.setProperty('--theme-text-secondary', colors.text.secondary);
    this.root.style.setProperty('--theme-text-tertiary', colors.text.tertiary);
    this.root.style.setProperty('--theme-text-disabled', colors.text.disabled);

    // Border colors
    this.root.style.setProperty('--theme-border-subtle', colors.border.subtle);
    this.root.style.setProperty('--theme-border-default', colors.border.default);
    this.root.style.setProperty('--theme-border-strong', colors.border.strong);

    // Interactive states
    this.root.style.setProperty('--theme-interactive-hover', colors.interactive.hover);
    this.root.style.setProperty('--theme-interactive-active', colors.interactive.active);
    this.root.style.setProperty('--theme-interactive-focus', colors.interactive.focus);

    // Focus ring colors
    const focusRingColor = theme === 'dark' ? focusColors.ring.color.dark : focusColors.ring.color.light;
    const focusOutlineColor = theme === 'dark' ? focusColors.outline.color.dark : focusColors.outline.color.light;
    
    this.root.style.setProperty('--theme-focus-ring-color', focusRingColor);
    this.root.style.setProperty('--theme-focus-outline-color', focusOutlineColor);
  }

  /**
   * Get current theme from document
   */
  getCurrentTheme(): 'light' | 'dark' {
    if (!this.root) return 'light';
    return this.root.classList.contains('dark') ? 'dark' : 'light';
  }

  /**
   * Set a custom property value
   */
  setProperty(name: string, value: string): void {
    if (!this.root) return;
    this.root.style.setProperty(name, value);
  }

  /**
   * Get a custom property value
   */
  getProperty(name: string): string {
    if (!this.root) return '';
    return getComputedStyle(this.root).getPropertyValue(name);
  }

  /**
   * Remove a custom property
   */
  removeProperty(name: string): void {
    if (!this.root) return;
    this.root.style.removeProperty(name);
  }
}

export const cssPropertiesManager = new CSSPropertiesManager();
