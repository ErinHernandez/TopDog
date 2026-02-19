/**
 * Tests for createTierRateLimitMiddleware — tier-aware per-plan rate limiting.
 *
 * Covers:
 * - Middleware creation and basic flow
 * - Plan extraction from custom claims
 * - Header setting (X-RateLimit-Limit-Tier, X-RateLimit-Remaining, etc.)
 * - 429 response when tier limit exceeded
 * - Passthrough for unauthenticated requests
 * - Different plans getting different limits
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createTierRateLimitMiddleware } from '@/lib/studio/middleware/rateLimitingMiddleware';
import { _resetStore } from '@/lib/security/rate-limiter-tiers';

function createMockReq(overrides: Record<string, any> = {}): NextApiRequest {
  return {
    headers: {},
    socket: { remoteAddress: '127.0.0.1' },
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
  };
  return res;
}

beforeEach(() => {
  _resetStore();
});

describe('createTierRateLimitMiddleware', () => {
  it('calls next() for unauthenticated requests (no uid)', async () => {
    const middleware = createTierRateLimitMiddleware({ actionType: 'ai' });
    const req = createMockReq({});
    const res = createMockRes();
    const next = vi.fn().mockResolvedValue(undefined);

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res._status).toBe(200);
  });

  it('allows first request from authenticated free user', async () => {
    const middleware = createTierRateLimitMiddleware({ actionType: 'ai' });
    const req = createMockReq({
      uid: 'user1',
      customClaims: { plan: 'free' },
    });
    const res = createMockRes();
    const next = vi.fn().mockResolvedValue(undefined);

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res._headers['X-RateLimit-Limit-Tier']).toBe('free');
    expect(parseInt(res._headers['X-RateLimit-Remaining'])).toBe(4); // free ai = 5, used 1
  });

  it('defaults to free plan when no plan in claims', async () => {
    const middleware = createTierRateLimitMiddleware({ actionType: 'upload' });
    const req = createMockReq({
      uid: 'noPlanUser',
      customClaims: {},
    });
    const res = createMockRes();
    const next = vi.fn().mockResolvedValue(undefined);

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res._headers['X-RateLimit-Limit-Tier']).toBe('free');
  });

  it('defaults to free plan when customClaims is undefined', async () => {
    const middleware = createTierRateLimitMiddleware({ actionType: 'ai' });
    const req = createMockReq({ uid: 'noClaimsUser' });
    const res = createMockRes();
    const next = vi.fn().mockResolvedValue(undefined);

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res._headers['X-RateLimit-Limit-Tier']).toBe('free');
  });

  it('recognises pro plan from claims', async () => {
    const middleware = createTierRateLimitMiddleware({ actionType: 'ai' });
    const req = createMockReq({
      uid: 'proUser',
      customClaims: { plan: 'pro' },
    });
    const res = createMockRes();
    const next = vi.fn().mockResolvedValue(undefined);

    await middleware(req, res, next);

    expect(res._headers['X-RateLimit-Limit-Tier']).toBe('pro');
    expect(parseInt(res._headers['X-RateLimit-Remaining'])).toBe(49); // pro ai = 50, used 1
  });

  it('sets X-RateLimit-Reset and X-RateLimit-Window headers', async () => {
    const middleware = createTierRateLimitMiddleware({ actionType: 'ai' });
    const req = createMockReq({
      uid: 'headerUser',
      customClaims: { plan: 'free' },
    });
    const res = createMockRes();
    const next = vi.fn().mockResolvedValue(undefined);

    await middleware(req, res, next);

    expect(res._headers['X-RateLimit-Reset']).toBeDefined();
    expect(res._headers['X-RateLimit-Window']).toBe('3600000'); // 1 hour for AI
  });

  it('returns 429 when free AI limit exceeded', async () => {
    const middleware = createTierRateLimitMiddleware({ actionType: 'ai' });
    const next = vi.fn().mockResolvedValue(undefined);

    // Exhaust free AI limit (5)
    for (let i = 0; i < 5; i++) {
      const req = createMockReq({
        uid: 'exhaustUser',
        customClaims: { plan: 'free' },
      });
      const res = createMockRes();
      await middleware(req, res, next);
      expect(res._status).toBe(200);
    }

    // 6th request should be blocked
    const req = createMockReq({
      uid: 'exhaustUser',
      customClaims: { plan: 'free' },
    });
    const res = createMockRes();
    next.mockClear();

    await middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(429);
    expect(res._json.success).toBe(false);
    expect(res._json.error.code).toBe('TIER_RATE_LIMIT_EXCEEDED');
    expect(res._json.error.plan).toBe('free');
    expect(res._json.error.action).toBe('ai');
    expect(res._headers['Retry-After']).toBeDefined();
  });

  it('pro user not blocked at free limit', async () => {
    const middleware = createTierRateLimitMiddleware({ actionType: 'ai' });
    const next = vi.fn().mockResolvedValue(undefined);

    // 6 requests (would exceed free limit of 5)
    for (let i = 0; i < 6; i++) {
      const req = createMockReq({
        uid: 'proNotBlocked',
        customClaims: { plan: 'pro' },
      });
      const res = createMockRes();
      await middleware(req, res, next);
      expect(res._status).toBe(200);
    }
  });

  it('tracks different action types independently', async () => {
    const aiMiddleware = createTierRateLimitMiddleware({ actionType: 'ai' });
    const uploadMiddleware = createTierRateLimitMiddleware({ actionType: 'upload' });
    const next = vi.fn().mockResolvedValue(undefined);

    // Exhaust AI limit (free = 5)
    for (let i = 0; i < 6; i++) {
      const req = createMockReq({
        uid: 'multiAction',
        customClaims: { plan: 'free' },
      });
      const res = createMockRes();
      await aiMiddleware(req, res, next);
    }

    // Upload should still work
    const req = createMockReq({
      uid: 'multiAction',
      customClaims: { plan: 'free' },
    });
    const res = createMockRes();
    await uploadMiddleware(req, res, next);
    expect(res._status).toBe(200);
    expect(parseInt(res._headers['X-RateLimit-Remaining'])).toBe(9); // free upload = 10
  });

  it('error response includes requestId when available', async () => {
    const middleware = createTierRateLimitMiddleware({ actionType: 'generate' });
    const next = vi.fn().mockResolvedValue(undefined);

    // Free generate limit = 3
    for (let i = 0; i < 3; i++) {
      const req = createMockReq({
        uid: 'reqIdUser',
        customClaims: { plan: 'free' },
        requestId: 'req-123',
      });
      const res = createMockRes();
      await middleware(req, res, next);
    }

    // 4th request blocked
    const req = createMockReq({
      uid: 'reqIdUser',
      customClaims: { plan: 'free' },
      requestId: 'req-456',
    });
    const res = createMockRes();
    await middleware(req, res, next);

    expect(res._status).toBe(429);
    expect(res._json.error.requestId).toBe('req-456');
  });

  it('ignores invalid plan values and defaults to free', async () => {
    const middleware = createTierRateLimitMiddleware({ actionType: 'ai' });
    const req = createMockReq({
      uid: 'badPlanUser',
      customClaims: { plan: 'ultra_mega' },
    });
    const res = createMockRes();
    const next = vi.fn().mockResolvedValue(undefined);

    await middleware(req, res, next);

    expect(res._headers['X-RateLimit-Limit-Tier']).toBe('free');
  });
});
