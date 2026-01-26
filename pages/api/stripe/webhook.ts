/**
 * Stripe Webhook Handler
 * 
 * Processes Stripe webhook events for payment lifecycle management.
 * 
 * Events handled:
 * - payment_intent.succeeded - Update balance, record transaction, update lastDepositCurrency
 * - payment_intent.payment_failed - Log failure
 * - payment_intent.requires_action - Handle async payments (OXXO, Boleto vouchers)
 * - payment_intent.processing - Payment being processed (bank transfers)
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
  updateLastDepositCurrency,
  findEventByStripeId,
  markEventAsProcessed,
  markEventAsFailed,
  createOrUpdateWebhookEvent,
  type PaymentMethodType,
} from '../../../lib/stripe';
import { captureError } from '../../../lib/errorTracking';
import { logger } from '../../../lib/structuredLogger';
import { getDb } from '../../../lib/firebase-utils';
import { doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import {
  withErrorHandling,
  validateMethod,
  createSuccessResponse,
  createErrorResponse,
  ErrorType,
  type ApiLogger,
} from '../../../lib/apiErrorHandler';
import { acquireWebhookLock } from '../../../lib/webhooks/atomicLock';

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
  if (stripe === null) {
    stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2025-08-27.basil',
    });
  }
  return stripe; // stripe is guaranteed to be non-null here
}

// ============================================================================
// PAYMENT METHOD TYPE MAPPING
// ============================================================================

/**
 * Map Stripe payment method types to our PaymentMethodType
 */
function mapPaymentMethodType(stripeType: string): PaymentMethodType {
  const mapping: Record<string, PaymentMethodType> = {
    card: 'card',
    us_bank_account: 'us_bank_account',
    sepa_debit: 'sepa_debit',
    acss_debit: 'acss_debit',
    ideal: 'ideal',
    bancontact: 'bancontact',
    sofort: 'sofort',
    eps: 'eps',
    p24: 'p24',
    blik: 'blik',
    swish: 'swish',
    mobilepay: 'mobilepay',
    twint: 'twint',
    multibanco: 'multibanco',
    mb_way: 'mb_way',
    paynow: 'paynow',
    fpx: 'fpx',
    promptpay: 'promptpay',
    grabpay: 'grabpay',
    oxxo: 'oxxo',
    boleto: 'boleto',
    pix: 'pix',
    cashapp: 'cashapp',
    paypal: 'paypal',
    link: 'link',
  };
  return mapping[stripeType] || 'card';
}

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Wrap with error handling, but customize for webhooks (always return 200)
  return withErrorHandling(req, res, async (req, res, logger) => {
    // Validate HTTP method
    validateMethod(req, ['POST'], logger);
    
    if (!STRIPE_WEBHOOK_SECRET) {
      // Configuration error - log in both dev and prod
      logger.error('Webhook secret not configured', new Error('STRIPE_WEBHOOK_SECRET missing'), {
        component: 'stripe',
        operation: 'webhook_config',
      });
      // For webhooks, always return 200 even on configuration errors to prevent retries
      const errorResponse = createErrorResponse(
        ErrorType.CONFIGURATION,
        'Webhook secret not configured',
        {},
        res.getHeader('X-Request-ID') as string
      );
      return res.status(200).json({ received: false, error: errorResponse.body.error.message });
    }
    
    // Get raw body for signature verification
    const rawBody = await buffer(req);
    const signature = req.headers['stripe-signature'];
    
    if (!signature) {
      logger.warn('Missing signature header', { component: 'stripe', operation: 'webhook' });
      // For webhooks, always return 200 even on validation errors to prevent retries
      const errorResponse = createErrorResponse(
        ErrorType.VALIDATION,
        'Missing stripe-signature header',
        {},
        res.getHeader('X-Request-ID') as string
      );
      return res.status(200).json({ received: false, error: errorResponse.body.error.message });
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
      // Log signature verification failure
      logger.error('Webhook signature verification failed', error, {
        component: 'stripe',
        operation: 'webhook_verification',
      });
      // For webhooks, always return 200 even on signature errors to prevent retries
      const errorResponse = createErrorResponse(
        ErrorType.UNAUTHORIZED,
        'Invalid signature',
        {},
        res.getHeader('X-Request-ID') as string
      );
      return res.status(200).json({ received: false, error: errorResponse.body.error.message });
    }
    
    // ATOMIC LOCK: Acquire exclusive processing lock to prevent race conditions
    // This replaces the previous non-atomic duplicate check
    const lock = await acquireWebhookLock(event.id, event.type, 'stripe', {
      livemode: event.livemode,
      apiVersion: event.api_version,
    });

    if (!lock.acquired) {
      if (lock.reason === 'already_processed') {
        logger.info('Duplicate webhook event - already processed', {
          component: 'stripe',
          operation: 'webhook',
          eventType: event.type,
          eventId: event.id,
        });

        return res.status(200).json({
          received: true,
          eventId: event.id,
          eventType: event.type,
          success: true,
          duplicate: true,
          actions: ['already_processed'],
        });
      }

      if (lock.reason === 'already_processing') {
        logger.info('Webhook being processed by another handler', {
          component: 'stripe',
          operation: 'webhook',
          eventType: event.type,
          eventId: event.id,
        });

        // Return 200 to prevent Stripe retry (other handler will complete)
        return res.status(200).json({
          received: true,
          eventId: event.id,
          eventType: event.type,
          processing: true,
          actions: ['deferred_to_existing_handler'],
        });
      }

      if (lock.reason === 'max_attempts_exceeded') {
        logger.error('Webhook max processing attempts exceeded', null, {
          component: 'stripe',
          operation: 'webhook',
          eventType: event.type,
          eventId: event.id,
        });

        return res.status(200).json({
          received: true,
          eventId: event.id,
          eventType: event.type,
          success: false,
          error: 'Max processing attempts exceeded',
          actions: ['abandoned'],
        });
      }
    }

    // At this point, lock.acquired is guaranteed to be true
    // TypeScript needs explicit narrowing
    if (!lock.acquired) {
      // This should never happen due to early returns above
      return res.status(500).json({ error: 'Internal error: lock state inconsistent' });
    }

    // Log webhook event - lock acquired
    logger.info('Webhook received, processing started', {
      component: 'stripe',
      operation: 'webhook',
      eventType: event.type,
      eventId: event.id,
    });

    try {
      // Process event
      const result = await processEvent(event, logger);

      if (!result.success) {
        // Mark as failed to allow retry
        await lock.markFailed(result.error || 'Unknown processing error');

        logger.error('Webhook processing failed', new Error(result.error || 'Unknown error'), {
          component: 'stripe',
          operation: 'webhook',
          eventType: event.type,
          eventId: event.id,
        });

        // Return 500 to trigger Stripe retry
        return res.status(500).json({
          received: true,
          eventId: event.id,
          eventType: event.type,
          ...result,
        });
      }

      // Success - release lock and mark as processed
      await lock.releaseLock();

      const successResponse = createSuccessResponse({
        received: true,
        eventId: event.id,
        eventType: event.type,
        ...result,
      }, 200, logger);

      return res.status(successResponse.statusCode).json(successResponse.body);
    } catch (error) {
      const err = error as Error;

      // Mark webhook as failed to allow retry (if lock was acquired)
      if (lock.acquired) {
        await lock.markFailed(err.message || 'Unknown processing error');
      }

      logger.error('Webhook processing error', err, {
        component: 'stripe',
        operation: 'webhook',
        eventType: event.type,
        eventId: event.id,
      });

      await captureError(err, {
        tags: { component: 'stripe', operation: 'webhook' },
        extra: { eventId: event.id, eventType: event.type },
      });

      // Return 500 to trigger Stripe retry for unexpected errors
      return res.status(500).json({
        received: true,
        eventId: event.id,
        eventType: event.type,
        error: err.message || 'Processing error - will retry',
      });
    }
  });
}

// ============================================================================
// EVENT PROCESSING
// ============================================================================

interface ProcessingResult {
  success: boolean;
  actions?: string[];
  error?: string;
}

async function processEvent(
  event: Stripe.Event,
  logger: ApiLogger
): Promise<ProcessingResult> {
  try {
    // Process event based on type
    let result: ProcessingResult;
    
    switch (event.type) {
      case 'payment_intent.succeeded':
        result = await handlePaymentIntentSucceeded(
          event.data.object as Stripe.PaymentIntent
        );
        break;
        
      case 'payment_intent.payment_failed':
        result = await handlePaymentIntentFailed(
          event.data.object as Stripe.PaymentIntent
        );
        break;
      
      // NEW: Handle async payments that require action (OXXO, Boleto vouchers)
      case 'payment_intent.requires_action':
        result = await handlePaymentIntentRequiresAction(
          event.data.object as Stripe.PaymentIntent
        );
        break;
      
      // NEW: Handle payments being processed (bank transfers, SEPA)
      case 'payment_intent.processing':
        result = await handlePaymentIntentProcessing(
          event.data.object as Stripe.PaymentIntent
        );
        break;
        
      case 'transfer.created':
        result = await handleTransferCreated(
          event.data.object as Stripe.Transfer
        );
        break;
        
      case 'transfer.failed' as Stripe.Event.Type:
        result = await handleTransferFailed(
          event.data.object as Stripe.Transfer
        );
        break;
        
      case 'account.updated':
        result = await handleAccountUpdated(
          event.data.object as Stripe.Account
        );
        break;
        
      case 'charge.dispute.created':
        result = await handleDisputeCreated(
          event.data.object as Stripe.Dispute
        );
        break;
        
      case 'charge.refunded':
        result = await handleChargeRefunded(
          event.data.object as Stripe.Charge
        );
        break;
        
      default:
        // Log unhandled event
        logger.warn('Unhandled webhook event', { eventType: event.type, eventId: event.id });
        result = { success: true, actions: ['ignored'] };
        break;
    }
    
    // Mark event as processed if successful
    if (result.success) {
      await markEventAsProcessed(event.id, {
        eventType: event.type,
        actions: result.actions,
      });
    } else {
      // Mark event as failed
      await markEventAsFailed(event.id, result.error || 'Unknown error', {
        eventType: event.type,
        actions: result.actions,
      });
    }
    
    return result;
  } catch (error) {
    const err = error as Error;
    
    // Mark event as failed
    await markEventAsFailed(event.id, err.message, {
      eventType: event.type,
      errorStack: err.stack,
    });
    
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
 * Handle successful payment - credit user balance and update lastDepositCurrency
 */
async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent
): Promise<ProcessingResult> {
  const actions: string[] = [];
  
  const userId = paymentIntent.metadata.firebaseUserId;
  if (!userId) {
    return { success: false, error: 'Missing firebaseUserId in metadata' };
  }
  
  // Get currency from payment intent
  const currency = paymentIntent.currency.toUpperCase();
  
  // Check if already processed (idempotency)
  const existingTx = await findTransactionByPaymentIntent(paymentIntent.id);
  if (existingTx?.status === 'completed') {
    return { success: true, actions: ['already_processed'] };
  }
  
  // Get payment method details for display
  let paymentMethodDisplay = 'Payment';
  let paymentMethodType: PaymentMethodType = 'card';
  
  if (paymentIntent.payment_method) {
    try {
      const pm = await getStripe().paymentMethods.retrieve(
        paymentIntent.payment_method as string
      );
      
      // Map the payment method type
      paymentMethodType = mapPaymentMethodType(pm.type);
      
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
      } else if (pm.type === 'sepa_debit') {
        const sepa = pm.sepa_debit;
        paymentMethodDisplay = sepa ? `SEPA ****${sepa.last4}` : 'SEPA Debit';
      } else if (pm.type === 'ideal') {
        paymentMethodDisplay = 'iDEAL';
      } else if (pm.type === 'bancontact') {
        paymentMethodDisplay = 'Bancontact';
      } else if (pm.type === 'sofort') {
        paymentMethodDisplay = 'Sofort';
      } else if (pm.type === 'p24') {
        paymentMethodDisplay = 'Przelewy24';
      } else if (pm.type === 'blik') {
        paymentMethodDisplay = 'BLIK';
      } else if (pm.type === 'eps') {
        paymentMethodDisplay = 'EPS';
      } else if (pm.type === 'fpx') {
        paymentMethodDisplay = 'FPX';
      } else if (pm.type === 'grabpay') {
        paymentMethodDisplay = 'GrabPay';
      } else if (pm.type === 'multibanco') {
        paymentMethodDisplay = 'Multibanco';
      } else if (pm.type === 'paynow') {
        paymentMethodDisplay = 'PayNow';
      } else if (pm.type === 'promptpay') {
        paymentMethodDisplay = 'PromptPay';
      } else if (pm.type === 'oxxo') {
        paymentMethodDisplay = 'OXXO';
      } else if (pm.type === 'boleto') {
        paymentMethodDisplay = 'Boleto';
      } else if (pm.type === 'pix') {
        paymentMethodDisplay = 'Pix';
      } else if (pm.type === 'link') {
        paymentMethodDisplay = 'Link';
      } else if (pm.type === 'cashapp') {
        paymentMethodDisplay = 'Cash App Pay';
      } else {
        paymentMethodDisplay = pm.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      }
    } catch (e) {
      // Use default
    }
  }
  
  // Create or update transaction record with currency
  if (existingTx) {
    await updateTransactionStatus(existingTx.id, 'completed');
    actions.push('transaction_updated');
  } else {
    await createTransaction({
      userId,
      type: 'deposit',
      amountCents: paymentIntent.amount,
      currency,
      paymentMethodType,
      stripePaymentIntentId: paymentIntent.id,
      paymentMethod: paymentMethodDisplay,
      description: 'Deposit',
    });
    actions.push('transaction_created');
  }
  
  // Credit user balance
  await updateUserBalance(userId, paymentIntent.amount, 'add');
  actions.push('balance_credited');
  
  // Update user's last deposit currency for display currency auto-tracking
  try {
    await updateLastDepositCurrency(userId, currency);
    actions.push('last_deposit_currency_updated');
  } catch (e) {
    // Log warning
    logger.warn('Failed to update lastDepositCurrency', {
      error: e instanceof Error ? e.message : String(e),
      component: 'stripe',
      operation: 'update-last-deposit-currency',
    });
    // Don't fail the whole operation for this
  }
  
  // Log audit event with currency
  await logPaymentEvent(userId, 'payment_succeeded', {
    transactionId: existingTx?.id,
    amountCents: paymentIntent.amount,
    severity: 'low',
    metadata: { currency, paymentMethodType },
  });
  actions.push('audit_logged');
  
  return { success: true, actions };
}

/**
 * Handle payment requiring action (OXXO, Boleto vouchers)
 * User has received a voucher and needs to pay at a store/bank
 */
async function handlePaymentIntentRequiresAction(
  paymentIntent: Stripe.PaymentIntent
): Promise<ProcessingResult> {
  const actions: string[] = [];
  
  const userId = paymentIntent.metadata.firebaseUserId;
  if (!userId) {
    return { success: false, error: 'Missing firebaseUserId in metadata' };
  }
  
  const currency = paymentIntent.currency.toUpperCase();
  
  // Check for OXXO voucher
  let voucherUrl: string | undefined;
  let expiresAt: string | undefined;
  
  if (paymentIntent.next_action?.oxxo_display_details) {
    voucherUrl = paymentIntent.next_action.oxxo_display_details.hosted_voucher_url || undefined;
    if (paymentIntent.next_action.oxxo_display_details.expires_after) {
      expiresAt = new Date(paymentIntent.next_action.oxxo_display_details.expires_after * 1000).toISOString();
    }
  }
  
  // Check for Boleto voucher
  if (paymentIntent.next_action?.boleto_display_details) {
    voucherUrl = paymentIntent.next_action.boleto_display_details.hosted_voucher_url || undefined;
    if (paymentIntent.next_action.boleto_display_details.expires_at) {
      expiresAt = new Date(paymentIntent.next_action.boleto_display_details.expires_at * 1000).toISOString();
    }
  }
  
  // Update or create transaction with voucher info
  const existingTx = await findTransactionByPaymentIntent(paymentIntent.id);
  if (existingTx) {
    // Update existing transaction with voucher URL
    const db = getDb();
    const transactionRef = doc(db, 'transactions', existingTx.id);
    await updateDoc(transactionRef, {
      status: 'pending',
      voucherUrl,
      expiresAt,
      updatedAt: new Date().toISOString(),
    });
    actions.push('transaction_updated_with_voucher');
  } else {
    // Create pending transaction with voucher info
    await createTransaction({
      userId,
      type: 'deposit',
      amountCents: paymentIntent.amount,
      currency,
      stripePaymentIntentId: paymentIntent.id,
      description: 'Deposit (awaiting payment)',
      voucherUrl,
      expiresAt,
    });
    actions.push('pending_transaction_created');
  }
  
  // Log event
  await logPaymentEvent(userId, 'payment_initiated', {
    amountCents: paymentIntent.amount,
    severity: 'low',
    metadata: { 
      currency, 
      hasVoucher: !!voucherUrl,
      expiresAt,
    },
  });
  actions.push('audit_logged');
  
  return { success: true, actions };
}

/**
 * Handle payment processing (bank transfers, SEPA - take time to confirm)
 */
async function handlePaymentIntentProcessing(
  paymentIntent: Stripe.PaymentIntent
): Promise<ProcessingResult> {
  const actions: string[] = [];
  
  const userId = paymentIntent.metadata.firebaseUserId;
  if (!userId) {
    return { success: false, error: 'Missing firebaseUserId in metadata' };
  }
  
  const currency = paymentIntent.currency.toUpperCase();
  
  // Update transaction status to processing
  const existingTx = await findTransactionByPaymentIntent(paymentIntent.id);
  if (existingTx) {
    await updateTransactionStatus(existingTx.id, 'processing');
    actions.push('transaction_status_updated');
  } else {
    // Create processing transaction
    await createTransaction({
      userId,
      type: 'deposit',
      amountCents: paymentIntent.amount,
      currency,
      stripePaymentIntentId: paymentIntent.id,
      description: 'Deposit (processing)',
    });
    actions.push('processing_transaction_created');
  }
  
  // Log event
  await logPaymentEvent(userId, 'payment_initiated', {
    transactionId: existingTx?.id,
    amountCents: paymentIntent.amount,
    severity: 'low',
    metadata: { currency },
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
  
  const currency = paymentIntent.currency.toUpperCase();
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
    metadata: { errorMessage, currency },
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
  
  const currency = transfer.currency.toUpperCase();
  
  // Check if transaction already exists
  const existingTx = await findTransactionByTransfer(transfer.id);
  if (existingTx) {
    return { success: true, actions: ['already_processed'] };
  }
  
  // Debit user balance
  await updateUserBalance(userId, transfer.amount, 'subtract');
  
  // Create transaction record with currency
  await createTransaction({
    userId,
    type: 'withdrawal',
    amountCents: -transfer.amount, // Negative for withdrawals
    currency,
    stripeTransferId: transfer.id,
    description: 'Withdrawal',
  });
  
  // Log audit event
  await logPaymentEvent(userId, 'payout_initiated', {
    amountCents: transfer.amount,
    severity: 'low',
    metadata: { currency },
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
  
  const currency = transfer.currency.toUpperCase();
  
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
    metadata: { currency },
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
  const db = getDb();
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
  const db = getDb();
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
    severity: 'critical' as const,
    metadata: {
      disputeId: dispute.id,
      reason: dispute.reason,
      currency: dispute.currency.toUpperCase(),
    },
  });
  actions.push('dispute_logged');
  
  // Alert should be sent (via existing security system)
  // Log critical dispute (structured logger in production)
  const { logger } = await import('../../../lib/structuredLogger');
  logger.error('CRITICAL: Dispute received', new Error('Chargeback dispute'), {
    userId,
    amount: dispute.amount,
    currency: dispute.currency,
    disputeId: dispute.id,
  });
  
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
  
  const currency = charge.currency.toUpperCase();
  
  // Find original transaction
  const transaction = await findTransactionByPaymentIntent(paymentIntent);
  if (!transaction) {
    return { success: false, error: 'Original transaction not found' };
  }
  
  const userId = transaction.userId;
  const refundAmount = charge.amount_refunded;
  
  // Debit refunded amount from balance
  await updateUserBalance(userId, refundAmount, 'subtract');
  
  // Create refund transaction record with currency
  await createTransaction({
    userId,
    type: 'refund',
    amountCents: -refundAmount,
    currency,
    stripePaymentIntentId: paymentIntent,
    description: 'Refund',
    referenceId: transaction.id,
  });
  
  // Log audit event
  await logPaymentEvent(userId, 'refund_processed', {
    transactionId: transaction.id,
    amountCents: refundAmount,
    severity: 'medium',
    metadata: { currency },
  });
  
  return { success: true, actions: ['refund_processed', 'balance_adjusted'] };
}
