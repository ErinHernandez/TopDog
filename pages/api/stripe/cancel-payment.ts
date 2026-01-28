/**
 * Cancel Payment API Endpoint
 * 
 * POST /api/stripe/cancel-payment
 * 
 * Cancels a pending payment intent (OXXO, Boleto, Pix).
 * Only payments in 'requires_action' status can be cancelled.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import type { AuthenticatedRequest } from '../../../lib/apiTypes';
import Stripe from 'stripe';
import { adminDb } from '../../../lib/firebase/firebaseAdmin';
import { createScopedLogger } from '../../../lib/serverLogger';
import { withAuth, verifyUserAccess } from '../../../lib/apiAuth';
import { createPaymentRateLimiter, withRateLimit } from '../../../lib/rateLimitConfig';
import { withCSRFProtection } from '../../../lib/csrfProtection';
import { logSecurityEvent, getClientIP, SecurityEventType } from '../../../lib/securityLogger';
import { sanitizeID } from '../../../lib/inputSanitization';
import { 
  withErrorHandling, 
  validateMethod, 
  validateBody,
  validateRequestBody,
  createSuccessResponse,
  createErrorResponse,
  ErrorType 
} from '../../../lib/apiErrorHandler';
import { stripeCancelPaymentRequestSchema } from '../../../lib/validation/schemas';

const logger = createScopedLogger('[API:CancelPayment]');

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

// Create rate limiter
const cancelPaymentLimiter = createPaymentRateLimiter('createPaymentIntent');

// ============================================================================
// TYPES
// ============================================================================

interface CancelPaymentRequest {
  paymentIntentId: string;
  userId: string;
}

interface SuccessResponse {
  ok: true;
  data: {
    paymentIntentId: string;
    status: string;
  };
}

interface ErrorResponse {
  ok: false;
  error: {
    code: string;
    message: string;
  };
}

type ApiResponse = SuccessResponse | ErrorResponse;

// ============================================================================
// API HANDLER
// ============================================================================

const handler = async function(
  req: AuthenticatedRequest,
  res: NextApiResponse<ApiResponse>
) {
  const clientIP = getClientIP(req);
  
  return withErrorHandling(req, res, async (req: AuthenticatedRequest, res, logger) => {
    // Validate HTTP method
    validateMethod(req, ['POST'], logger);
    
    // Check rate limit
    const rateLimitResult = await cancelPaymentLimiter.check(req);
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', cancelPaymentLimiter.config.maxRequests);
    res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining);
    res.setHeader('X-RateLimit-Reset', Math.floor(rateLimitResult.resetAt / 1000));
    
    if (!rateLimitResult.allowed) {
      await logSecurityEvent(
        SecurityEventType.RATE_LIMIT_EXCEEDED,
        'medium',
        { endpoint: '/api/stripe/cancel-payment' },
        req.user?.uid || undefined,
        clientIP
      );
      
      const errorResponse = createErrorResponse(
        ErrorType.RATE_LIMIT,
        'Too many requests. Please try again later.',
        {},
        res.getHeader('X-Request-ID') as string
      );
      return res.status(errorResponse.statusCode).json({
        ok: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: errorResponse.body.error.message,
        },
      });
    }
    
    // SECURITY: Validate request body using Zod schema
    const body = validateRequestBody(req, stripeCancelPaymentRequestSchema, logger);
    const { paymentIntentId, userId } = body;
    
    // Sanitize and validate input
    const sanitizedPaymentIntentId = sanitizeID(paymentIntentId);
    const sanitizedUserId = sanitizeID(userId);
    
    // Verify user access
    if (req.user && sanitizedUserId && !verifyUserAccess(req.user.uid, sanitizedUserId)) {
      await logSecurityEvent(
        SecurityEventType.SUSPICIOUS_ACTIVITY,
        'high',
        { 
          endpoint: '/api/stripe/cancel-payment',
          reason: 'unauthorized_user_access',
          requestedUserId: sanitizedUserId,
          authenticatedUserId: req.user.uid
        },
        req.user.uid,
        clientIP
      );
      
      const errorResponse = createErrorResponse(
        ErrorType.FORBIDDEN,
        'Access denied',
        {},
        res.getHeader('X-Request-ID') as string
      );
      return res.status(errorResponse.statusCode).json({
        ok: false,
        error: {
          code: 'FORBIDDEN',
          message: errorResponse.body.error.message,
        },
      });
    }
    
    // Additional validation after sanitization
    if (!sanitizedPaymentIntentId) {
      const errorResponse = createErrorResponse(
        ErrorType.VALIDATION,
        'paymentIntentId is required and must be valid',
        {},
        res.getHeader('X-Request-ID') as string
      );
      return res.status(errorResponse.statusCode).json({
        ok: false,
        error: {
          code: 'INVALID_REQUEST',
          message: errorResponse.body.error.message,
        },
      });
    }
    
    if (!sanitizedUserId) {
      const errorResponse = createErrorResponse(
        ErrorType.VALIDATION,
        'userId is required and must be valid',
        {},
        res.getHeader('X-Request-ID') as string
      );
      return res.status(errorResponse.statusCode).json({
        ok: false,
        error: {
          code: 'INVALID_REQUEST',
          message: errorResponse.body.error.message,
        },
      });
    }
    
    logger.info('Cancelling payment', {
      component: 'stripe',
      operation: 'cancel-payment',
      paymentIntentId: sanitizedPaymentIntentId,
      userId: sanitizedUserId,
    });
    logger.debug('Cancelling payment', { paymentIntentId: sanitizedPaymentIntentId, userId: sanitizedUserId });
    
    // Log cancellation attempt
    await logSecurityEvent(
      SecurityEventType.PAYMENT_TRANSACTION,
      'medium',
      { 
        action: 'payment_cancellation_attempt',
        paymentIntentId: sanitizedPaymentIntentId,
        userId: sanitizedUserId
      },
      req.user?.uid || sanitizedUserId,
      clientIP
    );
    
    // Retrieve the payment intent first
    const paymentIntent = await stripe.paymentIntents.retrieve(sanitizedPaymentIntentId);
    
    // Verify ownership via metadata
    if (paymentIntent.metadata?.userId !== sanitizedUserId) {
      // Also check via customer ID as fallback
      const userDoc = await adminDb.collection('users').doc(userId).get();
      const userData = userDoc.data();
      const stripeCustomerId = userData?.stripeCustomerId;
      
      if (paymentIntent.customer !== stripeCustomerId) {
        logger.warn('Payment ownership mismatch', { 
          paymentIntentId: sanitizedPaymentIntentId, 
          userId: sanitizedUserId, 
        });
        
        await logSecurityEvent(
          SecurityEventType.SUSPICIOUS_ACTIVITY,
          'high',
          { 
            endpoint: '/api/stripe/cancel-payment',
            reason: 'payment_ownership_mismatch',
            paymentIntentId: sanitizedPaymentIntentId,
            userId: sanitizedUserId
          },
          req.user?.uid || sanitizedUserId,
          clientIP
        );
        
        return res.status(403).json({
          ok: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to cancel this payment',
          },
        });
      }
    }
    
    // Check if payment can be cancelled
    const cancellableStatuses = ['requires_payment_method', 'requires_confirmation', 'requires_action', 'processing'];
    
    if (!cancellableStatuses.includes(paymentIntent.status)) {
      return res.status(400).json({
        ok: false,
        error: {
          code: 'CANNOT_CANCEL',
          message: 'Payment cannot be cancelled in its current state',
        },
      });
    }
    
    // Cancel the payment intent
    const cancelledPayment = await stripe.paymentIntents.cancel(sanitizedPaymentIntentId, {
      cancellation_reason: 'requested_by_customer',
    });
    
    // Update transaction in Firebase if it exists
    const transactionRef = adminDb.collection('transactions').doc(sanitizedPaymentIntentId);
    const transactionDoc = await transactionRef.get();
    
    if (transactionDoc.exists) {
      await transactionRef.update({
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        cancelledBy: 'user',
      });
    }
    
    logger.info('Payment cancelled successfully', { 
      paymentIntentId: sanitizedPaymentIntentId, 
      userId: sanitizedUserId,
      previousStatus: paymentIntent.status,
    });
    
    // Log successful cancellation
    await logSecurityEvent(
      SecurityEventType.PAYMENT_TRANSACTION,
      'high',
      { 
        action: 'payment_cancelled',
        paymentIntentId: sanitizedPaymentIntentId,
        userId: sanitizedUserId,
        previousStatus: paymentIntent.status
      },
      req.user?.uid || sanitizedUserId,
      clientIP
    );
    
    const response = createSuccessResponse({
      ok: true,
      data: {
        paymentIntentId: cancelledPayment.id,
        status: cancelledPayment.status,
      },
    }, 200, logger);
    
    return res.status(response.statusCode).json(response.body);
  }).catch(async (error) => {
    // Handle Stripe-specific errors before default error handler
    if (error instanceof Stripe.errors.StripeError) {
      // Don't expose full Stripe error messages in production
      const errorMessage = process.env.NODE_ENV === 'production' 
        ? 'Payment cancellation failed'
        : error.message;
      
      return res.status(400).json({
        ok: false,
        error: {
          code: error.code || 'STRIPE_ERROR',
          message: errorMessage,
        },
      });
    }
    
    // Re-throw to let withErrorHandling handle it
    throw error;
  });
};

// Export with authentication, CSRF protection, and rate limiting
import type { ApiHandler as AuthApiHandler } from '../../../lib/apiAuth';
type CSRFHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void;
export default withCSRFProtection(
  withAuth(
    withRateLimit(handler, cancelPaymentLimiter) as unknown as AuthApiHandler,
    { required: true, allowAnonymous: false }
  ) as unknown as CSRFHandler
);

