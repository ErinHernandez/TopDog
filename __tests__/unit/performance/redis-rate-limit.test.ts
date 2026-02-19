/**
 * Redis Rate Limit Store Tests
 *
 * Tests the Upstash Redis-backed rate limiter including:
 * - Basic rate limit recording and enforcement
 * - Window pruning of expired timestamps
 * - Error handling and fallback to in-memory store
 * - Circuit breaker behavior on persistent failures
 * - Factory function environment detection
 * - Interface equivalence with MemoryRateLimitStore
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the structured logger (used by redisRateLimitStore internally)
vi.mock('@/lib/structuredLogger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import {
  RedisRateLimitStore,
  createRedisRateLimitStore,
} from '@/Documents/bestball-site/lib/studio/services/redisRateLimitStore';
import { MemoryRateLimitStore } from '@/Documents/bestball-site/lib/studio/services/rateLimiter';

// ─────────────────────────────────────────────────────────────────────────────
// MOCK SETUP
// ─────────────────────────────────────────────────────────────────────────────

const mockFetch = vi.fn();
const originalFetch = globalThis.fetch;

/**
 * Set up mock Redis responses for a recordAndGet call.
 * Each call makes 2 fetches: GET (read bucket) then SETEX (write bucket).
 *
 * @param timestamps - Existing timestamps to return from GET, or null for cache miss
 */
function setupMockRedisResponses(timestamps: number[] | null): void {
  const getResult = timestamps === null ? null : JSON.stringify(timestamps);

  // First call: GET → returns stored timestamps
  // Second call: SETEX → returns "OK"
  mockFetch
    .mockResolvedValueOnce(
      new Response(JSON.stringify([{ result: getResult }]), { status: 200 }),
    )
    .mockResolvedValueOnce(
      new Response(JSON.stringify([{ result: 'OK' }]), { status: 200 }),
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITES
// ─────────────────────────────────────────────────────────────────────────────

describe('RedisRateLimitStore', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    globalThis.fetch = mockFetch as unknown as typeof fetch;
    process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token-123';
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  // ── Basic Functionality ──────────────────────────────────────────────────

  it('implements the RateLimitStore interface', () => {
    const store = new RedisRateLimitStore({
      url: 'https://example.upstash.io',
      token: 'test-token',
    });
    expect(store).toHaveProperty('recordAndGet');
    expect(store).toHaveProperty('destroy');
    expect(store).toHaveProperty('size');
  });

  it('records and retrieves a single request from empty bucket', async () => {
    setupMockRedisResponses([]); // Empty bucket

    const store = new RedisRateLimitStore({
      url: 'https://example.upstash.io',
      token: 'test-token',
    });

    const now = Date.now();
    const result = await store.recordAndGet('user-123', now, now - 60_000, 10);

    expect(result.timestamps).toHaveLength(1);
    expect(result.timestamps[0]).toBe(now);
    expect(mockFetch).toHaveBeenCalledTimes(2); // GET + SETEX
  });

  it('appends to existing timestamps within limit', async () => {
    const now = Date.now();
    const existing = Array.from({ length: 5 }, (_, i) => now - 30_000 + i * 1000);
    setupMockRedisResponses(existing);

    const store = new RedisRateLimitStore({
      url: 'https://example.upstash.io',
      token: 'test-token',
    });

    const result = await store.recordAndGet('user-456', now, now - 60_000, 10);
    expect(result.timestamps).toHaveLength(6); // 5 existing + 1 new
  });

  it('does not add new timestamp when at max requests', async () => {
    const now = Date.now();
    const existing = Array.from({ length: 10 }, (_, i) => now - 50_000 + i * 1000);
    setupMockRedisResponses(existing);

    const store = new RedisRateLimitStore({
      url: 'https://example.upstash.io',
      token: 'test-token',
    });

    const result = await store.recordAndGet('user-789', now, now - 60_000, 10);
    expect(result.timestamps).toHaveLength(10); // Still 10, not 11
  });

  // ── Window Pruning ───────────────────────────────────────────────────────

  it('prunes timestamps outside the window', async () => {
    const now = Date.now();
    const windowStart = now - 60_000;
    const expired = now - 70_000;
    const valid1 = now - 50_000;
    const valid2 = now - 30_000;

    setupMockRedisResponses([expired, valid1, valid2]);

    const store = new RedisRateLimitStore({
      url: 'https://example.upstash.io',
      token: 'test-token',
    });

    const result = await store.recordAndGet('user-pruned', now, windowStart, 10);
    // expired is removed, valid1 + valid2 kept, new one added = 3
    expect(result.timestamps).toHaveLength(3);
    expect(result.timestamps.every(ts => ts > windowStart)).toBe(true);
  });

  it('handles null bucket on first request (cache miss)', async () => {
    setupMockRedisResponses(null);

    const store = new RedisRateLimitStore({
      url: 'https://example.upstash.io',
      token: 'test-token',
    });

    const now = Date.now();
    const result = await store.recordAndGet('new-user', now, now - 60_000, 10);
    expect(result.timestamps).toHaveLength(1);
    expect(result.timestamps[0]).toBe(now);
  });

  // ── Error Handling & Fallback ────────────────────────────────────────────

  it('falls back to memory store on Redis network errors', async () => {
    mockFetch.mockRejectedValue(new Error('Connection refused'));

    const store = new RedisRateLimitStore({
      url: 'https://example.upstash.io',
      token: 'test-token',
    });

    const now = Date.now();
    const result = await store.recordAndGet('user-err', now, now - 60_000, 10);
    // Fallback memory store records 1 timestamp
    expect(result.timestamps).toHaveLength(1);
  });

  it('falls back on HTTP 500 from Redis API', async () => {
    mockFetch.mockResolvedValue(
      new Response('Internal Server Error', { status: 500 }),
    );

    const store = new RedisRateLimitStore({
      url: 'https://example.upstash.io',
      token: 'test-token',
    });

    const now = Date.now();
    const result = await store.recordAndGet('user-500', now, now - 60_000, 10);
    expect(result.timestamps).toHaveLength(1);
  });

  it('falls back on malformed Redis response', async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify([{ error: 'WRONGTYPE' }]), { status: 200 }),
    );

    const store = new RedisRateLimitStore({
      url: 'https://example.upstash.io',
      token: 'test-token',
    });

    const now = Date.now();
    const result = await store.recordAndGet('user-bad', now, now - 60_000, 10);
    expect(result.timestamps).toHaveLength(1);
  });

  it('enters circuit breaker mode after repeated failures', async () => {
    mockFetch.mockRejectedValue(new Error('Persistent failure'));

    const store = new RedisRateLimitStore({
      url: 'https://example.upstash.io',
      token: 'test-token',
    });

    const now = Date.now();

    // Trigger 7 failures (threshold is 5)
    for (let i = 0; i < 7; i++) {
      await store.recordAndGet(`user-${i}`, now + i, now - 60_000, 10);
    }

    // After threshold, circuit breaker should skip Redis entirely
    // First 5 calls each try Redis (1 fetch each), then 2 more use fallback directly (0 fetches)
    // So total fetches should be 5 (not 7)
    expect(mockFetch.mock.calls.length).toBe(5);
  });

  // ── Resource Cleanup ─────────────────────────────────────────────────────

  it('cleans up resources on destroy without throwing', () => {
    const store = new RedisRateLimitStore({
      url: 'https://example.upstash.io',
      token: 'test-token',
    });
    expect(() => store.destroy()).not.toThrow();
  });

  it('reports fallback store size (>= 0)', () => {
    const store = new RedisRateLimitStore({
      url: 'https://example.upstash.io',
      token: 'test-token',
    });
    expect(store.size).toBeGreaterThanOrEqual(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// FACTORY FUNCTION TESTS
// ─────────────────────────────────────────────────────────────────────────────

describe('createRedisRateLimitStore()', () => {
  beforeEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it('returns null when Redis URL is not configured', () => {
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
    expect(createRedisRateLimitStore()).toBeNull();
  });

  it('returns null when Redis token is not configured', () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.io';
    expect(createRedisRateLimitStore()).toBeNull();
  });

  it('returns RedisRateLimitStore when both env vars are set', () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

    const store = createRedisRateLimitStore();
    expect(store).toBeInstanceOf(RedisRateLimitStore);
    store?.destroy();
  });

  it('returns null for empty string env vars', () => {
    process.env.UPSTASH_REDIS_REST_URL = '';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
    expect(createRedisRateLimitStore()).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// INTERFACE COMPARISON
// ─────────────────────────────────────────────────────────────────────────────

describe('RedisRateLimitStore vs MemoryRateLimitStore', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    globalThis.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('implements the same core interface methods', () => {
    const redisStore = new RedisRateLimitStore({
      url: 'https://example.upstash.io',
      token: 'test-token',
    });
    const memoryStore = new MemoryRateLimitStore();

    const redisProto = Object.getOwnPropertyNames(Object.getPrototypeOf(redisStore));
    const memProto = Object.getOwnPropertyNames(Object.getPrototypeOf(memoryStore));

    expect(redisProto).toContain('recordAndGet');
    expect(redisProto).toContain('destroy');
    expect(memProto).toContain('recordAndGet');
    expect(memProto).toContain('destroy');

    redisStore.destroy();
    memoryStore.destroy();
  });

  it('produces equivalent results for single record', async () => {
    setupMockRedisResponses([]); // Empty bucket for Redis

    const redisStore = new RedisRateLimitStore({
      url: 'https://example.upstash.io',
      token: 'test-token',
    });
    const memoryStore = new MemoryRateLimitStore();

    const now = Date.now();
    const windowStart = now - 60_000;

    const redisResult = await redisStore.recordAndGet('user', now, windowStart, 10);
    const memoryResult = memoryStore.recordAndGet('user', now, windowStart, 10);

    expect(redisResult.timestamps).toHaveLength(memoryResult.timestamps.length);

    redisStore.destroy();
    memoryStore.destroy();
  });
});
