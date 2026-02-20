import React, { ReactNode } from 'react';
import { useOfflineDisable } from '@/Hooks/useOfflineDisable';
import { WifiOff } from 'lucide-react';

/**
 * Props for OfflineDisabledWrapper component
 */
interface OfflineDisabledWrapperProps {
  children: ReactNode;
  requiresConnection?: boolean;
  offlineMessage?: string;
  showOfflineOverlay?: boolean;
  className?: string;
}

/**
 * OfflineDisabledWrapper Component
 * 
 * Wraps content and visually disables it when offline.
 * Optionally shows an overlay with offline message.
 * 
 * Requirements: 6.3
 * 
 * @example
 * <OfflineDisabledWrapper requiresConnection={true} showOfflineOverlay={true}>
 *   <VideoPlayer />
 * </OfflineDisabledWrapper>
 */
export const OfflineDisabledWrapper: React.FC<OfflineDisabledWrapperProps> = ({
  children,
  requiresConnection = false,
  offlineMessage = 'This feature requires an internet connection',
  showOfflineOverlay = true,
  className = '',
}) => {
  const { isDisabled, disabledReason } = useOfflineDisable({
    requiresConnection,
    offlineMessage,
  });

  // If not disabled, render children normally
  if (!isDisabled) {
    return <>{children}</>;
  }

  // Render with disabled styling and optional overlay
  return (
    <div className={`relative ${className}`}>
      {/* Disabled content */}
      <div
        className="pointer-events-none opacity-50 select-none"
        aria-disabled="true"
        title={disabledReason || undefined}
      >
        {children}
      </div>

      {/* Offline overlay */}
      {showOfflineOverlay && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/10 dark:bg-gray-900/30 backdrop-blur-[1px] rounded-lg">
          <div className="flex flex-col items-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <WifiOff className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center max-w-xs">
              {disabledReason}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
