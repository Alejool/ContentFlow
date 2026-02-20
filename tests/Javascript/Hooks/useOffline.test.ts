import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useOffline } from '../../../resources/js/Hooks/useOffline';
import type { QueuedOperation } from '../../../resources/js/types/optimistic';

// Mock the indexedDBQueue module
vi.mock('../../../resources/js/Utils/indexedDBQueue', () => ({
  indexedDBQueue: {
    add: vi.fn().mockResolvedValue(undefined),
    getAll: vi.fn().mockResolvedValue([]),
    getByStatus: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
    count: vi.fn().mockResolvedValue(0),
  },
}));

describe('useOffline Hook', () => {
  beforeEach(() => {
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Connectivity Detection (Subtask 8.1)', () => {
    it('should initialize with online status from navigator', () => {
      const { result } = renderHook(() => useOffline());
      
      expect(result.current.isOnline).toBe(true);
    });

    it('should detect when going offline', async () => {
      const { result } = renderHook(() => useOffline());
      
      expect(result.current.isOnline).toBe(true);
      
      // Simulate going offline
      act(() => {
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          value: false,
        });
        window.dispatchEvent(new Event('offline'));
      });
      
      await waitFor(() => {
        expect(result.current.isOnline).toBe(false);
      });
    });

    it('should detect when coming back online', async () => {
      // Start offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });
      
      const { result } = renderHook(() => useOffline());
      
      expect(result.current.isOnline).toBe(false);
      
      // Simulate coming online
      act(() => {
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          value: true,
        });
        window.dispatchEvent(new Event('online'));
      });
      
      await waitFor(() => {
        expect(result.current.isOnline).toBe(true);
      });
    });

    it('should call onOnline callback when connection is restored', async () => {
      const onOnline = vi.fn();
      
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });
      
      renderHook(() => useOffline({ onOnline }));
      
      // Simulate coming online
      act(() => {
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          value: true,
        });
        window.dispatchEvent(new Event('online'));
      });
      
      await waitFor(() => {
        expect(onOnline).toHaveBeenCalled();
      });
    });

    it('should call onOffline callback when connection is lost', async () => {
      const onOffline = vi.fn();
      
      renderHook(() => useOffline({ onOffline }));
      
      // Simulate going offline
      act(() => {
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          value: false,
        });
        window.dispatchEvent(new Event('offline'));
      });
      
      await waitFor(() => {
        expect(onOffline).toHaveBeenCalled();
      });
    });

    it('should initialize pending count to 0', () => {
      const { result } = renderHook(() => useOffline());
      
      expect(result.current.pendingCount).toBe(0);
    });
  });

  describe('Queue Operations (Subtask 8.2)', () => {
    it('should queue an operation', async () => {
      const { indexedDBQueue } = await import('../../../resources/js/Utils/indexedDBQueue');
      const { result } = renderHook(() => useOffline());
      
      const operation: QueuedOperation = {
        id: 'test-op-1',
        url: '/api/test',
        method: 'POST',
        headers: {},
        body: { test: 'data' },
        resource: 'test',
        description: 'Test operation',
        timestamp: Date.now(),
        priority: 0,
        retryCount: 0,
        maxRetries: 3,
        status: 'queued',
      };
      
      await act(async () => {
        await result.current.queueOperation(operation);
      });
      
      expect(indexedDBQueue.add).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-op-1',
          url: '/api/test',
          method: 'POST',
        })
      );
    });

    it('should get queued operations', async () => {
      const { indexedDBQueue } = await import('../../../resources/js/Utils/indexedDBQueue');
      const { result } = renderHook(() => useOffline());
      
      const mockOperations: QueuedOperation[] = [
        {
          id: 'op-1',
          url: '/api/test1',
          method: 'POST',
          headers: {},
          resource: 'test',
          description: 'Test 1',
          timestamp: 1000,
          priority: 0,
          retryCount: 0,
          maxRetries: 3,
          status: 'queued',
        },
        {
          id: 'op-2',
          url: '/api/test2',
          method: 'PUT',
          headers: {},
          resource: 'test',
          description: 'Test 2',
          timestamp: 2000,
          priority: 0,
          retryCount: 0,
          maxRetries: 3,
          status: 'queued',
        },
      ];
      
      (indexedDBQueue.getAll as any).mockResolvedValue(mockOperations);
      
      let operations: QueuedOperation[] = [];
      await act(async () => {
        operations = await result.current.getQueuedOperations();
      });
      
      expect(operations).toHaveLength(2);
      expect(operations[0].id).toBe('op-1');
      expect(operations[1].id).toBe('op-2');
    });

    it('should sort operations by timestamp (FIFO)', async () => {
      const { indexedDBQueue } = await import('../../../resources/js/Utils/indexedDBQueue');
      const { result } = renderHook(() => useOffline());
      
      const mockOperations: QueuedOperation[] = [
        {
          id: 'op-2',
          url: '/api/test2',
          method: 'POST',
          headers: {},
          resource: 'test',
          description: 'Test 2',
          timestamp: 2000,
          priority: 0,
          retryCount: 0,
          maxRetries: 3,
          status: 'queued',
        },
        {
          id: 'op-1',
          url: '/api/test1',
          method: 'POST',
          headers: {},
          resource: 'test',
          description: 'Test 1',
          timestamp: 1000,
          priority: 0,
          retryCount: 0,
          maxRetries: 3,
          status: 'queued',
        },
      ];
      
      (indexedDBQueue.getAll as any).mockResolvedValue(mockOperations);
      
      let operations: QueuedOperation[] = [];
      await act(async () => {
        operations = await result.current.getQueuedOperations();
      });
      
      // Should be sorted by timestamp
      expect(operations[0].id).toBe('op-1');
      expect(operations[1].id).toBe('op-2');
    });
  });

  describe('Manual Sync (Subtask 8.3)', () => {
    it('should not sync when offline', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });
      
      const { result } = renderHook(() => useOffline());
      
      await act(async () => {
        await result.current.syncNow();
      });
      
      // Should not throw or attempt sync
      expect(result.current.isOnline).toBe(false);
    });

    it('should clear failed operations', async () => {
      const { indexedDBQueue } = await import('../../../resources/js/Utils/indexedDBQueue');
      const { result } = renderHook(() => useOffline());
      
      const failedOps: QueuedOperation[] = [
        {
          id: 'failed-1',
          url: '/api/test',
          method: 'POST',
          headers: {},
          resource: 'test',
          description: 'Failed op',
          timestamp: Date.now(),
          priority: 0,
          retryCount: 3,
          maxRetries: 3,
          status: 'failed',
          lastError: 'Network error',
        },
      ];
      
      (indexedDBQueue.getByStatus as any).mockResolvedValue(failedOps);
      
      await act(async () => {
        await result.current.clearFailed();
      });
      
      expect(indexedDBQueue.getByStatus).toHaveBeenCalledWith('failed');
      expect(indexedDBQueue.remove).toHaveBeenCalledWith('failed-1');
    });
  });
});
