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
    const focusRingColor =
      theme === 'dark' ? focusColors.ring.color.dark : focusColors.ring.color.light;
    const focusOutlineColor =
      theme === 'dark' ? focusColors.outline.color.dark : focusColors.outline.color.light;

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
   * Apply primary color palette (hex or predefined name)
   */
  applyPrimaryColor(color: string): void {
    if (!this.root) return;

    if (color && color.startsWith('#')) {
      // Set custom flag
      this.root.setAttribute('data-theme-color', 'custom');

      // Convert hex to rgb format required by Tailwind CSS custom properties
      const hex = color.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);

      if (isNaN(r) || isNaN(g) || isNaN(b)) return;

      // Helper function to mix color with white (negative weight) or black (positive weight)
      const mixWeight = (val: number, target: number, weight: number) =>
        Math.round(val * (1 - weight) + target * weight);

      const shade = (weight: number) => {
        const target = weight > 0 ? 0 : 255;
        const w = Math.abs(weight);
        return `${mixWeight(r, target, w)} ${mixWeight(g, target, w)} ${mixWeight(b, target, w)}`;
      };

      this.root.style.setProperty('--primary-50', shade(-0.95));
      this.root.style.setProperty('--primary-100', shade(-0.9));
      this.root.style.setProperty('--primary-200', shade(-0.8));
      this.root.style.setProperty('--primary-300', shade(-0.6));
      this.root.style.setProperty('--primary-400', shade(-0.3));
      this.root.style.setProperty('--primary-500', `${r} ${g} ${b}`);
      this.root.style.setProperty('--primary-600', shade(0.2));
      this.root.style.setProperty('--primary-700', shade(0.4));
      this.root.style.setProperty('--primary-800', shade(0.6));
      this.root.style.setProperty('--primary-900', shade(0.8));
      this.root.style.setProperty('--primary-950', shade(0.9));
    } else {
      // Clear custom properties when using predefined themes
      [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].forEach((weight) => {
        this.root?.style.removeProperty(`--primary-${weight}`);
      });
      this.root.setAttribute('data-theme-color', color || 'orange');
    }
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
