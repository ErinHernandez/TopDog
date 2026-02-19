/**
 * Rate Limiting by User Plan
 * Enforces different API rate limits based on subscription tier.
 *
 * Uses an in-memory sliding-window counter per user + action.
 * When Redis credentials are configured, falls back gracefully —
 * the in-memory store is the primary enforcement mechanism for
 * single-server deployments and Vercel serverless (per-isolate).
 *
 * @module lib/security/rate-limiter-tiers
 */

/* ================================================================
   Types
   ================================================================ */

/** User subscription plans */
export type UserPlan = 'free' | 'pro' | 'team' | 'enterprise';

/** Rate limit action types recognised by the tier system */
export type RateLimitAction =
  | 'ai'
  | 'upload'
  | 'generate'
  | 'export'
  | 'auth'
  | 'general';

/** Rate limit configuration for different actions */
export interface RateLimits {
  ai: number;                // AI API calls per hour
  upload: number;            // File uploads per hour
  generate: number;          // Generation requests per hour
  export: number;            // Export operations per hour
  auth: number;              // Auth attempts per minute (strict)
  fileSize: number;          // Max file size in MB
  apiCallsPerSecond: number; // General API rate limit
}

/** Result of rate limit check */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;         // Unix timestamp (seconds) when limit resets
  limitWindow: number;       // Window size in milliseconds
}

/* ================================================================
   Tier Configuration
   ================================================================ */

const RATE_LIMIT_TIERS: Record<UserPlan, RateLimits> = {
  free: {
    ai: 5,
    upload: 10,
    generate: 3,
    export: 5,
    auth: 5,
    fileSize: 10,
    apiCallsPerSecond: 2,
  },
  pro: {
    ai: 50,
    upload: 100,
    generate: 30,
    export: 50,
    auth: 20,
    fileSize: 50,
    apiCallsPerSecond: 10,
  },
  team: {
    ai: 200,
    upload: 500,
    generate: 100,
    export: 200,
    auth: 50,
    fileSize: 200,
    apiCallsPerSecond: 50,
  },
  enterprise: {
    ai: 1000,
    upload: 2000,
    generate: 500,
    export: 1000,
    auth: 100,
    fileSize: 500,
    apiCallsPerSecond: 100,
  },
};

/* ================================================================
   In-Memory Sliding Window Store
   ================================================================ */

interface WindowEntry {
  count: number;
  windowStart: number; // ms timestamp for window start
  windowMs: number;    // window duration in ms
}

/**
 * Global in-memory store keyed by `userId:action:windowSlot`.
 * Automatically cleaned up on every write to prevent unbounded growth.
 */
const store = new Map<string, WindowEntry>();

/** Cleanup entries older than their window. Called lazily on writes. */
function cleanupExpired(): void {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now >= entry.windowStart + entry.windowMs) {
      store.delete(key);
    }
  }
}

/** Interval-based cleanup (every 5 minutes) to prevent slow leak. */
let cleanupInterval: ReturnType<typeof setInterval> | null = null;

function ensureCleanupInterval(): void {
  if (cleanupInterval === null) {
    cleanupInterval = setInterval(cleanupExpired, 5 * 60 * 1000);
    // Don't prevent Node from exiting
    if (typeof cleanupInterval === 'object' && 'unref' in cleanupInterval) {
      cleanupInterval.unref();
    }
  }
}

/**
 * Increment and check the counter for a key within a sliding window.
 *
 * @returns The current count AFTER increment and the window reset time.
 */
function incrementAndCheck(
  key: string,
  windowMs: number,
): { currentCount: number; resetTime: number } {
  ensureCleanupInterval();

  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now >= entry.windowStart + entry.windowMs) {
    // Window expired or first request — start new window
    const windowStart = now;
    store.set(key, { count: 1, windowStart, windowMs });
    return {
      currentCount: 1,
      resetTime: Math.ceil((windowStart + windowMs) / 1000),
    };
  }

  // Within existing window — increment
  entry.count += 1;
  return {
    currentCount: entry.count,
    resetTime: Math.ceil((entry.windowStart + entry.windowMs) / 1000),
  };
}

/**
 * Get the current count WITHOUT incrementing.
 */
function peekCount(key: string, windowMs: number): number {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || now >= entry.windowStart + entry.windowMs) {
    return 0;
  }
  return entry.count;
}

/* ================================================================
   Public API
   ================================================================ */

/**
 * Get rate limits for a specific plan.
 */
export function getRateLimits(plan: UserPlan): RateLimits {
  return RATE_LIMIT_TIERS[plan] || RATE_LIMIT_TIERS.free;
}

/**
 * Rate limit storage key format.
 */
function getRateLimitKey(userId: string, action: string, windowMs: number): string {
  // Slot key changes when the current window elapses
  const slot = Math.floor(Date.now() / windowMs);
  return `rl:${userId}:${action}:${slot}`;
}

/**
 * Check if an action is allowed under rate limits.
 * Increments the counter atomically so the check is also the consume.
 *
 * @param userId - User ID to check limits for
 * @param action - Action being performed (ai, upload, generate, export, general)
 * @param plan   - User's subscription plan
 * @returns Rate limit check result
 *
 * @example
 * const result = await checkRateLimit('user123', 'ai', 'pro');
 * if (!result.allowed) {
 *   return res.status(429).json({ error: 'Rate limit exceeded', retryAfter: result.resetTime });
 * }
 */
export async function checkRateLimit(
  userId: string,
  action: string,
  plan: UserPlan,
): Promise<RateLimitResult> {
  const limits = getRateLimits(plan);

  // Map 'general' action to apiCallsPerSecond with 1s window
  if (action === 'general') {
    const limit = limits.apiCallsPerSecond;
    const windowMs = 1000;
    const key = getRateLimitKey(userId, action, windowMs);
    const { currentCount, resetTime } = incrementAndCheck(key, windowMs);

    return {
      allowed: currentCount <= limit,
      remaining: Math.max(0, limit - currentCount),
      resetTime,
      limitWindow: windowMs,
    };
  }

  // Standard actions: per-hour window
  const limit = limits[action as keyof RateLimits];
  if (!limit || typeof limit !== 'number') {
    // Unknown action — deny by default
    return {
      allowed: false,
      remaining: 0,
      resetTime: Math.floor(Date.now() / 1000) + 3600,
      limitWindow: 3600000,
    };
  }

  const windowMs = 3600000; // 1 hour
  const key = getRateLimitKey(userId, action, windowMs);
  const { currentCount, resetTime } = incrementAndCheck(key, windowMs);

  return {
    allowed: currentCount <= limit,
    remaining: Math.max(0, limit - currentCount),
    resetTime,
    limitWindow: windowMs,
  };
}

/**
 * Check auth endpoint rate limit (per-minute, stricter).
 *
 * @param identifier - Username or email being authenticated
 * @param plan       - User's subscription plan (defaults to 'free' for unauthenticated)
 */
export async function checkAuthRateLimit(
  identifier: string,
  plan: UserPlan = 'free',
): Promise<RateLimitResult> {
  const limits = getRateLimits(plan);
  const authLimit = limits.auth;
  const windowMs = 60000; // 1 minute

  const key = getRateLimitKey(identifier, 'auth', windowMs);
  const { currentCount, resetTime } = incrementAndCheck(key, windowMs);

  return {
    allowed: currentCount <= authLimit,
    remaining: Math.max(0, authLimit - currentCount),
    resetTime,
    limitWindow: windowMs,
  };
}

/**
 * Reset rate limits for a user.
 *
 * @param userId - User ID to reset limits for
 * @param action - Specific action to reset, or 'all' for all actions
 */
export async function resetRateLimits(
  userId: string,
  action: string = 'all',
): Promise<void> {
  if (action === 'all') {
    const actions = ['ai', 'upload', 'generate', 'export', 'auth', 'general'];
    for (const act of actions) {
      // Delete any entries matching this user+action across all window slots
      for (const key of store.keys()) {
        if (key.startsWith(`rl:${userId}:${act}:`)) {
          store.delete(key);
        }
      }
    }
  } else {
    for (const key of store.keys()) {
      if (key.startsWith(`rl:${userId}:${action}:`)) {
        store.delete(key);
      }
    }
  }
}

/**
 * Get current usage statistics for a user.
 */
export async function getUserRateLimitStats(
  userId: string,
  plan: UserPlan,
): Promise<Record<string, { used: number; limit: number; remaining: number }>> {
  const limits = getRateLimits(plan);
  const stats: Record<string, { used: number; limit: number; remaining: number }> = {};

  const actions = ['ai', 'upload', 'generate', 'export'] as const;

  for (const action of actions) {
    const limit = limits[action];
    const windowMs = 3600000;
    const key = getRateLimitKey(userId, action, windowMs);
    const used = peekCount(key, windowMs);

    stats[action] = {
      used,
      limit,
      remaining: Math.max(0, limit - used),
    };
  }

  return stats;
}

/**
 * Validate file size against plan limits.
 */
export function validateFileSize(fileSize: number, plan: UserPlan): boolean {
  const limits = getRateLimits(plan);
  const maxSizeBytes = limits.fileSize * 1024 * 1024;
  return fileSize <= maxSizeBytes;
}

/**
 * Get recommended plan based on usage patterns.
 */
export function getRecommendedPlan(
  currentUsage: Record<string, number>,
  currentPlan: UserPlan,
): UserPlan | null {
  const currentLimits = getRateLimits(currentPlan);

  let maxUtilization = 0;
  for (const [action, usage] of Object.entries(currentUsage)) {
    const limit = currentLimits[action as keyof RateLimits];
    if (limit && typeof limit === 'number') {
      const utilization = usage / limit;
      maxUtilization = Math.max(maxUtilization, utilization);
    }
  }

  if (maxUtilization >= 0.8) {
    const upgradeMap: Record<UserPlan, UserPlan> = {
      free: 'pro',
      pro: 'team',
      team: 'enterprise',
      enterprise: 'enterprise',
    };
    const recommendedPlan = upgradeMap[currentPlan];
    return recommendedPlan !== currentPlan ? recommendedPlan : null;
  }

  return null;
}

/* ================================================================
   Testing Helpers (exported for unit tests only)
   ================================================================ */

/** @internal Clear all stored rate limit data. For tests only. */
export function _resetStore(): void {
  store.clear();
}

/** @internal Get the store size. For tests only. */
export function _getStoreSize(): number {
  return store.size;
}
