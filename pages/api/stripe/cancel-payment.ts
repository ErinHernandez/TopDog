/**
 * Cancel Payment API Endpoint
 * 
 * POST /api/stripe/cancel-payment
 * 
 * Cancels a pending payment intent (OXXO, Boleto, Pix).
 * Only payments in 'requires_action' status can be cancelled.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { adminDb } from '../../../lib/firebase/firebaseAdmin';
import { createScopedLogger } from '../../../lib/serverLogger';

const logger = createScopedLogger('[API:CancelPayment]');

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      ok: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only POST requests are allowed',
      },
    });
  }
  
  const { paymentIntentId, userId } = req.body as CancelPaymentRequest;
  
  // Validate required fields
  if (!paymentIntentId || typeof paymentIntentId !== 'string') {
    return res.status(400).json({
      ok: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'paymentIntentId is required',
      },
    });
  }
  
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({
      ok: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'userId is required',
      },
    });
  }
  
  try {
    logger.debug('Cancelling payment', { paymentIntentId, userId });
    
    // Retrieve the payment intent first
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    // Verify ownership via metadata
    if (paymentIntent.metadata?.userId !== userId) {
      // Also check via customer ID as fallback
      const userDoc = await adminDb.collection('users').doc(userId).get();
      const userData = userDoc.data();
      const stripeCustomerId = userData?.stripeCustomerId;
      
      if (paymentIntent.customer !== stripeCustomerId) {
        logger.warn('Payment ownership mismatch', { 
          paymentIntentId, 
          userId, 
          actualCustomer: paymentIntent.customer,
        });
        
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
          message: `Payment cannot be cancelled (status: ${paymentIntent.status})`,
        },
      });
    }
    
    // Cancel the payment intent
    const cancelledPayment = await stripe.paymentIntents.cancel(paymentIntentId, {
      cancellation_reason: 'requested_by_customer',
    });
    
    // Update transaction in Firebase if it exists
    const transactionRef = adminDb.collection('transactions').doc(paymentIntentId);
    const transactionDoc = await transactionRef.get();
    
    if (transactionDoc.exists) {
      await transactionRef.update({
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        cancelledBy: 'user',
      });
    }
    
    logger.info('Payment cancelled successfully', { 
      paymentIntentId, 
      userId,
      previousStatus: paymentIntent.status,
    });
    
    return res.status(200).json({
      ok: true,
      data: {
        paymentIntentId: cancelledPayment.id,
        status: cancelledPayment.status,
      },
    });
    
  } catch (error) {
    logger.error('Error cancelling payment', { paymentIntentId, userId, error });
    
    // Handle Stripe-specific errors
    if (error instanceof Stripe.errors.StripeError) {
      return res.status(400).json({
        ok: false,
        error: {
          code: error.code || 'STRIPE_ERROR',
          message: error.message,
        },
      });
    }
    
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    return res.status(500).json({
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: `Failed to cancel payment: ${message}`,
      },
    });
  }
}

