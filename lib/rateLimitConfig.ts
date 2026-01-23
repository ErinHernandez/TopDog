/**
 * Rate Limiting Configuration
 * 
 * Centralized rate limiting configuration for all API endpoints.
 * Provides consistent rate limits across the application.
 */

import { RateLimiter } from './rateLimiter';
import type { NextApiRequest, NextApiResponse } from 'next';

// ============================================================================
// TYPES
// ============================================================================

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  endpoint: string;
}

export interface RateLimitConfigs {
  auth: {
    signup: RateLimitConfig;
    usernameCheck: RateLimitConfig;
    usernameChange: RateLimitConfig;
    login: RateLimitConfig;
  };
  payment: {
    createPaymentIntent: RateLimitConfig;
    initializePayment: RateLimitConfig;
    paymentMethods: RateLimitConfig;
  };
  analytics: {
    track: RateLimitConfig;
  };
  export: {
    data: RateLimitConfig;
  };
  default: RateLimitConfig;
}

export type RateLimitCategory = keyof RateLimitConfigs;
export type AuthEndpoint = keyof RateLimitConfigs['auth'];
export type PaymentEndpoint = keyof RateLimitConfigs['payment'];

// ============================================================================
// RATE LIMIT CONFIGURATIONS
// ============================================================================

/**
 * Rate limit configurations by endpoint type
 */
export const RATE_LIMIT_CONFIGS: RateLimitConfigs = {
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

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get rate limiter for an endpoint
 */
export function getRateLimiter(
  category: RateLimitCategory,
  endpoint: string
): RateLimiter {
  const categoryConfig = RATE_LIMIT_CONFIGS[category] as Record<string, RateLimitConfig> | undefined;
  const config = categoryConfig?.[endpoint];
  
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
export function createAuthRateLimiter(endpoint: AuthEndpoint): RateLimiter {
  return getRateLimiter('auth', endpoint);
}

/**
 * Create rate limiter for payment endpoints
 */
export function createPaymentRateLimiter(endpoint: PaymentEndpoint): RateLimiter {
  return getRateLimiter('payment', endpoint);
}

/**
 * Create rate limiter for analytics endpoints
 */
export function createAnalyticsRateLimiter(): RateLimiter {
  return getRateLimiter('analytics', 'track');
}

/**
 * Create rate limiter for export endpoints
 */
export function createExportRateLimiter(): RateLimiter {
  return getRateLimiter('export', 'data');
}

/**
 * Apply rate limiting to a handler
 */
export function withRateLimit<T = unknown>(
  handler: (req: NextApiRequest, res: NextApiResponse<T>) => Promise<unknown> | unknown,
  limiter: RateLimiter
): (req: NextApiRequest, res: NextApiResponse<T>) => Promise<unknown> {
  return async (req: NextApiRequest, res: NextApiResponse<T>) => {
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
        retryAfter: result.retryAfterMs ? Math.ceil(result.retryAfterMs / 1000) : 60, // seconds
      } as T);
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
