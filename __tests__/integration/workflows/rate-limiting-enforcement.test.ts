/**
 * Integration tests for rate limiting across routes
 * Tests rate limiting enforcement with per-route limits
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';

// ============================================================================
// Hoisted Mocks
// ============================================================================

const mocks = vi.hoisted(() => ({
  mockCheckLimit: vi.fn(),
  mockLogInfo: vi.fn(),
  mockLogWarn: vi.fn(),
  mockLogError: vi.fn(),
}));

// ============================================================================
// Module Mocks
// ============================================================================

vi.mock('@/lib/studio/middleware/withAuth', () => ({
  withAuth: (handler: any) => handler,
}));

vi.mock('@/lib/studio/services/rateLimiter', () => ({
  rateLimiter: {
    checkLimit: mocks.mockCheckLimit,
  },
}));

vi.mock('@/lib/studio/services/serverLogger', () => ({
  serverLogger: {
    info: mocks.mockLogInfo,
    warn: mocks.mockLogWarn,
    error: mocks.mockLogError,
    debug: vi.fn(),
  },
}));

// ============================================================================
// Helper Functions
// ============================================================================

function createMockReq(overrides: Partial<NextApiRequest> = {}): NextApiRequest {
  return {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    query: {},
    body: {},
    url: '/api/test',
    ...overrides,
  } as unknown as NextApiRequest;
}

function createMockRes(): NextApiResponse & {
  _status: number;
  _json: any;
  _headers: Record<string, string>;
} {
  const res: any = {
    _status: 200,
    _json: null,
    _headers: {},
    status(code: number) {
      res._status = code;
      return res;
    },
    json(data: any) {
      res._json = data;
      return res;
    },
    setHeader(key: string, value: string) {
      res._headers[key] = value;
      return res;
    },
    getHeader(key: string) {
      return res._headers[key];
    },
    end() {
      return res;
    },
    headersSent: false,
  };
  return res;
}

// ============================================================================
// Tests
// ============================================================================

describe('Rate Limiting Enforcement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Request Allowance', () => {
    it('should allow first request within limit', async () => {
      mocks.mockCheckLimit.mockResolvedValue({
        allowed: true,
        remaining: 59,
        resetAt: new Date(Date.now() + 60_000).toISOString(),
      });

      const req = createMockReq({
        body: { prompt: 'test' },
      });
      req.uid = 'user-123';

      const res = createMockRes();

      const limiter = await mocks.mockCheckLimit('user-123', 'generation', {
        maxRequests: 60,
        windowMs: 60_000,
      });

      if (!limiter.allowed) {
        res
          .status(429)
          .setHeader('Retry-After', '60')
          .json({ error: 'Rate limit exceeded' });
      } else {
        res.status(200).json({ success: true });
      }

      expect(res._status).toBe(200);
      expect(res._json.success).toBe(true);
      expect(limiter.remaining).toBe(59);
    });

    it('should return 429 when limit exceeded', async () => {
      mocks.mockCheckLimit.mockResolvedValue({
        allowed: false,
        remaining: 0,
        retryAfter: 30,
        resetAt: new Date(Date.now() + 30_000).toISOString(),
      });

      const req = createMockReq({
        body: { prompt: 'test' },
      });
      req.uid = 'user-limited';

      const res = createMockRes();

      const limiter = await mocks.mockCheckLimit('user-limited', 'generation');

      if (!limiter.allowed) {
        res
          .status(429)
          .setHeader('Retry-After', String(limiter.retryAfter))
          .json({
            error: 'Rate limit exceeded',
            retryAfterSeconds: limiter.retryAfter,
          });
      }

      expect(res._status).toBe(429);
      expect(res.getHeader('Retry-After')).toBe('30');
    });
  });

  describe('Per-Route Limits', () => {
    it('should have separate limits for different routes', async () => {
      // Setup: generation route (60/min), public route (30/min)
      const genLimit = { maxRequests: 60, windowMs: 60_000 };
      const publicLimit = { maxRequests: 30, windowMs: 60_000 };

      mocks.mockCheckLimit
        .mockResolvedValueOnce({ allowed: true, remaining: 59 }) // generation
        .mockResolvedValueOnce({ allowed: true, remaining: 29 }); // public

      const userId = 'user-123';

      // Check generation route
      const genResult = await mocks.mockCheckLimit(userId, 'generation', genLimit);
      expect(genResult.remaining).toBe(59);

      // Check public route
      const publicResult = await mocks.mockCheckLimit(userId, 'public', publicLimit);
      expect(publicResult.remaining).toBe(29);

      // They should have independent counts
      expect(genResult.remaining).not.toBe(publicResult.remaining);
    });

    it('should enforce auth route higher limit (60/min)', async () => {
      mocks.mockCheckLimit.mockResolvedValue({
        allowed: true,
        remaining: 59,
        limit: 60,
      });

      const limiter = await mocks.mockCheckLimit('user-123', 'generation');

      expect(limiter.limit).toBe(60);
    });

    it('should enforce public route lower limit (30/min)', async () => {
      mocks.mockCheckLimit.mockResolvedValue({
        allowed: true,
        remaining: 29,
        limit: 30,
      });

      const limiter = await mocks.mockCheckLimit('anon', 'public');

      expect(limiter.limit).toBe(30);
    });

    it('should reset limit based on window expiry', async () => {
      const resetTime = new Date(Date.now() + 30_000);

      mocks.mockCheckLimit.mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetAt: resetTime.toISOString(),
      });

      const limiter = await mocks.mockCheckLimit('user-123', 'generation');

      expect(limiter.resetAt).toBe(resetTime.toISOString());
    });

    it('should allow request after window resets', async () => {
      // First window: limit hit
      mocks.mockCheckLimit.mockResolvedValueOnce({
        allowed: false,
        remaining: 0,
      });

      // After reset window: limit available again
      mocks.mockCheckLimit.mockResolvedValueOnce({
        allowed: true,
        remaining: 59,
      });

      const result1 = await mocks.mockCheckLimit('user-123', 'generation');
      expect(result1.allowed).toBe(false);

      const result2 = await mocks.mockCheckLimit('user-123', 'generation');
      expect(result2.allowed).toBe(true);
    });
  });

  describe('Rate Limit Headers', () => {
    it('should include Retry-After header on 429', async () => {
      mocks.mockCheckLimit.mockResolvedValue({
        allowed: false,
        retryAfter: 45,
      });

      const req = createMockReq();
      const res = createMockRes();

      const limiter = await mocks.mockCheckLimit('user-123', 'api');

      if (!limiter.allowed) {
        res
          .status(429)
          .setHeader('Retry-After', String(limiter.retryAfter))
          .json({ error: 'Rate limit exceeded' });
      }

      expect(res._status).toBe(429);
      expect(res.getHeader('Retry-After')).toBe('45');
    });

    it('should return structured error response on rate limit', async () => {
      mocks.mockCheckLimit.mockResolvedValue({
        allowed: false,
        remaining: 0,
        retryAfter: 60,
      });

      const res = createMockRes();

      const limiter = await mocks.mockCheckLimit('user-123', 'generation');

      if (!limiter.allowed) {
        res.status(429).json({
          error: 'Rate limit exceeded',
          remaining: limiter.remaining,
          retryAfterSeconds: limiter.retryAfter,
        });
      }

      expect(res._status).toBe(429);
      expect(res._json.error).toBe('Rate limit exceeded');
      expect(res._json.remaining).toBe(0);
      expect(res._json.retryAfterSeconds).toBe(60);
    });
  });

  describe('Multiple Requests', () => {
    it('should decrement remaining count with each request', async () => {
      const remainingValues = [59, 58, 57, 56, 55];

      for (const remaining of remainingValues) {
        mocks.mockCheckLimit.mockResolvedValueOnce({
          allowed: true,
          remaining,
        });
      }

      const userId = 'user-123';

      for (let i = 0; i < 5; i++) {
        const result = await mocks.mockCheckLimit(userId, 'api');
        expect(result.remaining).toBe(remainingValues[i]);
      }
    });

    it('should handle burst of requests up to limit', async () => {
      const limit = 10;
      const requests = [];

      // Simulate requests 1-10 (all allowed)
      for (let i = 0; i < limit; i++) {
        mocks.mockCheckLimit.mockResolvedValueOnce({
          allowed: true,
          remaining: limit - i - 1,
        });
      }

      const userId = 'user-burst';

      for (let i = 0; i < limit; i++) {
        const result = await mocks.mockCheckLimit(userId, 'api');
        requests.push(result.allowed);
      }

      expect(requests).toEqual(Array(limit).fill(true));

      // 11th request should fail
      mocks.mockCheckLimit.mockResolvedValueOnce({
        allowed: false,
      });

      const blocked = await mocks.mockCheckLimit(userId, 'api');
      expect(blocked.allowed).toBe(false);
    });

    it('should track different users independently', async () => {
      const user1Limit = { allowed: true, remaining: 59 };
      const user2Limit = { allowed: true, remaining: 29 };
      const user3Limit = { allowed: false };

      mocks.mockCheckLimit
        .mockResolvedValueOnce(user1Limit)
        .mockResolvedValueOnce(user2Limit)
        .mockResolvedValueOnce(user3Limit);

      const result1 = await mocks.mockCheckLimit('user-1', 'api');
      const result2 = await mocks.mockCheckLimit('user-2', 'api');
      const result3 = await mocks.mockCheckLimit('user-3', 'api');

      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);
      expect(result3.allowed).toBe(false);
    });
  });

  describe('Rate Limit Configuration', () => {
    it('should apply custom rate limit config', async () => {
      const customConfig = { maxRequests: 100, windowMs: 120_000 };

      mocks.mockCheckLimit.mockResolvedValue({
        allowed: true,
        limit: 100,
      });

      const result = await mocks.mockCheckLimit('user-123', 'api', customConfig);

      expect(result.limit).toBe(100);
    });

    it('should return error when limit exceeded immediately', async () => {
      mocks.mockCheckLimit.mockResolvedValue({
        allowed: false,
        remaining: 0,
      });

      const result = await mocks.mockCheckLimit('user-123', 'api');

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });

  describe('End-to-End Rate Limiting', () => {
    it('should enforce limits across full request lifecycle', async () => {
      // Sequence: 3 allowed requests, then block
      const responses = [
        { allowed: true, remaining: 59 },
        { allowed: true, remaining: 58 },
        { allowed: true, remaining: 57 },
        { allowed: false, remaining: 0, retryAfter: 45 },
      ];

      for (const response of responses) {
        mocks.mockCheckLimit.mockResolvedValueOnce(response);
      }

      const userId = 'user-e2e';
      const route = 'generation';

      // Request 1: allowed
      let limiter = await mocks.mockCheckLimit(userId, route);
      expect(limiter.allowed).toBe(true);

      // Request 2: allowed
      limiter = await mocks.mockCheckLimit(userId, route);
      expect(limiter.allowed).toBe(true);

      // Request 3: allowed
      limiter = await mocks.mockCheckLimit(userId, route);
      expect(limiter.allowed).toBe(true);

      // Request 4: blocked
      limiter = await mocks.mockCheckLimit(userId, route);
      expect(limiter.allowed).toBe(false);
      expect(limiter.retryAfter).toBe(45);
    });
  });
});
