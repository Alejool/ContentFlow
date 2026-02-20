import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PerformanceValidator, PERFORMANCE_TARGETS } from '@/Utils/performanceValidator';

describe('Performance Validator', () => {
  let validator: PerformanceValidator;

  beforeEach(() => {
    validator = new PerformanceValidator();
  });

  describe('Optimistic Update Time', () => {
    it('should measure optimistic update time under 50ms', () => {
      // Simulate fast optimistic update
      const result = validator.measureOptimisticUpdate(() => {
        return { id: 1, title: 'Test' };
      });

      expect(result).toEqual({ id: 1, title: 'Test' });
      
      const metrics = validator.getMetrics();
      expect(metrics.optimisticUpdateTime).toBeDefined();
      expect(metrics.optimisticUpdateTime!).toBeLessThan(PERFORMANCE_TARGETS.OPTIMISTIC_UPDATE_TIME);
    });

    it('should measure async optimistic update time', async () => {
      const result = await validator.measureOptimisticUpdateAsync(async () => {
        return new Promise(resolve => {
          setTimeout(() => resolve({ id: 1, title: 'Test' }), 10);
        });
      });

      expect(result).toEqual({ id: 1, title: 'Test' });
      
      const metrics = validator.getMetrics();
      expect(metrics.optimisticUpdateTime).toBeDefined();
      expect(metrics.optimisticUpdateTime!).toBeGreaterThan(10);
    });
  });

  describe('Cache Response Time', () => {
    it('should measure cache response time under 100ms', async () => {
      // Mock cache
      const mockCache = {
        match: vi.fn().mockResolvedValue(new Response('cached data')),
      };
      
      global.caches = {
        open: vi.fn().mockResolvedValue(mockCache),
      } as any;

      const request = new Request('https://example.com/api/test');
      const response = await validator.measureCacheResponse(request);

      expect(response).toBeDefined();
      
      const metrics = validator.getMetrics();
      expect(metrics.cacheResponseTime).toBeDefined();
      expect(metrics.cacheResponseTime!).toBeLessThan(PERFORMANCE_TARGETS.CACHE_RESPONSE_TIME);
    });

    it('should handle cache miss gracefully', async () => {
      const mockCache = {
        match: vi.fn().mockResolvedValue(null),
      };
      
      global.caches = {
        open: vi.fn().mockResolvedValue(mockCache),
      } as any;

      const request = new Request('https://example.com/api/test');
      const response = await validator.measureCacheResponse(request);

      expect(response).toBeNull();
    });
  });

  describe('Performance Validation', () => {
    it('should validate all metrics and generate report', () => {
      // Set some metrics
      validator.measureOptimisticUpdate(() => ({ id: 1 }));

      const report = validator.validate();

      expect(report).toBeDefined();
      expect(report.timestamp).toBeDefined();
      expect(report.metrics).toBeDefined();
      expect(report.validations).toHaveLength(7);
      expect(report.overallScore).toBeGreaterThanOrEqual(0);
      expect(report.overallScore).toBeLessThanOrEqual(100);
      expect(typeof report.passed).toBe('boolean');
    });

    it('should pass validation when all metrics meet targets', () => {
      // Mock good metrics
      const goodMetrics = {
        optimisticUpdateTime: 30,
        cacheResponseTime: 50,
        firstContentfulPaint: 1000,
        largestContentfulPaint: 2000,
        timeToInteractive: 2500,
        totalBlockingTime: 200,
        cumulativeLayoutShift: 0.05,
      };

      // Inject metrics
      (validator as any).metrics = goodMetrics;

      const report = validator.validate();

      expect(report.overallScore).toBeGreaterThan(90);
      expect(report.passed).toBe(true);
      
      // All validations should pass
      const allPassed = report.validations.every(v => v.passed);
      expect(allPassed).toBe(true);
    });

    it('should fail validation when metrics exceed targets', () => {
      // Mock bad metrics
      const badMetrics = {
        optimisticUpdateTime: 100, // > 50ms target
        cacheResponseTime: 200, // > 100ms target
        firstContentfulPaint: 3000, // > 1500ms target
        largestContentfulPaint: 5000, // > 2500ms target
        timeToInteractive: 6000, // > 3000ms target
        totalBlockingTime: 500, // > 300ms target
        cumulativeLayoutShift: 0.3, // > 0.1 target
      };

      // Inject metrics
      (validator as any).metrics = badMetrics;

      const report = validator.validate();

      expect(report.overallScore).toBeLessThan(50);
      expect(report.passed).toBe(false);
      
      // Check that most validations failed (at least 5 out of 7)
      const failedCount = report.validations.filter(v => !v.passed).length;
      expect(failedCount).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Report Export', () => {
    it('should export report as JSON', () => {
      validator.measureOptimisticUpdate(() => ({ id: 1 }));
      const report = validator.validate();
      
      const json = validator.exportReport(report);
      
      expect(json).toBeDefined();
      expect(typeof json).toBe('string');
      
      const parsed = JSON.parse(json);
      expect(parsed.timestamp).toBe(report.timestamp);
      expect(parsed.overallScore).toBe(report.overallScore);
    });
  });

  describe('Metrics Management', () => {
    it('should get current metrics', () => {
      validator.measureOptimisticUpdate(() => ({ id: 1 }));
      
      const metrics = validator.getMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics.optimisticUpdateTime).toBeDefined();
    });

    it('should reset metrics', () => {
      validator.measureOptimisticUpdate(() => ({ id: 1 }));
      
      let metrics = validator.getMetrics();
      expect(metrics.optimisticUpdateTime).toBeDefined();
      
      validator.reset();
      
      metrics = validator.getMetrics();
      expect(Object.keys(metrics)).toHaveLength(0);
    });
  });

  describe('PWA Installability', () => {
    it('should check PWA installability', async () => {
      // Mock browser APIs
      Object.defineProperty(global.navigator, 'serviceWorker', {
        value: {},
        writable: true,
      });

      Object.defineProperty(global.window, 'location', {
        value: {
          protocol: 'https:',
          hostname: 'example.com',
        },
        writable: true,
      });

      // Mock manifest link
      const mockLink = document.createElement('link');
      mockLink.rel = 'manifest';
      document.head.appendChild(mockLink);

      const installable = await validator.checkPWAInstallability();

      expect(typeof installable).toBe('boolean');
      
      // Cleanup
      document.head.removeChild(mockLink);
    });
  });

  describe('Performance Targets', () => {
    it('should have correct performance targets', () => {
      expect(PERFORMANCE_TARGETS.OPTIMISTIC_UPDATE_TIME).toBe(50);
      expect(PERFORMANCE_TARGETS.CACHE_RESPONSE_TIME).toBe(100);
      expect(PERFORMANCE_TARGETS.FIRST_CONTENTFUL_PAINT).toBe(1500);
      expect(PERFORMANCE_TARGETS.LARGEST_CONTENTFUL_PAINT).toBe(2500);
      expect(PERFORMANCE_TARGETS.TIME_TO_INTERACTIVE).toBe(3000);
      expect(PERFORMANCE_TARGETS.TOTAL_BLOCKING_TIME).toBe(300);
      expect(PERFORMANCE_TARGETS.CUMULATIVE_LAYOUT_SHIFT).toBe(0.1);
      expect(PERFORMANCE_TARGETS.PWA_SCORE).toBe(90);
    });
  });
});
