import { useMemo } from 'react';
import useOptimisticStore from '../stores/optimisticStore';
import type { OptimisticOptions } from '../types/optimistic';
import { createNetworkError } from '../Utils/networkErrorHandler';
import { performanceMetrics } from '../Utils/performanceMetrics';

/**
 * Error type detection utilities
 */
interface ErrorWithResponse extends Error {
  response?: {
    status?: number;
    data?: any;
  };
  code?: string;
  status?: number;
}

/**
 * Detect error type based on error properties
 * Requirements: 3.2, 3.3
 */
function detectErrorType(error: ErrorWithResponse): 'network' | 'validation' | 'server' | 'unknown' {
  // Network errors (no response or connection issues)
  if (!error.response && (error.message?.includes('network') || error.message?.includes('fetch') || error.code === 'ECONNABORTED')) {
    return 'network';
  }
  
  // Check response status
  const status = error.response?.status || error.status;
  
  if (status) {
    // Validation errors (4xx client errors)
    if (status >= 400 && status < 500) {
      return 'validation';
    }
    
    // Server errors (5xx)
    if (status >= 500) {
      return 'server';
    }
  }
  
  return 'unknown';
}

/**
 * Check if error is retryable
 * Requirements: 3.2
 */
function isRetryableError(errorType: string, status?: number): boolean {
  // Network errors are always retryable
  if (errorType === 'network') {
    return true;
  }
  
  // Server errors are retryable
  if (errorType === 'server') {
    return true;
  }
  
  // Specific retryable status codes
  if (status === 408 || status === 429 || status === 503) {
    return true;
  }
  
  // Validation errors are not retryable
  return false;
}

/**
 * useOptimistic Hook - Provides optimistic update functionality
 * 
 * This hook connects components to the optimistic store and provides
 * methods to execute operations with optimistic updates.
 * 
 * Requirements: 1.1, 9.2
 * 
 * @param options - Configuration options for optimistic updates
 * @returns Object with execute method and pending operations info
 * 
 * @example
 * ```tsx
 * const { execute, pending, hasPending, metrics } = useOptimistic({
 *   resource: 'publications',
 *   onSuccess: (data) => ,
 *   onError: (error) => ,
 *   maxRetries: 3,
 * });
 * 
 * // Execute optimistic operation
 * await execute(
 *   { title: 'New Post', content: 'Hello' }, // optimistic data
 *   () => api.createPost({ title: 'New Post', content: 'Hello' }) // API call
 * );
 * 
 * // Check performance metrics
 * * * ```
 */
export function useOptimistic(options: OptimisticOptions) {
  // Connect to optimistic store
  const store = useOptimisticStore();
  
  // Performance metrics tracking
  // Requirements: 10.5
  const metrics = useMemo(() => {
    const allOps = Array.from(store.operations.values());
    const resourceOps = allOps.filter(op => op.resource === options.resource);
    const completedOps = resourceOps.filter(op => op.status === 'success' || op.status === 'failed');
    
    if (completedOps.length === 0) {
      return {
        totalOperations: 0,
        successCount: 0,
        failureCount: 0,
        successRate: 0,
        averageResponseTime: 0,
        averageOptimisticTime: 0,
      };
    }
    
    const successOps = completedOps.filter(op => op.status === 'success');
    const failedOps = completedOps.filter(op => op.status === 'failed');
    
    // Calculate average response time (server response)
    const totalResponseTime = completedOps.reduce((sum, op) => {
      if (op.completedAt) {
        return sum + (op.completedAt - op.timestamp);
      }
      return sum;
    }, 0);
    
    const averageResponseTime = totalResponseTime / completedOps.length;
    
    // Optimistic update time is essentially instant (< 1ms typically)
    // This represents the time to update the UI optimistically
    const averageOptimisticTime = 1; // Approximate
    
    return {
      totalOperations: completedOps.length,
      successCount: successOps.length,
      failureCount: failedOps.length,
      successRate: (successOps.length / completedOps.length) * 100,
      averageResponseTime: Math.round(averageResponseTime),
      averageOptimisticTime,
      timeSaved: Math.round(averageResponseTime - averageOptimisticTime),
    };
  }, [store.operations, options.resource]);
  
  // Get pending operations for this resource using useMemo for performance
  // This prevents unnecessary recalculations when store updates
  const pending = useMemo(
    () => store.getPendingOperations(options.resource),
    [store.operations, options.resource]
  );
  
  // Check if resource has pending operations
  const hasPending = pending.length > 0;
  
  /**
   * Execute an operation with optimistic update
   * 
   * This method:
   * 1. Generates a unique ID for the operation
   * 2. Updates UI immediately with optimistic data
   * 3. Executes the API call
   * 4. Confirms or reverts based on result
   * 5. Handles retries for network errors
   * 
   * Requirements: 1.1, 1.3, 1.4, 3.2, 3.3, 3.4
   * 
   * @param optimisticData - Data to show immediately in UI
   * @param apiCall - Function that returns a Promise with the API call
   * @param originalData - Original data before update (for rollback)
   * @returns Promise that resolves with server response
   */
  async function execute<T>(
    optimisticData: T,
    apiCall: () => Promise<T>,
    originalData?: T
  ): Promise<T> {
    // Generate unique ID for this operation
    const id = `${options.resource}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Determine operation type based on presence of originalData
    const operationType = originalData ? 'update' : 'create';
    
    // Get max retries from options or default to 3
    const maxRetries = options.maxRetries || 3;
    
    // Log operation start in development mode
    // Requirements: 10.1
    if (import.meta.env.DEV) {
      .toISOString());
      }
    
    // Add optimistic operation to store
    // This immediately updates the UI with optimistic data
    // Note: We create a dummy promise for the request field since the actual
    // execution happens in the retry loop below
    store.addOperation({
      id,
      type: operationType,
      resource: options.resource,
      optimisticData,
      originalData: originalData || null,
      request: Promise.resolve(optimisticData), // Placeholder promise
      status: 'pending',
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries,
      onSuccess: options.onSuccess,
      onError: options.onError,
      onRollback: options.onRollback,
    });
    
    // Retry logic with exponential backoff
    let retryCount = 0;
    let lastError: Error | null = null;
    
    while (retryCount <= maxRetries) {
      try {
        // Execute API call
        const startTime = Date.now();
        const result = await apiCall();
        const duration = Date.now() - startTime;
        
        // Track performance metrics
        // Requirements: 10.5
        performanceMetrics.trackMetric({
          resource: options.resource,
          operation: operationType,
          optimisticUpdateTime: 1, // Optimistic updates are essentially instant
          serverResponseTime: duration,
          success: true,
          retryCount,
        });
        
        // Log success in development mode
        // Requirements: 10.1, 10.5
        if (import.meta.env.DEV) {
          }
        
        // Confirm operation with server data
        store.confirmOperation(id, result);
        
        return result;
      } catch (error) {
        lastError = error as Error;
        const errorWithResponse = error as ErrorWithResponse;
        const duration = Date.now() - Date.now();
        
        // Detect error type
        const errorType = detectErrorType(errorWithResponse);
        const status = errorWithResponse.response?.status || errorWithResponse.status;
        
        // Log error in development mode
        // Requirements: 10.1
        if (import.meta.env.DEV) {
          }
        
        // Check if error is retryable
        const shouldRetry = options.retryOnError !== false && 
                           isRetryableError(errorType, status) && 
                           retryCount < maxRetries;
        
        if (shouldRetry) {
          // Increment retry count
          retryCount++;
          
          // Calculate exponential backoff delay (1s, 2s, 4s)
          const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 10000);
          
          if (import.meta.env.DEV) {
            }
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Continue to next iteration to retry
          continue;
        }
        
        // No more retries or error is not retryable
        // Move to failed operations queue if max retries exceeded
        if (retryCount >= maxRetries && errorType === 'network') {
          if (import.meta.env.DEV) {
            }
        }
        
        // Track performance metrics for failed operation
        // Requirements: 10.5
        const failedDuration = Date.now() - Date.now();
        performanceMetrics.trackMetric({
          resource: options.resource,
          operation: operationType,
          optimisticUpdateTime: 1,
          serverResponseTime: failedDuration,
          success: false,
          retryCount,
          error: lastError.message,
        });
        
        // Rollback operation
        store.rollbackOperation(id, lastError);
        
        // Re-throw error for caller to handle
        throw lastError;
      }
    }
    
    // This should never be reached, but TypeScript needs it
    throw lastError || new Error('Operation failed');
  }
  
  return {
    execute,
    pending,
    hasPending,
    metrics,
  };
}
