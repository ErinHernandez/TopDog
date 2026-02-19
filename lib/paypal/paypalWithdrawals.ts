/**
 * PayPal Withdrawal System
 *
 * Handles withdrawals with security tiers:
 * - Standard (<$1,000): Process immediately
 * - Confirmation Required ($1,000-$9,999): Email/SMS confirmation
 * - Hold Required ($10,000-$49,999): 24-hour hold + notification
 * - Support Required ($50,000+): Support team outreach
 */

import crypto from 'crypto';

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';

import { captureError } from '../errorTracking';
import { getDb } from '../firebase-utils';
import { serverLogger } from '../logger/serverLogger';


import {
  paypalApiRequest,
  centsToPayPalAmount,
} from './paypalClient';
import {
  getLinkedPayPalAccount,
} from './paypalOAuth';
import {
  updateUserBalance,
  getWithdrawalCountLast24Hours,
  checkWithdrawalLimitWarning,
  logPaymentEvent,
  createPayPalTransaction,
} from './paypalService';
import type {
  WithdrawalRequest,
  WithdrawalResponse,
  WithdrawalSecurityTier,
  WithdrawalStatus,
  PendingWithdrawal,
  HeldWithdrawal,
  SupportReviewWithdrawal,
  PayPalPayoutResponse,
  LinkedPayPalAccount,
} from './paypalTypes';
import { PAYPAL_WITHDRAWAL_LIMITS } from './paypalTypes';


// ============================================================================
// SECURITY TIER DETERMINATION
// ============================================================================

/**
 * Determine the security tier for a withdrawal amount
 */
export function getSecurityTier(amountCents: number): WithdrawalSecurityTier {
  const { securityTiers } = PAYPAL_WITHDRAWAL_LIMITS;

  if (amountCents >= securityTiers.supportRequired) {
    return 'support_required';
  }
  if (amountCents >= securityTiers.holdRequired) {
    return 'hold_required';
  }
  if (amountCents >= securityTiers.confirmationRequired) {
    return 'confirmation_required';
  }
  return 'standard';
}

// ============================================================================
// MAIN WITHDRAWAL REQUEST HANDLER
// ============================================================================

/**
 * Request a withdrawal
 * Routes to appropriate handler based on security tier
 */
export async function requestWithdrawal(
  request: WithdrawalRequest
): Promise<WithdrawalResponse> {
  const { userId, amountCents, linkedAccountId, confirmationMethod } = request;

  try {
    // 1. Get linked PayPal account (OAuth only - no manual email)
    const linkedAccount = await getLinkedPayPalAccount(userId, linkedAccountId);
    if (!linkedAccount) {
      return {
        success: false,
        error: 'No linked PayPal account found. Please connect your PayPal account first.',
      };
    }

    // 2. Check daily withdrawal limit
    const todayCount = await getWithdrawalCountLast24Hours(userId);
    if (todayCount >= PAYPAL_WITHDRAWAL_LIMITS.maxPerDay) {
      return {
        success: false,
        error: 'You have reached the maximum of 3 withdrawals per 24 hour period.',
      };
    }

    // 3. Check for warning (show after 2nd withdrawal)
    const warning = await checkWithdrawalLimitWarning(userId);

    // 4. Determine security tier and required actions
    const securityTier = getSecurityTier(amountCents);

    // 5. Handle based on security tier
    let result: WithdrawalResponse;

    switch (securityTier) {
      case 'standard':
        // Under $1,000 - process immediately
        result = await processImmediateWithdrawal(userId, amountCents, linkedAccount);
        break;

      case 'confirmation_required':
        // $1,000 - $9,999 - require email/SMS confirmation
        if (!confirmationMethod) {
          return {
            success: false,
            error: 'Withdrawals of $1,000 or more require email or SMS confirmation.',
            securityTier,
          };
        }
        result = await initiateConfirmedWithdrawal(
          userId,
          amountCents,
          linkedAccount,
          confirmationMethod
        );
        break;

      case 'hold_required':
        // $10,000 - $49,999 - 24-hour hold + notification
        result = await initiateHeldWithdrawal(userId, amountCents, linkedAccount);
        break;

      case 'support_required':
        // $50,000+ - requires support outreach
        result = await initiateSupportReviewWithdrawal(userId, amountCents, linkedAccount);
        break;
    }

    // Add warning if applicable
    return {
      ...result,
      securityTier,
      warning,
    };
  } catch (error) {
    await captureError(error as Error, {
      tags: { component: 'paypal', operation: 'requestWithdrawal' },
      extra: { userId, amountCents },
    });

    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

// ============================================================================
// STANDARD WITHDRAWAL (Under $1,000)
// ============================================================================

/**
 * Process an immediate withdrawal (standard tier)
 */
async function processImmediateWithdrawal(
  userId: string,
  amountCents: number,
  linkedAccount: LinkedPayPalAccount
): Promise<WithdrawalResponse> {
  // 1. Deduct balance first
  const balanceResult = await updateUserBalance(
    userId,
    amountCents,
    'subtract',
    `withdrawal_${Date.now()}`
  );

  if (!balanceResult.success) {
    return {
      success: false,
      error: balanceResult.error || 'Failed to deduct balance',
    };
  }

  try {
    // 2. Create PayPal payout
    const payoutResult = await createPayPalPayout(
      userId,
      linkedAccount.paypalEmail,
      amountCents
    );

    if (!payoutResult.success) {
      // Restore balance on failure
      await updateUserBalance(
        userId,
        amountCents,
        'add',
        `withdrawal_reversal_${Date.now()}`
      );

      return {
        success: false,
        error: payoutResult.error || 'Payout failed',
      };
    }

    // 3. Create transaction record
    await createPayPalTransaction({
      userId,
      type: 'withdrawal',
      amountCents,
      currency: 'USD',
      status: 'processing',
      paypalPayoutBatchId: payoutResult.payoutBatchId,
      paypalPayoutItemId: payoutResult.payoutItemId,
      linkedAccountId: linkedAccount.id,
      description: `Withdrawal to ${linkedAccount.paypalEmail}`,
    });

    // 4. Log event
    await logPaymentEvent(userId, 'paypal_withdrawal_initiated', {
      amountCents,
      paypalEmail: linkedAccount.paypalEmail,
      securityTier: 'standard',
    });

    return {
      success: true,
      withdrawalId: payoutResult.payoutBatchId,
      status: 'processing',
      message: 'Withdrawal initiated. Funds will arrive in your PayPal account shortly.',
    };
  } catch (error) {
    // Restore balance on error
    await updateUserBalance(
      userId,
      amountCents,
      'add',
      `withdrawal_error_reversal_${Date.now()}`
    );

    throw error;
  }
}

// ============================================================================
// CONFIRMATION REQUIRED WITHDRAWAL ($1,000 - $9,999)
// ============================================================================

/**
 * Generate a secure confirmation code
 */
function generateConfirmationCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Hash a confirmation code for storage
 */
function hashConfirmationCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

/**
 * Initiate a withdrawal requiring confirmation
 */
async function initiateConfirmedWithdrawal(
  userId: string,
  amountCents: number,
  linkedAccount: LinkedPayPalAccount,
  confirmationMethod: 'email' | 'sms'
): Promise<WithdrawalResponse> {
  const db = getDb();

  // 1. Generate confirmation code
  const confirmationCode = generateConfirmationCode();
  const confirmationCodeHash = hashConfirmationCode(confirmationCode);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

  // 2. Store pending withdrawal
  const pendingRef = await addDoc(collection(db, 'pending_withdrawals'), {
    userId,
    amountCents,
    linkedAccountId: linkedAccount.id,
    confirmationCodeHash,
    confirmationMethod,
    expiresAt,
    status: 'awaiting_confirmation' as WithdrawalStatus,
    createdAt: new Date().toISOString(),
  });

  // 3. Send confirmation code
  if (confirmationMethod === 'email') {
    await sendWithdrawalConfirmationEmail(userId, amountCents, confirmationCode);
  } else {
    await sendWithdrawalConfirmationSMS(userId, amountCents, confirmationCode);
  }

  // 4. Log event
  await logPaymentEvent(userId, 'paypal_withdrawal_confirmation_sent', {
    amountCents,
    confirmationMethod,
    pendingId: pendingRef.id,
  });

  return {
    success: true,
    pendingId: pendingRef.id,
    status: 'awaiting_confirmation',
    message: `A ${confirmationMethod === 'email' ? 'confirmation email' : 'confirmation code via SMS'} has been sent. Please enter the code to complete your withdrawal.`,
  };
}

/**
 * Confirm and process a pending withdrawal
 */
export async function confirmWithdrawal(
  pendingId: string,
  confirmationCode: string,
  userId: string
): Promise<WithdrawalResponse> {
  const db = getDb();
  const pendingRef = doc(db, 'pending_withdrawals', pendingId);
  const pendingDoc = await getDoc(pendingRef);

  if (!pendingDoc.exists()) {
    return {
      success: false,
      error: 'Withdrawal request not found or has expired.',
    };
  }

  const pending = pendingDoc.data() as PendingWithdrawal;

  // Verify ownership
  if (pending.userId !== userId) {
    return {
      success: false,
      error: 'Invalid withdrawal request.',
    };
  }

  // Check status
  if (pending.status !== 'awaiting_confirmation') {
    return {
      success: false,
      error: 'This withdrawal has already been processed.',
    };
  }

  // Check expiration
  if (new Date() > new Date(pending.expiresAt)) {
    await updateDoc(pendingRef, { status: 'cancelled' });
    return {
      success: false,
      error: 'Confirmation code has expired. Please start a new withdrawal.',
    };
  }

  // Verify confirmation code
  const providedHash = hashConfirmationCode(confirmationCode);
  if (providedHash !== pending.confirmationCodeHash) {
    return {
      success: false,
      error: 'Invalid confirmation code.',
    };
  }

  // Mark as processing
  await updateDoc(pendingRef, { status: 'processing' });

  // Get linked account
  const linkedAccount = await getLinkedPayPalAccount(userId, pending.linkedAccountId);
  if (!linkedAccount) {
    await updateDoc(pendingRef, { status: 'failed' });
    return {
      success: false,
      error: 'Linked PayPal account not found.',
    };
  }

  // Process the withdrawal
  const result = await processImmediateWithdrawal(
    userId,
    pending.amountCents,
    linkedAccount
  );

  // Update pending record
  await updateDoc(pendingRef, {
    status: result.success ? 'completed' : 'failed',
  });

  return result;
}

// ============================================================================
// HELD WITHDRAWAL ($10,000 - $49,999)
// ============================================================================

/**
 * Initiate a withdrawal with 24-hour hold
 */
async function initiateHeldWithdrawal(
  userId: string,
  amountCents: number,
  linkedAccount: LinkedPayPalAccount
): Promise<WithdrawalResponse> {
  const db = getDb();
  const releaseAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

  // 1. Deduct balance immediately (prevents double-spend)
  const balanceResult = await updateUserBalance(
    userId,
    amountCents,
    'subtract',
    `held_withdrawal_${Date.now()}`
  );

  if (!balanceResult.success) {
    return {
      success: false,
      error: balanceResult.error || 'Insufficient balance',
    };
  }

  // 2. Create held withdrawal record
  const heldRef = await addDoc(collection(db, 'held_withdrawals'), {
    userId,
    amountCents,
    linkedAccountId: linkedAccount.id,
    status: 'held' as WithdrawalStatus,
    releaseAt,
    createdAt: new Date().toISOString(),
  });

  // 3. Send notification to user
  await sendWithdrawalHoldNotification(userId, amountCents, releaseAt);

  // 4. Schedule release job (in production, use a job queue like Bull)
  // For now, we'll rely on a cron job to process held withdrawals
  await scheduleWithdrawalRelease(heldRef.id, releaseAt);

  // 5. Log event
  await logPaymentEvent(userId, 'paypal_withdrawal_held', {
    amountCents,
    heldId: heldRef.id,
    releaseAt,
  });

  return {
    success: true,
    withdrawalId: heldRef.id,
    status: 'held',
    releaseAt,
    message: `For your security, this withdrawal has a 24-hour hold. It will be processed on ${new Date(releaseAt).toLocaleString()}. You'll receive a notification when it's complete.`,
  };
}

/**
 * Cancel a held withdrawal
 */
export async function cancelHeldWithdrawal(
  heldId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const db = getDb();
  const heldRef = doc(db, 'held_withdrawals', heldId);
  const heldDoc = await getDoc(heldRef);

  if (!heldDoc.exists()) {
    return { success: false, error: 'Withdrawal not found' };
  }

  const held = heldDoc.data() as HeldWithdrawal;

  if (held.userId !== userId) {
    return { success: false, error: 'Invalid withdrawal' };
  }

  if (held.status !== 'held') {
    return { success: false, error: 'Withdrawal cannot be cancelled' };
  }

  // Restore balance
  await updateUserBalance(
    userId,
    held.amountCents,
    'add',
    `cancel_held_${heldId}`
  );

  // Mark as cancelled
  await updateDoc(heldRef, { status: 'cancelled' });

  // Log event
  await logPaymentEvent(userId, 'paypal_held_withdrawal_cancelled', {
    heldId,
    amountCents: held.amountCents,
  });

  return { success: true };
}

/**
 * Process a held withdrawal (called by cron job after hold period)
 */
export async function processHeldWithdrawal(heldId: string): Promise<void> {
  const db = getDb();
  const heldRef = doc(db, 'held_withdrawals', heldId);
  const heldDoc = await getDoc(heldRef);

  if (!heldDoc.exists()) {
    serverLogger.warn('Held withdrawal not found', null, { heldId });
    return;
  }

  const held = heldDoc.data() as HeldWithdrawal;

  if (held.status !== 'held') {
    serverLogger.info('Held withdrawal already processed', { heldId, status: held.status });
    return;
  }

  // Get linked account
  const linkedAccount = await getLinkedPayPalAccount(held.userId, held.linkedAccountId);
  if (!linkedAccount) {
    await updateDoc(heldRef, { status: 'failed' });
    serverLogger.error('Linked account not found for held withdrawal', null, { heldId });
    return;
  }

  // Create PayPal payout (balance already deducted)
  const payoutResult = await createPayPalPayout(
    held.userId,
    linkedAccount.paypalEmail,
    held.amountCents
  );

  if (payoutResult.success) {
    await updateDoc(heldRef, {
      status: 'completed',
      payoutBatchId: payoutResult.payoutBatchId,
      processedAt: new Date().toISOString(),
    });

    // Create transaction record
    await createPayPalTransaction({
      userId: held.userId,
      type: 'withdrawal',
      amountCents: held.amountCents,
      currency: 'USD',
      status: 'completed',
      paypalPayoutBatchId: payoutResult.payoutBatchId,
      linkedAccountId: held.linkedAccountId,
      description: `Held withdrawal to ${linkedAccount.paypalEmail}`,
    });

    // Notify user
    await sendWithdrawalCompleteNotification(held.userId, held.amountCents);
  } else {
    // Restore balance on failure
    await updateUserBalance(
      held.userId,
      held.amountCents,
      'add',
      `held_withdrawal_failed_${heldId}`
    );

    await updateDoc(heldRef, {
      status: 'failed',
      errorMessage: payoutResult.error,
    });
  }
}

// ============================================================================
// SUPPORT REVIEW WITHDRAWAL ($50,000+)
// ============================================================================

/**
 * Initiate a withdrawal requiring support review
 */
async function initiateSupportReviewWithdrawal(
  userId: string,
  amountCents: number,
  linkedAccount: LinkedPayPalAccount
): Promise<WithdrawalResponse> {
  const db = getDb();

  // 1. Deduct balance (hold funds)
  const balanceResult = await updateUserBalance(
    userId,
    amountCents,
    'subtract',
    `support_review_${Date.now()}`
  );

  if (!balanceResult.success) {
    return {
      success: false,
      error: balanceResult.error || 'Insufficient balance',
    };
  }

  // 2. Create support review record
  const reviewRef = await addDoc(collection(db, 'support_review_withdrawals'), {
    userId,
    amountCents,
    linkedAccountId: linkedAccount.id,
    status: 'pending_support_review' as WithdrawalStatus,
    createdAt: new Date().toISOString(),
  });

  // 3. Notify user
  await sendSupportReviewNotification(userId, amountCents);

  // 4. Alert support team (create support ticket)
  await createSupportTicket({
    type: 'large_withdrawal_review',
    userId,
    amountCents,
    withdrawalId: reviewRef.id,
    priority: 'high',
  });

  // 5. Log event
  await logPaymentEvent(userId, 'paypal_withdrawal_support_review', {
    amountCents,
    reviewId: reviewRef.id,
  });

  return {
    success: true,
    withdrawalId: reviewRef.id,
    status: 'pending_support_review',
    message: 'For withdrawals of $50,000 or more, our support team will contact you within 24 hours to verify and process your withdrawal securely.',
  };
}

// ============================================================================
// PAYPAL PAYOUT API
// ============================================================================

/**
 * Create a PayPal payout
 */
async function createPayPalPayout(
  userId: string,
  paypalEmail: string,
  amountCents: number
): Promise<PayPalPayoutResponse> {
  try {
    const payoutPayload = {
      sender_batch_header: {
        sender_batch_id: `topdog_payout_${userId}_${Date.now()}`,
        email_subject: 'You have received a payment from TopDog',
        email_message: 'Your TopDog withdrawal has been processed.',
      },
      items: [
        {
          recipient_type: 'EMAIL',
          amount: {
            currency: 'USD',
            value: centsToPayPalAmount(amountCents),
          },
          receiver: paypalEmail,
          note: 'TopDog account withdrawal',
          sender_item_id: `item_${userId}_${Date.now()}`,
        },
      ],
    };

    const response = await paypalApiRequest<{
      batch_header: {
        payout_batch_id: string;
        batch_status: string;
      };
      items?: Array<{
        payout_item_id: string;
        transaction_status: string;
      }>;
    }>('/v1/payments/payouts', {
      method: 'POST',
      body: payoutPayload,
      idempotencyKey: `payout_${userId}_${Date.now()}`,
    });

    serverLogger.info('PayPal payout created', {
      payoutBatchId: response.batch_header.payout_batch_id,
      userId,
      amountCents,
    });

    return {
      success: true,
      payoutBatchId: response.batch_header.payout_batch_id,
      payoutItemId: response.items?.[0]?.payout_item_id,
      status: response.batch_header.batch_status,
    };
  } catch (error) {
    serverLogger.error('PayPal payout failed', error as Error, {
      userId,
      amountCents,
    });

    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

// ============================================================================
// NOTIFICATION HELPERS (Implement based on your notification system)
// ============================================================================

async function sendWithdrawalConfirmationEmail(
  userId: string,
  amountCents: number,
  code: string
): Promise<void> {
  // TODO: Integrate with your email service (SendGrid, SES, etc.)
  serverLogger.info('Sending withdrawal confirmation email', {
    userId,
    amountCents,
    codeLength: code.length,
  });
  // Example: await sendEmail(userEmail, 'withdrawal-confirmation', { code, amount: amountCents / 100 });
}

async function sendWithdrawalConfirmationSMS(
  userId: string,
  amountCents: number,
  code: string
): Promise<void> {
  // TODO: Integrate with your SMS service (Twilio, etc.)
  serverLogger.info('Sending withdrawal confirmation SMS', {
    userId,
    amountCents,
    codeLength: code.length,
  });
  // Example: await sendSMS(userPhone, `Your TopDog withdrawal code is: ${code}`);
}

async function sendWithdrawalHoldNotification(
  userId: string,
  amountCents: number,
  releaseAt: string
): Promise<void> {
  // TODO: Send notification about held withdrawal
  serverLogger.info('Sending withdrawal hold notification', {
    userId,
    amountCents,
    releaseAt,
  });
}

async function sendSupportReviewNotification(
  userId: string,
  amountCents: number
): Promise<void> {
  // TODO: Send notification about support review
  serverLogger.info('Sending support review notification', {
    userId,
    amountCents,
  });
}

async function sendWithdrawalCompleteNotification(
  userId: string,
  amountCents: number
): Promise<void> {
  // TODO: Send notification about completed withdrawal
  serverLogger.info('Sending withdrawal complete notification', {
    userId,
    amountCents,
  });
}

async function scheduleWithdrawalRelease(
  heldId: string,
  releaseAt: string
): Promise<void> {
  // TODO: Schedule job to process withdrawal after hold period
  // In production, use a job queue like Bull, Agenda, or cloud functions
  serverLogger.info('Scheduled withdrawal release', {
    heldId,
    releaseAt,
  });
}

async function createSupportTicket(data: {
  type: string;
  userId: string;
  amountCents: number;
  withdrawalId: string;
  priority: string;
}): Promise<void> {
  const db = getDb();
  await addDoc(collection(db, 'support_tickets'), {
    ...data,
    status: 'open',
    createdAt: new Date().toISOString(),
  });
  serverLogger.info('Support ticket created', data);
}
