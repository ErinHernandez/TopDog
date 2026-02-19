/**
 * PayPal OAuth Callback API
 *
 * GET /api/paypal/oauth/callback
 * Handles PayPal OAuth callback after user authorization
 */

import type { NextApiRequest, NextApiResponse } from 'next';

import { serverLogger } from '../../../../lib/logger/serverLogger';
import { handlePayPalOAuthCallback } from '../../../../lib/paypal/paypalOAuth';
import { logPaymentEvent } from '../../../../lib/paypal/paypalService';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, state, error, error_description } = req.query;

  // Handle user denial
  if (error) {
    serverLogger.warn('PayPal OAuth denied by user', null, {
      error,
      error_description,
    });
    return res.redirect('/settings/payments?error=paypal_oauth_denied');
  }

  // Validate required parameters
  if (!code || !state) {
    serverLogger.warn('PayPal OAuth callback missing parameters');
    return res.redirect('/settings/payments?error=paypal_oauth_invalid');
  }

  try {
    // Handle the OAuth callback
    const linkedAccount = await handlePayPalOAuthCallback(
      code as string,
      state as string
    );

    // Log success
    await logPaymentEvent(linkedAccount.userId, 'paypal_account_linked', {
      paypalEmail: linkedAccount.paypalEmail,
      accountId: linkedAccount.id,
    });

    serverLogger.info('PayPal account linked successfully', {
      userId: linkedAccount.userId,
      paypalEmail: linkedAccount.paypalEmail,
    });

    // Redirect to success page
    return res.redirect('/settings/payments?success=paypal_connected');
  } catch (error) {
    const errorMessage = (error as Error).message;

    serverLogger.error('PayPal OAuth callback error', error as Error);

    // Determine error type for user feedback
    let errorCode = 'paypal_oauth_failed';
    if (errorMessage.includes('already linked')) {
      errorCode = 'paypal_already_linked';
    } else if (errorMessage.includes('expired')) {
      errorCode = 'paypal_oauth_expired';
    }

    return res.redirect(`/settings/payments?error=${errorCode}`);
  }
}
