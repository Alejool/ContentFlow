/**
 * Performance monitoring utilities for calendar
 * Helps evaluate if virtualization is needed
 */

interface PerformanceMetrics {
  renderTime: number;
  eventCount: number;
  timestamp: Date;
}

class CalendarPerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private readonly MAX_METRICS = 50;
  private readonly SLOW_RENDER_THRESHOLD = 100; // ms

  /**
   * Record a render performance metric
   */
  recordRender(eventCount: number, renderTime: number) {
    this.metrics.push({
      renderTime,
      eventCount,
      timestamp: new Date(),
    });

    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.shift();
    }

    // Log warning if render is slow
    if (renderTime > this.SLOW_RENDER_THRESHOLD) {
      console.warn(
        `Slow calendar render detected: ${renderTime}ms for ${eventCount} events`
      );
    }
  }

  /**
   * Get average render time for recent renders
   */
  getAverageRenderTime(): number {
    if (this.metrics.length === 0) return 0;
    
    const sum = this.metrics.reduce((acc, m) => acc + m.renderTime, 0);
    return sum / this.metrics.length;
  }

  /**
   * Check if virtualization is recommended based on performance
   */
  shouldUseVirtualization(): boolean {
    const avgRenderTime = this.getAverageRenderTime();
    const recentMetrics = this.metrics.slice(-10);
    
    // Recommend virtualization if:
    // 1. Average render time > 100ms
    // 2. Consistently handling > 100 events
    const slowRenders = recentMetrics.filter(m => m.renderTime > this.SLOW_RENDER_THRESHOLD).length;
    const highEventCount = recentMetrics.filter(m => m.eventCount > 100).length;
    
    return slowRenders > 5 || (avgRenderTime > this.SLOW_RENDER_THRESHOLD && highEventCount > 5);
  }

  /**
   * Get performance report
   */
  getReport() {
    return {
      totalMeasurements: this.metrics.length,
      averageRenderTime: this.getAverageRenderTime(),
      slowRenders: this.metrics.filter(m => m.renderTime > this.SLOW_RENDER_THRESHOLD).length,
      recommendVirtualization: this.shouldUseVirtualization(),
    };
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics = [];
  }
}

// Singleton instance
export const performanceMonitor = new CalendarPerformanceMonitor();

/**
 * Hook to measure component render time
 */
export function useRenderTimeMonitor(componentName: string, eventCount: number) {
  const startTime = performance.now();

  return () => {
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    performanceMonitor.recordRender(eventCount, renderTime);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} rendered in ${renderTime.toFixed(2)}ms with ${eventCount} events`);
    }
  };
}
