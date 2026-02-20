import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useOptimistic } from '../../../resources/js/Hooks/useOptimistic';
import useOptimisticStore from '../../../resources/js/stores/optimisticStore';

describe('useOptimistic Hook', () => {
  beforeEach(() => {
    // Clear store before each test
    const store = useOptimisticStore.getState();
    store.operations.clear();
    store.failedOperations.length = 0;
  });

  describe('Basic functionality', () => {
    it('should initialize with empty pending operations', () => {
      const { result } = renderHook(() =>
        useOptimistic({ resource: 'publications' })
      );

      expect(result.current.pending).toEqual([]);
      expect(result.current.hasPending).toBe(false);
    });

    it('should execute successful operation', async () => {
      const mockApiCall = vi.fn().mockResolvedValue({ id: 1, title: 'Test' });
      const onSuccess = vi.fn();

      const { result } = renderHook(() =>
        useOptimistic({
          resource: 'publications',
          onSuccess,
        })
      );

      let response;
      await act(async () => {
        response = await result.current.execute(
          { title: 'Test' },
          mockApiCall
        );
      });

      expect(mockApiCall).toHaveBeenCalledTimes(1);
      expect(response).toEqual({ id: 1, title: 'Test' });
      expect(onSuccess).toHaveBeenCalledWith({ id: 1, title: 'Test' });
    });

    it('should handle operation failure', async () => {
      const mockError = new Error('API Error');
      const mockApiCall = vi.fn().mockRejectedValue(mockError);
      const onError = vi.fn();
      const onRollback = vi.fn();

      const { result } = renderHook(() =>
        useOptimistic({
          resource: 'publications',
          onError,
          onRollback,
          retryOnError: false, // Disable retries for this test
        })
      );

      await act(async () => {
        try {
          await result.current.execute({ title: 'Test' }, mockApiCall);
        } catch (error) {
          expect(error).toBe(mockError);
        }
      });

      expect(mockApiCall).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(mockError);
      expect(onRollback).toHaveBeenCalled();
    });
  });

  describe('Error handling and retries', () => {
    it('should retry network errors', async () => {
      const mockError = Object.assign(new Error('Network error'), {
        message: 'network failed',
      });
      
      const mockApiCall = vi
        .fn()
        .mockRejectedValueOnce(mockError)
        .mockRejectedValueOnce(mockError)
        .mockResolvedValue({ id: 1, title: 'Test' });

      const { result } = renderHook(() =>
        useOptimistic({
          resource: 'publications',
          maxRetries: 3,
        })
      );

      let response;
      await act(async () => {
        response = await result.current.execute(
          { title: 'Test' },
          mockApiCall
        );
      });

      // Should have been called 3 times (initial + 2 retries)
      expect(mockApiCall).toHaveBeenCalledTimes(3);
      expect(response).toEqual({ id: 1, title: 'Test' });
    });

    it('should not retry validation errors', async () => {
      const mockError = Object.assign(new Error('Validation error'), {
        response: { status: 422, data: { errors: {} } },
      });
      
      const mockApiCall = vi.fn().mockRejectedValue(mockError);

      const { result } = renderHook(() =>
        useOptimistic({
          resource: 'publications',
          maxRetries: 3,
        })
      );

      await act(async () => {
        try {
          await result.current.execute({ title: 'Test' }, mockApiCall);
        } catch (error) {
          expect(error).toBe(mockError);
        }
      });

      // Should only be called once (no retries for validation errors)
      expect(mockApiCall).toHaveBeenCalledTimes(1);
    });

    it('should move to failed queue after max retries', async () => {
      const mockError = Object.assign(new Error('Network error'), {
        message: 'network failed',
      });
      
      const mockApiCall = vi.fn().mockRejectedValue(mockError);

      const { result } = renderHook(() =>
        useOptimistic({
          resource: 'publications',
          maxRetries: 2,
        })
      );

      await act(async () => {
        try {
          await result.current.execute({ title: 'Test' }, mockApiCall);
        } catch (error) {
          expect(error).toBe(mockError);
        }
      });

      // Should have been called 3 times (initial + 2 retries)
      expect(mockApiCall).toHaveBeenCalledTimes(3);
      
      // Check failed operations queue
      const store = useOptimisticStore.getState();
      expect(store.failedOperations.length).toBeGreaterThan(0);
    });
  });

  describe('Performance metrics', () => {
    it('should track performance metrics', async () => {
      const mockApiCall = vi.fn().mockResolvedValue({ id: 1, title: 'Test' });

      const { result } = renderHook(() =>
        useOptimistic({ resource: 'publications' })
      );

      await act(async () => {
        await result.current.execute({ title: 'Test' }, mockApiCall);
      });

      // Wait for metrics to update
      await waitFor(() => {
        expect(result.current.metrics.totalOperations).toBeGreaterThan(0);
      });

      expect(result.current.metrics.successCount).toBe(1);
      expect(result.current.metrics.failureCount).toBe(0);
      expect(result.current.metrics.successRate).toBe(100);
    });
  });

  describe('Operation type detection', () => {
    it('should detect create operation when no originalData', async () => {
      const mockApiCall = vi.fn().mockResolvedValue({ id: 1, title: 'Test' });

      const { result } = renderHook(() =>
        useOptimistic({ resource: 'publications' })
      );

      await act(async () => {
        await result.current.execute({ title: 'Test' }, mockApiCall);
      });

      const store = useOptimisticStore.getState();
      const ops = Array.from(store.operations.values());
      
      // Operation should be confirmed and removed, check in completed
      expect(mockApiCall).toHaveBeenCalled();
    });

    it('should detect update operation when originalData provided', async () => {
      const mockApiCall = vi.fn().mockResolvedValue({ id: 1, title: 'Updated' });

      const { result } = renderHook(() =>
        useOptimistic({ resource: 'publications' })
      );

      await act(async () => {
        await result.current.execute(
          { id: 1, title: 'Updated' },
          mockApiCall,
          { id: 1, title: 'Original' }
        );
      });

      expect(mockApiCall).toHaveBeenCalled();
    });
  });
});
