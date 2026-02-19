/**
 * Stripe Connect Payout API
 * 
 * Creates payouts to user's Connect account.
 * 
 * POST /api/stripe/connect/payout - Create payout
 */

import { doc, getDoc } from 'firebase/firestore';
import type { NextApiRequest, NextApiResponse } from 'next';
import { v4 as uuidv4 } from 'uuid';

import { verifyAuthToken } from '../../../../lib/apiAuth';
import {
  withErrorHandling,
  validateMethod,
  createSuccessResponse,
  createErrorResponse,
  ErrorType,
} from '../../../../lib/apiErrorHandler';
import { withCSRFProtection } from '../../../../lib/csrfProtection';
import { getDb } from '../../../../lib/firebase-utils';
import { withRateLimit, createPaymentRateLimiter } from '../../../../lib/rateLimitConfig';
import {
  createPayout,
  getUserPaymentData,
  getConnectAccountStatus,
  logPaymentEvent,
} from '../../../../lib/stripe';

// ============================================================================
// CONSTANTS
// ============================================================================

const MIN_PAYOUT_CENTS = 1000; // $10 minimum
const MAX_PAYOUT_CENTS = 10000000; // $100,000 maximum

// ============================================================================
// HANDLER
// ============================================================================

async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return withErrorHandling(req, res, async (req, res, logger) => {
    validateMethod(req, ['POST'], logger);

    // SECURITY: Verify user authentication
    const authResult = await verifyAuthToken(req.headers.authorization);
    if (!authResult.uid) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Use authenticated user ID, not from request body
    const userId = authResult.uid;
    const { amountCents, idempotencyKey } = req.body;

    // Validate required fields
    if (!amountCents) {
      const error = createErrorResponse(
        ErrorType.VALIDATION,
        'amountCents is required'
      );
      return res.status(error.statusCode).json(error.body);
    }
    
    // Validate amount
    if (amountCents < MIN_PAYOUT_CENTS) {
      const error = createErrorResponse(
        ErrorType.VALIDATION,
        `Minimum withdrawal is $${(MIN_PAYOUT_CENTS / 100).toFixed(2)}`
      );
      return res.status(error.statusCode).json(error.body);
    }
    
    if (amountCents > MAX_PAYOUT_CENTS) {
      const error = createErrorResponse(
        ErrorType.VALIDATION,
        `Maximum withdrawal is $${(MAX_PAYOUT_CENTS / 100).toFixed(2)}`
      );
      return res.status(error.statusCode).json(error.body);
    }
    
    logger.info('Creating payout', { userId, amountCents });

    try {
      // SECURITY: Verify Connect account is set up (can do this before transaction)
      const paymentData = await getUserPaymentData(userId);

      if (!paymentData?.stripeConnectAccountId) {
        const error = createErrorResponse(
          ErrorType.VALIDATION,
          'No payout account configured. Please complete the payout setup first.'
        );
        return res.status(error.statusCode).json(error.body);
      }

      // Check account status
      const accountStatus = await getConnectAccountStatus(
        paymentData.stripeConnectAccountId
      );

      if (!accountStatus.payoutsEnabled) {
        const error = createErrorResponse(
          ErrorType.VALIDATION,
          'Payout account setup is not complete. Please finish the onboarding process.'
        );
        return res.status(error.statusCode).json({
          ...error.body,
          onboardingUrl: accountStatus.onboardingUrl,
        });
      }

      // SECURITY FIX #2: Check user flags and setup (before balance check to fail fast)
      const db = getDb();
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        const error = createErrorResponse(
          ErrorType.NOT_FOUND,
          'User not found'
        );
        return res.status(error.statusCode).json(error.body);
      }

      const userData = userDoc.data();

      // Check if user is flagged
      if (userData.paymentFlagged) {
        const error = createErrorResponse(
          ErrorType.FORBIDDEN,
          'Withdrawals are temporarily unavailable for your account. Please contact support.'
        );
        return res.status(error.statusCode).json(error.body);
      }

      // SECURITY FIX #2: Balance check and payout are now atomic in createPayout()
      // DO NOT check balance here - it will be checked atomically within the transaction
      // in createPayout() to prevent TOCTOU race conditions where concurrent requests
      // both pass validation but together exceed user's balance.
      
      // Generate idempotency key
      const finalIdempotencyKey = idempotencyKey || 
        `payout_${userId}_${Date.now()}_${uuidv4().slice(0, 8)}`;
      
      // Create the payout
      const payoutResponse = await createPayout({
        userId,
        amountCents,
        description: 'Withdrawal',
        idempotencyKey: finalIdempotencyKey,
      });
      
      // Log the action
      await logPaymentEvent(userId, 'payout_initiated', {
        amountCents,
        severity: 'low',
        metadata: { payoutId: payoutResponse.payoutId },
      });
      
      const response = createSuccessResponse({
        payoutId: payoutResponse.payoutId,
        amountCents: payoutResponse.amountCents,
        status: payoutResponse.status,
        message: 'Withdrawal initiated successfully',
      }, 200, logger);
      
      return res.status(response.statusCode).json(response.body);
    } catch (error) {
      const err = error as Error;
      logger.info('Failed to create payout', { error: err.message });
      
      // Log failed attempt
      await logPaymentEvent(userId, 'payout_failed', {
        amountCents,
        severity: 'high',
        metadata: { error: err.message },
      });
      
      const errorResponse = createErrorResponse(
        ErrorType.STRIPE,
        err.message || 'Failed to process withdrawal'
      );
      return res.status(errorResponse.statusCode).json(errorResponse.body);
    }
  });
}

// Create rate limiter for Stripe payouts (5 per hour)
const stripePayoutLimiter = createPaymentRateLimiter('stripePayout');

// Export with CSRF protection and rate limiting
type CSRFHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void;
export default withCSRFProtection(
  withRateLimit(handler, stripePayoutLimiter) as unknown as CSRFHandler
);

