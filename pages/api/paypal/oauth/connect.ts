/**
 * PayPal OAuth Connect API
 *
 * GET /api/paypal/oauth/connect
 * Initiates PayPal OAuth flow for account linking
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyAuthToken } from '../../../../lib/apiAuth';
import { getPayPalOAuthUrl } from '../../../../lib/paypal/paypalOAuth';
import { isPayPalEnabled } from '../../../../lib/paypal/paypalClient';
import { serverLogger } from '../../../../lib/logger/serverLogger';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if PayPal is enabled
    if (!isPayPalEnabled()) {
      return res.status(503).json({
        error: 'PayPal is not currently available',
      });
    }

    // Verify user authentication
    const authResult = await verifyAuthToken(req.headers.authorization);
    if (!authResult.uid) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Generate OAuth URL
    const authUrl = await getPayPalOAuthUrl(authResult.uid);

    serverLogger.info('PayPal OAuth initiated', { userId: authResult.uid });

    // Redirect to PayPal
    return res.redirect(authUrl);
  } catch (error) {
    serverLogger.error('PayPal OAuth connect error', error as Error);

    return res.redirect('/settings/payments?error=paypal_oauth_failed');
  }
}
