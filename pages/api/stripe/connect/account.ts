/**
 * Stripe Connect Account API
 * 
 * Manages Stripe Connect accounts for user payouts.
 * 
 * POST /api/stripe/connect/account - Create Connect account
 * GET /api/stripe/connect/account?userId={userId} - Get account status
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
  getOrCreateConnectAccount,
  getConnectAccountStatus,
  getUserPaymentData,
  logPaymentEvent,
} from '../../../../lib/stripe';

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse
) {
  return withErrorHandling(req, res, async (req, res, logger) => {
    validateMethod(req, ['GET', 'POST'], logger);
    
    if (req.method === 'POST') {
      return handleCreateAccount(req, res, logger);
    } else {
      return handleGetAccountStatus(req, res, logger);
    }
  });
}

// ============================================================================
// HANDLERS
// ============================================================================

/**
 * POST - Create Connect account
 */
async function handleCreateAccount(
  req: NextApiRequest,
  res: NextApiResponse,
  logger: { info: (msg: string, data?: unknown) => void }
) {
  const { userId, email, country = 'US' } = req.body;
  
  if (!userId || !email) {
    const error = createErrorResponse(
      ErrorType.VALIDATION,
      'userId and email are required',
      400,
      logger
    );
    return res.status(error.statusCode).json(error.body);
  }
  
  logger.info('Creating Connect account', { userId, country });
  
  try {
    const accountStatus = await getOrCreateConnectAccount({
      userId,
      email,
      country,
      type: 'express',
      businessType: 'individual',
    });
    
    // Log the action
    await logPaymentEvent(userId, 'connect_account_created', {
      severity: 'low',
      metadata: { accountId: accountStatus.accountId },
    });
    
    const response = createSuccessResponse({
      accountId: accountStatus.accountId,
      chargesEnabled: accountStatus.chargesEnabled,
      payoutsEnabled: accountStatus.payoutsEnabled,
      detailsSubmitted: accountStatus.detailsSubmitted,
      onboardingUrl: accountStatus.onboardingUrl,
      requirements: accountStatus.requirements,
    }, 200, logger);
    
    return res.status(response.statusCode).json(response.body);
  } catch (error) {
    const err = error as Error;
    logger.info('Failed to create Connect account', { error: err.message });
    
    const errorResponse = createErrorResponse(
      ErrorType.STRIPE,
      err.message || 'Failed to create payout account',
      500,
      logger
    );
    return res.status(errorResponse.statusCode).json(errorResponse.body);
  }
}

/**
 * GET - Get Connect account status
 */
async function handleGetAccountStatus(
  req: NextApiRequest,
  res: NextApiResponse,
  logger: { info: (msg: string, data?: unknown) => void }
) {
  const { userId } = req.query;
  
  if (!userId || typeof userId !== 'string') {
    const error = createErrorResponse(
      ErrorType.VALIDATION,
      'userId query parameter is required',
      400,
      logger
    );
    return res.status(error.statusCode).json(error.body);
  }
  
  logger.info('Getting Connect account status', { userId });
  
  try {
    // Get user's Connect account ID
    const paymentData = await getUserPaymentData(userId);
    
    if (!paymentData?.stripeConnectAccountId) {
      const response = createSuccessResponse({
        hasAccount: false,
        message: 'No payout account configured',
      }, 200, logger);
      return res.status(response.statusCode).json(response.body);
    }
    
    const accountStatus = await getConnectAccountStatus(
      paymentData.stripeConnectAccountId
    );
    
    const response = createSuccessResponse({
      hasAccount: true,
      accountId: accountStatus.accountId,
      chargesEnabled: accountStatus.chargesEnabled,
      payoutsEnabled: accountStatus.payoutsEnabled,
      detailsSubmitted: accountStatus.detailsSubmitted,
      onboardingComplete: accountStatus.detailsSubmitted && accountStatus.payoutsEnabled,
      onboardingUrl: accountStatus.onboardingUrl,
      requirements: accountStatus.requirements,
    }, 200, logger);
    
    return res.status(response.statusCode).json(response.body);
  } catch (error) {
    const err = error as Error;
    logger.info('Failed to get Connect account status', { error: err.message });
    
    const errorResponse = createErrorResponse(
      ErrorType.STRIPE,
      err.message || 'Failed to get payout account status',
      500,
      logger
    );
    return res.status(errorResponse.statusCode).json(errorResponse.body);
  }
}

