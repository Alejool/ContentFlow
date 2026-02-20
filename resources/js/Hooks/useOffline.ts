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
      setPendingCount(0);
    }
  }, []);

  // Effect: Listen to online/offline events
  // Requirements: 6.1, 6.2
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      
      if (import.meta.env.DEV) {
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
        }
    } catch (error) {
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
        }
      return;
    }

    try {
      // Get all queued operations
      const operations = await indexedDBQueue.getByStatus('queued');
      
      if (operations.length === 0) {
        if (import.meta.env.DEV) {
          }
        return;
      }

      if (import.meta.env.DEV) {
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
            }
        } catch (error) {
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
              }
          } else {
            // Reset to queued for retry
            updatedOp.status = 'queued';
            await indexedDBQueue.update(updatedOp);

            if (import.meta.env.DEV) {
              `);
            }
          }
        }
      }

      // Update pending count after sync
      await updatePendingCount();

      if (import.meta.env.DEV) {
        }
    } catch (error) {
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
        }

      // Remove each failed operation
      for (const op of failedOps) {
        await indexedDBQueue.remove(op.id);
      }

      // Update pending count
      await updatePendingCount();

      if (import.meta.env.DEV) {
        }
    } catch (error) {
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
