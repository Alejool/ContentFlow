import React, { useState } from "react";
import { OfflineIndicator } from "./OfflineIndicator";
import { PendingOperationsList } from "./PendingOperationsList";
import { OfflineDisabledWrapper } from "./OfflineDisabledWrapper";
import { useOfflineDisable } from "@/Hooks/useOfflineDisable";
import { X } from "lucide-react";

/**
 * OfflineDemo Component
 *
 * Demonstrates the usage of offline components:
 * - OfflineIndicator: Shows offline status banner
 * - PendingOperationsList: Shows list of pending operations
 * - OfflineDisabledWrapper: Disables features when offline
 * - useOfflineDisable: Hook for disabling individual elements
 *
 * This is a demo component for testing and documentation purposes.
 */
export const OfflineDemo: React.FC = () => {
  const [showModal, setShowModal] = useState(false);

  const { offlineProps: submitProps } = useOfflineDisable({
    requiresConnection: true,
    offlineMessage: "Submit requires internet connection",
  });

  const { offlineProps: streamProps } = useOfflineDisable({
    requiresConnection: true,
    offlineMessage: "Streaming requires internet connection",
  });

  return (
    <div className="space-y-8 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-2xl font-bold">Offline Components Demo</h1>

        {/* Example 1: Disabled button */}
        <section className="mb-8 rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold">Example 1: Disabled Button</h2>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            This button is automatically disabled when offline using the useOfflineDisable hook.
          </p>
          <button
            {...submitProps}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Submit Form
          </button>
        </section>

        {/* Example 2: Disabled wrapper */}
        <section className="mb-8 rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold">Example 2: Disabled Content Wrapper</h2>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            This video player is wrapped and disabled when offline with an overlay.
          </p>
          <OfflineDisabledWrapper
            requiresConnection={true}
            offlineMessage="Video streaming requires internet connection"
            showOfflineOverlay={true}
          >
            <div className="flex aspect-video items-center justify-center rounded-lg bg-gray-900">
              <button
                {...streamProps}
                className="rounded-lg bg-red-600 px-6 py-3 text-white hover:bg-red-700"
              >
                ▶ Play Video
              </button>
            </div>
          </OfflineDisabledWrapper>
        </section>

        {/* Example 3: Pending operations modal */}
        <section className="mb-8 rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold">Example 3: Pending Operations</h2>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Click the button to view pending operations in a modal.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
          >
            View Pending Operations
          </button>
        </section>

        {/* Instructions */}
        <section className="rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-900/20">
          <h3 className="mb-2 text-sm font-semibold text-blue-900 dark:text-blue-300">
            Testing Instructions
          </h3>
          <ol className="list-inside list-decimal space-y-1 text-sm text-blue-800 dark:text-blue-300">
            <li>Open DevTools (F12)</li>
            <li>Go to Network tab</li>
            <li>Toggle "Offline" checkbox</li>
            <li>Observe how components react to offline state</li>
            <li>Try clicking disabled buttons (they won't work)</li>
            <li>Go back online and see components re-enable</li>
          </ol>
        </section>
      </div>

      {/* Global offline indicator */}
      <OfflineIndicator />

      {/* Pending operations modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-white shadow-xl dark:bg-gray-800">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
              <h2 className="text-lg font-semibold">Pending Operations</h2>
              <button
                onClick={() => setShowModal(false)}
                className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal content */}
            <div className="flex-1 overflow-y-auto p-4">
              <PendingOperationsList />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
