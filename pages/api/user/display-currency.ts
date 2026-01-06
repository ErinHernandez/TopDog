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

import type { NextApiRequest, NextApiResponse } from 'next';
import { 
  withErrorHandling, 
  validateMethod, 
  createSuccessResponse,
  createErrorResponse,
  ErrorType,
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

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse
) {
  return withErrorHandling(req, res, async (req, res, logger) => {
    validateMethod(req, ['GET', 'PUT', 'DELETE'], logger);
    
    switch (req.method) {
      case 'GET':
        return handleGet(req, res, logger);
      case 'PUT':
        return handlePut(req, res, logger);
      case 'DELETE':
        return handleDelete(req, res, logger);
      default:
        const error = createErrorResponse(
          ErrorType.VALIDATION,
          'Method not supported',
          405,
          logger
        );
        return res.status(error.statusCode).json(error.body);
    }
  });
}

// ============================================================================
// GET - Resolve Display Currency
// ============================================================================

async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse,
  logger: { info: (msg: string, data?: Record<string, unknown>) => void }
) {
  const { userId, country } = req.query as Partial<GetDisplayCurrencyQuery>;
  
  if (!userId || !country) {
    const error = createErrorResponse(
      ErrorType.VALIDATION,
      'userId and country are required query parameters',
      400,
      logger
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
      err.message || 'Failed to resolve display currency',
      500,
      logger
    );
    return res.status(errorResponse.statusCode).json(errorResponse.body);
  }
}

// ============================================================================
// PUT - Set Display Currency Preference
// ============================================================================

async function handlePut(
  req: NextApiRequest,
  res: NextApiResponse,
  logger: { info: (msg: string, data?: Record<string, unknown>) => void }
) {
  const { userId, country, currency } = req.body as Partial<SetDisplayCurrencyBody>;
  
  if (!userId || !country || !currency) {
    const error = createErrorResponse(
      ErrorType.VALIDATION,
      'userId, country, and currency are required',
      400,
      logger
    );
    return res.status(error.statusCode).json(error.body);
  }
  
  const countryUpper = country.toUpperCase();
  const currencyUpper = currency.toUpperCase();
  
  // Validate currency
  if (!CURRENCY_CONFIG[currencyUpper]) {
    const error = createErrorResponse(
      ErrorType.VALIDATION,
      `Unsupported currency: ${currency}`,
      400,
      logger
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
      err.message || 'Failed to set display currency',
      500,
      logger
    );
    return res.status(errorResponse.statusCode).json(errorResponse.body);
  }
}

// ============================================================================
// DELETE - Reset to Auto Mode
// ============================================================================

async function handleDelete(
  req: NextApiRequest,
  res: NextApiResponse,
  logger: { info: (msg: string, data?: Record<string, unknown>) => void }
) {
  const { userId, country } = req.body as Partial<ResetDisplayCurrencyBody>;
  
  if (!userId || !country) {
    const error = createErrorResponse(
      ErrorType.VALIDATION,
      'userId and country are required',
      400,
      logger
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
      err.message || 'Failed to reset display currency',
      500,
      logger
    );
    return res.status(errorResponse.statusCode).json(errorResponse.body);
  }
}

