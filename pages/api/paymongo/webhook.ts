/**
 * PayMongo Webhook Handler
 * 
 * Processes webhook events from PayMongo:
 * - source.chargeable: Source ready to be charged
 * - payment.paid: Payment successful
 * - payment.failed: Payment failed
 * - payout.paid: Payout successful
 * - payout.failed: Payout failed
 * 
 * POST /api/paymongo/webhook
 * 
 * @module pages/api/paymongo/webhook
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro';
import {
  verifyWebhookSignature,
  handleSourceChargeable,
  handlePaymentPaid,
  handlePaymentFailed,
  handlePayoutPaid,
  handlePayoutFailed,
} from '../../../lib/paymongo';
import type { 
  PayMongoWebhookPayload, 
  PayMongoSourceAttributes,
  PayMongoPaymentAttributes,
  PayMongoPayoutAttributes,
} from '../../../lib/paymongo/paymongoTypes';
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

// Disable body parsing for webhook signature verification
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
      // Get raw body for signature verification
      const rawBody = await buffer(req);
      const signature = req.headers['paymongo-signature'] as string;
      
      if (!signature) {
        logger.warn('Missing signature', { component: 'paymongo', operation: 'webhook' });
        const errorResponse = createErrorResponse(
          ErrorType.VALIDATION,
          'Missing signature',
          {},
          res.getHeader('X-Request-ID') as string
        );
        return res.status(errorResponse.statusCode).json({ error: errorResponse.body.error.message });
      }
      
      // Verify signature
      const isValid = verifyWebhookSignature(rawBody, signature);
      
      if (!isValid) {
        logger.warn('Invalid signature', { component: 'paymongo', operation: 'webhook' });
        const errorResponse = createErrorResponse(
          ErrorType.UNAUTHORIZED,
          'Invalid signature',
          {},
          res.getHeader('X-Request-ID') as string
        );
        return res.status(errorResponse.statusCode).json({ error: errorResponse.body.error.message });
      }
      
      // Parse payload
      const payload: PayMongoWebhookPayload = JSON.parse(rawBody.toString());
      const eventType = payload.data.attributes.type;
      const eventData = payload.data.attributes.data;
      
      logger.info('Processing webhook event', { 
        component: 'paymongo',
        operation: 'webhook',
        eventType,
        eventId: payload.data.id,
        dataId: eventData.id,
      });
      
      let result: { success: boolean; actions: string[] };
      
      // Route to appropriate handler
      switch (eventType) {
        case 'source.chargeable':
          result = await handleSourceChargeable({
            id: eventData.id,
            ...(eventData.attributes as PayMongoSourceAttributes),
          });
          break;
          
        case 'payment.paid':
          result = await handlePaymentPaid({
            id: eventData.id,
            ...(eventData.attributes as PayMongoPaymentAttributes),
          });
          break;
          
        case 'payment.failed':
          result = await handlePaymentFailed({
            id: eventData.id,
            ...(eventData.attributes as PayMongoPaymentAttributes),
          });
          break;
          
        case 'payout.paid':
          result = await handlePayoutPaid({
            id: eventData.id,
            ...(eventData.attributes as PayMongoPayoutAttributes),
          });
          break;
          
        case 'payout.failed':
          result = await handlePayoutFailed({
            id: eventData.id,
            ...(eventData.attributes as PayMongoPayoutAttributes),
          });
          break;
          
        case 'source.expired':
        case 'source.failed':
        case 'source.cancelled':
          // Handle source expiration/failure
          logger.info('Source event', { 
            component: 'paymongo',
            operation: 'webhook',
            eventType,
            dataId: eventData.id,
          });
          result = { success: true, actions: ['source_terminated'] };
          break;
          
        default:
          logger.info('Unhandled event type', { 
            component: 'paymongo',
            operation: 'webhook',
            eventType,
          });
          result = { success: true, actions: ['unhandled_event'] };
      }
      
      logger.info('Webhook event processed', { 
        component: 'paymongo',
        operation: 'webhook',
        eventType,
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
      logger.error('Webhook processing error', err, { component: 'paymongo', operation: 'webhook' });
      await captureError(err, {
        tags: { component: 'paymongo', operation: 'webhook' },
      });
      
      // Always return 200 to prevent PayMongo from retrying
      // This is a webhook-specific requirement
      return res.status(200).json({ 
        received: true, 
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}


