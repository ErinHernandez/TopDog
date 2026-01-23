/**
 * Display Currency API
 * 
 * Manages user display currency preferences.
 * 
 * GET /api/user/display-currency?userId=xxx&country=xx
 *   Returns the resolved display currency for a user
 * 
 * PUT /api/user/display-currency
 *   Sets the user's display currency preference (non-US only)
 *   Body: { userId, country, currency }
 * 
 * DELETE /api/user/display-currency
 *   Resets to auto mode (follows last deposit currency)
 *   Body: { userId, country }
 */

import type { NextApiResponse } from 'next';
import type { AuthenticatedRequest } from '../../../lib/apiTypes';
import { 
  withErrorHandling, 
  validateMethod, 
  createSuccessResponse,
  createErrorResponse,
  ErrorType,
  type ApiLogger,
} from '../../../lib/apiErrorHandler';
import {
  getDisplayCurrency,
  setDisplayCurrencyPreference,
  resetDisplayCurrencyPreference,
  getSourceLabel,
  getCurrencyDisplayData,
  CURRENCY_CONFIG,
  getCurrencyOptions,
} from '../../../lib/stripe';
import { withAuth, verifyUserAccess } from '../../../lib/apiAuth';
import { createPaymentRateLimiter, withRateLimit } from '../../../lib/rateLimitConfig';
import { withCSRFProtection } from '../../../lib/csrfProtection';

// ============================================================================
// TYPES
// ============================================================================

interface GetDisplayCurrencyQuery {
  userId: string;
  country: string;
}

interface SetDisplayCurrencyBody {
  userId: string;
  country: string;
  currency: string;
}

interface ResetDisplayCurrencyBody {
  userId: string;
  country: string;
}

// ============================================================================
// HANDLER
// ============================================================================

// Create rate limiter
const displayCurrencyLimiter = createPaymentRateLimiter('paymentMethods');

const handler = async function(
  req: AuthenticatedRequest, 
  res: NextApiResponse
) {
  return withErrorHandling(req, res, async (req, res, logger) => {
    validateMethod(req, ['GET', 'PUT', 'DELETE'], logger);
    
    // Check rate limit
    const rateLimitResult = await displayCurrencyLimiter.check(req);
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', displayCurrencyLimiter.config.maxRequests);
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
    
    switch (req.method) {
      case 'GET':
        return handleGet(req, res, logger);
      case 'PUT':
        return handlePut(req, res, logger);
      case 'DELETE':
        return handleDelete(req, res, logger);
      default:
        const error = createErrorResponse(
          ErrorType.METHOD_NOT_ALLOWED,
          'Method not supported'
        );
        return res.status(error.statusCode).json(error.body);
    }
  });
}

// ============================================================================
// GET - Resolve Display Currency
// ============================================================================

async function handleGet(
  req: AuthenticatedRequest,
  res: NextApiResponse,
  logger: ApiLogger
) {
  const { userId, country } = req.query as Partial<GetDisplayCurrencyQuery>;
  
  // Verify user access - users can only access their own data
  if (req.user && !verifyUserAccess(req.user.uid, userId || '')) {
    const error = createErrorResponse(
      ErrorType.FORBIDDEN,
      'Access denied'
    );
    return res.status(error.statusCode).json(error.body);
  }
  
  if (!userId || !country) {
    const error = createErrorResponse(
      ErrorType.VALIDATION,
      'userId and country are required query parameters'
    );
    return res.status(error.statusCode).json(error.body);
  }
  
  logger.info('Resolving display currency', { userId, country });
  
  try {
    const result = await getDisplayCurrency(userId, country);
    const currencyData = getCurrencyDisplayData(result.currency);
    
    const response = createSuccessResponse({
      currency: result.currency,
      symbol: result.symbol,
      name: result.name,
      source: result.source,
      sourceLabel: getSourceLabel(result.source),
      canChange: result.canChange,
      decimals: currencyData.decimals,
      // Include available currencies for the selector (only if user can change)
      availableCurrencies: result.canChange ? getCurrencyOptions() : undefined,
    }, 200, logger);
    
    return res.status(response.statusCode).json(response.body);
  } catch (error) {
    const err = error as Error;
    logger.info('Failed to resolve display currency', { error: err.message });
    
    const errorResponse = createErrorResponse(
      ErrorType.INTERNAL,
      err.message || 'Failed to resolve display currency'
    );
    return res.status(errorResponse.statusCode).json(errorResponse.body);
  }
}

// ============================================================================
// PUT - Set Display Currency Preference
// ============================================================================

async function handlePut(
  req: AuthenticatedRequest,
  res: NextApiResponse,
  logger: ApiLogger
) {
  const { userId, country, currency } = req.body as Partial<SetDisplayCurrencyBody>;
  
  // Verify user access
  if (req.user && !verifyUserAccess(req.user.uid, userId || '')) {
    const error = createErrorResponse(
      ErrorType.FORBIDDEN,
      'Access denied'
    );
    return res.status(error.statusCode).json(error.body);
  }
  
  if (!userId || !country || !currency) {
    const error = createErrorResponse(
      ErrorType.VALIDATION,
      'userId, country, and currency are required'
    );
    return res.status(error.statusCode).json(error.body);
  }
  
  const countryUpper = country.toUpperCase();
  const currencyUpper = currency.toUpperCase();
  
  // Validate currency
  if (!CURRENCY_CONFIG[currencyUpper]) {
    const error = createErrorResponse(
      ErrorType.VALIDATION,
      `Unsupported currency: ${currency}`
    );
    return res.status(error.statusCode).json(error.body);
  }
  
  logger.info('Setting display currency preference', { userId, country, currency: currencyUpper });
  
  try {
    await setDisplayCurrencyPreference(userId, countryUpper, currencyUpper);
    
    // Return the updated display currency info
    const result = await getDisplayCurrency(userId, countryUpper);
    
    const response = createSuccessResponse({
      currency: result.currency,
      symbol: result.symbol,
      name: result.name,
      source: result.source,
      sourceLabel: getSourceLabel(result.source),
      canChange: result.canChange,
      message: 'Display currency preference updated',
    }, 200, logger);
    
    return res.status(response.statusCode).json(response.body);
  } catch (error) {
    const err = error as Error;
    logger.info('Failed to set display currency', { error: err.message });
    
    const errorResponse = createErrorResponse(
      ErrorType.INTERNAL,
      err.message || 'Failed to set display currency'
    );
    return res.status(errorResponse.statusCode).json(errorResponse.body);
  }
}

// ============================================================================
// DELETE - Reset to Auto Mode
// ============================================================================

async function handleDelete(
  req: AuthenticatedRequest,
  res: NextApiResponse,
  logger: ApiLogger
) {
  const { userId, country } = req.body as Partial<ResetDisplayCurrencyBody>;
  
  // Verify user access
  if (req.user && !verifyUserAccess(req.user.uid, userId || '')) {
    const error = createErrorResponse(
      ErrorType.FORBIDDEN,
      'Access denied'
    );
    return res.status(error.statusCode).json(error.body);
  }
  
  if (!userId || !country) {
    const error = createErrorResponse(
      ErrorType.VALIDATION,
      'userId and country are required'
    );
    return res.status(error.statusCode).json(error.body);
  }
  
  const countryUpper = country.toUpperCase();
  
  logger.info('Resetting display currency to auto', { userId, country });
  
  try {
    await resetDisplayCurrencyPreference(userId, countryUpper);
    
    // Return the updated display currency info (now in auto mode)
    const result = await getDisplayCurrency(userId, countryUpper);
    
    const response = createSuccessResponse({
      currency: result.currency,
      symbol: result.symbol,
      name: result.name,
      source: result.source,
      sourceLabel: getSourceLabel(result.source),
      canChange: result.canChange,
      message: 'Display currency reset to auto mode',
    }, 200, logger);
    
    return res.status(response.statusCode).json(response.body);
  } catch (error) {
    const err = error as Error;
    logger.info('Failed to reset display currency', { error: err.message });
    
    const errorResponse = createErrorResponse(
      ErrorType.INTERNAL,
      err.message || 'Failed to reset display currency'
    );
    return res.status(errorResponse.statusCode).json(errorResponse.body);
  }
}

