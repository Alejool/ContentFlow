// @ts-ignore - CASL React module resolution issue in Docker environment
import { createContextualCan } from '@casl/react';
import { usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';
import type { AppAbility } from './ability';
import { defineAbilityFor } from './ability';

// Create context
export const AbilityContext = createContext<AppAbility>(undefined!);

// Create Can component for declarative permission checks
export const Can = createContextualCan(AbilityContext.Consumer);

interface AbilityProviderProps {
  children: ReactNode;
}

/**
 * AbilityProvider component
 *
 * Wraps the application and provides CASL ability context
 * to all child components.
 *
 * Usage:
 * ```tsx
 * <AbilityProvider>
 *   <App />
 * </AbilityProvider>
 * ```
 */
export function AbilityProvider({ children }: AbilityProviderProps) {
  const { auth } = usePage<any>().props ?? {};
  const ability = defineAbilityFor(auth?.user, auth?.current_workspace);

  return <AbilityContext.Provider value={ability}>{children}</AbilityContext.Provider>;
}

/**
 * useAbility hook
 *
 * Returns the current ability instance for programmatic permission checks.
 *
 * Usage:
 * ```tsx
 * const ability = useAbility();
 *
 * if (ability.can('update', 'Publication')) {
 *   // Show edit button
 * }
 * ```
 */
export function useAbility() {
  const context = useContext(AbilityContext);

  if (context === undefined) {
    throw new Error('useAbility must be used within an AbilityProvider');
  }

  return context;
}

/**
 * Example usage in components:
 *
 * 1. Declarative (using Can component):
 * ```tsx
 * import { Can } from '@/Contexts/AbilityContext';
 *
 * function MyComponent() {
 *   return (
 *     <Can I="update" a="Publication">
 *       <button>Edit</button>
 *     </Can>
 *   );
 * }
 * ```
 *
 * 2. Programmatic (using useAbility hook):
 * ```tsx
 * import { useAbility } from '@/Contexts/AbilityContext';
 *
 * function MyComponent() {
 *   const ability = useAbility();
 *
 *   return (
 *     <>
 *       {ability.can('publish', 'Publication') && (
 *         <button>Publish</button>
 *       )}
 *     </>
 *   );
 * }
 * ```
 *
 * 3. With conditions:
 * ```tsx
 * const canEdit = ability.can('update', 'Publication', { user_id: currentUserId });
 * ```
 */
