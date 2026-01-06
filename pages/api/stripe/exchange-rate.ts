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

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse
) {
  return withErrorHandling(req, res, async (req, res, logger) => {
    validateMethod(req, ['GET'], logger);
    
    const { currency } = req.query as ExchangeRateQuery;
    
    // Validate currency parameter
    if (!currency) {
      const error = createErrorResponse(
        ErrorType.VALIDATION,
        'currency query parameter is required',
        400,
        logger
      );
      return res.status(error.statusCode).json(error.body);
    }
    
    const normalizedCurrency = currency.toUpperCase();
    
    // Validate currency format (3 letter ISO code)
    if (!/^[A-Z]{3}$/.test(normalizedCurrency)) {
      const error = createErrorResponse(
        ErrorType.VALIDATION,
        'currency must be a valid 3-letter ISO 4217 code',
        400,
        logger
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
        err.message || 'Failed to fetch exchange rate',
        500,
        logger
      );
      return res.status(errorResponse.statusCode).json(errorResponse.body);
    }
  });
}

