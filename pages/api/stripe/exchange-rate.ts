/**
 * Stripe Exchange Rate API
 * 
 * Returns the current exchange rate for a currency from Stripe.
 * Uses probe PaymentIntents to get accurate rates, with caching.
 * 
 * GET /api/stripe/exchange-rate?currency=AUD
 * 
 * Response:
 * {
 *   currency: "AUD",
 *   rate: 1.55,
 *   rateDisplay: "1 USD = 1.55 AUD",
 *   fetchedAt: 1704567890
 * }
 */

import type { NextApiRequest, NextApiResponse } from 'next';

import { 
  withErrorHandling, 
  validateMethod, 
  createSuccessResponse,
  createErrorResponse,
  ErrorType,
} from '../../../lib/apiErrorHandler';
import { sanitizeString } from '../../../lib/inputSanitization';
import { createPaymentRateLimiter, withRateLimit } from '../../../lib/rateLimitConfig';
import {
  getStripeExchangeRate,
  type StripeExchangeRate,
} from '../../../lib/stripe';

// ============================================================================
// TYPES
// ============================================================================

interface ExchangeRateQuery {
  currency?: string;
}

interface ExchangeRateResponse {
  currency: string;
  rate: number;
  rateDisplay: string;
  fetchedAt: number;
  source: 'stripe' | 'cache' | 'fallback';
}

// ============================================================================
// HANDLER
// ============================================================================

// Create rate limiter (public endpoint, but still rate limit)
const exchangeRateLimiter = createPaymentRateLimiter('paymentMethods');

const handler = async function(
  req: NextApiRequest, 
  res: NextApiResponse
) {
  return withErrorHandling(req, res, async (req, res, logger) => {
    validateMethod(req, ['GET'], logger);
    
    // Check rate limit
    const rateLimitResult = await exchangeRateLimiter.check(req);
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', exchangeRateLimiter.config.maxRequests);
    res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining);
    res.setHeader('X-RateLimit-Reset', Math.floor(rateLimitResult.resetAt / 1000));
    
    if (!rateLimitResult.allowed) {
      return res.status(429).json({
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((rateLimitResult.retryAfterMs || 60) / 1000),
      });
    }
    
    const { currency } = req.query as ExchangeRateQuery;
    
    // Sanitize currency input
    const sanitizedCurrency = currency ? sanitizeString(String(currency), { 
      maxLength: 3, 
      allowSpecialChars: false 
    }) : null;
    
    // Validate currency parameter
    if (!sanitizedCurrency) {
      const error = createErrorResponse(
        ErrorType.VALIDATION,
        'currency query parameter is required'
      );
      return res.status(error.statusCode).json(error.body);
    }
    
    const normalizedCurrency = sanitizedCurrency.toUpperCase();
    
    // Validate currency format (3 letter ISO code)
    if (!/^[A-Z]{3}$/.test(normalizedCurrency)) {
      const error = createErrorResponse(
        ErrorType.VALIDATION,
        'currency must be a valid 3-letter ISO 4217 code'
      );
      return res.status(error.statusCode).json(error.body);
    }
    
    logger.info('Fetching exchange rate', { currency: normalizedCurrency });
    
    try {
      const rateData = await getStripeExchangeRate(normalizedCurrency);
      
      // Determine source
      let source: 'stripe' | 'cache' | 'fallback' = 'stripe';
      if (rateData.rateDisplay.includes('fallback')) {
        source = 'fallback';
      } else if (Date.now() - rateData.fetchedAt > 1000) {
        // If fetched more than 1 second ago, it was cached
        source = 'cache';
      }
      
      const responseData: ExchangeRateResponse = {
        currency: rateData.currency,
        rate: rateData.rate,
        rateDisplay: rateData.rateDisplay,
        fetchedAt: rateData.fetchedAt,
        source,
      };
      
      const response = createSuccessResponse(responseData, 200, logger);
      
      // Set cache headers (5 minutes client-side cache)
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
      
      return res.status(response.statusCode).json(response.body);
      
    } catch (error) {
      const err = error as Error;
      logger.info('Failed to fetch exchange rate', { 
        error: err.message,
        currency: normalizedCurrency,
      });
      
      const errorResponse = createErrorResponse(
        ErrorType.INTERNAL,
        err.message || 'Failed to fetch exchange rate'
      );
      return res.status(errorResponse.statusCode).json(errorResponse.body);
    }
  });
};

// Export with rate limiting (public endpoint, no auth required)
export default withRateLimit(handler, exchangeRateLimiter);

