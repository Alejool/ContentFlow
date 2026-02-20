import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CacheLogger } from '../../../resources/js/Utils/cacheLogger';

// Mock import.meta.env
vi.stubGlobal('import', {
  meta: {
    env: {
      DEV: true,
    },
  },
});

describe('CacheLogger', () => {
  let logger: CacheLogger;

  beforeEach(() => {
    logger = new CacheLogger({
      maxLogs: 10,
      persistToStorage: false,
      consoleOutput: false,
    });
  });

  it('should log cache decisions in development mode', () => {
    const log = logger.logDecision({
      url: 'https://example.com/api/posts',
      method: 'GET',
      strategy: 'network-first',
      result: 'network-success',
      responseTime: 150,
    });

    expect(log).toBeDefined();
    expect(log?.url).toBe('https://example.com/api/posts');
    expect(log?.strategy).toBe('network-first');
    expect(log?.result).toBe('network-success');
    expect(log?.responseTime).toBe(150);
  });

  it('should maintain a queue of cache decisions', () => {
    for (let i = 0; i < 5; i++) {
      logger.logDecision({
        url: `https://example.com/api/posts/${i}`,
        strategy: 'cache-first',
        result: 'cache-hit',
        responseTime: 10,
      });
    }

    const logs = logger.getLogs();
    expect(logs).toHaveLength(5);
  });

  it('should filter logs by strategy', () => {
    logger.logDecision({
      url: 'https://example.com/1',
      strategy: 'cache-first',
      result: 'cache-hit',
      responseTime: 10,
    });
    logger.logDecision({
      url: 'https://example.com/2',
      strategy: 'network-first',
      result: 'network-success',
      responseTime: 100,
    });
    logger.logDecision({
      url: 'https://example.com/3',
      strategy: 'cache-first',
      result: 'cache-hit',
      responseTime: 10,
    });

    const cacheFirstLogs = logger.getLogs({ strategy: 'cache-first' });
    expect(cacheFirstLogs).toHaveLength(2);
  });

  it('should provide cache statistics', () => {
    logger.logDecision({
      url: 'https://example.com/1',
      strategy: 'cache-first',
      result: 'cache-hit',
      responseTime: 10,
    });
    logger.logDecision({
      url: 'https://example.com/2',
      strategy: 'network-first',
      result: 'network-success',
      responseTime: 100,
    });
    logger.logDecision({
      url: 'https://example.com/3',
      strategy: 'cache-first',
      result: 'cache-miss',
      responseTime: 150,
    });

    const stats = logger.getStats();
    expect(stats.total).toBe(3);
    expect(stats.byStrategy['cache-first']).toBe(2);
    expect(stats.byStrategy['network-first']).toBe(1);
    expect(stats.byResult['cache-hit']).toBe(1);
    expect(stats.cacheHitRate).toBeCloseTo(33.33, 1);
  });

  it('should provide performance insights', () => {
    logger.logDecision({
      url: 'https://example.com/1',
      strategy: 'cache-first',
      result: 'cache-hit',
      responseTime: 10,
    });
    logger.logDecision({
      url: 'https://example.com/2',
      strategy: 'network-first',
      result: 'network-success',
      responseTime: 200,
    });

    const insights = logger.getPerformanceInsights();
    expect(insights.fastestStrategy).toBe('cache-first');
    expect(insights.slowestStrategy).toBe('network-first');
    expect(insights.averageByStrategy['cache-first']).toBe(10);
    expect(insights.averageByStrategy['network-first']).toBe(200);
  });

  it('should clear logs', () => {
    logger.logDecision({
      url: 'https://example.com/1',
      strategy: 'cache-first',
      result: 'cache-hit',
      responseTime: 10,
    });

    expect(logger.getLogs()).toHaveLength(1);

    logger.clearLogs();
    expect(logger.getLogs()).toHaveLength(0);
  });
});
