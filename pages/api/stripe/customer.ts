/**
 * Stripe Customer API
 * 
 * Manages Stripe Customer lifecycle and links to Firebase users.
 * 
 * POST /api/stripe/customer - Create or retrieve customer
 * GET /api/stripe/customer?userId={userId} - Get customer with payment methods
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
  getOrCreateCustomer,
  getCustomerWithPaymentMethods,
  getUserPaymentData,
} from '../../../lib/stripe';
import { withAuth, verifyUserAccess } from '../../../lib/apiAuth';
import { createPaymentRateLimiter, withRateLimit } from '../../../lib/rateLimitConfig';
import { withCSRFProtection } from '../../../lib/csrfProtection';

// Create rate limiter
const customerLimiter = createPaymentRateLimiter('paymentMethods');

const handler = async function(
  req: AuthenticatedRequest, 
  res: NextApiResponse
) {
  return withErrorHandling(req, res, async (req, res, logger) => {
    validateMethod(req, ['GET', 'POST'], logger);
    
    // Check rate limit
    const rateLimitResult = await customerLimiter.check(req);
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', customerLimiter.config.maxRequests);
    res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining);
    res.setHeader('X-RateLimit-Reset', Math.floor(rateLimitResult.resetAt / 1000));
    
    if (!rateLimitResult.allowed) {
      return res.status(429).json({
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(rateLimitResult.retryAfterMs / 1000),
      });
    }
    
    if (req.method === 'POST') {
      return handleCreateCustomer(req, res, logger);
    } else {
      return handleGetCustomer(req, res, logger);
    }
  });
};

// Export with authentication, CSRF protection (for POST), and rate limiting
export default withCSRFProtection(
  withAuth(
    withRateLimit(handler, customerLimiter),
    { required: true, allowAnonymous: false }
  )
);

/**
 * POST - Create or retrieve Stripe Customer
 */
async function handleCreateCustomer(
  req: AuthenticatedRequest,
  res: NextApiResponse,
  logger: ApiLogger
) {
  const { userId, email, name } = req.body;
  
  // Verify user access
  if (req.user && !verifyUserAccess(req.user.uid, userId ?? '')) {
    const error = createErrorResponse(
      ErrorType.FORBIDDEN,
      'Access denied'
    );
    return res.status(error.statusCode).json(error.body);
  }
  
  if (!userId || !email) {
    const error = createErrorResponse(
      ErrorType.VALIDATION,
      'userId and email are required'
    );
    return res.status(error.statusCode).json(error.body);
  }
  
  logger.info('Creating/retrieving Stripe customer', { userId, email });
  
  try {
    const customer = await getOrCreateCustomer({
      userId,
      email,
      name,
    });
    
    const response = createSuccessResponse({
      customerId: customer.id,
      email: customer.email,
      name: customer.name,
      created: customer.created,
    }, 200, logger);
    
    return res.status(response.statusCode).json(response.body);
  } catch (error) {
    const err = error as Error;
    logger.info('Failed to create customer', { error: err.message });
    
    const errorResponse = createErrorResponse(
      ErrorType.STRIPE,
      err.message ?? 'Failed to create customer'
    );
    return res.status(errorResponse.statusCode).json(errorResponse.body);
  }
}

/**
 * GET - Retrieve customer with payment methods
 */
async function handleGetCustomer(
  req: AuthenticatedRequest,
  res: NextApiResponse,
  logger: ApiLogger
) {
  const { userId } = req.query;
  
  // Verify user access
  if (req.user && typeof userId === 'string' && !verifyUserAccess(req.user.uid, userId)) {
    const error = createErrorResponse(
      ErrorType.FORBIDDEN,
      'Access denied'
    );
    return res.status(error.statusCode).json(error.body);
  }
  
  if (!userId || typeof userId !== 'string') {
    const error = createErrorResponse(
      ErrorType.VALIDATION,
      'userId query parameter is required'
    );
    return res.status(error.statusCode).json(error.body);
  }
  
  logger.info('Retrieving customer data', { userId });
  
  try {
    // Get user's Stripe customer ID from Firebase
    const paymentData = await getUserPaymentData(userId);
    
    if (!paymentData?.stripeCustomerId) {
      const error = createErrorResponse(
        ErrorType.NOT_FOUND,
        'No Stripe customer found for this user'
      );
      return res.status(error.statusCode).json(error.body);
    }
    
    // Get full customer data with payment methods
    const customerData = await getCustomerWithPaymentMethods(
      paymentData.stripeCustomerId
    );
    
    // Format payment methods for client
    const paymentMethods = customerData.paymentMethods.map(pm => ({
      id: pm.id,
      type: pm.type,
      card: pm.card ? {
        brand: pm.card.brand,
        last4: pm.card.last4,
        expMonth: pm.card.exp_month,
        expYear: pm.card.exp_year,
      } : undefined,
      created: pm.created,
      isDefault: pm.id === customerData.defaultPaymentMethodId,
    }));
    
    const response = createSuccessResponse({
      customerId: customerData.customer.id,
      email: customerData.customer.email,
      name: customerData.customer.name,
      paymentMethods,
      defaultPaymentMethodId: customerData.defaultPaymentMethodId,
    }, 200, logger);
    
    return res.status(response.statusCode).json(response.body);
  } catch (error) {
    const err = error as Error;
    logger.info('Failed to retrieve customer', { error: err.message });
    
    const errorResponse = createErrorResponse(
      ErrorType.STRIPE,
      err.message || 'Failed to retrieve customer'
    );
    return res.status(errorResponse.statusCode).json(errorResponse.body);
  }
}

