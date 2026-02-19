/**
 * PayPal Withdrawal Confirmation API
 *
 * POST /api/paypal/withdraw/confirm
 * Confirms a pending withdrawal with the provided confirmation code
 */

import type { NextApiRequest, NextApiResponse } from 'next';

import { verifyAuthToken } from '../../../../lib/apiAuth';
import { withErrorHandling, validateMethod } from '../../../../lib/apiErrorHandler';
import { withCSRFProtection } from '../../../../lib/csrfProtection';
import { isPayPalEnabled } from '../../../../lib/paypal/paypalClient';
import { logPaymentEvent } from '../../../../lib/paypal/paypalService';
import { confirmWithdrawal } from '../../../../lib/paypal/paypalWithdrawals';

interface ConfirmBody {
  pendingId: string;
  confirmationCode: string;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  return withErrorHandling(req, res, async (req, res, logger) => {
    validateMethod(req, ['POST'], logger);

    // Check if PayPal is enabled
    if (!isPayPalEnabled()) {
      return res.status(503).json({
        error: 'PayPal withdrawals are not currently available',
      });
    }

    // Verify user authentication
    const authResult = await verifyAuthToken(req.headers.authorization);
    if (!authResult.uid) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { pendingId, confirmationCode } = req.body as ConfirmBody;

    // Validate inputs
    if (!pendingId || typeof pendingId !== 'string') {
      return res.status(400).json({ error: 'Invalid pending withdrawal ID' });
    }

    if (!confirmationCode || typeof confirmationCode !== 'string') {
      return res.status(400).json({ error: 'Invalid confirmation code' });
    }

    // Confirm the withdrawal
    const result = await confirmWithdrawal(pendingId, confirmationCode, authResult.uid);

    // Log event
    await logPaymentEvent(authResult.uid, 'paypal_withdrawal_confirmed', {
      pendingId,
      success: result.success,
    });

    logger.info('PayPal withdrawal confirmation attempted', {
      userId: authResult.uid,
      pendingId,
      success: result.success,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  });
}

// Export with CSRF protection
type CSRFHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void;
export default withCSRFProtection(handler as unknown as CSRFHandler);
