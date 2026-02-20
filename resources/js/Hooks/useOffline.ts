import { useState, useEffect, useCallback } from 'react';
import type { OfflineOptions, QueuedOperation } from '../types/optimistic';
import { indexedDBQueue } from '../Utils/indexedDBQueue';

/**
 * useOffline Hook - Manages offline state and operation queue
 * 
 * This hook provides:
 * - Online/offline state detection
 * - Pending operations counter
 * - Queue management for offline operations
 * - Manual sync trigger
 * 
 * Requirements: 5.1, 5.2, 6.1, 6.2, 6.4
 */
export function useOffline(options?: OfflineOptions) {
  // State: Track online/offline status
  // Requirements: 6.1, 6.2
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  
  // State: Track pending operations count
  // Requirements: 6.4
  const [pendingCount, setPendingCount] = useState<number>(0);

  // Update pending count from IndexedDB
  const updatePendingCount = useCallback(async () => {
    try {
      const operations = await indexedDBQueue.getAll();
      const pending = operations.filter(op => op.status === 'queued' || op.status === 'syncing');
      setPendingCount(pending.length);
    } catch (error) {
      console.error('[useOffline] Failed to update pending count:', error);
      setPendingCount(0);
    }
  }, []);

  // Effect: Listen to online/offline events
  // Requirements: 6.1, 6.2
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      
      if (import.meta.env.DEV) {
        console.log('[useOffline] Connection restored');
      }
      
      // Execute onOnline callback
      options?.onOnline?.();
      
      // Auto-sync if enabled
      if (options?.syncOnReconnect) {
        syncNow();
      }
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      
      if (import.meta.env.DEV) {
        console.log('[useOffline] Connection lost');
      }
      
      // Execute onOffline callback
      options?.onOffline?.();
    };
    
    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initialize pending count
    updatePendingCount();
    
    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [options, updatePendingCount]);

  /**
   * Queue an operation for offline execution
   * Requirements: 5.1
   */
  const queueOperation = useCallback(async (operation: QueuedOperation): Promise<void> => {
    try {
      // Ensure operation has required fields
      const queuedOp: QueuedOperation = {
        ...operation,
        status: operation.status || 'queued',
        timestamp: operation.timestamp || Date.now(),
        retryCount: operation.retryCount || 0,
        maxRetries: operation.maxRetries || 3,
        priority: operation.priority || 0,
      };
      
      // Add to IndexedDB
      await indexedDBQueue.add(queuedOp);
      
      // Update pending count
      await updatePendingCount();
      
      if (import.meta.env.DEV) {
        console.log('[useOffline] Operation queued:', {
          id: queuedOp.id,
          resource: queuedOp.resource,
          method: queuedOp.method,
        });
      }
    } catch (error) {
      console.error('[useOffline] Failed to queue operation:', error);
      throw error;
    }
  }, [updatePendingCount]);
  
  /**
   * Get all queued operations
   * Requirements: 5.1
   */
  const getQueuedOperations = useCallback(async (): Promise<QueuedOperation[]> => {
    try {
      const operations = await indexedDBQueue.getAll();
      
      // Sort by timestamp (FIFO)
      return operations.sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
      console.error('[useOffline] Failed to get queued operations:', error);
      return [];
    }
  }, []);
  
  /**
   * Manually trigger sync
   * Requirements: 5.2, 6.2
   */
  const syncNow = useCallback(async (): Promise<void> => {
    if (!isOnline) {
      if (import.meta.env.DEV) {
        console.warn('[useOffline] Cannot sync while offline');
      }
      return;
    }

    try {
      // Get all queued operations
      const operations = await indexedDBQueue.getByStatus('queued');
      
      if (operations.length === 0) {
        if (import.meta.env.DEV) {
          console.log('[useOffline] No operations to sync');
        }
        return;
      }

      if (import.meta.env.DEV) {
        console.log('[useOffline] Starting sync:', operations.length, 'operations');
      }

      // Import axios dynamically to avoid circular dependencies
      const { default: axiosInstance } = await import('../config/axios');

      // Process operations in order (FIFO)
      for (const operation of operations) {
        try {
          // Mark as syncing
          await indexedDBQueue.update({
            ...operation,
            status: 'syncing',
          });

          // Execute the API call
          await axiosInstance({
            method: operation.method,
            url: operation.url,
            data: operation.body,
            headers: operation.headers,
          });

          // Mark as completed and remove from queue
          await indexedDBQueue.remove(operation.id);

          if (import.meta.env.DEV) {
            console.log('[useOffline] Operation synced successfully:', operation.id);
          }
        } catch (error) {
          console.error('[useOffline] Failed to sync operation:', operation.id, error);

          // Increment retry count
          const updatedOp: QueuedOperation = {
            ...operation,
            retryCount: operation.retryCount + 1,
            lastError: error instanceof Error ? error.message : 'Unknown error',
            failedAt: Date.now(),
          };

          // Check if max retries reached
          if (updatedOp.retryCount >= updatedOp.maxRetries) {
            // Mark as failed
            updatedOp.status = 'failed';
            await indexedDBQueue.update(updatedOp);

            if (import.meta.env.DEV) {
              console.error('[useOffline] Operation failed after max retries:', operation.id);
            }
          } else {
            // Reset to queued for retry
            updatedOp.status = 'queued';
            await indexedDBQueue.update(updatedOp);

            if (import.meta.env.DEV) {
              console.log('[useOffline] Operation queued for retry:', operation.id, 
                `(${updatedOp.retryCount}/${updatedOp.maxRetries})`);
            }
          }
        }
      }

      // Update pending count after sync
      await updatePendingCount();

      if (import.meta.env.DEV) {
        console.log('[useOffline] Sync completed');
      }
    } catch (error) {
      console.error('[useOffline] Sync failed:', error);
      throw error;
    }
  }, [isOnline, updatePendingCount]);
  
  /**
   * Clear failed operations
   * Requirements: 5.2, 6.2
   */
  const clearFailed = useCallback(async (): Promise<void> => {
    try {
      // Get all failed operations
      const failedOps = await indexedDBQueue.getByStatus('failed');
      
      if (import.meta.env.DEV) {
        console.log('[useOffline] Clearing failed operations:', failedOps.length);
      }

      // Remove each failed operation
      for (const op of failedOps) {
        await indexedDBQueue.remove(op.id);
      }

      // Update pending count
      await updatePendingCount();

      if (import.meta.env.DEV) {
        console.log('[useOffline] Failed operations cleared');
      }
    } catch (error) {
      console.error('[useOffline] Failed to clear failed operations:', error);
      throw error;
    }
  }, [updatePendingCount]);

  return {
    isOnline,
    pendingCount,
    queueOperation,
    getQueuedOperations,
    syncNow,
    clearFailed,
  };
}
