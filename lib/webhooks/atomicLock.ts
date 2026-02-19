/**
 * Atomic Webhook Lock System
 *
 * Provides atomic, race-condition-free webhook event deduplication using
 * Firestore transactions. Ensures each webhook event is processed exactly once.
 *
 * @module lib/webhooks/atomicLock
 */

import {
  getFirestore,
  doc,
  runTransaction,
  Timestamp,
  serverTimestamp,
  getDoc,
  setDoc,
} from 'firebase/firestore';

import { db } from '../firebase';
import { serverLogger } from '../logger/serverLogger';

// ============================================================================
// TYPES
// ============================================================================

export type WebhookProvider = 'stripe' | 'paystack' | 'paymongo' | 'xendit' | 'paypal';

export type WebhookLockStatus =
  | 'pending'
  | 'processing'
  | 'processed'
  | 'failed';

export interface WebhookLockRecord {
  eventId: string;
  eventType: string;
  provider: WebhookProvider;
  status: WebhookLockStatus;
  startedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  error?: string;
  attempts: number;
  metadata?: Record<string, unknown>;
}

export type WebhookLockAcquireResult =
  | {
      acquired: true;
      releaseLock: () => Promise<void>;
      markFailed: (error: string) => Promise<void>;
    }
  | {
      acquired: false;
      reason: 'already_processed' | 'already_processing' | 'max_attempts_exceeded';
      existingRecord?: Partial<WebhookLockRecord>;
    };

// ============================================================================
// CONFIGURATION
// ============================================================================

/** Processing timeout in milliseconds (5 minutes) */
const PROCESSING_TIMEOUT_MS = 5 * 60 * 1000;

/** Maximum number of processing attempts before giving up */
const MAX_ATTEMPTS = 5;

/** Collection name for webhook locks */
const WEBHOOK_LOCKS_COLLECTION = 'webhookLocks';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate a unique lock document ID for a webhook event
 */
function getLockDocId(provider: WebhookProvider, eventId: string): string {
  return `${provider}_${eventId}`;
}

/**
 * Check if a processing attempt has timed out
 */
function isProcessingTimedOut(startedAt: Date | Timestamp | undefined): boolean {
  if (!startedAt) return true;

  const startTime =
    startedAt instanceof Timestamp ? startedAt.toDate() : startedAt;
  const elapsed = Date.now() - startTime.getTime();

  return elapsed >= PROCESSING_TIMEOUT_MS;
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Attempt to acquire an atomic lock for processing a webhook event.
 *
 * Uses Firestore transactions to ensure only one handler processes each event.
 * If a lock is already held by another handler, returns immediately with
 * the appropriate reason.
 *
 * @param eventId - The unique identifier for the webhook event
 * @param eventType - The type of webhook event (e.g., 'payment_intent.succeeded')
 * @param provider - The payment provider (stripe, paystack, paymongo, xendit)
 * @param metadata - Optional metadata to store with the lock record
 * @returns Promise resolving to lock acquisition result
 *
 * @example
 * ```typescript
 * const lock = await acquireWebhookLock(event.id, event.type, 'stripe');
 *
 * if (!lock.acquired) {
 *   if (lock.reason === 'already_processed') {
 *     return res.status(200).json({ received: true, duplicate: true });
 *   }
 *   return res.status(200).json({ received: true, processing: true });
 * }
 *
 * try {
 *   await processPayment(event);
 *   await lock.releaseLock();
 *   return res.status(200).json({ received: true });
 * } catch (error) {
 *   await lock.markFailed(error.message);
 *   return res.status(500).json({ error: 'Processing failed' });
 * }
 * ```
 */
export async function acquireWebhookLock(
  eventId: string,
  eventType: string,
  provider: WebhookProvider,
  metadata?: Record<string, unknown>
): Promise<WebhookLockAcquireResult> {
  if (!db) {
    serverLogger.error('Database not available for webhook lock', null, {
      eventId,
      provider,
    });
    throw new Error('Database not available');
  }

  const lockDocId = getLockDocId(provider, eventId);
  const lockRef = doc(db, WEBHOOK_LOCKS_COLLECTION, lockDocId);

  try {
    const result = await runTransaction(db, async (transaction) => {
      const lockDoc = await transaction.get(lockRef);

      if (lockDoc.exists()) {
        const data = lockDoc.data() as WebhookLockRecord;

        // Already fully processed - do not reprocess
        if (data.status === 'processed') {
          return {
            acquired: false as const,
            reason: 'already_processed' as const,
            existingRecord: data,
          };
        }

        // Check max attempts
        if (data.attempts >= MAX_ATTEMPTS) {
          serverLogger.warn('Webhook max attempts exceeded', null, {
            eventId,
            provider,
            attempts: data.attempts,
          });
          return {
            acquired: false as const,
            reason: 'max_attempts_exceeded' as const,
            existingRecord: data,
          };
        }

        // Currently being processed - check for timeout
        if (data.status === 'processing') {
          const startedAt = data.startedAt;

          if (!isProcessingTimedOut(startedAt as Date | Timestamp | undefined)) {
            // Still within timeout window - another handler is processing
            return {
              acquired: false as const,
              reason: 'already_processing' as const,
              existingRecord: data,
            };
          }

          // Processing timed out - allow retry
          serverLogger.warn('Webhook processing timed out, allowing retry', null, {
            eventId,
            provider,
            attempts: data.attempts,
          });
        }

        // Failed status or timed out - increment attempts and acquire lock
        transaction.update(lockRef, {
          status: 'processing',
          startedAt: serverTimestamp(),
          attempts: (data.attempts || 0) + 1,
          error: null,
          failedAt: null,
        });

        return { acquired: true as const, previousAttempts: data.attempts || 0 };
      }

      // No existing record - create new lock
      transaction.set(lockRef, {
        eventId,
        eventType,
        provider,
        status: 'processing',
        startedAt: serverTimestamp(),
        attempts: 1,
        metadata: metadata || null,
        createdAt: serverTimestamp(),
      });

      return { acquired: true as const, previousAttempts: 0 };
    });

    if (!result.acquired) {
      return result;
    }

    // Return lock control functions
    return {
      acquired: true,

      /**
       * Release the lock and mark the event as successfully processed
       */
      releaseLock: async (): Promise<void> => {
        try {
          await setDoc(
            lockRef,
            {
              status: 'processed',
              completedAt: serverTimestamp(),
            },
            { merge: true }
          );

          serverLogger.info('Webhook lock released successfully', {
            eventId,
            provider,
            eventType,
          });
        } catch (error) {
          serverLogger.error('Failed to release webhook lock', error as Error, {
            eventId,
            provider,
          });
          throw error;
        }
      },

      /**
       * Mark the event as failed (allows retry up to max attempts)
       */
      markFailed: async (errorMessage: string): Promise<void> => {
        try {
          await setDoc(
            lockRef,
            {
              status: 'failed',
              failedAt: serverTimestamp(),
              error: errorMessage,
            },
            { merge: true }
          );

          serverLogger.warn('Webhook marked as failed', null, {
            eventId,
            provider,
            error: errorMessage,
          });
        } catch (error) {
          serverLogger.error('Failed to mark webhook as failed', error as Error, {
            eventId,
            provider,
          });
          throw error;
        }
      },
    };
  } catch (error) {
    serverLogger.error('Failed to acquire webhook lock', error as Error, {
      eventId,
      provider,
      eventType,
    });
    throw error;
  }
}

/**
 * Check the status of a webhook event without acquiring a lock
 *
 * @param eventId - The unique identifier for the webhook event
 * @param provider - The payment provider
 * @returns Promise resolving to the lock record or null if not found
 */
export async function getWebhookLockStatus(
  eventId: string,
  provider: WebhookProvider
): Promise<WebhookLockRecord | null> {
  if (!db) {
    throw new Error('Database not available');
  }

  const lockDocId = getLockDocId(provider, eventId);
  const lockRef = doc(db, WEBHOOK_LOCKS_COLLECTION, lockDocId);

  try {
    const lockDoc = await getDoc(lockRef);

    if (!lockDoc.exists()) {
      return null;
    }

    return lockDoc.data() as WebhookLockRecord;
  } catch (error) {
    serverLogger.error('Failed to get webhook lock status', error as Error, {
      eventId,
      provider,
    });
    throw error;
  }
}

/**
 * Check if a webhook event has already been processed
 *
 * @param eventId - The unique identifier for the webhook event
 * @param provider - The payment provider
 * @returns Promise resolving to true if already processed
 */
export async function isWebhookProcessed(
  eventId: string,
  provider: WebhookProvider
): Promise<boolean> {
  const status = await getWebhookLockStatus(eventId, provider);
  return status?.status === 'processed';
}

/**
 * Force mark a webhook as processed (admin use only)
 * Use with caution - bypasses normal processing flow
 *
 * @param eventId - The unique identifier for the webhook event
 * @param provider - The payment provider
 * @param reason - Reason for forcing the status
 */
export async function forceMarkProcessed(
  eventId: string,
  provider: WebhookProvider,
  reason: string
): Promise<void> {
  if (!db) {
    throw new Error('Database not available');
  }

  const lockDocId = getLockDocId(provider, eventId);
  const lockRef = doc(db, WEBHOOK_LOCKS_COLLECTION, lockDocId);

  await setDoc(
    lockRef,
    {
      eventId,
      provider,
      status: 'processed',
      completedAt: serverTimestamp(),
      metadata: {
        forcedBy: 'admin',
        forceReason: reason,
        forcedAt: new Date().toISOString(),
      },
    },
    { merge: true }
  );

  serverLogger.warn('Webhook force marked as processed', null, {
    eventId,
    provider,
    reason,
  });
}

const atomicLockExports = {
  acquireWebhookLock,
  getWebhookLockStatus,
  isWebhookProcessed,
  forceMarkProcessed,
};

export default atomicLockExports;
