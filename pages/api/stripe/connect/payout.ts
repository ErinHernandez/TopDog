/**
 * Stripe Connect Payout API
 * 
 * Creates payouts to user's Connect account.
 * 
 * POST /api/stripe/connect/payout - Create payout
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { 
  withErrorHandling, 
  validateMethod, 
  createSuccessResponse,
  createErrorResponse,
  ErrorType,
} from '../../../../lib/apiErrorHandler';
import {
  createPayout,
  getUserPaymentData,
  getConnectAccountStatus,
  logPaymentEvent,
} from '../../../../lib/stripe';
import { getDb } from '../../../../lib/firebase-utils';
import { doc, getDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// CONSTANTS
// ============================================================================

const MIN_PAYOUT_CENTS = 1000; // $10 minimum
const MAX_PAYOUT_CENTS = 10000000; // $100,000 maximum

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse
) {
  return withErrorHandling(req, res, async (req, res, logger) => {
    validateMethod(req, ['POST'], logger);
    
    const { userId, amountCents, idempotencyKey } = req.body;
    
    // Validate required fields
    if (!userId || !amountCents) {
      const error = createErrorResponse(
        ErrorType.VALIDATION,
        'userId and amountCents are required'
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
      // Verify user has sufficient balance
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
      const currentBalance = (userData.balance || 0) * 100; // Convert to cents
      
      if (currentBalance < amountCents) {
      const error = createErrorResponse(
        ErrorType.VALIDATION,
        'Insufficient balance'
      );
        return res.status(error.statusCode).json(error.body);
      }
      
      // Verify Connect account is set up
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
      
      // Check if user is flagged
      if (userData.paymentFlagged) {
        const error = createErrorResponse(
          ErrorType.FORBIDDEN,
          'Withdrawals are temporarily unavailable for your account. Please contact support.'
        );
        return res.status(error.statusCode).json(error.body);
      }
      
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

