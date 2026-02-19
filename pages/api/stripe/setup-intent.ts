/**
 * Stripe Setup Intent API
 * 
 * Creates SetupIntents for saving payment methods without charging.
 * Used in "Add Payment Method" flow.
 * 
 * POST /api/stripe/setup-intent
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { v4 as uuidv4 } from 'uuid';

import { withAuth, verifyUserAccess } from '../../../lib/apiAuth';
import type { ApiHandler as AuthApiHandler } from '../../../lib/apiAuth';
import { 
  withErrorHandling, 
  validateMethod, 
  validateRequestBody,
  createSuccessResponse,
  createErrorResponse,
  ErrorType,
} from '../../../lib/apiErrorHandler';
import type { AuthenticatedRequest } from '../../../lib/apiTypes';
import { withCSRFProtection } from '../../../lib/csrfProtection';
import { createPaymentRateLimiter, withRateLimit } from '../../../lib/rateLimitConfig';
import {
  getOrCreateCustomer,
  createSetupIntent,
  getUserPaymentData,
  logPaymentEvent,
} from '../../../lib/stripe';
import { stripeSetupIntentRequestSchema } from '../../../lib/validation/schemas';


// ============================================================================
// TYPES
// ============================================================================

interface SetupIntentRequestBody {
  /** Firebase user ID */
  userId: string;
  /** User's email (required for new customers) */
  email: string;
  /** User's display name */
  name?: string;
  /** Payment method types to allow */
  paymentMethodTypes?: string[];
  /** Idempotency key */
  idempotencyKey?: string;
}

// ============================================================================
// HANDLER
// ============================================================================

// Create rate limiter
const setupIntentLimiter = createPaymentRateLimiter('paymentMethods');

const handler = async function(
  req: AuthenticatedRequest, 
  res: NextApiResponse
) {
  return withErrorHandling(req, res, async (req: AuthenticatedRequest, res, logger) => {
    validateMethod(req, ['POST'], logger);
    
    // Check rate limit
    const rateLimitResult = await setupIntentLimiter.check(req);
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', setupIntentLimiter.config.maxRequests);
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
    
    // SECURITY: Validate request body using Zod schema
    const body = validateRequestBody(req, stripeSetupIntentRequestSchema, logger);
    const { userId, email, name, paymentMethodTypes, idempotencyKey } = body;
    
    // Verify user access
    if (req.user && !verifyUserAccess(req.user.uid, userId)) {
      const error = createErrorResponse(
        ErrorType.FORBIDDEN,
        'Access denied'
      );
      return res.status(error.statusCode).json(error.body);
    }
    
    logger.info('Creating setup intent', { userId });
    
    try {
      // Get or create customer
      const customer = await getOrCreateCustomer({
        userId,
        email,
        name: name,
      });
      
      // Generate idempotency key if not provided
      const finalIdempotencyKey = idempotencyKey || 
        `si_${userId}_${Date.now()}_${uuidv4().slice(0, 8)}`;
      
      // Use validated payment method types (already filtered by Zod)
      const finalPaymentMethodTypes = paymentMethodTypes || ['card'];
      
      // Create setup intent
      const setupIntentResponse = await createSetupIntent({
        userId,
        customerId: customer.id,
        paymentMethodTypes: finalPaymentMethodTypes,
        idempotencyKey: finalIdempotencyKey,
      });
      
      // Log the action
      await logPaymentEvent(userId, 'payment_method_added', {
        severity: 'low',
        metadata: { action: 'setup_intent_created' },
      });
      
      const response = createSuccessResponse({
        clientSecret: setupIntentResponse.clientSecret,
        setupIntentId: setupIntentResponse.setupIntentId,
        customerId: customer.id,
      }, 200, logger);
      
      return res.status(response.statusCode).json(response.body);
    } catch (error) {
      const err = error as Error;
      logger.info('Failed to create setup intent', { error: err.message });
      
      const errorResponse = createErrorResponse(
        ErrorType.STRIPE,
        err.message || 'Failed to create setup intent'
      );
      return res.status(errorResponse.statusCode).json(errorResponse.body);
    }
  });
};

// Export with authentication, CSRF protection, and rate limiting
type CSRFHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void;
export default withCSRFProtection(
  withAuth(
    withRateLimit(handler, setupIntentLimiter) as unknown as AuthApiHandler,
    { required: true, allowAnonymous: false }
  ) as unknown as CSRFHandler
);

