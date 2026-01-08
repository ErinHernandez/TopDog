/**
 * Rate Limiting Configuration
 * 
 * Centralized rate limiting configuration for all API endpoints.
 * Provides consistent rate limits across the application.
 */

import { RateLimiter } from './rateLimiter';

// ============================================================================
// RATE LIMIT CONFIGURATIONS
// ============================================================================

/**
 * Rate limit configurations by endpoint type
 */
export const RATE_LIMIT_CONFIGS = {
  // Authentication endpoints - strict limits
  auth: {
    signup: {
      maxRequests: 3,
      windowMs: 60 * 60 * 1000, // 1 hour
      endpoint: 'signup',
    },
    usernameCheck: {
      maxRequests: 30,
      windowMs: 60 * 1000, // 1 minute
      endpoint: 'username_check',
    },
    usernameChange: {
      maxRequests: 3,
      windowMs: 60 * 60 * 1000, // 1 hour
      endpoint: 'username_change',
    },
    login: {
      maxRequests: 5,
      windowMs: 15 * 60 * 1000, // 15 minutes
      endpoint: 'login',
    },
  },
  
  // Payment endpoints - moderate limits
  payment: {
    createPaymentIntent: {
      maxRequests: 20,
      windowMs: 60 * 1000, // 1 minute
      endpoint: 'payment_intent',
    },
    initializePayment: {
      maxRequests: 20,
      windowMs: 60 * 1000, // 1 minute
      endpoint: 'payment_initialize',
    },
    paymentMethods: {
      maxRequests: 30,
      windowMs: 60 * 1000, // 1 minute
      endpoint: 'payment_methods',
    },
  },
  
  // Analytics - higher limits
  analytics: {
    track: {
      maxRequests: 100,
      windowMs: 60 * 1000, // 1 minute
      endpoint: 'analytics',
    },
  },
  
  // Data export - moderate limits
  export: {
    data: {
      maxRequests: 10,
      windowMs: 60 * 1000, // 1 minute
      endpoint: 'export',
    },
  },
  
  // General API - default limits
  default: {
    maxRequests: 60,
    windowMs: 60 * 1000, // 1 minute
    endpoint: 'api',
  },
};

/**
 * Get rate limiter for an endpoint
 * @param {string} category - Category (auth, payment, analytics, etc.)
 * @param {string} endpoint - Endpoint name
 * @returns {RateLimiter} Rate limiter instance
 */
export function getRateLimiter(category, endpoint) {
  const config = RATE_LIMIT_CONFIGS[category]?.[endpoint];
  
  if (!config) {
    // Use default configuration
    const defaultConfig = RATE_LIMIT_CONFIGS.default;
    return new RateLimiter(defaultConfig);
  }
  
  return new RateLimiter(config);
}

/**
 * Create rate limiter for authentication endpoints
 */
export function createAuthRateLimiter(endpoint) {
  return getRateLimiter('auth', endpoint);
}

/**
 * Create rate limiter for payment endpoints
 */
export function createPaymentRateLimiter(endpoint) {
  return getRateLimiter('payment', endpoint);
}

/**
 * Create rate limiter for analytics endpoints
 */
export function createAnalyticsRateLimiter() {
  return getRateLimiter('analytics', 'track');
}

/**
 * Create rate limiter for export endpoints
 */
export function createExportRateLimiter() {
  return getRateLimiter('export', 'data');
}

/**
 * Apply rate limiting to a handler
 * @param {Function} handler - API route handler
 * @param {RateLimiter} limiter - Rate limiter instance
 * @returns {Function} Wrapped handler with rate limiting
 */
export function withRateLimit(handler, limiter) {
  return async (req, res) => {
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
    
    return handler(req, res);
  };
}

export default {
  RATE_LIMIT_CONFIGS,
  getRateLimiter,
  createAuthRateLimiter,
  createPaymentRateLimiter,
  createAnalyticsRateLimiter,
  createExportRateLimiter,
  withRateLimit,
};

