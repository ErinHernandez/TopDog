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
  withErrorHandling,
  validateMethod,
  createErrorResponse,
  createSuccessResponse,
  ErrorType
} from '../../../lib/apiErrorHandler';
import { captureError } from '../../../lib/errorTracking';
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
import { RateLimiter } from '../../../lib/rateLimiter';
import { logger } from '../../../lib/structuredLogger';
import { acquireWebhookLock } from '../../../lib/webhooks/atomicLock';

// ============================================================================
// RATE LIMITER FOR FAILED VERIFICATION ATTEMPTS
// ============================================================================

/**
 * SECURITY FIX (Bug #5): Rate limit ALL webhook requests BEFORE processing
 *
 * The previous implementation only rate-limited after signature verification failed,
 * allowing attackers to consume server resources (CPU for signature verification,
 * memory for body parsing) before being rate-limited.
 *
 * This fix adds a general rate limiter that runs BEFORE any processing.
 *
 * Configuration:
 * - 100 requests per minute per IP for general rate limiting
 * - 10 failed verification attempts per minute per IP (stricter)
 * - Fail-closed: If rate limiter fails, reject the request
 * - Circuit breaker after 5 consecutive failures
 */
const generalWebhookLimiter = new RateLimiter({
  endpoint: 'paystack_webhook_general',
  maxRequests: 100, // Allow legitimate high volume from Paystack
  windowMs: 60 * 1000, // 1 minute
  failClosed: true,
  circuitBreakerThreshold: 5,
  circuitBreakerResetMs: 30 * 1000,
});

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

// FIX B: Webhook secret configuration
const PAYSTACK_WEBHOOK_SECRET = process.env.PAYSTACK_WEBHOOK_SECRET;

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

    // FIX B: Validate PAYSTACK_WEBHOOK_SECRET exists BEFORE processing
    if (!PAYSTACK_WEBHOOK_SECRET) {
      logger.error('Webhook secret not configured', new Error('PAYSTACK_WEBHOOK_SECRET missing'), {
        component: 'paystack',
        operation: 'webhook_config',
      });
      return res.status(500).json({
        received: false,
        error: 'Webhook configuration error - PAYSTACK_WEBHOOK_SECRET not set'
      });
    }

    // Get client IP for rate limiting
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
                    req.socket?.remoteAddress ||
                    'unknown';

    // SECURITY FIX (Bug #5): Rate limit BEFORE any processing to prevent resource exhaustion
    // This check must happen before signature verification or body parsing
    const generalRateLimitResult = await generalWebhookLimiter.check({
      headers: { 'x-forwarded-for': clientIp },
      socket: { remoteAddress: clientIp },
    } as unknown as NextApiRequest);

    if (!generalRateLimitResult.allowed) {
      logger.warn('Paystack webhook rate limited - too many requests', {
        component: 'paystack',
        operation: 'webhook',
        ip: clientIp,
        remaining: generalRateLimitResult.remaining,
        retryAfterMs: generalRateLimitResult.retryAfterMs,
      });

      // Return 429 for rate limited requests
      // Note: Paystack will retry, but this prevents resource exhaustion attacks
      return res.status(429).json({
        received: false,
        error: 'Too many requests - please retry later',
      });
    }

    try {
      // Read raw body (must be done before signature verification)
      const rawBody = await readRawBody(req);
      
      // Get signature from headers
      const signature = req.headers['x-paystack-signature'] as string;
      
      // Verify signature
      const isValid = verifyWebhookSignature(rawBody, signature || '');

      if (!signature || !isValid) {
        // SECURITY: Additional rate limit for failed verification attempts (stricter than general limit)
        const rateLimitResult = await failedVerificationLimiter.check({
          headers: { 'x-forwarded-for': clientIp },
          socket: { remoteAddress: clientIp },
        } as unknown as NextApiRequest);

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
          failedAttempts: (rateLimitResult.maxRequests ?? 0) - rateLimitResult.remaining,
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

