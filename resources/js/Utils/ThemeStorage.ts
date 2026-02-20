/**
 * ThemeStorage
 * 
 * Combines localStorage and backend persistence for theme preferences.
 * Implements dual storage strategy with fallback logic.
 * 
 * Storage Strategy:
 * - Save: Write to both localStorage (immediate) and backend (async)
 * - Load: Try localStorage first, fallback to backend if not found
 * - Delete: Remove from both localStorage and backend
 * 
 * Requirements: 2.1, 2.2, 2.4
 */

import { localStorageThemeManager } from './LocalStorageThemeManager';
import { themeAPIClient } from './ThemeAPIClient';

export type ThemePreference = 'light' | 'dark' | 'system';

export interface ThemeStorage {
  saveThemePreference(workspaceId: string, theme: ThemePreference): Promise<void>;
  loadThemePreference(workspaceId: string): Promise<ThemePreference | null>;
  deleteThemePreference(workspaceId: string): Promise<void>;
  getAllWorkspaceThemes(): Promise<Record<string, ThemePreference>>;
}

/**
 * Save theme preference with dual storage
 * Saves to localStorage immediately and backend asynchronously
 * If backend save fails, localStorage still has the preference
 */
async function saveThemePreference(
  workspaceId: string,
  theme: ThemePreference
): Promise<void> {
  if (!workspaceId) {
    console.warn('ThemeStorage: Invalid workspace ID provided');
    return;
  }

  // Save to localStorage immediately (synchronous, fast)
  localStorageThemeManager.save(workspaceId, theme);

  // Save to backend asynchronously (may fail due to network)
  try {
    await themeAPIClient.updateTheme(workspaceId, theme);
  } catch (error) {
    // Backend save failed, but localStorage has the preference
    // This is acceptable - the preference will sync on next successful connection
    console.warn(
      'ThemeStorage: Backend save failed, preference saved to localStorage only',
      error
    );
  }
}

/**
 * Load theme preference with fallback logic
 * 
 * Fallback order:
 * 1. Try localStorage (fast, offline-capable)
 * 2. If not found, try backend (requires network)
 * 3. If both fail, return null (caller should use system default)
 */
async function loadThemePreference(workspaceId: string): Promise<ThemePreference | null> {
  if (!workspaceId) {
    console.warn('ThemeStorage: Invalid workspace ID provided');
    return null;
  }

  // Try localStorage first (fast, offline-capable)
  const localTheme = localStorageThemeManager.load(workspaceId);
  
  if (localTheme) {
    return localTheme;
  }

  // If not in localStorage, try backend
  try {
    const backendTheme = await themeAPIClient.fetchTheme(workspaceId);
    
    // If backend has a preference, save it to localStorage for future fast access
    if (backendTheme && backendTheme !== 'system') {
      localStorageThemeManager.save(workspaceId, backendTheme);
    }
    
    return backendTheme;
  } catch (error) {
    // Both localStorage and backend failed
    console.warn('ThemeStorage: Failed to load theme from both localStorage and backend', error);
    return null;
  }
}

/**
 * Delete theme preference from both storages
 */
async function deleteThemePreference(workspaceId: string): Promise<void> {
  if (!workspaceId) {
    console.warn('ThemeStorage: Invalid workspace ID provided');
    return;
  }

  // Remove from localStorage
  localStorageThemeManager.remove(workspaceId);

  // Remove from backend (best effort)
  try {
    await themeAPIClient.updateTheme(workspaceId, 'system'); // Reset to system default
  } catch (error) {
    console.warn('ThemeStorage: Failed to delete theme from backend', error);
  }
}

/**
 * Get all workspace themes from localStorage
 * This is a local-only operation for performance
 */
async function getAllWorkspaceThemes(): Promise<Record<string, ThemePreference>> {
  const themes: Record<string, ThemePreference> = {};
  
  try {
    const keys = Object.keys(localStorage);
    const workspaceThemeKeys = keys.filter(key => key.startsWith('workspace_theme_'));
    
    workspaceThemeKeys.forEach(key => {
      const workspaceId = key.replace('workspace_theme_', '');
      const theme = localStorageThemeManager.load(workspaceId);
      
      if (theme) {
        themes[workspaceId] = theme;
      }
    });
  } catch (error) {
    console.error('ThemeStorage: Failed to get all workspace themes', error);
  }
  
  return themes;
}

// Export the storage implementation as a singleton
export const themeStorage: ThemeStorage = {
  saveThemePreference,
  loadThemePreference,
  deleteThemePreference,
  getAllWorkspaceThemes,
};
