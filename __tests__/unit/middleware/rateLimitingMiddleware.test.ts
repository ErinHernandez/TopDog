/**
 * Rate Limiting Middleware Tests
 *
 * Tests the rate limiter middleware for enforcing request limits,
 * window reset, and header management.
 *
 * @module __tests__/unit/middleware/rateLimitingMiddleware
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRateLimitMiddleware, InMemoryRateLimiter } from '@/lib/studio/middleware/rateLimitingMiddleware';

// ============================================================================
// MOCK UTILITIES
// ============================================================================

function createMockReq(overrides = {}): NextApiRequest {
  return {
    method: 'POST',
    headers: {},
    body: {},
    query: {},
    url: '/api/test',
    socket: {
      remoteAddress: '127.0.0.1',
    },
    ...overrides,
  } as unknown as NextApiRequest;
}

function createMockRes(): NextApiResponse {
  const res: any = {
    headersSent: false,
    statusCode: 200,
    _headers: {},
    _data: null,
  };

  res.status = vi.fn((code: number) => {
    res.statusCode = code;
    return res;
  });

  res.json = vi.fn((data: any) => {
    res._data = data;
    res.headersSent = true;
    return res;
  });

  res.setHeader = vi.fn((key: string, value: string) => {
    res._headers[key] = value;
    return res;
  });

  res.end = vi.fn();

  return res;
}

// ============================================================================
// TESTS
// ============================================================================

describe('InMemoryRateLimiter', () => {
  it('allows requests under limit', () => {
    const limiter = new InMemoryRateLimiter(3, 1000);

    const result1 = limiter.check('key1');
    const result2 = limiter.check('key1');
    const result3 = limiter.check('key1');

    expect(result1.allowed).toBe(true);
    expect(result2.allowed).toBe(true);
    expect(result3.allowed).toBe(true);
  });

  it('rejects requests when limit exceeded', () => {
    const limiter = new InMemoryRateLimiter(2, 1000);

    const result1 = limiter.check('key1');
    const result2 = limiter.check('key1');
    const result3 = limiter.check('key1');

    expect(result1.allowed).toBe(true);
    expect(result2.allowed).toBe(true);
    expect(result3.allowed).toBe(false);
  });

  it('tracks remaining requests', () => {
    const limiter = new InMemoryRateLimiter(5, 1000);

    const result1 = limiter.check('key1');
    const result2 = limiter.check('key1');
    const result3 = limiter.check('key1');

    expect(result1.remaining).toBe(4);
    expect(result2.remaining).toBe(3);
    expect(result3.remaining).toBe(2);
  });

  it('resets after window expires', async () => {
    const limiter = new InMemoryRateLimiter(1, 100);

    const result1 = limiter.check('key1');
    expect(result1.allowed).toBe(true);

    const result2 = limiter.check('key1');
    expect(result2.allowed).toBe(false);

    // Wait for window to expire
    await new Promise((resolve) => setTimeout(resolve, 150));

    const result3 = limiter.check('key1');
    expect(result3.allowed).toBe(true);
  });

  it('provides resetAt timestamp', () => {
    const limiter = new InMemoryRateLimiter(3, 1000);
    const result = limiter.check('key1');

    expect(result.resetAt).toBeDefined();
    expect(typeof result.resetAt).toBe('number');
    expect(result.resetAt).toBeGreaterThan(Date.now());
  });

  it('provides retryAfterMs when limit exceeded', async () => {
    const limiter = new InMemoryRateLimiter(1, 1000);

    limiter.check('key1');
    const result = limiter.check('key1');

    expect(result.retryAfterMs).toBeDefined();
    expect(typeof result.retryAfterMs).toBe('number');
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  it('tracks different keys independently', () => {
    const limiter = new InMemoryRateLimiter(2, 1000);

    const result1a = limiter.check('key1');
    const result1b = limiter.check('key1');
    const result1c = limiter.check('key1');

    const result2a = limiter.check('key2');
    const result2b = limiter.check('key2');

    expect(result1a.allowed).toBe(true);
    expect(result1b.allowed).toBe(true);
    expect(result1c.allowed).toBe(false);

    expect(result2a.allowed).toBe(true);
    expect(result2b.allowed).toBe(true);
  });

  it('can reset a key', () => {
    const limiter = new InMemoryRateLimiter(1, 1000);

    const result1 = limiter.check('key1');
    expect(result1.allowed).toBe(true);

    const result2 = limiter.check('key1');
    expect(result2.allowed).toBe(false);

    limiter.reset('key1');

    const result3 = limiter.check('key1');
    expect(result3.allowed).toBe(true);
  });

  it('can clear all entries', () => {
    const limiter = new InMemoryRateLimiter(1, 1000);

    limiter.check('key1');
    limiter.check('key2');

    limiter.clear();

    const result1 = limiter.check('key1');
    const result2 = limiter.check('key2');

    expect(result1.allowed).toBe(true);
    expect(result2.allowed).toBe(true);
  });
});

describe('createRateLimitMiddleware', () => {
  it('allows requests under limit', async () => {
    const middleware = createRateLimitMiddleware({
      maxRequests: 3,
      windowMs: 1000,
    });

    const next = vi.fn(async () => {});

    await middleware(createMockReq(), createMockRes(), next);
    await middleware(createMockReq(), createMockRes(), next);
    await middleware(createMockReq(), createMockRes(), next);

    expect(next).toHaveBeenCalledTimes(3);
  });

  it('returns 429 when limit exceeded', async () => {
    const middleware = createRateLimitMiddleware({
      maxRequests: 1,
      windowMs: 1000,
    });

    const req1 = createMockReq();
    const res1 = createMockRes();
    const next1 = vi.fn(async () => {
      res1.status(200).json({ success: true });
    });

    const req2 = createMockReq();
    const res2 = createMockRes();
    const next2 = vi.fn();

    await middleware(req1, res1, next1);
    await middleware(req2, res2, next2);

    expect(res2.status).toHaveBeenCalledWith(429);
    expect(next2).not.toHaveBeenCalled();
  });

  it('sets rate limit headers', async () => {
    const middleware = createRateLimitMiddleware({
      maxRequests: 5,
      windowMs: 1000,
    });

    const req = createMockReq();
    const res = createMockRes();
    const next = vi.fn(async () => {});

    await middleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', '5');
    expect(res.setHeader).toHaveBeenCalledWith(
      'X-RateLimit-Remaining',
      expect.any(String)
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      'X-RateLimit-Reset',
      expect.any(String)
    );
  });

  it('updates remaining count in headers', async () => {
    const middleware = createRateLimitMiddleware({
      maxRequests: 3,
      windowMs: 1000,
    });

    const req1 = createMockReq();
    const res1 = createMockRes();
    await middleware(req1, res1, vi.fn(async () => {}));

    const req2 = createMockReq();
    const res2 = createMockRes();
    await middleware(req2, res2, vi.fn(async () => {}));

    const remaining1Call = res1.setHeader.mock.calls.find(
      (call: any[]) => call[0] === 'X-RateLimit-Remaining'
    );
    const remaining2Call = res2.setHeader.mock.calls.find(
      (call: any[]) => call[0] === 'X-RateLimit-Remaining'
    );

    expect(remaining1Call[1]).toBe('2');
    expect(remaining2Call[1]).toBe('1');
  });

  it('sets Retry-After header when limited', async () => {
    const middleware = createRateLimitMiddleware({
      maxRequests: 1,
      windowMs: 1000,
    });

    const req1 = createMockReq();
    const res1 = createMockRes();
    await middleware(req1, res1, vi.fn(async () => {}));

    const req2 = createMockReq();
    const res2 = createMockRes();
    await middleware(req2, res2, vi.fn(async () => {}));

    const retryAfterCall = res2.setHeader.mock.calls.find(
      (call: any[]) => call[0] === 'Retry-After'
    );

    expect(retryAfterCall).toBeDefined();
  });

  it('uses custom key extractor', async () => {
    const keyExtractor = vi.fn((req: NextApiRequest) => {
      return `custom:${(req as any).customId}`;
    });

    const middleware = createRateLimitMiddleware({
      maxRequests: 1,
      windowMs: 1000,
      keyExtractor,
    });

    const req1 = createMockReq();
    (req1 as any).customId = 'user-1';
    const res1 = createMockRes();
    await middleware(req1, res1, vi.fn(async () => {}));

    expect(keyExtractor).toHaveBeenCalledWith(req1);
  });

  it('uses uid as key when available', async () => {
    const middleware = createRateLimitMiddleware({
      maxRequests: 1,
      windowMs: 1000,
    });

    const req1 = createMockReq();
    (req1 as any).uid = 'user-123';
    const res1 = createMockRes();
    await middleware(req1, res1, vi.fn(async () => {}));

    const req2 = createMockReq();
    (req2 as any).uid = 'user-123';
    const res2 = createMockRes();
    await middleware(req2, res2, vi.fn(async () => {}));

    expect(res2.status).toHaveBeenCalledWith(429);
  });

  it('uses IP address as fallback key', async () => {
    const middleware = createRateLimitMiddleware({
      maxRequests: 1,
      windowMs: 1000,
    });

    const req1 = createMockReq({
      socket: { remoteAddress: '192.168.1.1' },
    });
    const res1 = createMockRes();
    await middleware(req1, res1, vi.fn(async () => {}));

    const req2 = createMockReq({
      socket: { remoteAddress: '192.168.1.1' },
    });
    const res2 = createMockRes();
    await middleware(req2, res2, vi.fn(async () => {}));

    expect(res2.status).toHaveBeenCalledWith(429);
  });

  it('uses x-forwarded-for header for IP extraction', async () => {
    const middleware = createRateLimitMiddleware({
      maxRequests: 1,
      windowMs: 1000,
    });

    const req1 = createMockReq({
      headers: { 'x-forwarded-for': '10.0.0.1, 10.0.0.2' },
    });
    const res1 = createMockRes();
    await middleware(req1, res1, vi.fn(async () => {}));

    const req2 = createMockReq({
      headers: { 'x-forwarded-for': '10.0.0.1, 10.0.0.2' },
    });
    const res2 = createMockRes();
    await middleware(req2, res2, vi.fn(async () => {}));

    expect(res2.status).toHaveBeenCalledWith(429);
  });

  it('includes requestId in error response', async () => {
    const middleware = createRateLimitMiddleware({
      maxRequests: 1,
      windowMs: 1000,
    });

    const req1 = createMockReq();
    const res1 = createMockRes();
    (req1 as any).requestId = 'req-123';
    await middleware(req1, res1, vi.fn(async () => {}));

    const req2 = createMockReq();
    const res2 = createMockRes();
    (req2 as any).requestId = 'req-456';
    await middleware(req2, res2, vi.fn(async () => {}));

    const jsonCall = res2.json.mock.calls[0][0];
    expect(jsonCall.error.requestId).toBe('req-456');
  });

  it('returns proper error format when rate limited', async () => {
    const middleware = createRateLimitMiddleware({
      maxRequests: 1,
      windowMs: 1000,
    });

    const req1 = createMockReq();
    const res1 = createMockRes();
    await middleware(req1, res1, vi.fn(async () => {}));

    const req2 = createMockReq();
    const res2 = createMockRes();
    await middleware(req2, res2, vi.fn(async () => {}));

    const jsonCall = res2.json.mock.calls[0][0];
    expect(jsonCall).toMatchObject({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests',
      },
    });
  });

  it('resets limit after window expires', async () => {
    const middleware = createRateLimitMiddleware({
      maxRequests: 1,
      windowMs: 100,
    });

    const req1 = createMockReq();
    const res1 = createMockRes();
    await middleware(req1, res1, vi.fn(async () => {}));

    const req2 = createMockReq();
    const res2 = createMockRes();
    await middleware(req2, res2, vi.fn(async () => {}));

    expect(res2.status).toHaveBeenCalledWith(429);

    // Wait for window to expire
    await new Promise((resolve) => setTimeout(resolve, 150));

    const req3 = createMockReq();
    const res3 = createMockRes();
    const next3 = vi.fn(async () => {});
    await middleware(req3, res3, next3);

    expect(next3).toHaveBeenCalled();
  });

  it('handles multiple concurrent users independently', async () => {
    const middleware = createRateLimitMiddleware({
      maxRequests: 1,
      windowMs: 1000,
    });

    const req1 = createMockReq();
    (req1 as any).uid = 'user-1';
    const res1 = createMockRes();
    const next1 = vi.fn(async () => {});
    await middleware(req1, res1, next1);

    const req2 = createMockReq();
    (req2 as any).uid = 'user-2';
    const res2 = createMockRes();
    const next2 = vi.fn(async () => {});
    await middleware(req2, res2, next2);

    expect(next1).toHaveBeenCalled();
    expect(next2).toHaveBeenCalled();
  });
});
