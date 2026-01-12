/**
 * PayMongo Source API
 * 
 * Creates a payment source for GCash, Maya, or GrabPay payments.
 * Returns checkout URL for user redirect.
 * 
 * POST /api/paymongo/source
 * 
 * @module pages/api/paymongo/source
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { 
  createSource, 
  createPayMongoTransaction,
  generateReference,
} from '../../../lib/paymongo';
import { toSmallestUnit, validateDepositAmount } from '../../../lib/paymongo/currencyConfig';
import type { PayMongoSourceType } from '../../../lib/paymongo/paymongoTypes';
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

interface CreateSourceBody {
  /** Amount in PHP (display amount, will be converted to centavos) */
  amount: number;
  /** Payment type: 'gcash', 'grab_pay', or 'paymaya' */
  type: PayMongoSourceType;
  /** Firebase user ID */
  userId: string;
  /** User email */
  email: string;
  /** User name (optional) */
  name?: string;
  /** User phone (optional) */
  phone?: string;
  /** Success redirect URL */
  successUrl?: string;
  /** Failure redirect URL */
  failureUrl?: string;
}

interface CreateSourceResponse {
  success: boolean;
  sourceId?: string;
  checkoutUrl?: string;
  transactionId?: string;
  error?: string;
}

// ============================================================================
// VALIDATION
// ============================================================================

const VALID_SOURCE_TYPES: PayMongoSourceType[] = ['gcash', 'grab_pay', 'paymaya'];

function validateRequest(body: CreateSourceBody): { valid: boolean; error?: string } {
  if (!body.amount || typeof body.amount !== 'number' || body.amount <= 0) {
    return { valid: false, error: 'Invalid amount' };
  }
  
  if (!body.type || !VALID_SOURCE_TYPES.includes(body.type)) {
    return { valid: false, error: `Invalid type. Must be one of: ${VALID_SOURCE_TYPES.join(', ')}` };
  }
  
  if (!body.userId || typeof body.userId !== 'string') {
    return { valid: false, error: 'User ID is required' };
  }
  
  if (!body.email || typeof body.email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }
  
  return { valid: true };
}

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CreateSourceResponse>
): Promise<void> {
  return withErrorHandling(req, res, async (req, res, logger) => {
    // Validate HTTP method
    validateMethod(req, ['POST'], logger);
    
    // Validate required body fields
    validateBody(req, ['amount', 'type', 'userId', 'email'], logger);
    
    const body = req.body as CreateSourceBody;
    
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
        error: errorResponse.body.message 
      });
    }
    
    logger.info('Creating payment source', {
      component: 'paymongo',
      operation: 'createSource',
      userId: body.userId,
      type: body.type,
      amount: body.amount,
    });
    
    // Convert to centavos
    const amountCentavos = toSmallestUnit(body.amount);
    
    // Validate amount limits
    const amountValidation = validateDepositAmount(amountCentavos);
    if (!amountValidation.isValid) {
      const errorResponse = createErrorResponse(
        ErrorType.VALIDATION,
        amountValidation.error || 'Invalid amount',
        { amount: body.amount, amountCentavos },
        res.getHeader('X-Request-ID') as string
      );
      return res.status(errorResponse.statusCode).json({ 
        success: false, 
        error: errorResponse.body.message 
      });
    }
    
    // Generate reference
    const reference = generateReference('SRC');
    
    // Build redirect URLs
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://topdog.gg';
    const successUrl = body.successUrl || `${baseUrl}/deposit/paymongo/callback?status=success`;
    const failureUrl = body.failureUrl || `${baseUrl}/deposit/paymongo/callback?status=failed`;
    
    // Create PayMongo source
    const result = await createSource({
      userId: body.userId,
      amount: amountCentavos,
      currency: 'PHP',
      type: body.type,
      redirect: {
        success: successUrl,
        failed: failureUrl,
      },
      billing: {
        email: body.email,
        name: body.name,
        phone: body.phone,
      },
      metadata: {
        firebaseUserId: body.userId,
        reference,
      },
    });
    
    // Create pending transaction record
    const transaction = await createPayMongoTransaction({
      userId: body.userId,
      type: 'deposit',
      amountSmallestUnit: amountCentavos,
      currency: 'PHP',
      status: 'pending',
      provider: 'paymongo',
      providerReference: result.sourceId,
      paymentMethodType: body.type,
      description: `Deposit via ${getPaymentMethodName(body.type)}`,
      metadata: {
        paymongoSourceId: result.sourceId,
        reference,
      },
    });
    
    const response = createSuccessResponse({
      success: true,
      sourceId: result.sourceId,
      checkoutUrl: result.checkoutUrl,
      transactionId: transaction.id,
    }, 200, logger);
    
    return res.status(response.statusCode).json(response.body);
  });
}

// ============================================================================
// HELPERS
// ============================================================================

function getPaymentMethodName(type: PayMongoSourceType): string {
  switch (type) {
    case 'gcash':
      return 'GCash';
    case 'grab_pay':
      return 'GrabPay';
    case 'paymaya':
      return 'Maya';
    default:
      return type;
  }
}


