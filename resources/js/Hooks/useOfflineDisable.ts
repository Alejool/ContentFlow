import { useOffline } from './useOffline';

/**
 * Options for useOfflineDisable hook
 */
interface UseOfflineDisableOptions {
  requiresConnection?: boolean;
  offlineMessage?: string;
}

/**
 * Return type for useOfflineDisable hook
 */
interface UseOfflineDisableReturn {
  isDisabled: boolean;
  disabledReason: string | null;
  offlineProps: {
    disabled: boolean;
    title?: string;
    'aria-disabled'?: boolean;
    'data-offline-disabled'?: boolean;
  };
}

/**
 * useOfflineDisable Hook
 * 
 * Provides utilities to disable features when offline.
 * Returns disabled state and props to spread on components.
 * 
 * Requirements: 6.3
 * 
 * @example
 * const { isDisabled, offlineProps } = useOfflineDisable({ requiresConnection: true });
 * 
 * return (
 *   <button {...offlineProps}>
 *     Submit
 *   </button>
 * );
 */
export function useOfflineDisable(
  options: UseOfflineDisableOptions = {}
): UseOfflineDisableReturn {
  const { isOnline } = useOffline();
  const {
    requiresConnection = false,
    offlineMessage = 'This feature requires an internet connection',
  } = options;

  // Determine if should be disabled
  const isDisabled = requiresConnection && !isOnline;
  const disabledReason = isDisabled ? offlineMessage : null;

  // Props to spread on components
  const offlineProps = {
    disabled: isDisabled,
    ...(isDisabled && {
      title: offlineMessage,
      'aria-disabled': true,
      'data-offline-disabled': true,
    }),
  };

  return {
    isDisabled,
    disabledReason,
    offlineProps,
  };
}
