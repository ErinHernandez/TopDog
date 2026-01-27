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
import { RateLimiter } from '../../../lib/rateLimiter';
import { acquireWebhookLock } from '../../../lib/webhooks/atomicLock';

// ============================================================================
// RATE LIMITER FOR FAILED VERIFICATION ATTEMPTS
// ============================================================================

/**
 * SECURITY: Rate limit failed webhook token verification attempts
 * This prevents brute force attacks on the webhook endpoint
 *
 * Configuration:
 * - 10 failed attempts allowed per minute per IP
 * - Fail-closed: If rate limiter fails, reject the request
 * - Circuit breaker after 5 consecutive failures
 */
const failedVerificationLimiter = new RateLimiter({
  endpoint: 'xendit_webhook_failed_verification',
  maxRequests: 10,
  windowMs: 60 * 1000, // 1 minute
  failClosed: true,
  circuitBreakerThreshold: 5,
  circuitBreakerResetMs: 30 * 1000,
});

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
        // SECURITY: Rate limit failed verification attempts to prevent brute force
        const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
                        req.socket?.remoteAddress ||
                        'unknown';

        const rateLimitResult = await failedVerificationLimiter.check({
          headers: { 'x-forwarded-for': clientIp },
          socket: { remoteAddress: clientIp },
        } as NextApiRequest);

        if (!rateLimitResult.allowed) {
          logger.warn('Xendit webhook brute force detected - rate limited', {
            component: 'xendit',
            operation: 'webhook',
            ip: clientIp,
            remaining: rateLimitResult.remaining,
            retryAfterMs: rateLimitResult.retryAfterMs,
          });

          // Return 429 for rate limited requests
          return res.status(429).json({
            error: 'Too many failed verification attempts',
            retryAfterMs: rateLimitResult.retryAfterMs,
          });
        }

        logger.warn('Invalid or missing callback token', {
          component: 'xendit',
          operation: 'webhook',
          ip: clientIp,
          failedAttempts: rateLimitResult.maxRequests - rateLimitResult.remaining,
        });

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

      // Extract event ID for deduplication
      // Xendit uses different ID fields based on event type
      const eventId = payload.id || payload.payment_id || payload.external_id || `xendit_${Date.now()}`;
      const eventType = payload.status || (payload.channel_code ? 'ewallet' : 'va_payment');

      // SECURITY: Acquire atomic lock to prevent duplicate processing
      const lock = await acquireWebhookLock(eventId, eventType, 'xendit', {
        paymentId: payload.payment_id,
        externalId: payload.external_id,
        status: payload.status,
      });

      if (!lock.acquired) {
        logger.info('Xendit webhook event already handled', {
          component: 'xendit',
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

      // Determine event type from payload structure
      let result: { success: boolean; actions: string[] };

      try {
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
      
      // Release lock on successful processing
      await lock.releaseLock();

      logger.info('Webhook processed', {
        component: 'xendit',
        operation: 'webhook',
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


