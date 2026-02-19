/**
 * Tests for rate-limiter-tiers.ts — real in-memory sliding window enforcement.
 *
 * Covers:
 * - Tier configuration access
 * - checkRateLimit() — basic, multi-action, plan escalation, unknown action
 * - checkAuthRateLimit() — per-minute window, plan differences
 * - resetRateLimits() — single action, all actions
 * - getUserRateLimitStats() — usage peek without incrementing
 * - validateFileSize() — plan-based file size check
 * - getRecommendedPlan() — upgrade recommendation logic
 * - _resetStore / _getStoreSize — testing helpers
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkRateLimit,
  checkAuthRateLimit,
  getRateLimits,
  resetRateLimits,
  getUserRateLimitStats,
  validateFileSize,
  getRecommendedPlan,
  _resetStore,
  _getStoreSize,
} from '@/lib/security/rate-limiter-tiers';

beforeEach(() => {
  _resetStore();
});

/* ================================================================
   getRateLimits
   ================================================================ */

describe('getRateLimits', () => {
  it('returns correct limits for free plan', () => {
    const limits = getRateLimits('free');
    expect(limits.ai).toBe(5);
    expect(limits.upload).toBe(10);
    expect(limits.generate).toBe(3);
    expect(limits.export).toBe(5);
    expect(limits.auth).toBe(5);
    expect(limits.fileSize).toBe(10);
    expect(limits.apiCallsPerSecond).toBe(2);
  });

  it('returns higher limits for pro plan', () => {
    const limits = getRateLimits('pro');
    expect(limits.ai).toBe(50);
    expect(limits.upload).toBe(100);
  });

  it('returns team limits', () => {
    const limits = getRateLimits('team');
    expect(limits.ai).toBe(200);
  });

  it('returns enterprise limits', () => {
    const limits = getRateLimits('enterprise');
    expect(limits.ai).toBe(1000);
    expect(limits.upload).toBe(2000);
  });

  it('falls back to free for unknown plan', () => {
    const limits = getRateLimits('unknown_plan' as any);
    expect(limits.ai).toBe(5);
  });
});

/* ================================================================
   checkRateLimit — in-memory enforcement
   ================================================================ */

describe('checkRateLimit', () => {
  it('allows first request for any plan', async () => {
    const result = await checkRateLimit('user1', 'ai', 'free');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4); // free ai limit = 5, used 1
  });

  it('tracks requests cumulatively', async () => {
    await checkRateLimit('user2', 'ai', 'free');
    await checkRateLimit('user2', 'ai', 'free');
    const result = await checkRateLimit('user2', 'ai', 'free');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2); // 5 - 3 = 2
  });

  it('blocks when limit exceeded', async () => {
    // Free plan: ai = 5
    for (let i = 0; i < 5; i++) {
      const r = await checkRateLimit('user3', 'ai', 'free');
      expect(r.allowed).toBe(true);
    }
    const blocked = await checkRateLimit('user3', 'ai', 'free');
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it('pro plan has higher ai limit than free', async () => {
    // Exhaust free plan limit
    for (let i = 0; i < 6; i++) {
      await checkRateLimit('freeUser', 'ai', 'free');
    }
    const freeResult = await checkRateLimit('freeUser', 'ai', 'free');
    expect(freeResult.allowed).toBe(false);

    // Pro plan user at same count should still be allowed
    for (let i = 0; i < 6; i++) {
      await checkRateLimit('proUser', 'ai', 'pro');
    }
    const proResult = await checkRateLimit('proUser', 'ai', 'pro');
    expect(proResult.allowed).toBe(true); // pro limit = 50
  });

  it('tracks different actions independently', async () => {
    // Exhaust ai limit for free
    for (let i = 0; i < 6; i++) {
      await checkRateLimit('user4', 'ai', 'free');
    }
    const aiResult = await checkRateLimit('user4', 'ai', 'free');
    expect(aiResult.allowed).toBe(false);

    // Upload should still work (separate counter)
    const uploadResult = await checkRateLimit('user4', 'upload', 'free');
    expect(uploadResult.allowed).toBe(true);
  });

  it('tracks different users independently', async () => {
    for (let i = 0; i < 6; i++) {
      await checkRateLimit('userA', 'ai', 'free');
    }
    expect((await checkRateLimit('userA', 'ai', 'free')).allowed).toBe(false);
    expect((await checkRateLimit('userB', 'ai', 'free')).allowed).toBe(true);
  });

  it('handles general action with per-second window', async () => {
    // free: apiCallsPerSecond = 2
    const r1 = await checkRateLimit('user5', 'general', 'free');
    expect(r1.allowed).toBe(true);
    const r2 = await checkRateLimit('user5', 'general', 'free');
    expect(r2.allowed).toBe(true);
    const r3 = await checkRateLimit('user5', 'general', 'free');
    expect(r3.allowed).toBe(false);
  });

  it('denies unknown action types', async () => {
    const result = await checkRateLimit('user6', 'nonexistent_action', 'free');
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('returns a resetTime in the future', async () => {
    const beforeSec = Math.floor(Date.now() / 1000);
    const result = await checkRateLimit('user7', 'ai', 'free');
    expect(result.resetTime).toBeGreaterThan(beforeSec);
    expect(result.limitWindow).toBe(3600000); // 1 hour for standard actions
  });

  it('returns 1s window for general action', async () => {
    const result = await checkRateLimit('user8', 'general', 'free');
    expect(result.limitWindow).toBe(1000);
  });

  it('populates the store', async () => {
    expect(_getStoreSize()).toBe(0);
    await checkRateLimit('storeUser', 'ai', 'free');
    expect(_getStoreSize()).toBeGreaterThan(0);
  });
});

/* ================================================================
   checkAuthRateLimit
   ================================================================ */

describe('checkAuthRateLimit', () => {
  it('allows first auth attempt', async () => {
    const result = await checkAuthRateLimit('login@example.com');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4); // free auth = 5
  });

  it('blocks after exceeding auth limit', async () => {
    for (let i = 0; i < 5; i++) {
      await checkAuthRateLimit('brute@example.com', 'free');
    }
    const blocked = await checkAuthRateLimit('brute@example.com', 'free');
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it('uses 60-second window', async () => {
    const result = await checkAuthRateLimit('user@test.com');
    expect(result.limitWindow).toBe(60000);
  });

  it('higher plan gets more auth attempts', async () => {
    // Exhaust free limit (5)
    for (let i = 0; i < 6; i++) {
      await checkAuthRateLimit('freeLogin', 'free');
    }
    expect((await checkAuthRateLimit('freeLogin', 'free')).allowed).toBe(false);

    // Pro has 20 auth attempts
    for (let i = 0; i < 6; i++) {
      await checkAuthRateLimit('proLogin', 'pro');
    }
    expect((await checkAuthRateLimit('proLogin', 'pro')).allowed).toBe(true);
  });
});

/* ================================================================
   resetRateLimits
   ================================================================ */

describe('resetRateLimits', () => {
  it('resets a single action', async () => {
    // Use up some limit
    for (let i = 0; i < 3; i++) {
      await checkRateLimit('resetUser', 'ai', 'free');
    }
    await checkRateLimit('resetUser', 'upload', 'free');

    // Reset only ai
    await resetRateLimits('resetUser', 'ai');

    // AI should be fresh
    const aiResult = await checkRateLimit('resetUser', 'ai', 'free');
    expect(aiResult.remaining).toBe(4); // back to 5 - 1

    // Upload should still track
    const uploadResult = await checkRateLimit('resetUser', 'upload', 'free');
    expect(uploadResult.remaining).toBe(8); // 10 - 2 (1 from before + 1 now)
  });

  it('resets all actions', async () => {
    await checkRateLimit('resetAllUser', 'ai', 'free');
    await checkRateLimit('resetAllUser', 'upload', 'free');
    await checkRateLimit('resetAllUser', 'generate', 'free');

    const sizeBefore = _getStoreSize();
    expect(sizeBefore).toBeGreaterThan(0);

    await resetRateLimits('resetAllUser', 'all');

    // New requests should start fresh
    const result = await checkRateLimit('resetAllUser', 'ai', 'free');
    expect(result.remaining).toBe(4);
  });
});

/* ================================================================
   getUserRateLimitStats
   ================================================================ */

describe('getUserRateLimitStats', () => {
  it('returns zero usage for fresh user', async () => {
    const stats = await getUserRateLimitStats('freshUser', 'free');
    expect(stats.ai.used).toBe(0);
    expect(stats.ai.limit).toBe(5);
    expect(stats.ai.remaining).toBe(5);
    expect(stats.upload.used).toBe(0);
    expect(stats.upload.limit).toBe(10);
  });

  it('reflects actual usage without incrementing', async () => {
    await checkRateLimit('statsUser', 'ai', 'pro');
    await checkRateLimit('statsUser', 'ai', 'pro');
    await checkRateLimit('statsUser', 'ai', 'pro');

    const stats = await getUserRateLimitStats('statsUser', 'pro');
    expect(stats.ai.used).toBe(3);
    expect(stats.ai.limit).toBe(50);
    expect(stats.ai.remaining).toBe(47);

    // Calling stats again should NOT increase usage
    const stats2 = await getUserRateLimitStats('statsUser', 'pro');
    expect(stats2.ai.used).toBe(3);
  });

  it('covers all four tracked actions', async () => {
    const stats = await getUserRateLimitStats('coverageUser', 'free');
    expect(Object.keys(stats)).toEqual(
      expect.arrayContaining(['ai', 'upload', 'generate', 'export']),
    );
  });
});

/* ================================================================
   validateFileSize
   ================================================================ */

describe('validateFileSize', () => {
  it('allows files within free limit (10MB)', () => {
    expect(validateFileSize(5 * 1024 * 1024, 'free')).toBe(true);
    expect(validateFileSize(10 * 1024 * 1024, 'free')).toBe(true);
  });

  it('rejects files exceeding free limit', () => {
    expect(validateFileSize(11 * 1024 * 1024, 'free')).toBe(false);
  });

  it('pro plan allows up to 50MB', () => {
    expect(validateFileSize(50 * 1024 * 1024, 'pro')).toBe(true);
    expect(validateFileSize(51 * 1024 * 1024, 'pro')).toBe(false);
  });

  it('enterprise plan allows up to 500MB', () => {
    expect(validateFileSize(500 * 1024 * 1024, 'enterprise')).toBe(true);
  });
});

/* ================================================================
   getRecommendedPlan
   ================================================================ */

describe('getRecommendedPlan', () => {
  it('recommends pro when free user is at 80%+ utilization', () => {
    const usage = { ai: 4 }; // 4/5 = 80%
    expect(getRecommendedPlan(usage, 'free')).toBe('pro');
  });

  it('recommends team when pro user is at 80%+', () => {
    const usage = { ai: 40 }; // 40/50 = 80%
    expect(getRecommendedPlan(usage, 'pro')).toBe('team');
  });

  it('returns null when usage is under threshold', () => {
    const usage = { ai: 1 }; // 1/5 = 20%
    expect(getRecommendedPlan(usage, 'free')).toBeNull();
  });

  it('returns null for enterprise at max (no higher plan)', () => {
    const usage = { ai: 900 }; // 900/1000 = 90%
    expect(getRecommendedPlan(usage, 'enterprise')).toBeNull();
  });
});

/* ================================================================
   Testing helpers
   ================================================================ */

describe('testing helpers', () => {
  it('_resetStore clears everything', async () => {
    await checkRateLimit('helperUser', 'ai', 'free');
    expect(_getStoreSize()).toBeGreaterThan(0);
    _resetStore();
    expect(_getStoreSize()).toBe(0);
  });
});
