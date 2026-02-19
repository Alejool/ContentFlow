import { TFunction } from 'i18next';
import { EmptyStateConfig } from '@/Components/common/EmptyState';
import { emptyStateConfigs, getEmptyStateConfigs } from '@/Constants/emptyStateConfigs';

/**
 * Empty State Context Mapping
 * 
 * Maps application routes to their corresponding empty state configurations.
 * This utility determines which empty state to display based on the current
 * route and whether the data for that context is empty.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

/**
 * Defines the mapping between routes and empty state configurations
 */
interface EmptyStateContext {
  route: string;           // Route name (e.g., 'reels.gallery')
  dataKey: string;         // Key in Inertia props to check for empty data
  configKey: string;       // Key in emptyStateConfigs
}

/**
 * Array of route-to-config mappings for different application contexts
 * 
 * Each entry defines:
 * - route: The Laravel route name
 * - dataKey: The prop key to check for data presence
 * - configKey: The corresponding empty state configuration
 */
export const emptyStateContexts: EmptyStateContext[] = [
  {
    route: 'reels.gallery',
    dataKey: 'reels',
    configKey: 'reels',
  },
  {
    route: 'content.index',
    dataKey: 'publications',
    configKey: 'scheduledPosts',
  },
  {
    route: 'analytics.index',
    dataKey: 'analytics',
    configKey: 'analytics',
  },
  {
    route: 'calendar.index',
    dataKey: 'events',
    configKey: 'calendarView',
  },
];

/**
 * Get the appropriate empty state configuration for a given route and data context
 * 
 * This function:
 * 1. Finds the context mapping for the current route
 * 2. Checks if the data for that context is empty
 * 3. Returns the appropriate empty state config, or null if data exists
 * 
 * @param routeName - The current Laravel route name (e.g., 'reels.gallery')
 * @param props - The Inertia page props object containing data
 * @param t - Optional translation function for localized configs
 * @returns EmptyStateConfig if data is empty, null otherwise
 * 
 * @example
 * ```tsx
 * // In a page component
 * const { t } = useTranslation();
 * const { props } = usePage();
 * const emptyConfig = getEmptyStateConfig('reels.gallery', props, t);
 * 
 * if (emptyConfig) {
 *   return <EmptyState config={emptyConfig} />;
 * }
 * ```
 */
export function getEmptyStateConfig(
  routeName: string,
  props: any,
  t?: TFunction
): EmptyStateConfig | null {
  // Find the context mapping for this route
  const context = emptyStateContexts.find((c) => c.route === routeName);
  
  if (!context) {
    // No mapping defined for this route
    return null;
  }
  
  // Get the data for this context from props
  const data = props[context.dataKey];
  
  // Check if data exists and is not empty
  if (data && Array.isArray(data) && data.length > 0) {
    // Data exists, no empty state needed
    return null;
  }
  
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    // For object data, check if it has any meaningful content
    const hasContent = Object.keys(data).length > 0;
    if (hasContent) {
      return null;
    }
  }
  
  // Data is empty, return the appropriate config
  const configs = t ? getEmptyStateConfigs(t) : emptyStateConfigs;
  return configs[context.configKey];
}

/**
 * Get empty state configuration by explicit config key
 * 
 * Useful when you want to display a specific empty state regardless of route,
 * such as for search results or filtered lists.
 * 
 * @param configKey - The key of the empty state config to retrieve
 * @param t - Optional translation function for localized configs
 * @returns EmptyStateConfig or undefined if key doesn't exist
 * 
 * @example
 * ```tsx
 * // For search results
 * const { t } = useTranslation();
 * const searchConfig = getEmptyStateByKey('searchResults', t);
 * if (searchResults.length === 0 && searchConfig) {
 *   return <EmptyState config={searchConfig} />;
 * }
 * ```
 */
export function getEmptyStateByKey(
  configKey: string,
  t?: TFunction
): EmptyStateConfig | undefined {
  const configs = t ? getEmptyStateConfigs(t) : emptyStateConfigs;
  return configs[configKey];
}

/**
 * Check if data is empty for empty state purposes
 * 
 * Helper function to determine if data should trigger an empty state display.
 * Handles arrays, objects, null, and undefined.
 * 
 * @param data - The data to check
 * @returns true if data is empty, false otherwise
 * 
 * @example
 * ```tsx
 * if (isDataEmpty(reels)) {
 *   const config = getEmptyStateByKey('reels');
 *   return <EmptyState config={config} />;
 * }
 * ```
 */
export function isDataEmpty(data: any): boolean {
  // Null or undefined
  if (data == null) {
    return true;
  }
  
  // Empty array
  if (Array.isArray(data)) {
    return data.length === 0;
  }
  
  // Empty object (no keys)
  if (typeof data === 'object') {
    return Object.keys(data).length === 0;
  }
  
  // For other types (strings, numbers, etc.), consider them as "not empty"
  return false;
}
