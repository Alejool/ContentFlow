import React, { useState } from 'react';
import { OfflineIndicator } from './OfflineIndicator';
import { PendingOperationsList } from './PendingOperationsList';
import { OfflineDisabledWrapper } from './OfflineDisabledWrapper';
import { useOfflineDisable } from '@/Hooks/useOfflineDisable';
import { X } from 'lucide-react';

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
    offlineMessage: 'Submit requires internet connection',
  });

  const { offlineProps: streamProps } = useOfflineDisable({
    requiresConnection: true,
    offlineMessage: 'Streaming requires internet connection',
  });

  return (
    <div className="p-8 space-y-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Offline Components Demo</h1>

        {/* Example 1: Disabled button */}
        <section className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Example 1: Disabled Button</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            This button is automatically disabled when offline using the useOfflineDisable hook.
          </p>
          <button
            {...submitProps}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit Form
          </button>
        </section>

        {/* Example 2: Disabled wrapper */}
        <section className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Example 2: Disabled Content Wrapper</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            This video player is wrapped and disabled when offline with an overlay.
          </p>
          <OfflineDisabledWrapper
            requiresConnection={true}
            offlineMessage="Video streaming requires internet connection"
            showOfflineOverlay={true}
          >
            <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
              <button
                {...streamProps}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                ▶ Play Video
              </button>
            </div>
          </OfflineDisabledWrapper>
        </section>

        {/* Example 3: Pending operations modal */}
        <section className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Example 3: Pending Operations</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Click the button to view pending operations in a modal.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            View Pending Operations
          </button>
        </section>

        {/* Instructions */}
        <section className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
            Testing Instructions
          </h3>
          <ol className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-decimal list-inside">
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold">Pending Operations</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal content */}
            <div className="p-4 overflow-y-auto flex-1">
              <PendingOperationsList />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
