/**
 * Stripe Transaction Service
 *
 * Manages transaction records and webhook event tracking.
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
} from 'firebase/firestore';

import { captureError } from '../errorTracking';
import { getDb } from '../firebase-utils';

import type {
  CreateTransactionInput,
  Transaction,
  TransactionStatus,
} from './stripeTypes';

/**
 * Webhook event tracking document
 */
export interface StripeWebhookEvent {
  id: string;
  stripeEventId: string;
  eventType: string;
  status: 'pending' | 'processed' | 'failed';
  processedAt?: string;
  failedAt?: string;
  errorMessage?: string;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

/**
 * Create a transaction record in Firebase
 */
export async function createTransaction(
  input: CreateTransactionInput
): Promise<Transaction> {
  try {
    const now = new Date().toISOString();

    // Build transaction object, filtering out undefined values
    const transaction: Omit<Transaction, 'id'> = {
      userId: input.userId,
      type: input.type,
      amountCents: input.amountCents,
      currency: input.currency || 'USD',
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    // Currency tracking fields
    if (input.originalAmountSmallestUnit !== undefined) {
      transaction.originalAmountSmallestUnit = input.originalAmountSmallestUnit;
    }
    if (input.usdEquivalentCents !== undefined) {
      transaction.usdEquivalentCents = input.usdEquivalentCents;
    }
    if (input.exchangeRate !== undefined) {
      transaction.exchangeRate = input.exchangeRate;
    }

    // Payment method tracking
    if (input.paymentMethodType) transaction.paymentMethodType = input.paymentMethodType;
    if (input.voucherUrl) transaction.voucherUrl = input.voucherUrl;
    if (input.expiresAt) transaction.expiresAt = input.expiresAt;

    // Standard optional fields
    if (input.stripePaymentIntentId) transaction.stripePaymentIntentId = input.stripePaymentIntentId;
    if (input.stripePayoutId) transaction.stripePayoutId = input.stripePayoutId;
    if (input.stripeTransferId) transaction.stripeTransferId = input.stripeTransferId;
    if (input.paymentMethod) transaction.paymentMethod = input.paymentMethod;
    if (input.description) transaction.description = input.description;
    if (input.referenceId) transaction.referenceId = input.referenceId;
    if (input.metadata) transaction.metadata = input.metadata;

    const db = getDb();
    const docRef = await addDoc(collection(db, 'transactions'), transaction);

    return {
      id: docRef.id,
      ...transaction,
    };
  } catch (error: unknown) {
    await captureError(error as Error, {
      tags: { component: 'stripe', operation: 'createTransaction' },
      extra: { userId: input.userId, type: input.type },
    });
    throw error;
  }
}

/**
 * Update a transaction's status
 */
export async function updateTransactionStatus(
  transactionId: string,
  status: TransactionStatus,
  errorMessage?: string
): Promise<void> {
  try {
    const db = getDb();
    const transactionRef = doc(db, 'transactions', transactionId);

    const updates: Partial<Transaction> = {
      status,
      updatedAt: new Date().toISOString(),
    };

    if (errorMessage) {
      updates.errorMessage = errorMessage;
    }

    await updateDoc(transactionRef, updates);
  } catch (error: unknown) {
    await captureError(error as Error, {
      tags: { component: 'stripe', operation: 'updateTransactionStatus' },
      extra: { transactionId, status },
    });
    throw error;
  }
}

/**
 * Find transaction by Stripe PaymentIntent ID
 */
export async function findTransactionByPaymentIntent(
  paymentIntentId: string
): Promise<Transaction | null> {
  try {
    const db = getDb();
    const q = query(
      collection(db, 'transactions'),
      where('stripePaymentIntentId', '==', paymentIntentId)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    if (!doc) {
      return null;
    }

    return {
      id: doc.id,
      ...doc.data(),
    } as Transaction;
  } catch (error: unknown) {
    await captureError(error as Error, {
      tags: { component: 'stripe', operation: 'findTransactionByPaymentIntent' },
      extra: { paymentIntentId },
    });
    throw error;
  }
}

/**
 * Find transaction by Stripe Transfer ID
 */
export async function findTransactionByTransfer(
  transferId: string
): Promise<Transaction | null> {
  try {
    const db = getDb();
    const q = query(
      collection(db, 'transactions'),
      where('stripeTransferId', '==', transferId)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    if (!doc) {
      return null;
    }

    return {
      id: doc.id,
      ...doc.data(),
    } as Transaction;
  } catch (error: unknown) {
    await captureError(error as Error, {
      tags: { component: 'stripe', operation: 'findTransactionByTransfer' },
      extra: { transferId },
    });
    throw error;
  }
}

/**
 * Find webhook event by Stripe event ID
 */
export async function findEventByStripeId(
  stripeEventId: string
): Promise<StripeWebhookEvent | null> {
  try {
    const db = getDb();
    const q = query(
      collection(db, 'stripe_webhook_events'),
      where('stripeEventId', '==', stripeEventId)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    if (!doc) {
      return null;
    }

    return {
      id: doc.id,
      ...doc.data(),
    } as StripeWebhookEvent;
  } catch (error: unknown) {
    await captureError(error as Error, {
      tags: { component: 'stripe', operation: 'findEventByStripeId' },
      extra: { stripeEventId },
    });
    throw error;
  }
}

/**
 * Mark webhook event as processed
 */
export async function markEventAsProcessed(
  stripeEventId: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const db = getDb();
    const existingEvent = await findEventByStripeId(stripeEventId);

    if (existingEvent) {
      // Update existing event
      const eventRef = doc(db, 'stripe_webhook_events', existingEvent.id);
      await updateDoc(eventRef, {
        status: 'processed',
        processedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...(metadata && { metadata }),
      });
    } else {
      // Create new event record (shouldn't happen, but handle gracefully)
      const eventRef = doc(collection(db, 'stripe_webhook_events'));
      await setDoc(eventRef, {
        stripeEventId,
        eventType: metadata?.eventType || 'unknown',
        status: 'processed',
        processedAt: new Date().toISOString(),
        retryCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...(metadata && { metadata }),
      });
    }
  } catch (error: unknown) {
    await captureError(error as Error, {
      tags: { component: 'stripe', operation: 'markEventAsProcessed' },
      extra: { stripeEventId },
    });
    // Don't throw - event processing shouldn't fail because of tracking
  }
}

/**
 * Mark webhook event as failed
 */
export async function markEventAsFailed(
  stripeEventId: string,
  errorMessage: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const db = getDb();
    const existingEvent = await findEventByStripeId(stripeEventId);

    if (existingEvent) {
      // Update existing event
      const eventRef = doc(db, 'stripe_webhook_events', existingEvent.id);
      await updateDoc(eventRef, {
        status: 'failed',
        failedAt: new Date().toISOString(),
        errorMessage,
        retryCount: (existingEvent.retryCount || 0) + 1,
        updatedAt: new Date().toISOString(),
        ...(metadata && { metadata }),
      });
    } else {
      // Create new event record for failed event
      const eventRef = doc(collection(db, 'stripe_webhook_events'));
      await setDoc(eventRef, {
        stripeEventId,
        eventType: metadata?.eventType || 'unknown',
        status: 'failed',
        failedAt: new Date().toISOString(),
        errorMessage,
        retryCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...(metadata && { metadata }),
      });
    }
  } catch (error: unknown) {
    await captureError(error as Error, {
      tags: { component: 'stripe', operation: 'markEventAsFailed' },
      extra: { stripeEventId, errorMessage },
    });
    // Don't throw - event tracking shouldn't fail the webhook
  }
}

/**
 * Create or update webhook event record (for idempotency tracking)
 */
export async function createOrUpdateWebhookEvent(
  stripeEventId: string,
  eventType: string,
  metadata?: Record<string, unknown>
): Promise<StripeWebhookEvent> {
  try {
    const db = getDb();
    const existingEvent = await findEventByStripeId(stripeEventId);

    if (existingEvent) {
      // Update existing event
      const eventRef = doc(db, 'stripe_webhook_events', existingEvent.id);
      await updateDoc(eventRef, {
        eventType,
        updatedAt: new Date().toISOString(),
        ...(metadata && { metadata }),
      });
      return {
        ...existingEvent,
        eventType,
        ...(metadata && { metadata }),
      } as StripeWebhookEvent;
    } else {
      // Create new event record
      const eventRef = doc(collection(db, 'stripe_webhook_events'));
      const eventData: Omit<StripeWebhookEvent, 'id'> = {
        stripeEventId,
        eventType,
        status: 'pending',
        retryCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...(metadata && { metadata }),
      };
      await setDoc(eventRef, eventData);
      return {
        id: eventRef.id,
        ...eventData,
      };
    }
  } catch (error: unknown) {
    await captureError(error as Error, {
      tags: { component: 'stripe', operation: 'createOrUpdateWebhookEvent' },
      extra: { stripeEventId, eventType },
    });
    throw error;
  }
}
