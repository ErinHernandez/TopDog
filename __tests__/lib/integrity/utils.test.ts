/**
 * Tests for lib/integrity/utils.ts
 *
 * Tests utility functions for integrity system
 */

import {
  normalizeUserPair,
  createPairId,
  parsePairId,
  truncateUserId,
  average,
  clamp,
  sleep,
} from '@/lib/integrity/utils';

describe('utils', () => {
  describe('normalizeUserPair', () => {
    it('should return users in lexicographic order', () => {
      const [u1, u2] = normalizeUserPair('userB', 'userA');
      expect(u1).toBe('userA');
      expect(u2).toBe('userB');
    });

    it('should maintain order if already sorted', () => {
      const [u1, u2] = normalizeUserPair('userA', 'userB');
      expect(u1).toBe('userA');
      expect(u2).toBe('userB');
    });

    it('should handle equal users', () => {
      const [u1, u2] = normalizeUserPair('userA', 'userA');
      expect(u1).toBe('userA');
      expect(u2).toBe('userA');
    });
  });

  describe('createPairId', () => {
    it('should create consistent pair ID', () => {
      const id1 = createPairId('userA', 'userB');
      const id2 = createPairId('userB', 'userA');
      expect(id1).toBe(id2);
      expect(id1).toBe('userA_userB');
    });

    it('should handle different order inputs', () => {
      expect(createPairId('user1', 'user2')).toBe('user1_user2');
      expect(createPairId('user2', 'user1')).toBe('user1_user2');
    });
  });

  describe('parsePairId', () => {
    it('should parse valid pair ID', () => {
      const result = parsePairId('user1_user2');
      expect(result).toEqual({ userId1: 'user1', userId2: 'user2' });
    });

    it('should return null for invalid format', () => {
      expect(parsePairId('singleuser')).toBeNull();
      expect(parsePairId('user1_user2_user3')).toBeNull();
      expect(parsePairId('')).toBeNull();
    });
  });

  describe('truncateUserId', () => {
    it('should truncate long user IDs', () => {
      expect(truncateUserId('verylonguserid123456789', 8)).toBe('verylong');
    });

    it('should not truncate short user IDs', () => {
      expect(truncateUserId('short', 8)).toBe('short');
    });

    it('should use default length of 8', () => {
      expect(truncateUserId('123456789012345')).toBe('12345678');
    });
  });

  describe('average', () => {
    it('should calculate average correctly', () => {
      expect(average([1, 2, 3, 4, 5])).toBe(3);
      expect(average([10, 20])).toBe(15);
    });

    it('should return 0 for empty array', () => {
      expect(average([])).toBe(0);
    });

    it('should handle single value', () => {
      expect(average([5])).toBe(5);
    });
  });

  describe('clamp', () => {
    it('should clamp values to range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it('should handle edge cases', () => {
      expect(clamp(0, 0, 10)).toBe(0);
      expect(clamp(10, 0, 10)).toBe(10);
    });
  });

  describe('sleep', () => {
    it('should wait for specified time', async () => {
      const start = Date.now();
      await sleep(50);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(45);
      expect(elapsed).toBeLessThan(100);
    });
  });
});
