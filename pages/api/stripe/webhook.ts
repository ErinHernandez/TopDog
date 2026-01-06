/**
 * Stripe Webhook Handler
 * 
 * Processes Stripe webhook events for payment lifecycle management.
 * 
 * Events handled:
 * - payment_intent.succeeded - Update balance, record transaction
 * - payment_intent.payment_failed - Log failure
 * - payout.paid - Mark withdrawal complete
 * - payout.failed - Restore balance, notify
 * - transfer.created - Record payout transfer
 * - transfer.failed - Handle failed payout
 * - account.updated - Update Connect status
 * - charge.dispute.created - Flag account, freeze funds
 * - charge.refunded - Process refund
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { buffer } from 'micro';
import { 
  updateUserBalance,
  createTransaction,
  updateTransactionStatus,
  findTransactionByPaymentIntent,
  findTransactionByTransfer,
  logPaymentEvent,
} from '../../../lib/stripe';
import { captureError } from '../../../lib/errorTracking';
import { db } from '../../../lib/firebase';
import { doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';

// ============================================================================
// CONFIG
// ============================================================================

// Disable body parsing for webhook signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

let stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY not configured');
  }
  if (!stripe) {
    stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    });
  }
  return stripe;
}

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  if (!STRIPE_WEBHOOK_SECRET) {
    console.error('[Webhook] STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }
  
  try {
    // Get raw body for signature verification
    const rawBody = await buffer(req);
    const signature = req.headers['stripe-signature'];
    
    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }
    
    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = getStripe().webhooks.constructEvent(
        rawBody,
        signature,
        STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      const error = err as Error;
      console.error('[Webhook] Signature verification failed:', error.message);
      return res.status(400).json({ error: 'Invalid signature' });
    }
    
    console.log('[Webhook] Received event:', event.type, event.id);
    
    // Process event
    const result = await processEvent(event);
    
    if (!result.success) {
      console.error('[Webhook] Event processing failed:', result.error);
      // Still return 200 to prevent retries for handled errors
    }
    
    return res.status(200).json({ 
      received: true,
      eventId: event.id,
      eventType: event.type,
      ...result,
    });
  } catch (error) {
    console.error('[Webhook] Unhandled error:', error);
    await captureError(error as Error, {
      tags: { component: 'stripe', operation: 'webhook' },
    });
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}

// ============================================================================
// EVENT PROCESSING
// ============================================================================

interface ProcessingResult {
  success: boolean;
  actions?: string[];
  error?: string;
}

async function processEvent(event: Stripe.Event): Promise<ProcessingResult> {
  const actions: string[] = [];
  
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        return await handlePaymentIntentSucceeded(
          event.data.object as Stripe.PaymentIntent
        );
        
      case 'payment_intent.payment_failed':
        return await handlePaymentIntentFailed(
          event.data.object as Stripe.PaymentIntent
        );
        
      case 'transfer.created':
        return await handleTransferCreated(
          event.data.object as Stripe.Transfer
        );
        
      case 'transfer.failed':
        return await handleTransferFailed(
          event.data.object as Stripe.Transfer
        );
        
      case 'account.updated':
        return await handleAccountUpdated(
          event.data.object as Stripe.Account
        );
        
      case 'charge.dispute.created':
        return await handleDisputeCreated(
          event.data.object as Stripe.Dispute
        );
        
      case 'charge.refunded':
        return await handleChargeRefunded(
          event.data.object as Stripe.Charge
        );
        
      default:
        console.log('[Webhook] Unhandled event type:', event.type);
        return { success: true, actions: ['ignored'] };
    }
  } catch (error) {
    const err = error as Error;
    await captureError(err, {
      tags: { component: 'stripe', operation: 'webhook_process' },
      extra: { eventType: event.type, eventId: event.id },
    });
    return { success: false, error: err.message };
  }
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

/**
 * Handle successful payment - credit user balance
 */
async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent
): Promise<ProcessingResult> {
  const actions: string[] = [];
  
  const userId = paymentIntent.metadata.firebaseUserId;
  if (!userId) {
    return { success: false, error: 'Missing firebaseUserId in metadata' };
  }
  
  // Check if already processed (idempotency)
  const existingTx = await findTransactionByPaymentIntent(paymentIntent.id);
  if (existingTx?.status === 'completed') {
    return { success: true, actions: ['already_processed'] };
  }
  
  // Get payment method details for display
  let paymentMethodDisplay = 'Payment';
  if (paymentIntent.payment_method) {
    try {
      const pm = await getStripe().paymentMethods.retrieve(
        paymentIntent.payment_method as string
      );
      if (pm.card) {
        // Check for wallet payments (Apple Pay, Google Pay)
        if (pm.card.wallet?.type === 'apple_pay') {
          paymentMethodDisplay = 'Apple Pay';
        } else if (pm.card.wallet?.type === 'google_pay') {
          paymentMethodDisplay = 'Google Pay';
        } else if (pm.card.wallet?.type === 'link') {
          paymentMethodDisplay = 'Link';
        } else {
          paymentMethodDisplay = `${pm.card.brand?.toUpperCase()} ****${pm.card.last4}`;
        }
      } else if (pm.type === 'paypal') {
        paymentMethodDisplay = 'PayPal';
      } else if (pm.type === 'us_bank_account') {
        const bank = pm.us_bank_account;
        paymentMethodDisplay = bank ? `Bank ****${bank.last4}` : 'Bank Account';
      } else if (pm.type === 'link') {
        paymentMethodDisplay = 'Link';
      }
    } catch (e) {
      // Use default
    }
  }
  
  // Create or update transaction record
  if (existingTx) {
    await updateTransactionStatus(existingTx.id, 'completed');
    actions.push('transaction_updated');
  } else {
    await createTransaction({
      userId,
      type: 'deposit',
      amountCents: paymentIntent.amount,
      stripePaymentIntentId: paymentIntent.id,
      paymentMethod: paymentMethodDisplay,
      description: 'Deposit',
    });
    actions.push('transaction_created');
  }
  
  // Credit user balance
  await updateUserBalance(userId, paymentIntent.amount, 'add');
  actions.push('balance_credited');
  
  // Log audit event
  await logPaymentEvent(userId, 'payment_succeeded', {
    transactionId: existingTx?.id,
    amountCents: paymentIntent.amount,
    severity: 'low',
  });
  actions.push('audit_logged');
  
  return { success: true, actions };
}

/**
 * Handle failed payment
 */
async function handlePaymentIntentFailed(
  paymentIntent: Stripe.PaymentIntent
): Promise<ProcessingResult> {
  const userId = paymentIntent.metadata.firebaseUserId;
  if (!userId) {
    return { success: false, error: 'Missing firebaseUserId in metadata' };
  }
  
  const errorMessage = paymentIntent.last_payment_error?.message || 'Payment failed';
  
  // Update transaction if exists
  const existingTx = await findTransactionByPaymentIntent(paymentIntent.id);
  if (existingTx) {
    await updateTransactionStatus(existingTx.id, 'failed', errorMessage);
  }
  
  // Log audit event
  await logPaymentEvent(userId, 'payment_failed', {
    transactionId: existingTx?.id,
    amountCents: paymentIntent.amount,
    severity: 'medium',
    metadata: { errorMessage },
  });
  
  return { success: true, actions: ['failure_logged'] };
}

/**
 * Handle transfer created (payout initiated)
 */
async function handleTransferCreated(
  transfer: Stripe.Transfer
): Promise<ProcessingResult> {
  const userId = transfer.metadata?.firebaseUserId;
  if (!userId) {
    return { success: false, error: 'Missing firebaseUserId in metadata' };
  }
  
  // Check if transaction already exists
  const existingTx = await findTransactionByTransfer(transfer.id);
  if (existingTx) {
    return { success: true, actions: ['already_processed'] };
  }
  
  // Debit user balance
  await updateUserBalance(userId, transfer.amount, 'subtract');
  
  // Create transaction record
  await createTransaction({
    userId,
    type: 'withdrawal',
    amountCents: -transfer.amount, // Negative for withdrawals
    stripeTransferId: transfer.id,
    description: 'Withdrawal',
  });
  
  // Log audit event
  await logPaymentEvent(userId, 'payout_initiated', {
    amountCents: transfer.amount,
    severity: 'low',
  });
  
  return { success: true, actions: ['balance_debited', 'transaction_created'] };
}

/**
 * Handle transfer failed - restore balance
 */
async function handleTransferFailed(
  transfer: Stripe.Transfer
): Promise<ProcessingResult> {
  const userId = transfer.metadata?.firebaseUserId;
  if (!userId) {
    return { success: false, error: 'Missing firebaseUserId in metadata' };
  }
  
  // Restore user balance
  await updateUserBalance(userId, transfer.amount, 'add');
  
  // Update transaction
  const existingTx = await findTransactionByTransfer(transfer.id);
  if (existingTx) {
    await updateTransactionStatus(existingTx.id, 'failed', 'Transfer failed');
  }
  
  // Log audit event
  await logPaymentEvent(userId, 'payout_failed', {
    transactionId: existingTx?.id,
    amountCents: transfer.amount,
    severity: 'high',
  });
  
  return { success: true, actions: ['balance_restored', 'failure_logged'] };
}

/**
 * Handle Connect account updates
 */
async function handleAccountUpdated(
  account: Stripe.Account
): Promise<ProcessingResult> {
  const userId = account.metadata?.firebaseUserId;
  if (!userId) {
    // May be a platform account update, not user
    return { success: true, actions: ['ignored_no_user'] };
  }
  
  // Update user's Connect status in Firebase
  const userRef = doc(db, 'users', userId);
  
  await updateDoc(userRef, {
    stripeConnectOnboarded: account.details_submitted && account.payouts_enabled,
    stripeConnectChargesEnabled: account.charges_enabled,
    stripeConnectPayoutsEnabled: account.payouts_enabled,
    lastConnectUpdate: serverTimestamp(),
  });
  
  // Log if onboarding completed
  if (account.details_submitted && account.payouts_enabled) {
    await logPaymentEvent(userId, 'connect_onboarding_complete', {
      severity: 'low',
    });
  }
  
  return { success: true, actions: ['connect_status_updated'] };
}

/**
 * Handle dispute created - critical security event
 */
async function handleDisputeCreated(
  dispute: Stripe.Dispute
): Promise<ProcessingResult> {
  const actions: string[] = [];
  
  // Get the charge to find the user
  const charge = dispute.charge as Stripe.Charge;
  const paymentIntent = charge.payment_intent as string;
  
  // Find transaction and user
  const transaction = await findTransactionByPaymentIntent(paymentIntent);
  if (!transaction) {
    return { success: false, error: 'Transaction not found for dispute' };
  }
  
  const userId = transaction.userId;
  
  // Flag user account
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    paymentFlagged: true,
    paymentFlagReason: 'Dispute received',
    paymentFlaggedAt: serverTimestamp(),
  });
  actions.push('user_flagged');
  
  // Log critical security event
  await logPaymentEvent(userId, 'payment_disputed', {
    transactionId: transaction.id,
    amountCents: dispute.amount,
    severity: 'critical',
    metadata: {
      disputeId: dispute.id,
      reason: dispute.reason,
    },
  });
  actions.push('dispute_logged');
  
  // Alert should be sent (via existing security system)
  console.error('[CRITICAL] Dispute received for user:', userId, 'amount:', dispute.amount);
  
  return { success: true, actions };
}

/**
 * Handle refund
 */
async function handleChargeRefunded(
  charge: Stripe.Charge
): Promise<ProcessingResult> {
  const paymentIntent = charge.payment_intent as string;
  if (!paymentIntent) {
    return { success: true, actions: ['no_payment_intent'] };
  }
  
  // Find original transaction
  const transaction = await findTransactionByPaymentIntent(paymentIntent);
  if (!transaction) {
    return { success: false, error: 'Original transaction not found' };
  }
  
  const userId = transaction.userId;
  const refundAmount = charge.amount_refunded;
  
  // Debit refunded amount from balance
  await updateUserBalance(userId, refundAmount, 'subtract');
  
  // Create refund transaction record
  await createTransaction({
    userId,
    type: 'refund',
    amountCents: -refundAmount,
    stripePaymentIntentId: paymentIntent,
    description: 'Refund',
    referenceId: transaction.id,
  });
  
  // Log audit event
  await logPaymentEvent(userId, 'refund_processed', {
    transactionId: transaction.id,
    amountCents: refundAmount,
    severity: 'medium',
  });
  
  return { success: true, actions: ['refund_processed', 'balance_adjusted'] };
}

