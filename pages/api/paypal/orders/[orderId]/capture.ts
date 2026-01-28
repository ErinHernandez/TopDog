/**
 * PayPal Capture Order API
 *
 * POST /api/paypal/orders/[orderId]/capture
 * Captures an approved PayPal order
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { withErrorHandling, validateMethod } from '../../../../../lib/apiErrorHandler';
import { withCSRFProtection } from '../../../../../lib/csrfProtection';
import { verifyAuthToken } from '../../../../../lib/apiAuth';
import {
  capturePayPalOrder,
  updateUserBalance,
  createPayPalTransaction,
  logPaymentEvent,
} from '../../../../../lib/paypal/paypalService';
import { isPayPalEnabled } from '../../../../../lib/paypal/paypalClient';

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
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { orderId } = req.query;

    if (!orderId || typeof orderId !== 'string') {
      return res.status(400).json({ error: 'Invalid order ID' });
    }

    // Capture the order
    const result = await capturePayPalOrder(orderId, authResult.uid);

    if (!result.success) {
      logger.warn('PayPal capture failed', {
        userId: authResult.uid,
        orderId,
        error: result.error,
      });

      return res.status(400).json({
        success: false,
        error: result.error || 'Failed to capture payment',
      });
    }

    // Create transaction record
    const transaction = await createPayPalTransaction({
      userId: authResult.uid,
      type: 'deposit',
      amountCents: result.amountCents!,
      currency: 'USD',
      status: 'completed',
      paypalOrderId: orderId,
      paypalCaptureId: result.captureId,
      description: 'PayPal deposit',
    });

    // Update user balance (atomic)
    const balanceResult = await updateUserBalance(
      authResult.uid,
      result.amountCents!,
      'add',
      `paypal_capture_${result.captureId}`
    );

    if (!balanceResult.success) {
      logger.error('Failed to update user balance after capture', null, {
        userId: authResult.uid,
        orderId,
        captureId: result.captureId,
        error: balanceResult.error,
      });

      // The payment was captured but balance update failed
      // This should be handled by reconciliation
      return res.status(500).json({
        success: false,
        error: 'Payment was processed but balance update failed. Please contact support.',
        captureId: result.captureId,
      });
    }

    // Log success
    await logPaymentEvent(authResult.uid, 'paypal_capture_success', {
      orderId,
      captureId: result.captureId,
      amountCents: result.amountCents,
      newBalance: balanceResult.newBalance,
    });

    logger.info('PayPal capture successful', {
      userId: authResult.uid,
      orderId,
      captureId: result.captureId,
      amountCents: result.amountCents,
      newBalance: balanceResult.newBalance,
    });

    return res.status(200).json({
      success: true,
      captureId: result.captureId,
      amountCents: result.amountCents,
      newBalance: balanceResult.newBalance,
      transactionId: transaction.id,
    });
  });
}

// Export with CSRF protection
type CSRFHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void;
export default withCSRFProtection(handler as unknown as CSRFHandler);
