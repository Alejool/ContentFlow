import { describe, it, expect, beforeEach, vi } from 'vitest';
import useOptimisticStore from '../../../resources/js/stores/optimisticStore';
import type { OptimisticOperation } from '../../../resources/js/types/optimistic';

describe('OptimisticStore', () => {
  beforeEach(() => {
    // Clear the store before each test
    const store = useOptimisticStore.getState();
    store.operations.clear();
    store.failedOperations.length = 0;
    localStorage.clear();
  });

  describe('addOperation', () => {
    it('should add an operation to the store', () => {
      const operation: OptimisticOperation = {
        id: 'test-1',
        type: 'create',
        resource: 'posts',
        optimisticData: { title: 'Test Post' },
        originalData: null,
        request: Promise.resolve({ id: 1, title: 'Test Post' }),
        status: 'pending',
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: 3,
      };

      useOptimisticStore.getState().addOperation(operation);
      
      // Get fresh state after operation
      const store = useOptimisticStore.getState();
      expect(store.operations.has('test-1')).toBe(true);
      expect(store.operations.get('test-1')).toEqual(operation);
    });

    it('should persist operation to localStorage', () => {
      const operation: OptimisticOperation = {
        id: 'test-2',
        type: 'update',
        resource: 'reels',
        optimisticData: { title: 'Updated Reel' },
        originalData: { title: 'Original Reel' },
        request: Promise.resolve({ id: 2, title: 'Updated Reel' }),
        status: 'pending',
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: 3,
      };

      useOptimisticStore.getState().addOperation(operation);

      const stored = localStorage.getItem('optimistic-operations');
      expect(stored).toBeTruthy();
      
      const parsed = JSON.parse(stored!);
      expect(parsed.operations).toHaveLength(1);
      expect(parsed.operations[0][0]).toBe('test-2');
    });
  });

  describe('confirmOperation', () => {
    it('should mark operation as success', () => {
      const operation: OptimisticOperation = {
        id: 'test-3',
        type: 'create',
        resource: 'publications',
        optimisticData: { content: 'Test' },
        originalData: null,
        request: Promise.resolve({ id: 3, content: 'Test' }),
        status: 'pending',
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: 3,
      };

      useOptimisticStore.getState().addOperation(operation);
      useOptimisticStore.getState().confirmOperation('test-3', { id: 3, content: 'Test' });

      // Get fresh state after operation
      const store = useOptimisticStore.getState();
      const confirmedOp = store.operations.get('test-3');
      expect(confirmedOp?.status).toBe('success');
      expect(confirmedOp?.completedAt).toBeDefined();
    });

    it('should call onSuccess callback', () => {
      const onSuccess = vi.fn();
      
      const operation: OptimisticOperation = {
        id: 'test-4',
        type: 'create',
        resource: 'posts',
        optimisticData: { title: 'Test' },
        originalData: null,
        request: Promise.resolve({ id: 4, title: 'Test' }),
        status: 'pending',
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: 3,
        onSuccess,
      };

      useOptimisticStore.getState().addOperation(operation);
      const serverData = { id: 4, title: 'Test' };
      useOptimisticStore.getState().confirmOperation('test-4', serverData);

      expect(onSuccess).toHaveBeenCalledWith(serverData);
    });
  });

  describe('rollbackOperation', () => {
    it('should remove operation and add to failed queue', () => {
      const operation: OptimisticOperation = {
        id: 'test-5',
        type: 'delete',
        resource: 'posts',
        optimisticData: null,
        originalData: { id: 5, title: 'To Delete' },
        request: Promise.resolve({}), // Changed to resolve to avoid unhandled rejection
        status: 'pending',
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: 3,
      };

      useOptimisticStore.getState().addOperation(operation);
      
      // Get fresh state after adding
      let store = useOptimisticStore.getState();
      expect(store.operations.has('test-5')).toBe(true);

      const error = new Error('Server error');
      useOptimisticStore.getState().rollbackOperation('test-5', error);

      // Get fresh state after rollback
      store = useOptimisticStore.getState();
      expect(store.operations.has('test-5')).toBe(false);
      expect(store.failedOperations).toHaveLength(1);
      expect(store.failedOperations[0].status).toBe('failed');
      expect(store.failedOperations[0].error?.message).toBe('Server error');
    });

    it('should call onError and onRollback callbacks', () => {
      const onError = vi.fn();
      const onRollback = vi.fn();
      
      const operation: OptimisticOperation = {
        id: 'test-6',
        type: 'update',
        resource: 'reels',
        optimisticData: { title: 'Updated' },
        originalData: { title: 'Original' },
        request: Promise.resolve({}), // Changed to resolve to avoid unhandled rejection
        status: 'pending',
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: 3,
        onError,
        onRollback,
      };

      useOptimisticStore.getState().addOperation(operation);
      const error = new Error('Failed');
      useOptimisticStore.getState().rollbackOperation('test-6', error);

      expect(onError).toHaveBeenCalledWith(error);
      expect(onRollback).toHaveBeenCalled();
    });
  });

  describe('getPendingOperations', () => {
    it('should return only pending operations for a resource', () => {
      const op1: OptimisticOperation = {
        id: 'test-7',
        type: 'create',
        resource: 'posts',
        optimisticData: { title: 'Post 1' },
        originalData: null,
        request: Promise.resolve({}),
        status: 'pending',
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: 3,
      };

      const op2: OptimisticOperation = {
        id: 'test-8',
        type: 'create',
        resource: 'posts',
        optimisticData: { title: 'Post 2' },
        originalData: null,
        request: Promise.resolve({}),
        status: 'pending',
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: 3,
      };

      const op3: OptimisticOperation = {
        id: 'test-9',
        type: 'create',
        resource: 'reels',
        optimisticData: { title: 'Reel 1' },
        originalData: null,
        request: Promise.resolve({}),
        status: 'pending',
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: 3,
      };

      useOptimisticStore.getState().addOperation(op1);
      useOptimisticStore.getState().addOperation(op2);
      useOptimisticStore.getState().addOperation(op3);

      const store = useOptimisticStore.getState();
      const postsPending = store.getPendingOperations('posts');
      expect(postsPending).toHaveLength(2);
      expect(postsPending.every(op => op.resource === 'posts')).toBe(true);

      const reelsPending = store.getPendingOperations('reels');
      expect(reelsPending).toHaveLength(1);
      expect(reelsPending[0].resource).toBe('reels');
    });

    it('should not return confirmed operations', () => {
      const operation: OptimisticOperation = {
        id: 'test-10',
        type: 'create',
        resource: 'posts',
        optimisticData: { title: 'Test' },
        originalData: null,
        request: Promise.resolve({}),
        status: 'pending',
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: 3,
      };

      useOptimisticStore.getState().addOperation(operation);
      useOptimisticStore.getState().confirmOperation('test-10', {});

      const store = useOptimisticStore.getState();
      const pending = store.getPendingOperations('posts');
      expect(pending).toHaveLength(0);
    });
  });

  describe('persist and restore', () => {
    it('should persist and restore operations', () => {
      const operation: OptimisticOperation = {
        id: 'test-11',
        type: 'create',
        resource: 'posts',
        optimisticData: { title: 'Persisted Post' },
        originalData: null,
        request: Promise.resolve({}),
        status: 'pending',
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: 3,
      };

      useOptimisticStore.getState().addOperation(operation);
      useOptimisticStore.getState().persist();

      // Clear the store
      useOptimisticStore.getState().operations.clear();
      let store = useOptimisticStore.getState();
      expect(store.operations.size).toBe(0);

      // Restore
      useOptimisticStore.getState().restore();
      store = useOptimisticStore.getState();
      expect(store.operations.size).toBe(1);
      expect(store.operations.has('test-11')).toBe(true);
    });

    it('should persist and restore failed operations', () => {
      const operation: OptimisticOperation = {
        id: 'test-12',
        type: 'create',
        resource: 'posts',
        optimisticData: { title: 'Failed Post' },
        originalData: null,
        request: Promise.resolve({}), // Changed to resolve to avoid unhandled rejection
        status: 'pending',
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: 3,
      };

      useOptimisticStore.getState().addOperation(operation);
      useOptimisticStore.getState().rollbackOperation('test-12', new Error('Failed'));
      useOptimisticStore.getState().persist();

      // Clear the store
      useOptimisticStore.getState().failedOperations.length = 0;
      let store = useOptimisticStore.getState();
      expect(store.failedOperations).toHaveLength(0);

      // Restore
      useOptimisticStore.getState().restore();
      store = useOptimisticStore.getState();
      expect(store.failedOperations).toHaveLength(1);
      expect(store.failedOperations[0].id).toBe('test-12');
    });
  });
});
