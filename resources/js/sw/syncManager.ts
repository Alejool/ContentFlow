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

class BackgroundSyncManager {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  private async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        this.db = request.result;
        if (import.meta.env.DEV) console.log('[BackgroundSyncManager] IndexedDB initialized');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, {
            keyPath: 'id',
          });
          objectStore.createIndex('timestamp', 'timestamp', { unique: false });
          objectStore.createIndex('retryCount', 'retryCount', {
            unique: false,
          });
          if (import.meta.env.DEV) console.log('[BackgroundSyncManager] Object store created');
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Register a sync operation
   * Requirements: 5.1, 5.2
   */
  async registerSync(operation: SyncOperation): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('[BackgroundSyncManager] Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(operation);

      request.onsuccess = () => {
        if (import.meta.env.DEV)
          console.log(`[BackgroundSyncManager] Registered sync: ${operation.id}`);
        this.registerServiceWorkerSync().catch((error) => {
          if (import.meta.env.DEV)
            console.warn('[BackgroundSyncManager] SW sync registration failed:', error);
        });
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  private async registerServiceWorkerSync(): Promise<void> {
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('sync-operations');
        if (import.meta.env.DEV) console.log('[BackgroundSyncManager] SW sync registered');
      } catch (error) {
        throw error;
      }
    }
  }

  /**
   * Get all pending sync operations sorted by timestamp (FIFO)
   * Requirements: 5.4
   */
  async getPendingSyncs(): Promise<SyncOperation[]> {
    await this.init();
    if (!this.db) throw new Error('[BackgroundSyncManager] Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('timestamp');
      const request = index.getAll();

      request.onsuccess = () => {
        const operations = request.result as SyncOperation[];
        operations.sort((a, b) => a.timestamp - b.timestamp);
        resolve(operations);
      };

      request.onerror = () => reject(request.error);
    });
  }

  private async removeOperation(id: string): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('[BackgroundSyncManager] Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        if (import.meta.env.DEV) console.log(`[BackgroundSyncManager] Removed operation: ${id}`);
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  private async updateOperation(operation: SyncOperation): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('[BackgroundSyncManager] Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(operation);

      request.onsuccess = () => {
        if (import.meta.env.DEV)
          console.log(`[BackgroundSyncManager] Updated operation: ${operation.id}`);
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Execute all pending sync operations in FIFO order
   * Requirements: 5.2, 5.4
   */
  async executeSync(tag: string): Promise<void> {
    if (tag !== 'sync-operations') return;

    if (import.meta.env.DEV) console.log('[BackgroundSyncManager] Executing sync...');

    const operations = await this.getPendingSyncs();

    if (operations.length === 0) {
      if (import.meta.env.DEV) console.log('[BackgroundSyncManager] No pending operations');
      return;
    }

    for (const operation of operations) {
      try {
        await this.executeSingleOperation(operation);
        await this.removeOperation(operation.id);
        if (import.meta.env.DEV) console.log(`[BackgroundSyncManager] Synced: ${operation.id}`);
      } catch (error) {
        await this.handleOperationFailure(operation, error as Error);
      }
    }

    if (import.meta.env.DEV) console.log('[BackgroundSyncManager] Sync complete');
  }

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
   * Handle operation failure with exponential backoff retry (1s, 2s, 4s)
   * Requirements: 5.3
   */
  private async handleOperationFailure(operation: SyncOperation, error: Error): Promise<void> {
    const maxRetries = 3;
    const updatedOperation = {
      ...operation,
      retryCount: operation.retryCount + 1,
    };

    if (updatedOperation.retryCount >= maxRetries) {
      await this.removeOperation(operation.id);
      this.notifyOperationFailed(operation, error);
    } else {
      await this.updateOperation(updatedOperation);
      const delay = Math.pow(2, updatedOperation.retryCount - 1) * 1000;

      if (import.meta.env.DEV) {
        console.log(
          `[BackgroundSyncManager] Retry ${updatedOperation.retryCount}/${maxRetries} for ${operation.id} in ${delay}ms`,
        );
      }

      setTimeout(() => {
        this.registerServiceWorkerSync().catch((err) => {
          if (import.meta.env.DEV)
            console.warn('[BackgroundSyncManager] Retry registration failed:', err);
        });
      }, delay);
    }
  }

  private notifyOperationFailed(operation: SyncOperation, error: Error): void {
    if (typeof self !== 'undefined' && 'clients' in self) {
      (self as any).clients.matchAll().then((clients: any[]) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'SYNC_OPERATION_FAILED',
            operation,
            error: { message: error.message, stack: error.stack },
          });
        });
      });
    }
  }

  /**
   * Retry failed operations manually
   * Requirements: 5.3
   */
  async retryFailed(): Promise<void> {
    const operations = await this.getPendingSyncs();

    for (const operation of operations) {
      if (operation.retryCount > 0) {
        await this.updateOperation({ ...operation, retryCount: 0 });
      }
    }

    await this.registerServiceWorkerSync();
    if (import.meta.env.DEV)
      console.log('[BackgroundSyncManager] Retry triggered for failed operations');
  }

  async clearAll(): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('[BackgroundSyncManager] Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        if (import.meta.env.DEV) console.log('[BackgroundSyncManager] All operations cleared');
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
      if (import.meta.env.DEV) console.log('[BackgroundSyncManager] Connection closed');
    }
  }
}

// Singleton instance
export const backgroundSyncManager = new BackgroundSyncManager();
