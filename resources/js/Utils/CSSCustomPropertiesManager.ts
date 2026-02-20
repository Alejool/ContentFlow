import { enhancedTheme } from '../theme';

type ThemeMode = 'light' | 'dark';

/**
 * CSSCustomPropertiesManager
 * 
 * Utility for managing CSS custom properties (CSS variables) for theme values.
 * Converts theme configuration to CSS variables and provides methods for
 * reactive updates, individual property management, and cleanup.
 * 
 * Requirements: 9.4, 9.5
 */
class CSSCustomPropertiesManager {
  private root: HTMLElement;

  constructor() {
    this.root = typeof document !== 'undefined' ? document.documentElement : ({} as HTMLElement);
  }

  /**
   * Apply theme properties as CSS custom properties
   * Converts the enhanced theme object to CSS variables on the document root
   * 
   * @param mode - The theme mode ('light' or 'dark')
   */
  applyThemeProperties(mode: ThemeMode): void {
    if (typeof document === 'undefined') return;

    const themeColors = mode === 'dark' ? enhancedTheme.darkMode : enhancedTheme.lightMode;
    
    // Apply background colors
    this.updateProperty('--theme-bg-primary', themeColors.background.primary);
    this.updateProperty('--theme-bg-secondary', themeColors.background.secondary);
    this.updateProperty('--theme-bg-tertiary', themeColors.background.tertiary);
    this.updateProperty('--theme-bg-elevated', themeColors.background.elevated);

    // Apply text colors
    this.updateProperty('--theme-text-primary', themeColors.text.primary);
    this.updateProperty('--theme-text-secondary', themeColors.text.secondary);
    this.updateProperty('--theme-text-tertiary', themeColors.text.tertiary);
    this.updateProperty('--theme-text-disabled', themeColors.text.disabled);

    // Apply border colors
    this.updateProperty('--theme-border-subtle', themeColors.border.subtle);
    this.updateProperty('--theme-border-default', themeColors.border.default);
    this.updateProperty('--theme-border-strong', themeColors.border.strong);

    // Apply interactive colors
    this.updateProperty('--theme-interactive-hover', themeColors.interactive.hover);
    this.updateProperty('--theme-interactive-active', themeColors.interactive.active);
    this.updateProperty('--theme-interactive-focus', themeColors.interactive.focus);

    // Apply focus indicator styles
    this.updateProperty('--theme-focus-ring-width', enhancedTheme.focus.ring.width);
    this.updateProperty('--theme-focus-ring-offset', enhancedTheme.focus.ring.offset);
    this.updateProperty('--theme-focus-ring-color', enhancedTheme.focus.ring.color[mode]);
    this.updateProperty('--theme-focus-ring-style', enhancedTheme.focus.ring.style);
    this.updateProperty('--theme-focus-outline-width', enhancedTheme.focus.outline.width);
    this.updateProperty('--theme-focus-outline-style', enhancedTheme.focus.outline.style);
    this.updateProperty('--theme-focus-outline-color', enhancedTheme.focus.outline.color[mode]);

    // Apply animation durations
    this.updateProperty('--theme-animation-instant', `${enhancedTheme.animation.duration.instant}ms`);
    this.updateProperty('--theme-animation-fast', `${enhancedTheme.animation.duration.fast}ms`);
    this.updateProperty('--theme-animation-normal', `${enhancedTheme.animation.duration.normal}ms`);
    this.updateProperty('--theme-animation-slow', `${enhancedTheme.animation.duration.slow}ms`);
    this.updateProperty('--theme-animation-slower', `${enhancedTheme.animation.duration.slower}ms`);

    // Apply animation easing
    this.updateProperty('--theme-animation-ease-in-out', enhancedTheme.animation.easing.easeInOut);
    this.updateProperty('--theme-animation-ease-out', enhancedTheme.animation.easing.easeOut);
    this.updateProperty('--theme-animation-ease-in', enhancedTheme.animation.easing.easeIn);
    this.updateProperty('--theme-animation-spring', enhancedTheme.animation.easing.spring);
  }

  /**
   * Update a specific CSS custom property
   * 
   * @param name - The CSS variable name (with -- prefix)
   * @param value - The value to set
   */
  updateProperty(name: string, value: string): void {
    if (typeof document === 'undefined') return;
    this.root.style.setProperty(name, value);
  }

  /**
   * Get the current value of a CSS custom property
   * 
   * @param name - The CSS variable name (with -- prefix)
   * @returns The current value of the property
   */
  getProperty(name: string): string {
    if (typeof document === 'undefined') return '';
    return getComputedStyle(this.root).getPropertyValue(name).trim();
  }

  /**
   * Clear all theme-related CSS custom properties
   * Removes all properties that start with --theme-
   */
  clearProperties(): void {
    if (typeof document === 'undefined') return;

    const propertiesToClear = [
      // Background colors
      '--theme-bg-primary',
      '--theme-bg-secondary',
      '--theme-bg-tertiary',
      '--theme-bg-elevated',
      // Text colors
      '--theme-text-primary',
      '--theme-text-secondary',
      '--theme-text-tertiary',
      '--theme-text-disabled',
      // Border colors
      '--theme-border-subtle',
      '--theme-border-default',
      '--theme-border-strong',
      // Interactive colors
      '--theme-interactive-hover',
      '--theme-interactive-active',
      '--theme-interactive-focus',
      // Focus styles
      '--theme-focus-ring-width',
      '--theme-focus-ring-offset',
      '--theme-focus-ring-color',
      '--theme-focus-ring-style',
      '--theme-focus-outline-width',
      '--theme-focus-outline-style',
      '--theme-focus-outline-color',
      // Animation durations
      '--theme-animation-instant',
      '--theme-animation-fast',
      '--theme-animation-normal',
      '--theme-animation-slow',
      '--theme-animation-slower',
      // Animation easing
      '--theme-animation-ease-in-out',
      '--theme-animation-ease-out',
      '--theme-animation-ease-in',
      '--theme-animation-spring',
    ];

    propertiesToClear.forEach(property => {
      this.root.style.removeProperty(property);
    });
  }
}

// Export singleton instance
export const cssPropertiesManager = new CSSCustomPropertiesManager();

export default CSSCustomPropertiesManager;
