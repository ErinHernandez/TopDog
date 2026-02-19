/**
 * Centralized Rate Limiters
 *
 * Pre-configured rate limiters for various API endpoints.
 * All limiters use fail-closed behavior for security.
 *
 * @module lib/rateLimiters
 */

import { RateLimiter } from './rateLimiter';

// ============================================================================
// PAYMENT RATE LIMITERS
// ============================================================================

/**
 * SECURITY: Pre-body-parsing rate limiter for payment endpoints
 *
 * This limiter runs BEFORE body parsing to prevent DoS attacks
 * where an attacker sends large payloads that consume resources
 * before the rate limit kicks in.
 *
 * Uses IP-only keying (no user ID since body isn't parsed yet)
 * More lenient than post-body limiter since it's less specific
 *
 * Allows 30 requests per minute per IP
 */
export const paymentPreBodyLimiter = new RateLimiter({
  endpoint: 'payment_pre_body',
  maxRequests: 30,
  windowMs: 60 * 1000, // 1 minute
  failClosed: true,
  circuitBreakerThreshold: 10,
  circuitBreakerResetMs: 30 * 1000,
});

/**
 * Rate limiter for payment creation endpoints
 * Allows 10 payment attempts per minute per user/IP
 * Runs AFTER body parsing for user-specific limiting
 */
export const paymentCreationLimiter = new RateLimiter({
  endpoint: 'payment_create',
  maxRequests: 10,
  windowMs: 60 * 1000, // 1 minute
  failClosed: true,
  circuitBreakerThreshold: 5,
  circuitBreakerResetMs: 30 * 1000,
});

/**
 * Rate limiter for withdrawal requests
 * Allows 5 withdrawal attempts per 5 minutes per user
 * More restrictive due to financial sensitivity
 */
export const withdrawalLimiter = new RateLimiter({
  endpoint: 'withdrawal_request',
  maxRequests: 5,
  windowMs: 5 * 60 * 1000, // 5 minutes
  failClosed: true,
  circuitBreakerThreshold: 5,
  circuitBreakerResetMs: 60 * 1000,
});

/**
 * Rate limiter for balance check operations
 * Allows 30 requests per minute
 */
export const balanceCheckLimiter = new RateLimiter({
  endpoint: 'balance_check',
  maxRequests: 30,
  windowMs: 60 * 1000, // 1 minute
  failClosed: true,
  circuitBreakerThreshold: 5,
  circuitBreakerResetMs: 30 * 1000,
});

// ============================================================================
// DRAFT RATE LIMITERS
// ============================================================================

/**
 * Rate limiter for draft pick submissions
 * Allows 60 picks per minute (1 per second average)
 * Higher limit to accommodate fast drafts
 */
export const draftPickLimiter = new RateLimiter({
  endpoint: 'draft_pick',
  maxRequests: 60,
  windowMs: 60 * 1000, // 1 minute
  failClosed: true,
  circuitBreakerThreshold: 5,
  circuitBreakerResetMs: 30 * 1000,
});

/**
 * Rate limiter for draft room joins
 * Allows 20 room joins per minute
 */
export const draftRoomJoinLimiter = new RateLimiter({
  endpoint: 'draft_room_join',
  maxRequests: 20,
  windowMs: 60 * 1000, // 1 minute
  failClosed: true,
  circuitBreakerThreshold: 5,
  circuitBreakerResetMs: 30 * 1000,
});

// ============================================================================
// WEBHOOK RATE LIMITERS
// ============================================================================

/**
 * Rate limiter for failed webhook verification attempts
 * Prevents brute force attacks on webhook endpoints
 */
export const webhookFailedVerificationLimiter = new RateLimiter({
  endpoint: 'webhook_failed_verification',
  maxRequests: 10,
  windowMs: 60 * 1000, // 1 minute
  failClosed: true,
  circuitBreakerThreshold: 5,
  circuitBreakerResetMs: 30 * 1000,
});

// ============================================================================
// API RATE LIMITERS
// ============================================================================

/**
 * Rate limiter for tournament entry
 * Allows 30 entries per minute
 */
export const tournamentEntryLimiter = new RateLimiter({
  endpoint: 'tournament_entry',
  maxRequests: 30,
  windowMs: 60 * 1000, // 1 minute
  failClosed: true,
  circuitBreakerThreshold: 5,
  circuitBreakerResetMs: 30 * 1000,
});

/**
 * Rate limiter for sensitive account operations
 * Allows 10 operations per 5 minutes
 */
export const accountOperationLimiter = new RateLimiter({
  endpoint: 'account_operation',
  maxRequests: 10,
  windowMs: 5 * 60 * 1000, // 5 minutes
  failClosed: true,
  circuitBreakerThreshold: 5,
  circuitBreakerResetMs: 60 * 1000,
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get user identifier for rate limiting
 * Prefers user ID, falls back to IP address
 */
export function getRateLimitKey(
  userId: string | null | undefined,
  ip: string | undefined
): string {
  if (userId) {
    return `user_${userId}`;
  }
  return `ip_${ip || 'unknown'}`;
}

/**
 * Extract client IP from request headers
 */
export function getClientIp(headers: Record<string, string | string[] | undefined>): string {
  const forwardedFor = headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string') {
    return forwardedFor.split(',')[0]?.trim() || 'unknown';
  }
  if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
    return forwardedFor[0]?.split(',')[0]?.trim() || 'unknown';
  }
  return 'unknown';
}
