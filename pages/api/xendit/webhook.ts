/**
 * Xendit Webhook Handler
 * 
 * Processes webhook events from Xendit:
 * - fva_paid: Virtual Account payment received
 * - ewallet.capture: E-wallet payment captured
 * - disbursement: Disbursement status update
 * 
 * POST /api/xendit/webhook
 * 
 * @module pages/api/xendit/webhook
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro';
import {
  verifyWebhookToken,
  handleVAPayment,
  handleEWalletCapture,
  handleDisbursementCallback,
} from '../../../lib/xendit';
import type { 
  VirtualAccountPaymentCallback,
  XenditEWalletCharge,
  DisbursementCallback,
} from '../../../lib/xendit/xenditTypes';
import { captureError } from '../../../lib/errorTracking';
import { logger } from '../../../lib/structuredLogger';

// ============================================================================
// CONFIG
// ============================================================================

// Disable body parsing for raw body access
export const config = {
  api: {
    bodyParser: false,
  },
};

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  // Only allow POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  try {
    // Get raw body
    const rawBody = await buffer(req);
    const bodyString = rawBody.toString();
    
    // Verify webhook token
    const webhookToken = req.headers['x-callback-token'] as string;
    
    if (!webhookToken || !verifyWebhookToken(webhookToken)) {
      logger.warn('Invalid or missing callback token', { component: 'xendit', operation: 'webhook' });
      res.status(401).json({ error: 'Invalid callback token' });
      return;
    }
    
    // Parse payload
    const payload = JSON.parse(bodyString);
    
    // Determine event type from payload structure
    let result: { success: boolean; actions: string[] };
    
    if (payload.payment_id && payload.callback_virtual_account_id) {
      // Virtual Account payment
      logger.info('Processing VA payment', {
        component: 'xendit',
        operation: 'webhook',
        paymentId: payload.payment_id,
        amount: payload.amount,
      });
      
      result = await handleVAPayment(payload as VirtualAccountPaymentCallback);
      
    } else if (payload.business_id && payload.channel_code) {
      // E-wallet capture
      logger.info('Processing e-wallet capture', {
        component: 'xendit',
        operation: 'webhook',
        chargeId: payload.id,
        status: payload.status,
        channelCode: payload.channel_code,
      });
      
      result = await handleEWalletCapture(payload as XenditEWalletCharge);
      
    } else if (payload.status && (payload.bank_code || payload.user_id)) {
      // Disbursement callback
      logger.info('Processing disbursement', {
        component: 'xendit',
        operation: 'webhook',
        disbursementId: payload.id,
        status: payload.status,
      });
      
      result = await handleDisbursementCallback(payload as DisbursementCallback);
      
    } else {
      // Unknown event type - only log safe metadata, not full payload
      logger.info('Unknown event type', { 
        component: 'xendit',
        operation: 'webhook',
        payloadKeys: Object.keys(payload),
        hasId: !!payload.id,
        hasStatus: !!payload.status,
      });
      result = { success: true, actions: ['unknown_event_type'] };
    }
    
    logger.info('Webhook processed', { 
      component: 'xendit',
      operation: 'webhook',
      success: result.success, 
      actions: result.actions,
    });
    
    res.status(200).json({ received: true, ...result });
    
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    logger.error('Webhook processing error', err, { component: 'xendit', operation: 'webhook' });
    await captureError(err, {
      tags: { component: 'xendit', operation: 'webhook' },
    });
    
    // Return 200 to prevent Xendit from retrying
    res.status(200).json({ 
      received: true, 
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}


