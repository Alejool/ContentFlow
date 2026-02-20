import type { QueuedOperation } from '../types/optimistic';

/**
 * IndexedDB Queue Manager
 * 
 * Manages offline operations queue using IndexedDB for persistence.
 * Provides better storage capacity and performance than localStorage.
 * 
 * Requirements: 5.1
 */

const DB_NAME = 'offline-queue-db';
const DB_VERSION = 1;
const STORE_NAME = 'operations';

// Batch operation configuration for better performance
const BATCH_CONFIG = {
  MAX_BATCH_SIZE: 50, // Maximum operations per batch
  BATCH_DELAY: 100, // Delay in ms before processing batch
};

class IndexedDBQueue {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;
  private pendingBatch: QueuedOperation[] = [];
  private batchTimeout: number | null = null;

  /**
   * Initialize IndexedDB connection
   */
  private async init(): Promise<void> {
    if (this.db) return;
    
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('[IndexedDBQueue] Failed to open database:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        if (import.meta.env.DEV) {
          console.log('[IndexedDBQueue] Database opened successfully');
        }
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          
          // Create indexes for efficient querying
          objectStore.createIndex('status', 'status', { unique: false });
          objectStore.createIndex('timestamp', 'timestamp', { unique: false });
          objectStore.createIndex('resource', 'resource', { unique: false });
          objectStore.createIndex('priority', 'priority', { unique: false });
          
          if (import.meta.env.DEV) {
            console.log('[IndexedDBQueue] Object store created');
          }
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Process pending batch operations
   */
  private async processBatch(): Promise<void> {
    if (this.pendingBatch.length === 0) return;
    
    const batch = [...this.pendingBatch];
    this.pendingBatch = [];
    this.batchTimeout = null;
    
    await this.init();
    
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      let completed = 0;
      let errors = 0;
      
      for (const operation of batch) {
        const request = store.add(operation);
        
        request.onsuccess = () => {
          completed++;
          if (completed + errors === batch.length) {
            if (import.meta.env.DEV) {
              console.log(`[IndexedDBQueue] Batch processed: ${completed} succeeded, ${errors} failed`);
            }
            resolve();
          }
        };
        
        request.onerror = () => {
          errors++;
          console.error('[IndexedDBQueue] Failed to add operation in batch:', request.error);
          if (completed + errors === batch.length) {
            resolve(); // Still resolve to continue processing
          }
        };
      }
    });
  }

  /**
   * Add operation to queue with batching
   */
  async add(operation: QueuedOperation): Promise<void> {
    // Add to pending batch
    this.pendingBatch.push(operation);
    
    // Process immediately if batch is full
    if (this.pendingBatch.length >= BATCH_CONFIG.MAX_BATCH_SIZE) {
      if (this.batchTimeout !== null) {
        clearTimeout(this.batchTimeout);
      }
      return this.processBatch();
    }
    
    // Schedule batch processing
    if (this.batchTimeout === null) {
      this.batchTimeout = window.setTimeout(() => {
        this.processBatch();
      }, BATCH_CONFIG.BATCH_DELAY);
    }
  }

  /**
   * Add multiple operations in a single transaction (optimized)
   */
  async addBatch(operations: QueuedOperation[]): Promise<void> {
    await this.init();
    
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      let completed = 0;
      
      for (const operation of operations) {
        const request = store.add(operation);
        
        request.onsuccess = () => {
          completed++;
          if (completed === operations.length) {
            if (import.meta.env.DEV) {
              console.log(`[IndexedDBQueue] Batch added: ${operations.length} operations`);
            }
            resolve();
          }
        };
        
        request.onerror = () => {
          console.error('[IndexedDBQueue] Failed to add operation in batch:', request.error);
          reject(request.error);
        };
      }
    });
  }

  /**
   * Get all operations from queue
   */
  async getAll(): Promise<QueuedOperation[]> {
    await this.init();
    
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        console.error('[IndexedDBQueue] Failed to get operations:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get operations by status
   */
  async getByStatus(status: QueuedOperation['status']): Promise<QueuedOperation[]> {
    await this.init();
    
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('status');
      const request = index.getAll(status);

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        console.error('[IndexedDBQueue] Failed to get operations by status:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Update operation in queue
   */
  async update(operation: QueuedOperation): Promise<void> {
    await this.init();
    
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(operation);

      request.onsuccess = () => {
        if (import.meta.env.DEV) {
          console.log('[IndexedDBQueue] Operation updated:', operation.id);
        }
        resolve();
      };

      request.onerror = () => {
        console.error('[IndexedDBQueue] Failed to update operation:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Remove operation from queue
   */
  async remove(id: string): Promise<void> {
    await this.init();
    
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        if (import.meta.env.DEV) {
          console.log('[IndexedDBQueue] Operation removed:', id);
        }
        resolve();
      };

      request.onerror = () => {
        console.error('[IndexedDBQueue] Failed to remove operation:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Clear all operations from queue
   */
  async clear(): Promise<void> {
    await this.init();
    
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        if (import.meta.env.DEV) {
          console.log('[IndexedDBQueue] Queue cleared');
        }
        resolve();
      };

      request.onerror = () => {
        console.error('[IndexedDBQueue] Failed to clear queue:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get queue size
   */
  async count(): Promise<number> {
    await this.init();
    
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.count();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('[IndexedDBQueue] Failed to count operations:', request.error);
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
        console.log('[IndexedDBQueue] Database closed');
      }
    }
  }
}

// Singleton instance
export const indexedDBQueue = new IndexedDBQueue();
