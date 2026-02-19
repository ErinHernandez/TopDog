/**
 * Xendit Virtual Account API
 * 
 * Creates a Virtual Account for bank transfer payments.
 * Returns account number for user to transfer to.
 * 
 * POST /api/xendit/virtual-account
 * 
 * @module pages/api/xendit/virtual-account
 */

import type { NextApiRequest, NextApiResponse } from 'next';

import { verifyAuthToken } from '../../../lib/apiAuth';
import {
  withErrorHandling,
  validateMethod,
  validateRequestBody,
  createErrorResponse,
  createSuccessResponse,
  ErrorType
} from '../../../lib/apiErrorHandler';
import { withCSRFProtection } from '../../../lib/csrfProtection';
import { captureError } from '../../../lib/errorTracking';
import { withRateLimit, createPaymentRateLimiter } from '../../../lib/rateLimitConfig';
import { logger } from '../../../lib/structuredLogger';
import { xenditCreateVABodySchema } from '../../../lib/validation/payment';
import {
  createVirtualAccount,
  createXenditTransaction,
  generateReference,
} from '../../../lib/xendit';
import { validateDepositAmount, formatIdrAmount } from '../../../lib/xendit/currencyConfig';

// ============================================================================
// TYPES
// ============================================================================

interface CreateVAResponse {
  success: boolean;
  virtualAccountId?: string;
  accountNumber?: string;
  bankCode?: string;
  amount?: number;
  expirationDate?: string;
  transactionId?: string;
  error?: string;
}

// ============================================================================
// HANDLER
// ============================================================================

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CreateVAResponse>
): Promise<void> {
  await withErrorHandling(req, res, async (req, res, logger) => {
    // Validate HTTP method
    validateMethod(req, ['POST'], logger);

    // SECURITY: Verify user authentication
    const authResult = await verifyAuthToken(req.headers.authorization);
    if (!authResult.uid) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const body = validateRequestBody(req, xenditCreateVABodySchema, logger);
    const userId = authResult.uid;

    // Validate amount limits
    const amountValidation = validateDepositAmount(body.amount);
    if (!amountValidation.isValid) {
      const errorResponse = createErrorResponse(
        ErrorType.VALIDATION,
        amountValidation.error || 'Invalid amount',
        { amount: body.amount },
        res.getHeader('X-Request-ID') as string
      );
      return res.status(errorResponse.statusCode).json({ 
        success: false, 
        error: errorResponse.body.error.message 
      });
    }
    
    logger.info('Creating virtual account', {
      component: 'xendit',
      operation: 'createVirtualAccount',
      userId: userId,
      bankCode: body.bankCode,
      amount: body.amount,
    });
    
    // Generate reference
    const reference = generateReference('VA');
    
    // Calculate expiration
    const expirationHours = body.expirationHours || 24;
    const expirationDate = new Date(Date.now() + expirationHours * 60 * 60 * 1000);
    
    // Create Virtual Account
    const result = await createVirtualAccount({
      userId: userId,
      external_id: reference,
      bank_code: body.bankCode,
      name: body.name,
      expected_amount: body.amount,
      is_single_use: true,
      is_closed: true, // Closed VA = exact amount only
      expiration_date: expirationDate.toISOString(),
    });
    
    // Create pending transaction record
    const transaction = await createXenditTransaction({
      userId: userId,
      type: 'deposit',
      amountSmallestUnit: body.amount, // IDR has no decimals
      currency: 'IDR',
      status: 'pending',
      provider: 'xendit',
      providerReference: result.virtualAccountId,
      paymentMethodType: `va_${body.bankCode.toLowerCase()}`,
      actionUrl: result.accountNumber,
      expiresAt: expirationDate.toISOString(),
      description: `Deposit via ${body.bankCode} Virtual Account`,
      metadata: {
        xenditVAId: result.virtualAccountId,
        bankCode: result.bankCode,
        accountNumber: result.accountNumber,
        reference,
      },
    });
    
    const response = createSuccessResponse({
      success: true,
      virtualAccountId: result.virtualAccountId,
      accountNumber: result.accountNumber,
      bankCode: result.bankCode,
      amount: body.amount,
      expirationDate: expirationDate.toISOString(),
      transactionId: transaction.id,
    }, 200, logger);
    
    return res.status(response.statusCode).json(response.body);
  });
}

// Create rate limiter for Xendit virtual accounts (10 per hour)
const xenditVALimiter = createPaymentRateLimiter('xenditVA');

// Export with CSRF protection and rate limiting
type CSRFHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void;
export default withCSRFProtection(
  withRateLimit(handler, xenditVALimiter) as unknown as CSRFHandler
);


