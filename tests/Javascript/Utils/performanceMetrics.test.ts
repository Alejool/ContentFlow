import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PerformanceMetricsTracker } from '../../../resources/js/Utils/performanceMetrics';

// Mock import.meta.env
vi.stubGlobal('import', {
  meta: {
    env: {
      DEV: true,
    },
  },
});

describe('PerformanceMetricsTracker', () => {
  let tracker: PerformanceMetricsTracker;

  beforeEach(() => {
    tracker = new PerformanceMetricsTracker({
      maxMetrics: 10,
      persistToStorage: false,
      trackingEnabled: true,
    });
  });

  it('should track performance metrics', () => {
    const metric = tracker.trackMetric({
      resource: 'posts',
      operation: 'create',
      optimisticUpdateTime: 1,
      serverResponseTime: 150,
      success: true,
    });

    expect(metric).toBeDefined();
    expect(metric?.resource).toBe('posts');
    expect(metric?.operation).toBe('create');
    expect(metric?.optimisticUpdateTime).toBe(1);
    expect(metric?.serverResponseTime).toBe(150);
    expect(metric?.timeSaved).toBe(149);
    expect(metric?.success).toBe(true);
  });

  it('should maintain a queue of metrics', () => {
    for (let i = 0; i < 5; i++) {
      tracker.trackMetric({
        resource: 'posts',
        operation: 'create',
        optimisticUpdateTime: 1,
        serverResponseTime: 100 + i * 10,
        success: true,
      });
    }

    const metrics = tracker.getMetrics();
    expect(metrics).toHaveLength(5);
  });

  it('should filter metrics by resource', () => {
    tracker.trackMetric({
      resource: 'posts',
      operation: 'create',
      optimisticUpdateTime: 1,
      serverResponseTime: 100,
      success: true,
    });
    tracker.trackMetric({
      resource: 'reels',
      operation: 'create',
      optimisticUpdateTime: 1,
      serverResponseTime: 200,
      success: true,
    });
    tracker.trackMetric({
      resource: 'posts',
      operation: 'update',
      optimisticUpdateTime: 1,
      serverResponseTime: 150,
      success: true,
    });

    const postMetrics = tracker.getMetrics({ resource: 'posts' });
    expect(postMetrics).toHaveLength(2);
  });

  it('should provide performance statistics', () => {
    tracker.trackMetric({
      resource: 'posts',
      operation: 'create',
      optimisticUpdateTime: 1,
      serverResponseTime: 100,
      success: true,
    });
    tracker.trackMetric({
      resource: 'posts',
      operation: 'update',
      optimisticUpdateTime: 1,
      serverResponseTime: 150,
      success: true,
    });
    tracker.trackMetric({
      resource: 'posts',
      operation: 'delete',
      optimisticUpdateTime: 1,
      serverResponseTime: 80,
      success: false,
    });

    const stats = tracker.getStats('posts');
    expect(stats.totalOperations).toBe(3);
    expect(stats.successCount).toBe(2);
    expect(stats.failureCount).toBe(1);
    expect(stats.successRate).toBeCloseTo(66.67, 1);
    expect(stats.averageServerTime).toBeCloseTo(110, 0);
  });

  it('should provide performance insights', () => {
    tracker.trackMetric({
      resource: 'posts',
      operation: 'create',
      optimisticUpdateTime: 1,
      serverResponseTime: 200,
      success: true,
    });
    tracker.trackMetric({
      resource: 'posts',
      operation: 'update',
      optimisticUpdateTime: 1,
      serverResponseTime: 100,
      success: true,
    });
    tracker.trackMetric({
      resource: 'posts',
      operation: 'delete',
      optimisticUpdateTime: 1,
      serverResponseTime: 150,
      success: true,
    });

    const insights = tracker.getInsights();
    expect(insights.fastestOperation).toBe('update');
    expect(insights.slowestOperation).toBe('create');
    expect(insights.mostReliableOperation).toBeDefined();
  });

  it('should calculate time saved correctly', () => {
    tracker.trackMetric({
      resource: 'posts',
      operation: 'create',
      optimisticUpdateTime: 1,
      serverResponseTime: 200,
      success: true,
    });

    const stats = tracker.getStats();
    expect(stats.averageTimeSaved).toBe(199);
    expect(stats.totalTimeSaved).toBe(199);
  });

  it('should clear metrics', () => {
    tracker.trackMetric({
      resource: 'posts',
      operation: 'create',
      optimisticUpdateTime: 1,
      serverResponseTime: 100,
      success: true,
    });

    expect(tracker.getMetrics()).toHaveLength(1);

    tracker.clearMetrics();
    expect(tracker.getMetrics()).toHaveLength(0);
  });
});
