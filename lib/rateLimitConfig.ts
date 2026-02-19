/**
 * Rate Limiting Configuration
 *
 * Centralized rate limiting configuration for all API endpoints.
 * Provides consistent rate limits across the application.
 *
 * ## Configuration via Environment Variables
 *
 * All rate limits can be overridden via environment variables:
 * - RATE_LIMIT_AUTH_SIGNUP_MAX=3
 * - RATE_LIMIT_AUTH_SIGNUP_WINDOW_MS=3600000
 * - RATE_LIMIT_PAYMENT_PAYPAL_WITHDRAW_MAX=5
 * etc.
 *
 * ## Rationale for Default Values
 *
 * ### Authentication (auth.*)
 * - signup: 3/hour - Account creation is rare; prevents mass registration attacks
 * - usernameCheck: 30/minute - Allows rapid availability checking during signup
 * - usernameChange: 3/hour - Username changes should be infrequent
 * - login: 5/15min - Standard brute-force protection
 *
 * ### Payments (payment.*)
 * - createPaymentIntent: 20/minute - Allows retries but prevents abuse
 * - initializePayment: 20/minute - Same as payment intent
 * - paymentMethods: 30/minute - Allows browsing saved methods
 * - paypalWithdraw: 5/hour - High-risk financial operation; low limit prevents abuse
 * - xenditDisbursement: 10/hour - Higher than PayPal because Southeast Asian markets
 *   have more frequent, smaller transactions; still limited to prevent abuse
 *
 * ### Analytics (analytics.*)
 * - track: 100/minute - High volume expected; allows batching
 *
 * ### Export (export.*)
 * - data: 10/minute - Resource-intensive operations; moderate limit
 *
 * @module lib/rateLimitConfig
 */

import type { NextApiRequest, NextApiResponse } from 'next';

import { createErrorResponse, ErrorType } from './apiErrorHandler';
import { RateLimiter } from './rateLimiter';

// ============================================================================
// TYPES
// ============================================================================

export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  maxRequests: number;
  /** Window duration in milliseconds */
  windowMs: number;
  /** Endpoint identifier for logging */
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
    paypalWithdraw: RateLimitConfig;
    xenditDisbursement: RateLimitConfig;
    stripePayout: RateLimitConfig;
    paymongoPayout: RateLimitConfig;
    paystackTransfer: RateLimitConfig;
    xenditVA: RateLimitConfig;
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
// ENVIRONMENT VARIABLE HELPERS
// ============================================================================

/**
 * Get a rate limit value from environment variable or use default
 */
function getEnvInt(key: string, defaultValue: number): number {
  const envValue = process.env[key];
  if (envValue) {
    const parsed = parseInt(envValue, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return defaultValue;
}

// ============================================================================
// DEFAULT VALUES (can be overridden via env vars)
// ============================================================================

const DEFAULTS = {
  // Auth
  AUTH_SIGNUP_MAX: 3,
  AUTH_SIGNUP_WINDOW_MS: 60 * 60 * 1000, // 1 hour
  AUTH_USERNAME_CHECK_MAX: 30,
  AUTH_USERNAME_CHECK_WINDOW_MS: 60 * 1000, // 1 minute
  AUTH_USERNAME_CHANGE_MAX: 3,
  AUTH_USERNAME_CHANGE_WINDOW_MS: 60 * 60 * 1000, // 1 hour
  AUTH_LOGIN_MAX: 5,
  AUTH_LOGIN_WINDOW_MS: 15 * 60 * 1000, // 15 minutes

  // Payment
  PAYMENT_INTENT_MAX: 20,
  PAYMENT_INTENT_WINDOW_MS: 60 * 1000, // 1 minute
  PAYMENT_INITIALIZE_MAX: 20,
  PAYMENT_INITIALIZE_WINDOW_MS: 60 * 1000, // 1 minute
  PAYMENT_METHODS_MAX: 30,
  PAYMENT_METHODS_WINDOW_MS: 60 * 1000, // 1 minute
  PAYPAL_WITHDRAW_MAX: 5,
  PAYPAL_WITHDRAW_WINDOW_MS: 60 * 60 * 1000, // 1 hour
  XENDIT_DISBURSEMENT_MAX: 10,
  XENDIT_DISBURSEMENT_WINDOW_MS: 60 * 60 * 1000, // 1 hour

  // Analytics
  ANALYTICS_TRACK_MAX: 100,
  ANALYTICS_TRACK_WINDOW_MS: 60 * 1000, // 1 minute

  // Export
  EXPORT_DATA_MAX: 10,
  EXPORT_DATA_WINDOW_MS: 60 * 1000, // 1 minute

  // Default
  DEFAULT_MAX: 60,
  DEFAULT_WINDOW_MS: 60 * 1000, // 1 minute
} as const;

// ============================================================================
// RATE LIMIT CONFIGURATIONS
// ============================================================================

/**
 * Rate limit configurations by endpoint type.
 * Values can be overridden via environment variables.
 */
export const RATE_LIMIT_CONFIGS: RateLimitConfigs = {
  // Authentication endpoints - strict limits to prevent brute force and abuse
  auth: {
    signup: {
      maxRequests: getEnvInt('RATE_LIMIT_AUTH_SIGNUP_MAX', DEFAULTS.AUTH_SIGNUP_MAX),
      windowMs: getEnvInt('RATE_LIMIT_AUTH_SIGNUP_WINDOW_MS', DEFAULTS.AUTH_SIGNUP_WINDOW_MS),
      endpoint: 'signup',
    },
    usernameCheck: {
      maxRequests: getEnvInt('RATE_LIMIT_AUTH_USERNAME_CHECK_MAX', DEFAULTS.AUTH_USERNAME_CHECK_MAX),
      windowMs: getEnvInt('RATE_LIMIT_AUTH_USERNAME_CHECK_WINDOW_MS', DEFAULTS.AUTH_USERNAME_CHECK_WINDOW_MS),
      endpoint: 'username_check',
    },
    usernameChange: {
      maxRequests: getEnvInt('RATE_LIMIT_AUTH_USERNAME_CHANGE_MAX', DEFAULTS.AUTH_USERNAME_CHANGE_MAX),
      windowMs: getEnvInt('RATE_LIMIT_AUTH_USERNAME_CHANGE_WINDOW_MS', DEFAULTS.AUTH_USERNAME_CHANGE_WINDOW_MS),
      endpoint: 'username_change',
    },
    login: {
      maxRequests: getEnvInt('RATE_LIMIT_AUTH_LOGIN_MAX', DEFAULTS.AUTH_LOGIN_MAX),
      windowMs: getEnvInt('RATE_LIMIT_AUTH_LOGIN_WINDOW_MS', DEFAULTS.AUTH_LOGIN_WINDOW_MS),
      endpoint: 'login',
    },
  },

  // Payment endpoints - moderate limits to allow retries but prevent abuse
  payment: {
    createPaymentIntent: {
      maxRequests: getEnvInt('RATE_LIMIT_PAYMENT_INTENT_MAX', DEFAULTS.PAYMENT_INTENT_MAX),
      windowMs: getEnvInt('RATE_LIMIT_PAYMENT_INTENT_WINDOW_MS', DEFAULTS.PAYMENT_INTENT_WINDOW_MS),
      endpoint: 'payment_intent',
    },
    initializePayment: {
      maxRequests: getEnvInt('RATE_LIMIT_PAYMENT_INITIALIZE_MAX', DEFAULTS.PAYMENT_INITIALIZE_MAX),
      windowMs: getEnvInt('RATE_LIMIT_PAYMENT_INITIALIZE_WINDOW_MS', DEFAULTS.PAYMENT_INITIALIZE_WINDOW_MS),
      endpoint: 'payment_initialize',
    },
    paymentMethods: {
      maxRequests: getEnvInt('RATE_LIMIT_PAYMENT_METHODS_MAX', DEFAULTS.PAYMENT_METHODS_MAX),
      windowMs: getEnvInt('RATE_LIMIT_PAYMENT_METHODS_WINDOW_MS', DEFAULTS.PAYMENT_METHODS_WINDOW_MS),
      endpoint: 'payment_methods',
    },
    /**
     * PayPal Withdrawal: 5 per hour
     *
     * Rationale: Withdrawals are high-risk financial operations.
     * - Prevents rapid fund extraction in case of account compromise
     * - Normal users rarely need more than a few withdrawals per day
     * - Can be increased for verified/trusted accounts via feature flags
     */
    paypalWithdraw: {
      maxRequests: getEnvInt('RATE_LIMIT_PAYPAL_WITHDRAW_MAX', DEFAULTS.PAYPAL_WITHDRAW_MAX),
      windowMs: getEnvInt('RATE_LIMIT_PAYPAL_WITHDRAW_WINDOW_MS', DEFAULTS.PAYPAL_WITHDRAW_WINDOW_MS),
      endpoint: 'paypal_withdraw',
    },
    /**
     * Xendit Disbursement: 10 per hour
     *
     * Rationale: Higher than PayPal (10 vs 5) because:
     * - Southeast Asian markets have more frequent, smaller transactions
     * - Mobile money and e-wallet top-ups are common
     * - Still limited to prevent abuse
     */
    xenditDisbursement: {
      maxRequests: getEnvInt('RATE_LIMIT_XENDIT_DISBURSEMENT_MAX', DEFAULTS.XENDIT_DISBURSEMENT_MAX),
      windowMs: getEnvInt('RATE_LIMIT_XENDIT_DISBURSEMENT_WINDOW_MS', DEFAULTS.XENDIT_DISBURSEMENT_WINDOW_MS),
      endpoint: 'xendit_disbursement',
    },
    /**
     * Stripe Payout: 5 per hour
     *
     * Rationale: Payouts are high-risk financial operations.
     */
    stripePayout: {
      maxRequests: getEnvInt('RATE_LIMIT_STRIPE_PAYOUT_MAX', 5),
      windowMs: getEnvInt('RATE_LIMIT_STRIPE_PAYOUT_WINDOW_MS', 60 * 60 * 1000),
      endpoint: 'stripe_payout',
    },
    /**
     * PayMongo Payout: 5 per hour
     *
     * Rationale: Payouts are high-risk financial operations.
     */
    paymongoPayout: {
      maxRequests: getEnvInt('RATE_LIMIT_PAYMONGO_PAYOUT_MAX', 5),
      windowMs: getEnvInt('RATE_LIMIT_PAYMONGO_PAYOUT_WINDOW_MS', 60 * 60 * 1000),
      endpoint: 'paymongo_payout',
    },
    /**
     * Paystack Transfer: 5 per hour
     *
     * Rationale: Transfers are high-risk financial operations.
     */
    paystackTransfer: {
      maxRequests: getEnvInt('RATE_LIMIT_PAYSTACK_TRANSFER_MAX', 5),
      windowMs: getEnvInt('RATE_LIMIT_PAYSTACK_TRANSFER_WINDOW_MS', 60 * 60 * 1000),
      endpoint: 'paystack_transfer',
    },
    /**
     * Xendit Virtual Account: 10 per hour
     *
     * Rationale: VA creation is a deposit initiation, higher limit than payouts.
     */
    xenditVA: {
      maxRequests: getEnvInt('RATE_LIMIT_XENDIT_VA_MAX', 10),
      windowMs: getEnvInt('RATE_LIMIT_XENDIT_VA_WINDOW_MS', 60 * 60 * 1000),
      endpoint: 'xendit_va',
    },
  },

  // Analytics - high limits for telemetry
  analytics: {
    track: {
      maxRequests: getEnvInt('RATE_LIMIT_ANALYTICS_TRACK_MAX', DEFAULTS.ANALYTICS_TRACK_MAX),
      windowMs: getEnvInt('RATE_LIMIT_ANALYTICS_TRACK_WINDOW_MS', DEFAULTS.ANALYTICS_TRACK_WINDOW_MS),
      endpoint: 'analytics',
    },
  },

  // Data export - moderate limits for resource-intensive operations
  export: {
    data: {
      maxRequests: getEnvInt('RATE_LIMIT_EXPORT_DATA_MAX', DEFAULTS.EXPORT_DATA_MAX),
      windowMs: getEnvInt('RATE_LIMIT_EXPORT_DATA_WINDOW_MS', DEFAULTS.EXPORT_DATA_WINDOW_MS),
      endpoint: 'export',
    },
  },

  // General API - default limits
  default: {
    maxRequests: getEnvInt('RATE_LIMIT_DEFAULT_MAX', DEFAULTS.DEFAULT_MAX),
    windowMs: getEnvInt('RATE_LIMIT_DEFAULT_WINDOW_MS', DEFAULTS.DEFAULT_WINDOW_MS),
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

    // Set rate limit headers (RFC 6585 / draft-ietf-httpapi-ratelimit-headers)
    res.setHeader('X-RateLimit-Limit', limiter.config.maxRequests);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', Math.floor(result.resetAt / 1000));

    if (!result.allowed) {
      const retryAfter = result.retryAfterMs ? Math.ceil(result.retryAfterMs / 1000) : 60;
      res.setHeader('Retry-After', retryAfter);

      const errorResponse = createErrorResponse(
        ErrorType.RATE_LIMIT,
        'Too many requests. Please try again later.',
        { retryAfter },
        res.getHeader('X-Request-ID') as string | undefined ?? null
      );
      return res.status(errorResponse.statusCode).json(errorResponse.body as T);
    }

    return handler(req, res);
  };
}

const rateLimitConfigExports = {
  RATE_LIMIT_CONFIGS,
  getRateLimiter,
  createAuthRateLimiter,
  createPaymentRateLimiter,
  createAnalyticsRateLimiter,
  createExportRateLimiter,
  withRateLimit,
};

export default rateLimitConfigExports;
