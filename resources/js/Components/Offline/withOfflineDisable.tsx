import React, { ComponentType } from 'react';
import { useOffline } from '@/Hooks/useOffline';

/**
 * Props for components wrapped with withOfflineDisable
 */
interface WithOfflineDisableProps {
  requiresConnection?: boolean;
  offlineTooltip?: string;
  disabledClassName?: string;
}

/**
 * Higher-Order Component to disable features when offline
 * 
 * Wraps a component and automatically disables it when offline if requiresConnection is true.
 * Adds visual feedback and tooltip to indicate why the feature is disabled.
 * 
 * Requirements: 6.3
 * 
 * @example
 * const OfflineAwareButton = withOfflineDisable(Button);
 * <OfflineAwareButton requiresConnection={true} offlineTooltip="This feature requires internet">
 *   Click me
 * </OfflineAwareButton>
 */
export function withOfflineDisable<P extends object>(
  Component: ComponentType<P & { disabled?: boolean; title?: string; className?: string }>
) {
  return function OfflineDisabledComponent(
    props: P & WithOfflineDisableProps
  ) {
    const { isOnline } = useOffline();
    const {
      requiresConnection = false,
      offlineTooltip = 'This feature requires an internet connection',
      disabledClassName = 'opacity-50 cursor-not-allowed',
      ...restProps
    } = props;

    // If component doesn't require connection, render normally
    if (!requiresConnection) {
      return <Component {...(restProps as P)} />;
    }

    // Determine if should be disabled
    const shouldDisable = !isOnline;

    // Merge className with disabled styles
    const className = shouldDisable
      ? `${(restProps as any).className || ''} ${disabledClassName}`.trim()
      : (restProps as any).className;

    return (
      <Component
        {...(restProps as P)}
        disabled={shouldDisable || (restProps as any).disabled}
        title={shouldDisable ? offlineTooltip : (restProps as any).title}
        className={className}
      />
    );
  };
}
