/**
 * Server-Side Rate Limiter
 * 
 * Firestore-based rate limiting for API endpoints.
 * Uses sliding window algorithm with atomic counter increments.
 * 
 * @example
 * ```ts
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
  deleteDoc,
  type Firestore,
  type CollectionReference,
  type DocumentReference,
} from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { FirebaseApp } from 'firebase/app';

// Initialize Firebase if not already initialized
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db: Firestore = getFirestore(app);

// ============================================================================
// TYPES
// ============================================================================

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /** Maximum requests allowed in window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Endpoint identifier (e.g., 'username_check') */
  endpoint: string;
  /** How often to clean up expired entries (default: 1 hour) */
  cleanupIntervalMs?: number;
}

/**
 * Rate limit check result
 */
export interface RateLimitResult {
  /** Whether request is allowed */
  allowed: boolean;
  /** Remaining requests in current window */
  remaining: number;
  /** Milliseconds until window resets (if rate limited) */
  retryAfterMs: number | null;
  /** Timestamp when window resets */
  resetAt: number;
  /** Internal flag: true if rate limiter failed and allowed request */
  _failedOpen?: boolean;
}

/**
 * Rate limit document data in Firestore
 */
interface RateLimitDocument {
  key: string;
  count: number;
  windowStart: Timestamp;
  windowEnd: Timestamp;
  lastRequest: Timestamp;
  ttl: Timestamp;
}

/**
 * Cleanup result
 */
export interface CleanupResult {
  deleted: number;
}

// ============================================================================
// RATE LIMITER CLASS
// ============================================================================

export class RateLimiter {
  public config: Required<RateLimitConfig>;
  private collection: CollectionReference;

  constructor(config: RateLimitConfig) {
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
   * @param {NextApiRequest} req - Next.js request object
   * @returns {string} Client identifier (IP address)
   */
  getClientId(req: NextApiRequest): string {
    // Try to get IP from headers (Vercel/proxy)
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      const ips = typeof forwarded === 'string' ? forwarded.split(',') : forwarded;
      return ips[0]?.trim() || 'unknown';
    }
    
    // Fallback to socket remote address
    return (req.socket as { remoteAddress?: string })?.remoteAddress || 'unknown';
  }

  /**
   * Generate rate limit key
   * @param {string} clientId - Client identifier
   * @returns {string} Rate limit key
   */
  getRateLimitKey(clientId: string): string {
    return `ip:${clientId}:${this.config.endpoint}`;
  }

  /**
   * Check if request is allowed and increment counter
   * @param {NextApiRequest} req - Next.js request object
   * @returns {Promise<RateLimitResult>}
   */
  async check(req: NextApiRequest): Promise<RateLimitResult> {
    const clientId = this.getClientId(req);
    const key = this.getRateLimitKey(clientId);
    const now = Date.now();
    const windowEnd = now + this.config.windowMs;
    
    const rateLimitRef = doc(this.collection, key);
    
    try {
      // Use transaction for atomic increment
      const result = await runTransaction(db, async (transaction) => {
        const rateLimitDoc = await transaction.get(rateLimitRef);
        const data = rateLimitDoc.exists() ? (rateLimitDoc.data() as RateLimitDocument) : null;
        
        // If no existing entry, create new one
        if (!data) {
          const newData: RateLimitDocument = {
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
        const windowEndMs = data.windowEnd?.toMillis?.() || (data.windowEnd as unknown as number);
        if (now > windowEndMs) {
          // Reset window
          const newData: RateLimitDocument = {
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
      // But log the error for monitoring and alerting
      
      // Track rate limiter failures for alerting
      if (typeof window === 'undefined') {
        // Server-side: report to Sentry
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const Sentry = require('@sentry/nextjs');
          Sentry.captureException(error, {
            tags: {
              component: 'rate_limiter',
              endpoint: this.config.endpoint,
              action: 'fail_open'
            },
            level: 'warning'
          });
        } catch (sentryError) {
          // Sentry not available, continue
        }
      }
      
      return {
        allowed: true,
        remaining: this.config.maxRequests,
        retryAfterMs: null,
        resetAt: now + this.config.windowMs,
        _failedOpen: true, // Flag for downstream tracking
      };
    }
  }

  /**
   * Get current rate limit status without incrementing
   * @param {NextApiRequest} req - Next.js request object
   * @returns {Promise<RateLimitResult>}
   */
  async status(req: NextApiRequest): Promise<RateLimitResult> {
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
      
      const data = rateLimitDoc.data() as RateLimitDocument;
      const windowEndMs = data.windowEnd?.toMillis?.() || (data.windowEnd as unknown as number);
      
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
   * @returns {Promise<CleanupResult>}
   */
  async cleanup(): Promise<CleanupResult> {
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
export function createUsernameCheckLimiter(): RateLimiter {
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
export function createSignupLimiter(): RateLimiter {
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
 * Next middleware function type
 */
type NextFunction = () => void | Promise<void>;

/**
 * Rate limiting middleware for Next.js API routes
 * @param {RateLimiter} limiter - Rate limiter instance
 * @returns {Function} Middleware function
 */
export function rateLimitMiddleware(limiter: RateLimiter) {
  return async (
    req: NextApiRequest, 
    res: NextApiResponse, 
    next?: NextFunction
  ): Promise<RateLimitResult | void> => {
    const result = await limiter.check(req);
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', limiter.config.maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
    res.setHeader('X-RateLimit-Reset', Math.floor(result.resetAt / 1000).toString());
    
    if (!result.allowed) {
      res.status(429).json({
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((result.retryAfterMs || 0) / 1000), // seconds
      });
      return;
    }
    
    // Call next middleware/handler
    if (next) {
      return next();
    }
    
    return result;
  };
}

export default RateLimiter;
