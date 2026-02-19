/**
 * Create Payment Intent API
 *
 * POST /api/create-payment-intent
 *
 * Creates a Stripe PaymentIntent for processing payments.
 *
 * @deprecated This endpoint is deprecated. Use /api/stripe/payment-intent instead.
 * Scheduled for removal: March 1, 2026
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
import { serverLogger } from '../../lib/logger/serverLogger';
import { paymentCreationLimiter, getClientIp } from '../../lib/rateLimiters';

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

const STRIPE_API_VERSION = process.env.STRIPE_API_VERSION || '2025-08-27';
const stripe: Stripe | null = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: STRIPE_API_VERSION as Stripe.LatestApiVersion,
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

    // DEPRECATION: Log usage of deprecated endpoint
    const clientIp = getClientIp(req.headers as Record<string, string | string[] | undefined>);
    serverLogger.warn('DEPRECATED: /api/create-payment-intent called - use /api/stripe/payment-intent', null, {
      ip: clientIp,
      userAgent: req.headers['user-agent'],
      userId: (req.body as CreatePaymentIntentRequest).userId,
    });

    // Set deprecation headers
    res.setHeader('Deprecation', 'true');
    res.setHeader('Sunset', 'Sun, 01 Mar 2026 00:00:00 GMT');
    res.setHeader('Link', '</api/stripe/payment-intent>; rel="successor-version"');

    // SECURITY: Rate limit payment creation attempts
    const rateLimitResult = await paymentCreationLimiter.check(req);

    if (!rateLimitResult.allowed) {
      logger.warn('Payment creation rate limited (deprecated endpoint)', {
        ip: clientIp,
        remaining: rateLimitResult.remaining,
        retryAfterMs: rateLimitResult.retryAfterMs,
      });

      return res.status(429).json({
        error: 'Too many payment attempts. Please try again later.',
        retryAfterMs: rateLimitResult.retryAfterMs,
      } as unknown as CreatePaymentIntentResponse);
    }

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
