/**
 * Axios Interceptor for Optimistic Updates
 * 
 * This plugin intercepts axios requests and responses to automatically handle
 * optimistic updates. When a request is marked as optimistic, it:
 * 1. Registers the operation in the Optimistic Store
 * 2. Updates the UI immediately with optimistic data
 * 3. Confirms or rolls back based on server response
 * 
 * Requirements: 9.3, 3.3
 */

import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import useOptimisticStore from '../stores/optimisticStore';
import type { OptimisticOperation } from '../types/optimistic';

/**
 * Configuration interface for the optimistic interceptor
 */
export interface InterceptorConfig {
  /** Enable optimistic updates for this request */
  optimistic?: boolean;
  
  /** Data to show optimistically in the UI */
  optimisticData?: any;
  
  /** Resource type (e.g., 'posts', 'reels', 'publications') */
  resource?: string;
  
  /** Whether to rollback on error (default: true) */
  rollbackOnError?: boolean;
  
  /** Original data before update (for rollback) */
  originalData?: any;
  
  /** Operation type (auto-detected from HTTP method if not provided) */
  operationType?: 'create' | 'update' | 'delete';
  
  /** Resource ID (for update/delete operations) */
  resourceId?: string | number;
  
  /** Maximum retry attempts for network errors */
  maxRetries?: number;
  
  /** Callbacks */
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  onRollback?: () => void;
}

/**
 * Map to track operation IDs by request
 * This allows us to match responses with their corresponding operations
 */
const requestOperationMap = new Map<string, string>();

/**
 * Generate a unique key for a request
 */
function getRequestKey(config: AxiosRequestConfig): string {
  return `${config.method}-${config.url}-${Date.now()}-${Math.random()}`;
}

/**
 * Detect operation type from HTTP method
 */
function detectOperationType(method?: string): 'create' | 'update' | 'delete' {
  const m = method?.toUpperCase();
  if (m === 'POST') return 'create';
  if (m === 'PUT' || m === 'PATCH') return 'update';
  if (m === 'DELETE') return 'delete';
  return 'create'; // default
}

/**
 * Setup optimistic interceptors on an axios instance
 * 
 * @param axiosInstance - The axios instance to configure
 * @returns Cleanup function to remove interceptors
 */
export function setupOptimisticInterceptor(axiosInstance: AxiosInstance): () => void {
  // Request interceptor
  const requestInterceptorId = axiosInstance.interceptors.request.use(
    (config) => {
      // Check if this request should use optimistic updates
      if (config.optimistic && config.resource) {
        const requestKey = getRequestKey(config);
        const operationId = `${config.resource}-${Date.now()}-${Math.random()}`;
        
        // Store the mapping
        requestOperationMap.set(requestKey, operationId);
        
        // Attach operation ID to config for response interceptor
        (config as any).__optimisticId = operationId;
        (config as any).__requestKey = requestKey;
        
        // Detect operation type if not provided
        const operationType = config.operationType || detectOperationType(config.method);
        
        // Create optimistic operation
        const operation: OptimisticOperation = {
          id: operationId,
          type: operationType,
          resource: config.resource,
          resourceId: config.resourceId,
          optimisticData: config.optimisticData,
          originalData: config.originalData || null,
          request: Promise.resolve(config.optimisticData), // Placeholder promise
          status: 'pending',
          timestamp: Date.now(),
          retryCount: 0,
          maxRetries: config.maxRetries || 3,
          onSuccess: config.onSuccess,
          onError: config.onError,
          onRollback: config.onRollback,
        };
        
        // Register operation in store
        useOptimisticStore.getState().addOperation(operation);
        
        // Log in development mode
        if (import.meta.env.DEV) {
          }
      }
      
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor
  const responseInterceptorId = axiosInstance.interceptors.response.use(
    (response) => {
      // Check if this response corresponds to an optimistic operation
      const config = response.config as any;
      const operationId = config.__optimisticId;
      const requestKey = config.__requestKey;
      
      if (operationId && requestKey) {
        // Confirm the operation with server data
        useOptimisticStore.getState().confirmOperation(operationId, response.data);
        
        // Clean up mapping
        requestOperationMap.delete(requestKey);
        
        // Log in development mode
        if (import.meta.env.DEV) {
          }
      }
      
      return response;
    },
    (error: AxiosError) => {
      // Check if this error corresponds to an optimistic operation
      const config = error.config as any;
      const operationId = config?.__optimisticId;
      const requestKey = config?.__requestKey;
      
      if (operationId && requestKey) {
        const rollbackOnError = config.rollbackOnError !== false; // Default to true
        
        if (rollbackOnError) {
          // Rollback the operation
          useOptimisticStore.getState().rollbackOperation(operationId, error);
          
          // Clean up mapping
          requestOperationMap.delete(requestKey);
          
          // Log in development mode
          if (import.meta.env.DEV) {
            }
        }
      }
      
      return Promise.reject(error);
    }
  );

  // Return cleanup function
  return () => {
    axiosInstance.interceptors.request.eject(requestInterceptorId);
    axiosInstance.interceptors.response.eject(responseInterceptorId);
    requestOperationMap.clear();
  };
}

/**
 * Default export for convenience
 */
export default setupOptimisticInterceptor;
