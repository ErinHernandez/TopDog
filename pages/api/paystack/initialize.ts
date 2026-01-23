/**
 * Paystack Transaction Initialization API
 * 
 * Initializes a Paystack transaction and returns authorization details.
 * Supports card, USSD, mobile money, and bank transfer channels.
 * 
 * POST /api/paystack/initialize
 * 
 * @module pages/api/paystack/initialize
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import {
  initializeTransaction,
  chargeUssd,
  chargeMobileMoney,
  generateReference,
  createPaystackTransaction,
} from '../../../lib/paystack';
import {
  validatePaystackAmount,
  getCurrencyForPaystackCountry,
  isPaystackCurrency,
} from '../../../lib/paystack/currencyConfig';
import { isPaystackCountry } from '../../../lib/payments/types';
import { captureError } from '../../../lib/errorTracking';
import { logger } from '../../../lib/structuredLogger';
import type { PaystackChannel } from '../../../lib/paystack/paystackTypes';
import { withAuth } from '../../../lib/apiAuth';
import { createPaymentRateLimiter, withRateLimit } from '../../../lib/rateLimitConfig';
import { requireAppUrl } from '../../../lib/envHelpers';
import { withCSRFProtection } from '../../../lib/csrfProtection';
import { logPaymentTransaction, getClientIP } from '../../../lib/securityLogger';
import { 
  withErrorHandling, 
  validateMethod, 
  validateBody,
  createErrorResponse,
  createSuccessResponse,
  ErrorType 
} from '../../../lib/apiErrorHandler';

// ============================================================================
// TYPES
// ============================================================================

interface InitializeRequest {
  /** Amount in smallest unit */
  amountSmallestUnit: number;
  /** Currency code (NGN, GHS, ZAR, KES) */
  currency?: string;
  /** Firebase user ID */
  userId: string;
  /** User's email */
  email: string;
  /** User's country code */
  country?: string;
  /** Payment channel */
  channel?: 'card' | 'ussd' | 'mobile_money' | 'bank_transfer';
  /** For USSD: bank type code */
  ussdType?: string;
  /** For mobile money: phone number */
  mobileMoneyPhone?: string;
  /** For mobile money: provider */
  mobileMoneyProvider?: 'mtn' | 'vodafone' | 'tigo' | 'mpesa';
  /** Callback URL */
  callbackUrl?: string;
  /** Additional metadata */
  metadata?: Record<string, string>;
}

interface InitializeResponse {
  ok: boolean;
  data?: {
    /** Transaction reference */
    reference: string;
    /** Access code for Paystack Inline */
    accessCode?: string;
    /** Authorization URL for redirect */
    authorizationUrl?: string;
    /** USSD code for dialing */
    ussdCode?: string;
    /** Display text for user */
    displayText?: string;
    /** Transaction ID in our system */
    transactionId: string;
    /** Channel used */
    channel: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

// ============================================================================
// HANDLER
// ============================================================================

// Create rate limiter for payment initialization
const paymentInitLimiter = createPaymentRateLimiter('initializePayment');

const handler = async function(
  req: NextApiRequest,
  res: NextApiResponse<InitializeResponse>
) {
  return withErrorHandling(req, res, async (req, res, logger) => {
    // Validate HTTP method
    validateMethod(req, ['POST'], logger);
    
    // Check rate limit
    const rateLimitResult = await paymentInitLimiter.check(req);
    const clientIP = getClientIP(req);
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', paymentInitLimiter.config.maxRequests);
    res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining);
    res.setHeader('X-RateLimit-Reset', Math.floor(rateLimitResult.resetAt / 1000));
    
    if (!rateLimitResult.allowed) {
      const errorResponse = createErrorResponse(
        ErrorType.RATE_LIMIT,
        'Too many requests. Please try again later.',
        {},
        res.getHeader('X-Request-ID') as string
      );
      return res.status(errorResponse.statusCode).json({
        ok: false,
        error: { 
          code: 'rate_limit_exceeded', 
          message: errorResponse.body.error.message 
        },
      });
    }
    
    // Validate required body fields
    validateBody(req, ['amountSmallestUnit', 'userId', 'email'], logger);
    
    const {
      amountSmallestUnit,
      currency: requestCurrency,
      userId,
      email,
      country,
      channel = 'card',
      ussdType,
      mobileMoneyPhone,
      mobileMoneyProvider,
      callbackUrl,
      metadata,
    } = req.body as InitializeRequest;
    
    // Additional validation
    if (!amountSmallestUnit || amountSmallestUnit <= 0) {
      const errorResponse = createErrorResponse(
        ErrorType.VALIDATION,
        'Valid amount is required',
        {},
        res.getHeader('X-Request-ID') as string
      );
      return res.status(errorResponse.statusCode).json({
        ok: false,
        error: { code: 'invalid_amount', message: errorResponse.body.error.message },
      });
    }
    
    // Determine currency
    let currency = requestCurrency?.toUpperCase();
    if (!currency && country) {
      if (isPaystackCountry(country)) {
        currency = getCurrencyForPaystackCountry(country);
      }
    }
    currency = currency || 'NGN';
    
    // Validate currency
    if (!isPaystackCurrency(currency)) {
      const errorResponse = createErrorResponse(
        ErrorType.VALIDATION,
        `Currency ${currency} is not supported. Use NGN, GHS, ZAR, or KES.`,
        { currency },
        res.getHeader('X-Request-ID') as string
      );
      return res.status(errorResponse.statusCode).json({
        ok: false,
        error: {
          code: 'invalid_currency',
          message: errorResponse.body.error.message,
        },
      });
    }
    
    // Validate amount
    const validation = validatePaystackAmount(amountSmallestUnit, currency);
    if (!validation.isValid) {
      const errorResponse = createErrorResponse(
        ErrorType.VALIDATION,
        validation.error || 'Invalid amount',
        { amountSmallestUnit, currency },
        res.getHeader('X-Request-ID') as string
      );
      return res.status(errorResponse.statusCode).json({
        ok: false,
        error: { code: 'invalid_amount', message: errorResponse.body.error.message },
      });
    }
    
    logger.info('Initializing payment', {
      component: 'paystack',
      operation: 'initialize',
      userId,
      amountSmallestUnit,
      currency,
      channel,
    });
    
    // Generate reference
    const reference = generateReference('TD');
    
    // Build base callback URL
    const baseCallbackUrl = callbackUrl || 
      `${requireAppUrl()}/deposit/paystack/callback`;
    
    // Handle different channels
    let result: {
      reference: string;
      accessCode?: string;
      authorizationUrl?: string;
      ussdCode?: string;
      displayText?: string;
    };
    
    if (channel === 'ussd' && ussdType) {
      // USSD charge (Nigeria only)
      if (currency !== 'NGN') {
        const errorResponse = createErrorResponse(
          ErrorType.VALIDATION,
          'USSD is only available in Nigeria (NGN)',
          { currency, channel },
          res.getHeader('X-Request-ID') as string
        );
        return res.status(errorResponse.statusCode).json({
          ok: false,
          error: { code: 'invalid_channel', message: errorResponse.body.error.message },
        });
      }
      
      const ussdResult = await chargeUssd({
        amount: amountSmallestUnit,
        email,
        currency: 'NGN',
        reference,
        ussd: { type: ussdType },
        metadata: { firebaseUserId: userId, ...metadata },
        userId,
      });
      
      result = {
        reference: ussdResult.reference,
        ussdCode: ussdResult.ussdCode,
        displayText: ussdResult.displayText,
      };
      
    } else if (channel === 'mobile_money' && mobileMoneyPhone && mobileMoneyProvider) {
      // Mobile Money charge (Ghana, Kenya)
      if (!['GHS', 'KES'].includes(currency)) {
        const errorResponse = createErrorResponse(
          ErrorType.VALIDATION,
          'Mobile Money is only available in Ghana (GHS) and Kenya (KES)',
          { currency, channel },
          res.getHeader('X-Request-ID') as string
        );
        return res.status(errorResponse.statusCode).json({
          ok: false,
          error: { code: 'invalid_channel', message: errorResponse.body.error.message },
        });
      }
      
      const mobileMoneyResult = await chargeMobileMoney({
        amount: amountSmallestUnit,
        email,
        currency: currency as 'GHS' | 'KES',
        reference,
        mobile_money: {
          phone: mobileMoneyPhone,
          provider: mobileMoneyProvider,
        },
        metadata: { firebaseUserId: userId, ...metadata },
        userId,
      });
      
      result = {
        reference: mobileMoneyResult.reference,
        displayText: mobileMoneyResult.displayText,
      };
      
    } else {
      // Standard initialization (card, bank transfer)
      const channels: PaystackChannel[] = channel === 'bank_transfer' 
        ? ['bank', 'bank_transfer']
        : ['card'];
      
      const initResult = await initializeTransaction({
        amount: amountSmallestUnit,
        email,
        currency: currency as 'NGN' | 'GHS' | 'ZAR' | 'KES',
        reference,
        channels,
        callback_url: baseCallbackUrl,
        metadata: {
          custom_fields: [
            { display_name: 'User ID', variable_name: 'firebaseUserId', value: userId },
            ...Object.entries(metadata || {}).map(([key, value]) => ({
              display_name: key,
              variable_name: key,
              value,
            })),
          ],
        },
        userId,
      });
      
      result = {
        reference: initResult.reference,
        accessCode: initResult.accessCode,
        authorizationUrl: initResult.authorizationUrl,
      };
    }
    
    // Create pending transaction record
    const transaction = await createPaystackTransaction({
      userId,
      type: 'deposit',
      amountSmallestUnit,
      currency,
      status: 'pending',
      provider: 'paystack',
      providerReference: result.reference,
      paymentMethodType: channel,
      description: `Deposit via Paystack (${channel})`,
      actionUrl: result.ussdCode || result.authorizationUrl,
      metadata: {
        channel,
        ...metadata,
      },
    });
    
    // Log payment transaction
    await logPaymentTransaction(
      userId,
      transaction.id,
      amountSmallestUnit,
      currency,
      'pending',
      { channel, provider: 'paystack' },
      clientIP
    );
    
    const response = createSuccessResponse({
      ok: true,
      data: {
        reference: result.reference,
        accessCode: result.accessCode,
        authorizationUrl: result.authorizationUrl,
        ussdCode: result.ussdCode,
        displayText: result.displayText,
        transactionId: transaction.id,
        channel,
      },
    }, 200, logger);
    
    return res.status(response.statusCode).json(response.body);
  });
};

// Export with authentication, CSRF protection, and rate limiting
import type { ApiHandler as AuthApiHandler } from '../../../lib/apiAuth';
type CSRFHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void;
export default withCSRFProtection(
  withAuth(
    withRateLimit(handler, paymentInitLimiter) as unknown as AuthApiHandler,
    { required: true, allowAnonymous: false }
  ) as unknown as CSRFHandler
);

