/**
 * Stripe Payment Intent API
 * 
 * Creates PaymentIntents for deposits with full feature support:
 * - Multiple payment method types (card, ACH, wallets, bank redirects)
 * - Multi-currency support with currency-specific validation
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
  getCurrencyConfig,
  validateAmount,
  type RiskContext,
  type PaymentMethodType,
} from '../../../lib/stripe';
import { withCSRFProtection } from '../../../lib/csrfProtection';
import { logPaymentTransaction, getClientIP } from '../../../lib/securityLogger';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// TYPES
// ============================================================================

interface PaymentIntentRequestBody {
  /** Amount in smallest unit of currency (cents for USD, etc.) */
  amountCents: number;
  /** ISO 4217 currency code (defaults to 'USD') */
  currency?: string;
  /** User's country code for payment method filtering */
  country?: string;
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
// CONSTANTS - ALL SUPPORTED PAYMENT METHODS
// ============================================================================

/**
 * All payment methods supported by our Stripe integration.
 * Methods are enabled via Stripe Dashboard - this list defines what we accept.
 */
const ALL_PAYMENT_METHODS = [
  // Global
  'card',
  'paypal',
  'link',
  // Bank Debit
  'us_bank_account',
  'sepa_debit',
  'acss_debit',
  // Europe
  'ideal',
  'bancontact',
  'sofort',
  'eps',
  'p24',
  'blik',
  // Scandinavia/Switzerland
  'swish',
  'mobilepay',
  'twint',
  // Portugal
  'multibanco',
  'mb_way',
  // Asia-Pacific
  'paynow',
  'fpx',
  'promptpay',
  'grabpay',
  // Latin America
  'oxxo',
  'boleto',
  'pix',
  // US
  'cashapp',
] as const;

type AllowedPaymentMethod = typeof ALL_PAYMENT_METHODS[number];

/**
 * Get allowed payment methods for a given currency and country.
 * This helps filter methods that are only available in certain regions.
 */
function getAllowedPaymentMethods(
  currency: string,
  country: string
): AllowedPaymentMethod[] {
  const currencyUpper = currency.toUpperCase();
  const countryUpper = country.toUpperCase();
  
  // Start with universal methods
  const methods: AllowedPaymentMethod[] = ['card', 'link'];
  
  // PayPal is available in most countries
  methods.push('paypal');
  
  // USD-specific methods
  if (currencyUpper === 'USD') {
    methods.push('us_bank_account', 'cashapp');
  }
  
  // EUR-specific methods
  if (currencyUpper === 'EUR') {
    methods.push('sepa_debit');
    
    // Country-specific within EUR
    if (countryUpper === 'NL') methods.push('ideal');
    if (countryUpper === 'BE') methods.push('bancontact');
    if (['DE', 'AT', 'BE', 'NL'].includes(countryUpper)) methods.push('sofort');
    if (countryUpper === 'AT') methods.push('eps');
    if (countryUpper === 'PL') methods.push('p24', 'blik');
  }
  
  // PLN (Poland)
  if (currencyUpper === 'PLN') {
    methods.push('p24', 'blik');
  }
  
  // Scandinavia
  if (currencyUpper === 'SEK' && countryUpper === 'SE') {
    methods.push('swish');
  }
  if (currencyUpper === 'DKK' && ['DK', 'FI'].includes(countryUpper)) {
    methods.push('mobilepay');
  }
  
  // Switzerland
  if (currencyUpper === 'CHF' && countryUpper === 'CH') {
    methods.push('twint');
  }
  
  // Portugal
  if (currencyUpper === 'EUR' && countryUpper === 'PT') {
    methods.push('multibanco', 'mb_way');
  }
  
  // CAD (Canada)
  if (currencyUpper === 'CAD') {
    methods.push('acss_debit');
  }
  
  // Singapore
  if (currencyUpper === 'SGD' && countryUpper === 'SG') {
    methods.push('paynow', 'grabpay');
  }
  
  // Malaysia
  if (currencyUpper === 'MYR' && countryUpper === 'MY') {
    methods.push('fpx', 'grabpay');
  }
  
  // Thailand
  if (currencyUpper === 'THB' && countryUpper === 'TH') {
    methods.push('promptpay');
  }
  
  // Philippines
  if (currencyUpper === 'PHP' && countryUpper === 'PH') {
    methods.push('grabpay');
  }
  
  // Mexico
  if (currencyUpper === 'MXN' && countryUpper === 'MX') {
    methods.push('oxxo');
  }
  
  // Brazil
  if (currencyUpper === 'BRL' && countryUpper === 'BR') {
    methods.push('boleto', 'pix');
  }
  
  // Chile - cards only (good Stripe support)
  // CLP uses card payments primarily
  
  // Colombia - cards only (limited Stripe support)
  // COP uses card payments primarily
  
  // Peru - cards only (limited Stripe support)
  // PEN uses card payments primarily
  
  return methods;
}

// ============================================================================
// HANDLER
// ============================================================================

// Wrap handler with CSRF protection
const handler = async function(
  req: NextApiRequest, 
  res: NextApiResponse
) {
  return withErrorHandling(req, res, async (req, res, logger) => {
    validateMethod(req, ['POST'], logger);
    
    const body = req.body as PaymentIntentRequestBody;
    const clientIP = getClientIP(req);
    
    // Validate required fields
    const { amountCents, userId, email } = body;
    const currency = (body.currency ?? 'USD').toUpperCase();
    const country = (body.country ?? body.riskContext?.country ?? 'US').toUpperCase();
    
    if (!amountCents || !userId) {
      const error = createErrorResponse(
        ErrorType.VALIDATION,
        'amountCents and userId are required'
      );
      return res.status(error.statusCode).json(error.body);
    }
    
    // Validate amount against currency-specific limits
    const currencyConfig = getCurrencyConfig(currency);
    const amountValidation = validateAmount(amountCents, currency);
    
    if (!amountValidation.isValid) {
      const error = createErrorResponse(
        ErrorType.VALIDATION,
        amountValidation.error ?? 'Invalid amount'
      );
      return res.status(error.statusCode).json(error.body);
    }
    
    // Get allowed payment methods for this currency/country
    const allowedMethods = getAllowedPaymentMethods(currency, country);
    
    // Filter requested payment methods to only allowed ones
    const requestedMethods = body.paymentMethodTypes || ['card'];
    const paymentMethodTypes = requestedMethods.filter(
      (type): type is PaymentMethodType => 
        allowedMethods.includes(type as AllowedPaymentMethod)
    );
    
    // If no valid methods remain, default to card
    if (paymentMethodTypes.length === 0) {
      paymentMethodTypes.push('card');
    }
    
    logger.info('Creating payment intent', { 
      userId, 
      amountCents,
      currency,
      country,
      paymentMethodTypes,
    });
    
    try {
      // Risk assessment
      const riskContext: RiskContext = {
        ipAddress: body.riskContext?.ipAddress ?? getClientIP(req),
        country: body.riskContext?.country ?? country,
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
          metadata: { blocked: true, reason: 'high_risk', currency },
        });
        
        const error = createErrorResponse(
          ErrorType.FORBIDDEN,
          'Transaction cannot be processed at this time'
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
      
      // Create payment intent with currency
      const paymentIntentResponse = await createPaymentIntent({
        amountCents,
        currency: currency.toLowerCase(),
        userId,
        userCountry: country,
        customerId: customer.id,
        paymentMethodTypes: paymentMethodTypes,
        savePaymentMethod: body.savePaymentMethod ?? false,
        paymentMethodId: body.paymentMethodId,
        idempotencyKey,
        metadata: {
          riskScore: String(riskAssessment.score),
          riskFactors: riskAssessment.factors.join(','),
        },
      });
      
      // Create pending transaction record with currency
      const transaction = await createTransaction({
        userId,
        type: 'deposit',
        amountCents,
        currency,
        stripePaymentIntentId: paymentIntentResponse.paymentIntentId,
        description: 'Deposit (pending)',
        voucherUrl: paymentIntentResponse.nextAction?.voucherUrl,
        expiresAt: paymentIntentResponse.nextAction?.expiresAt,
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
        metadata: { currency },
      });
      
      const response = createSuccessResponse({
        clientSecret: paymentIntentResponse.clientSecret,
        paymentIntentId: paymentIntentResponse.paymentIntentId,
        transactionId: transaction.id,
        amount: amountCents,
        currency,
        currencySymbol: currencyConfig.symbol,
        status: paymentIntentResponse.status,
        nextAction: paymentIntentResponse.nextAction,
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
        metadata: { error: err.message, currency },
      });
      
      const errorResponse = createErrorResponse(
        ErrorType.STRIPE,
        err.message || 'Failed to create payment intent'
      );
      return res.status(errorResponse.statusCode).json(errorResponse.body);
    }
  });
};

// Export with CSRF protection
type CSRFHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void;
export default withCSRFProtection(handler as unknown as CSRFHandler);

// ============================================================================
// HELPERS
// ============================================================================

// Use getClientIP from securityLogger instead
