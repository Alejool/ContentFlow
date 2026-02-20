/**
 * Background Sync Manager
 * 
 * Manages background synchronization of offline operations using Service Worker Sync API.
 * Implements exponential backoff retry logic and FIFO operation execution.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */

import type { SyncOperation } from '../types/optimistic';

const DB_NAME = 'background-sync-db';
const DB_VERSION = 1;
const STORE_NAME = 'sync-operations';

/**
 * BackgroundSyncManager Class
 * 
 * Handles registration, persistence, and execution of background sync operations.
 * Uses IndexedDB for persistence to survive page reloads and browser restarts.
 */
class BackgroundSyncManager {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize IndexedDB connection
   */
  private async init(): Promise<void> {
    if (this.db) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('[BackgroundSyncManager] Failed to open database:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        if (import.meta.env.DEV) {
          console.log('[BackgroundSyncManager] Database opened successfully');
        }
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          
          // Create indexes for efficient querying
          objectStore.createIndex('timestamp', 'timestamp', { unique: false });
          objectStore.createIndex('retryCount', 'retryCount', { unique: false });
          
          if (import.meta.env.DEV) {
            console.log('[BackgroundSyncManager] Object store created');
          }
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Register a sync operation
   * 
   * Adds an operation to the sync queue and persists it in IndexedDB.
   * Automatically registers a Service Worker sync event if available.
   * 
   * @param operation - The sync operation to register
   * @returns Promise that resolves when operation is registered
   * 
   * Requirements: 5.1, 5.2
   */
  async registerSync(operation: SyncOperation): Promise<void> {
    await this.init();

    if (!this.db) {
      throw new Error('[BackgroundSyncManager] Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(operation);

      request.onsuccess = () => {
        if (import.meta.env.DEV) {
          console.log('[BackgroundSyncManager] Operation registered:', operation.id);
        }
        
        // Register Service Worker sync if available
        this.registerServiceWorkerSync().catch((error) => {
          console.warn('[BackgroundSyncManager] Failed to register SW sync:', error);
        });
        
        resolve();
      };

      request.onerror = () => {
        console.error('[BackgroundSyncManager] Failed to register operation:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Register Service Worker sync event
   * 
   * Registers a 'sync-operations' tag with the Service Worker Sync API.
   * This will trigger the sync event when the browser has connectivity.
   */
  private async registerServiceWorkerSync(): Promise<void> {
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('sync-operations');
        
        if (import.meta.env.DEV) {
          console.log('[BackgroundSyncManager] SW sync registered');
        }
      } catch (error) {
        console.error('[BackgroundSyncManager] Failed to register SW sync:', error);
        throw error;
      }
    }
  }

  /**
   * Get all pending sync operations
   * 
   * Retrieves all operations from IndexedDB sorted by timestamp (FIFO).
   * 
   * @returns Promise that resolves to array of sync operations
   * 
   * Requirements: 5.4
   */
  async getPendingSyncs(): Promise<SyncOperation[]> {
    await this.init();

    if (!this.db) {
      throw new Error('[BackgroundSyncManager] Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('timestamp');
      const request = index.getAll();

      request.onsuccess = () => {
        const operations = request.result as SyncOperation[];
        // Sort by timestamp to ensure FIFO order
        operations.sort((a, b) => a.timestamp - b.timestamp);
        resolve(operations);
      };

      request.onerror = () => {
        console.error('[BackgroundSyncManager] Failed to get pending syncs:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Remove a sync operation from the queue
   * 
   * @param id - The operation ID to remove
   */
  private async removeOperation(id: string): Promise<void> {
    await this.init();

    if (!this.db) {
      throw new Error('[BackgroundSyncManager] Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        if (import.meta.env.DEV) {
          console.log('[BackgroundSyncManager] Operation removed:', id);
        }
        resolve();
      };

      request.onerror = () => {
        console.error('[BackgroundSyncManager] Failed to remove operation:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Update a sync operation
   * 
   * @param operation - The operation to update
   */
  private async updateOperation(operation: SyncOperation): Promise<void> {
    await this.init();

    if (!this.db) {
      throw new Error('[BackgroundSyncManager] Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(operation);

      request.onsuccess = () => {
        if (import.meta.env.DEV) {
          console.log('[BackgroundSyncManager] Operation updated:', operation.id);
        }
        resolve();
      };

      request.onerror = () => {
        console.error('[BackgroundSyncManager] Failed to update operation:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Execute sync operations
   * 
   * Executes all pending sync operations in FIFO order.
   * Called by the Service Worker sync event handler.
   * 
   * @param tag - The sync tag (should be 'sync-operations')
   * @returns Promise that resolves when all operations are processed
   * 
   * Requirements: 5.2, 5.4
   */
  async executeSync(tag: string): Promise<void> {
    if (tag !== 'sync-operations') {
      return;
    }

    if (import.meta.env.DEV) {
      console.log('[BackgroundSyncManager] Executing sync...');
    }

    const operations = await this.getPendingSyncs();

    if (operations.length === 0) {
      if (import.meta.env.DEV) {
        console.log('[BackgroundSyncManager] No operations to sync');
      }
      return;
    }

    // Execute operations in FIFO order
    for (const operation of operations) {
      try {
        await this.executeSingleOperation(operation);
        await this.removeOperation(operation.id);
        
        if (import.meta.env.DEV) {
          console.log('[BackgroundSyncManager] Operation completed:', operation.id);
        }
      } catch (error) {
        console.error('[BackgroundSyncManager] Operation failed:', operation.id, error);
        
        // Handle retry logic
        await this.handleOperationFailure(operation, error as Error);
      }
    }

    if (import.meta.env.DEV) {
      console.log('[BackgroundSyncManager] Sync completed');
    }
  }

  /**
   * Execute a single sync operation
   * 
   * Makes the HTTP request for a sync operation.
   * 
   * @param operation - The operation to execute
   * @returns Promise that resolves with the response
   */
  private async executeSingleOperation(operation: SyncOperation): Promise<Response> {
    const response = await fetch(operation.url, {
      method: operation.method,
      headers: operation.headers,
      body: operation.body ? JSON.stringify(operation.body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  }

  /**
   * Handle operation failure with exponential backoff retry
   * 
   * Implements exponential backoff retry logic (1s, 2s, 4s).
   * After maxRetries (3), marks operation as failed.
   * 
   * @param operation - The failed operation
   * @param error - The error that occurred
   * 
   * Requirements: 5.3
   */
  private async handleOperationFailure(operation: SyncOperation, error: Error): Promise<void> {
    const maxRetries = 3;
    const updatedOperation = {
      ...operation,
      retryCount: operation.retryCount + 1,
    };

    if (updatedOperation.retryCount >= maxRetries) {
      // Max retries reached - mark as failed and remove from queue
      console.error(
        '[BackgroundSyncManager] Max retries reached for operation:',
        operation.id,
        error
      );
      
      await this.removeOperation(operation.id);
      
      // Notify about failed operation (could be stored in a failed operations store)
      this.notifyOperationFailed(operation, error);
    } else {
      // Update retry count and keep in queue
      await this.updateOperation(updatedOperation);
      
      // Calculate exponential backoff delay: 1s, 2s, 4s
      const delay = Math.pow(2, updatedOperation.retryCount - 1) * 1000;
      
      if (import.meta.env.DEV) {
        console.log(
          `[BackgroundSyncManager] Retry ${updatedOperation.retryCount}/${maxRetries} for operation:`,
          operation.id,
          `(delay: ${delay}ms)`
        );
      }
      
      // Schedule retry by re-registering SW sync
      setTimeout(() => {
        this.registerServiceWorkerSync().catch((err) => {
          console.error('[BackgroundSyncManager] Failed to schedule retry:', err);
        });
      }, delay);
    }
  }

  /**
   * Notify about failed operation
   * 
   * Sends a message to all clients about the failed operation.
   * Clients can handle this to show user notifications.
   * 
   * @param operation - The failed operation
   * @param error - The error that occurred
   */
  private notifyOperationFailed(operation: SyncOperation, error: Error): void {
    // In Service Worker context, notify clients
    if (typeof self !== 'undefined' && 'clients' in self) {
      (self as any).clients.matchAll().then((clients: any[]) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'SYNC_OPERATION_FAILED',
            operation,
            error: {
              message: error.message,
              stack: error.stack,
            },
          });
        });
      });
    }
  }

  /**
   * Retry failed operations manually
   * 
   * Allows manual retry of operations that have failed.
   * Resets retry count and re-registers sync.
   * 
   * Requirements: 5.3
   */
  async retryFailed(): Promise<void> {
    const operations = await this.getPendingSyncs();
    
    // Reset retry counts
    for (const operation of operations) {
      if (operation.retryCount > 0) {
        await this.updateOperation({
          ...operation,
          retryCount: 0,
        });
      }
    }
    
    // Trigger sync
    await this.registerServiceWorkerSync();
    
    if (import.meta.env.DEV) {
      console.log('[BackgroundSyncManager] Failed operations retry initiated');
    }
  }

  /**
   * Clear all sync operations
   * 
   * Removes all operations from the queue.
   */
  async clearAll(): Promise<void> {
    await this.init();

    if (!this.db) {
      throw new Error('[BackgroundSyncManager] Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        if (import.meta.env.DEV) {
          console.log('[BackgroundSyncManager] All operations cleared');
        }
        resolve();
      };

      request.onerror = () => {
        console.error('[BackgroundSyncManager] Failed to clear operations:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
      
      if (import.meta.env.DEV) {
        console.log('[BackgroundSyncManager] Database closed');
      }
    }
  }
}

// Singleton instance
export const backgroundSyncManager = new BackgroundSyncManager();
