import React, { useState } from "react";
import { useOffline } from "@/Hooks/useOffline";
import { WifiOff, Wifi, ChevronDown, ChevronUp } from "lucide-react";

/**
 * OfflineIndicator Component
 *
 * Displays a banner when the user is offline with:
 * - Visual offline/online status
 * - Counter of pending operations
 * - Expandable details view
 *
 * Requirements: 6.1, 6.2, 6.4, 6.5
 */
export const OfflineIndicator: React.FC = () => {
  const { isOnline, pendingCount } = useOffline();
  const [isExpanded, setIsExpanded] = useState(false);

  // Don't show anything if online and no pending operations
  // Requirements: 6.1
  if (isOnline && pendingCount === 0) {
    return null;
  }

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      className="fixed bottom-4 right-4 z-50 max-w-md rounded-lg shadow-lg transition-all"
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Main Banner */}
      <div
        className={`rounded-lg px-4 py-3 ${
          !isOnline
            ? "border border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200"
            : "border border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200"
        }`}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="mt-0.5 flex-shrink-0">
            {!isOnline ? (
              <WifiOff className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Wifi className="h-5 w-5" aria-hidden="true" />
            )}
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{!isOnline ? "You're offline" : "Back online"}</p>

            {/* Pending operations counter - Requirements: 6.2, 6.4 */}
            {pendingCount > 0 && (
              <p className="mt-1 text-xs opacity-90">
                {!isOnline
                  ? `${pendingCount} operation${pendingCount !== 1 ? "s" : ""} queued`
                  : `Syncing ${pendingCount} operation${pendingCount !== 1 ? "s" : ""}...`}
              </p>
            )}
          </div>

          {/* Expand/Collapse button - Requirements: 6.5 */}
          {pendingCount > 0 && (
            <button
              onClick={handleToggleExpand}
              className="flex-shrink-0 rounded p-1 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              aria-label={isExpanded ? "Hide details" : "Show details"}
              aria-expanded={isExpanded}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Expanded Details - Requirements: 6.5 */}
      {isExpanded && pendingCount > 0 && (
        <div className="mt-2 rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="px-4 py-3">
            <p className="mb-2 text-xs font-medium text-gray-700 dark:text-gray-300">
              Pending Operations
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {!isOnline
                ? "These operations will be synced automatically when you're back online."
                : "Syncing operations in the background..."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
