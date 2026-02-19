import React, { useEffect } from "react";
import { useOnlineStatus } from "@/Hooks/useOnlineStatus";
import { useOnboardingStore } from "@/stores/onboardingStore";

/**
 * OfflineIndicator component
 * Shows a banner when the user is offline and displays queued actions count
 */
export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const { isOffline, queuedActionsCount, setOfflineStatus } = useOnboardingStore();

  // Sync offline status with the store
  useEffect(() => {
    setOfflineStatus(!isOnline);
  }, [isOnline, setOfflineStatus]);

  // Don't show anything if online and no queued actions
  if (isOnline && queuedActionsCount === 0) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 rounded-lg px-4 py-3 shadow-lg transition-all ${
        isOffline
          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
          : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      }`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          {isOffline ? (
            <svg
              className="h-5 w-5"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              className="h-5 w-5"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">
            {isOffline ? "You're offline" : "Back online"}
          </p>
          {queuedActionsCount > 0 && (
            <p className="text-xs mt-1">
              {isOffline
                ? `${queuedActionsCount} action${queuedActionsCount > 1 ? "s" : ""} queued`
                : `Syncing ${queuedActionsCount} action${queuedActionsCount > 1 ? "s" : ""}...`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
