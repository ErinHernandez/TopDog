/**
 * Stripe Payment Intent API
 * 
 * Creates PaymentIntents for deposits with full feature support:
 * - Multiple payment method types (card, ACH, wallets)
 * - Saved payment method reuse
 * - Risk assessment integration
 * - Idempotency
 * - Audit logging
 * 
 * POST /api/stripe/payment-intent
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
  createPaymentIntent,
  createTransaction,
  assessPaymentRisk,
  logPaymentEvent,
  getUserPaymentData,
  type RiskContext,
} from '../../../lib/stripe';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// TYPES
// ============================================================================

interface PaymentIntentRequestBody {
  /** Amount in cents */
  amountCents: number;
  /** Firebase user ID */
  userId: string;
  /** User's email (optional, used for new customers) */
  email?: string;
  /** User's display name */
  name?: string;
  /** Payment method types to allow */
  paymentMethodTypes?: string[];
  /** Whether to save the payment method */
  savePaymentMethod?: boolean;
  /** Existing payment method ID to charge */
  paymentMethodId?: string;
  /** Idempotency key (optional, will be generated if not provided) */
  idempotencyKey?: string;
  /** Risk context for fraud detection */
  riskContext?: {
    ipAddress?: string;
    country?: string;
    deviceId?: string;
    sessionId?: string;
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MIN_AMOUNT_CENTS = 500; // $5.00 minimum
const MAX_AMOUNT_CENTS = 1000000; // $10,000 maximum per transaction

const ALLOWED_PAYMENT_METHODS = [
  'card',
  'us_bank_account',
  'link',
  'paypal',
  // Note: apple_pay and google_pay are handled via 'card' with wallet detection
  // When using ExpressCheckoutElement or PaymentElement, wallets are automatically
  // presented when the user's device supports them
] as const;

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse
) {
  return withErrorHandling(req, res, async (req, res, logger) => {
    validateMethod(req, ['POST'], logger);
    
    const body = req.body as PaymentIntentRequestBody;
    
    // Validate required fields
    const { amountCents, userId, email } = body;
    
    if (!amountCents || !userId) {
      const error = createErrorResponse(
        ErrorType.VALIDATION,
        'amountCents and userId are required',
        400,
        logger
      );
      return res.status(error.statusCode).json(error.body);
    }
    
    // Validate amount
    if (amountCents < MIN_AMOUNT_CENTS) {
      const error = createErrorResponse(
        ErrorType.VALIDATION,
        `Minimum deposit is $${(MIN_AMOUNT_CENTS / 100).toFixed(2)}`,
        400,
        logger
      );
      return res.status(error.statusCode).json(error.body);
    }
    
    if (amountCents > MAX_AMOUNT_CENTS) {
      const error = createErrorResponse(
        ErrorType.VALIDATION,
        `Maximum deposit is $${(MAX_AMOUNT_CENTS / 100).toFixed(2)}`,
        400,
        logger
      );
      return res.status(error.statusCode).json(error.body);
    }
    
    // Validate payment method types if provided
    const paymentMethodTypes = body.paymentMethodTypes?.filter(
      (type): type is typeof ALLOWED_PAYMENT_METHODS[number] => 
        ALLOWED_PAYMENT_METHODS.includes(type as typeof ALLOWED_PAYMENT_METHODS[number])
    ) || ['card'];
    
    logger.info('Creating payment intent', { 
      userId, 
      amountCents,
      paymentMethodTypes,
    });
    
    try {
      // Risk assessment
      const riskContext: RiskContext = {
        ipAddress: body.riskContext?.ipAddress || getClientIP(req),
        country: body.riskContext?.country,
        deviceId: body.riskContext?.deviceId,
        sessionId: body.riskContext?.sessionId,
      };
      
      const riskAssessment = await assessPaymentRisk(
        userId,
        amountCents,
        riskContext
      );
      
      logger.info('Risk assessment', { 
        score: riskAssessment.score, 
        recommendation: riskAssessment.recommendation,
      });
      
      // Block high-risk transactions
      if (riskAssessment.recommendation === 'decline') {
        await logPaymentEvent(userId, 'payment_initiated', {
          amountCents,
          severity: 'high',
          riskScore: riskAssessment.score,
          riskFactors: riskAssessment.factors,
          metadata: { blocked: true, reason: 'high_risk' },
        });
        
        const error = createErrorResponse(
          ErrorType.FORBIDDEN,
          'Transaction cannot be processed at this time',
          403,
          logger
        );
        return res.status(error.statusCode).json(error.body);
      }
      
      // Get or create Stripe customer
      const customer = await getOrCreateCustomer({
        userId,
        email,
        name: body.name,
      });
      
      // Generate idempotency key if not provided
      const idempotencyKey = body.idempotencyKey || `pi_${userId}_${Date.now()}_${uuidv4().slice(0, 8)}`;
      
      // Create payment intent
      const paymentIntentResponse = await createPaymentIntent({
        amountCents,
        userId,
        customerId: customer.id,
        paymentMethodTypes: paymentMethodTypes as ('card' | 'us_bank_account' | 'link')[],
        savePaymentMethod: body.savePaymentMethod ?? false,
        paymentMethodId: body.paymentMethodId,
        idempotencyKey,
        metadata: {
          riskScore: String(riskAssessment.score),
          riskFactors: riskAssessment.factors.join(','),
        },
      });
      
      // Create pending transaction record
      const transaction = await createTransaction({
        userId,
        type: 'deposit',
        amountCents,
        stripePaymentIntentId: paymentIntentResponse.paymentIntentId,
        description: 'Deposit (pending)',
      });
      
      // Log payment initiation
      await logPaymentEvent(userId, 'payment_initiated', {
        transactionId: transaction.id,
        amountCents,
        severity: riskAssessment.recommendation === 'review' ? 'medium' : 'low',
        ipAddress: riskContext.ipAddress,
        deviceId: riskContext.deviceId,
        riskScore: riskAssessment.score,
        riskFactors: riskAssessment.factors,
      });
      
      const response = createSuccessResponse({
        clientSecret: paymentIntentResponse.clientSecret,
        paymentIntentId: paymentIntentResponse.paymentIntentId,
        transactionId: transaction.id,
        amount: amountCents,
        status: paymentIntentResponse.status,
        riskAssessment: {
          score: riskAssessment.score,
          requiresVerification: riskAssessment.recommendation === 'challenge',
        },
      }, 200, logger);
      
      return res.status(response.statusCode).json(response.body);
    } catch (error) {
      const err = error as Error;
      logger.info('Failed to create payment intent', { error: err.message });
      
      // Log failed attempt
      await logPaymentEvent(userId, 'payment_failed', {
        amountCents,
        severity: 'medium',
        metadata: { error: err.message },
      });
      
      const errorResponse = createErrorResponse(
        ErrorType.STRIPE,
        err.message || 'Failed to create payment intent',
        500,
        logger
      );
      return res.status(errorResponse.statusCode).json(errorResponse.body);
    }
  });
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Extract client IP from request
 */
function getClientIP(req: NextApiRequest): string | undefined {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0]?.trim();
  }
  if (Array.isArray(forwarded)) {
    return forwarded[0];
  }
  return req.socket?.remoteAddress;
}

