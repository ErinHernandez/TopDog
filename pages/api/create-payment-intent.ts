/**
 * Create Payment Intent API
 * 
 * POST /api/create-payment-intent
 * 
 * Creates a Stripe PaymentIntent for processing payments.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { 
  withErrorHandling, 
  validateMethod, 
  requireEnvVar,
  createSuccessResponse,
  createErrorResponse,
  ErrorType,
} from '../../lib/apiErrorHandler';

// ============================================================================
// TYPES
// ============================================================================

export interface CreatePaymentIntentRequest {
  amount: number;
  userId?: string;
}

export interface CreatePaymentIntentResponse {
  clientSecret: string | null;
}

// ============================================================================
// STRIPE INITIALIZATION
// ============================================================================

const stripe: Stripe | null = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-08-27.basil' as Stripe.LatestApiVersion,
    })
  : null;

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CreatePaymentIntentResponse>
): Promise<unknown> {
  return withErrorHandling(req, res, async (req, res, logger): Promise<unknown> => {
    validateMethod(req, ['POST'], logger);
    requireEnvVar('STRIPE_SECRET_KEY', logger);

    if (!stripe) {
      const error = createErrorResponse(ErrorType.INTERNAL, 'Stripe not configured');
      return res.status(error.statusCode).json(error.body as unknown as CreatePaymentIntentResponse);
    }

    const { amount, userId } = req.body as CreatePaymentIntentRequest;

    if (!amount || amount < 500) { // Minimum $5.00
      const error = createErrorResponse(ErrorType.VALIDATION, 'Invalid amount (minimum $5.00)');
      return res.status(error.statusCode).json(error.body as unknown as CreatePaymentIntentResponse);
    }

    logger.info('Creating payment intent', { amount, userId: userId ? '***' : undefined });

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
      metadata: {
        userId: userId || '',
      },
    });

    const response = createSuccessResponse({
      clientSecret: paymentIntent.client_secret,
    }, 200, logger);
    
    return res.status(response.statusCode).json(response.body.data as CreatePaymentIntentResponse);
  });
}
