import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import axios, { AxiosInstance, AxiosError } from 'axios';
import { setupOptimisticInterceptor } from '../../../resources/js/plugins/optimisticAxios';
import useOptimisticStore from '../../../resources/js/stores/optimisticStore';

describe('OptimisticAxios Interceptor', () => {
  let axiosInstance: AxiosInstance;
  let cleanup: () => void;

  beforeEach(() => {
    // Create a fresh axios instance for each test
    axiosInstance = axios.create();
    
    // Setup the interceptor
    cleanup = setupOptimisticInterceptor(axiosInstance);
    
    // Clear the store
    const store = useOptimisticStore.getState();
    store.operations.clear();
    store.failedOperations.length = 0;
    localStorage.clear();
  });

  afterEach(() => {
    // Clean up interceptors
    if (cleanup) {
      cleanup();
    }
  });

  describe('Request Interceptor', () => {
    it('should register operation when optimistic flag is set', async () => {
      const optimisticData = { id: 'temp-1', title: 'Test Post' };
      
      try {
        await axiosInstance.post('/api/posts', { title: 'Test Post' }, {
          optimistic: true,
          optimisticData,
          resource: 'posts',
        });
      } catch (error) {
        // Expected to fail in test environment
      }

      const store = useOptimisticStore.getState();
      // Operation will be rolled back due to network error, check failed operations
      const allOps = [...Array.from(store.operations.values()), ...store.failedOperations];
      
      expect(allOps.length).toBeGreaterThan(0);
      expect(allOps[0].resource).toBe('posts');
      expect(allOps[0].type).toBe('create');
      expect(allOps[0].optimisticData).toEqual(optimisticData);
    });

    it('should not register operation when optimistic flag is false', async () => {
      try {
        await axiosInstance.post('/api/posts', { title: 'Test Post' });
      } catch (error) {
        // Expected to fail in test environment
      }

      const store = useOptimisticStore.getState();
      // No operation should be registered
      expect(store.operations.size).toBe(0);
      expect(store.failedOperations.length).toBe(0);
    });

    it('should detect operation type from HTTP method - POST', async () => {
      try {
        await axiosInstance.post('/api/posts', {}, {
          optimistic: true,
          optimisticData: { id: 'temp-1' },
          resource: 'posts',
        });
      } catch (error) {
        // Expected to fail
      }

      const store = useOptimisticStore.getState();
      const allOps = [...Array.from(store.operations.values()), ...store.failedOperations];
      expect(allOps[0].type).toBe('create');
    });

    it('should detect operation type from HTTP method - PUT', async () => {
      try {
        await axiosInstance.put('/api/posts/1', {}, {
          optimistic: true,
          optimisticData: { id: 1 },
          resource: 'posts',
        });
      } catch (error) {
        // Expected to fail
      }

      const store = useOptimisticStore.getState();
      const allOps = [...Array.from(store.operations.values()), ...store.failedOperations];
      expect(allOps[0].type).toBe('update');
    });

    it('should detect operation type from HTTP method - DELETE', async () => {
      try {
        await axiosInstance.delete('/api/posts/1', {
          optimistic: true,
          optimisticData: null,
          resource: 'posts',
        });
      } catch (error) {
        // Expected to fail
      }

      const store = useOptimisticStore.getState();
      const allOps = [...Array.from(store.operations.values()), ...store.failedOperations];
      expect(allOps[0].type).toBe('delete');
    });

    it('should use provided operation type over auto-detection', async () => {
      try {
        await axiosInstance.post('/api/posts', {}, {
          optimistic: true,
          optimisticData: { id: 'temp-1' },
          resource: 'posts',
          operationType: 'update',
        });
      } catch (error) {
        // Expected to fail
      }

      const store = useOptimisticStore.getState();
      const allOps = [...Array.from(store.operations.values()), ...store.failedOperations];
      expect(allOps[0].type).toBe('update');
    });
  });

  describe('Response Interceptor - Success', () => {
    it('should confirm operation on successful response', () => {
      // Manually test the store confirmation logic
      const operation = {
        id: 'test-op-1',
        type: 'create' as const,
        resource: 'posts',
        optimisticData: { id: 'temp-1', title: 'Test Post' },
        originalData: null,
        request: Promise.resolve({ id: 1, title: 'Test Post' }),
        status: 'pending' as const,
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: 3,
      };

      useOptimisticStore.getState().addOperation(operation);
      useOptimisticStore.getState().confirmOperation('test-op-1', { id: 1, title: 'Test Post' });

      const store = useOptimisticStore.getState();
      const op = store.operations.get('test-op-1');
      
      expect(op).toBeDefined();
      expect(op?.status).toBe('success');
      expect(op?.completedAt).toBeDefined();
    });

    it('should call onSuccess callback on successful response', () => {
      const onSuccess = vi.fn();
      
      const operation = {
        id: 'test-op-2',
        type: 'create' as const,
        resource: 'posts',
        optimisticData: { id: 'temp-1', title: 'Test Post' },
        originalData: null,
        request: Promise.resolve({ id: 1, title: 'Test Post' }),
        status: 'pending' as const,
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: 3,
        onSuccess,
      };

      useOptimisticStore.getState().addOperation(operation);
      const serverData = { id: 1, title: 'Test Post' };
      useOptimisticStore.getState().confirmOperation('test-op-2', serverData);

      expect(onSuccess).toHaveBeenCalledWith(serverData);
    });
  });

  describe('Response Interceptor - Error', () => {
    it('should rollback operation on error response', async () => {
      try {
        await axiosInstance.post('/api/posts', { title: 'Test Post' }, {
          optimistic: true,
          optimisticData: { id: 'temp-1', title: 'Test Post' },
          resource: 'posts',
        });
      } catch (error) {
        // Expected to throw
      }

      const store = useOptimisticStore.getState();
      // Operation should be rolled back
      expect(store.operations.size).toBe(0);
      expect(store.failedOperations.length).toBe(1);
      expect(store.failedOperations[0].status).toBe('failed');
    });

    it('should call onError callback on error response', async () => {
      const onError = vi.fn();
      
      try {
        await axiosInstance.post('/api/posts', { title: 'Test Post' }, {
          optimistic: true,
          optimisticData: { id: 'temp-1', title: 'Test Post' },
          resource: 'posts',
          onError,
        });
      } catch (error) {
        // Expected to throw
      }

      expect(onError).toHaveBeenCalled();
    });

    it('should call onRollback callback on error response', async () => {
      const onRollback = vi.fn();
      
      try {
        await axiosInstance.post('/api/posts', { title: 'Test Post' }, {
          optimistic: true,
          optimisticData: { id: 'temp-1', title: 'Test Post' },
          resource: 'posts',
          onRollback,
        });
      } catch (error) {
        // Expected to throw
      }

      expect(onRollback).toHaveBeenCalled();
    });

    it('should handle validation errors (422)', () => {
      // Test the store's error handling directly
      const operation = {
        id: 'test-op-3',
        type: 'create' as const,
        resource: 'posts',
        optimisticData: { id: 'temp-1' },
        originalData: null,
        request: Promise.resolve({}),
        status: 'pending' as const,
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: 3,
      };

      useOptimisticStore.getState().addOperation(operation);
      
      const error = {
        message: 'Validation failed',
        response: {
          status: 422,
          data: {
            message: 'Validation failed',
            errors: { title: ['Title is required'] },
          },
        },
      } as any;
      
      useOptimisticStore.getState().rollbackOperation('test-op-3', error);

      const store = useOptimisticStore.getState();
      expect(store.failedOperations.length).toBeGreaterThan(0);
      const failedOp = store.failedOperations.find(op => op.id === 'test-op-3');
      expect(failedOp?.error?.details?.errors).toBeDefined();
    });

    it('should handle server errors (500)', async () => {
      try {
        await axiosInstance.post('/api/posts', { title: 'Test' }, {
          optimistic: true,
          optimisticData: { id: 'temp-1', title: 'Test' },
          resource: 'posts',
        });
      } catch (error) {
        // Expected to throw
      }

      const store = useOptimisticStore.getState();
      expect(store.failedOperations.length).toBeGreaterThan(0);
    });

    it('should handle network errors', async () => {
      try {
        await axiosInstance.post('/api/posts', { title: 'Test' }, {
          optimistic: true,
          optimisticData: { id: 'temp-1', title: 'Test' },
          resource: 'posts',
        });
      } catch (error) {
        // Expected to throw
      }

      const store = useOptimisticStore.getState();
      expect(store.failedOperations.length).toBeGreaterThan(0);
    });

    it('should not rollback when rollbackOnError is false', async () => {
      try {
        await axiosInstance.post('/api/posts', { title: 'Test' }, {
          optimistic: true,
          optimisticData: { id: 'temp-1', title: 'Test' },
          resource: 'posts',
          rollbackOnError: false,
        });
      } catch (error) {
        // Expected to throw
      }

      const store = useOptimisticStore.getState();
      // Operation should still be in pending state (not rolled back)
      expect(store.operations.size).toBeGreaterThan(0);
      // Should not be in failed operations
      const hasFailed = Array.from(store.failedOperations).some(
        op => op.optimisticData?.id === 'temp-1'
      );
      expect(hasFailed).toBe(false);
    });
  });

  describe('Cleanup', () => {
    it('should remove interceptors when cleanup is called', async () => {
      // Make a request with optimistic flag
      try {
        await axiosInstance.post('/api/posts', {}, {
          optimistic: true,
          optimisticData: { id: 'temp-1' },
          resource: 'posts',
        });
      } catch (error) {
        // Expected to fail
      }

      let store = useOptimisticStore.getState();
      const initialOpsCount = store.operations.size + store.failedOperations.length;
      expect(initialOpsCount).toBeGreaterThan(0);

      // Clear store and call cleanup
      store.operations.clear();
      store.failedOperations.length = 0;
      cleanup();

      // Make another request - should not register operation
      try {
        await axiosInstance.post('/api/posts', {}, {
          optimistic: true,
          optimisticData: { id: 'temp-2' },
          resource: 'posts',
        });
      } catch (error) {
        // Expected to fail
      }

      store = useOptimisticStore.getState();
      // No new operations should be registered after cleanup
      expect(store.operations.size).toBe(0);
      expect(store.failedOperations.length).toBe(0);
    });
  });
});
