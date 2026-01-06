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
  // Only allow POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }
  
  try {
    const body = req.body as CreateSourceBody;
    
    // Validate request
    const validation = validateRequest(body);
    if (!validation.valid) {
      res.status(400).json({ success: false, error: validation.error });
      return;
    }
    
    // Convert to centavos
    const amountCentavos = toSmallestUnit(body.amount);
    
    // Validate amount limits
    const amountValidation = validateDepositAmount(amountCentavos);
    if (!amountValidation.isValid) {
      res.status(400).json({ success: false, error: amountValidation.error });
      return;
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
    
    res.status(200).json({
      success: true,
      sourceId: result.sourceId,
      checkoutUrl: result.checkoutUrl,
      transactionId: transaction.id,
    });
    
  } catch (error) {
    await captureError(error instanceof Error ? error : new Error('Unknown error'), {
      tags: { component: 'paymongo', operation: 'createSource' },
    });
    
    console.error('[PayMongo Source API] Error:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create payment source',
    });
  }
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


