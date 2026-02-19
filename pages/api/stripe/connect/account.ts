/**
 * Stripe Connect Account API
 * 
 * Manages Stripe Connect accounts for user payouts.
 * 
 * POST /api/stripe/connect/account - Create Connect account
 * GET /api/stripe/connect/account?userId={userId} - Get account status
 */

import type { NextApiRequest, NextApiResponse } from 'next';

import { withAuth, verifyUserAccess } from '../../../../lib/apiAuth';
import type { ApiHandler as AuthApiHandler } from '../../../../lib/apiAuth';
import { 
  withErrorHandling, 
  validateMethod, 
  createSuccessResponse,
  createErrorResponse,
  ErrorType,
  type ApiLogger,
} from '../../../../lib/apiErrorHandler';
import type { AuthenticatedRequest } from '../../../../lib/apiTypes';
import { withCSRFProtection } from '../../../../lib/csrfProtection';
import { sanitizeEmail, sanitizeID } from '../../../../lib/inputSanitization';
import { createPaymentRateLimiter, withRateLimit } from '../../../../lib/rateLimitConfig';
import {
  getOrCreateConnectAccount,
  getConnectAccountStatus,
  getUserPaymentData,
  logPaymentEvent,
} from '../../../../lib/stripe';

// ============================================================================
// HANDLER
// ============================================================================

// Create rate limiter
const connectAccountLimiter = createPaymentRateLimiter('paymentMethods');

const handler = async function(
  req: AuthenticatedRequest, 
  res: NextApiResponse
) {
  return withErrorHandling(req, res, async (req, res, logger) => {
    validateMethod(req, ['GET', 'POST'], logger);
    
    // Check rate limit
    const rateLimitResult = await connectAccountLimiter.check(req);
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', connectAccountLimiter.config.maxRequests);
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
    
    if (req.method === 'POST') {
      return handleCreateAccount(req, res, logger);
    } else {
      return handleGetAccountStatus(req, res, logger);
    }
  });
};

// Export with authentication, CSRF protection (for POST), and rate limiting
type CSRFHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void;
export default withCSRFProtection(
  withAuth(
    withRateLimit(handler, connectAccountLimiter) as unknown as AuthApiHandler,
    { required: true, allowAnonymous: false }
  ) as unknown as CSRFHandler
);

// ============================================================================
// HANDLERS
// ============================================================================

/**
 * POST - Create Connect account
 */
async function handleCreateAccount(
  req: AuthenticatedRequest,
  res: NextApiResponse,
  logger: ApiLogger
) {
  const { userId, email, country = 'US' } = req.body;
  
  // Sanitize and validate input
  const sanitizedUserId = sanitizeID(userId);
  const sanitizedEmail = sanitizeEmail(email);
  const sanitizedCountry = typeof country === 'string' 
    ? country.toUpperCase().substring(0, 2) 
    : 'US';
  
  // Verify user access
  if (req.user && sanitizedUserId && !verifyUserAccess(req.user.uid, sanitizedUserId)) {
    const error = createErrorResponse(
      ErrorType.FORBIDDEN,
      'Access denied'
    );
    return res.status(error.statusCode).json(error.body);
  }
  
  if (!sanitizedUserId || !sanitizedEmail) {
    const error = createErrorResponse(
      ErrorType.VALIDATION,
      'userId and email are required'
    );
    return res.status(error.statusCode).json(error.body);
  }
  
  logger.info('Creating Connect account', { userId: sanitizedUserId, country: sanitizedCountry });
  
  try {
    const accountStatus = await getOrCreateConnectAccount({
      userId: sanitizedUserId,
      email: sanitizedEmail,
      country: sanitizedCountry,
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
    
    // Don't expose full error messages in production
    const errorMessage = process.env.NODE_ENV === 'production'
      ? 'Failed to create payout account'
      : err.message || 'Failed to create payout account';
    
    const errorResponse = createErrorResponse(
      ErrorType.STRIPE,
      errorMessage
    );
    return res.status(errorResponse.statusCode).json(errorResponse.body);
  }
}

/**
 * GET - Get Connect account status
 */
async function handleGetAccountStatus(
  req: AuthenticatedRequest,
  res: NextApiResponse,
  logger: ApiLogger
) {
  const { userId } = req.query;
  
  // Sanitize and validate input
  const sanitizedUserId = typeof userId === 'string' ? sanitizeID(userId) : null;
  
  // Verify user access
  if (req.user && sanitizedUserId && !verifyUserAccess(req.user.uid, sanitizedUserId)) {
    const error = createErrorResponse(
      ErrorType.FORBIDDEN,
      'Access denied'
    );
    return res.status(error.statusCode).json(error.body);
  }
  
  if (!sanitizedUserId) {
    const error = createErrorResponse(
      ErrorType.VALIDATION,
      'userId query parameter is required'
    );
    return res.status(error.statusCode).json(error.body);
  }
  
  logger.info('Getting Connect account status', { userId: sanitizedUserId });
  
  try {
    // Get user's Connect account ID
    const paymentData = await getUserPaymentData(sanitizedUserId);
    
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
      err.message || 'Failed to get payout account status'
    );
    return res.status(errorResponse.statusCode).json(errorResponse.body);
  }
}

