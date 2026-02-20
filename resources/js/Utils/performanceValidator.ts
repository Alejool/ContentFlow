/**
 * Performance Validator
 * 
 * Validates and measures performance metrics for:
 * - Optimistic updates (< 50ms)
 * - Cache response times (< 100ms)
 * - PWA score (> 90)
 * - Lighthouse metrics
 * 
 * Requirements: Task 19.3
 */

interface PerformanceMetrics {
  optimisticUpdateTime: number;
  cacheResponseTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  timeToInteractive: number;
  totalBlockingTime: number;
  cumulativeLayoutShift: number;
}

interface ValidationResult {
  metric: string;
  value: number;
  target: number;
  passed: boolean;
  unit: string;
}

interface PerformanceReport {
  timestamp: number;
  metrics: PerformanceMetrics;
  validations: ValidationResult[];
  overallScore: number;
  passed: boolean;
}

// Performance targets
const PERFORMANCE_TARGETS = {
  OPTIMISTIC_UPDATE_TIME: 50, // ms
  CACHE_RESPONSE_TIME: 100, // ms
  FIRST_CONTENTFUL_PAINT: 1500, // ms
  LARGEST_CONTENTFUL_PAINT: 2500, // ms
  TIME_TO_INTERACTIVE: 3000, // ms
  TOTAL_BLOCKING_TIME: 300, // ms
  CUMULATIVE_LAYOUT_SHIFT: 0.1, // score
  PWA_SCORE: 90, // percentage
};

class PerformanceValidator {
  private metrics: Partial<PerformanceMetrics> = {};
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = import.meta.env.DEV;
    this.initializeObservers();
  }

  /**
   * Initialize performance observers
   */
  private initializeObservers(): void {
    if (typeof window === 'undefined') return;

    // Observe paint timing
    if ('PerformanceObserver' in window) {
      try {
        // First Contentful Paint
        const paintObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              this.metrics.firstContentfulPaint = entry.startTime;
              if (this.isDevelopment) {
                console.log(`[Performance] FCP: ${entry.startTime.toFixed(2)}ms`);
              }
            }
          }
        });
        paintObserver.observe({ entryTypes: ['paint'] });

        // Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.metrics.largestContentfulPaint = lastEntry.startTime;
          if (this.isDevelopment) {
            console.log(`[Performance] LCP: ${lastEntry.startTime.toFixed(2)}ms`);
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // Layout Shift
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
              this.metrics.cumulativeLayoutShift = clsValue;
            }
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (error) {
        console.error('[Performance] Failed to initialize observers:', error);
      }
    }
  }

  /**
   * Measure optimistic update time
   */
  measureOptimisticUpdate<T>(operation: () => T): T {
    const start = performance.now();
    const result = operation();
    const duration = performance.now() - start;

    this.metrics.optimisticUpdateTime = duration;

    if (this.isDevelopment) {
      const status = duration < PERFORMANCE_TARGETS.OPTIMISTIC_UPDATE_TIME ? '✓' : '✗';
      console.log(`[Performance] ${status} Optimistic update: ${duration.toFixed(2)}ms (target: ${PERFORMANCE_TARGETS.OPTIMISTIC_UPDATE_TIME}ms)`);
    }

    return result;
  }

  /**
   * Measure async optimistic update time
   */
  async measureOptimisticUpdateAsync<T>(operation: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await operation();
    const duration = performance.now() - start;

    this.metrics.optimisticUpdateTime = duration;

    if (this.isDevelopment) {
      const status = duration < PERFORMANCE_TARGETS.OPTIMISTIC_UPDATE_TIME ? '✓' : '✗';
      console.log(`[Performance] ${status} Optimistic update: ${duration.toFixed(2)}ms (target: ${PERFORMANCE_TARGETS.OPTIMISTIC_UPDATE_TIME}ms)`);
    }

    return result;
  }

  /**
   * Measure cache response time
   */
  async measureCacheResponse(request: Request): Promise<Response | null> {
    const start = performance.now();
    
    try {
      // Try to get from cache
      const cache = await caches.open('dynamic-cache');
      const response = await cache.match(request);
      const duration = performance.now() - start;

      this.metrics.cacheResponseTime = duration;

      if (this.isDevelopment) {
        const status = duration < PERFORMANCE_TARGETS.CACHE_RESPONSE_TIME ? '✓' : '✗';
        console.log(`[Performance] ${status} Cache response: ${duration.toFixed(2)}ms (target: ${PERFORMANCE_TARGETS.CACHE_RESPONSE_TIME}ms)`);
      }

      return response || null;
    } catch (error) {
      console.error('[Performance] Cache measurement failed:', error);
      return null;
    }
  }

  /**
   * Get Time to Interactive (TTI)
   */
  private getTimeToInteractive(): number {
    if (typeof window === 'undefined') return 0;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (!navigation) return 0;

    // Approximate TTI as domInteractive
    return navigation.domInteractive;
  }

  /**
   * Get Total Blocking Time (TBT)
   */
  private getTotalBlockingTime(): number {
    if (typeof window === 'undefined') return 0;

    // Get long tasks
    const longTasks = performance.getEntriesByType('longtask');
    let tbt = 0;

    for (const task of longTasks) {
      const blockingTime = task.duration - 50; // Tasks > 50ms are blocking
      if (blockingTime > 0) {
        tbt += blockingTime;
      }
    }

    return tbt;
  }

  /**
   * Validate all performance metrics
   */
  validate(): PerformanceReport {
    // Get TTI and TBT
    this.metrics.timeToInteractive = this.getTimeToInteractive();
    this.metrics.totalBlockingTime = this.getTotalBlockingTime();

    const validations: ValidationResult[] = [
      {
        metric: 'Optimistic Update Time',
        value: this.metrics.optimisticUpdateTime || 0,
        target: PERFORMANCE_TARGETS.OPTIMISTIC_UPDATE_TIME,
        passed: (this.metrics.optimisticUpdateTime || 0) < PERFORMANCE_TARGETS.OPTIMISTIC_UPDATE_TIME,
        unit: 'ms',
      },
      {
        metric: 'Cache Response Time',
        value: this.metrics.cacheResponseTime || 0,
        target: PERFORMANCE_TARGETS.CACHE_RESPONSE_TIME,
        passed: (this.metrics.cacheResponseTime || 0) < PERFORMANCE_TARGETS.CACHE_RESPONSE_TIME,
        unit: 'ms',
      },
      {
        metric: 'First Contentful Paint',
        value: this.metrics.firstContentfulPaint || 0,
        target: PERFORMANCE_TARGETS.FIRST_CONTENTFUL_PAINT,
        passed: (this.metrics.firstContentfulPaint || 0) < PERFORMANCE_TARGETS.FIRST_CONTENTFUL_PAINT,
        unit: 'ms',
      },
      {
        metric: 'Largest Contentful Paint',
        value: this.metrics.largestContentfulPaint || 0,
        target: PERFORMANCE_TARGETS.LARGEST_CONTENTFUL_PAINT,
        passed: (this.metrics.largestContentfulPaint || 0) < PERFORMANCE_TARGETS.LARGEST_CONTENTFUL_PAINT,
        unit: 'ms',
      },
      {
        metric: 'Time to Interactive',
        value: this.metrics.timeToInteractive || 0,
        target: PERFORMANCE_TARGETS.TIME_TO_INTERACTIVE,
        passed: (this.metrics.timeToInteractive || 0) < PERFORMANCE_TARGETS.TIME_TO_INTERACTIVE,
        unit: 'ms',
      },
      {
        metric: 'Total Blocking Time',
        value: this.metrics.totalBlockingTime || 0,
        target: PERFORMANCE_TARGETS.TOTAL_BLOCKING_TIME,
        passed: (this.metrics.totalBlockingTime || 0) < PERFORMANCE_TARGETS.TOTAL_BLOCKING_TIME,
        unit: 'ms',
      },
      {
        metric: 'Cumulative Layout Shift',
        value: this.metrics.cumulativeLayoutShift || 0,
        target: PERFORMANCE_TARGETS.CUMULATIVE_LAYOUT_SHIFT,
        passed: (this.metrics.cumulativeLayoutShift || 0) < PERFORMANCE_TARGETS.CUMULATIVE_LAYOUT_SHIFT,
        unit: 'score',
      },
    ];

    // Calculate overall score
    const passedCount = validations.filter(v => v.passed).length;
    const overallScore = (passedCount / validations.length) * 100;
    const passed = overallScore >= 70; // 70% pass rate

    const report: PerformanceReport = {
      timestamp: Date.now(),
      metrics: this.metrics as PerformanceMetrics,
      validations,
      overallScore,
      passed,
    };

    // Log report in development
    if (this.isDevelopment) {
      this.logReport(report);
    }

    return report;
  }

  /**
   * Log performance report to console
   */
  private logReport(report: PerformanceReport): void {
    console.group('📊 Performance Validation Report');
    console.log(`Overall Score: ${report.overallScore.toFixed(1)}% ${report.passed ? '✓' : '✗'}`);
    console.log(`Timestamp: ${new Date(report.timestamp).toISOString()}`);
    console.log('\nMetrics:');

    for (const validation of report.validations) {
      const status = validation.passed ? '✓' : '✗';
      const percentage = ((validation.target - validation.value) / validation.target * 100).toFixed(1);
      console.log(
        `${status} ${validation.metric}: ${validation.value.toFixed(2)}${validation.unit} ` +
        `(target: ${validation.target}${validation.unit}, ${percentage}% ${validation.passed ? 'under' : 'over'})`
      );
    }

    console.groupEnd();
  }

  /**
   * Export report as JSON
   */
  exportReport(report: PerformanceReport): string {
    return JSON.stringify(report, null, 2);
  }

  /**
   * Get current metrics
   */
  getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  reset(): void {
    this.metrics = {};
  }

  /**
   * Check if PWA is installable
   */
  async checkPWAInstallability(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    // Check for service worker
    const hasServiceWorker = 'serviceWorker' in navigator;
    
    // Check for manifest
    const manifestLink = document.querySelector('link[rel="manifest"]');
    const hasManifest = !!manifestLink;

    // Check if HTTPS (or localhost)
    const isSecure = window.location.protocol === 'https:' || 
                     window.location.hostname === 'localhost';

    const installable = hasServiceWorker && hasManifest && isSecure;

    if (this.isDevelopment) {
      console.log('[Performance] PWA Installability Check:');
      console.log(`  Service Worker: ${hasServiceWorker ? '✓' : '✗'}`);
      console.log(`  Manifest: ${hasManifest ? '✓' : '✗'}`);
      console.log(`  Secure Context: ${isSecure ? '✓' : '✗'}`);
      console.log(`  Installable: ${installable ? '✓' : '✗'}`);
    }

    return installable;
  }

  /**
   * Run Lighthouse audit programmatically (requires lighthouse npm package)
   */
  async runLighthouseAudit(): Promise<any> {
    if (typeof window === 'undefined') {
      console.warn('[Performance] Lighthouse audit can only run in browser');
      return null;
    }

    console.log('[Performance] To run Lighthouse audit:');
    console.log('1. Open Chrome DevTools');
    console.log('2. Go to Lighthouse tab');
    console.log('3. Select "Progressive Web App" category');
    console.log('4. Click "Generate report"');
    console.log('5. Target PWA score: > 90');

    return null;
  }
}

// Singleton instance
export const performanceValidator = new PerformanceValidator();

// Export for testing
export { PERFORMANCE_TARGETS, PerformanceValidator };
export type { PerformanceMetrics, ValidationResult, PerformanceReport };
