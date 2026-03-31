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
 */
export function isInertiaPage(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return (
    !!(window as unknown as Record<string, unknown>).Inertia ||
    document.getElementById('app')?.hasAttribute('data-page')
  );
}

/**
 * Get current Inertia page component name
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
  } catch {
    // ignore parse errors
  }

  return null;
}

/**
 * Get current Inertia page props
 */
export function getInertiaPageProps(): Record<string, unknown> | null {
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
  } catch {
    // ignore parse errors
  }

  return null;
}

/**
 * Determine which Inertia props should be reloaded based on operation
 */
export function getPropsToReload(operation: OptimisticOperation): string[] {
  const { resource, type } = operation;

  const resourcePropMap: Record<string, string[]> = {
    publications: ['publications', 'publication'],
    campaigns: ['campaigns', 'campaign'],
    reels: ['reels', 'reel'],
    calendar: ['events', 'userEvents'],
    'social-accounts': ['connectedAccounts', 'socialAccounts'],
    workspaces: ['workspaces', 'current_workspace'],
  };

  const propsToReload = resourcePropMap[resource] || [];

  if (type === 'delete') {
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
 * Requirements: 9.4
 */
export function syncWithInertia(
  operation: OptimisticOperation,
  status: 'pending' | 'success' | 'failed',
): void {
  if (!isInertiaPage()) {
    return;
  }

  switch (status) {
    case 'pending':
      // Optimistic data is already shown via the store — no reload needed
      break;

    case 'success': {
      const propsToReload = getPropsToReload(operation);

      if (propsToReload.length > 0) {
        router.reload({
          only: propsToReload,
          preserveScroll: true,
          preserveState: true,
        } as Parameters<typeof router.reload>[0]);
      }
      break;
    }

    case 'failed': {
      if (operation.type === 'create' || operation.type === 'update') {
        const propsToReload = getPropsToReload(operation);

        if (propsToReload.length > 0) {
          setTimeout(() => {
            router.reload({
              only: propsToReload,
              preserveScroll: true,
              preserveState: true,
            } as Parameters<typeof router.reload>[0]);
          }, 500);
        }
      }
      break;
    }
  }
}

/**
 * Check if a prop key is part of Inertia's shared data
 */
export function isSharedData(propKey: string): boolean {
  const sharedDataKeys = ['auth', 'flash', 'errors', 'ziggy', 'locale', 'csrf_token'];
  return sharedDataKeys.includes(propKey);
}

/**
 * Safely merge optimistic data with Inertia props
 */
export function mergeOptimisticData(
  props: Record<string, unknown>,
  operation: OptimisticOperation,
): Record<string, unknown> {
  const merged = { ...props };
  const collectionKey = operation.resource;

  if (!merged[collectionKey] || isSharedData(collectionKey)) {
    return merged;
  }

  switch (operation.type) {
    case 'create':
      if (Array.isArray(merged[collectionKey])) {
        merged[collectionKey] = [operation.optimisticData, ...(merged[collectionKey] as unknown[])];
      }
      break;

    case 'update':
      if (Array.isArray(merged[collectionKey])) {
        merged[collectionKey] = (merged[collectionKey] as Record<string, unknown>[]).map((item) => {
          if (item.id === operation.resourceId) {
            return { ...item, ...(operation.optimisticData as Record<string, unknown>) };
          }
          return item;
        });
      }
      break;

    case 'delete':
      if (Array.isArray(merged[collectionKey])) {
        merged[collectionKey] = (merged[collectionKey] as Record<string, unknown>[]).filter(
          (item) => item.id !== operation.resourceId,
        );
      }
      break;
  }

  return merged;
}

/**
 * Create a hook for Inertia-aware optimistic updates
 */
export function useInertiaOptimisticSync() {
  return {
    isInertiaPage: isInertiaPage(),
    syncWithInertia,
    getPropsToReload,
    mergeOptimisticData,
  };
}
