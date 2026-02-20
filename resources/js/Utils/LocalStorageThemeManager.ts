/**
 * LocalStorageThemeManager
 * 
 * Manages theme preferences in localStorage with workspace ID scoping.
 * Handles quota errors gracefully and provides CRUD operations for theme preferences.
 * 
 * Requirements: 2.1, 2.4
 */

export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY_PREFIX = 'workspace_theme_';
const FALLBACK_KEY = 'theme'; // Fallback for non-workspace usage

export interface LocalStorageThemeManager {
  save(workspaceId: string, theme: ThemePreference): void;
  load(workspaceId: string): ThemePreference | null;
  remove(workspaceId: string): void;
  clearAll(): void;
}

/**
 * Save theme preference for a specific workspace
 * Handles localStorage quota errors gracefully
 * Only keeps the current workspace theme, removes all others
 */
function save(workspaceId: string, theme: ThemePreference): void {
  if (!workspaceId) {
    console.warn('LocalStorageThemeManager: Invalid workspace ID provided');
    return;
  }

  const key = `${STORAGE_KEY_PREFIX}${workspaceId}`;
  
  try {
    // Clean up old workspace themes before saving (keep only current)
    clearOtherWorkspaceThemes(workspaceId);
    
    localStorage.setItem(key, theme);
  } catch (error) {
    // Handle quota exceeded error
    if (error instanceof DOMException && 
        (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
      console.warn('LocalStorageThemeManager: localStorage quota exceeded, attempting cleanup');
      
      try {
        // Clear all workspace themes and retry
        clearAll();
        localStorage.setItem(key, theme);
      } catch (retryError) {
        console.error('LocalStorageThemeManager: Failed to save theme after cleanup', retryError);
      }
    } else {
      console.error('LocalStorageThemeManager: Failed to save theme preference', error);
    }
  }
}

/**
 * Load theme preference for a specific workspace
 * Returns null if no preference exists
 */
function load(workspaceId: string): ThemePreference | null {
  if (!workspaceId) {
    console.warn('LocalStorageThemeManager: Invalid workspace ID provided');
    return null;
  }

  const key = `${STORAGE_KEY_PREFIX}${workspaceId}`;
  
  try {
    const stored = localStorage.getItem(key);
    
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
    
    return null;
  } catch (error) {
    console.error('LocalStorageThemeManager: Failed to load theme preference', error);
    return null;
  }
}

/**
 * Remove theme preference for a specific workspace
 */
function remove(workspaceId: string): void {
  if (!workspaceId) {
    console.warn('LocalStorageThemeManager: Invalid workspace ID provided');
    return;
  }

  const key = `${STORAGE_KEY_PREFIX}${workspaceId}`;
  
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('LocalStorageThemeManager: Failed to remove theme preference', error);
  }
}

/**
 * Clear all workspace theme preferences
 */
function clearAll(): void {
  try {
    const keys = Object.keys(localStorage);
    const workspaceThemeKeys = keys.filter(key => key.startsWith(STORAGE_KEY_PREFIX));
    
    workspaceThemeKeys.forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error('LocalStorageThemeManager: Failed to clear all theme preferences', error);
  }
}

/**
 * Helper function to clear workspace themes except the current one
 * Only keeps the theme for the specified workspace ID
 */
function clearOtherWorkspaceThemes(currentWorkspaceId: string): void {
  try {
    const keys = Object.keys(localStorage);
    const workspaceThemeKeys = keys.filter(key => key.startsWith(STORAGE_KEY_PREFIX));
    const currentKey = `${STORAGE_KEY_PREFIX}${currentWorkspaceId}`;
    
    // Remove all workspace themes except the current one
    workspaceThemeKeys.forEach(key => {
      if (key !== currentKey) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('LocalStorageThemeManager: Failed to clear other workspace themes', error);
  }
}

// Export the manager as a singleton
export const localStorageThemeManager: LocalStorageThemeManager = {
  save,
  load,
  remove,
  clearAll,
};
