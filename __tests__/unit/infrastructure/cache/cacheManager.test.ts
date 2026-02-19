/**
 * CacheManager tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  CacheManager,
  getCacheManager,
  resetCacheManager,
} from '@/lib/studio/infrastructure/cache/cacheManager';
import type { RedisClient } from '@/lib/studio/infrastructure/redis/upstashClient';

describe('CacheManager', () => {
  let mockRedisClient: Partial<RedisClient>;
  let cacheManager: CacheManager;

  beforeEach(() => {
    // Mock Redis client
    mockRedisClient = {
      get: vi.fn().mockResolvedValue(null),
      setex: vi.fn().mockResolvedValue('OK'),
      del: vi.fn().mockResolvedValue(1),
      keys: vi.fn().mockResolvedValue([]),
      incr: vi.fn(),
      expire: vi.fn(),
      ttl: vi.fn(),
    };

    cacheManager = new CacheManager(mockRedisClient as RedisClient);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    resetCacheManager();
  });

  describe('set and get basic operation', () => {
    it('should set and get a value', async () => {
      const key = 'test-key';
      const value = { data: 'test-data' };
      const ttlMs = 5000;

      await cacheManager.set(key, value, ttlMs);
      const result = await cacheManager.get(key);

      expect(result).toEqual(value);
    });
  });

  describe('get returns null for missing key', () => {
    it('should return null for non-existent key', async () => {
      const result = await cacheManager.get('missing-key');
      expect(result).toBeNull();
    });
  });

  describe('TTL expiry', () => {
    it('should expire entries after TTL', async () => {
      const key = 'expiring-key';
      const value = { data: 'test' };
      const ttlMs = 5000;

      await cacheManager.set(key, value, ttlMs);
      let result = await cacheManager.get(key);
      expect(result).toEqual(value);

      // Advance time past TTL
      vi.advanceTimersByTime(ttlMs + 1);

      result = await cacheManager.get(key);
      expect(result).toBeNull();
    });
  });

  describe('L1 hit', () => {
    it('should increment l1Hits stat on L1 hit', async () => {
      const key = 'l1-hit-key';
      const value = { data: 'test' };

      await cacheManager.set(key, value, 10000);

      // First get hits L1
      await cacheManager.get(key);
      expect(cacheManager.getStats().l1Hits).toBe(1);

      // Second get also hits L1
      await cacheManager.get(key);
      expect(cacheManager.getStats().l1Hits).toBe(2);
    });
  });

  describe('L2 hit', () => {
    it('should increment l2Hits stat on L2 hit and promote to L1', async () => {
      const key = 'l2-hit-key';
      const value = { data: 'test-data' };
      const serialized = JSON.stringify(value);

      // Mock Redis to have the value
      (mockRedisClient.get as any).mockResolvedValueOnce(serialized);

      // Create a new cache manager without the key in L1
      const result = await cacheManager.get(key);

      expect(result).toEqual(value);
      expect(cacheManager.getStats().l2Hits).toBe(1);

      // Verify it's now in L1 by checking L1 hits on second access
      const secondResult = await cacheManager.get(key);
      expect(secondResult).toEqual(value);
      expect(cacheManager.getStats().l1Hits).toBe(1);
    });
  });

  describe('miss', () => {
    it('should increment misses stat on cache miss', async () => {
      const result1 = await cacheManager.get('missing-1');
      expect(result1).toBeNull();
      expect(cacheManager.getStats().misses).toBe(1);

      const result2 = await cacheManager.get('missing-2');
      expect(result2).toBeNull();
      expect(cacheManager.getStats().misses).toBe(2);
    });
  });

  describe('invalidate', () => {
    it('should remove key from both L1 and L2', async () => {
      const key = 'invalidate-key';
      const value = { data: 'test' };

      await cacheManager.set(key, value, 10000);
      let result = await cacheManager.get(key);
      expect(result).toEqual(value);

      await cacheManager.invalidate(key);
      result = await cacheManager.get(key);
      expect(result).toBeNull();

      // Verify Redis del was called
      expect(mockRedisClient.del).toHaveBeenCalledWith(key);
    });
  });

  describe('invalidatePattern', () => {
    it('should remove matching keys from both L1 and L2', async () => {
      const keys = ['user:1', 'user:2', 'user:3'];

      // Mock Redis keys response
      (mockRedisClient.keys as any).mockResolvedValueOnce(keys);

      // Set some values
      await cacheManager.set('user:1', { id: 1 }, 10000);
      await cacheManager.set('user:2', { id: 2 }, 10000);
      await cacheManager.set('user:3', { id: 3 }, 10000);

      // Invalidate pattern
      await cacheManager.invalidatePattern('user:*');

      // Verify all keys were deleted from L1
      expect(await cacheManager.get('user:1')).toBeNull();
      expect(await cacheManager.get('user:2')).toBeNull();
      expect(await cacheManager.get('user:3')).toBeNull();

      // Verify Redis del was called for each key
      expect(mockRedisClient.del).toHaveBeenCalledWith('user:1');
      expect(mockRedisClient.del).toHaveBeenCalledWith('user:2');
      expect(mockRedisClient.del).toHaveBeenCalledWith('user:3');
    });
  });

  describe('LRU eviction', () => {
    it('should evict oldest entry when L1 exceeds 100 entries', async () => {
      // Set 101 items
      for (let i = 0; i < 101; i++) {
        await cacheManager.set(`key-${i}`, { index: i }, 10000);
      }

      const stats = cacheManager.getStats();
      expect(stats.l1Size).toBe(100);
      expect(stats.evictions).toBe(1);
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', async () => {
      // Perform various operations
      await cacheManager.set('key1', { data: 'test1' }, 10000);
      await cacheManager.set('key2', { data: 'test2' }, 10000);

      // L1 hits
      await cacheManager.get('key1');
      await cacheManager.get('key1');

      // Misses
      await cacheManager.get('missing-key');

      const stats = cacheManager.getStats();

      expect(stats.l1Hits).toBe(2);
      expect(stats.l2Hits).toBe(0);
      expect(stats.misses).toBe(1);
      expect(stats.l1Size).toBe(2);
      expect(stats.evictions).toBe(0);
    });
  });

  describe('resetStats', () => {
    it('should zero all statistics counters', async () => {
      // Perform operations
      await cacheManager.set('key1', { data: 'test' }, 10000);
      await cacheManager.get('key1');
      await cacheManager.get('missing-key');

      let stats = cacheManager.getStats();
      expect(stats.l1Hits).toBeGreaterThan(0);
      expect(stats.misses).toBeGreaterThan(0);

      // Reset stats
      cacheManager.resetStats();

      stats = cacheManager.getStats();
      expect(stats.l1Hits).toBe(0);
      expect(stats.l2Hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.evictions).toBe(0);
      expect(stats.l1Size).toBe(1); // Still has the one item
    });
  });

  describe('clear', () => {
    it('should empty L1 and reset stats', async () => {
      await cacheManager.set('key1', { data: 'test1' }, 10000);
      await cacheManager.set('key2', { data: 'test2' }, 10000);
      await cacheManager.get('key1');

      let stats = cacheManager.getStats();
      expect(stats.l1Size).toBe(2);
      expect(stats.l1Hits).toBe(1);

      cacheManager.clear();

      stats = cacheManager.getStats();
      expect(stats.l1Size).toBe(0);
      expect(stats.l1Hits).toBe(0);
      expect(stats.l2Hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.evictions).toBe(0);
    });
  });

  describe('singleton behavior', () => {
    it('should return same instance from getCacheManager', () => {
      resetCacheManager();
      const instance1 = getCacheManager();
      const instance2 = getCacheManager();

      expect(instance1).toBe(instance2);
    });

    it('should create new instance after resetCacheManager', () => {
      const instance1 = getCacheManager();
      resetCacheManager();
      const instance2 = getCacheManager();

      expect(instance1).not.toBe(instance2);
    });
  });

  describe('Redis integration', () => {
    it('should call Redis setex when setting value', async () => {
      await cacheManager.set('redis-key', { data: 'test' }, 5000);

      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        'redis-key',
        5,
        JSON.stringify({ data: 'test' }),
      );
    });

    it('should handle Redis errors gracefully', async () => {
      const errorClient: Partial<RedisClient> = {
        get: vi.fn().mockRejectedValue(new Error('Redis error')),
        setex: vi.fn().mockRejectedValue(new Error('Redis error')),
        del: vi.fn().mockRejectedValue(new Error('Redis error')),
        keys: vi.fn(),
        incr: vi.fn(),
        expire: vi.fn(),
        ttl: vi.fn(),
      };

      const errorCacheManager = new CacheManager(errorClient as RedisClient);

      // Should still work via L1
      await errorCacheManager.set('key', { data: 'test' }, 5000);
      const result = await errorCacheManager.get('key');

      expect(result).toEqual({ data: 'test' });
    });
  });

  describe('L1 and L2 interaction', () => {
    it('should write to both L1 and L2 on set', async () => {
      const key = 'dual-write-key';
      const value = { data: 'test' };

      await cacheManager.set(key, value, 5000);

      // Verify L1 has it
      const l1Result = await cacheManager.get(key);
      expect(l1Result).toEqual(value);
      expect(cacheManager.getStats().l1Hits).toBe(1);

      // Verify Redis setex was called
      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        key,
        5,
        JSON.stringify(value),
      );
    });

    it('should promote L2 hit to L1', async () => {
      const key = 'promote-key';
      const value = { data: 'promoted' };

      // Mock Redis get
      (mockRedisClient.get as any).mockResolvedValueOnce(
        JSON.stringify(value),
      );

      // Get from L2
      const result = await cacheManager.get(key);
      expect(result).toEqual(value);
      expect(cacheManager.getStats().l2Hits).toBe(1);

      // Next access should hit L1
      const secondResult = await cacheManager.get(key);
      expect(secondResult).toEqual(value);
      expect(cacheManager.getStats().l1Hits).toBe(1);
    });
  });
});
