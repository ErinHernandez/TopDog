/**
 * HTTP Cache Headers Utility
 *
 * Provides consistent cache headers for API responses.
 * Helps with CDN caching, browser caching, and reducing server load.
 *
 * @module lib/api/cacheHeaders
 */

import type { NextApiResponse } from 'next';

// ============================================================================
// TYPES
// ============================================================================

export type CacheProfile =
  | 'no-cache'      // Sensitive data, never cache
  | 'private-short' // User-specific data, short cache (5 min)
  | 'private-medium'// User-specific data, medium cache (15 min)
  | 'public-short'  // Public data, short cache (5 min)
  | 'public-medium' // Public data, medium cache (30 min)
  | 'public-long'   // Public data, long cache (1 hour)
  | 'static';       // Static data, very long cache (1 day)

export interface CacheConfig {
  profile: CacheProfile;
  /** Override max-age in seconds */
  maxAge?: number;
  /** Override stale-while-revalidate in seconds */
  staleWhileRevalidate?: number;
}

// ============================================================================
// CACHE PROFILES
// ============================================================================

const CACHE_PROFILES: Record<CacheProfile, string> = {
  // Never cache - for auth, payments, user-specific sensitive data
  'no-cache': 'no-store, no-cache, must-revalidate, proxy-revalidate',

  // Private caches only (browser), short duration
  // Good for: user profile data, draft status, balance
  'private-short': 'private, max-age=300, stale-while-revalidate=60',

  // Private caches, medium duration
  // Good for: user teams, user settings
  'private-medium': 'private, max-age=900, stale-while-revalidate=300',

  // Public caches allowed (CDN + browser), short duration
  // Good for: exchange rates, tournament list (changes frequently)
  'public-short': 'public, max-age=300, stale-while-revalidate=600',

  // Public caches, medium duration
  // Good for: ADP data, player stats, tournament details
  'public-medium': 'public, max-age=1800, stale-while-revalidate=900',

  // Public caches, long duration
  // Good for: NFL schedule, player info (changes rarely)
  'public-long': 'public, max-age=3600, stale-while-revalidate=1800',

  // Static/immutable data
  // Good for: historical stats, completed tournament results
  'static': 'public, max-age=86400, stale-while-revalidate=43200, immutable',
};

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Set cache headers on a response
 *
 * @example
 * ```ts
 * // No caching for auth endpoint
 * setCacheHeaders(res, 'no-cache');
 *
 * // Public data with custom TTL
 * setCacheHeaders(res, { profile: 'public-medium', maxAge: 600 });
 *
 * // Public data with defaults
 * setCacheHeaders(res, 'public-short');
 * ```
 */
export function setCacheHeaders(
  res: NextApiResponse,
  config: CacheProfile | CacheConfig
): void {
  const profile = typeof config === 'string' ? config : config.profile;
  let cacheControl = CACHE_PROFILES[profile];

  // Apply overrides if provided
  if (typeof config === 'object') {
    if (config.maxAge !== undefined) {
      cacheControl = cacheControl.replace(
        /max-age=\d+/,
        `max-age=${config.maxAge}`
      );
    }
    if (config.staleWhileRevalidate !== undefined) {
      cacheControl = cacheControl.replace(
        /stale-while-revalidate=\d+/,
        `stale-while-revalidate=${config.staleWhileRevalidate}`
      );
    }
  }

  res.setHeader('Cache-Control', cacheControl);

  // Add Vary header for content negotiation
  // This ensures different cached versions for different Accept-Encoding, etc.
  res.setHeader('Vary', 'Accept-Encoding, Authorization');
}

/**
 * Set ETag header for conditional requests
 * Use with setCacheHeaders for efficient caching
 *
 * @param res - Response object
 * @param data - Data to generate ETag from
 */
export function setETag(res: NextApiResponse, data: unknown): void {
  const hash = simpleHash(JSON.stringify(data));
  res.setHeader('ETag', `"${hash}"`);
}

/**
 * Check if client has valid cached version
 * Returns true if client cache is still valid (304 should be returned)
 *
 * @param req - Request with If-None-Match header
 * @param currentETag - Current ETag value
 */
export function checkETag(
  ifNoneMatch: string | undefined,
  currentETag: string
): boolean {
  if (!ifNoneMatch) return false;
  return ifNoneMatch === `"${currentETag}"` || ifNoneMatch === currentETag;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Simple hash function for ETag generation
 * Not cryptographic - just for cache validation
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

// ============================================================================
// RECOMMENDED CACHE PROFILES BY ENDPOINT TYPE
// ============================================================================

/**
 * Cache profile recommendations:
 *
 * NO CACHE ('no-cache'):
 * - /api/auth/*
 * - /api/stripe/*
 * - /api/paymongo/*
 * - /api/xendit/*
 * - /api/paystack/*
 * - /api/csrf-token
 * - /api/withdrawals/*
 *
 * PRIVATE SHORT ('private-short'):
 * - /api/user/balance
 * - /api/user/profile
 * - /api/draft/status
 * - /api/my-teams
 *
 * PRIVATE MEDIUM ('private-medium'):
 * - /api/user/settings
 * - /api/user/transactions
 *
 * PUBLIC SHORT ('public-short'):
 * - /api/stripe/exchange-rate
 * - /api/tournaments (list)
 * - /api/health
 *
 * PUBLIC MEDIUM ('public-medium'):
 * - /api/adp/*
 * - /api/tournaments/[id]
 * - /api/players (search)
 *
 * PUBLIC LONG ('public-long'):
 * - /api/nfl/schedule
 * - /api/nfl/teams
 * - /api/players/[id]
 *
 * STATIC ('static'):
 * - /api/nfl/historical/*
 * - /api/tournaments/[id]/results (completed)
 */
