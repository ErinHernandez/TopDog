/**
 * PayPal Withdrawal API
 *
 * POST /api/paypal/withdraw
 * Creates a PayPal withdrawal request
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { withErrorHandling, validateMethod } from '../../../lib/apiErrorHandler';
import { withCSRFProtection } from '../../../lib/csrfProtection';
import { verifyAuthToken } from '../../../lib/apiAuth';
import { requestWithdrawal } from '../../../lib/paypal/paypalWithdrawals';
import { logPaymentEvent } from '../../../lib/paypal/paypalService';
import { isPayPalEnabled } from '../../../lib/paypal/paypalClient';
import { getDb } from '../../../lib/firebase-utils';
import { doc, getDoc } from 'firebase/firestore';

interface WithdrawBody {
  amountCents: number;
  linkedAccountId: string;
  confirmationMethod?: 'email' | 'sms';
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

    const { amountCents, linkedAccountId, confirmationMethod } = req.body as WithdrawBody;

    // Validate amount
    if (!amountCents || typeof amountCents !== 'number' || amountCents <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Validate linked account ID
    if (!linkedAccountId || typeof linkedAccountId !== 'string') {
      return res.status(400).json({ error: 'Invalid linked account' });
    }

    // Get user's current balance
    const db = getDb();
    const userRef = doc(db, 'users', authResult.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    const currentBalance = userData.balanceCents || 0;

    // Check sufficient balance
    if (amountCents > currentBalance) {
      return res.status(400).json({
        error: 'Insufficient balance',
        currentBalance,
        requestedAmount: amountCents,
      });
    }

    // Process withdrawal request
    const result = await requestWithdrawal({
      userId: authResult.uid,
      amountCents,
      linkedAccountId,
      confirmationMethod,
    });

    // Log event
    await logPaymentEvent(authResult.uid, 'paypal_withdrawal_requested', {
      amountCents,
      linkedAccountId,
      securityTier: result.securityTier,
      success: result.success,
    });

    logger.info('PayPal withdrawal requested', {
      userId: authResult.uid,
      amountCents,
      securityTier: result.securityTier,
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
