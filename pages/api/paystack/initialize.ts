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
import { withCSRFProtection } from '../../../lib/csrfProtection';
import { logPaymentTransaction, getClientIP } from '../../../lib/securityLogger';

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
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({
      ok: false,
      error: { code: 'method_not_allowed', message: 'Only POST is allowed' },
    });
  }
  
  // Check rate limit
  const rateLimitResult = await paymentInitLimiter.check(req);
  const clientIP = getClientIP(req);
  
  // Set rate limit headers
  res.setHeader('X-RateLimit-Limit', paymentInitLimiter.config.maxRequests);
  res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining);
  res.setHeader('X-RateLimit-Reset', Math.floor(rateLimitResult.resetAt / 1000));
  
  if (!rateLimitResult.allowed) {
    return res.status(429).json({
      ok: false,
      error: { 
        code: 'rate_limit_exceeded', 
        message: 'Too many requests. Please try again later.' 
      },
    });
  }
  
  try {
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
    
    // Validate required fields
    if (!userId) {
      return res.status(400).json({
        ok: false,
        error: { code: 'missing_user_id', message: 'User ID is required' },
      });
    }
    
    if (!email) {
      return res.status(400).json({
        ok: false,
        error: { code: 'missing_email', message: 'Email is required' },
      });
    }
    
    if (!amountSmallestUnit || amountSmallestUnit <= 0) {
      return res.status(400).json({
        ok: false,
        error: { code: 'invalid_amount', message: 'Valid amount is required' },
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
      return res.status(400).json({
        ok: false,
        error: {
          code: 'invalid_currency',
          message: `Currency ${currency} is not supported. Use NGN, GHS, ZAR, or KES.`,
        },
      });
    }
    
    // Validate amount
    const validation = validatePaystackAmount(amountSmallestUnit, currency);
    if (!validation.isValid) {
      return res.status(400).json({
        ok: false,
        error: { code: 'invalid_amount', message: validation.error || 'Invalid amount' },
      });
    }
    
    // Generate reference
    const reference = generateReference('TD');
    
    // Build base callback URL
    const baseCallbackUrl = callbackUrl || 
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/deposit/paystack/callback`;
    
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
        return res.status(400).json({
          ok: false,
          error: { code: 'invalid_channel', message: 'USSD is only available in Nigeria (NGN)' },
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
        return res.status(400).json({
          ok: false,
          error: { code: 'invalid_channel', message: 'Mobile Money is only available in Ghana (GHS) and Kenya (KES)' },
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
    
    return res.status(200).json({
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
    });
    
  } catch (error) {
    logger.error('Payment initialization error', error as Error, { 
      component: 'paystack', 
      operation: 'initialize',
      body: req.body,
    });
    await captureError(error as Error, {
      tags: { component: 'paystack', operation: 'initialize' },
      extra: { body: req.body },
    });
    
    const message = error instanceof Error ? error.message : 'Failed to initialize payment';
    
    return res.status(500).json({
      ok: false,
      error: { code: 'initialization_failed', message },
    });
  }
};

// Export with authentication, CSRF protection, and rate limiting
export default withCSRFProtection(
  withAuth(
    withRateLimit(handler, paymentInitLimiter),
    { required: true, allowAnonymous: false }
  )
);

