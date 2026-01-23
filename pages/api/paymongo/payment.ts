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
  await withErrorHandling(req, res, async (req, res, logger) => {
    // Validate HTTP method
    validateMethod(req, ['POST'], logger);
    
    // Check rate limit
    const rateLimitResult = await paymentCreateLimiter.check(req);
    const clientIP = getClientIP(req);
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', paymentCreateLimiter.config.maxRequests);
    res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining);
    res.setHeader('X-RateLimit-Reset', Math.floor(rateLimitResult.resetAt / 1000));
    
    if (!rateLimitResult.allowed) {
      const errorResponse = createErrorResponse(
        ErrorType.RATE_LIMIT,
        'Rate limit exceeded. Please try again later.',
        {},
        res.getHeader('X-Request-ID') as string
      );
      return res.status(errorResponse.statusCode).json({ 
        success: false, 
        error: errorResponse.body.error.message 
      });
    }
    
    // Validate required body fields
    validateBody(req, ['sourceId', 'userId'], logger);
    
    const body = req.body as CreatePaymentBody;
    
    logger.info('Creating payment from source', {
      component: 'paymongo',
      operation: 'createPayment',
      userId: body.userId,
      sourceId: body.sourceId,
    });
    
    // Get the source to verify it's chargeable
    const source = await getSource(body.sourceId);
    
    if (source.attributes.status !== 'chargeable') {
      const errorResponse = createErrorResponse(
        ErrorType.VALIDATION,
        `Source is not chargeable. Current status: ${source.attributes.status}`,
        { sourceId: body.sourceId, status: source.attributes.status },
        res.getHeader('X-Request-ID') as string
      );
      return res.status(errorResponse.statusCode).json({ 
        success: false, 
        error: errorResponse.body.error.message 
      });
    }
    
    // Verify user matches
    const sourceUserId = source.attributes.metadata?.firebaseUserId;
    if (sourceUserId !== body.userId) {
      const errorResponse = createErrorResponse(
        ErrorType.FORBIDDEN,
        'User mismatch',
        { sourceUserId, requestUserId: body.userId },
        res.getHeader('X-Request-ID') as string
      );
      return res.status(errorResponse.statusCode).json({ 
        success: false, 
        error: errorResponse.body.error.message 
      });
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
    
    const response = createSuccessResponse({
      success: true,
      paymentId: result.paymentId,
      status: result.status,
    }, 200, logger);
    
    return res.status(response.statusCode).json(response.body);
  });
};

// Export with authentication, CSRF protection, and rate limiting
import type { ApiHandler as AuthApiHandler } from '../../../lib/apiAuth';
type CSRFHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void;
export default withCSRFProtection(
  withAuth(
    withRateLimit(handler, paymentCreateLimiter) as unknown as AuthApiHandler,
    { required: true, allowAnonymous: false }
  ) as unknown as CSRFHandler
);


