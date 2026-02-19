/**
 * PayPal Webhook Handler
 *
 * POST /api/paypal/webhook
 * Handles PayPal webhook events
 */

import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  serverTimestamp,
  runTransaction,
  increment,
  Timestamp,
} from 'firebase/firestore';
import { buffer } from 'micro';
import type { NextApiRequest, NextApiResponse } from 'next';

import { getDb } from '../../../lib/firebase-utils';
import { serverLogger } from '../../../lib/logger/serverLogger';
import { verifyPayPalWebhookSignature } from '../../../lib/paypal/paypalClient';
import { paypalAmountToCents } from '../../../lib/paypal/paypalClient';
import {
  updateUserBalance,
  createPayPalTransaction,
  updatePayPalTransactionStatus,
  logPaymentEvent,
} from '../../../lib/paypal/paypalService';
import type { PayPalWebhookEventType, WebhookProcessingResult } from '../../../lib/paypal/paypalTypes';
import { acquireWebhookLock } from '../../../lib/webhooks/atomicLock';

// Disable body parsing - we need raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};


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

/**
 * SECURITY FIX (Bug #4): Use single Firestore transaction for atomic balance update.
 *
 * The previous implementation updated the balance and set balanceUpdated in separate
 * operations. If a crash occurred between them, the balance could be updated twice
 * on retry. This fix uses a single transaction to ensure atomicity.
 */
async function handleCaptureCompleted(
  resource: Record<string, unknown>
): Promise<WebhookProcessingResult> {
  const captureId = resource.id as string;
  const orderId = (resource as { supplementary_data?: { related_ids?: { order_id?: string } } })
    ?.supplementary_data?.related_ids?.order_id;

  const amount = resource.amount as { currency_code: string; value: string };
  const amountCents = paypalAmountToCents(amount.value);

  serverLogger.info('PayPal capture completed', { captureId, orderId, amountCents });

  const actions: string[] = [];

  // Update order status in Firebase
  if (orderId) {
    const db = getDb();
    const orderRef = doc(db, 'paypal_orders', orderId);

    try {
      // Use a single transaction to atomically update order status, balance, and flag
      const result = await runTransaction(db, async (transaction) => {
        const orderDoc = await transaction.get(orderRef);

        if (!orderDoc.exists()) {
          return { success: false, reason: 'order_not_found' };
        }

        const orderData = orderDoc.data();

        // Only process if not already completed
        if (orderData.status === 'COMPLETED') {
          return { success: true, reason: 'already_completed', balanceUpdated: false };
        }

        // Update order status
        transaction.update(orderRef, {
          status: 'COMPLETED',
          captureId,
          capturedAt: serverTimestamp(),
        });

        // If balance wasn't updated via API (edge case), update it atomically
        if (!orderData.balanceUpdated) {
          const userId = orderData.userId;
          const userRef = doc(db, 'users', userId);
          const userDoc = await transaction.get(userRef);

          if (!userDoc.exists()) {
            throw new Error(`User ${userId} not found`);
          }

          const currentBalance = userDoc.data().balanceCents || 0;
          const newBalance = currentBalance + amountCents;

          // Atomically update both user balance and order's balanceUpdated flag
          transaction.update(userRef, {
            balanceCents: newBalance,
            updatedAt: serverTimestamp(),
          });

          transaction.update(orderRef, {
            balanceUpdated: true,
            balanceUpdatedAt: serverTimestamp(),
            balanceUpdatedAmount: amountCents,
          });

          return {
            success: true,
            reason: 'balance_updated',
            balanceUpdated: true,
            userId,
            newBalance,
          };
        }

        return { success: true, reason: 'status_updated', balanceUpdated: false };
      });

      if (result.success) {
        actions.push(result.reason);

        if (result.balanceUpdated && result.userId) {
          // Log the payment event (outside transaction since it's not critical)
          await logPaymentEvent(result.userId, 'paypal_capture_completed_webhook', {
            captureId,
            orderId,
            amountCents,
            newBalance: result.newBalance,
          });
          actions.push('event_logged');
        }
      } else {
        serverLogger.warn('PayPal capture completed handler failed', null, {
          captureId,
          orderId,
          reason: result.reason,
        });
      }
    } catch (error) {
      serverLogger.error('PayPal capture completed transaction failed', error as Error, {
        captureId,
        orderId,
        amountCents,
      });
      throw error;
    }
  }

  return {
    success: true,
    eventType: 'PAYMENT.CAPTURE.COMPLETED',
    eventId: captureId,
    actions: actions.length > 0 ? actions : ['capture_processed'],
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
  const orderId = (resource.supplementary_data as { related_ids?: { order_id?: string } })?.related_ids?.order_id;

  serverLogger.info('PayPal capture refunded', { captureId, amountCents, orderId });

  const db = getDb();
  const actions: string[] = [];

  // Find and update the original order/transaction
  if (orderId) {
    const orderRef = doc(db, 'paypal_orders', orderId);
    const orderDoc = await getDoc(orderRef);

    if (orderDoc.exists()) {
      const orderData = orderDoc.data();
      const userId = orderData.userId;

      // Update order status
      await updateDoc(orderRef, {
        status: 'REFUNDED',
        refundedAt: serverTimestamp(),
        refundAmount: amountCents,
        refundCaptureId: captureId,
      });
      actions.push('order_updated');

      // Deduct the refund from user's balance (they got their money back from PayPal)
      if (userId && amountCents > 0) {
        try {
          await updateUserBalance(
            userId,
            amountCents,
            'subtract',
            `paypal_refund_${captureId}` // Idempotency key
          );
          actions.push('balance_deducted');

          await logPaymentEvent(userId, 'paypal_refund_processed', {
            captureId,
            orderId,
            amountCents,
          });
          actions.push('refund_event_logged');
        } catch (balanceError) {
          // Log but don't fail - balance might already be 0
          serverLogger.warn('Failed to deduct refund from balance', balanceError as Error, {
            userId,
            amountCents,
            captureId,
          });
          actions.push('balance_deduction_failed');
        }
      }
    }
  }

  return {
    success: true,
    eventType: 'PAYMENT.CAPTURE.REFUNDED',
    eventId: captureId,
    actions: actions.length > 0 ? actions : ['refund_logged'],
  };
}

async function handlePayoutSuccess(
  resource: Record<string, unknown>
): Promise<WebhookProcessingResult> {
  const batchHeader = resource.batch_header as {
    payout_batch_id: string;
    batch_status: string;
    amount?: { currency: string; value: string };
  };
  const batchId = batchHeader?.payout_batch_id;

  serverLogger.info('PayPal payout batch succeeded', { batchId, status: batchHeader?.batch_status });

  const db = getDb();
  const actions: string[] = [];

  if (batchId) {
    // Update the payout batch record
    const batchRef = doc(db, 'paypal_payouts', batchId);
    const batchDoc = await getDoc(batchRef);

    if (batchDoc.exists()) {
      await updateDoc(batchRef, {
        status: 'SUCCESS',
        completedAt: serverTimestamp(),
      });
      actions.push('batch_updated');

      // Log success for the user
      const batchData = batchDoc.data();
      if (batchData.userId) {
        await logPaymentEvent(batchData.userId, 'paypal_payout_success', {
          batchId,
          amount: batchHeader?.amount,
        });
        actions.push('success_logged');
      }
    } else {
      // Create record if it doesn't exist (external payout)
      await setDoc(batchRef, {
        batchId,
        status: 'SUCCESS',
        completedAt: serverTimestamp(),
        source: 'webhook',
      });
      actions.push('batch_created');
    }
  }

  return {
    success: true,
    eventType: 'PAYMENT.PAYOUTSBATCH.SUCCESS',
    eventId: batchId,
    actions: actions.length > 0 ? actions : ['payout_success_logged'],
  };
}

async function handlePayoutItemFailed(
  resource: Record<string, unknown>
): Promise<WebhookProcessingResult> {
  const itemId = resource.payout_item_id as string;
  const errors = resource.errors as { name?: string; message?: string }[] | undefined;
  const payoutItem = resource.payout_item as {
    amount?: { currency: string; value: string };
    sender_item_id?: string;
  };
  const transactionStatus = resource.transaction_status as string;

  serverLogger.error('PayPal payout item failed', null, {
    itemId,
    errors,
    transactionStatus,
    senderItemId: payoutItem?.sender_item_id,
  });

  const db = getDb();
  const actions: string[] = [];

  // The sender_item_id typically contains our internal reference (userId or withdrawalId)
  const senderItemId = payoutItem?.sender_item_id;

  if (senderItemId) {
    // Try to find the related withdrawal record
    const withdrawalRef = doc(db, 'withdrawals', senderItemId);
    const withdrawalDoc = await getDoc(withdrawalRef);

    if (withdrawalDoc.exists()) {
      const withdrawalData = withdrawalDoc.data();
      const userId = withdrawalData.userId;
      const amountCents = withdrawalData.amountCents;

      // Update withdrawal status
      await updateDoc(withdrawalRef, {
        status: 'FAILED',
        failedAt: serverTimestamp(),
        failureReason: errors?.[0]?.message || 'Payout failed',
        paypalItemId: itemId,
      });
      actions.push('withdrawal_updated');

      // CRITICAL: Restore user's balance since the payout failed
      if (userId && amountCents > 0) {
        try {
          await updateUserBalance(
            userId,
            amountCents,
            'add',
            `paypal_payout_failed_${itemId}` // Idempotency key
          );
          actions.push('balance_restored');

          // Log the failure and balance restoration
          await logPaymentEvent(userId, 'paypal_payout_failed', {
            itemId,
            amountCents,
            error: errors?.[0]?.message,
            balanceRestored: true,
          });
          actions.push('failure_logged');

          serverLogger.info('User balance restored after payout failure', {
            userId,
            amountCents,
            itemId,
          });
        } catch (balanceError) {
          // This is critical - log for manual intervention
          serverLogger.error('CRITICAL: Failed to restore balance after payout failure', balanceError as Error, {
            userId,
            amountCents,
            itemId,
            requiresManualIntervention: true,
          });
          actions.push('balance_restoration_failed_CRITICAL');
        }
      }
    } else {
      serverLogger.warn('Could not find withdrawal record for failed payout', null, {
        senderItemId,
        itemId,
      });
      actions.push('withdrawal_not_found');
    }
  }

  return {
    success: true,
    eventType: 'PAYMENT.PAYOUTS-ITEM.FAILED',
    eventId: itemId,
    actions: actions.length > 0 ? actions : ['payout_failure_logged'],
  };
}

// ============================================================================
// WEBHOOK SECRET CONFIGURATION
// ============================================================================

const PAYPAL_WEBHOOK_SECRET = process.env.PAYPAL_WEBHOOK_ID;

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

  // FIX B: Validate PAYPAL_WEBHOOK_SECRET exists BEFORE processing
  if (!PAYPAL_WEBHOOK_SECRET) {
    serverLogger.error('PAYPAL_WEBHOOK_ID not configured', new Error('Missing PAYPAL_WEBHOOK_ID'));
    return res.status(500).json({
      received: false,
      error: 'Webhook configuration error - PAYPAL_WEBHOOK_ID not set'
    });
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
      const statusMap: Record<string, string> = {
        'already_processed': 'already_processed',
        'already_processing': 'processing',
        'max_attempts_exceeded': 'max_attempts_exceeded',
      };
      const status = statusMap[lock.reason] || lock.reason;

      serverLogger.info('Webhook already processed', {
        eventId: event.id,
        reason: lock.reason,
      });
      return res.status(200).json({ received: true, status });
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
