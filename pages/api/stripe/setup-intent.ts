/**
 * Stripe Setup Intent API
 * 
 * Creates SetupIntents for saving payment methods without charging.
 * Used in "Add Payment Method" flow.
 * 
 * POST /api/stripe/setup-intent
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
  getOrCreateCustomer,
  createSetupIntent,
  getUserPaymentData,
  logPaymentEvent,
} from '../../../lib/stripe';
import { v4 as uuidv4 } from 'uuid';

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

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse
) {
  return withErrorHandling(req, res, async (req, res, logger) => {
    validateMethod(req, ['POST'], logger);
    
    const body = req.body as SetupIntentRequestBody;
    const { userId, email } = body;
    
    if (!userId || !email) {
      const error = createErrorResponse(
        ErrorType.VALIDATION,
        'userId and email are required',
        400,
        logger
      );
      return res.status(error.statusCode).json(error.body);
    }
    
    logger.info('Creating setup intent', { userId });
    
    try {
      // Get or create customer
      const customer = await getOrCreateCustomer({
        userId,
        email,
        name: body.name,
      });
      
      // Generate idempotency key
      const idempotencyKey = body.idempotencyKey || 
        `si_${userId}_${Date.now()}_${uuidv4().slice(0, 8)}`;
      
      // Validate payment method types
      const allowedTypes = ['card'] as const;
      const paymentMethodTypes = body.paymentMethodTypes?.filter(
        (type): type is 'card' => allowedTypes.includes(type as 'card')
      ) || ['card'];
      
      // Create setup intent
      const setupIntentResponse = await createSetupIntent({
        userId,
        customerId: customer.id,
        paymentMethodTypes,
        idempotencyKey,
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
        err.message || 'Failed to create setup intent',
        500,
        logger
      );
      return res.status(errorResponse.statusCode).json(errorResponse.body);
    }
  });
}

