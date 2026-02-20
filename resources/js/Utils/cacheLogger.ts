/**
 * Cache Decision Logger
 * Logs cache decisions for debugging and performance analysis
 * Only active in development mode
 * 
 * Requirements: 10.4
 */

export interface CacheDecisionLog {
  id: string;
  timestamp: number;
  url: string;
  method: string;
  strategy: 'cache-first' | 'network-first' | 'stale-while-revalidate' | 'network-only';
  result: 'cache-hit' | 'cache-miss' | 'network-success' | 'network-error' | 'fallback';
  responseTime: number;
  cacheAge?: number;
  size?: number;
  error?: string;
}

export interface CacheLoggerConfig {
  maxLogs?: number;
  persistToStorage?: boolean;
  consoleOutput?: boolean;
}

class CacheLogger {
  private logs: CacheDecisionLog[] = [];
  private config: CacheLoggerConfig;
  private readonly STORAGE_KEY = 'cache-decision-logs';
  private readonly isDevelopment: boolean;

  constructor(config: CacheLoggerConfig = {}) {
    this.config = {
      maxLogs: config.maxLogs || 500,
      persistToStorage: config.persistToStorage !== false,
      consoleOutput: config.consoleOutput !== false,
    };
    
    this.isDevelopment = import.meta.env.DEV;
    
    // Only restore logs in development mode
    if (this.isDevelopment && this.config.persistToStorage) {
      this.restoreLogs();
    }
  }

  /**
   * Log a cache decision
   * Requirements: 10.4
   */
  logDecision(decision: {
    url: string;
    method?: string;
    strategy: CacheDecisionLog['strategy'];
    result: CacheDecisionLog['result'];
    responseTime: number;
    cacheAge?: number;
    size?: number;
    error?: string;
  }): CacheDecisionLog | null {
    // Only log in development mode
    if (!this.isDevelopment) {
      return null;
    }

    const log: CacheDecisionLog = {
      id: `cache-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      url: decision.url,
      method: decision.method || 'GET',
      strategy: decision.strategy,
      result: decision.result,
      responseTime: decision.responseTime,
      cacheAge: decision.cacheAge,
      size: decision.size,
      error: decision.error,
    };

    // Add to logs array
    this.logs.push(log);

    // Trim logs if exceeds max
    if (this.logs.length > this.config.maxLogs!) {
      this.logs = this.logs.slice(-this.config.maxLogs!);
    }

    // Persist to storage
    if (this.config.persistToStorage) {
      this.persistLogs();
    }

    // Console output
    if (this.config.consoleOutput) {
      this.outputToConsole(log);
    }

    return log;
  }

  /**
   * Output cache decision to console with formatting
   */
  private outputToConsole(log: CacheDecisionLog): void {
    const resultEmoji = {
      'cache-hit': '✅',
      'cache-miss': '❌',
      'network-success': '🌐',
      'network-error': '⚠️',
      'fallback': '🔄',
    };

    const strategyColor = {
      'cache-first': '#10b981',
      'network-first': '#3b82f6',
      'stale-while-revalidate': '#f59e0b',
      'network-only': '#6b7280',
    };

    const emoji = resultEmoji[log.result] || '📝';
    const color = strategyColor[log.strategy] || '#6b7280';

    console.group(
      `%c${emoji} [CACHE] ${log.strategy} → ${log.result}`,
      `color: ${color}; font-weight: bold;`
    );
    console.log('URL:', log.url);
    console.log('Method:', log.method);
    console.log('Response Time:', `${log.responseTime}ms`);
    
    if (log.cacheAge !== undefined) {
      const ageSeconds = Math.round(log.cacheAge / 1000);
      const ageMinutes = Math.round(ageSeconds / 60);
      const ageDisplay = ageMinutes > 0 ? `${ageMinutes}m` : `${ageSeconds}s`;
      console.log('Cache Age:', ageDisplay);
    }
    
    if (log.size !== undefined) {
      const sizeKB = (log.size / 1024).toFixed(2);
      console.log('Size:', `${sizeKB} KB`);
    }
    
    if (log.error) {
      console.log('Error:', log.error);
    }
    
    console.log('Timestamp:', new Date(log.timestamp).toISOString());
    console.groupEnd();
  }

  /**
   * Get all cache decision logs
   */
  getLogs(filter?: {
    strategy?: CacheDecisionLog['strategy'];
    result?: CacheDecisionLog['result'];
    url?: string;
    since?: number;
  }): CacheDecisionLog[] {
    let filtered = [...this.logs];

    if (filter) {
      if (filter.strategy) {
        filtered = filtered.filter(log => log.strategy === filter.strategy);
      }
      if (filter.result) {
        filtered = filtered.filter(log => log.result === filter.result);
      }
      if (filter.url) {
        filtered = filtered.filter(log => log.url.includes(filter.url));
      }
      if (filter.since) {
        filtered = filtered.filter(log => log.timestamp >= filter.since);
      }
    }

    return filtered;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    total: number;
    byStrategy: Record<string, number>;
    byResult: Record<string, number>;
    averageResponseTime: number;
    cacheHitRate: number;
    networkErrorRate: number;
  } {
    const stats = {
      total: this.logs.length,
      byStrategy: {} as Record<string, number>,
      byResult: {} as Record<string, number>,
      averageResponseTime: 0,
      cacheHitRate: 0,
      networkErrorRate: 0,
    };

    if (this.logs.length === 0) {
      return stats;
    }

    let totalResponseTime = 0;
    let cacheHits = 0;
    let networkErrors = 0;

    this.logs.forEach(log => {
      // Count by strategy
      stats.byStrategy[log.strategy] = (stats.byStrategy[log.strategy] || 0) + 1;

      // Count by result
      stats.byResult[log.result] = (stats.byResult[log.result] || 0) + 1;

      // Sum response times
      totalResponseTime += log.responseTime;

      // Count cache hits
      if (log.result === 'cache-hit') {
        cacheHits++;
      }

      // Count network errors
      if (log.result === 'network-error') {
        networkErrors++;
      }
    });

    stats.averageResponseTime = Math.round(totalResponseTime / this.logs.length);
    stats.cacheHitRate = (cacheHits / this.logs.length) * 100;
    stats.networkErrorRate = (networkErrors / this.logs.length) * 100;

    return stats;
  }

  /**
   * Get performance insights
   */
  getPerformanceInsights(): {
    fastestStrategy: string;
    slowestStrategy: string;
    averageByStrategy: Record<string, number>;
    cacheEfficiency: number;
  } {
    const strategyTimes: Record<string, number[]> = {};

    this.logs.forEach(log => {
      if (!strategyTimes[log.strategy]) {
        strategyTimes[log.strategy] = [];
      }
      strategyTimes[log.strategy].push(log.responseTime);
    });

    const averageByStrategy: Record<string, number> = {};
    let fastestStrategy = '';
    let slowestStrategy = '';
    let fastestTime = Infinity;
    let slowestTime = 0;

    Object.entries(strategyTimes).forEach(([strategy, times]) => {
      const average = times.reduce((sum, time) => sum + time, 0) / times.length;
      averageByStrategy[strategy] = Math.round(average);

      if (average < fastestTime) {
        fastestTime = average;
        fastestStrategy = strategy;
      }

      if (average > slowestTime) {
        slowestTime = average;
        slowestStrategy = strategy;
      }
    });

    // Calculate cache efficiency (cache hits vs total requests)
    const cacheHits = this.logs.filter(log => log.result === 'cache-hit').length;
    const cacheEfficiency = this.logs.length > 0 ? (cacheHits / this.logs.length) * 100 : 0;

    return {
      fastestStrategy,
      slowestStrategy,
      averageByStrategy,
      cacheEfficiency,
    };
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
    
    if (this.config.persistToStorage) {
      try {
        localStorage.removeItem(this.STORAGE_KEY);
      } catch (error) {
        console.error('[CacheLogger] Failed to clear logs from storage:', error);
      }
    }
  }

  /**
   * Clear logs older than specified time
   */
  clearOldLogs(olderThan: number): void {
    const cutoff = Date.now() - olderThan;
    this.logs = this.logs.filter(log => log.timestamp >= cutoff);
    
    if (this.config.persistToStorage) {
      this.persistLogs();
    }
  }

  /**
   * Persist logs to localStorage
   */
  private persistLogs(): void {
    try {
      const serialized = JSON.stringify(this.logs);
      localStorage.setItem(this.STORAGE_KEY, serialized);
    } catch (error) {
      console.error('[CacheLogger] Failed to persist logs:', error);
    }
  }

  /**
   * Restore logs from localStorage
   */
  private restoreLogs(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.logs = JSON.parse(stored);
        console.log(`[CacheLogger] Restored ${this.logs.length} cache decision logs from storage`);
      }
    } catch (error) {
      console.error('[CacheLogger] Failed to restore logs:', error);
    }
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Export logs as CSV
   */
  exportLogsCSV(): string {
    const headers = ['ID', 'Timestamp', 'URL', 'Method', 'Strategy', 'Result', 'Response Time (ms)', 'Cache Age (ms)', 'Size (bytes)'];
    const rows = this.logs.map(log => [
      log.id,
      new Date(log.timestamp).toISOString(),
      log.url,
      log.method,
      log.strategy,
      log.result,
      log.responseTime,
      log.cacheAge || '',
      log.size || '',
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    return csv;
  }

  /**
   * Print summary to console
   */
  printSummary(): void {
    if (!this.isDevelopment) {
      return;
    }

    const stats = this.getStats();
    const insights = this.getPerformanceInsights();

    console.group('%c📊 Cache Performance Summary', 'color: #3b82f6; font-weight: bold; font-size: 14px;');
    console.log('Total Requests:', stats.total);
    console.log('Cache Hit Rate:', `${stats.cacheHitRate.toFixed(2)}%`);
    console.log('Network Error Rate:', `${stats.networkErrorRate.toFixed(2)}%`);
    console.log('Average Response Time:', `${stats.averageResponseTime}ms`);
    console.log('');
    console.log('By Strategy:');
    Object.entries(stats.byStrategy).forEach(([strategy, count]) => {
      const avg = insights.averageByStrategy[strategy] || 0;
      console.log(`  ${strategy}: ${count} requests (avg: ${avg}ms)`);
    });
    console.log('');
    console.log('By Result:');
    Object.entries(stats.byResult).forEach(([result, count]) => {
      console.log(`  ${result}: ${count}`);
    });
    console.log('');
    console.log('Performance Insights:');
    console.log(`  Fastest Strategy: ${insights.fastestStrategy} (${insights.averageByStrategy[insights.fastestStrategy]}ms)`);
    console.log(`  Slowest Strategy: ${insights.slowestStrategy} (${insights.averageByStrategy[insights.slowestStrategy]}ms)`);
    console.log(`  Cache Efficiency: ${insights.cacheEfficiency.toFixed(2)}%`);
    console.groupEnd();
  }
}

// Export singleton instance
export const cacheLogger = new CacheLogger();

// Export class for custom instances
export { CacheLogger };
