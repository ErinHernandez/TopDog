/**
 * Server-Side Rate Limiter
 * 
 * Firestore-based rate limiting for API endpoints.
 * Uses sliding window algorithm with atomic counter increments.
 * 
 * @example
 * ```js
 * const limiter = new RateLimiter({
 *   maxRequests: 30,
 *   windowMs: 60 * 1000, // 1 minute
 *   endpoint: 'username_check'
 * });
 * 
 * const result = await limiter.check(req);
 * if (!result.allowed) {
 *   return res.status(429).json({ error: 'Rate limit exceeded' });
 * }
 * ```
 */

import { 
  getFirestore,
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  runTransaction,
  serverTimestamp,
  Timestamp,
  query,
  where,
  getDocs,
  deleteDoc
} from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';

// Initialize Firebase if not already initialized
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

// ============================================================================
// TYPES
// ============================================================================

/**
 * Rate limit configuration
 * @typedef {Object} RateLimitConfig
 * @property {number} maxRequests - Maximum requests allowed in window
 * @property {number} windowMs - Time window in milliseconds
 * @property {string} endpoint - Endpoint identifier (e.g., 'username_check')
 * @property {number} [cleanupIntervalMs] - How often to clean up expired entries (default: 1 hour)
 */

/**
 * Rate limit check result
 * @typedef {Object} RateLimitResult
 * @property {boolean} allowed - Whether request is allowed
 * @property {number} remaining - Remaining requests in current window
 * @property {number} retryAfterMs - Milliseconds until window resets (if rate limited)
 * @property {number} resetAt - Timestamp when window resets
 */

// ============================================================================
// RATE LIMITER CLASS
// ============================================================================

export class RateLimiter {
  constructor(config) {
    this.config = {
      maxRequests: config.maxRequests,
      windowMs: config.windowMs,
      endpoint: config.endpoint,
      cleanupIntervalMs: config.cleanupIntervalMs || 60 * 60 * 1000, // 1 hour default
    };
    
    this.collection = collection(db, 'rate_limits');
  }

  /**
   * Get client identifier from request
   * @param {Object} req - Next.js request object
   * @returns {string} Client identifier (IP address)
   */
  getClientId(req) {
    // Try to get IP from headers (Vercel/proxy)
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      const ips = typeof forwarded === 'string' ? forwarded.split(',') : forwarded;
      return ips[0]?.trim() || 'unknown';
    }
    
    // Fallback to socket remote address
    return req.socket?.remoteAddress || 'unknown';
  }

  /**
   * Generate rate limit key
   * @param {string} clientId - Client identifier
   * @returns {string} Rate limit key
   */
  getRateLimitKey(clientId) {
    return `ip:${clientId}:${this.config.endpoint}`;
  }

  /**
   * Check if request is allowed and increment counter
   * @param {Object} req - Next.js request object
   * @returns {Promise<RateLimitResult>}
   */
  async check(req) {
    const clientId = this.getClientId(req);
    const key = this.getRateLimitKey(clientId);
    const now = Date.now();
    const windowEnd = now + this.config.windowMs;
    
    const rateLimitRef = doc(this.collection, key);
    
    try {
      // Use transaction for atomic increment
      const result = await runTransaction(db, async (transaction) => {
        const rateLimitDoc = await transaction.get(rateLimitRef);
        const data = rateLimitDoc.exists() ? rateLimitDoc.data() : null;
        
        // If no existing entry, create new one
        if (!data) {
          const newData = {
            key,
            count: 1,
            windowStart: Timestamp.fromMillis(now),
            windowEnd: Timestamp.fromMillis(windowEnd),
            lastRequest: Timestamp.fromMillis(now),
            ttl: Timestamp.fromMillis(now + this.config.cleanupIntervalMs),
          };
          
          transaction.set(rateLimitRef, newData);
          
          return {
            allowed: true,
            remaining: this.config.maxRequests - 1,
            retryAfterMs: null,
            resetAt: windowEnd,
          };
        }
        
        // Check if window has expired
        const windowEndMs = data.windowEnd?.toMillis?.() || data.windowEnd;
        if (now > windowEndMs) {
          // Reset window
          const newData = {
            key,
            count: 1,
            windowStart: Timestamp.fromMillis(now),
            windowEnd: Timestamp.fromMillis(windowEnd),
            lastRequest: Timestamp.fromMillis(now),
            ttl: Timestamp.fromMillis(now + this.config.cleanupIntervalMs),
          };
          
          transaction.set(rateLimitRef, newData);
          
          return {
            allowed: true,
            remaining: this.config.maxRequests - 1,
            retryAfterMs: null,
            resetAt: windowEnd,
          };
        }
        
        // Check if limit exceeded
        const currentCount = data.count || 0;
        if (currentCount >= this.config.maxRequests) {
          return {
            allowed: false,
            remaining: 0,
            retryAfterMs: windowEndMs - now,
            resetAt: windowEndMs,
          };
        }
        
        // Increment counter
        const newCount = currentCount + 1;
        transaction.update(rateLimitRef, {
          count: newCount,
          lastRequest: Timestamp.fromMillis(now),
        });
        
        return {
          allowed: true,
          remaining: this.config.maxRequests - newCount,
          retryAfterMs: null,
          resetAt: windowEndMs,
        };
      });
      
      return result;
    } catch (error) {
      console.error('Rate limiter error:', error);
      
      // On error, allow request (fail open for availability)
      // But log the error for monitoring
      return {
        allowed: true,
        remaining: this.config.maxRequests,
        retryAfterMs: null,
        resetAt: now + this.config.windowMs,
      };
    }
  }

  /**
   * Get current rate limit status without incrementing
   * @param {Object} req - Next.js request object
   * @returns {Promise<RateLimitResult>}
   */
  async status(req) {
    const clientId = this.getClientId(req);
    const key = this.getRateLimitKey(clientId);
    const now = Date.now();
    
    try {
      const rateLimitRef = doc(this.collection, key);
      const rateLimitDoc = await getDoc(rateLimitRef);
      
      if (!rateLimitDoc.exists()) {
        return {
          allowed: true,
          remaining: this.config.maxRequests,
          retryAfterMs: null,
          resetAt: now + this.config.windowMs,
        };
      }
      
      const data = rateLimitDoc.data();
      const windowEndMs = data.windowEnd?.toMillis?.() || data.windowEnd;
      
      // Check if window expired
      if (now > windowEndMs) {
        return {
          allowed: true,
          remaining: this.config.maxRequests,
          retryAfterMs: null,
          resetAt: now + this.config.windowMs,
        };
      }
      
      const currentCount = data.count || 0;
      const remaining = Math.max(0, this.config.maxRequests - currentCount);
      
      return {
        allowed: remaining > 0,
        remaining,
        retryAfterMs: remaining > 0 ? null : windowEndMs - now,
        resetAt: windowEndMs,
      };
    } catch (error) {
      console.error('Rate limiter status error:', error);
      return {
        allowed: true,
        remaining: this.config.maxRequests,
        retryAfterMs: null,
        resetAt: now + this.config.windowMs,
      };
    }
  }

  /**
   * Clean up expired rate limit entries
   * Should be called periodically (e.g., via cron job)
   * @returns {Promise<{ deleted: number }>}
   */
  async cleanup() {
    try {
      const now = Timestamp.now();
      const expiredQuery = query(
        this.collection,
        where('ttl', '<', now)
      );
      
      const snapshot = await getDocs(expiredQuery);
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      return { deleted: snapshot.docs.length };
    } catch (error) {
      console.error('Rate limiter cleanup error:', error);
      return { deleted: 0 };
    }
  }
}

// ============================================================================
// PREDEFINED RATE LIMITERS
// ============================================================================

/**
 * Rate limiter for username availability checks
 * 30 requests per minute per IP
 */
export function createUsernameCheckLimiter() {
  return new RateLimiter({
    maxRequests: 30,
    windowMs: 60 * 1000, // 1 minute
    endpoint: 'username_check',
  });
}

/**
 * Rate limiter for signup attempts
 * 3 requests per hour per IP
 */
export function createSignupLimiter() {
  return new RateLimiter({
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    endpoint: 'signup',
  });
}

// ============================================================================
// MIDDLEWARE HELPER
// ============================================================================

/**
 * Rate limiting middleware for Next.js API routes
 * @param {RateLimiter} limiter - Rate limiter instance
 * @returns {Function} Middleware function
 */
export function rateLimitMiddleware(limiter) {
  return async (req, res, next) => {
    const result = await limiter.check(req);
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', limiter.config.maxRequests);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', Math.floor(result.resetAt / 1000));
    
    if (!result.allowed) {
      return res.status(429).json({
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(result.retryAfterMs / 1000), // seconds
      });
    }
    
    // Call next middleware/handler
    if (next) {
      return next();
    }
    
    return result;
  };
}

export default RateLimiter;

