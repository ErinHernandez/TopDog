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
  withErrorHandling, 
  validateMethod, 
  validateRequestBody,
  createErrorResponse,
  createSuccessResponse,
  ErrorType 
} from '../../../lib/apiErrorHandler';
import { requireBaseUrl } from '../../../lib/envHelpers';
import { captureError } from '../../../lib/errorTracking';
import { 
  createSource, 
  createPayMongoTransaction,
  generateReference,
} from '../../../lib/paymongo';
import { toSmallestUnit, validateDepositAmount } from '../../../lib/paymongo/currencyConfig';
import type { PayMongoSourceType } from '../../../lib/paymongo/paymongoTypes';
import { logger } from '../../../lib/structuredLogger';
import { paymongoCreateSourceBodySchema } from '../../../lib/validation/payment';

// ============================================================================
// TYPES
// ============================================================================

interface CreateSourceResponse {
  success: boolean;
  sourceId?: string;
  checkoutUrl?: string;
  transactionId?: string;
  error?: string;
}

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CreateSourceResponse>
): Promise<void> {
  await withErrorHandling(req, res, async (req, res, logger) => {
    validateMethod(req, ['POST'], logger);

    const body = validateRequestBody(req, paymongoCreateSourceBodySchema, logger);

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
        error: errorResponse.body.error.message 
      });
    }
    
    // Generate reference
    const reference = generateReference('SRC');
    
    // Build redirect URLs
    const baseUrl = requireBaseUrl();
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


