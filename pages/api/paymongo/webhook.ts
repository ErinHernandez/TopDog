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

import { buffer } from 'micro';
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
import { RateLimiter } from '../../../lib/rateLimiter';
import { logger } from '../../../lib/structuredLogger';
import { acquireWebhookLock } from '../../../lib/webhooks/atomicLock';

// ============================================================================
// RATE LIMITERS
// ============================================================================

/**
 * SECURITY: Rate limit webhook requests BEFORE processing
 *
 * Configuration:
 * - 100 requests per minute per IP for general rate limiting
 * - 10 failed verification attempts per minute per IP (stricter)
 * - Fail-closed: If rate limiter fails, reject the request
 * - Circuit breaker after 5 consecutive failures
 */
const generalWebhookLimiter = new RateLimiter({
  endpoint: 'paymongo_webhook_general',
  maxRequests: 100,
  windowMs: 60 * 1000, // 1 minute
  failClosed: true,
  circuitBreakerThreshold: 5,
  circuitBreakerResetMs: 30 * 1000,
});

const failedVerificationLimiter = new RateLimiter({
  endpoint: 'paymongo_webhook_failed_verification',
  maxRequests: 10,
  windowMs: 60 * 1000, // 1 minute
  failClosed: true,
  circuitBreakerThreshold: 5,
  circuitBreakerResetMs: 30 * 1000,
});

// ============================================================================
// CONFIG
// ============================================================================

// Disable body parsing for webhook signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

// FIX B: Webhook secret configuration
const PAYMONGO_WEBHOOK_SECRET = process.env.PAYMONGO_WEBHOOK_SECRET;

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

    // Get client IP for rate limiting
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
                    req.socket?.remoteAddress ||
                    'unknown';

    // SECURITY: Rate limit BEFORE any processing to prevent resource exhaustion
    // This check must happen before signature verification or body parsing
    const generalRateLimitResult = await generalWebhookLimiter.check({
      headers: { 'x-forwarded-for': clientIp },
      socket: { remoteAddress: clientIp },
    } as unknown as NextApiRequest);

    if (!generalRateLimitResult.allowed) {
      logger.warn('PayMongo webhook rate limited - too many requests', {
        component: 'paymongo',
        operation: 'webhook',
        ip: clientIp,
        remaining: generalRateLimitResult.remaining,
        retryAfterMs: generalRateLimitResult.retryAfterMs,
      });

      // Return 429 for rate limited requests
      // Note: PayMongo will retry, but this prevents resource exhaustion attacks
      return res.status(429).json({
        received: false,
        error: 'Too many requests - please retry later',
      });
    }

    // FIX B: Validate PAYMONGO_WEBHOOK_SECRET exists BEFORE processing
    if (!PAYMONGO_WEBHOOK_SECRET) {
      logger.error('Webhook secret not configured', new Error('PAYMONGO_WEBHOOK_SECRET missing'), {
        component: 'paymongo',
        operation: 'webhook_config',
      });
      return res.status(500).json({
        received: false,
        error: 'Webhook configuration error - PAYMONGO_WEBHOOK_SECRET not set'
      });
    }

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
        // SECURITY: Additional rate limit for failed verification attempts (stricter than general limit)
        const rateLimitResult = await failedVerificationLimiter.check({
          headers: { 'x-forwarded-for': clientIp },
          socket: { remoteAddress: clientIp },
        } as unknown as NextApiRequest);

        if (!rateLimitResult.allowed) {
          logger.warn('PayMongo webhook brute force detected - rate limited', {
            component: 'paymongo',
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

        logger.warn('Invalid signature', {
          component: 'paymongo',
          operation: 'webhook',
          ip: clientIp,
          failedAttempts: (rateLimitResult.maxRequests ?? 0) - rateLimitResult.remaining,
        });
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
      const eventId = payload.data.id;

      logger.info('Processing webhook event', {
        component: 'paymongo',
        operation: 'webhook',
        eventType,
        eventId,
        dataId: eventData.id,
      });

      // SECURITY: Acquire atomic lock to prevent duplicate processing
      const lock = await acquireWebhookLock(eventId, eventType, 'paymongo', {
        dataId: eventData.id,
      });

      if (!lock.acquired) {
        logger.info('Webhook event already handled', {
          component: 'paymongo',
          operation: 'webhook',
          eventId,
          eventType,
          reason: lock.reason,
        });

        // Return 200 to acknowledge receipt (prevents retries)
        return res.status(200).json({
          received: true,
          duplicate: lock.reason === 'already_processed',
          processing: lock.reason === 'already_processing',
          reason: lock.reason,
        });
      }

      let result: { success: boolean; actions: string[] };

      try {
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
      
      // Release lock on successful processing
      await lock.releaseLock();

      logger.info('Webhook event processed', {
        component: 'paymongo',
        operation: 'webhook',
        eventType,
        eventId,
        success: result.success,
        actions: result.actions,
      });

      const response = createSuccessResponse({
        received: true,
        success: result.success,
        actions: result.actions,
      }, 200, logger);

      return res.status(response.statusCode).json(response.body);

      } catch (processingError) {
        // Mark lock as failed if processing fails
        const errMsg = processingError instanceof Error ? processingError.message : 'Unknown processing error';
        await lock.markFailed(errMsg);
        throw processingError; // Re-throw to outer catch
      }

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


