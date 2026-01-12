/**
 * PayMongo Payment API
 * 
 * Creates a payment from a chargeable source.
 * Called after user completes e-wallet authorization.
 * 
 * POST /api/paymongo/payment
 * 
 * @module pages/api/paymongo/payment
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { 
  createPayment,
  getSource,
  findTransactionBySourceId,
  updateTransactionStatus,
} from '../../../lib/paymongo';
import { captureError } from '../../../lib/errorTracking';
import { logger } from '../../../lib/structuredLogger';
import { withAuth } from '../../../lib/apiAuth';
import { createPaymentRateLimiter, withRateLimit } from '../../../lib/rateLimitConfig';
import { withCSRFProtection } from '../../../lib/csrfProtection';
import { logPaymentTransaction, getClientIP } from '../../../lib/securityLogger';

// ============================================================================
// TYPES
// ============================================================================

interface CreatePaymentBody {
  /** Source ID from the initial source creation */
  sourceId: string;
  /** Firebase user ID */
  userId: string;
  /** Description (optional) */
  description?: string;
}

interface CreatePaymentResponse {
  success: boolean;
  paymentId?: string;
  status?: string;
  error?: string;
}

// ============================================================================
// HANDLER
// ============================================================================

// Create rate limiter for payment creation
const paymentCreateLimiter = createPaymentRateLimiter('createPaymentIntent');

const handler = async function(
  req: NextApiRequest,
  res: NextApiResponse<CreatePaymentResponse>
): Promise<void> {
  // Only allow POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }
  
  // Check rate limit
  const rateLimitResult = await paymentCreateLimiter.check(req);
  const clientIP = getClientIP(req);
  
  // Set rate limit headers
  res.setHeader('X-RateLimit-Limit', paymentCreateLimiter.config.maxRequests);
  res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining);
  res.setHeader('X-RateLimit-Reset', Math.floor(rateLimitResult.resetAt / 1000));
  
  if (!rateLimitResult.allowed) {
    res.status(429).json({ 
      success: false, 
      error: 'Rate limit exceeded. Please try again later.' 
    });
    return;
  }
  
  try {
    const body = req.body as CreatePaymentBody;
    
    // Validate request
    if (!body.sourceId || typeof body.sourceId !== 'string') {
      res.status(400).json({ success: false, error: 'Source ID is required' });
      return;
    }
    
    if (!body.userId || typeof body.userId !== 'string') {
      res.status(400).json({ success: false, error: 'User ID is required' });
      return;
    }
    
    // Get the source to verify it's chargeable
    const source = await getSource(body.sourceId);
    
    if (source.attributes.status !== 'chargeable') {
      res.status(400).json({ 
        success: false, 
        error: `Source is not chargeable. Current status: ${source.attributes.status}` 
      });
      return;
    }
    
    // Verify user matches
    const sourceUserId = source.attributes.metadata?.firebaseUserId;
    if (sourceUserId !== body.userId) {
      res.status(403).json({ success: false, error: 'User mismatch' });
      return;
    }
    
    // Find existing transaction
    const existingTx = await findTransactionBySourceId(body.sourceId);
    
    // Create payment from source
    const result = await createPayment({
      userId: body.userId,
      amount: source.attributes.amount,
      currency: source.attributes.currency,
      source: {
        id: body.sourceId,
        type: 'source',
      },
      description: body.description || 'Deposit via PayMongo',
      metadata: {
        firebaseUserId: body.userId,
      },
    });
    
    // Log payment transaction
    await logPaymentTransaction(
      body.userId,
      result.paymentId,
      source.attributes.amount,
      source.attributes.currency,
      result.status,
      { provider: 'paymongo', sourceId: body.sourceId },
      clientIP
    );
    
    // Update transaction with payment ID
    if (existingTx) {
      await updateTransactionStatus(
        existingTx.id,
        result.status === 'paid' ? 'completed' : 'processing'
      );
    }
    
    res.status(200).json({
      success: true,
      paymentId: result.paymentId,
      status: result.status,
    });
    
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    logger.error('Payment creation error', err, {
      component: 'paymongo',
      operation: 'createPayment',
    });
    await captureError(err, {
      tags: { component: 'paymongo', operation: 'createPayment' },
    });
    
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to create payment',
    });
  }
};

// Export with authentication, CSRF protection, and rate limiting
export default withCSRFProtection(
  withAuth(
    withRateLimit(handler, paymentCreateLimiter),
    { required: true, allowAnonymous: false }
  )
);


