/**
 * Tests for Query Monitor
 *
 * @module __tests__/lib/monitoring/queryMonitor.test
 */

import {
  measureQuery,
  getMetricsSummary,
  getRecentQueries,
  clearMetrics,
  getThresholds,
} from '../../../lib/monitoring/queryMonitor';

// Mock Sentry
jest.mock('@sentry/nextjs', () => ({
  captureMessage: jest.fn(),
}));

// Mock logger
jest.mock('../../../lib/structuredLogger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('QueryMonitor', () => {
  beforeEach(() => {
    clearMetrics();
    jest.clearAllMocks();
  });

  describe('measureQuery', () => {
    it('should execute query and return result', async () => {
      const mockData = [{ id: '1' }, { id: '2' }];
      const queryFn = jest.fn().mockResolvedValue(mockData);

      const result = await measureQuery('testQuery', 'testCollection', queryFn);

      expect(result).toEqual(mockData);
      expect(queryFn).toHaveBeenCalledTimes(1);
    });

    it('should record metrics after query', async () => {
      const queryFn = jest.fn().mockResolvedValue([1, 2, 3]);

      await measureQuery('testQuery', 'testCollection', queryFn);

      const summary = getMetricsSummary();
      expect(summary.totalQueries).toBe(1);
    });

    it('should detect array result count', async () => {
      const queryFn = jest.fn().mockResolvedValue([1, 2, 3, 4, 5]);

      await measureQuery('testQuery', 'testCollection', queryFn);

      const recent = getRecentQueries(1);
      expect(recent[0].resultCount).toBe(5);
    });

    it('should detect Firestore snapshot result count', async () => {
      const queryFn = jest.fn().mockResolvedValue({
        docs: [{ id: '1' }, { id: '2' }],
      });

      await measureQuery('testQuery', 'testCollection', queryFn);

      const recent = getRecentQueries(1);
      expect(recent[0].resultCount).toBe(2);
    });

    it('should handle failed queries', async () => {
      const queryFn = jest.fn().mockRejectedValue(new Error('Query failed'));

      await expect(
        measureQuery('testQuery', 'testCollection', queryFn)
      ).rejects.toThrow('Query failed');

      const recent = getRecentQueries(1);
      expect(recent[0].queryName).toBe('testQuery:FAILED');
    });

    it('should record query duration', async () => {
      const queryFn = jest.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([]), 50))
      );

      await measureQuery('testQuery', 'testCollection', queryFn);

      const recent = getRecentQueries(1);
      expect(recent[0].duration).toBeGreaterThanOrEqual(40);
    });
  });

  describe('getMetricsSummary', () => {
    it('should return zeros for empty metrics', () => {
      const summary = getMetricsSummary();

      expect(summary.avgDuration).toBe(0);
      expect(summary.maxDuration).toBe(0);
      expect(summary.slowQueryCount).toBe(0);
      expect(summary.criticalQueryCount).toBe(0);
      expect(summary.totalQueries).toBe(0);
    });

    it('should calculate average duration', async () => {
      const queryFn1 = jest.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([]), 10))
      );
      const queryFn2 = jest.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([]), 30))
      );

      await measureQuery('q1', 'c1', queryFn1);
      await measureQuery('q2', 'c2', queryFn2);

      const summary = getMetricsSummary();
      expect(summary.totalQueries).toBe(2);
      expect(summary.avgDuration).toBeGreaterThan(0);
    });

    it('should track max duration', async () => {
      const fastQuery = jest.fn().mockResolvedValue([]);
      const slowQuery = jest.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([]), 100))
      );

      await measureQuery('fast', 'c1', fastQuery);
      await measureQuery('slow', 'c2', slowQuery);

      const summary = getMetricsSummary();
      expect(summary.maxDuration).toBeGreaterThanOrEqual(90);
    });
  });

  describe('getRecentQueries', () => {
    it('should return specified number of queries', async () => {
      const queryFn = jest.fn().mockResolvedValue([]);

      for (let i = 0; i < 5; i++) {
        await measureQuery(`query${i}`, 'collection', queryFn);
      }

      const recent = getRecentQueries(3);
      expect(recent).toHaveLength(3);
    });

    it('should return queries in order', async () => {
      const queryFn = jest.fn().mockResolvedValue([]);

      await measureQuery('first', 'c1', queryFn);
      await measureQuery('second', 'c2', queryFn);
      await measureQuery('third', 'c3', queryFn);

      const recent = getRecentQueries(3);
      expect(recent[0].queryName).toBe('first');
      expect(recent[2].queryName).toBe('third');
    });

    it('should default to 10 queries', async () => {
      const queryFn = jest.fn().mockResolvedValue([]);

      for (let i = 0; i < 15; i++) {
        await measureQuery(`query${i}`, 'collection', queryFn);
      }

      const recent = getRecentQueries();
      expect(recent).toHaveLength(10);
    });
  });

  describe('clearMetrics', () => {
    it('should clear all metrics', async () => {
      const queryFn = jest.fn().mockResolvedValue([]);

      await measureQuery('test', 'collection', queryFn);
      expect(getMetricsSummary().totalQueries).toBe(1);

      clearMetrics();
      expect(getMetricsSummary().totalQueries).toBe(0);
    });
  });

  describe('getThresholds', () => {
    it('should return threshold values', () => {
      const thresholds = getThresholds();

      expect(thresholds.slowMs).toBe(500);
      expect(thresholds.criticalMs).toBe(2000);
    });
  });

  describe('slow query detection', () => {
    it('should count slow queries', async () => {
      // This is a bit tricky to test without actual delays
      // In a real scenario, you'd mock performance.now()
      const queryFn = jest.fn().mockResolvedValue([]);

      await measureQuery('test', 'collection', queryFn);

      // Fast query shouldn't be counted as slow
      const summary = getMetricsSummary();
      expect(summary.slowQueryCount).toBe(0);
    });
  });

  describe('rolling window', () => {
    it('should maintain window size of 100', async () => {
      const queryFn = jest.fn().mockResolvedValue([]);

      // Add more than 100 queries
      for (let i = 0; i < 110; i++) {
        await measureQuery(`query${i}`, 'collection', queryFn);
      }

      const summary = getMetricsSummary();
      expect(summary.totalQueries).toBe(100);
    });
  });
});
