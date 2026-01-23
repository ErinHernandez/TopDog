/**
 * Rate limiters for admin integrity endpoints
 * Uses the existing RateLimiter class from lib/rateLimiter.js
 */

import { RateLimiter } from '@/lib/rateLimiter';

/**
 * Rate limiter for admin read operations (viewing drafts, pairs)
 * 100 requests per minute per IP
 */
export const adminReadLimiter = new RateLimiter({
  maxRequests: 100,
  windowMs: 60 * 1000, // 1 minute
  endpoint: 'admin-integrity-read',
});

/**
 * Rate limiter for admin write operations (recording actions)
 * 20 requests per minute per IP
 */
export const adminWriteLimiter = new RateLimiter({
  maxRequests: 20,
  windowMs: 60 * 1000, // 1 minute
  endpoint: 'admin-integrity-write',
});
