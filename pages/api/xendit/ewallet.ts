/**
 * Xendit E-Wallet API
 * 
 * Creates an e-wallet charge for OVO, GoPay, DANA, ShopeePay.
 * Returns checkout URL or QR code for payment.
 * 
 * POST /api/xendit/ewallet
 * 
 * @module pages/api/xendit/ewallet
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
import { logger } from '../../../lib/structuredLogger';
import { xenditCreateEWalletChargeBodySchema } from '../../../lib/validation/payment';
import { 
  createEWalletCharge, 
  createXenditTransaction,
  generateReference,
} from '../../../lib/xendit';
import { validateDepositAmount } from '../../../lib/xendit/currencyConfig';

// ============================================================================
// TYPES
// ============================================================================

interface CreateEWalletResponse {
  success: boolean;
  chargeId?: string;
  status?: string;
  checkoutUrl?: string;
  mobileDeeplink?: string;
  qrString?: string;
  transactionId?: string;
  error?: string;
}

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CreateEWalletResponse>
): Promise<void> {
  await withErrorHandling(req, res, async (req, res, logger) => {
    validateMethod(req, ['POST'], logger);

    const body = validateRequestBody(req, xenditCreateEWalletChargeBodySchema, logger);

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
    
    logger.info('Creating e-wallet charge', {
      component: 'xendit',
      operation: 'createEWalletCharge',
      userId: body.userId,
      channelCode: body.channelCode,
      amount: body.amount,
    });
    
    // Generate reference
    const reference = generateReference('EW');
    
    // Build redirect URLs
    const baseUrl = requireBaseUrl();
    const successUrl = body.successUrl || `${baseUrl}/deposit/xendit/callback?status=success`;
    const failureUrl = body.failureUrl || `${baseUrl}/deposit/xendit/callback?status=failed`;
    
    // Build channel properties
    const channelProperties: Record<string, string> = {
      success_redirect_url: successUrl,
      failure_redirect_url: failureUrl,
    };
    
    // Add mobile number for OVO
    if (body.mobileNumber) {
      // Ensure proper format (+62...)
      let phone = body.mobileNumber.replace(/\D/g, '');
      if (phone.startsWith('0')) {
        phone = `62${  phone.substring(1)}`;
      }
      if (!phone.startsWith('62')) {
        phone = `62${  phone}`;
      }
      channelProperties.mobile_number = `+${  phone}`;
    }
    
    // Create e-wallet charge
    const result = await createEWalletCharge({
      userId: body.userId,
      reference_id: reference,
      currency: 'IDR',
      amount: body.amount,
      checkout_method: 'ONE_TIME_PAYMENT',
      channel_code: body.channelCode,
      channel_properties: channelProperties,
      metadata: {
        firebaseUserId: body.userId,
        reference,
      },
    });
    
    // Create pending transaction record
    const transaction = await createXenditTransaction({
      userId: body.userId,
      type: 'deposit',
      amountSmallestUnit: body.amount,
      currency: 'IDR',
      status: 'pending',
      provider: 'xendit',
      providerReference: result.chargeId,
      paymentMethodType: body.channelCode.toLowerCase(),
      actionUrl: result.checkoutUrl || result.mobileDeeplink,
      description: `Deposit via ${body.channelCode.replace('ID_', '')}`,
      metadata: {
        xenditChargeId: result.chargeId,
        channelCode: body.channelCode,
        reference,
      },
    });
    
    const response = createSuccessResponse({
      success: true,
      chargeId: result.chargeId,
      status: result.status,
      checkoutUrl: result.checkoutUrl,
      mobileDeeplink: result.mobileDeeplink,
      qrString: result.qrString,
      transactionId: transaction.id,
    }, 200, logger);
    
    return res.status(response.statusCode).json(response.body);
  });
}


