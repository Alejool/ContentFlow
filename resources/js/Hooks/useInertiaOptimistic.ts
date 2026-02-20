import { usePage } from '@inertiajs/react';
import { useMemo } from 'react';
import { useOptimistic } from './useOptimistic';
import type { OptimisticOptions } from '../types/optimistic';
import { isInertiaPage, getInertiaPageComponent } from '../utils/inertiaOptimisticSync';

/**
 * useInertiaOptimistic Hook - Inertia.js aware optimistic updates
 * 
 * This hook extends useOptimistic with Inertia.js integration, automatically
 * handling synchronization between optimistic state and Inertia props.
 * 
 * It provides the same API as useOptimistic but with additional Inertia awareness:
 * - Detects if running in an Inertia context
 * - Automatically syncs with Inertia props on success/failure
 * - Doesn't interfere with Inertia's shared data
 * 
 * Requirements: 9.4
 * 
 * @param options - Configuration options for optimistic updates
 * @returns Object with execute method, pending operations, and Inertia context info
 * 
 * @example
 * ```tsx
 * function PublicationForm() {
 *   const { execute, hasPending, isInertia } = useInertiaOptimistic({
 *     resource: 'publications',
 *     onSuccess: (data) => {
 *       toast.success('Publication created!');
 *     },
 *   });
 * 
 *   const handleSubmit = async (formData) => {
 *     await execute(
 *       { ...formData, id: 'temp-id' }, // optimistic data
 *       () => api.createPublication(formData) // API call
 *     );
 *   };
 * 
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       {hasPending && <span>Saving...</span>}
 *       {isInertia && <span>Inertia mode</span>}
 *     </form>
 *   );
 * }
 * ```
 */
export function useInertiaOptimistic(options: OptimisticOptions) {
  // Get Inertia page context
  const page = usePage();
  
  // Check if we're in an Inertia context
  const isInertia = useMemo(() => isInertiaPage(), []);
  
  // Get current page component
  const pageComponent = useMemo(() => getInertiaPageComponent(), [page]);
  
  // Use the base optimistic hook
  // The Inertia sync is handled automatically in the optimistic store
  const optimistic = useOptimistic(options);
  
  // Get current props for the resource (if available)
  const resourceProps = useMemo(() => {
    if (!isInertia || !page.props) {
      return null;
    }
    
    // Try to get props for this resource
    const props = page.props as any;
    return props[options.resource] || null;
  }, [isInertia, page.props, options.resource]);
  
  // Check if resource data is available in Inertia props
  const hasResourceProps = resourceProps !== null;
  
  // Log Inertia context in development mode
  if (import.meta.env.DEV && isInertia) {
    console.log('[useInertiaOptimistic] Inertia context:', {
      resource: options.resource,
      pageComponent,
      hasResourceProps,
      propsKeys: page.props ? Object.keys(page.props) : [],
    });
  }
  
  return {
    ...optimistic,
    isInertia,
    pageComponent,
    resourceProps,
    hasResourceProps,
  };
}

/**
 * Hook to check if current page should use optimistic updates
 * 
 * Some pages might not benefit from optimistic updates (e.g., settings pages,
 * authentication pages). This hook provides a way to conditionally enable
 * optimistic updates based on the current page.
 * 
 * @param resource - The resource type
 * @returns true if optimistic updates should be enabled
 */
export function useShouldUseOptimistic(resource: string): boolean {
  const pageComponent = useMemo(() => getInertiaPageComponent(), []);
  
  // Pages where optimistic updates are beneficial
  const optimisticPages = [
    'ManageContent/Partials/ContentPage',
    'Content/Partials/ContentPage',
    'ManageContent/Publication',
    'Content/Publication',
    'ManageContent/Campaign',
    'Content/Campaign',
    'Reels/Index',
    'Calendar/Index',
  ];
  
  // Resources that benefit from optimistic updates
  const optimisticResources = [
    'publications',
    'campaigns',
    'reels',
    'calendar',
    'social-accounts',
  ];
  
  // Check if current page is in the optimistic pages list
  const isOptimisticPage = pageComponent 
    ? optimisticPages.some(page => pageComponent.includes(page))
    : false;
  
  // Check if resource is in the optimistic resources list
  const isOptimisticResource = optimisticResources.includes(resource);
  
  return isOptimisticPage && isOptimisticResource;
}

/**
 * Hook to get Inertia props for a specific resource
 * 
 * This is a convenience hook to access resource data from Inertia props
 * with proper typing and null safety.
 * 
 * @param resource - The resource type
 * @returns The resource data from Inertia props or null
 */
export function useInertiaResourceProps<T = any>(resource: string): T | null {
  const page = usePage();
  
  return useMemo(() => {
    if (!page.props) {
      return null;
    }
    
    const props = page.props as any;
    return props[resource] || null;
  }, [page.props, resource]);
}
