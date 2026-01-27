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
  markWebhookEventAsProcessed,
  markWebhookEventAsFailed,
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
import { RateLimiter } from '../../../lib/rateLimiter';
import { acquireWebhookLock } from '../../../lib/webhooks/atomicLock';

// ============================================================================
// RATE LIMITER FOR FAILED VERIFICATION ATTEMPTS
// ============================================================================

/**
 * SECURITY: Rate limit failed webhook signature verification attempts
 * This prevents brute force attacks on the webhook endpoint
 *
 * Configuration:
 * - 10 failed attempts allowed per minute per IP
 * - Fail-closed: If rate limiter fails, reject the request
 * - Circuit breaker after 5 consecutive failures
 */
const failedVerificationLimiter = new RateLimiter({
  endpoint: 'paystack_webhook_failed_verification',
  maxRequests: 10,
  windowMs: 60 * 1000, // 1 minute
  failClosed: true,
  circuitBreakerThreshold: 5,
  circuitBreakerResetMs: 30 * 1000,
});

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
      
      // Verify signature
      const isValid = verifyWebhookSignature(rawBody, signature || '');

      if (!signature || !isValid) {
        // SECURITY: Rate limit failed verification attempts to prevent brute force
        const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
                        req.socket?.remoteAddress ||
                        'unknown';

        const rateLimitResult = await failedVerificationLimiter.check({
          headers: { 'x-forwarded-for': clientIp },
          socket: { remoteAddress: clientIp },
        } as NextApiRequest);

        if (!rateLimitResult.allowed) {
          logger.warn('Paystack webhook brute force detected - rate limited', {
            component: 'paystack',
            operation: 'webhook',
            ip: clientIp,
            remaining: rateLimitResult.remaining,
            retryAfterMs: rateLimitResult.retryAfterMs,
          });

          // Return 429 for rate limited requests
          return res.status(429).json({
            received: false,
            error: 'Too many failed verification attempts',
          });
        }

        logger.warn('Invalid or missing signature', {
          component: 'paystack',
          operation: 'webhook',
          ip: clientIp,
          hasSignature: !!signature,
          failedAttempts: rateLimitResult.maxRequests - rateLimitResult.remaining,
        });

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

      // SECURITY: Acquire atomic lock to prevent duplicate processing
      // This eliminates race conditions between checking and processing
      const eventId = reference || `paystack_${Date.now()}`;
      const lock = await acquireWebhookLock(eventId, event, 'paystack', {
        reference,
      });

      if (!lock.acquired) {
        logger.info('Paystack webhook event already handled', {
          component: 'paystack',
          operation: 'webhook',
          eventId,
          event,
          reason: lock.reason,
        });

        // Return 200 to acknowledge receipt (prevents retries)
        return res.status(200).json({
          received: true,
          event,
          actions: [lock.reason === 'already_processed' ? 'duplicate_skipped' : 'already_processing'],
        });
      }

      // Handle events
      let result: { success: boolean; actions: string[] };

      try {
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

        // Release lock on successful processing
        await lock.releaseLock();

        // Also update legacy webhook event tracking for backward compatibility
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

      } catch (processingError) {
        // Mark lock as failed if processing fails
        const errMsg = processingError instanceof Error ? processingError.message : 'Unknown processing error';
        await lock.markFailed(errMsg);
        throw processingError; // Re-throw to outer catch
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

