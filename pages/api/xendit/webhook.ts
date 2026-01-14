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
import { 
  withErrorHandling, 
  validateMethod, 
  createErrorResponse,
  createSuccessResponse,
  ErrorType 
} from '../../../lib/apiErrorHandler';

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
  await withErrorHandling(req, res, async (req, res, logger) => {
    // Validate HTTP method
    validateMethod(req, ['POST'], logger);
    
    try {
      // Get raw body
      const rawBody = await buffer(req);
      const bodyString = rawBody.toString();
      
      // Verify webhook token
      const webhookToken = req.headers['x-callback-token'] as string;
      
      if (!webhookToken || !verifyWebhookToken(webhookToken)) {
        logger.warn('Invalid or missing callback token', { component: 'xendit', operation: 'webhook' });
        const errorResponse = createErrorResponse(
          ErrorType.UNAUTHORIZED,
          'Invalid callback token',
          {},
          res.getHeader('X-Request-ID') as string
        );
        return res.status(errorResponse.statusCode).json({ error: errorResponse.body.error.message });
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
      
      const response = createSuccessResponse({
        received: true,
        success: result.success,
        actions: result.actions,
      }, 200, logger);
      
      return res.status(response.statusCode).json(response.body);
      
    } catch (error) {
      // For webhooks, we must always return 200 to prevent retries
      // Log the error for investigation but don't let it propagate
      const err = error instanceof Error ? error : new Error('Unknown error');
      logger.error('Webhook processing error', err, { component: 'xendit', operation: 'webhook' });
      await captureError(err, {
        tags: { component: 'xendit', operation: 'webhook' },
      });
      
      // Always return 200 to prevent Xendit from retrying
      // This is a webhook-specific requirement
      return res.status(200).json({ 
        received: true, 
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}


