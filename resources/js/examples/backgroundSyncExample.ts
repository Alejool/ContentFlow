/**
 * Background Sync Manager Usage Example
 * 
 * This file demonstrates how to use the BackgroundSyncManager
 * to queue operations for background synchronization.
 */

import { backgroundSyncManager } from '../sw/syncManager';
import type { SyncOperation } from '../types/optimistic';

/**
 * Example 1: Register a simple sync operation
 * 
 * This shows how to queue an operation that will be executed
 * when the browser has connectivity.
 */
export async function registerSimpleSyncOperation() {
  const operation: SyncOperation = {
    id: `sync-${Date.now()}-${Math.random()}`,
    url: '/api/publications',
    method: 'POST',
    body: {
      title: 'New Publication',
      content: 'This was created offline',
    },
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
    },
    timestamp: Date.now(),
    retryCount: 0,
  };

  try {
    await backgroundSyncManager.registerSync(operation);
    console.log('Operation queued for background sync:', operation.id);
  } catch (error) {
    console.error('Failed to register sync operation:', error);
  }
}

/**
 * Example 2: Register multiple operations
 * 
 * Shows how to queue multiple operations that will be executed
 * in FIFO order (first-in, first-out).
 */
export async function registerMultipleOperations() {
  const operations: SyncOperation[] = [
    {
      id: `sync-1-${Date.now()}`,
      url: '/api/publications',
      method: 'POST',
      body: { title: 'First Publication' },
      headers: { 'Content-Type': 'application/json' },
      timestamp: Date.now(),
      retryCount: 0,
    },
    {
      id: `sync-2-${Date.now()}`,
      url: '/api/publications',
      method: 'POST',
      body: { title: 'Second Publication' },
      headers: { 'Content-Type': 'application/json' },
      timestamp: Date.now() + 1,
      retryCount: 0,
    },
    {
      id: `sync-3-${Date.now()}`,
      url: '/api/publications',
      method: 'POST',
      body: { title: 'Third Publication' },
      headers: { 'Content-Type': 'application/json' },
      timestamp: Date.now() + 2,
      retryCount: 0,
    },
  ];

  for (const operation of operations) {
    try {
      await backgroundSyncManager.registerSync(operation);
      console.log('Queued:', operation.id);
    } catch (error) {
      console.error('Failed to queue:', operation.id, error);
    }
  }
}

/**
 * Example 3: Get pending sync operations
 * 
 * Shows how to retrieve all operations waiting to be synced.
 */
export async function getPendingOperations() {
  try {
    const pending = await backgroundSyncManager.getPendingSyncs();
    console.log(`Found ${pending.length} pending operations:`, pending);
    return pending;
  } catch (error) {
    console.error('Failed to get pending operations:', error);
    return [];
  }
}

/**
 * Example 4: Retry failed operations
 * 
 * Shows how to manually retry operations that have failed.
 */
export async function retryFailedOperations() {
  try {
    await backgroundSyncManager.retryFailed();
    console.log('Retry initiated for failed operations');
  } catch (error) {
    console.error('Failed to retry operations:', error);
  }
}

/**
 * Example 5: Listen for sync operation failures
 * 
 * Shows how to listen for messages from the Service Worker
 * about failed sync operations.
 */
export function listenForSyncFailures() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SYNC_OPERATION_FAILED') {
        const { operation, error } = event.data;
        
        console.error('Sync operation failed:', operation.id);
        console.error('Error:', error.message);
        
        // Show user notification
        showNotification(
          'Sync Failed',
          `Operation ${operation.id} failed after 3 retries: ${error.message}`
        );
      }
    });
  }
}

/**
 * Example 6: Clear all sync operations
 * 
 * Shows how to clear all pending operations (use with caution).
 */
export async function clearAllOperations() {
  try {
    await backgroundSyncManager.clearAll();
    console.log('All sync operations cleared');
  } catch (error) {
    console.error('Failed to clear operations:', error);
  }
}

/**
 * Helper function to show notifications
 */
function showNotification(title: string, message: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body: message,
      icon: '/icons/icon-192x192.png',
    });
  } else {
    // Fallback to console or UI notification
    console.log(`[Notification] ${title}: ${message}`);
  }
}

/**
 * Example 7: Integration with offline detection
 * 
 * Shows how to automatically queue operations when offline.
 */
export async function createPublicationWithSync(publicationData: any) {
  const operation: SyncOperation = {
    id: `publication-${Date.now()}-${Math.random()}`,
    url: '/api/publications',
    method: 'POST',
    body: publicationData,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
    },
    timestamp: Date.now(),
    retryCount: 0,
  };

  if (!navigator.onLine) {
    // Offline - queue for background sync
    console.log('Offline detected, queueing operation for sync');
    await backgroundSyncManager.registerSync(operation);
    return { queued: true, id: operation.id };
  } else {
    // Online - try immediate execution, fallback to queue
    try {
      const response = await fetch(operation.url, {
        method: operation.method,
        headers: operation.headers,
        body: JSON.stringify(operation.body),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Immediate execution failed, queueing for sync:', error);
      await backgroundSyncManager.registerSync(operation);
      return { queued: true, id: operation.id };
    }
  }
}
