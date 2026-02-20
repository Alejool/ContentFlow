/**
 * ThemeAPIClient
 * 
 * Handles backend persistence of theme preferences via API calls.
 * Provides methods for updating, fetching, and syncing theme preferences.
 * Handles network errors gracefully.
 * 
 * Requirements: 2.4
 */

import axios, { AxiosError } from 'axios';

export type ThemePreference = 'light' | 'dark' | 'system';

export interface ThemeAPIClient {
  updateTheme(workspaceId: string, theme: ThemePreference): Promise<void>;
  fetchTheme(workspaceId: string): Promise<ThemePreference>;
  syncThemes(): Promise<void>;
}

/**
 * Update theme preference on the backend
 * Handles network errors gracefully
 */
async function updateTheme(workspaceId: string, theme: ThemePreference): Promise<void> {
  if (!workspaceId) {
    console.warn('ThemeAPIClient: Invalid workspace ID provided');
    return;
  }

  try {
    await axios.patch(route('api.v1.profile.theme.update'), {
      theme,
      workspace_id: workspaceId,
    });
  } catch (error) {
    handleAPIError('updateTheme', error);
    throw error; // Re-throw to allow caller to handle
  }
}

/**
 * Fetch theme preference from the backend
 * Returns 'system' as default if not found or on error
 */
async function fetchTheme(workspaceId: string): Promise<ThemePreference> {
  if (!workspaceId) {
    console.warn('ThemeAPIClient: Invalid workspace ID provided');
    return 'system';
  }

  try {
    const response = await axios.get(route('api.v1.profile.theme.fetch'), {
      params: { workspace_id: workspaceId },
    });
    
    const theme = response.data?.theme;
    
    if (theme === 'light' || theme === 'dark' || theme === 'system') {
      return theme;
    }
    
    return 'system';
  } catch (error) {
    handleAPIError('fetchTheme', error);
    return 'system'; // Return default on error
  }
}

/**
 * Sync local and remote themes
 * This is a placeholder for future implementation of bidirectional sync
 */
async function syncThemes(): Promise<void> {
  try {
    // Future implementation: sync all workspace themes between local and remote
    // For now, this is a no-op as sync happens on individual save/load
    console.log('ThemeAPIClient: syncThemes called (not yet implemented)');
  } catch (error) {
    handleAPIError('syncThemes', error);
  }
}

/**
 * Handle API errors with appropriate logging
 */
function handleAPIError(operation: string, error: unknown): void {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    
    if (axiosError.response) {
      // Server responded with error status
      console.error(
        `ThemeAPIClient: ${operation} failed with status ${axiosError.response.status}`,
        axiosError.response.data
      );
    } else if (axiosError.request) {
      // Request made but no response received (network error)
      console.error(
        `ThemeAPIClient: ${operation} failed - no response received (network error)`,
        axiosError.message
      );
    } else {
      // Error setting up the request
      console.error(
        `ThemeAPIClient: ${operation} failed - request setup error`,
        axiosError.message
      );
    }
  } else {
    // Non-Axios error
    console.error(`ThemeAPIClient: ${operation} failed with unexpected error`, error);
  }
}

// Export the client as a singleton
export const themeAPIClient: ThemeAPIClient = {
  updateTheme,
  fetchTheme,
  syncThemes,
};
