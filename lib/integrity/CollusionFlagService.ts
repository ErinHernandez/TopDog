/**
 * CollusionFlagService
 *
 * Real-time flagging during drafts.
 * Called by LocationIntegrityService after each pick.
 *
 * CRITICAL PRINCIPLE: This service NEVER blocks or stops drafts.
 * All flagging is passive - it only records data for post-draft review.
 * Drafts always complete normally regardless of any flags detected.
 *
 * This service:
 * - Reads proximity flags from pickLocations
 * - Writes/updates draftIntegrityFlags
 * - Does NOT make any decisions (just records flags)
 * - Does NOT prevent picks from being made
 * - Does NOT stop drafts from completing
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  Timestamp,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { logger } from '@/lib/structuredLogger';
import { TRANSACTION_CONFIG } from './config';
import type {
  DraftIntegrityFlags,
  IntegrityFlag,
  FlagEvent,
} from './types';

export class CollusionFlagService {
  /**
   * Record a flag event when proximity is detected
   * Called by LocationIntegrityService.recordPickLocation()
   *
   * Includes retry logic for handling concurrent transaction conflicts
   */
  async recordProximityFlag(params: {
    draftId: string;
    pickNumber: number;
    triggeringUserId: string;
    within50ft: string[];      // UserIds within 50ft
    sameIp: string[];          // UserIds with same IP
    distances?: Map<string, number>;  // Optional: actual distances
  }): Promise<void> {
    const { draftId, pickNumber, triggeringUserId, within50ft, sameIp, distances } = params;

    // No flags to record
    if (within50ft.length === 0 && sameIp.length === 0) {
      return;
    }

    if (!db) {
      throw new Error('Firebase db not initialized');
    }
    if (!db) {
      throw new Error('Firebase db not initialized');
    }
    const flagRef = doc(db, 'draftIntegrityFlags', draftId);
    const now = Timestamp.now();

    // Retry loop for transaction conflicts
    let attempt = 0;

    while (attempt < TRANSACTION_CONFIG.maxAttempts) {
      try {
        await runTransaction(db, async (transaction) => {
          const flagSnap = await transaction.get(flagRef);

          let flags: DraftIntegrityFlags;

          if (!flagSnap.exists()) {
            flags = {
              draftId,
              flaggedPairs: [],
              totalWithin50ftEvents: 0,
              totalSameIpEvents: 0,
              uniqueUserPairsFlagged: 0,
              draftStartedAt: now,
              lastUpdatedAt: now,
              status: 'active',
            };
          } else {
            flags = flagSnap.data() as DraftIntegrityFlags;
          }

          // Process each co-located user
          const allFlaggedUsers = new Set([...within50ft, ...sameIp]);

          for (const otherUserId of allFlaggedUsers) {
            const isWithin50ft = within50ft.includes(otherUserId);
            const isSameIp = sameIp.includes(otherUserId);

            let flagType: 'within50ft' | 'sameIp' | 'both';
            if (isWithin50ft && isSameIp) {
              flagType = 'both';
            } else if (isWithin50ft) {
              flagType = 'within50ft';
            } else {
              flagType = 'sameIp';
            }

            const event: FlagEvent = {
              pickNumber,
              triggeringUserId,
              otherUserId,
              distance: distances?.get(otherUserId),
              timestamp: now,
            };

            // Find or create pair entry (lexicographically ordered)
            const [userId1, userId2] = [triggeringUserId, otherUserId].sort();
            const pairIndex = flags.flaggedPairs.findIndex(
              p => p.userId1 === userId1 && p.userId2 === userId2
            );

            if (pairIndex >= 0) {
              const pair = flags.flaggedPairs[pairIndex];
              pair.events.push(event);
              pair.lastDetectedAt = now;
              pair.eventCount++;

              if (flagType === 'both') {
                pair.flagType = 'both';
              } else if (pair.flagType !== 'both' && pair.flagType !== flagType) {
                pair.flagType = 'both';
              }
            } else {
              flags.flaggedPairs.push({
                userId1,
                userId2,
                flagType,
                events: [event],
                firstDetectedAt: now,
                lastDetectedAt: now,
                eventCount: 1,
              });
              flags.uniqueUserPairsFlagged++;
            }

            if (isWithin50ft) flags.totalWithin50ftEvents++;
            if (isSameIp) flags.totalSameIpEvents++;
          }

          flags.lastUpdatedAt = now;
          transaction.set(flagRef, flags);
        });

        // Success - exit retry loop
        return;

      } catch (error: any) {
        attempt++;

        // Check if it's a transaction conflict error
        const isConflictError =
          error?.code === 'failed-precondition' ||
          error?.code === 'aborted' ||
          error?.message?.includes('transaction') ||
          error?.message?.includes('concurrent') ||
          error?.message?.includes('contention');

        if (!isConflictError || attempt >= TRANSACTION_CONFIG.maxAttempts) {
          // Not a conflict error, or max attempts reached
          logger.error('Failed to record proximity flag after retries', error as Error, {
            component: 'CollusionFlagService',
            method: 'recordProximityFlag',
            draftId,
            pickNumber,
            attempt,
            isConflictError,
          });
          throw error;
        }

        // Log retry attempt
        logger.warn('Transaction conflict, retrying', {
          component: 'CollusionFlagService',
          draftId,
          pickNumber,
          attempt,
          maxAttempts: TRANSACTION_CONFIG.maxAttempts,
        });

        // Exponential backoff with jitter
        const delay = Math.min(
          TRANSACTION_CONFIG.baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 20,
          TRANSACTION_CONFIG.maxDelayMs
        );
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Mark draft as completed (triggers post-draft analysis)
   * 
   * NOTE: This is called AFTER the draft has already completed.
   * The draft status in Firestore is already 'complete' when this runs.
   * This function only updates flag status and triggers analysis - it does NOT
   * affect the draft itself. All analysis happens asynchronously.
   */
  async markDraftCompleted(draftId: string): Promise<void> {
    if (!db) {
      throw new Error('Firebase db not initialized');
    }
    const flagRef = doc(db, 'draftIntegrityFlags', draftId);
    const flagSnap = await getDoc(flagRef);

    if (flagSnap.exists()) {
      await updateDoc(flagRef, {
        status: 'completed',
        lastUpdatedAt: serverTimestamp(),
      });
    }

    // Trigger post-draft analysis (async, non-blocking)
    this.triggerPostDraftAnalysis(draftId).catch(error => {
      logger.error('Failed to trigger post-draft analysis', error as Error, {
        component: 'CollusionFlagService',
        draftId,
      });
    });
  }

  /**
   * Get flags for a draft (for admin viewing)
   */
  async getDraftFlags(draftId: string): Promise<DraftIntegrityFlags | null> {
    if (!db) {
      throw new Error('Firebase db not initialized');
    }
    const flagRef = doc(db, 'draftIntegrityFlags', draftId);
    const flagSnap = await getDoc(flagRef);

    if (!flagSnap.exists()) return null;
    return flagSnap.data() as DraftIntegrityFlags;
  }

  /**
   * Trigger post-draft analysis
   * In production, this would call a Cloud Function
   */
  private async triggerPostDraftAnalysis(draftId: string): Promise<void> {
    try {
      const { PostDraftAnalyzer } = await import('./PostDraftAnalyzer');
      const analyzer = new PostDraftAnalyzer();
      await analyzer.analyzeDraft(draftId);
    } catch (error) {
      logger.warn('Post-draft analysis not available', {
        component: 'CollusionFlagService',
        draftId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

// Singleton export
export const collusionFlagService = new CollusionFlagService();
