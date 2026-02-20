import { router } from '@inertiajs/react';
import type { OptimisticOperation } from '../types/optimistic';

/**
 * Inertia.js Optimistic Updates Integration
 * 
 * This module provides utilities to integrate optimistic updates with Inertia.js
 * state management, ensuring that optimistic operations don't interfere with
 * Inertia's shared data and props system.
 * 
 * Requirements: 9.4
 */

/**
 * Check if current page is an Inertia page
 * 
 * @returns true if running in an Inertia context
 */
export function isInertiaPage(): boolean {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return false;
  }
  
  // Check if Inertia is initialized by looking for the page data
  return !!(window as any).Inertia || document.getElementById('app')?.hasAttribute('data-page');
}

/**
 * Get current Inertia page component name
 * 
 * @returns The component name or null if not in Inertia context
 */
export function getInertiaPageComponent(): string | null {
  if (!isInertiaPage()) {
    return null;
  }
  
  try {
    const pageElement = document.getElementById('app');
    const pageData = pageElement?.getAttribute('data-page');
    
    if (pageData) {
      const parsed = JSON.parse(pageData);
      return parsed.component || null;
    }
  } catch (error) {
    }
  
  return null;
}

/**
 * Get current Inertia page props
 * 
 * @returns The page props or null if not in Inertia context
 */
export function getInertiaPageProps(): Record<string, any> | null {
  if (!isInertiaPage()) {
    return null;
  }
  
  try {
    const pageElement = document.getElementById('app');
    const pageData = pageElement?.getAttribute('data-page');
    
    if (pageData) {
      const parsed = JSON.parse(pageData);
      return parsed.props || null;
    }
  } catch (error) {
    }
  
  return null;
}

/**
 * Determine which Inertia props should be reloaded based on operation
 * 
 * This function maps resource types to their corresponding Inertia prop keys
 * to enable selective reloading without affecting unrelated data.
 * 
 * @param operation - The optimistic operation
 * @returns Array of prop keys to reload
 */
export function getPropsToReload(operation: OptimisticOperation): string[] {
  const { resource, type } = operation;
  
  // Map resources to their Inertia prop keys
  const resourcePropMap: Record<string, string[]> = {
    'publications': ['publications', 'publication'],
    'campaigns': ['campaigns', 'campaign'],
    'reels': ['reels', 'reel'],
    'calendar': ['events', 'userEvents'],
    'social-accounts': ['connectedAccounts', 'socialAccounts'],
    'workspaces': ['workspaces', 'current_workspace'],
  };
  
  // Get props for this resource
  const propsToReload = resourcePropMap[resource] || [];
  
  // For delete operations, also reload list views
  if (type === 'delete') {
    // Ensure we reload the collection
    const collectionKey = resource;
    if (!propsToReload.includes(collectionKey)) {
      propsToReload.push(collectionKey);
    }
  }
  
  return propsToReload;
}

/**
 * Sync optimistic operation with Inertia state
 * 
 * This function handles the synchronization between optimistic updates and
 * Inertia's state management. It ensures that:
 * 1. Optimistic updates don't interfere with Inertia's shared data
 * 2. Server responses are properly reflected in Inertia props
 * 3. Only relevant props are reloaded to minimize overhead
 * 
 * Requirements: 9.4
 * 
 * @param operation - The optimistic operation to sync
 * @param status - The operation status ('pending', 'success', 'failed')
 * @param serverData - Optional server response data (for success case)
 */
export function syncWithInertia(
  operation: OptimisticOperation,
  status: 'pending' | 'success' | 'failed',
  serverData?: any
): void {
  // Only sync if we're in an Inertia context
  if (!isInertiaPage()) {
    return;
  }
  
  // Log in development mode
  if (import.meta.env.DEV) {
    }
  
  // Handle based on status
  switch (status) {
    case 'pending':
      // For pending operations, we don't need to reload Inertia props
      // The optimistic data is already shown in the UI via the store
      break;
      
    case 'success':
      // On success, reload relevant Inertia props to get fresh server data
      // This ensures the UI reflects the actual server state
      const propsToReload = getPropsToReload(operation);
      
      if (propsToReload.length > 0) {
        // Use Inertia's reload with 'only' option to selectively reload props
        // This prevents full page reload and preserves scroll position
        router.reload({
          only: propsToReload,
          preserveScroll: true,
          preserveState: true,
        } as any);
        
        if (import.meta.env.DEV) {
          }
      }
      break;
      
    case 'failed':
      // On failure, we might want to reload to ensure consistency
      // However, we should be careful not to reload unnecessarily
      // The rollback in the optimistic store should handle UI reversion
      
      // Only reload if the operation had side effects that need to be reverted
      if (operation.type === 'create' || operation.type === 'update') {
        const propsToReload = getPropsToReload(operation);
        
        if (propsToReload.length > 0) {
          // Reload with a slight delay to allow error messages to be shown
          setTimeout(() => {
            router.reload({
              only: propsToReload,
              preserveScroll: true,
              preserveState: true,
            } as any);
          }, 500);
          
          if (import.meta.env.DEV) {
            }
        }
      }
      break;
  }
}

/**
 * Check if a prop key is part of Inertia's shared data
 * 
 * Shared data in Inertia is data that persists across page visits.
 * We should avoid modifying shared data with optimistic updates.
 * 
 * @param propKey - The prop key to check
 * @returns true if the prop is shared data
 */
export function isSharedData(propKey: string): boolean {
  // Common shared data keys in Inertia
  const sharedDataKeys = [
    'auth',
    'flash',
    'errors',
    'ziggy',
    'locale',
    'csrf_token',
  ];
  
  return sharedDataKeys.includes(propKey);
}

/**
 * Safely merge optimistic data with Inertia props
 * 
 * This function merges optimistic data into Inertia props without
 * interfering with shared data or causing conflicts.
 * 
 * @param props - Current Inertia props
 * @param operation - The optimistic operation
 * @returns Merged props with optimistic data
 */
export function mergeOptimisticData(
  props: Record<string, any>,
  operation: OptimisticOperation
): Record<string, any> {
  // Don't modify original props
  const merged = { ...props };
  
  // Get the resource collection key
  const collectionKey = operation.resource;
  
  // Check if this prop exists and is not shared data
  if (!merged[collectionKey] || isSharedData(collectionKey)) {
    return merged;
  }
  
  // Handle based on operation type
  switch (operation.type) {
    case 'create':
      // Add optimistic item to collection
      if (Array.isArray(merged[collectionKey])) {
        merged[collectionKey] = [
          operation.optimisticData,
          ...merged[collectionKey],
        ];
      }
      break;
      
    case 'update':
      // Update item in collection
      if (Array.isArray(merged[collectionKey])) {
        merged[collectionKey] = merged[collectionKey].map((item: any) => {
          if (item.id === operation.resourceId) {
            return { ...item, ...operation.optimisticData };
          }
          return item;
        });
      }
      break;
      
    case 'delete':
      // Remove item from collection
      if (Array.isArray(merged[collectionKey])) {
        merged[collectionKey] = merged[collectionKey].filter(
          (item: any) => item.id !== operation.resourceId
        );
      }
      break;
  }
  
  return merged;
}

/**
 * Create a hook for Inertia-aware optimistic updates
 * 
 * This is a helper that can be used in components to automatically
 * sync optimistic updates with Inertia state.
 * 
 * @returns Object with sync utilities
 */
export function useInertiaOptimisticSync() {
  return {
    isInertiaPage: isInertiaPage(),
    syncWithInertia,
    getPropsToReload,
    mergeOptimisticData,
  };
}
