/**
 * PayPal Orders API
 *
 * POST /api/paypal/orders
 * Creates a PayPal order for deposit
 */

import type { NextApiRequest, NextApiResponse } from 'next';

import { verifyAuthToken } from '../../../lib/apiAuth';
import { withErrorHandling, validateMethod, validateRequestBody } from '../../../lib/apiErrorHandler';
import { withCSRFProtection } from '../../../lib/csrfProtection';
import { isPayPalEnabled } from '../../../lib/paypal/paypalClient';
import { createPayPalOrder, assessPaymentRisk, logPaymentEvent } from '../../../lib/paypal/paypalService';
import { PAYPAL_DEPOSIT_LIMITS } from '../../../lib/paypal/paypalTypes';
import type { PayPalRiskContext } from '../../../lib/paypal/paypalTypes';
import { paypalCreateOrderSchema } from '../../../lib/validation/schemas';

interface CreateOrderBody {
  amountCents: number;
  riskContext?: PayPalRiskContext;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  return withErrorHandling(req, res, async (req, res, logger) => {
    validateMethod(req, ['POST'], logger);

    // Check if PayPal is enabled
    if (!isPayPalEnabled()) {
      return res.status(503).json({
        error: 'PayPal payments are not currently available',
      });
    }

    // Verify user authentication
    const authResult = await verifyAuthToken(req.headers.authorization);
    if (!authResult.uid) {
      return res.status(401).json({ error: authResult.error || 'Unauthorized' });
    }

    // SECURITY: Validate request body using Zod schema
    const body = validateRequestBody(req, paypalCreateOrderSchema, logger);
    const { amountCents, riskContext = {} } = body;

    if (amountCents < PAYPAL_DEPOSIT_LIMITS.minAmountCents) {
      return res.status(400).json({
        error: `Minimum deposit is $${PAYPAL_DEPOSIT_LIMITS.minAmountCents / 100}. This is the cost of one draft entry.`,
      });
    }

    if (amountCents > PAYPAL_DEPOSIT_LIMITS.maxAmountCents) {
      return res.status(400).json({
        error: `Maximum deposit is $${PAYPAL_DEPOSIT_LIMITS.maxAmountCents / 100} (150 drafts).`,
      });
    }

    // Risk assessment
    const risk = await assessPaymentRisk(authResult.uid, amountCents, {
      ...riskContext,
      ipAddress: (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress,
    });

    if (risk.recommendation === 'decline') {
      logger.warn('Payment declined due to risk assessment', {
        userId: authResult.uid,
        amountCents,
        riskScore: risk.score,
        riskFactors: risk.factors,
      });
      return res.status(403).json({
        error: 'Transaction declined for security reasons. Please contact support if you believe this is an error.',
      });
    }

    // Create PayPal order
    const order = await createPayPalOrder({
      amountCents,
      currency: 'USD',
      userId: authResult.uid,
      idempotencyKey: `paypal_order_${authResult.uid}_${Date.now()}`,
      metadata: {
        riskScore: risk.score.toString(),
      },
    });

    // Log event
    await logPaymentEvent(authResult.uid, 'paypal_order_created', {
      orderId: order.orderId,
      amountCents,
      riskScore: risk.score,
    });

    logger.info('PayPal order created', {
      userId: authResult.uid,
      orderId: order.orderId,
      amountCents,
    });

    return res.status(200).json(order);
  });
}

// Export with CSRF protection
type CSRFHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void;
export default withCSRFProtection(handler as unknown as CSRFHandler);
