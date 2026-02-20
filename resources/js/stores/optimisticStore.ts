import { create } from 'zustand';
import type { OptimisticOperation, OptimisticState } from '../types/optimistic';
import { errorLogger } from '../Utils/errorLogger';
import { syncWithInertia } from '../utils/inertiaOptimisticSync';

/**
 * Optimistic Store - Manages optimistic updates with rollback capability
 * 
 * This store maintains a queue of pending operations and provides methods to:
 * - Add optimistic operations
 * - Confirm successful operations
 * - Rollback failed operations
 * - Persist and restore state from localStorage
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */
const useOptimisticStore = create<OptimisticState>((set, get) => ({
  // State
  operations: new Map<string, OptimisticOperation>(),
  failedOperations: [],
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,

  // Actions
  
  /**
   * Add a new optimistic operation to the queue
   * Requirements: 2.1, 9.4
   */
  addOperation: (operation: OptimisticOperation) => {
    set((state) => {
      const newOps = new Map(state.operations);
      newOps.set(operation.id, operation);
      
      // Log in development mode
      if (import.meta.env.DEV) {
        }
      
      return { operations: newOps };
    });
    
    // Sync with Inertia.js state (Requirements: 9.4)
    syncWithInertia(operation, 'pending');
    
    // Auto-persist after adding operation
    get().persist();
  },

  /**
   * Confirm an operation as successful and update with server data
   * Requirements: 2.2, 9.4
   */
  confirmOperation: (id: string, serverData: any) => {
    set((state) => {
      const newOps = new Map(state.operations);
      const op = newOps.get(id);
      
      if (op) {
        const updatedOp: OptimisticOperation = {
          ...op,
          status: 'success',
          completedAt: Date.now(),
        };
        newOps.set(id, updatedOp);
        
        // Log in development mode
        if (import.meta.env.DEV) {
          }
        
        // Sync with Inertia.js state (Requirements: 9.4)
        syncWithInertia(updatedOp, 'success', serverData);
        
        // Execute success callback if provided
        if (op.onSuccess) {
          try {
            op.onSuccess(serverData);
          } catch (error) {
            }
        }
      }
      
      return { operations: newOps };
    });
    
    // Auto-persist after confirming operation
    get().persist();
  },

  /**
   * Rollback a failed operation and move it to failed queue
   * Requirements: 2.3, 3.5, 9.4, 10.3
   */
  rollbackOperation: (id: string, error: Error) => {
    set((state) => {
      const newOps = new Map(state.operations);
      const op = newOps.get(id);
      
      if (op) {
        // Remove from pending operations
        newOps.delete(id);
        
        // Create failed operation record
        const failedOp: OptimisticOperation = {
          ...op,
          status: 'failed',
          completedAt: Date.now(),
          error: {
            message: error.message,
            code: (error as any).code,
            details: (error as any).response?.data,
          },
        };
        
        // Log comprehensive error details
        // Requirements: 3.5, 10.3
        errorLogger.logError(error, {
          type: 'optimistic',
          operation: `${op.type}_${op.resource}`,
          resource: op.resource,
          resourceId: op.resourceId,
          data: {
            optimisticData: op.optimisticData,
            originalData: op.originalData,
            retryCount: op.retryCount,
            duration: failedOp.completedAt! - op.timestamp,
          },
          severity: 'error',
        });
        
        // Log in development mode
        if (import.meta.env.DEV) {
          }
        
        // Sync with Inertia.js state (Requirements: 9.4)
        syncWithInertia(failedOp, 'failed');
        
        // Execute error callback if provided
        if (op.onError) {
          try {
            op.onError(error);
          } catch (callbackError) {
            errorLogger.logError(callbackError as Error, {
              type: 'optimistic',
              operation: 'callback_error',
              resource: op.resource,
              severity: 'warning',
            });
          }
        }
        
        // Execute rollback callback if provided
        if (op.onRollback) {
          try {
            op.onRollback();
          } catch (callbackError) {
            errorLogger.logError(callbackError as Error, {
              type: 'optimistic',
              operation: 'callback_error',
              resource: op.resource,
              severity: 'warning',
            });
          }
        }
        
        return {
          operations: newOps,
          failedOperations: [...state.failedOperations, failedOp],
        };
      }
      
      return state;
    });
    
    // Auto-persist after rollback
    get().persist();
  },

  /**
   * Get all pending operations for a specific resource
   * Requirements: 2.1
   */
  getPendingOperations: (resource: string) => {
    const ops = Array.from(get().operations.values());
    return ops.filter((op) => op.resource === resource && op.status === 'pending');
  },

  /**
   * Persist current state to localStorage
   * Requirements: 2.4
   */
  persist: () => {
    try {
      const state = get();
      
      // Convert Map to array for serialization
      const operationsArray = Array.from(state.operations.entries());
      
      // Serialize operations (excluding non-serializable fields like Promise)
      const serializedOps = operationsArray.map(([id, op]) => [
        id,
        {
          id: op.id,
          type: op.type,
          resource: op.resource,
          resourceId: op.resourceId,
          optimisticData: op.optimisticData,
          originalData: op.originalData,
          status: op.status,
          timestamp: op.timestamp,
          completedAt: op.completedAt,
          retryCount: op.retryCount,
          maxRetries: op.maxRetries,
          error: op.error,
          // Note: callbacks and request promise are not persisted
        },
      ]);
      
      const dataToStore = {
        operations: serializedOps,
        failedOperations: state.failedOperations.map((op) => ({
          id: op.id,
          type: op.type,
          resource: op.resource,
          resourceId: op.resourceId,
          optimisticData: op.optimisticData,
          originalData: op.originalData,
          status: op.status,
          timestamp: op.timestamp,
          completedAt: op.completedAt,
          retryCount: op.retryCount,
          maxRetries: op.maxRetries,
          error: op.error,
        })),
        timestamp: Date.now(),
      };
      
      localStorage.setItem('optimistic-operations', JSON.stringify(dataToStore));
      
      if (import.meta.env.DEV) {
        }
    } catch (error) {
      }
  },

  /**
   * Restore state from localStorage
   * Requirements: 2.5
   */
  restore: () => {
    try {
      const stored = localStorage.getItem('optimistic-operations');
      
      if (stored) {
        const data = JSON.parse(stored);
        
        // Convert array back to Map
        const operationsMap = new Map<string, OptimisticOperation>(
          data.operations.map(([id, op]: [string, any]) => [
            id,
            {
              ...op,
              // Create a resolved promise for restored operations
              request: Promise.resolve(op.optimisticData),
            },
          ])
        );
        
        set({
          operations: operationsMap,
          failedOperations: data.failedOperations || [],
        });
        
        if (import.meta.env.DEV) {
          - data.timestamp,
          });
        }
      }
    } catch (error) {
      }
  },
}));

// Restore state on initialization
if (typeof window !== 'undefined') {
  useOptimisticStore.getState().restore();
}

export default useOptimisticStore;
