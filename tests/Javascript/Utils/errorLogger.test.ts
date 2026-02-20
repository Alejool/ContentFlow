import { describe, it, expect, beforeEach } from 'vitest';
import { ErrorLogger } from '../../../resources/js/Utils/errorLogger';

describe('ErrorLogger', () => {
  let logger: ErrorLogger;

  beforeEach(() => {
    logger = new ErrorLogger({
      maxLogs: 10,
      persistToStorage: false,
      consoleOutput: false,
    });
  });

  it('should log an error with comprehensive details', () => {
    const error = new Error('Test error');
    const log = logger.logError(error, {
      type: 'optimistic',
      operation: 'create_post',
      resource: 'posts',
      resourceId: 123,
      severity: 'error',
    });

    expect(log).toBeDefined();
    expect(log.message).toBe('Test error');
    expect(log.type).toBe('optimistic');
    expect(log.operation).toBe('create_post');
    expect(log.resource).toBe('posts');
    expect(log.resourceId).toBe(123);
    expect(log.severity).toBe('error');
    expect(log.stackTrace).toBeDefined();
  });

  it('should maintain a queue of logs', () => {
    for (let i = 0; i < 5; i++) {
      logger.logError(new Error(`Error ${i}`), {
        type: 'optimistic',
        severity: 'error',
      });
    }

    const logs = logger.getLogs();
    expect(logs).toHaveLength(5);
  });

  it('should filter logs by type', () => {
    logger.logError(new Error('Error 1'), { type: 'optimistic', severity: 'error' });
    logger.logError(new Error('Error 2'), { type: 'cache', severity: 'error' });
    logger.logError(new Error('Error 3'), { type: 'optimistic', severity: 'error' });

    const optimisticLogs = logger.getLogs({ type: 'optimistic' });
    expect(optimisticLogs).toHaveLength(2);
  });

  it('should provide error statistics', () => {
    logger.logError(new Error('Error 1'), { type: 'optimistic', severity: 'error' });
    logger.logError(new Error('Error 2'), { type: 'cache', severity: 'warning' });
    logger.logError(new Error('Error 3'), { type: 'optimistic', severity: 'error' });

    const stats = logger.getStats();
    expect(stats.total).toBe(3);
    expect(stats.byType.optimistic).toBe(2);
    expect(stats.byType.cache).toBe(1);
    expect(stats.bySeverity.error).toBe(2);
    expect(stats.bySeverity.warning).toBe(1);
  });

  it('should clear logs', () => {
    logger.logError(new Error('Error 1'), { type: 'optimistic', severity: 'error' });
    logger.logError(new Error('Error 2'), { type: 'cache', severity: 'error' });

    expect(logger.getLogs()).toHaveLength(2);

    logger.clearLogs();
    expect(logger.getLogs()).toHaveLength(0);
  });

  it('should export logs as JSON', () => {
    logger.logError(new Error('Error 1'), { type: 'optimistic', severity: 'error' });
    
    const json = logger.exportLogs();
    const parsed = JSON.parse(json);
    
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].message).toBe('Error 1');
  });
});
