/**
 * PayPal Service Layer
 *
 * Centralized PayPal operations with idempotency, error handling, and logging.
 * This service wraps all PayPal API calls and integrates with our logging/error tracking.
 *
 * Mirrors the structure of stripeService.ts for consistency.
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  runTransaction,
  increment,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';

import { captureError } from '../errorTracking';
import { getDb } from '../firebase-utils';
import { serverLogger } from '../logger/serverLogger';

import {
  paypalApiRequest,
  centsToPayPalAmount,
  paypalAmountToCents,
  getPayPalConfig,
} from './paypalClient';
import type {
  CreatePayPalOrderRequest,
  PayPalOrderResponse,
  PayPalCaptureResult,
  PayPalOrder,
  PayPalTransaction,
  PayPalRiskContext,
  PayPalRiskAssessment,
  PAYPAL_DEPOSIT_LIMITS,
} from './paypalTypes';
import { PAYPAL_DEPOSIT_LIMITS as DEPOSIT_LIMITS } from './paypalTypes';

// ============================================================================
// ORDER OPERATIONS
// ============================================================================

/**
 * Create a PayPal order for a deposit
 */
export async function createPayPalOrder(
  request: CreatePayPalOrderRequest
): Promise<PayPalOrderResponse> {
  const { amountCents, currency, userId, idempotencyKey, metadata = {} } = request;

  // Validate amount
  if (amountCents < DEPOSIT_LIMITS.minAmountCents) {
    throw new Error(`Minimum deposit is $${DEPOSIT_LIMITS.minAmountCents / 100}`);
  }
  if (amountCents > DEPOSIT_LIMITS.maxAmountCents) {
    throw new Error(`Maximum deposit is $${DEPOSIT_LIMITS.maxAmountCents / 100}`);
  }

  try {
    const orderPayload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: `topdog_deposit_${userId}_${Date.now()}`,
          description: 'TopDog Account Deposit',
          amount: {
            currency_code: currency,
            value: centsToPayPalAmount(amountCents),
          },
          custom_id: userId, // Store user ID for webhook processing
        },
      ],
      application_context: {
        brand_name: 'TopDog Fantasy Football',
        landing_page: 'LOGIN',
        user_action: 'PAY_NOW',
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/deposit/paypal/success`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/deposit/paypal/cancel`,
      },
    };

    const response = await paypalApiRequest<{
      id: string;
      status: string;
      links: Array<{ rel: string; href: string }>;
    }>('/v2/checkout/orders', {
      method: 'POST',
      body: orderPayload,
      idempotencyKey: idempotencyKey || `order_${userId}_${Date.now()}`,
    });

    // Find the approval URL
    const approvalLink = response.links.find((link) => link.rel === 'approve');
    if (!approvalLink) {
      throw new Error('PayPal order missing approval URL');
    }

    // Store order in Firebase for tracking
    const db = getDb();
    await setDoc(doc(db, 'paypal_orders', response.id), {
      orderId: response.id,
      userId,
      amountCents,
      currency,
      status: response.status,
      createdAt: serverTimestamp(),
      metadata,
    });

    serverLogger.info('PayPal order created', {
      orderId: response.id,
      userId,
      amountCents,
    });

    return {
      orderId: response.id,
      status: response.status as PayPalOrderResponse['status'],
      approvalUrl: approvalLink.href,
    };
  } catch (error) {
    await captureError(error as Error, {
      tags: { component: 'paypal', operation: 'createOrder' },
      extra: { userId, amountCents },
    });
    throw error;
  }
}

/**
 * Capture an approved PayPal order
 */
export async function capturePayPalOrder(
  orderId: string,
  userId: string
): Promise<PayPalCaptureResult> {
  try {
    // First, verify the order exists and belongs to this user
    const db = getDb();
    const orderRef = doc(db, 'paypal_orders', orderId);
    const orderDoc = await getDoc(orderRef);

    if (!orderDoc.exists()) {
      throw new Error('Order not found');
    }

    const orderData = orderDoc.data();
    if (orderData.userId !== userId) {
      throw new Error('Order does not belong to this user');
    }

    if (orderData.status === 'COMPLETED') {
      // Already captured - return success to be idempotent
      return {
        success: true,
        orderId,
        amountCents: orderData.amountCents,
        currency: orderData.currency,
        captureId: orderData.captureId,
      };
    }

    // Capture the order via PayPal API
    const response = await paypalApiRequest<{
      id: string;
      status: string;
      purchase_units: Array<{
        payments: {
          captures: Array<{
            id: string;
            status: string;
            amount: {
              currency_code: string;
              value: string;
            };
          }>;
        };
      }>;
    }>(`/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
    });

    if (response.status !== 'COMPLETED') {
      serverLogger.warn('PayPal capture not completed', null, {
        orderId,
        status: response.status,
      });
      return {
        success: false,
        orderId,
        error: `Capture status: ${response.status}`,
      };
    }

    // Get capture details
    const capture = response.purchase_units[0]?.payments?.captures?.[0];
    if (!capture) {
      throw new Error('No capture found in response');
    }

    const amountCents = paypalAmountToCents(capture.amount.value);

    // Update order in Firebase
    await updateDoc(orderRef, {
      status: 'COMPLETED',
      captureId: capture.id,
      capturedAt: serverTimestamp(),
    });

    serverLogger.info('PayPal order captured', {
      orderId,
      captureId: capture.id,
      amountCents,
    });

    return {
      success: true,
      orderId,
      captureId: capture.id,
      amountCents,
      currency: capture.amount.currency_code,
    };
  } catch (error) {
    await captureError(error as Error, {
      tags: { component: 'paypal', operation: 'captureOrder' },
      extra: { orderId, userId },
    });

    return {
      success: false,
      orderId,
      error: (error as Error).message,
    };
  }
}

/**
 * Get PayPal order details
 */
export async function getPayPalOrder(orderId: string): Promise<PayPalOrder | null> {
  try {
    const response = await paypalApiRequest<{
      id: string;
      status: string;
      create_time: string;
      update_time: string;
      payer?: {
        payer_id: string;
        email_address: string;
        name?: {
          given_name: string;
          surname: string;
        };
      };
      purchase_units: Array<{
        reference_id: string;
        amount: {
          currency_code: string;
          value: string;
        };
      }>;
    }>(`/v2/checkout/orders/${orderId}`);

    return {
      id: response.id,
      status: response.status as PayPalOrder['status'],
      createTime: response.create_time,
      updateTime: response.update_time,
      amountCents: paypalAmountToCents(response.purchase_units[0]!.amount.value),
      currency: response.purchase_units[0]!.amount.currency_code,
      payer: response.payer
        ? {
            payerId: response.payer.payer_id,
            email: response.payer.email_address,
            name: response.payer.name
              ? {
                  givenName: response.payer.name.given_name,
                  surname: response.payer.name.surname,
                }
              : undefined,
          }
        : undefined,
      purchaseUnits: response.purchase_units.map((unit) => ({
        referenceId: unit.reference_id,
        amount: {
          currencyCode: unit.amount.currency_code,
          value: unit.amount.value,
        },
      })),
    };
  } catch (error) {
    serverLogger.error('Failed to get PayPal order', error as Error, { orderId });
    return null;
  }
}

/**
 * Refund a PayPal capture
 */
export async function refundPayPalCapture(
  captureId: string,
  amountCents?: number,
  reason?: string
): Promise<{ success: boolean; refundId?: string; error?: string }> {
  try {
    const body: Record<string, unknown> = {};

    if (amountCents) {
      body.amount = {
        currency_code: 'USD',
        value: centsToPayPalAmount(amountCents),
      };
    }

    if (reason) {
      body.note_to_payer = reason;
    }

    const response = await paypalApiRequest<{
      id: string;
      status: string;
    }>(`/v2/payments/captures/${captureId}/refund`, {
      method: 'POST',
      body: Object.keys(body).length > 0 ? body : undefined,
    });

    serverLogger.info('PayPal refund processed', {
      captureId,
      refundId: response.id,
      amountCents,
    });

    return {
      success: true,
      refundId: response.id,
    };
  } catch (error) {
    await captureError(error as Error, {
      tags: { component: 'paypal', operation: 'refundCapture' },
      extra: { captureId, amountCents },
    });

    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

// ============================================================================
// TRANSACTION MANAGEMENT
// ============================================================================

/**
 * Create a transaction record in Firebase
 */
export async function createPayPalTransaction(
  input: Omit<PayPalTransaction, 'id' | 'createdAt' | 'updatedAt'>
): Promise<PayPalTransaction> {
  const db = getDb();
  const transactionsRef = collection(db, 'transactions');

  const now = new Date().toISOString();
  const transactionData = {
    ...input,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(transactionsRef, transactionData);

  return {
    id: docRef.id,
    ...transactionData,
  } as PayPalTransaction;
}

/**
 * Update a transaction status
 */
export async function updatePayPalTransactionStatus(
  transactionId: string,
  status: PayPalTransaction['status'],
  additionalData?: Partial<PayPalTransaction>
): Promise<void> {
  const db = getDb();
  const transactionRef = doc(db, 'transactions', transactionId);

  await updateDoc(transactionRef, {
    status,
    updatedAt: new Date().toISOString(),
    ...additionalData,
  });
}

// ============================================================================
// USER BALANCE OPERATIONS
// ============================================================================

/**
 * Update user balance atomically
 * Uses Firebase transaction to prevent race conditions
 */
export async function updateUserBalance(
  userId: string,
  amountCents: number,
  operation: 'add' | 'subtract',
  referenceId: string
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  const db = getDb();
  const userRef = doc(db, 'users', userId);
  const balanceLogRef = collection(db, 'balance_logs');

  try {
    const newBalance = await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const currentBalance = userDoc.data().balanceCents || 0;
      const newBalance =
        operation === 'add' ? currentBalance + amountCents : currentBalance - amountCents;

      if (newBalance < 0) {
        throw new Error('Insufficient balance');
      }

      // Update user balance
      transaction.update(userRef, {
        balanceCents: newBalance,
        updatedAt: serverTimestamp(),
      });

      // Create balance log entry
      const logRef = doc(balanceLogRef);
      transaction.set(logRef, {
        userId,
        operation,
        amountCents,
        previousBalance: currentBalance,
        newBalance,
        referenceId,
        source: 'paypal',
        createdAt: serverTimestamp(),
      });

      return newBalance;
    });

    serverLogger.info('User balance updated', {
      userId,
      operation,
      amountCents,
      newBalance,
      referenceId,
    });

    return { success: true, newBalance };
  } catch (error) {
    await captureError(error as Error, {
      tags: { component: 'paypal', operation: 'updateUserBalance' },
      extra: { userId, amountCents, operation, referenceId },
    });

    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

// ============================================================================
// RISK ASSESSMENT
// ============================================================================

/**
 * Assess payment risk for a deposit
 */
export async function assessPaymentRisk(
  userId: string,
  amountCents: number,
  context: PayPalRiskContext
): Promise<PayPalRiskAssessment> {
  const factors: string[] = [];
  let score = 0;

  // Check for high amount
  if (amountCents >= 50000) {
    // $500+
    factors.push('high_amount');
    score += 20;
  }
  if (amountCents >= 100000) {
    // $1000+
    factors.push('very_high_amount');
    score += 15;
  }

  // Check for new device
  if (context.newDevice) {
    factors.push('new_device');
    score += 15;
  }

  // Check recent transaction velocity
  if (context.recentTransactionCount && context.recentTransactionCount >= 5) {
    factors.push('high_velocity');
    score += 20;
  }

  // Check recent transaction total
  if (context.recentTransactionTotal && context.recentTransactionTotal >= 100000) {
    factors.push('high_recent_total');
    score += 15;
  }

  // Determine recommendation
  let recommendation: PayPalRiskAssessment['recommendation'];
  if (score >= 50) {
    recommendation = 'decline';
  } else if (score >= 30) {
    recommendation = 'review';
  } else {
    recommendation = 'approve';
  }

  serverLogger.info('Risk assessment completed', {
    userId,
    amountCents,
    score,
    recommendation,
    factors,
  });

  return { score, factors, recommendation };
}

// ============================================================================
// PAYMENT EVENT LOGGING
// ============================================================================

/**
 * Log a payment event for audit purposes
 */
export async function logPaymentEvent(
  userId: string,
  eventType: string,
  data: Record<string, unknown>
): Promise<void> {
  const db = getDb();
  const eventsRef = collection(db, 'payment_events');

  await addDoc(eventsRef, {
    userId,
    eventType,
    source: 'paypal',
    data,
    createdAt: serverTimestamp(),
  });
}

// ============================================================================
// DAILY LIMITS TRACKING
// ============================================================================

/**
 * Get the number of withdrawals in the last 24 hours
 */
export async function getWithdrawalCountLast24Hours(userId: string): Promise<number> {
  const db = getDb();
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const withdrawalsQuery = query(
    collection(db, 'transactions'),
    where('userId', '==', userId),
    where('type', '==', 'withdrawal'),
    where('status', 'in', ['completed', 'processing', 'held', 'awaiting_confirmation']),
    where('createdAt', '>=', twentyFourHoursAgo.toISOString()),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(withdrawalsQuery);
  return snapshot.size;
}

/**
 * Check if user has reached daily withdrawal limit and return warning if applicable
 */
export async function checkWithdrawalLimitWarning(userId: string): Promise<string | null> {
  const count = await getWithdrawalCountLast24Hours(userId);

  if (count >= 2) {
    return '3 withdrawals maximum per 24 hour period';
  }

  return null;
}
