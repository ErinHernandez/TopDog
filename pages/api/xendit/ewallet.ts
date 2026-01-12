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
  createEWalletCharge, 
  createXenditTransaction,
  generateReference,
} from '../../../lib/xendit';
import { validateDepositAmount } from '../../../lib/xendit/currencyConfig';
import type { XenditEWalletChannel } from '../../../lib/xendit/xenditTypes';
import { captureError } from '../../../lib/errorTracking';
import { logger } from '../../../lib/structuredLogger';

// ============================================================================
// TYPES
// ============================================================================

interface CreateEWalletBody {
  /** Amount in IDR */
  amount: number;
  /** E-wallet channel: ID_OVO, ID_GOPAY, ID_DANA, ID_SHOPEEPAY */
  channelCode: XenditEWalletChannel;
  /** Firebase user ID */
  userId: string;
  /** Mobile number (required for OVO) */
  mobileNumber?: string;
  /** Success redirect URL */
  successUrl?: string;
  /** Failure redirect URL */
  failureUrl?: string;
}

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
// VALIDATION
// ============================================================================

const VALID_CHANNELS: XenditEWalletChannel[] = [
  'ID_OVO', 'ID_GOPAY', 'ID_DANA', 'ID_SHOPEEPAY', 'ID_LINKAJA',
];

function validateRequest(body: CreateEWalletBody): { valid: boolean; error?: string } {
  if (!body.amount || typeof body.amount !== 'number' || body.amount <= 0) {
    return { valid: false, error: 'Invalid amount' };
  }
  
  if (!body.channelCode || !VALID_CHANNELS.includes(body.channelCode)) {
    return { valid: false, error: `Invalid channel. Must be one of: ${VALID_CHANNELS.join(', ')}` };
  }
  
  if (!body.userId || typeof body.userId !== 'string') {
    return { valid: false, error: 'User ID is required' };
  }
  
  // OVO requires mobile number
  if (body.channelCode === 'ID_OVO' && !body.mobileNumber) {
    return { valid: false, error: 'Mobile number is required for OVO' };
  }
  
  return { valid: true };
}

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CreateEWalletResponse>
): Promise<void> {
  // Only allow POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }
  
  try {
    const body = req.body as CreateEWalletBody;
    
    // Validate request
    const validation = validateRequest(body);
    if (!validation.valid) {
      res.status(400).json({ success: false, error: validation.error });
      return;
    }
    
    // Validate amount limits
    const amountValidation = validateDepositAmount(body.amount);
    if (!amountValidation.isValid) {
      res.status(400).json({ success: false, error: amountValidation.error });
      return;
    }
    
    // Generate reference
    const reference = generateReference('EW');
    
    // Build redirect URLs
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://topdog.gg';
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
        phone = '62' + phone.substring(1);
      }
      if (!phone.startsWith('62')) {
        phone = '62' + phone;
      }
      channelProperties.mobile_number = '+' + phone;
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
    
    res.status(200).json({
      success: true,
      chargeId: result.chargeId,
      status: result.status,
      checkoutUrl: result.checkoutUrl,
      mobileDeeplink: result.mobileDeeplink,
      qrString: result.qrString,
      transactionId: transaction.id,
    });
    
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    logger.error('E-wallet charge creation error', err, {
      component: 'xendit',
      operation: 'createEWalletCharge',
    });
    await captureError(err, {
      tags: { component: 'xendit', operation: 'createEWalletCharge' },
    });
    
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to create e-wallet charge',
    });
  }
}


