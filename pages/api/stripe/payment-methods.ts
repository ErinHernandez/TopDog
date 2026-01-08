/**
 * Stripe Payment Methods API
 * 
 * Manages saved payment methods for a customer.
 * 
 * GET /api/stripe/payment-methods?userId={userId} - List payment methods
 * DELETE /api/stripe/payment-methods - Detach a payment method
 * PATCH /api/stripe/payment-methods - Set default payment method
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
  getCustomerWithPaymentMethods,
  detachPaymentMethod,
  createPaymentIntent,
  setDefaultPaymentMethod,
  getUserPaymentData,
  logPaymentEvent,
} from '../../../lib/stripe';
import { withAuth } from '../../../lib/apiAuth';
import { createPaymentRateLimiter, withRateLimit } from '../../../lib/rateLimitConfig';
import { withCSRFProtection } from '../../../lib/csrfProtection';

// Create rate limiter
const paymentMethodsLimiter = createPaymentRateLimiter('paymentMethods');

// ============================================================================
// HANDLER
// ============================================================================

async function handler(
  req: NextApiRequest, 
  res: NextApiResponse
) {
  return withErrorHandling(req, res, async (req, res, logger) => {
    validateMethod(req, ['GET', 'DELETE', 'PATCH'], logger);
    
    switch (req.method) {
      case 'GET':
        return handleListPaymentMethods(req, res, logger);
      case 'DELETE':
        return handleDetachPaymentMethod(req, res, logger);
      case 'PATCH':
        return handleSetDefaultPaymentMethod(req, res, logger);
      default:
        const error = createErrorResponse(
          ErrorType.VALIDATION,
          'Method not allowed',
          405,
          logger
        );
        return res.status(error.statusCode).json(error.body);
    }
  });
}

// Export with authentication, CSRF protection, and rate limiting
export default withCSRFProtection(withAuth(withRateLimit(handler, paymentMethodsLimiter)));

// ============================================================================
// HANDLERS
// ============================================================================

/**
 * GET - List all payment methods for a user
 */
async function handleListPaymentMethods(
  req: NextApiRequest,
  res: NextApiResponse,
  logger: { info: (msg: string, data?: unknown) => void }
) {
  const { userId } = req.query;
  
  if (!userId || typeof userId !== 'string') {
    const error = createErrorResponse(
      ErrorType.VALIDATION,
      'userId query parameter is required',
      400,
      logger
    );
    return res.status(error.statusCode).json(error.body);
  }
  
  logger.info('Listing payment methods', { userId });
  
  try {
    // Get user's Stripe customer ID
    const paymentData = await getUserPaymentData(userId);
    
    if (!paymentData?.stripeCustomerId) {
      // No customer yet = no payment methods
      const response = createSuccessResponse({
        paymentMethods: [],
        defaultPaymentMethodId: null,
      }, 200, logger);
      return res.status(response.statusCode).json(response.body);
    }
    
    // Get customer with payment methods
    const customerData = await getCustomerWithPaymentMethods(
      paymentData.stripeCustomerId
    );
    
    // Format for client
    const paymentMethods = customerData.paymentMethods.map(pm => ({
      id: pm.id,
      type: pm.type,
      card: pm.card ? {
        brand: pm.card.brand,
        last4: pm.card.last4,
        expMonth: pm.card.exp_month,
        expYear: pm.card.exp_year,
        funding: pm.card.funding,
      } : undefined,
      usBankAccount: pm.us_bank_account ? {
        bankName: pm.us_bank_account.bank_name,
        last4: pm.us_bank_account.last4,
        accountType: pm.us_bank_account.account_type,
      } : undefined,
      created: pm.created,
      isDefault: pm.id === customerData.defaultPaymentMethodId,
    }));
    
    const response = createSuccessResponse({
      paymentMethods,
      defaultPaymentMethodId: customerData.defaultPaymentMethodId,
    }, 200, logger);
    
    return res.status(response.statusCode).json(response.body);
  } catch (error) {
    const err = error as Error;
    logger.info('Failed to list payment methods', { error: err.message });
    
    const errorResponse = createErrorResponse(
      ErrorType.STRIPE,
      err.message || 'Failed to list payment methods',
      500,
      logger
    );
    return res.status(errorResponse.statusCode).json(errorResponse.body);
  }
}

/**
 * DELETE - Remove a payment method
 */
async function handleDetachPaymentMethod(
  req: NextApiRequest,
  res: NextApiResponse,
  logger: { info: (msg: string, data?: unknown) => void }
) {
  const { userId, paymentMethodId } = req.body;
  
  if (!userId || !paymentMethodId) {
    const error = createErrorResponse(
      ErrorType.VALIDATION,
      'userId and paymentMethodId are required',
      400,
      logger
    );
    return res.status(error.statusCode).json(error.body);
  }
  
  logger.info('Detaching payment method', { userId, paymentMethodId });
  
  try {
    await detachPaymentMethod(paymentMethodId);
    
    // Log the action
    await logPaymentEvent(userId, 'payment_method_removed', {
      severity: 'low',
      metadata: { paymentMethodId },
    });
    
    const response = createSuccessResponse({
      success: true,
      message: 'Payment method removed',
    }, 200, logger);
    
    return res.status(response.statusCode).json(response.body);
  } catch (error) {
    const err = error as Error;
    logger.info('Failed to detach payment method', { error: err.message });
    
    const errorResponse = createErrorResponse(
      ErrorType.STRIPE,
      err.message || 'Failed to remove payment method',
      500,
      logger
    );
    return res.status(errorResponse.statusCode).json(errorResponse.body);
  }
}

/**
 * PATCH - Set default payment method
 */
async function handleSetDefaultPaymentMethod(
  req: NextApiRequest,
  res: NextApiResponse,
  logger: { info: (msg: string, data?: unknown) => void }
) {
  const { userId, paymentMethodId } = req.body;
  
  if (!userId || !paymentMethodId) {
    const error = createErrorResponse(
      ErrorType.VALIDATION,
      'userId and paymentMethodId are required',
      400,
      logger
    );
    return res.status(error.statusCode).json(error.body);
  }
  
  logger.info('Setting default payment method', { userId, paymentMethodId });
  
  try {
    // Get user's customer ID
    const paymentData = await getUserPaymentData(userId);
    
    if (!paymentData?.stripeCustomerId) {
      const error = createErrorResponse(
        ErrorType.NOT_FOUND,
        'No Stripe customer found',
        404,
        logger
      );
      return res.status(error.statusCode).json(error.body);
    }
    
    await setDefaultPaymentMethod(paymentData.stripeCustomerId, paymentMethodId);
    
    const response = createSuccessResponse({
      success: true,
      defaultPaymentMethodId: paymentMethodId,
    }, 200, logger);
    
    return res.status(response.statusCode).json(response.body);
  } catch (error) {
    const err = error as Error;
    logger.info('Failed to set default payment method', { error: err.message });
    
    const errorResponse = createErrorResponse(
      ErrorType.STRIPE,
      err.message || 'Failed to set default payment method',
      500,
      logger
    );
    return res.status(errorResponse.statusCode).json(errorResponse.body);
  }
}

