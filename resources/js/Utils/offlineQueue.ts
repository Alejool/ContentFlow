/**
 * Offline queue manager for onboarding actions
 * Queues actions when offline and syncs when connection is restored
 */

export interface QueuedAction {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  retries: number;
}

const QUEUE_STORAGE_KEY = "onboarding_offline_queue";
const MAX_RETRIES = 3;

class OfflineQueueManager {
  private queue: QueuedAction[] = [];
  private isSyncing = false;

  constructor() {
    this.loadQueue();
  }

  /**
   * Load queue from localStorage
   */
  private loadQueue(): void {
    try {
      const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      console.error("Failed to load offline queue", error);
      this.queue = [];
    }
  }

  /**
   * Save queue to localStorage
   */
  private saveQueue(): void {
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error("Failed to save offline queue", error);
    }
  }

  /**
   * Add an action to the queue
   */
  enqueue(type: string, payload: any): string {
    const action: QueuedAction = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      payload,
      timestamp: Date.now(),
      retries: 0,
    };

    this.queue.push(action);
    this.saveQueue();
    return action.id;
  }

  /**
   * Remove an action from the queue
   */
  dequeue(id: string): void {
    this.queue = this.queue.filter((action) => action.id !== id);
    this.saveQueue();
  }

  /**
   * Get all queued actions
   */
  getQueue(): QueuedAction[] {
    return [...this.queue];
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * Clear the entire queue
   */
  clear(): void {
    this.queue = [];
    this.saveQueue();
  }

  /**
   * Sync queued actions with the backend
   * @param syncFn Function to execute each queued action
   */
  async sync(
    syncFn: (action: QueuedAction) => Promise<void>
  ): Promise<{ success: number; failed: number }> {
    if (this.isSyncing || this.queue.length === 0) {
      return { success: 0, failed: 0 };
    }

    this.isSyncing = true;
    let successCount = 0;
    let failedCount = 0;

    // Process queue in order
    const actionsToProcess = [...this.queue];

    for (const action of actionsToProcess) {
      try {
        await syncFn(action);
        this.dequeue(action.id);
        successCount++;
      } catch (error) {
        console.error(`Failed to sync action ${action.id}`, error);
        
        // Increment retry count
        action.retries++;
        
        // Remove if max retries reached
        if (action.retries >= MAX_RETRIES) {
          console.error(
            `Action ${action.id} exceeded max retries, removing from queue`
          );
          this.dequeue(action.id);
          failedCount++;
        } else {
          // Update the action in the queue
          const index = this.queue.findIndex((a) => a.id === action.id);
          if (index !== -1) {
            this.queue[index] = action;
            this.saveQueue();
          }
          failedCount++;
        }
      }
    }

    this.isSyncing = false;
    return { success: successCount, failed: failedCount };
  }

  /**
   * Check if currently syncing
   */
  isSyncInProgress(): boolean {
    return this.isSyncing;
  }
}

// Singleton instance
export const offlineQueue = new OfflineQueueManager();
