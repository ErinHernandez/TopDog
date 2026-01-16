/**
 * Paystack Webhook Handler
 * 
 * Processes Paystack webhook events for:
 * - charge.success: Successful payments (credits user balance)
 * - charge.failed: Failed payments (updates transaction to failed status)
 * - transfer.success: Successful withdrawals
 * - transfer.failed: Failed withdrawals (restores user balance)
 * - transfer.reversed: Reversed withdrawals (restores user balance)
 * 
 * POST /api/paystack/webhook
 * 
 * @module pages/api/paystack/webhook
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import {
  verifyWebhookSignature,
  handleChargeSuccess,
  handleChargeFailed,
  handleTransferSuccess,
  handleTransferFailed,
  findWebhookEventByReference,
  markWebhookEventAsProcessed,
  markWebhookEventAsFailed,
  createOrUpdateWebhookEvent,
} from '../../../lib/paystack';
import type {
  PaystackWebhookPayload,
  ChargeSuccessWebhookData,
  ChargeFailedWebhookData,
  TransferWebhookData,
} from '../../../lib/paystack/paystackTypes';
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
// CONFIGURATION
// ============================================================================

// Disable body parsing to get raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

// ============================================================================
// TYPES
// ============================================================================

interface WebhookResponse {
  received: boolean;
  event?: string;
  actions?: string[];
  error?: string;
}

// ============================================================================
// RAW BODY PARSER
// ============================================================================

/**
 * Read raw body from request
 */
async function readRawBody(req: NextApiRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      resolve(data);
    });
    req.on('error', reject);
  });
}

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<WebhookResponse>
) {
  return withErrorHandling(req, res, async (req, res, logger) => {
    // Validate HTTP method
    validateMethod(req, ['POST'], logger);
    
    try {
      // Read raw body (must be done before signature verification)
      const rawBody = await readRawBody(req);
      
      // Get signature from headers
      const signature = req.headers['x-paystack-signature'] as string;
      
      if (!signature) {
        logger.warn('Missing signature header', { component: 'paystack', operation: 'webhook' });
        const errorResponse = createErrorResponse(
          ErrorType.UNAUTHORIZED,
          'Missing signature',
          {},
          res.getHeader('X-Request-ID') as string
        );
        return res.status(errorResponse.statusCode).json({
          received: false,
          error: errorResponse.body.error.message,
        });
      }
      
      // Verify signature
      const isValid = verifyWebhookSignature(rawBody, signature);
      
      if (!isValid) {
        logger.warn('Invalid signature', { component: 'paystack', operation: 'webhook' });
        const errorResponse = createErrorResponse(
          ErrorType.UNAUTHORIZED,
          'Invalid signature',
          {},
          res.getHeader('X-Request-ID') as string
        );
        return res.status(errorResponse.statusCode).json({
          received: false,
          error: errorResponse.body.error.message,
        });
      }
      
      // Parse body
      const payload = JSON.parse(rawBody) as PaystackWebhookPayload;
      const { event, data } = payload;

      // Extract reference for deduplication
      // Paystack uses 'reference' for charges and 'transfer_code' for transfers
      const reference = (data as { reference?: string; transfer_code?: string }).reference ||
                       (data as { reference?: string; transfer_code?: string }).transfer_code ||
                       '';

      logger.info('Received webhook event', {
        component: 'paystack',
        operation: 'webhook',
        event,
        reference,
      });

      // Check for duplicate event (replay protection)
      if (reference) {
        const existingEvent = await findWebhookEventByReference(reference, event);
        if (existingEvent?.status === 'processed') {
          logger.info('Duplicate webhook event - already processed', {
            component: 'paystack',
            operation: 'webhook',
            event,
            reference,
          });
          return res.status(200).json({
            received: true,
            event,
            actions: ['duplicate_skipped'],
          });
        }

        // Create/update event record for tracking
        await createOrUpdateWebhookEvent(reference, event, {
          receivedAt: new Date().toISOString(),
        });
      }

      // Handle events
      let result: { success: boolean; actions: string[] };

      switch (event) {
        case 'charge.success':
          result = await handleChargeSuccess(data as ChargeSuccessWebhookData);
          break;
          
        case 'charge.failed':
          result = await handleChargeFailed(data as ChargeFailedWebhookData);
          break;
          
        case 'transfer.success':
          result = await handleTransferSuccess(data as TransferWebhookData);
          break;
          
        case 'transfer.failed':
        case 'transfer.reversed':
          result = await handleTransferFailed(data as TransferWebhookData);
          break;
          
        default:
          // Log unhandled events
          logger.info('Unhandled event type', { component: 'paystack', operation: 'webhook', event });
          result = { success: true, actions: ['unhandled_event'] };
      }

      // Mark event as processed or failed
      if (reference) {
        if (result.success) {
          await markWebhookEventAsProcessed(reference, event, {
            actions: result.actions,
          });
        } else {
          await markWebhookEventAsFailed(reference, event, 'Processing failed', {
            actions: result.actions,
          });
        }
      }

      // Respond to Paystack with success
      const response = createSuccessResponse({
        received: true,
        event,
        actions: result.actions,
      }, 200, logger);

      return res.status(response.statusCode).json(response.body);
      
    } catch (error) {
      // For webhooks, we must always return 200 to prevent retries
      // Log the error for investigation but don't let it propagate
      logger.error('Webhook processing error', error as Error, { component: 'paystack', operation: 'webhook' });
      await captureError(error as Error, {
        tags: { component: 'paystack', operation: 'webhook' },
      });
      
      // Always return 200 to prevent Paystack from retrying
      // This is a webhook-specific requirement
      return res.status(200).json({
        received: true,
        error: 'Processing error - logged for investigation',
      });
    }
  });
}

