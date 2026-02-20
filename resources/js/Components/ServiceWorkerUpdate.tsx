/**
 * ServiceWorkerUpdate Component
 * 
 * Shows a notification when a new service worker version is available
 */

import React from 'react';
import { useServiceWorker } from '../hooks/useServiceWorker';

export function ServiceWorkerUpdate() {
  const { hasUpdate, updateServiceWorker } = useServiceWorker();

  if (!hasUpdate) {
    return null;
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-50 max-w-sm rounded-lg bg-white p-4 shadow-lg ring-1 ring-black ring-opacity-5"
      role="alert"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-6 w-6 text-blue-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-gray-900">
            Nueva versión disponible
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Una nueva versión de la aplicación está lista. Actualiza para obtener las últimas mejoras.
          </p>
          <div className="mt-3 flex space-x-3">
            <button
              type="button"
              onClick={updateServiceWorker}
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Actualizar ahora
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
