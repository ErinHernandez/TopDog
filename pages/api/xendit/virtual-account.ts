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
import { 
  createVirtualAccount, 
  createXenditTransaction,
  generateReference,
} from '../../../lib/xendit';
import { validateDepositAmount, formatIdrAmount } from '../../../lib/xendit/currencyConfig';
import type { XenditBankCode } from '../../../lib/xendit/xenditTypes';
import { captureError } from '../../../lib/errorTracking';
import { logger } from '../../../lib/structuredLogger';
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

interface CreateVABody {
  /** Amount in IDR */
  amount: number;
  /** Bank code: BCA, MANDIRI, BNI, BRI, PERMATA */
  bankCode: XenditBankCode;
  /** Firebase user ID */
  userId: string;
  /** User's name for the VA */
  name: string;
  /** Expiration hours (default 24) */
  expirationHours?: number;
}

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
// VALIDATION
// ============================================================================

const VALID_BANK_CODES: XenditBankCode[] = ['BCA', 'MANDIRI', 'BNI', 'BRI', 'PERMATA'];

function validateRequest(body: CreateVABody): { valid: boolean; error?: string } {
  if (!body.amount || typeof body.amount !== 'number' || body.amount <= 0) {
    return { valid: false, error: 'Invalid amount' };
  }
  
  if (!body.bankCode || !VALID_BANK_CODES.includes(body.bankCode)) {
    return { valid: false, error: `Invalid bank code. Must be one of: ${VALID_BANK_CODES.join(', ')}` };
  }
  
  if (!body.userId || typeof body.userId !== 'string') {
    return { valid: false, error: 'User ID is required' };
  }
  
  if (!body.name || typeof body.name !== 'string' || body.name.length < 2) {
    return { valid: false, error: 'Name is required' };
  }
  
  return { valid: true };
}

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CreateVAResponse>
): Promise<void> {
  await withErrorHandling(req, res, async (req, res, logger) => {
    // Validate HTTP method
    validateMethod(req, ['POST'], logger);
    
    // Validate required body fields
    validateBody(req, ['amount', 'bankCode', 'userId', 'name'], logger);
    
    const body = req.body as CreateVABody;
    
    // Additional validation using custom validator
    const validation = validateRequest(body);
    if (!validation.valid) {
      const errorResponse = createErrorResponse(
        ErrorType.VALIDATION,
        validation.error || 'Invalid request',
        {},
        res.getHeader('X-Request-ID') as string
      );
      return res.status(errorResponse.statusCode).json({ 
        success: false, 
        error: errorResponse.body.error.message 
      });
    }
    
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
      userId: body.userId,
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
      userId: body.userId,
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
      userId: body.userId,
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


