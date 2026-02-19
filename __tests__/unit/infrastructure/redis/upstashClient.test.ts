/**
 * Tests for Upstash Redis Client
 * 
 * Tests the InMemoryFallback implementation and singleton pattern.
 * Uses fake timers for TTL expiry testing.
 * 
 * @module __tests__/unit/infrastructure/redis/upstashClient.test.ts
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getRedisClient, resetRedisClient, type RedisClient } from '@/lib/studio/infrastructure/redis/upstashClient';

describe('Upstash Redis Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRedisClient();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetRedisClient();
  });

  describe('getRedisClient()', () => {
    it('should return an instance', async () => {
      const client = getRedisClient();
      expect(client).toBeDefined();
      expect(client).not.toBeNull();
    });

    it('should return the same instance on multiple calls (singleton)', () => {
      const client1 = getRedisClient();
      const client2 = getRedisClient();
      expect(client1).toBe(client2);
    });

    it('should use in-memory fallback when env vars are not set', async () => {
      resetRedisClient();
      const client = getRedisClient();
      const result = await client.ping();
      expect(result).toBe(true);
    });
  });

  describe('resetRedisClient()', () => {
    it('should force new instance creation', () => {
      const client1 = getRedisClient();
      resetRedisClient();
      const client2 = getRedisClient();
      expect(client1).not.toBe(client2);
    });
  });

  describe('get() and set()', () => {
    let client: RedisClient;

    beforeEach(() => {
      client = getRedisClient();
    });

    it('should set and get a string value', async () => {
      await client.set('key1', 'value1');
      const result = await client.get('key1');
      expect(result).toBe('value1');
    });

    it('should get null for non-existent key', async () => {
      const result = await client.get('non-existent');
      expect(result).toBeNull();
    });

    it('should get and set numeric values', async () => {
      await client.set('counter', 42);
      const result = await client.get<number>('counter');
      expect(result).toBe(42);
    });

    it('should get and set object values', async () => {
      const obj = { name: 'test', count: 123 };
      await client.set('obj-key', obj);
      const result = await client.get<typeof obj>('obj-key');
      expect(result).toEqual(obj);
    });

    it('should overwrite existing value', async () => {
      await client.set('key1', 'value1');
      await client.set('key1', 'value2');
      const result = await client.get('key1');
      expect(result).toBe('value2');
    });
  });

  describe('set() with TTL', () => {
    let client: RedisClient;

    beforeEach(() => {
      vi.useFakeTimers();
      client = getRedisClient();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should set value with expiration time', async () => {
      await client.set('ttl-key', 'value', { ex: 10 });
      const result = await client.get('ttl-key');
      expect(result).toBe('value');
    });

    it('should expire key after TTL seconds', async () => {
      await client.set('ttl-key', 'value', { ex: 10 });
      expect(await client.get('ttl-key')).toBe('value');
      
      vi.advanceTimersByTime(11000);
      const result = await client.get('ttl-key');
      expect(result).toBeNull();
    });

    it('should not expire key before TTL', async () => {
      await client.set('ttl-key', 'value', { ex: 10 });
      vi.advanceTimersByTime(5000);
      const result = await client.get('ttl-key');
      expect(result).toBe('value');
    });

    it('should allow setting value without TTL', async () => {
      await client.set('no-ttl-key', 'value');
      vi.advanceTimersByTime(100000);
      const result = await client.get('no-ttl-key');
      expect(result).toBe('value');
    });
  });

  describe('del()', () => {
    let client: RedisClient;

    beforeEach(() => {
      client = getRedisClient();
    });

    it('should delete a single key', async () => {
      await client.set('key1', 'value1');
      const deleted = await client.del('key1');
      expect(deleted).toBe(1);
      expect(await client.get('key1')).toBeNull();
    });

    it('should delete multiple keys', async () => {
      await client.set('key1', 'value1');
      await client.set('key2', 'value2');
      await client.set('key3', 'value3');
      
      const deleted = await client.del('key1', 'key2', 'key3');
      expect(deleted).toBe(3);
      expect(await client.get('key1')).toBeNull();
      expect(await client.get('key2')).toBeNull();
      expect(await client.get('key3')).toBeNull();
    });

    it('should return 0 for non-existent keys', async () => {
      const deleted = await client.del('non-existent-1', 'non-existent-2');
      expect(deleted).toBe(0);
    });

    it('should delete with no arguments', async () => {
      const deleted = await client.del();
      expect(deleted).toBe(0);
    });

    it('should handle mixed existing and non-existent keys', async () => {
      await client.set('key1', 'value1');
      const deleted = await client.del('key1', 'non-existent');
      expect(deleted).toBe(1);
    });
  });

  describe('expire()', () => {
    let client: RedisClient;

    beforeEach(() => {
      vi.useFakeTimers();
      client = getRedisClient();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should set expiration on existing key', async () => {
      await client.set('key1', 'value1');
      const result = await client.expire('key1', 5);
      expect(result).toBe(true);
    });

    it('should return false for non-existent key', async () => {
      const result = await client.expire('non-existent', 5);
      expect(result).toBe(false);
    });

    it('should expire key after specified seconds', async () => {
      await client.set('key1', 'value1');
      await client.expire('key1', 10);
      expect(await client.get('key1')).toBe('value1');
      
      vi.advanceTimersByTime(11000);
      expect(await client.get('key1')).toBeNull();
    });
  });

  describe('incr()', () => {
    let client: RedisClient;

    beforeEach(() => {
      client = getRedisClient();
    });

    it('should increment from 0 for non-existent key', async () => {
      const result = await client.incr('counter');
      expect(result).toBe(1);
    });

    it('should increment existing value', async () => {
      await client.set('counter', 5);
      const result = await client.incr('counter');
      expect(result).toBe(6);
    });

    it('should increment multiple times', async () => {
      const result1 = await client.incr('counter');
      const result2 = await client.incr('counter');
      const result3 = await client.incr('counter');
      
      expect(result1).toBe(1);
      expect(result2).toBe(2);
      expect(result3).toBe(3);
    });

    it('should persist incremented value', async () => {
      await client.incr('counter');
      await client.incr('counter');
      const stored = await client.get<number>('counter');
      expect(stored).toBe(2);
    });
  });

  describe('lpush() and rpop()', () => {
    let client: RedisClient;

    beforeEach(() => {
      client = getRedisClient();
    });

    it('should push single value to list', async () => {
      const length = await client.lpush('list1', 'value1');
      expect(length).toBe(1);
    });

    it('should push multiple values to list', async () => {
      const length = await client.lpush('list1', 'value1', 'value2', 'value3');
      expect(length).toBe(3);
    });

    it('should pop value from list in LIFO order', async () => {
      await client.lpush('list1', 'a', 'b', 'c');
      const popped = await client.rpop('list1');
      expect(popped).toBe('a');
    });

    it('should pop all values in correct order', async () => {
      await client.lpush('list1', 'first', 'second', 'third');
      
      const val1 = await client.rpop('list1');
      const val2 = await client.rpop('list1');
      const val3 = await client.rpop('list1');
      const val4 = await client.rpop('list1');
      
      expect(val1).toBe('first');
      expect(val2).toBe('second');
      expect(val3).toBe('third');
      expect(val4).toBeNull();
    });

    it('should return null when popping from empty list', async () => {
      const result = await client.rpop('empty-list');
      expect(result).toBeNull();
    });

    it('should return list length after each push', async () => {
      const len1 = await client.lpush('list1', 'a');
      const len2 = await client.lpush('list1', 'b');
      const len3 = await client.lpush('list1', 'c');
      
      expect(len1).toBe(1);
      expect(len2).toBe(2);
      expect(len3).toBe(3);
    });
  });

  describe('scan()', () => {
    let client: RedisClient;

    beforeEach(() => {
      client = getRedisClient();
    });

    it('should return all keys with default pattern', async () => {
      await client.set('key1', 'value1');
      await client.set('key2', 'value2');
      await client.set('key3', 'value3');
      
      const [cursor, keys] = await client.scan(0);
      expect(cursor).toBe(0);
      expect(keys).toHaveLength(3);
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).toContain('key3');
    });

    it('should filter keys by pattern', async () => {
      await client.set('user:1', 'alice');
      await client.set('user:2', 'bob');
      await client.set('post:1', 'hello');
      
      const [, keys] = await client.scan(0, { match: 'user:*' });
      expect(keys).toHaveLength(2);
      expect(keys).toContain('user:1');
      expect(keys).toContain('user:2');
      expect(keys).not.toContain('post:1');
    });

    it('should not return expired keys', async () => {
      vi.useFakeTimers();
      await client.set('key1', 'value1', { ex: 5 });
      await client.set('key2', 'value2');
      
      vi.advanceTimersByTime(6000);
      const [, keys] = await client.scan(0);
      expect(keys).toHaveLength(1);
      expect(keys).toContain('key2');
      expect(keys).not.toContain('key1');
      
      vi.useRealTimers();
    });

    it('should return empty array for no matches', async () => {
      await client.set('key1', 'value1');
      const [, keys] = await client.scan(0, { match: 'nomatch:*' });
      expect(keys).toHaveLength(0);
    });
  });

  describe('keys()', () => {
    let client: RedisClient;

    beforeEach(() => {
      client = getRedisClient();
    });

    it('should return all keys with wildcard pattern', async () => {
      await client.set('key1', 'value1');
      await client.set('key2', 'value2');
      await client.set('other', 'value3');
      
      const keys = await client.keys('key*');
      expect(keys).toHaveLength(2);
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
    });

    it('should return empty array for no matches', async () => {
      await client.set('key1', 'value1');
      const keys = await client.keys('nomatch*');
      expect(keys).toHaveLength(0);
    });

    it('should match exact pattern', async () => {
      await client.set('exact-key', 'value1');
      await client.set('other-key', 'value2');
      
      const keys = await client.keys('exact-key');
      expect(keys).toHaveLength(1);
      expect(keys[0]).toBe('exact-key');
    });

    it('should handle multiple wildcards', async () => {
      await client.set('user:1:profile', 'alice');
      await client.set('user:1:settings', 'aliceprefs');
      await client.set('user:2:profile', 'bob');
      await client.set('post:1', 'hello');
      
      const keys = await client.keys('user:1:*');
      expect(keys).toHaveLength(2);
      expect(keys).toContain('user:1:profile');
      expect(keys).toContain('user:1:settings');
    });
  });

  describe('ping()', () => {
    it('should return true for in-memory client', async () => {
      const client = getRedisClient();
      const result = await client.ping();
      expect(result).toBe(true);
    });
  });

  describe('Integration scenarios', () => {
    let client: RedisClient;

    beforeEach(() => {
      client = getRedisClient();
    });

    it('should handle multiple operations in sequence', async () => {
      await client.set('session:1', JSON.stringify({ user: 'alice', token: 'abc123' }), { ex: 3600 });
      await client.lpush('queue:jobs', 'job1', 'job2', 'job3');
      await client.incr('stats:visits');
      
      const session = await client.get('session:1');
      const job = await client.rpop('queue:jobs');
      const visits = await client.get<number>('stats:visits');
      
      expect(session).toContain('alice');
      expect(job).toBe('job1');
      expect(visits).toBe(1);
    });

    it('should handle del with different key types', async () => {
      await client.set('string-key', 'value');
      await client.lpush('list-key', 'value');
      
      const deleted = await client.del('string-key', 'list-key');
      expect(deleted).toBe(2);
      expect(await client.get('string-key')).toBeNull();
      expect(await client.rpop('list-key')).toBeNull();
    });
  });
});
