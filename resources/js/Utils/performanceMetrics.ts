/**
 * Performance Metrics Tracker
 * Tracks and analyzes performance metrics for optimistic updates
 * 
 * Requirements: 10.5
 */

export interface PerformanceMetric {
  id: string;
  timestamp: number;
  resource: string;
  operation: 'create' | 'update' | 'delete';
  optimisticUpdateTime: number;
  serverResponseTime: number;
  totalTime: number;
  timeSaved: number;
  success: boolean;
  retryCount: number;
  error?: string;
}

export interface PerformanceMetricsConfig {
  maxMetrics?: number;
  persistToStorage?: boolean;
  trackingEnabled?: boolean;
}

class PerformanceMetricsTracker {
  private metrics: PerformanceMetric[] = [];
  private config: PerformanceMetricsConfig;
  private readonly STORAGE_KEY = 'performance-metrics';
  private readonly isDevelopment: boolean;

  constructor(config: PerformanceMetricsConfig = {}) {
    this.config = {
      maxMetrics: config.maxMetrics || 1000,
      persistToStorage: config.persistToStorage !== false,
      trackingEnabled: config.trackingEnabled !== false,
    };
    
    this.isDevelopment = import.meta.env.DEV;
    
    // Restore metrics from storage on initialization
    if (this.config.persistToStorage) {
      this.restoreMetrics();
    }
  }

  /**
   * Track a performance metric
   * Requirements: 10.5
   */
  trackMetric(metric: {
    resource: string;
    operation: PerformanceMetric['operation'];
    optimisticUpdateTime: number;
    serverResponseTime: number;
    success: boolean;
    retryCount?: number;
    error?: string;
  }): PerformanceMetric | null {
    // Only track if enabled
    if (!this.config.trackingEnabled) {
      return null;
    }

    const performanceMetric: PerformanceMetric = {
      id: `perf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      resource: metric.resource,
      operation: metric.operation,
      optimisticUpdateTime: metric.optimisticUpdateTime,
      serverResponseTime: metric.serverResponseTime,
      totalTime: metric.optimisticUpdateTime + metric.serverResponseTime,
      timeSaved: metric.serverResponseTime - metric.optimisticUpdateTime,
      success: metric.success,
      retryCount: metric.retryCount || 0,
      error: metric.error,
    };

    // Add to metrics array
    this.metrics.push(performanceMetric);

    // Trim metrics if exceeds max
    if (this.metrics.length > this.config.maxMetrics!) {
      this.metrics = this.metrics.slice(-this.config.maxMetrics!);
    }

    // Persist to storage
    if (this.config.persistToStorage) {
      this.persistMetrics();
    }

    // Log in development mode
    if (this.isDevelopment) {
      this.logMetric(performanceMetric);
    }

    return performanceMetric;
  }

  /**
   * Log metric to console
   */
  private logMetric(metric: PerformanceMetric): void {
    const emoji = metric.success ? '✅' : '❌';
    const color = metric.success ? '#10b981' : '#ef4444';

    console.group(`%c${emoji} [PERFORMANCE] ${metric.operation} ${metric.resource}`, `color: ${color}; font-weight: bold;`);
    console.log('Optimistic Update Time:', `${metric.optimisticUpdateTime}ms`);
    console.log('Server Response Time:', `${metric.serverResponseTime}ms`);
    console.log('Time Saved:', `${metric.timeSaved}ms`);
    console.log('Total Time:', `${metric.totalTime}ms`);
    console.log('Success:', metric.success);
    
    if (metric.retryCount > 0) {
      console.log('Retry Count:', metric.retryCount);
    }
    
    if (metric.error) {
      console.log('Error:', metric.error);
    }
    
    console.groupEnd();
  }

  /**
   * Get all metrics
   */
  getMetrics(filter?: {
    resource?: string;
    operation?: PerformanceMetric['operation'];
    success?: boolean;
    since?: number;
  }): PerformanceMetric[] {
    let filtered = [...this.metrics];

    if (filter) {
      if (filter.resource) {
        filtered = filtered.filter(m => m.resource === filter.resource);
      }
      if (filter.operation) {
        filtered = filtered.filter(m => m.operation === filter.operation);
      }
      if (filter.success !== undefined) {
        filtered = filtered.filter(m => m.success === filter.success);
      }
      if (filter.since) {
        filtered = filtered.filter(m => m.timestamp >= filter.since);
      }
    }

    return filtered;
  }

  /**
   * Get performance statistics
   * Requirements: 10.5
   */
  getStats(resource?: string): {
    totalOperations: number;
    successCount: number;
    failureCount: number;
    successRate: number;
    averageOptimisticTime: number;
    averageServerTime: number;
    averageTimeSaved: number;
    totalTimeSaved: number;
    byOperation: Record<string, {
      count: number;
      successRate: number;
      avgServerTime: number;
      avgTimeSaved: number;
    }>;
  } {
    const filtered = resource 
      ? this.metrics.filter(m => m.resource === resource)
      : this.metrics;

    if (filtered.length === 0) {
      return {
        totalOperations: 0,
        successCount: 0,
        failureCount: 0,
        successRate: 0,
        averageOptimisticTime: 0,
        averageServerTime: 0,
        averageTimeSaved: 0,
        totalTimeSaved: 0,
        byOperation: {},
      };
    }

    const successMetrics = filtered.filter(m => m.success);
    const failedMetrics = filtered.filter(m => !m.success);

    // Calculate averages
    const totalOptimisticTime = filtered.reduce((sum, m) => sum + m.optimisticUpdateTime, 0);
    const totalServerTime = filtered.reduce((sum, m) => sum + m.serverResponseTime, 0);
    const totalTimeSaved = filtered.reduce((sum, m) => sum + m.timeSaved, 0);

    const averageOptimisticTime = totalOptimisticTime / filtered.length;
    const averageServerTime = totalServerTime / filtered.length;
    const averageTimeSaved = totalTimeSaved / filtered.length;

    // Calculate by operation
    const byOperation: Record<string, {
      count: number;
      successRate: number;
      avgServerTime: number;
      avgTimeSaved: number;
    }> = {};

    ['create', 'update', 'delete'].forEach(op => {
      const opMetrics = filtered.filter(m => m.operation === op);
      
      if (opMetrics.length > 0) {
        const opSuccess = opMetrics.filter(m => m.success).length;
        const opServerTime = opMetrics.reduce((sum, m) => sum + m.serverResponseTime, 0);
        const opTimeSaved = opMetrics.reduce((sum, m) => sum + m.timeSaved, 0);

        byOperation[op] = {
          count: opMetrics.length,
          successRate: (opSuccess / opMetrics.length) * 100,
          avgServerTime: Math.round(opServerTime / opMetrics.length),
          avgTimeSaved: Math.round(opTimeSaved / opMetrics.length),
        };
      }
    });

    return {
      totalOperations: filtered.length,
      successCount: successMetrics.length,
      failureCount: failedMetrics.length,
      successRate: (successMetrics.length / filtered.length) * 100,
      averageOptimisticTime: Math.round(averageOptimisticTime),
      averageServerTime: Math.round(averageServerTime),
      averageTimeSaved: Math.round(averageTimeSaved),
      totalTimeSaved: Math.round(totalTimeSaved),
      byOperation,
    };
  }

  /**
   * Get performance insights
   */
  getInsights(): {
    fastestOperation: string;
    slowestOperation: string;
    mostReliableOperation: string;
    leastReliableOperation: string;
    averageRetryCount: number;
    performanceImprovement: number;
  } {
    if (this.metrics.length === 0) {
      return {
        fastestOperation: 'N/A',
        slowestOperation: 'N/A',
        mostReliableOperation: 'N/A',
        leastReliableOperation: 'N/A',
        averageRetryCount: 0,
        performanceImprovement: 0,
      };
    }

    const stats = this.getStats();
    
    // Find fastest and slowest operations
    let fastestOp = '';
    let slowestOp = '';
    let fastestTime = Infinity;
    let slowestTime = 0;

    Object.entries(stats.byOperation).forEach(([op, data]) => {
      if (data.avgServerTime < fastestTime) {
        fastestTime = data.avgServerTime;
        fastestOp = op;
      }
      if (data.avgServerTime > slowestTime) {
        slowestTime = data.avgServerTime;
        slowestOp = op;
      }
    });

    // Find most and least reliable operations
    let mostReliableOp = '';
    let leastReliableOp = '';
    let highestSuccessRate = 0;
    let lowestSuccessRate = 100;

    Object.entries(stats.byOperation).forEach(([op, data]) => {
      if (data.successRate > highestSuccessRate) {
        highestSuccessRate = data.successRate;
        mostReliableOp = op;
      }
      if (data.successRate < lowestSuccessRate) {
        lowestSuccessRate = data.successRate;
        leastReliableOp = op;
      }
    });

    // Calculate average retry count
    const totalRetries = this.metrics.reduce((sum, m) => sum + m.retryCount, 0);
    const averageRetryCount = totalRetries / this.metrics.length;

    // Calculate performance improvement (percentage)
    const performanceImprovement = stats.averageServerTime > 0
      ? (stats.averageTimeSaved / stats.averageServerTime) * 100
      : 0;

    return {
      fastestOperation: fastestOp || 'N/A',
      slowestOperation: slowestOp || 'N/A',
      mostReliableOperation: mostReliableOp || 'N/A',
      leastReliableOperation: leastReliableOp || 'N/A',
      averageRetryCount: Math.round(averageRetryCount * 100) / 100,
      performanceImprovement: Math.round(performanceImprovement * 100) / 100,
    };
  }

  /**
   * Get time series data for charting
   */
  getTimeSeries(interval: 'minute' | 'hour' | 'day' = 'hour'): {
    labels: string[];
    successRate: number[];
    avgResponseTime: number[];
    avgTimeSaved: number[];
  } {
    if (this.metrics.length === 0) {
      return {
        labels: [],
        successRate: [],
        avgResponseTime: [],
        avgTimeSaved: [],
      };
    }

    // Determine interval in milliseconds
    const intervalMs = {
      minute: 60 * 1000,
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
    }[interval];

    // Group metrics by interval
    const groups: Record<number, PerformanceMetric[]> = {};
    
    this.metrics.forEach(metric => {
      const bucket = Math.floor(metric.timestamp / intervalMs) * intervalMs;
      if (!groups[bucket]) {
        groups[bucket] = [];
      }
      groups[bucket].push(metric);
    });

    // Calculate stats for each bucket
    const labels: string[] = [];
    const successRate: number[] = [];
    const avgResponseTime: number[] = [];
    const avgTimeSaved: number[] = [];

    Object.entries(groups)
      .sort(([a], [b]) => Number(a) - Number(b))
      .forEach(([timestamp, metrics]) => {
        const date = new Date(Number(timestamp));
        labels.push(date.toLocaleTimeString());

        const successCount = metrics.filter(m => m.success).length;
        successRate.push((successCount / metrics.length) * 100);

        const totalResponseTime = metrics.reduce((sum, m) => sum + m.serverResponseTime, 0);
        avgResponseTime.push(Math.round(totalResponseTime / metrics.length));

        const totalTimeSaved = metrics.reduce((sum, m) => sum + m.timeSaved, 0);
        avgTimeSaved.push(Math.round(totalTimeSaved / metrics.length));
      });

    return {
      labels,
      successRate,
      avgResponseTime,
      avgTimeSaved,
    };
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    
    if (this.config.persistToStorage) {
      try {
        localStorage.removeItem(this.STORAGE_KEY);
      } catch (error) {
        console.error('[PerformanceMetrics] Failed to clear metrics from storage:', error);
      }
    }
  }

  /**
   * Clear metrics older than specified time
   */
  clearOldMetrics(olderThan: number): void {
    const cutoff = Date.now() - olderThan;
    this.metrics = this.metrics.filter(m => m.timestamp >= cutoff);
    
    if (this.config.persistToStorage) {
      this.persistMetrics();
    }
  }

  /**
   * Persist metrics to localStorage
   */
  private persistMetrics(): void {
    try {
      const serialized = JSON.stringify(this.metrics);
      localStorage.setItem(this.STORAGE_KEY, serialized);
    } catch (error) {
      console.error('[PerformanceMetrics] Failed to persist metrics:', error);
    }
  }

  /**
   * Restore metrics from localStorage
   */
  private restoreMetrics(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.metrics = JSON.parse(stored);
        
        if (this.isDevelopment) {
          console.log(`[PerformanceMetrics] Restored ${this.metrics.length} performance metrics from storage`);
        }
      }
    } catch (error) {
      console.error('[PerformanceMetrics] Failed to restore metrics:', error);
    }
  }

  /**
   * Export metrics as JSON
   */
  exportMetrics(): string {
    return JSON.stringify(this.metrics, null, 2);
  }

  /**
   * Export metrics as CSV
   */
  exportMetricsCSV(): string {
    const headers = [
      'ID', 'Timestamp', 'Resource', 'Operation', 
      'Optimistic Time (ms)', 'Server Time (ms)', 'Time Saved (ms)', 
      'Success', 'Retry Count', 'Error'
    ];
    
    const rows = this.metrics.map(m => [
      m.id,
      new Date(m.timestamp).toISOString(),
      m.resource,
      m.operation,
      m.optimisticUpdateTime,
      m.serverResponseTime,
      m.timeSaved,
      m.success,
      m.retryCount,
      m.error || '',
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    return csv;
  }

  /**
   * Print summary to console
   */
  printSummary(resource?: string): void {
    if (!this.isDevelopment) {
      return;
    }

    const stats = this.getStats(resource);
    const insights = this.getInsights();

    const title = resource 
      ? `📊 Performance Summary - ${resource}`
      : '📊 Overall Performance Summary';

    console.group(`%c${title}`, 'color: #3b82f6; font-weight: bold; font-size: 14px;');
    console.log('Total Operations:', stats.totalOperations);
    console.log('Success Rate:', `${stats.successRate.toFixed(2)}%`);
    console.log('');
    console.log('Timing:');
    console.log(`  Optimistic Update: ${stats.averageOptimisticTime}ms (avg)`);
    console.log(`  Server Response: ${stats.averageServerTime}ms (avg)`);
    console.log(`  Time Saved: ${stats.averageTimeSaved}ms (avg)`);
    console.log(`  Total Time Saved: ${(stats.totalTimeSaved / 1000).toFixed(2)}s`);
    console.log('');
    console.log('By Operation:');
    Object.entries(stats.byOperation).forEach(([op, data]) => {
      console.log(`  ${op}:`);
      console.log(`    Count: ${data.count}`);
      console.log(`    Success Rate: ${data.successRate.toFixed(2)}%`);
      console.log(`    Avg Server Time: ${data.avgServerTime}ms`);
      console.log(`    Avg Time Saved: ${data.avgTimeSaved}ms`);
    });
    console.log('');
    console.log('Insights:');
    console.log(`  Fastest Operation: ${insights.fastestOperation}`);
    console.log(`  Slowest Operation: ${insights.slowestOperation}`);
    console.log(`  Most Reliable: ${insights.mostReliableOperation}`);
    console.log(`  Least Reliable: ${insights.leastReliableOperation}`);
    console.log(`  Avg Retry Count: ${insights.averageRetryCount}`);
    console.log(`  Performance Improvement: ${insights.performanceImprovement.toFixed(2)}%`);
    console.groupEnd();
  }
}

// Export singleton instance
export const performanceMetrics = new PerformanceMetricsTracker();

// Export class for custom instances
export { PerformanceMetricsTracker };
