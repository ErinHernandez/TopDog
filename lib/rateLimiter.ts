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
import { serverLogger } from './logger/serverLogger';

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
  /**
   * SECURITY: Fail-closed behavior on errors (default: true)
   * When true, requests are rejected if rate limiter fails
   * When false, requests are allowed (fail-open - NOT RECOMMENDED)
   */
  failClosed?: boolean;
  /**
   * Number of consecutive failures before circuit breaker opens
   * When circuit is open, requests use cached/default behavior
   * (default: 5)
   */
  circuitBreakerThreshold?: number;
  /**
   * How long circuit stays open before trying again (default: 30 seconds)
   */
  circuitBreakerResetMs?: number;
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
  /** Maximum requests allowed in window (for logging/debugging) */
  maxRequests?: number;
  /** Internal flag: true if rate limiter failed and denied request (fail-closed) */
  _failedClosed?: boolean;
  /** Internal flag: true if rate limiter failed and allowed request (fail-open - deprecated) */
  _failedOpen?: boolean;
  /** Internal flag: true if circuit breaker is open */
  _circuitOpen?: boolean;
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
// CIRCUIT BREAKER STATE
// ============================================================================

interface CircuitBreakerState {
  consecutiveFailures: number;
  lastFailureAt: number;
  isOpen: boolean;
}

// Global circuit breaker state per endpoint (in-memory for this instance)
const circuitBreakerStates = new Map<string, CircuitBreakerState>();

// ============================================================================
// RATE LIMITER CLASS
// ============================================================================

export class RateLimiter {
  public config: Required<RateLimitConfig> & {
    failClosed: boolean;
    circuitBreakerThreshold: number;
    circuitBreakerResetMs: number;
  };
  private collection: CollectionReference;

  constructor(config: RateLimitConfig) {
    this.config = {
      maxRequests: config.maxRequests,
      windowMs: config.windowMs,
      endpoint: config.endpoint,
      cleanupIntervalMs: config.cleanupIntervalMs || 60 * 60 * 1000, // 1 hour default
      // SECURITY: Default to fail-closed behavior
      failClosed: config.failClosed !== false, // true unless explicitly set to false
      circuitBreakerThreshold: config.circuitBreakerThreshold || 5,
      circuitBreakerResetMs: config.circuitBreakerResetMs || 30 * 1000, // 30 seconds
    };

    this.collection = collection(db, 'rate_limits');

    // Initialize circuit breaker state for this endpoint
    if (!circuitBreakerStates.has(this.config.endpoint)) {
      circuitBreakerStates.set(this.config.endpoint, {
        consecutiveFailures: 0,
        lastFailureAt: 0,
        isOpen: false,
      });
    }
  }

  /**
   * Get circuit breaker state for this endpoint
   */
  private getCircuitState(): CircuitBreakerState {
    return circuitBreakerStates.get(this.config.endpoint) || {
      consecutiveFailures: 0,
      lastFailureAt: 0,
      isOpen: false,
    };
  }

  /**
   * Record a successful operation (reset circuit breaker)
   */
  private recordSuccess(): void {
    const state = this.getCircuitState();
    state.consecutiveFailures = 0;
    state.isOpen = false;
    circuitBreakerStates.set(this.config.endpoint, state);
  }

  /**
   * Record a failure (increment circuit breaker counter)
   */
  private recordFailure(): void {
    const state = this.getCircuitState();
    state.consecutiveFailures++;
    state.lastFailureAt = Date.now();

    if (state.consecutiveFailures >= this.config.circuitBreakerThreshold) {
      state.isOpen = true;
      serverLogger.warn('Rate limiter circuit breaker opened', null, {
        endpoint: this.config.endpoint,
        consecutiveFailures: state.consecutiveFailures,
        threshold: this.config.circuitBreakerThreshold,
      });
    }

    circuitBreakerStates.set(this.config.endpoint, state);
  }

  /**
   * Check if circuit breaker should allow a test request
   */
  private shouldAllowCircuitTest(): boolean {
    const state = this.getCircuitState();
    if (!state.isOpen) return true;

    // Check if enough time has passed to try again
    const timeSinceLastFailure = Date.now() - state.lastFailureAt;
    return timeSinceLastFailure >= this.config.circuitBreakerResetMs;
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

    // Check circuit breaker state
    const circuitState = this.getCircuitState();
    if (circuitState.isOpen && !this.shouldAllowCircuitTest()) {
      serverLogger.info('Rate limiter circuit breaker open, using fail-closed', {
        endpoint: this.config.endpoint,
        clientId,
        consecutiveFailures: circuitState.consecutiveFailures,
      });

      // Circuit is open - use fail-closed behavior without hitting Firestore
      if (this.config.failClosed) {
        return {
          allowed: false,
          remaining: 0,
          retryAfterMs: this.config.circuitBreakerResetMs,
          resetAt: now + this.config.circuitBreakerResetMs,
          maxRequests: this.config.maxRequests,
          _circuitOpen: true,
          _failedClosed: true,
        };
      }
    }

    const rateLimitRef = doc(this.collection, key);

    try {
      // Use transaction for atomic increment
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
            maxRequests: this.config.maxRequests,
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
            maxRequests: this.config.maxRequests,
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
            maxRequests: this.config.maxRequests,
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
          maxRequests: this.config.maxRequests,
        };
      });

      // Record success for circuit breaker
      this.recordSuccess();

      return result;
    } catch (error) {
      serverLogger.error('Rate limiter error', error instanceof Error ? error : new Error(String(error)), {
        endpoint: this.config.endpoint,
        failClosed: this.config.failClosed,
        clientId,
      });

      // Record failure for circuit breaker
      this.recordFailure();

      // Track rate limiter failures for alerting
      if (typeof window === 'undefined') {
        // Server-side: report to Sentry
        try {
           
          const Sentry = require('@sentry/nextjs');
          Sentry.captureException(error, {
            tags: {
              component: 'rate_limiter',
              endpoint: this.config.endpoint,
              action: this.config.failClosed ? 'fail_closed' : 'fail_open',
            },
            level: 'error', // Elevated from warning since this affects security
          });
        } catch (sentryError) {
          // Sentry not available, continue
        }
      }

      // SECURITY: Default to fail-closed behavior (reject requests on error)
      // This prevents attackers from bypassing rate limits by causing errors
      if (this.config.failClosed) {
        serverLogger.warn('Rate limiter fail-closed: rejecting request due to error', null, {
          endpoint: this.config.endpoint,
          clientId,
        });

        return {
          allowed: false,
          remaining: 0,
          retryAfterMs: 60 * 1000, // Suggest retry in 1 minute
          resetAt: now + 60 * 1000,
          maxRequests: this.config.maxRequests,
          _failedClosed: true,
        };
      }

      // DEPRECATED: Fail-open behavior (only if explicitly configured)
      // WARNING: This allows attackers to bypass rate limiting by causing errors
      serverLogger.warn('DEPRECATED: Rate limiter fail-open behavior used', null, {
        endpoint: this.config.endpoint,
        clientId,
        recommendation: 'Set failClosed: true in RateLimitConfig',
      });

      return {
        allowed: true,
        remaining: this.config.maxRequests,
        retryAfterMs: null,
        resetAt: now + this.config.windowMs,
        maxRequests: this.config.maxRequests,
        _failedOpen: true,
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
          maxRequests: this.config.maxRequests,
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
          maxRequests: this.config.maxRequests,
        };
      }

      const currentCount = data.count || 0;
      const remaining = Math.max(0, this.config.maxRequests - currentCount);

      return {
        allowed: remaining > 0,
        remaining,
        retryAfterMs: remaining > 0 ? null : windowEndMs - now,
        resetAt: windowEndMs,
        maxRequests: this.config.maxRequests,
      };
    } catch (error) {
      serverLogger.error('Rate limiter status error', error instanceof Error ? error : new Error(String(error)));
      return {
        allowed: true,
        remaining: this.config.maxRequests,
        retryAfterMs: null,
        resetAt: now + this.config.windowMs,
        maxRequests: this.config.maxRequests,
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
      serverLogger.error('Rate limiter cleanup error', error instanceof Error ? error : new Error(String(error)));
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
