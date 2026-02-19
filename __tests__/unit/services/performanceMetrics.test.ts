import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getPerformanceMetrics,
  createMetricsMiddleware,
  type RouteMetrics,
  type GlobalMetrics,
} from '@/lib/studio/services/performanceMetrics';

function createMockMiddlewareArgs() {
  const req = { url: '/api/test' } as any;
  const res = {
    statusCode: 200,
    send: vi.fn(),
  } as any;
  const next = vi.fn().mockResolvedValue(undefined);
  return { req, res, next };
}

describe('PerformanceMetrics', () => {
  beforeEach(() => {
    getPerformanceMetrics().reset();
  });

  describe('getPerformanceMetrics singleton', () => {
    it('should return same instance on multiple calls', () => {
      const instance1 = getPerformanceMetrics();
      const instance2 = getPerformanceMetrics();
      expect(instance1).toBe(instance2);
    });
  });

  describe('recordRequest', () => {
    it('should record a request for a new route', () => {
      const collector = getPerformanceMetrics();
      collector.recordRequest('/api/users', 50, false);

      const metrics = collector.getRouteMetrics('/api/users');
      expect(metrics).not.toBeNull();
      expect(metrics!.route).toBe('/api/users');
      expect(metrics!.requestCount).toBe(1);
    });

    it('should increment request count', () => {
      const collector = getPerformanceMetrics();
      collector.recordRequest('/api/data', 30, false);
      collector.recordRequest('/api/data', 45, false);
      collector.recordRequest('/api/data', 60, false);

      const metrics = collector.getRouteMetrics('/api/data');
      expect(metrics!.requestCount).toBe(3);
    });

    it('should increment error count for errors', () => {
      const collector = getPerformanceMetrics();
      collector.recordRequest('/api/error', 25, false);
      collector.recordRequest('/api/error', 35, true);
      collector.recordRequest('/api/error', 40, true);

      const metrics = collector.getRouteMetrics('/api/error');
      expect(metrics!.requestCount).toBe(3);
      expect(metrics!.errorCount).toBe(2);
    });

    it('should handle multiple routes independently', () => {
      const collector = getPerformanceMetrics();
      collector.recordRequest('/api/users', 50, false);
      collector.recordRequest('/api/posts', 75, false);
      collector.recordRequest('/api/users', 60, true);

      const userMetrics = collector.getRouteMetrics('/api/users');
      const postMetrics = collector.getRouteMetrics('/api/posts');

      expect(userMetrics!.requestCount).toBe(2);
      expect(userMetrics!.errorCount).toBe(1);
      expect(postMetrics!.requestCount).toBe(1);
      expect(postMetrics!.errorCount).toBe(0);
    });
  });

  describe('getRouteMetrics', () => {
    it('should return null for unknown route', () => {
      const collector = getPerformanceMetrics();
      const metrics = collector.getRouteMetrics('/api/unknown');
      expect(metrics).toBeNull();
    });

    it('should calculate correct error rate', () => {
      const collector = getPerformanceMetrics();
      collector.recordRequest('/api/endpoint', 20, false);
      collector.recordRequest('/api/endpoint', 25, false);
      collector.recordRequest('/api/endpoint', 30, true);
      collector.recordRequest('/api/endpoint', 35, true);

      const metrics = collector.getRouteMetrics('/api/endpoint');
      expect(metrics!.errorRate).toBe(0.5);
    });

    it('should calculate P50 latency', () => {
      const collector = getPerformanceMetrics();

      for (let i = 1; i <= 100; i++) {
        collector.recordRequest('/api/test', i, false);
      }

      const metrics = collector.getRouteMetrics('/api/test');
      expect(metrics!.latencyP50).toBe(50);
    });

    it('should calculate P95 latency', () => {
      const collector = getPerformanceMetrics();

      for (let i = 1; i <= 100; i++) {
        collector.recordRequest('/api/test', i, false);
      }

      const metrics = collector.getRouteMetrics('/api/test');
      expect(metrics!.latencyP95).toBe(95);
    });

    it('should calculate P99 latency', () => {
      const collector = getPerformanceMetrics();

      for (let i = 1; i <= 100; i++) {
        collector.recordRequest('/api/test', i, false);
      }

      const metrics = collector.getRouteMetrics('/api/test');
      expect(metrics!.latencyP99).toBe(99);
    });

    it('should handle single request latency', () => {
      const collector = getPerformanceMetrics();
      collector.recordRequest('/api/single', 42, false);

      const metrics = collector.getRouteMetrics('/api/single');
      expect(metrics!.latencyP50).toBe(42);
      expect(metrics!.latencyP95).toBe(42);
      expect(metrics!.latencyP99).toBe(42);
    });

    it('should respect circular buffer limit (1000 entries)', () => {
      const collector = getPerformanceMetrics();

      for (let i = 1; i <= 1100; i++) {
        collector.recordRequest('/api/buffer-test', i, false);
      }

      const metrics = collector.getRouteMetrics('/api/buffer-test');
      expect(metrics!.requestCount).toBe(1100);

      // Buffer holds [101..1100] after shift; P50=600, P95=1050, P99=1090
      expect(metrics!.latencyP50).toBe(600);
      expect(metrics!.latencyP95).toBe(1050);
      expect(metrics!.latencyP99).toBe(1090);
    });
  });

  describe('getGlobalMetrics', () => {
    it('should aggregate across all routes', () => {
      const collector = getPerformanceMetrics();
      collector.recordRequest('/api/users', 50, false);
      collector.recordRequest('/api/users', 60, false);
      collector.recordRequest('/api/posts', 75, false);
      collector.recordRequest('/api/posts', 80, false);
      collector.recordRequest('/api/comments', 25, false);

      const globalMetrics = collector.getGlobalMetrics();
      expect(globalMetrics.totalRequests).toBe(5);
      expect(globalMetrics.routes.length).toBe(3);
    });

    it('should calculate global error rate', () => {
      const collector = getPerformanceMetrics();
      collector.recordRequest('/api/endpoint1', 30, false);
      collector.recordRequest('/api/endpoint1', 35, false);
      collector.recordRequest('/api/endpoint1', 40, true);
      collector.recordRequest('/api/endpoint2', 50, false);
      collector.recordRequest('/api/endpoint2', 55, true);
      collector.recordRequest('/api/endpoint2', 60, true);

      const globalMetrics = collector.getGlobalMetrics();
      expect(globalMetrics.totalRequests).toBe(6);
      expect(globalMetrics.totalErrors).toBe(3);
      expect(globalMetrics.errorRate).toBe(0.5);
    });

    it('should include uptimeMs', () => {
      const collector = getPerformanceMetrics();
      const beforeTime = Date.now();
      collector.recordRequest('/api/test', 10, false);
      const afterTime = Date.now();

      const globalMetrics = collector.getGlobalMetrics();
      expect(globalMetrics.uptimeMs).toBeGreaterThanOrEqual(0);
      expect(globalMetrics.uptimeMs).toBeLessThanOrEqual(
        afterTime - beforeTime + 100
      );
    });

    it('should include collectionStartedAt timestamp', () => {
      const collector = getPerformanceMetrics();
      const beforeReset = Date.now();
      collector.recordRequest('/api/test', 10, false);
      const afterRequest = Date.now();

      const globalMetrics = collector.getGlobalMetrics();
      expect(globalMetrics.collectionStartedAt).toBeGreaterThanOrEqual(
        beforeReset - 100
      );
      expect(globalMetrics.collectionStartedAt).toBeLessThanOrEqual(
        afterRequest
      );
    });
  });

  describe('reset', () => {
    it('should clear all metrics', () => {
      const collector = getPerformanceMetrics();
      collector.recordRequest('/api/test', 50, false);
      collector.recordRequest('/api/test', 60, false);
      collector.recordRequest('/api/other', 75, true);

      let metrics = collector.getRouteMetrics('/api/test');
      expect(metrics!.requestCount).toBe(2);

      collector.reset();

      metrics = collector.getRouteMetrics('/api/test');
      expect(metrics).toBeNull();

      const globalMetrics = collector.getGlobalMetrics();
      expect(globalMetrics.totalRequests).toBe(0);
      expect(globalMetrics.totalErrors).toBe(0);
      expect(globalMetrics.routes.length).toBe(0);
    });

    it('should reset collectionStartedAt', () => {
      const collector = getPerformanceMetrics();
      collector.recordRequest('/api/test', 50, false);

      const beforeReset = Date.now();
      collector.reset();
      const afterReset = Date.now();

      const globalMetrics = collector.getGlobalMetrics();
      expect(globalMetrics.collectionStartedAt).toBeGreaterThanOrEqual(
        beforeReset - 10
      );
      expect(globalMetrics.collectionStartedAt).toBeLessThanOrEqual(
        afterReset + 10
      );
    });
  });

  describe('createMetricsMiddleware', () => {
    it('should record successful request metrics', async () => {
      const collector = getPerformanceMetrics();
      const middleware = createMetricsMiddleware();
      const { req, res, next } = createMockMiddlewareArgs();

      res.statusCode = 200;
      res.send.mockImplementation((data) => {
        return res;
      });

      await middleware(req, res, next);
      res.send('response');

      const metrics = collector.getRouteMetrics('/api/test');
      expect(metrics).not.toBeNull();
      expect(metrics!.requestCount).toBe(1);
      expect(metrics!.errorCount).toBe(0);
    });

    it('should record error status codes as errors', async () => {
      const collector = getPerformanceMetrics();
      const middleware = createMetricsMiddleware();
      const { req, res, next } = createMockMiddlewareArgs();

      res.statusCode = 500;
      res.send.mockImplementation((data) => {
        return res;
      });

      await middleware(req, res, next);
      res.send('error response');

      const metrics = collector.getRouteMetrics('/api/test');
      expect(metrics!.errorCount).toBe(1);
      expect(metrics!.requestCount).toBe(1);
    });

    it('should handle 400 status code as error', async () => {
      const collector = getPerformanceMetrics();
      const middleware = createMetricsMiddleware();
      const { req, res, next } = createMockMiddlewareArgs();

      res.statusCode = 400;
      res.send.mockImplementation((data) => {
        return res;
      });

      await middleware(req, res, next);
      res.send('bad request');

      const metrics = collector.getRouteMetrics('/api/test');
      expect(metrics!.errorCount).toBe(1);
    });

    it('should handle 404 status code as error', async () => {
      const collector = getPerformanceMetrics();
      const middleware = createMetricsMiddleware();
      const { req, res, next } = createMockMiddlewareArgs();

      res.statusCode = 404;
      res.send.mockImplementation((data) => {
        return res;
      });

      await middleware(req, res, next);
      res.send('not found');

      const metrics = collector.getRouteMetrics('/api/test');
      expect(metrics!.errorCount).toBe(1);
    });

    it('should re-throw exceptions after recording', async () => {
      const collector = getPerformanceMetrics();
      const middleware = createMetricsMiddleware();
      const { req, res, next } = createMockMiddlewareArgs();

      const testError = new Error('Test error');
      next.mockRejectedValue(testError);

      await expect(middleware(req, res, next)).rejects.toThrow('Test error');

      const metrics = collector.getRouteMetrics('/api/test');
      expect(metrics!.errorCount).toBe(1);
      expect(metrics!.requestCount).toBe(1);
    });

    it('should measure latency correctly', async () => {
      const collector = getPerformanceMetrics();
      const middleware = createMetricsMiddleware();
      const { req, res, next } = createMockMiddlewareArgs();

      res.send.mockImplementation((data) => {
        return res;
      });

      next.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(resolve, 50);
          })
      );

      await middleware(req, res, next);
      res.send('response');

      const metrics = collector.getRouteMetrics('/api/test');
      expect(metrics!.latencyP50).toBeGreaterThanOrEqual(50);
    });

    it('should use unknown for missing url', async () => {
      const collector = getPerformanceMetrics();
      const middleware = createMetricsMiddleware();
      const req = { url: undefined } as any;
      const res = {
        statusCode: 200,
        send: vi.fn().mockImplementation((data) => res),
      } as any;
      const next = vi.fn().mockResolvedValue(undefined);

      await middleware(req, res, next);
      res.send('response');

      const metrics = collector.getRouteMetrics('unknown');
      expect(metrics).not.toBeNull();
      expect(metrics!.requestCount).toBe(1);
    });

    it('should preserve original send behavior', async () => {
      const middleware = createMetricsMiddleware();
      const testData = { success: true };
      const req = { url: '/api/test' } as any;
      const originalSend = vi.fn().mockReturnValue('send result');
      const res = {
        statusCode: 200,
        send: originalSend,
      } as any;
      const next = vi.fn().mockResolvedValue(undefined);

      await middleware(req, res, next);
      const result = res.send(testData);

      expect(originalSend).toHaveBeenCalledWith(testData);
      expect(result).toBe('send result');
    });

    it('should handle multiple concurrent requests to different routes', async () => {
      const collector = getPerformanceMetrics();
      const middleware = createMetricsMiddleware();

      const createRequest = (url: string) => {
        const req = { url } as any;
        const res = {
          statusCode: 200,
          send: vi.fn().mockImplementation((data) => res),
        } as any;
        const next = vi.fn().mockResolvedValue(undefined);
        return { req, res, next };
      };

      const req1 = createRequest('/api/users');
      const req2 = createRequest('/api/posts');

      await Promise.all([
        middleware(req1.req, req1.res, req1.next),
        middleware(req2.req, req2.res, req2.next),
      ]);

      req1.res.send('users');
      req2.res.send('posts');

      const userMetrics = collector.getRouteMetrics('/api/users');
      const postMetrics = collector.getRouteMetrics('/api/posts');

      expect(userMetrics!.requestCount).toBe(1);
      expect(postMetrics!.requestCount).toBe(1);
    });

    it('should record error when next throws and res.statusCode is not set', async () => {
      const collector = getPerformanceMetrics();
      const middleware = createMetricsMiddleware();
      const { req, res, next } = createMockMiddlewareArgs();

      res.statusCode = undefined;
      const testError = new Error('Request failed');
      next.mockRejectedValue(testError);

      await expect(middleware(req, res, next)).rejects.toThrow('Request failed');

      const metrics = collector.getRouteMetrics('/api/test');
      expect(metrics!.errorCount).toBe(1);
    });
  });

  describe('edge cases', () => {
    it('should handle zero duration', () => {
      const collector = getPerformanceMetrics();
      collector.recordRequest('/api/instant', 0, false);

      const metrics = collector.getRouteMetrics('/api/instant');
      expect(metrics!.latencyP50).toBe(0);
      expect(metrics!.latencyP99).toBe(0);
    });

    it('should handle very large duration values', () => {
      const collector = getPerformanceMetrics();
      collector.recordRequest('/api/slow', 999999, false);

      const metrics = collector.getRouteMetrics('/api/slow');
      expect(metrics!.latencyP50).toBe(999999);
    });

    it('should handle routes with special characters', () => {
      const collector = getPerformanceMetrics();
      const specialRoute = '/api/users/:id/posts/:postId';
      collector.recordRequest(specialRoute, 50, false);

      const metrics = collector.getRouteMetrics(specialRoute);
      expect(metrics).not.toBeNull();
      expect(metrics!.route).toBe(specialRoute);
    });

    it('should calculate percentiles correctly with uneven distribution', () => {
      const collector = getPerformanceMetrics();

      const latencies = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      for (const latency of latencies) {
        collector.recordRequest('/api/uneven', latency, false);
      }

      const metrics = collector.getRouteMetrics('/api/uneven');
      expect(metrics!.latencyP50).toBeGreaterThan(0);
      expect(metrics!.latencyP95).toBeGreaterThanOrEqual(metrics!.latencyP50);
      expect(metrics!.latencyP99).toBeGreaterThanOrEqual(metrics!.latencyP95);
    });

    it('should handle error rate of 0', () => {
      const collector = getPerformanceMetrics();
      for (let i = 0; i < 10; i++) {
        collector.recordRequest('/api/success', 50, false);
      }

      const metrics = collector.getRouteMetrics('/api/success');
      expect(metrics!.errorRate).toBe(0);
    });

    it('should handle error rate of 1', () => {
      const collector = getPerformanceMetrics();
      for (let i = 0; i < 10; i++) {
        collector.recordRequest('/api/failure', 50, true);
      }

      const metrics = collector.getRouteMetrics('/api/failure');
      expect(metrics!.errorRate).toBe(1);
    });

    it('should update lastRequestAt on each request', () => {
      const collector = getPerformanceMetrics();
      collector.recordRequest('/api/timestamp', 50, false);
      const firstMetrics = collector.getRouteMetrics('/api/timestamp')!;
      const firstTime = firstMetrics.lastRequestAt;

      collector.recordRequest('/api/timestamp', 60, false);
      const secondMetrics = collector.getRouteMetrics('/api/timestamp')!;
      const secondTime = secondMetrics.lastRequestAt;

      expect(secondTime).toBeGreaterThanOrEqual(firstTime);
    });
  });
});
