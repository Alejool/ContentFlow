import React, { ReactNode } from "react";
import { useOfflineDisable } from "@/Hooks/useOfflineDisable";
import { WifiOff } from "lucide-react";

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
  offlineMessage = "This feature requires an internet connection",
  showOfflineOverlay = true,
  className = "",
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
        className="pointer-events-none select-none opacity-50"
        aria-disabled="true"
        title={disabledReason || undefined}
      >
        {children}
      </div>

      {/* Offline overlay */}
      {showOfflineOverlay && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-gray-900/10 backdrop-blur-[1px] dark:bg-gray-900/30">
          <div className="flex flex-col items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
            <WifiOff className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <p className="max-w-xs text-center text-xs font-medium text-gray-700 dark:text-gray-300">
              {disabledReason}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
