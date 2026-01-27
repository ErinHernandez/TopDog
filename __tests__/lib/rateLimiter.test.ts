/**
 * Rate Limiter Unit Tests
 *
 * Tests for the server-side rate limiter including:
 * - Basic rate limiting functionality
 * - Fail-closed behavior (security)
 * - Circuit breaker pattern
 * - Client ID extraction
 * - Window expiration
 *
 * @module __tests__/lib/rateLimiter
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import type { NextApiRequest, NextApiResponse } from 'next';

// Mock Firebase - properly typed mocks
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockTransaction = jest.fn<any>();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockGetDoc = jest.fn<any>();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockSetDoc = jest.fn<any>();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockUpdateDoc = jest.fn<any>();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDeleteDoc = jest.fn<any>();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockGetDocs = jest.fn<any>();

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(() => ({})),
  doc: jest.fn(() => ({})),
  getDoc: mockGetDoc,
  setDoc: mockSetDoc,
  updateDoc: mockUpdateDoc,
  deleteDoc: mockDeleteDoc,
  getDocs: mockGetDocs,
  runTransaction: mockTransaction,
  serverTimestamp: jest.fn(),
  Timestamp: {
    fromMillis: jest.fn((ms) => ({ toMillis: () => ms })),
    now: jest.fn(() => ({ toMillis: () => Date.now() })),
  },
  query: jest.fn(),
  where: jest.fn(),
}));

jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
  getApps: jest.fn(() => [{}]),
}));

jest.mock('../../lib/logger/serverLogger', () => ({
  serverLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Import after mocks
import { RateLimiter, rateLimitMiddleware, createUsernameCheckLimiter, createSignupLimiter } from '../../lib/rateLimiter';

// Helper to create mock request
function createMockRequest(overrides: Partial<NextApiRequest> = {}): NextApiRequest {
  return {
    headers: {},
    socket: { remoteAddress: '127.0.0.1' },
    ...overrides,
  } as unknown as NextApiRequest;
}

// Helper to create mock response
function createMockResponse(): NextApiResponse & { _status: number; _json: unknown; _headers: Record<string, string> } {
  const res = {
    _status: 200,
    _json: null as unknown,
    _headers: {} as Record<string, string>,
    status(code: number) {
      this._status = code;
      return this;
    },
    json(data: unknown) {
      this._json = data;
      return this;
    },
    setHeader(name: string, value: string) {
      this._headers[name] = value;
      return this;
    },
  };
  return res as unknown as NextApiResponse & { _status: number; _json: unknown; _headers: Record<string, string> };
}

describe('RateLimiter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // INITIALIZATION
  // ===========================================================================

  describe('initialization', () => {
    it('should create rate limiter with required config', () => {
      const limiter = new RateLimiter({
        maxRequests: 100,
        windowMs: 60000,
        endpoint: 'test',
      });

      expect(limiter.config.maxRequests).toBe(100);
      expect(limiter.config.windowMs).toBe(60000);
      expect(limiter.config.endpoint).toBe('test');
    });

    it('should default to fail-closed behavior', () => {
      const limiter = new RateLimiter({
        maxRequests: 10,
        windowMs: 60000,
        endpoint: 'test',
      });

      expect(limiter.config.failClosed).toBe(true);
    });

    it('should allow explicit fail-open (deprecated)', () => {
      const limiter = new RateLimiter({
        maxRequests: 10,
        windowMs: 60000,
        endpoint: 'test',
        failClosed: false,
      });

      expect(limiter.config.failClosed).toBe(false);
    });

    it('should set default circuit breaker thresholds', () => {
      const limiter = new RateLimiter({
        maxRequests: 10,
        windowMs: 60000,
        endpoint: 'test',
      });

      expect(limiter.config.circuitBreakerThreshold).toBe(5);
      expect(limiter.config.circuitBreakerResetMs).toBe(30000);
    });

    it('should allow custom circuit breaker settings', () => {
      const limiter = new RateLimiter({
        maxRequests: 10,
        windowMs: 60000,
        endpoint: 'test',
        circuitBreakerThreshold: 10,
        circuitBreakerResetMs: 60000,
      });

      expect(limiter.config.circuitBreakerThreshold).toBe(10);
      expect(limiter.config.circuitBreakerResetMs).toBe(60000);
    });
  });

  // ===========================================================================
  // CLIENT IDENTIFICATION
  // ===========================================================================

  describe('getClientId', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const limiter = new RateLimiter({
        maxRequests: 10,
        windowMs: 60000,
        endpoint: 'test',
      });

      const req = createMockRequest({
        headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' },
      });

      expect(limiter.getClientId(req)).toBe('192.168.1.1');
    });

    it('should handle array x-forwarded-for header', () => {
      const limiter = new RateLimiter({
        maxRequests: 10,
        windowMs: 60000,
        endpoint: 'test',
      });

      const req = createMockRequest({
        headers: { 'x-forwarded-for': ['192.168.1.1', '10.0.0.1'] },
      });

      expect(limiter.getClientId(req)).toBe('192.168.1.1');
    });

    it('should fall back to socket remoteAddress', () => {
      const limiter = new RateLimiter({
        maxRequests: 10,
        windowMs: 60000,
        endpoint: 'test',
      });

      const req = createMockRequest({
        socket: { remoteAddress: '10.0.0.1' } as unknown as NextApiRequest['socket'],
      });

      expect(limiter.getClientId(req)).toBe('10.0.0.1');
    });

    it('should return unknown when no IP available', () => {
      const limiter = new RateLimiter({
        maxRequests: 10,
        windowMs: 60000,
        endpoint: 'test',
      });

      const req = createMockRequest({
        socket: {} as unknown as NextApiRequest['socket'],
      });

      expect(limiter.getClientId(req)).toBe('unknown');
    });
  });

  // ===========================================================================
  // RATE LIMIT KEY
  // ===========================================================================

  describe('getRateLimitKey', () => {
    it('should generate correct rate limit key', () => {
      const limiter = new RateLimiter({
        maxRequests: 10,
        windowMs: 60000,
        endpoint: 'username_check',
      });

      const key = limiter.getRateLimitKey('192.168.1.1');

      expect(key).toBe('ip:192.168.1.1:username_check');
    });
  });

  // ===========================================================================
  // RATE LIMITING BEHAVIOR
  // ===========================================================================

  describe('check', () => {
    it('should allow request when under limit', async () => {
      mockTransaction.mockImplementation(async (_db: unknown, fn: (t: unknown) => unknown) => {
        // Simulate transaction with no existing document
        return fn({
          get: (jest.fn() as jest.Mock<any>).mockResolvedValue({ exists: () => false }),
          set: jest.fn(),
        });
      });

      const limiter = new RateLimiter({
        maxRequests: 10,
        windowMs: 60000,
        endpoint: 'test',
      });

      const req = createMockRequest();
      const result = await limiter.check(req);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
    });

    it('should deny request when limit exceeded', async () => {
      const windowEnd = Date.now() + 60000;

      mockTransaction.mockImplementation(async (_db: unknown, fn: (t: unknown) => unknown) => {
        return fn({
          get: (jest.fn() as jest.Mock<any>).mockResolvedValue({
            exists: () => true,
            data: () => ({
              count: 10,
              windowEnd: { toMillis: () => windowEnd },
            }),
          }),
          update: jest.fn(),
        });
      });

      const limiter = new RateLimiter({
        maxRequests: 10,
        windowMs: 60000,
        endpoint: 'test',
      });

      const req = createMockRequest();
      const result = await limiter.check(req);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfterMs).toBeGreaterThan(0);
    });

    it('should reset window after expiration', async () => {
      const expiredWindowEnd = Date.now() - 1000; // Window expired 1 second ago

      mockTransaction.mockImplementation(async (_db: unknown, fn: (t: unknown) => unknown) => {
        return fn({
          get: (jest.fn() as jest.Mock<any>).mockResolvedValue({
            exists: () => true,
            data: () => ({
              count: 10,
              windowEnd: { toMillis: () => expiredWindowEnd },
            }),
          }),
          set: jest.fn(),
        });
      });

      const limiter = new RateLimiter({
        maxRequests: 10,
        windowMs: 60000,
        endpoint: 'test',
      });

      const req = createMockRequest();
      const result = await limiter.check(req);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
    });
  });

  // ===========================================================================
  // FAIL-CLOSED BEHAVIOR (SECURITY)
  // ===========================================================================

  describe('fail-closed behavior', () => {
    it('should deny request on error when failClosed is true', async () => {
      mockTransaction.mockRejectedValue(new Error('Firestore unavailable'));

      const limiter = new RateLimiter({
        maxRequests: 10,
        windowMs: 60000,
        endpoint: 'test',
        failClosed: true,
      });

      const req = createMockRequest();
      const result = await limiter.check(req);

      expect(result.allowed).toBe(false);
      expect(result._failedClosed).toBe(true);
    });

    it('should allow request on error when failClosed is false (deprecated)', async () => {
      mockTransaction.mockRejectedValue(new Error('Firestore unavailable'));

      const limiter = new RateLimiter({
        maxRequests: 10,
        windowMs: 60000,
        endpoint: 'test',
        failClosed: false,
      });

      const req = createMockRequest();
      const result = await limiter.check(req);

      expect(result.allowed).toBe(true);
      expect(result._failedOpen).toBe(true);
    });

    it('should suggest retry after on fail-closed', async () => {
      mockTransaction.mockRejectedValue(new Error('Firestore unavailable'));

      const limiter = new RateLimiter({
        maxRequests: 10,
        windowMs: 60000,
        endpoint: 'test',
        failClosed: true,
      });

      const req = createMockRequest();
      const result = await limiter.check(req);

      expect(result.retryAfterMs).toBe(60000); // 1 minute
    });
  });

  // ===========================================================================
  // CIRCUIT BREAKER
  // ===========================================================================

  describe('circuit breaker', () => {
    it('should open circuit after consecutive failures', async () => {
      mockTransaction.mockRejectedValue(new Error('Firestore unavailable'));

      const limiter = new RateLimiter({
        maxRequests: 10,
        windowMs: 60000,
        endpoint: 'circuit_test',
        failClosed: true,
        circuitBreakerThreshold: 3,
      });

      const req = createMockRequest();

      // Trigger failures to open circuit
      await limiter.check(req);
      await limiter.check(req);
      const result = await limiter.check(req);

      expect(result.allowed).toBe(false);
      expect(result._failedClosed).toBe(true);
    });

    it('should return circuit open status when circuit is open', async () => {
      mockTransaction.mockRejectedValue(new Error('Firestore unavailable'));

      const limiter = new RateLimiter({
        maxRequests: 10,
        windowMs: 60000,
        endpoint: 'circuit_open_test',
        failClosed: true,
        circuitBreakerThreshold: 2,
        circuitBreakerResetMs: 60000,
      });

      const req = createMockRequest();

      // Trigger failures to open circuit
      await limiter.check(req);
      await limiter.check(req);

      // Next request should get circuit open response without hitting Firestore
      mockTransaction.mockClear();
      const result = await limiter.check(req);

      expect(result._circuitOpen).toBe(true);
    });
  });

  // ===========================================================================
  // MIDDLEWARE
  // ===========================================================================

  describe('rateLimitMiddleware', () => {
    it('should set rate limit headers', async () => {
      mockTransaction.mockImplementation(async (_db: unknown, fn: (t: unknown) => unknown) => {
        return fn({
          get: (jest.fn() as jest.Mock<any>).mockResolvedValue({ exists: () => false }),
          set: jest.fn(),
        });
      });

      const limiter = new RateLimiter({
        maxRequests: 100,
        windowMs: 60000,
        endpoint: 'test',
      });

      const middleware = rateLimitMiddleware(limiter);
      const req = createMockRequest();
      const res = createMockResponse();

      await middleware(req, res);

      expect(res._headers['X-RateLimit-Limit']).toBe('100');
      expect(res._headers['X-RateLimit-Remaining']).toBeDefined();
      expect(res._headers['X-RateLimit-Reset']).toBeDefined();
    });

    it('should return 429 when rate limited', async () => {
      mockTransaction.mockImplementation(async (_db: unknown, fn: (t: unknown) => unknown) => {
        return fn({
          get: (jest.fn() as jest.Mock<any>).mockResolvedValue({
            exists: () => true,
            data: () => ({
              count: 10,
              windowEnd: { toMillis: () => Date.now() + 60000 },
            }),
          }),
          update: jest.fn(),
        });
      });

      const limiter = new RateLimiter({
        maxRequests: 10,
        windowMs: 60000,
        endpoint: 'test',
      });

      const middleware = rateLimitMiddleware(limiter);
      const req = createMockRequest();
      const res = createMockResponse();

      await middleware(req, res);

      expect(res._status).toBe(429);
      expect((res._json as Record<string, unknown>).error).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('should call next middleware when allowed', async () => {
      mockTransaction.mockImplementation(async (_db: unknown, fn: (t: unknown) => unknown) => {
        return fn({
          get: (jest.fn() as jest.Mock<any>).mockResolvedValue({ exists: () => false }),
          set: jest.fn(),
        });
      });

      const limiter = new RateLimiter({
        maxRequests: 10,
        windowMs: 60000,
        endpoint: 'test',
      });

      const middleware = rateLimitMiddleware(limiter);
      const req = createMockRequest();
      const res = createMockResponse();
      const next = jest.fn() as jest.Mock<() => void>;

      await middleware(req, res, next as unknown as () => void);

      expect(next).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // PREDEFINED LIMITERS
  // ===========================================================================

  describe('predefined limiters', () => {
    it('should create username check limiter with correct config', () => {
      const limiter = createUsernameCheckLimiter();

      expect(limiter.config.maxRequests).toBe(30);
      expect(limiter.config.windowMs).toBe(60000);
      expect(limiter.config.endpoint).toBe('username_check');
    });

    it('should create signup limiter with correct config', () => {
      const limiter = createSignupLimiter();

      expect(limiter.config.maxRequests).toBe(3);
      expect(limiter.config.windowMs).toBe(3600000); // 1 hour
      expect(limiter.config.endpoint).toBe('signup');
    });
  });

  // ===========================================================================
  // STATUS CHECK
  // ===========================================================================

  describe('status', () => {
    it('should return status without incrementing counter', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          count: 5,
          windowEnd: { toMillis: () => Date.now() + 60000 },
        }),
      });

      const limiter = new RateLimiter({
        maxRequests: 10,
        windowMs: 60000,
        endpoint: 'test',
      });

      const req = createMockRequest();
      const result = await limiter.status(req);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5);
      expect(mockTransaction).not.toHaveBeenCalled();
    });

    it('should show rate limited status when at limit', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          count: 10,
          windowEnd: { toMillis: () => Date.now() + 60000 },
        }),
      });

      const limiter = new RateLimiter({
        maxRequests: 10,
        windowMs: 60000,
        endpoint: 'test',
      });

      const req = createMockRequest();
      const result = await limiter.status(req);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });

  // ===========================================================================
  // CLEANUP
  // ===========================================================================

  describe('cleanup', () => {
    it('should delete expired entries', async () => {
      mockGetDocs.mockResolvedValue({
        docs: [
          { ref: { id: 'doc1' } },
          { ref: { id: 'doc2' } },
        ],
      });
      mockDeleteDoc.mockResolvedValue(undefined);

      const limiter = new RateLimiter({
        maxRequests: 10,
        windowMs: 60000,
        endpoint: 'test',
      });

      const result = await limiter.cleanup();

      expect(result.deleted).toBe(2);
      expect(mockDeleteDoc).toHaveBeenCalledTimes(2);
    });

    it('should handle cleanup errors gracefully', async () => {
      mockGetDocs.mockRejectedValue(new Error('Cleanup failed'));

      const limiter = new RateLimiter({
        maxRequests: 10,
        windowMs: 60000,
        endpoint: 'test',
      });

      const result = await limiter.cleanup();

      expect(result.deleted).toBe(0);
    });
  });
});
