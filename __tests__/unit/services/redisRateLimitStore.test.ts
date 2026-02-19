/**
 * RedisRateLimitStore tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getRedisRateLimitStore } from '@/lib/studio/services/redisRateLimitStore';
import type { RedisClient } from '@/lib/studio/infrastructure/redis/upstashClient';

describe('RedisRateLimitStore', () => {
  let mockRedisClient: Partial<RedisClient>;

  beforeEach(() => {
    // Mock Redis client
    mockRedisClient = {
      incr: vi.fn().mockResolvedValue(1),
      expire: vi.fn().mockResolvedValue(1),
      ttl: vi.fn().mockResolvedValue(60),
      del: vi.fn().mockResolvedValue(1),
      keys: vi.fn().mockResolvedValue([]),
    };

    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('allows requests under limit', () => {
    it('should allow requests when under max limit', async () => {
      const limiter = getRedisRateLimitStore(5, 60000, mockRedisClient as RedisClient);

      // Reset mock to simulate request counter
      let counter = 0;
      (mockRedisClient.incr as any).mockImplementation(async () => {
        counter++;
        return counter;
      });

      for (let i = 0; i < 5; i++) {
        const result = await limiter.check('user:1');
        expect(result.allowed).toBe(true);
      }
    });
  });

  describe('rejects requests over limit', () => {
    it('should reject requests when over max limit', async () => {
      const limiter = getRedisRateLimitStore(3, 60000, mockRedisClient as RedisClient);

      let counter = 0;
      (mockRedisClient.incr as any).mockImplementation(async () => {
        counter++;
        return counter;
      });

      // Allow 3 requests
      for (let i = 0; i < 3; i++) {
        const result = await limiter.check('user:1');
        expect(result.allowed).toBe(true);
      }

      // Reject 4th request
      const result = await limiter.check('user:1');
      expect(result.allowed).toBe(false);
    });
  });

  describe('returns correct remaining count', () => {
    it('should calculate remaining requests correctly', async () => {
      const limiter = getRedisRateLimitStore(5, 60000, mockRedisClient as RedisClient);

      let counter = 0;
      (mockRedisClient.incr as any).mockImplementation(async () => {
        counter++;
        return counter;
      });

      for (let i = 0; i < 5; i++) {
        const result = await limiter.check('user:1');
        expect(result.remaining).toBe(5 - (i + 1));
      }

      const rejectedResult = await limiter.check('user:1');
      expect(rejectedResult.remaining).toBe(0);
    });
  });

  describe('returns retryAfterMs when limited', () => {
    it('should provide retryAfterMs on rejection', async () => {
      const limiter = getRedisRateLimitStore(2, 60000, mockRedisClient as RedisClient);

      let counter = 0;
      (mockRedisClient.incr as any).mockImplementation(async () => {
        counter++;
        return counter;
      });

      const now = Date.now();

      // Fill the limit
      await limiter.check('user:1');
      await limiter.check('user:1');

      // Next request should be rejected with retryAfterMs
      const result = await limiter.check('user:1');
      expect(result.allowed).toBe(false);
      expect(result.retryAfterMs).toBeDefined();
      expect(result.retryAfterMs).toBeGreaterThan(0);
    });
  });

  describe('reset', () => {
    it('should clear limit for key via reset', async () => {
      const limiter = getRedisRateLimitStore(2, 60000, mockRedisClient as RedisClient);

      let counter = 0;
      (mockRedisClient.incr as any).mockImplementation(async () => {
        counter++;
        return counter;
      });

      // Exhaust limit
      await limiter.check('user:1');
      await limiter.check('user:1');

      let result = await limiter.check('user:1');
      expect(result.allowed).toBe(false);

      // Reset the key
      await limiter.reset('user:1');

      // Verify Redis del was called
      expect(mockRedisClient.del).toHaveBeenCalledWith('ratelimit:user:1');

      // Reset counter for next checks
      counter = 0;

      // Should now allow requests again
      result = await limiter.check('user:1');
      expect(result.allowed).toBe(true);
    });
  });

  describe('clear', () => {
    it('should remove all rate limit data', async () => {
      const limiter = getRedisRateLimitStore(5, 60000, mockRedisClient as RedisClient);

      // Mock keys response
      const rateLimitKeys = ['ratelimit:user:1', 'ratelimit:user:2', 'ratelimit:api:endpoint'];
      (mockRedisClient.keys as any).mockResolvedValueOnce(rateLimitKeys);

      // Clear all
      await limiter.clear();

      // Verify Redis keys was called with pattern
      expect(mockRedisClient.keys).toHaveBeenCalledWith('ratelimit:*');

      // Verify del was called for each key
      expect(mockRedisClient.del).toHaveBeenCalledWith('ratelimit:user:1');
      expect(mockRedisClient.del).toHaveBeenCalledWith('ratelimit:user:2');
      expect(mockRedisClient.del).toHaveBeenCalledWith('ratelimit:api:endpoint');
    });
  });

  describe('different keys tracked independently', () => {
    it('should track limits independently for different keys', async () => {
      const limiter = getRedisRateLimitStore(2, 60000, mockRedisClient as RedisClient);

      // Mock different counters for different keys
      const counters: Record<string, number> = {};
      (mockRedisClient.incr as any).mockImplementation(async (key: string) => {
        counters[key] = (counters[key] ?? 0) + 1;
        return counters[key];
      });

      // User 1: 2 requests (limit reached)
      await limiter.check('user:1');
      const user1Second = await limiter.check('user:1');
      expect(user1Second.allowed).toBe(true);

      // User 2: should still be allowed
      const user2First = await limiter.check('user:2');
      expect(user2First.allowed).toBe(true);

      // User 1: 3rd request should be rejected
      const user1Third = await limiter.check('user:1');
      expect(user1Third.allowed).toBe(false);

      // User 2: 2nd request should still be allowed
      const user2Second = await limiter.check('user:2');
      expect(user2Second.allowed).toBe(true);
    });
  });

  describe('window resets after expiry', () => {
    it('should reset window after TTL expires', async () => {
      const windowMs = 5000;
      const limiter = getRedisRateLimitStore(2, windowMs, mockRedisClient as RedisClient);

      let counter = 0;
      (mockRedisClient.incr as any).mockImplementation(async () => {
        counter++;
        return counter;
      });

      // Exhaust limit
      await limiter.check('user:1');
      await limiter.check('user:1');

      let result = await limiter.check('user:1');
      expect(result.allowed).toBe(false);

      // Advance time past window
      vi.advanceTimersByTime(windowMs + 1);

      // Reset counter (simulating new window)
      counter = 0;
      (mockRedisClient.incr as any).mockImplementation(async () => {
        counter++;
        return counter;
      });

      // Should allow requests again
      result = await limiter.check('user:1');
      expect(result.allowed).toBe(true);
    });
  });

  describe('Redis error handling', () => {
    it('should fall back to in-memory limiter on Redis error', async () => {
      const errorClient: Partial<RedisClient> = {
        incr: vi.fn().mockRejectedValue(new Error('Redis connection failed')),
        expire: vi.fn(),
        ttl: vi.fn(),
        del: vi.fn(),
        keys: vi.fn(),
      };

      const limiter = getRedisRateLimitStore(2, 60000, errorClient as RedisClient);

      // Should still work via fallback
      const result1 = await limiter.check('user:1');
      expect(result1.allowed).toBe(true);

      const result2 = await limiter.check('user:1');
      expect(result2.allowed).toBe(true);

      // 3rd should be rejected
      const result3 = await limiter.check('user:1');
      expect(result3.allowed).toBe(false);
    });
  });

  describe('Redis integration', () => {
    it('should call Redis incr with correct key prefix', async () => {
      const limiter = getRedisRateLimitStore(5, 60000, mockRedisClient as RedisClient);

      (mockRedisClient.incr as any).mockResolvedValueOnce(1);

      await limiter.check('mykey');

      expect(mockRedisClient.incr).toHaveBeenCalledWith('ratelimit:mykey');
    });

    it('should set expiration on first request', async () => {
      const windowMs = 30000;
      const limiter = getRedisRateLimitStore(5, windowMs, mockRedisClient as RedisClient);

      (mockRedisClient.incr as any).mockResolvedValueOnce(1);

      await limiter.check('user:1');

      // Verify expire was called with correct TTL
      expect(mockRedisClient.expire).toHaveBeenCalledWith('ratelimit:user:1', 30);
    });

    it('should not set expiration on subsequent requests', async () => {
      const limiter = getRedisRateLimitStore(5, 60000, mockRedisClient as RedisClient);

      let counter = 0;
      (mockRedisClient.incr as any).mockImplementation(async () => {
        counter++;
        return counter;
      });

      (mockRedisClient.expire as any).mockClear();

      await limiter.check('user:1');
      await limiter.check('user:1');

      // Expire should only be called once (on first request)
      expect(mockRedisClient.expire).toHaveBeenCalledTimes(1);
    });
  });
});
