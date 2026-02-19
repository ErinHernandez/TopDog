import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  mockPing: vi.fn(),
  mockGetStats: vi.fn(),
  mockGetJobsByStatus: vi.fn(),
  mockLogInfo: vi.fn(),
}));

vi.mock('@/lib/studio/infrastructure/redis/upstashClient', () => ({
  getRedisClient: () => ({
    ping: mocks.mockPing,
  }),
}));

vi.mock('@/lib/studio/infrastructure/cache/cacheManager', () => ({
  getCacheManager: () => ({
    getStats: mocks.mockGetStats,
  }),
}));

vi.mock('@/lib/studio/infrastructure/queue/firestoreJobQueue', () => ({
  getJobQueue: () => ({
    getJobsByStatus: mocks.mockGetJobsByStatus,
  }),
}));

vi.mock('@/lib/studio/services/serverLogger', () => ({
  serverLogger: {
    info: mocks.mockLogInfo,
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import handler from '@/pages/api/health/deep';

function createMockReq(overrides = {}) {
  return { method: 'GET', headers: {}, ...overrides } as any;
}

function createMockRes() {
  const res: any = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    setHeader: vi.fn().mockReturnThis(),
  };
  return res;
}

describe('GET /api/health/deep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.APP_VERSION = '1.0.0';
  });

  it('should return 405 for non-GET requests', async () => {
    const req = createMockReq({ method: 'POST' });
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalled();
    const response = res.json.mock.calls[0][0];
    expect(response.status).toBe('unhealthy');
  });

  it('should return healthy state when all subsystems are up', async () => {
    mocks.mockPing.mockResolvedValue(true);
    mocks.mockGetStats.mockReturnValue({
      l1Hits: 100,
      l2Hits: 50,
      misses: 25,
      l1Size: 5000,
      evictions: 0,
    });
    mocks.mockGetJobsByStatus.mockImplementation((status: string) => {
      if (status === 'PENDING') return Promise.resolve([]);
      if (status === 'RUNNING') return Promise.resolve([]);
      return Promise.resolve([]);
    });

    const req = createMockReq();
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const response = res.json.mock.calls[0][0];
    expect(response.status).toBe('healthy');
    expect(response.checks.redis.status).toBe('up');
    expect(response.checks.cache.status).toBe('up');
    expect(response.checks.queue.status).toBe('up');
  });

  it('should return degraded state when only Redis is down', async () => {
    mocks.mockPing.mockRejectedValue(new Error('Redis connection failed'));
    mocks.mockGetStats.mockReturnValue({
      l1Hits: 100,
      l2Hits: 50,
      misses: 25,
      l1Size: 5000,
      evictions: 0,
    });
    mocks.mockGetJobsByStatus.mockImplementation((status: string) => {
      if (status === 'PENDING') return Promise.resolve([]);
      if (status === 'RUNNING') return Promise.resolve([]);
      return Promise.resolve([]);
    });

    const req = createMockReq();
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const response = res.json.mock.calls[0][0];
    expect(response.status).toBe('degraded');
    expect(response.checks.redis.status).toBe('down');
    expect(response.checks.cache.status).toBe('up');
    expect(response.checks.queue.status).toBe('up');
  });

  it('should return unhealthy state when multiple subsystems are down', async () => {
    mocks.mockPing.mockRejectedValue(new Error('Redis connection failed'));
    mocks.mockGetStats.mockReturnValue({
      l1Hits: 100,
      l2Hits: 50,
      misses: 25,
      l1Size: 5000,
      evictions: 0,
    });
    mocks.mockGetJobsByStatus.mockRejectedValue(new Error('Queue connection failed'));

    const req = createMockReq();
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(503);
    const response = res.json.mock.calls[0][0];
    expect(response.status).toBe('unhealthy');
    expect(response.checks.redis.status).toBe('down');
    expect(response.checks.queue.status).toBe('down');
  });

  it('should include Redis latency when Redis is up', async () => {
    mocks.mockPing.mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return true;
    });
    mocks.mockGetStats.mockReturnValue({
      l1Hits: 100,
      l2Hits: 50,
      misses: 25,
      l1Size: 5000,
      evictions: 0,
    });
    mocks.mockGetJobsByStatus.mockImplementation((status: string) => {
      if (status === 'PENDING') return Promise.resolve([]);
      if (status === 'RUNNING') return Promise.resolve([]);
      return Promise.resolve([]);
    });

    const req = createMockReq();
    const res = createMockRes();

    await handler(req, res);

    const response = res.json.mock.calls[0][0];
    expect(response.checks.redis.latencyMs).toBeDefined();
    expect(typeof response.checks.redis.latencyMs).toBe('number');
    expect(response.checks.redis.latencyMs).toBeGreaterThanOrEqual(10);
  });

  it('should include cache stats and hitRate', async () => {
    mocks.mockPing.mockResolvedValue(true);
    mocks.mockGetStats.mockReturnValue({
      l1Hits: 100,
      l2Hits: 50,
      misses: 25,
      l1Size: 5000,
      evictions: 2,
    });
    mocks.mockGetJobsByStatus.mockImplementation((status: string) => {
      if (status === 'PENDING') return Promise.resolve([]);
      if (status === 'RUNNING') return Promise.resolve([]);
      return Promise.resolve([]);
    });

    const req = createMockReq();
    const res = createMockRes();

    await handler(req, res);

    const response = res.json.mock.calls[0][0];
    expect(response.checks.cache.stats).toEqual({
      l1Hits: 100,
      l2Hits: 50,
      misses: 25,
      l1Size: 5000,
      evictions: 2,
    });
    expect(response.checks.cache.hitRate).toBeDefined();
    const expectedHitRate = ((100 + 50) / (100 + 50 + 25)) * 100;
    expect(response.checks.cache.hitRate).toBe(Math.round(expectedHitRate * 100) / 100);
  });

  it('should include queue metrics with pending and running job counts', async () => {
    mocks.mockPing.mockResolvedValue(true);
    mocks.mockGetStats.mockReturnValue({
      l1Hits: 100,
      l2Hits: 50,
      misses: 25,
      l1Size: 5000,
      evictions: 0,
    });
    mocks.mockGetJobsByStatus.mockImplementation((status: string) => {
      if (status === 'PENDING') {
        return Promise.resolve([
          { id: 'job1', status: 'PENDING', createdAt: Date.now() },
          { id: 'job2', status: 'PENDING', createdAt: Date.now() },
        ]);
      }
      if (status === 'RUNNING') {
        return Promise.resolve([
          { id: 'job3', status: 'RUNNING', createdAt: Date.now() },
        ]);
      }
      return Promise.resolve([]);
    });

    const req = createMockReq();
    const res = createMockRes();

    await handler(req, res);

    const response = res.json.mock.calls[0][0];
    expect(response.checks.queue.pendingJobs).toBe(2);
    expect(response.checks.queue.runningJobs).toBe(1);
  });

  it('should calculate oldestPendingAgeMs when pending jobs exist', async () => {
    const fiveSecondsAgo = Date.now() - 5000;

    mocks.mockPing.mockResolvedValue(true);
    mocks.mockGetStats.mockReturnValue({
      l1Hits: 100,
      l2Hits: 50,
      misses: 25,
      l1Size: 5000,
      evictions: 0,
    });
    mocks.mockGetJobsByStatus.mockImplementation((status: string) => {
      if (status === 'PENDING') {
        return Promise.resolve([
          {
            id: 'job1',
            status: 'PENDING',
            createdAt: fiveSecondsAgo,
          },
          {
            id: 'job2',
            status: 'PENDING',
            createdAt: Date.now() - 2000,
          },
        ]);
      }
      if (status === 'RUNNING') return Promise.resolve([]);
      return Promise.resolve([]);
    });

    const req = createMockReq();
    const res = createMockRes();

    await handler(req, res);

    const response = res.json.mock.calls[0][0];
    expect(response.checks.queue.oldestPendingAgeMs).toBeDefined();
    expect(response.checks.queue.oldestPendingAgeMs).toBeGreaterThanOrEqual(4900);
    expect(response.checks.queue.oldestPendingAgeMs).toBeLessThanOrEqual(5100);
  });

  it('should set CORS headers', async () => {
    mocks.mockPing.mockResolvedValue(true);
    mocks.mockGetStats.mockReturnValue({
      l1Hits: 100,
      l2Hits: 50,
      misses: 25,
      l1Size: 5000,
      evictions: 0,
    });
    mocks.mockGetJobsByStatus.mockImplementation((status: string) => {
      if (status === 'PENDING') return Promise.resolve([]);
      if (status === 'RUNNING') return Promise.resolve([]);
      return Promise.resolve([]);
    });

    const req = createMockReq();
    const res = createMockRes();

    await handler(req, res);

    expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
    expect(res.setHeader).toHaveBeenCalledWith(
      'Access-Control-Allow-Methods',
      'GET, OPTIONS'
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      'Access-Control-Allow-Headers',
      'Content-Type'
    );
  });

  it('should log health check completion with status', async () => {
    mocks.mockPing.mockResolvedValue(true);
    mocks.mockGetStats.mockReturnValue({
      l1Hits: 100,
      l2Hits: 50,
      misses: 25,
      l1Size: 5000,
      evictions: 0,
    });
    mocks.mockGetJobsByStatus.mockImplementation((status: string) => {
      if (status === 'PENDING') return Promise.resolve([]);
      if (status === 'RUNNING') return Promise.resolve([]);
      return Promise.resolve([]);
    });

    const req = createMockReq();
    const res = createMockRes();

    await handler(req, res);

    expect(mocks.mockLogInfo).toHaveBeenCalledWith(
      'health_check_completed',
      expect.objectContaining({
        status: 'healthy',
        redisStatus: 'up',
        cacheStatus: 'up',
        queueStatus: 'up',
        httpStatus: 200,
      })
    );
  });

  it('should include version and uptime in response', async () => {
    mocks.mockPing.mockResolvedValue(true);
    mocks.mockGetStats.mockReturnValue({
      l1Hits: 100,
      l2Hits: 50,
      misses: 25,
      l1Size: 5000,
      evictions: 0,
    });
    mocks.mockGetJobsByStatus.mockImplementation((status: string) => {
      if (status === 'PENDING') return Promise.resolve([]);
      if (status === 'RUNNING') return Promise.resolve([]);
      return Promise.resolve([]);
    });

    const req = createMockReq();
    const res = createMockRes();

    await handler(req, res);

    const response = res.json.mock.calls[0][0];
    expect(response.version).toBe('1.0.0');
    expect(response.uptime).toBeDefined();
    expect(typeof response.uptime).toBe('number');
    expect(response.uptime).toBeGreaterThan(0);
  });

  it('should include timestamp in response', async () => {
    mocks.mockPing.mockResolvedValue(true);
    mocks.mockGetStats.mockReturnValue({
      l1Hits: 100,
      l2Hits: 50,
      misses: 25,
      l1Size: 5000,
      evictions: 0,
    });
    mocks.mockGetJobsByStatus.mockImplementation((status: string) => {
      if (status === 'PENDING') return Promise.resolve([]);
      if (status === 'RUNNING') return Promise.resolve([]);
      return Promise.resolve([]);
    });

    const req = createMockReq();
    const res = createMockRes();

    await handler(req, res);

    const response = res.json.mock.calls[0][0];
    expect(response.timestamp).toBeDefined();
    expect(typeof response.timestamp).toBe('string');
    expect(new Date(response.timestamp).getTime()).toBeGreaterThan(0);
  });
});
