/**
 * Error Logger Utility
 * Provides comprehensive error logging for optimistic updates and service worker
 * 
 * Requirements: 3.5, 10.3
 */

export interface ErrorLog {
  id: string;
  timestamp: number;
  type: 'optimistic' | 'service-worker' | 'cache' | 'sync' | 'network' | 'unknown';
  operation?: string;
  resource?: string;
  resourceId?: string | number;
  message: string;
  code?: string;
  status?: number;
  data?: any;
  stackTrace?: string;
  context?: Record<string, any>;
  severity: 'error' | 'warning' | 'info';
}

export interface ErrorLoggerConfig {
  maxLogs?: number;
  persistToStorage?: boolean;
  consoleOutput?: boolean;
  onError?: (log: ErrorLog) => void;
}

class ErrorLogger {
  private logs: ErrorLog[] = [];
  private config: ErrorLoggerConfig;
  private readonly STORAGE_KEY = 'error-logs';
  private readonly isDevelopment: boolean;

  constructor(config: ErrorLoggerConfig = {}) {
    this.config = {
      maxLogs: config.maxLogs || 100,
      persistToStorage: config.persistToStorage !== false,
      consoleOutput: config.consoleOutput !== false,
      onError: config.onError,
    };
    
    this.isDevelopment = import.meta.env.DEV;
    
    // Restore logs from storage on initialization
    if (this.config.persistToStorage) {
      this.restoreLogs();
    }
  }

  /**
   * Log an error with comprehensive details
   * Requirements: 3.5, 10.3
   */
  logError(error: Error | any, context?: {
    type?: ErrorLog['type'];
    operation?: string;
    resource?: string;
    resourceId?: string | number;
    data?: any;
    severity?: ErrorLog['severity'];
  }): ErrorLog {
    const errorLog: ErrorLog = {
      id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type: context?.type || 'unknown',
      operation: context?.operation,
      resource: context?.resource,
      resourceId: context?.resourceId,
      message: error?.message || String(error),
      code: error?.code,
      status: error?.response?.status || error?.status,
      data: context?.data || error?.response?.data,
      stackTrace: error?.stack,
      context: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        online: typeof navigator !== 'undefined' ? navigator.onLine : undefined,
        ...context,
      },
      severity: context?.severity || 'error',
    };

    // Add to logs array
    this.logs.push(errorLog);

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
      this.outputToConsole(errorLog);
    }

    // Call custom error handler
    if (this.config.onError) {
      try {
        this.config.onError(errorLog);
      } catch (handlerError) {
        }
    }

    return errorLog;
  }

  /**
   * Output error to console with formatting
   */
  private outputToConsole(log: ErrorLog): void {
    const emoji = log.severity === 'error' ? '❌' : log.severity === 'warning' ? '⚠️' : 'ℹ️';
    const color = log.severity === 'error' ? '#ef4444' : log.severity === 'warning' ? '#f59e0b' : '#3b82f6';

    }] ${log.message}`, `color: ${color}; font-weight: bold;`);
    .toISOString());
    if (log.operation) if (log.resource) if (log.resourceId) if (log.code) if (log.status) if (log.data) if (log.context) if (log.stackTrace && this.isDevelopment) {
      }
    
    }

  /**
   * Get all error logs
   */
  getLogs(filter?: {
    type?: ErrorLog['type'];
    resource?: string;
    severity?: ErrorLog['severity'];
    since?: number;
  }): ErrorLog[] {
    let filtered = [...this.logs];

    if (filter) {
      if (filter.type) {
        filtered = filtered.filter(log => log.type === filter.type);
      }
      if (filter.resource) {
        filtered = filtered.filter(log => log.resource === filter.resource);
      }
      if (filter.severity) {
        filtered = filtered.filter(log => log.severity === filter.severity);
      }
      if (filter.since) {
        filtered = filtered.filter(log => log.timestamp >= filter.since);
      }
    }

    return filtered;
  }

  /**
   * Get error statistics
   */
  getStats(): {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    byResource: Record<string, number>;
    recentErrors: number;
  } {
    const now = Date.now();
    const last24Hours = now - 24 * 60 * 60 * 1000;

    const stats = {
      total: this.logs.length,
      byType: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
      byResource: {} as Record<string, number>,
      recentErrors: 0,
    };

    this.logs.forEach(log => {
      // Count by type
      stats.byType[log.type] = (stats.byType[log.type] || 0) + 1;

      // Count by severity
      stats.bySeverity[log.severity] = (stats.bySeverity[log.severity] || 0) + 1;

      // Count by resource
      if (log.resource) {
        stats.byResource[log.resource] = (stats.byResource[log.resource] || 0) + 1;
      }

      // Count recent errors
      if (log.timestamp >= last24Hours) {
        stats.recentErrors++;
      }
    });

    return stats;
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
        
        if (this.isDevelopment) {
          }
      }
    } catch (error) {
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
    const headers = ['ID', 'Timestamp', 'Type', 'Severity', 'Operation', 'Resource', 'Message', 'Code', 'Status'];
    const rows = this.logs.map(log => [
      log.id,
      new Date(log.timestamp).toISOString(),
      log.type,
      log.severity,
      log.operation || '',
      log.resource || '',
      log.message,
      log.code || '',
      log.status || '',
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    return csv;
  }
}

// Export singleton instance
export const errorLogger = new ErrorLogger();

// Export class for custom instances
export { ErrorLogger };
