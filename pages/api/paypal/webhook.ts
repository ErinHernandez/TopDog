/**
 * PayPal Webhook Handler
 *
 * POST /api/paypal/webhook
 * Handles PayPal webhook events
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro';
import { serverLogger } from '../../../lib/logger/serverLogger';
import { verifyPayPalWebhookSignature } from '../../../lib/paypal/paypalClient';
import {
  updateUserBalance,
  createPayPalTransaction,
  updatePayPalTransactionStatus,
  logPaymentEvent,
} from '../../../lib/paypal/paypalService';
import { getDb } from '../../../lib/firebase-utils';
import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import type { PayPalWebhookEventType, WebhookProcessingResult } from '../../../lib/paypal/paypalTypes';
import { paypalAmountToCents } from '../../../lib/paypal/paypalClient';

// Disable body parsing - we need raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

// ============================================================================
// WEBHOOK LOCK MANAGEMENT (Prevent duplicate processing)
// ============================================================================

interface WebhookLock {
  acquired: boolean;
  reason?: string;
  releaseLock: () => Promise<void>;
  markFailed: (error: string) => Promise<void>;
}

async function acquireWebhookLock(
  eventId: string,
  eventType: string,
  provider: string,
  metadata: Record<string, unknown>
): Promise<WebhookLock> {
  const db = getDb();
  const lockRef = doc(db, 'webhook_locks', `${provider}_${eventId}`);

  const lockDoc = await getDoc(lockRef);

  if (lockDoc.exists()) {
    const lockData = lockDoc.data();
    if (lockData.status === 'completed') {
      return {
        acquired: false,
        reason: 'already_processed',
        releaseLock: async () => {},
        markFailed: async () => {},
      };
    }
    if (lockData.status === 'processing' && Date.now() - lockData.startedAt?.toMillis() < 60000) {
      return {
        acquired: false,
        reason: 'processing',
        releaseLock: async () => {},
        markFailed: async () => {},
      };
    }
  }

  // Acquire lock
  await setDoc(lockRef, {
    eventId,
    eventType,
    provider,
    status: 'processing',
    startedAt: serverTimestamp(),
    metadata,
  });

  return {
    acquired: true,
    releaseLock: async () => {
      await updateDoc(lockRef, {
        status: 'completed',
        completedAt: serverTimestamp(),
      });
    },
    markFailed: async (error: string) => {
      await updateDoc(lockRef, {
        status: 'failed',
        error,
        failedAt: serverTimestamp(),
      });
    },
  };
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

async function handleOrderApproved(
  resource: Record<string, unknown>
): Promise<WebhookProcessingResult> {
  const orderId = resource.id as string;
  const customId = (resource.purchase_units as Array<{ custom_id?: string }>)?.[0]?.custom_id;

  serverLogger.info('PayPal order approved', { orderId, userId: customId });

  // Order is approved but not yet captured
  // The capture happens on the frontend after user approval
  const db = getDb();
  const orderRef = doc(db, 'paypal_orders', orderId);

  await updateDoc(orderRef, {
    status: 'APPROVED',
    approvedAt: serverTimestamp(),
  });

  return {
    success: true,
    eventType: 'CHECKOUT.ORDER.APPROVED',
    eventId: orderId,
    actions: ['order_status_updated'],
  };
}

async function handleCaptureCompleted(
  resource: Record<string, unknown>
): Promise<WebhookProcessingResult> {
  const captureId = resource.id as string;
  const orderId = (resource as { supplementary_data?: { related_ids?: { order_id?: string } } })
    ?.supplementary_data?.related_ids?.order_id;

  const amount = resource.amount as { currency_code: string; value: string };
  const amountCents = paypalAmountToCents(amount.value);

  serverLogger.info('PayPal capture completed', { captureId, orderId, amountCents });

  // Update order status in Firebase
  if (orderId) {
    const db = getDb();
    const orderRef = doc(db, 'paypal_orders', orderId);
    const orderDoc = await getDoc(orderRef);

    if (orderDoc.exists()) {
      const orderData = orderDoc.data();

      // Only process if not already completed
      if (orderData.status !== 'COMPLETED') {
        await updateDoc(orderRef, {
          status: 'COMPLETED',
          captureId,
          capturedAt: serverTimestamp(),
        });

        // If balance wasn't updated via API (edge case), update it here
        if (!orderData.balanceUpdated) {
          await updateUserBalance(
            orderData.userId,
            amountCents,
            'add',
            `webhook_capture_${captureId}`
          );

          await updateDoc(orderRef, { balanceUpdated: true });

          await logPaymentEvent(orderData.userId, 'paypal_capture_completed_webhook', {
            captureId,
            orderId,
            amountCents,
          });
        }
      }
    }
  }

  return {
    success: true,
    eventType: 'PAYMENT.CAPTURE.COMPLETED',
    eventId: captureId,
    actions: ['capture_processed'],
  };
}

async function handleCaptureDenied(
  resource: Record<string, unknown>
): Promise<WebhookProcessingResult> {
  const captureId = resource.id as string;
  const orderId = (resource as { supplementary_data?: { related_ids?: { order_id?: string } } })
    ?.supplementary_data?.related_ids?.order_id;

  serverLogger.warn('PayPal capture denied', null, { captureId, orderId });

  if (orderId) {
    const db = getDb();
    const orderRef = doc(db, 'paypal_orders', orderId);
    const orderDoc = await getDoc(orderRef);

    if (orderDoc.exists()) {
      await updateDoc(orderRef, {
        status: 'VOIDED',
        failedAt: serverTimestamp(),
        failureReason: 'capture_denied',
      });

      await logPaymentEvent(orderDoc.data().userId, 'paypal_capture_denied', {
        captureId,
        orderId,
      });
    }
  }

  return {
    success: true,
    eventType: 'PAYMENT.CAPTURE.DENIED',
    eventId: captureId,
    actions: ['capture_denied_logged'],
  };
}

async function handleCaptureRefunded(
  resource: Record<string, unknown>
): Promise<WebhookProcessingResult> {
  const captureId = resource.id as string;
  const amount = resource.amount as { currency_code: string; value: string };
  const amountCents = paypalAmountToCents(amount.value);

  serverLogger.info('PayPal capture refunded', { captureId, amountCents });

  // Find the original transaction and update it
  const db = getDb();
  // TODO: Query transactions by captureId and update status

  return {
    success: true,
    eventType: 'PAYMENT.CAPTURE.REFUNDED',
    eventId: captureId,
    actions: ['refund_logged'],
  };
}

async function handlePayoutSuccess(
  resource: Record<string, unknown>
): Promise<WebhookProcessingResult> {
  const batchId = (resource.batch_header as { payout_batch_id: string })?.payout_batch_id;

  serverLogger.info('PayPal payout batch succeeded', { batchId });

  // Update held withdrawals if applicable
  const db = getDb();
  // TODO: Update related withdrawal records

  return {
    success: true,
    eventType: 'PAYMENT.PAYOUTSBATCH.SUCCESS',
    eventId: batchId,
    actions: ['payout_success_logged'],
  };
}

async function handlePayoutItemFailed(
  resource: Record<string, unknown>
): Promise<WebhookProcessingResult> {
  const itemId = resource.payout_item_id as string;
  const error = resource.errors as { message: string } | undefined;

  serverLogger.error('PayPal payout item failed', null, { itemId, error });

  // TODO: Restore user balance and notify them

  return {
    success: true,
    eventType: 'PAYMENT.PAYOUTS-ITEM.FAILED',
    eventId: itemId,
    actions: ['payout_failure_logged'],
  };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get raw body for signature verification
    const rawBody = await buffer(req);
    const bodyString = rawBody.toString();

    // Extract headers for verification
    const headers: Record<string, string> = {
      'paypal-auth-algo': req.headers['paypal-auth-algo'] as string,
      'paypal-cert-url': req.headers['paypal-cert-url'] as string,
      'paypal-transmission-id': req.headers['paypal-transmission-id'] as string,
      'paypal-transmission-sig': req.headers['paypal-transmission-sig'] as string,
      'paypal-transmission-time': req.headers['paypal-transmission-time'] as string,
    };

    // Verify webhook signature
    const isValid = await verifyPayPalWebhookSignature(headers, bodyString);

    if (!isValid) {
      serverLogger.warn('Invalid PayPal webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = JSON.parse(bodyString);

    serverLogger.info('PayPal webhook received', {
      eventId: event.id,
      eventType: event.event_type,
    });

    // Acquire atomic lock (prevent duplicate processing)
    const lock = await acquireWebhookLock(
      event.id,
      event.event_type,
      'paypal',
      { resourceId: event.resource?.id }
    );

    if (!lock.acquired) {
      serverLogger.info('Webhook already processed', {
        eventId: event.id,
        reason: lock.reason,
      });
      return res.status(200).json({ received: true, status: lock.reason });
    }

    try {
      // Process event by type
      let result: WebhookProcessingResult;

      switch (event.event_type as PayPalWebhookEventType) {
        case 'CHECKOUT.ORDER.APPROVED':
          result = await handleOrderApproved(event.resource);
          break;

        case 'PAYMENT.CAPTURE.COMPLETED':
          result = await handleCaptureCompleted(event.resource);
          break;

        case 'PAYMENT.CAPTURE.DENIED':
          result = await handleCaptureDenied(event.resource);
          break;

        case 'PAYMENT.CAPTURE.REFUNDED':
          result = await handleCaptureRefunded(event.resource);
          break;

        case 'PAYMENT.PAYOUTSBATCH.SUCCESS':
          result = await handlePayoutSuccess(event.resource);
          break;

        case 'PAYMENT.PAYOUTS-ITEM.FAILED':
          result = await handlePayoutItemFailed(event.resource);
          break;

        default:
          serverLogger.info('Unhandled PayPal webhook event type', {
            eventType: event.event_type,
          });
          result = {
            success: true,
            eventType: event.event_type,
            eventId: event.id,
            actions: ['unhandled_event_type'],
          };
      }

      // Release lock
      if (result.success) {
        await lock.releaseLock();
      } else {
        await lock.markFailed(result.error || 'Unknown error');
      }

      return res.status(200).json({ received: true, ...result });
    } catch (error) {
      await lock.markFailed((error as Error).message);
      throw error;
    }
  } catch (error) {
    serverLogger.error('PayPal webhook processing error', error as Error);

    // Return 200 to prevent PayPal from retrying (we'll handle errors internally)
    return res.status(200).json({
      received: true,
      error: 'Processing error',
    });
  }
}
