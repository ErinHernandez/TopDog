# Collusion Detection System - Implementation Handoff for Cursor

**Project:** Bestball Tournament Integrity - Collusion Detection
**Date:** January 2025
**Status:** Ready for Implementation
**Target:** Cursor AI Agent
**Estimated Total Effort:** 25-35 hours

---

## EXECUTIVE SUMMARY

This document provides complete, copy-paste-ready code fixes for all issues identified in the collusion detection system code review. The existing implementation is located in `lib/integrity/` and needs hardening before production deployment.

### Current State
The collusion detection system has been implemented with:
- Real-time flagging (`CollusionFlagService.ts`)
- Post-draft analysis (`PostDraftAnalyzer.ts`)
- Cross-draft pattern detection (`CrossDraftAnalyzer.ts`)
- Admin review service (`AdminService.ts`)
- ADP data service (`AdpService.ts`)
- API routes in `pages/api/admin/integrity/`

### Existing Utilities to Use
This implementation uses existing project utilities:
- **Logger:** `lib/structuredLogger.ts` - Use `import { logger } from '@/lib/structuredLogger'`
- **Rate Limiter:** `lib/rateLimiter.js` - Use existing `RateLimiter` class, create admin instances in `lib/integrity/adminRateLimiter.ts`

### What Needs To Be Done
1. **CRITICAL:** Add missing Firestore indexes (queries will fail without them)
2. **CRITICAL:** Fix race condition in transaction handling
3. **CRITICAL:** Add input validation to API routes
4. **CRITICAL:** Add error handling for batch operations
5. **HIGH:** Add performance optimizations
6. **HIGH:** Fix cache expiration edge case
7. **HIGH:** Add rate limiting
8. **MEDIUM:** Standardize error logging
9. **MEDIUM:** Extract configuration to separate file

---

## TABLE OF CONTENTS

1. [Critical Fix #1: Firestore Indexes](#critical-fix-1-firestore-indexes)
2. [Critical Fix #2: Race Condition Fix](#critical-fix-2-race-condition-fix)
3. [Critical Fix #3: Input Validation](#critical-fix-3-input-validation)
4. [Critical Fix #4: Batch Error Handling](#critical-fix-4-batch-error-handling)
5. [High Priority Fix #5: Performance Optimization](#high-priority-fix-5-performance-optimization)
6. [High Priority Fix #6: Cache Expiration Fix](#high-priority-fix-6-cache-expiration-fix)
7. [High Priority Fix #7: Rate Limiting](#high-priority-fix-7-rate-limiting)
8. [Medium Priority Fix #8: Configuration File](#medium-priority-fix-8-configuration-file)
9. [Medium Priority Fix #9: Utility Functions](#medium-priority-fix-9-utility-functions)
10. [Testing Checklist](#testing-checklist)
11. [Deployment Checklist](#deployment-checklist)

---

## CRITICAL FIX #1: FIRESTORE INDEXES

**Problem:** Queries will fail in production without composite indexes.

**File to Modify:** `firestore.indexes.json`

### Step 1: Add these indexes to the existing `firestore.indexes.json`

Find the `"indexes": [` array and add these entries before the closing `]`:

```json
    {
      "collectionGroup": "pickLocations",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "draftId", "order": "ASCENDING" },
        { "fieldPath": "pickNumber", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "draftRiskScores",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "maxRiskScore", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "draftRiskScores",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "analyzedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "userPairAnalysis",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "overallRiskLevel", "order": "ASCENDING" },
        { "fieldPath": "lastDraftTogether", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "userPairAnalysis",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId1", "order": "ASCENDING" },
        { "fieldPath": "lastAnalyzedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "userPairAnalysis",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId2", "order": "ASCENDING" },
        { "fieldPath": "lastAnalyzedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "adminActions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "targetType", "order": "ASCENDING" },
        { "fieldPath": "targetId", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "draftIntegrityFlags",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "lastUpdatedAt", "order": "DESCENDING" }
      ]
    }
```

### Step 2: Deploy indexes

```bash
firebase deploy --only firestore:indexes
```

### Step 3: Verify in Firebase Console
- Navigate to Firebase Console → Firestore → Indexes
- Wait for all new indexes to show "Enabled" status (5-30 minutes)

---

## CRITICAL FIX #2: RACE CONDITION FIX

**Problem:** When two users make picks simultaneously, transaction conflicts cause silent failures.

**File to Modify:** `lib/integrity/CollusionFlagService.ts`

**Note:** This fix adds retry logic with exponential backoff to handle concurrent transaction conflicts gracefully.

### Complete Replacement Code

Replace the entire contents of `CollusionFlagService.ts` with:

```typescript
/**
 * CollusionFlagService
 *
 * Real-time flagging during drafts.
 * Called by LocationIntegrityService after each pick.
 *
 * CRITICAL PRINCIPLE: This service NEVER blocks or stops drafts.
 * All flagging is passive - it only records data for post-draft review.
 * Drafts always complete normally regardless of any flags detected.
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
import type {
  DraftIntegrityFlags,
  IntegrityFlag,
  FlagEvent,
} from './types';

// Retry configuration for transaction conflicts
const TRANSACTION_RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelayMs: 50,
  maxDelayMs: 200,
};

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
    within50ft: string[];
    sameIp: string[];
    distances?: Map<string, number>;
  }): Promise<void> {
    const { draftId, pickNumber, triggeringUserId, within50ft, sameIp, distances } = params;

    // No flags to record
    if (within50ft.length === 0 && sameIp.length === 0) {
      return;
    }

    const flagRef = doc(db, 'draftIntegrityFlags', draftId);
    const now = Timestamp.now();

    // Retry loop for transaction conflicts
    let attempt = 0;

    while (attempt < TRANSACTION_RETRY_CONFIG.maxAttempts) {
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

        if (!isConflictError || attempt >= TRANSACTION_RETRY_CONFIG.maxAttempts) {
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
          maxAttempts: TRANSACTION_RETRY_CONFIG.maxAttempts,
        });

        // Exponential backoff with jitter
        const delay = Math.min(
          TRANSACTION_RETRY_CONFIG.baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 20,
          TRANSACTION_RETRY_CONFIG.maxDelayMs
        );
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Mark draft as completed (triggers post-draft analysis)
   */
  async markDraftCompleted(draftId: string): Promise<void> {
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
      logger.error('Failed to trigger post-draft analysis', error, {
        component: 'CollusionFlagService',
        draftId,
      });
    });
  }

  /**
   * Get flags for a draft (for admin viewing)
   */
  async getDraftFlags(draftId: string): Promise<DraftIntegrityFlags | null> {
    const flagRef = doc(db, 'draftIntegrityFlags', draftId);
    const flagSnap = await getDoc(flagRef);

    if (!flagSnap.exists()) return null;
    return flagSnap.data() as DraftIntegrityFlags;
  }

  /**
   * Trigger post-draft analysis
   */
  private async triggerPostDraftAnalysis(draftId: string): Promise<void> {
    try {
      const { PostDraftAnalyzer } = await import('./PostDraftAnalyzer');
      const analyzer = new PostDraftAnalyzer();
      await analyzer.analyzeDraft(draftId);
    } catch (error) {
      logger.warn('Post-draft analysis not available', error, {
        component: 'CollusionFlagService',
        draftId,
      });
    }
  }
}

// Singleton export
export const collusionFlagService = new CollusionFlagService();
```

---

## CRITICAL FIX #3: INPUT VALIDATION

**Problem:** API routes don't validate enum values, creating security risks.

### Step 1: Create new validation utility file

**Create File:** `lib/integrity/validation.ts`

```typescript
/**
 * Validation utilities for integrity system
 *
 * Provides type-safe validation for API inputs
 */

// Valid values for admin actions
export const VALID_ACTIONS = ['cleared', 'warned', 'suspended', 'banned', 'escalated'] as const;
export const VALID_TARGET_TYPES = ['draft', 'userPair', 'user'] as const;

export type AdminActionType = typeof VALID_ACTIONS[number];
export type TargetType = typeof VALID_TARGET_TYPES[number];

/**
 * Type guard for admin action
 */
export function isValidAction(action: string): action is AdminActionType {
  return VALID_ACTIONS.includes(action as AdminActionType);
}

/**
 * Type guard for target type
 */
export function isValidTargetType(targetType: string): targetType is TargetType {
  return VALID_TARGET_TYPES.includes(targetType as TargetType);
}

/**
 * Validate draft ID format
 * Draft IDs are Firebase document IDs: alphanumeric, 20+ characters
 */
export function isValidDraftId(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  return /^[a-zA-Z0-9_-]{10,}$/.test(id);
}

/**
 * Validate user pair ID format
 * Pair IDs are: userId1_userId2 (lexicographically ordered)
 */
export function isValidPairId(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  return /^[a-zA-Z0-9_-]+_[a-zA-Z0-9_-]+$/.test(id);
}

/**
 * Validate user ID format
 */
export function isValidUserId(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  return /^[a-zA-Z0-9_-]{10,}$/.test(id);
}

/**
 * Sanitize string input (trim and limit length)
 */
export function sanitizeString(input: string | undefined, maxLength: number): string {
  if (!input || typeof input !== 'string') return '';
  return input.trim().slice(0, maxLength);
}

/**
 * Validation result interface
 */
export interface ValidationResult<T> {
  valid: boolean;
  errors: string[];
  data?: T;
}

/**
 * Validated admin action request data
 */
export interface ValidatedAdminActionRequest {
  targetType: TargetType;
  targetId: string;
  action: AdminActionType;
  reason: string;
  notes?: string;
}

/**
 * Validate admin action request body
 */
export function validateAdminActionRequest(body: any): ValidationResult<ValidatedAdminActionRequest> {
  const errors: string[] = [];

  // Validate targetType
  if (!body.targetType) {
    errors.push('targetType is required');
  } else if (!isValidTargetType(body.targetType)) {
    errors.push(`Invalid targetType. Must be one of: ${VALID_TARGET_TYPES.join(', ')}`);
  }

  // Validate targetId
  if (!body.targetId || typeof body.targetId !== 'string' || body.targetId.trim().length === 0) {
    errors.push('targetId is required and must be a non-empty string');
  } else {
    // Validate targetId format based on targetType
    if (body.targetType === 'draft' && !isValidDraftId(body.targetId)) {
      errors.push('Invalid draft ID format');
    } else if (body.targetType === 'userPair' && !isValidPairId(body.targetId)) {
      errors.push('Invalid pair ID format. Expected format: userId1_userId2');
    } else if (body.targetType === 'user' && !isValidUserId(body.targetId)) {
      errors.push('Invalid user ID format');
    }
  }

  // Validate action
  if (!body.action) {
    errors.push('action is required');
  } else if (!isValidAction(body.action)) {
    errors.push(`Invalid action. Must be one of: ${VALID_ACTIONS.join(', ')}`);
  }

  // Validate reason
  if (!body.reason || typeof body.reason !== 'string' || body.reason.trim().length === 0) {
    errors.push('reason is required and must be a non-empty string');
  } else if (body.reason.length > 1000) {
    errors.push('reason must be 1000 characters or less');
  }

  // Validate notes (optional)
  if (body.notes && typeof body.notes === 'string' && body.notes.length > 5000) {
    errors.push('notes must be 5000 characters or less');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    data: {
      targetType: body.targetType as TargetType,
      targetId: body.targetId.trim(),
      action: body.action as AdminActionType,
      reason: sanitizeString(body.reason, 1000),
      notes: body.notes ? sanitizeString(body.notes, 5000) : undefined,
    },
  };
}

/**
 * Validate pagination parameters
 */
export function validatePaginationParams(params: {
  limit?: string | number;
  offset?: string | number;
}): { limit: number; offset: number } {
  let limit = 50; // Default
  let offset = 0; // Default

  if (params.limit !== undefined) {
    const parsed = typeof params.limit === 'string' ? parseInt(params.limit, 10) : params.limit;
    if (!isNaN(parsed) && parsed > 0 && parsed <= 100) {
      limit = parsed;
    }
  }

  if (params.offset !== undefined) {
    const parsed = typeof params.offset === 'string' ? parseInt(params.offset, 10) : params.offset;
    if (!isNaN(parsed) && parsed >= 0) {
      offset = parsed;
    }
  }

  return { limit, offset };
}
```

### Step 2: Update actions API route

**Replace:** `pages/api/admin/integrity/actions.ts`

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { adminService } from '@/lib/integrity/AdminService';
import { verifyAdminAccess } from '@/lib/adminAuth';
import { validateAdminActionRequest } from '@/lib/integrity/validation';
import { logger } from '@/lib/structuredLogger';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const admin = await verifyAdminAccess(req.headers.authorization);
  if (!admin.isAdmin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'POST') {
    try {
      // Validate request body with comprehensive validation
      const validation = validateAdminActionRequest(req.body);

      if (!validation.valid) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validation.errors,
        });
      }

      const { targetType, targetId, action, reason, notes } = validation.data!;

      // Get limited evidence snapshot to prevent document size issues
      const evidenceSnapshot = await getLimitedEvidenceSnapshot(targetType, targetId);

      const result = await adminService.recordAction({
        targetType,
        targetId,
        adminId: admin.uid!,
        adminEmail: admin.email || 'unknown',
        action,
        reason,
        notes,
        evidenceSnapshot,
      });

      logger.info('Admin action recorded', {
        component: 'API',
        route: '/api/admin/integrity/actions',
        adminId: admin.uid,
        targetType,
        targetId,
        action,
      });

      return res.status(200).json(result);
    } catch (error) {
      logger.error('Failed to record action', error as Error, {
        component: 'API',
        route: '/api/admin/integrity/actions',
        adminId: admin.uid,
      });
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

/**
 * Get limited evidence snapshot to prevent Firestore document size limits
 * Only includes summary data, not full arrays
 */
async function getLimitedEvidenceSnapshot(
  targetType: string,
  targetId: string
): Promise<object> {
  try {
    if (targetType === 'draft') {
      const detail = await adminService.getDraftDetail(targetId);
      return {
        maxRiskScore: detail.riskScores?.maxRiskScore || 0,
        avgRiskScore: detail.riskScores?.avgRiskScore || 0,
        pairCount: detail.riskScores?.pairScores.length || 0,
        flaggedPairsCount: detail.integrityFlags?.flaggedPairs.length || 0,
        analyzedAt: detail.riskScores?.analyzedAt?.toMillis() || null,
        status: detail.riskScores?.status || 'unknown',
        // Intentionally omitting full pickLocations and pairScores arrays
      };
    }

    if (targetType === 'userPair') {
      // Could fetch pair details here if needed
      return {
        targetType,
        targetId,
        capturedAt: Date.now(),
      };
    }

    // Default minimal snapshot
    return {
      targetType,
      targetId,
      capturedAt: Date.now(),
    };
  } catch (error) {
    // If we can't get evidence, return minimal snapshot
    return {
      targetType,
      targetId,
      capturedAt: Date.now(),
      error: 'Failed to capture evidence snapshot',
    };
  }
}
```

### Step 3: Update drafts/[draftId] API route

**Replace:** `pages/api/admin/integrity/drafts/[draftId].ts`

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { adminService } from '@/lib/integrity/AdminService';
import { verifyAdminAccess } from '@/lib/adminAuth';
import { isValidDraftId } from '@/lib/integrity/validation';
import { logger } from '@/lib/structuredLogger';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const admin = await verifyAdminAccess(req.headers.authorization);
  if (!admin.isAdmin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { draftId } = req.query;

  // Validate draftId
  if (!draftId || typeof draftId !== 'string') {
    return res.status(400).json({ error: 'draftId is required' });
  }

  if (!isValidDraftId(draftId)) {
    return res.status(400).json({ error: 'Invalid draftId format' });
  }

  if (req.method === 'GET') {
    try {
      const detail = await adminService.getDraftDetail(draftId);

      if (!detail.riskScores && !detail.integrityFlags) {
        return res.status(404).json({ error: 'Draft not found or not analyzed' });
      }

      return res.status(200).json(detail);
    } catch (error) {
      logger.error('Failed to get draft detail', error as Error, {
        component: 'API',
        route: '/api/admin/integrity/drafts/[draftId]',
        draftId,
      });
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
```

---

## CRITICAL FIX #4: BATCH ERROR HANDLING

**Problem:** If one pair analysis fails in batch operations, the entire batch fails.

### Step 1: Update CrossDraftAnalyzer.ts

**Replace:** `lib/integrity/CrossDraftAnalyzer.ts`

```typescript
/**
 * CrossDraftAnalyzer
 *
 * Batch job that runs periodically (e.g., weekly).
 * Aggregates risk data across all drafts to identify persistent patterns.
 *
 * Includes robust error handling to ensure partial failures don't stop
 * the entire analysis batch.
 */

import {
  doc,
  getDoc,
  setDoc,
  getDocs,
  collection,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { logger } from '@/lib/structuredLogger';
import { CROSS_DRAFT_CONFIG } from '@/lib/integrity/config';
import type {
  DraftRiskScores,
  UserPairAnalysis,
} from './types';

// Analysis result interface
export interface CrossDraftAnalysisResult {
  pairsAnalyzed: number;
  criticalPairs: number;
  highRiskPairs: number;
  failedPairs: number;
  errors: Array<{ pairId: string; error: string }>;
  duration: number;
}

export class CrossDraftAnalyzer {
  /**
   * Run full cross-draft analysis with error handling
   * Call this from a scheduled Cloud Function
   */
  async runFullAnalysis(): Promise<CrossDraftAnalysisResult> {
    const startTime = Date.now();

    // 1. Get all draft risk scores from last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - CROSS_DRAFT_CONFIG.lookbackDays);

    const q = query(
      collection(db, 'draftRiskScores'),
      where('analyzedAt', '>=', Timestamp.fromDate(ninetyDaysAgo)),
      orderBy('analyzedAt', 'desc')
    );

    let allScores: DraftRiskScores[];
    try {
      const snap = await getDocs(q);
      allScores = snap.docs.map(d => d.data() as DraftRiskScores);
    } catch (error) {
      logger.error('Failed to fetch draft risk scores', error as Error, {
        component: 'CrossDraftAnalyzer',
        method: 'runFullAnalysis',
      });
      throw error;
    }

    logger.info('Starting cross-draft analysis', {
      component: 'CrossDraftAnalyzer',
      draftsToAnalyze: allScores.length,
    });

    // 2. Group scores by user pair
    const pairMap = new Map<string, {
      userId1: string;
      userId2: string;
      scores: {
        draftId: string;
        score: number;
        wasColocated: boolean;
        timestamp: Timestamp;
      }[];
    }>();

    for (const draftScore of allScores) {
      for (const pairScore of draftScore.pairScores) {
        const pairId = `${pairScore.userId1}_${pairScore.userId2}`;

        if (!pairMap.has(pairId)) {
          pairMap.set(pairId, {
            userId1: pairScore.userId1,
            userId2: pairScore.userId2,
            scores: [],
          });
        }

        pairMap.get(pairId)!.scores.push({
          draftId: draftScore.draftId,
          score: pairScore.compositeScore,
          wasColocated: pairScore.locationScore > 0,
          timestamp: draftScore.analyzedAt,
        });
      }
    }

    // 3. Analyze each pair with error handling (continue on error)
    let pairsAnalyzed = 0;
    let criticalPairs = 0;
    let highRiskPairs = 0;
    let failedPairs = 0;
    const errors: Array<{ pairId: string; error: string }> = [];

    for (const [pairId, data] of pairMap) {
      try {
        const analysis = await this.analyzePair(pairId, data);

        pairsAnalyzed++;
        if (analysis.overallRiskLevel === 'critical') criticalPairs++;
        if (analysis.overallRiskLevel === 'high') highRiskPairs++;

      } catch (error: any) {
        failedPairs++;
        const errorMessage = error?.message || String(error);

        // Only keep first 20 errors to prevent memory issues
        if (errors.length < 20) {
          errors.push({ pairId, error: errorMessage });
        }

      logger.error('Failed to analyze pair', error as Error, {
        component: 'CrossDraftAnalyzer',
        pairId,
        userId1: data.userId1,
        userId2: data.userId2,
        scoreCount: data.scores.length,
      });

        // Continue with next pair instead of failing entire batch
      }
    }

    const duration = Date.now() - startTime;

    // Log summary
    const result: CrossDraftAnalysisResult = {
      pairsAnalyzed,
      criticalPairs,
      highRiskPairs,
      failedPairs,
      errors,
      duration,
    };

    if (failedPairs > 0) {
      const failureRate = ((failedPairs / (pairsAnalyzed + failedPairs)) * 100).toFixed(1);
      logger.warn('Cross-draft analysis completed with failures', {
        component: 'CrossDraftAnalyzer',
        ...result,
        failureRate: `${failureRate}%`,
      });
    } else {
      logger.info('Cross-draft analysis completed successfully', {
        component: 'CrossDraftAnalyzer',
        ...result,
      });
    }

    return result;
  }

  /**
   * Analyze a specific user pair across all their drafts
   */
  private async analyzePair(
    pairId: string,
    data: {
      userId1: string;
      userId2: string;
      scores: {
        draftId: string;
        score: number;
        wasColocated: boolean;
        timestamp: Timestamp;
      }[];
    }
  ): Promise<UserPairAnalysis> {
    const { userId1, userId2, scores } = data;

    // Sort by timestamp
    const sortedScores = [...scores].sort(
      (a, b) => a.timestamp.toMillis() - b.timestamp.toMillis()
    );

    // Compute aggregates
    const totalDraftsTogether = scores.length;
    const colocatedDrafts = scores.filter(s => s.wasColocated);
    const draftsWithin50ft = colocatedDrafts.length;
    const draftsSameIp = colocatedDrafts.length;
    const draftsWithBothFlags = colocatedDrafts.filter(s => s.score >= 50).length;

    // Rates
    const coLocationRate = totalDraftsTogether > 0
      ? draftsWithin50ft / totalDraftsTogether
      : 0;
    const sameIpRate = totalDraftsTogether > 0
      ? draftsSameIp / totalDraftsTogether
      : 0;

    // Behavioral analysis
    const colocatedScores = scores.filter(s => s.wasColocated).map(s => s.score);
    const notColocatedScores = scores.filter(s => !s.wasColocated).map(s => s.score);

    const avgRiskScoreColocated = colocatedScores.length > 0
      ? colocatedScores.reduce((a, b) => a + b, 0) / colocatedScores.length
      : 0;
    const avgRiskScoreNotColocated = notColocatedScores.length > 0
      ? notColocatedScores.reduce((a, b) => a + b, 0) / notColocatedScores.length
      : 0;
    const riskScoreDifferential = avgRiskScoreColocated - avgRiskScoreNotColocated;

    // Determine overall risk level using config thresholds
    let overallRiskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    if (
      coLocationRate >= CROSS_DRAFT_CONFIG.thresholds.critical.coLocationRate &&
      totalDraftsTogether >= CROSS_DRAFT_CONFIG.thresholds.critical.minDrafts
    ) {
      overallRiskLevel = 'critical';
    } else if (
      coLocationRate >= CROSS_DRAFT_CONFIG.thresholds.high.coLocationRate &&
      totalDraftsTogether >= CROSS_DRAFT_CONFIG.thresholds.high.minDrafts &&
      avgRiskScoreColocated >= CROSS_DRAFT_CONFIG.thresholds.high.avgRiskScore
    ) {
      overallRiskLevel = 'high';
    } else if (
      coLocationRate >= CROSS_DRAFT_CONFIG.thresholds.medium.coLocationRate &&
      totalDraftsTogether >= CROSS_DRAFT_CONFIG.thresholds.medium.minDrafts &&
      avgRiskScoreColocated >= CROSS_DRAFT_CONFIG.thresholds.medium.avgRiskScore
    ) {
      overallRiskLevel = 'medium';
    }

    // Build result
    const analysis: UserPairAnalysis = {
      pairId,
      userId1,
      userId2,
      totalDraftsTogether,
      draftsWithin50ft,
      draftsSameIp,
      draftsWithBothFlags,
      coLocationRate,
      sameIpRate,
      avgRiskScoreColocated,
      avgRiskScoreNotColocated,
      riskScoreDifferential,
      riskScoreHistory: sortedScores.slice(-20),
      overallRiskLevel,
      firstDraftTogether: sortedScores[0]?.timestamp || Timestamp.now(),
      lastDraftTogether: sortedScores[sortedScores.length - 1]?.timestamp || Timestamp.now(),
      lastAnalyzedAt: Timestamp.now(),
    };

    // Save to Firestore
    await setDoc(doc(db, 'userPairAnalysis', pairId), analysis);

    return analysis;
  }

  /**
   * Get high-risk pairs for admin review
   */
  async getHighRiskPairs(minRiskLevel: 'medium' | 'high' | 'critical' = 'high'): Promise<UserPairAnalysis[]> {
    const levels = minRiskLevel === 'medium'
      ? ['medium', 'high', 'critical']
      : minRiskLevel === 'high'
        ? ['high', 'critical']
        : ['critical'];

    const q = query(
      collection(db, 'userPairAnalysis'),
      where('overallRiskLevel', 'in', levels),
      orderBy('lastAnalyzedAt', 'desc'),
      limit(100)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as UserPairAnalysis);
  }

  /**
   * Get analysis for a specific user pair
   */
  async getPairAnalysis(userId1: string, userId2: string): Promise<UserPairAnalysis | null> {
    const [u1, u2] = [userId1, userId2].sort();
    const pairId = `${u1}_${u2}`;

    const docRef = doc(db, 'userPairAnalysis', pairId);
    const snap = await getDoc(docRef);

    if (!snap.exists()) return null;
    return snap.data() as UserPairAnalysis;
  }

  /**
   * Get all pairs involving a specific user
   */
  async getUserPairs(userId: string): Promise<UserPairAnalysis[]> {
    const q1 = query(
      collection(db, 'userPairAnalysis'),
      where('userId1', '==', userId)
    );
    const q2 = query(
      collection(db, 'userPairAnalysis'),
      where('userId2', '==', userId)
    );

    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

    const results: UserPairAnalysis[] = [];
    snap1.docs.forEach(d => results.push(d.data() as UserPairAnalysis));
    snap2.docs.forEach(d => results.push(d.data() as UserPairAnalysis));

    const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    results.sort((a, b) => riskOrder[a.overallRiskLevel] - riskOrder[b.overallRiskLevel]);

    return results;
  }
}

// Singleton export
export const crossDraftAnalyzer = new CrossDraftAnalyzer();
```

### Step 2: Update PostDraftAnalyzer.ts with similar error handling

Add try-catch around pair analysis in `analyzeDraft()` method. Find the loop that iterates over flaggedPairs and wrap it:

```typescript
// In analyzeDraft(), replace the flagged pairs loop with:
if (flags) {
  for (const flaggedPair of flags.flaggedPairs) {
    try {
      const score = await this.analyzePair(
        flaggedPair.userId1,
        flaggedPair.userId2,
        draftId,
        flaggedPair,
        pickLocations,
        draftPicks,
        adpData
      );
      pairScores.push(score);
    } catch (error) {
      logger.error('Failed to analyze flagged pair', error as Error, {
        component: 'PostDraftAnalyzer',
        draftId,
        userId1: flaggedPair.userId1,
        userId2: flaggedPair.userId2,
      });
      // Continue with next pair
    }
  }
}
```

---

## HIGH PRIORITY FIX #5: PERFORMANCE OPTIMIZATION

**Problem:** Analyzing all user pairs in large drafts creates N+1 query issues.

Add this threshold logic to `PostDraftAnalyzer.ts` after the flagged pairs loop:

```typescript
// Configuration for limiting non-flagged pair analysis
const BEHAVIOR_ANALYSIS_CONFIG = {
  MIN_FLAGGED_PAIRS_FOR_FULL_ANALYSIS: 1,
  MAX_TOTAL_PAIRS_TO_ANALYZE: 20,
  MIN_SCORE_FOR_INCLUSION: 30,
};

// In analyzeDraft(), replace the non-flagged pairs section with:

// 6. Only analyze non-flagged pairs if:
//    - We have flagged pairs (indicates suspicious activity worth investigating)
//    - We haven't exceeded our pair limit
const shouldAnalyzeNonFlagged =
  flags &&
  flags.flaggedPairs.length >= BEHAVIOR_ANALYSIS_CONFIG.MIN_FLAGGED_PAIRS_FOR_FULL_ANALYSIS &&
  pairScores.length < BEHAVIOR_ANALYSIS_CONFIG.MAX_TOTAL_PAIRS_TO_ANALYZE;

if (shouldAnalyzeNonFlagged) {
  const allUsers = [...new Set(pickLocations.map(p => p.userId))];
  const remainingSlots = BEHAVIOR_ANALYSIS_CONFIG.MAX_TOTAL_PAIRS_TO_ANALYZE - pairScores.length;
  let analyzedCount = 0;

  outerLoop: for (let i = 0; i < allUsers.length && analyzedCount < remainingSlots; i++) {
    for (let j = i + 1; j < allUsers.length && analyzedCount < remainingSlots; j++) {
      const userId1 = allUsers[i] < allUsers[j] ? allUsers[i] : allUsers[j];
      const userId2 = allUsers[i] < allUsers[j] ? allUsers[j] : allUsers[i];

      // Skip if already analyzed
      if (pairScores.some(p => p.userId1 === userId1 && p.userId2 === userId2)) {
        continue;
      }

      try {
        const score = await this.analyzePair(
          userId1,
          userId2,
          draftId,
          null,
          pickLocations,
          draftPicks,
          adpData
        );

        // Only include if behavior/benefit score is significant
        if (
          score.behaviorScore >= BEHAVIOR_ANALYSIS_CONFIG.MIN_SCORE_FOR_INCLUSION ||
          score.benefitScore >= BEHAVIOR_ANALYSIS_CONFIG.MIN_SCORE_FOR_INCLUSION
        ) {
          pairScores.push(score);
          analyzedCount++;
        }
      } catch (error) {
        logger.error('Failed to analyze non-flagged pair', error as Error, {
          component: 'PostDraftAnalyzer',
          draftId,
          userId1,
          userId2,
        });
        // Continue with next pair
      }
    }
  }
}
```

---

## HIGH PRIORITY FIX #6: CACHE EXPIRATION FIX

**Problem:** In long-running Cloud Functions, cache may become stale.

**Replace:** `lib/integrity/AdpService.ts`

```typescript
/**
 * AdpService
 *
 * Provides Average Draft Position (ADP) data for risk scoring.
 * Includes cache management for Cloud Function environments.
 */

import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { logger } from '@/lib/structuredLogger';

interface AdpData {
  playerId: string;
  playerName: string;
  position: string;
  team: string;
  adp: number;
  adpByPosition: number;
  lastUpdated: Timestamp;
}

export class AdpService {
  private cache: Map<string, number> | null = null;
  private cacheExpiry: number = 0;
  private cacheCreatedAt: number = 0;
  private readonly CACHE_TTL = 1000 * 60 * 60; // 1 hour
  private readonly MAX_CACHE_AGE = 1000 * 60 * 60 * 2; // 2 hours absolute max

  /**
   * Get current ADP data
   * Returns Map of playerId -> ADP (overall pick number)
   */
  async getCurrentAdp(): Promise<Map<string, number>> {
    const now = Date.now();

    // Check if cache exists and is not expired
    if (this.cache && now < this.cacheExpiry) {
      return this.cache;
    }

    // Additional check: if cache is too old (absolute max age), clear it
    // This handles Cloud Function instances that persist between invocations
    if (this.cache && this.cacheCreatedAt > 0) {
      const cacheAge = now - this.cacheCreatedAt;
      if (cacheAge > this.MAX_CACHE_AGE) {
        logger.info('Clearing stale ADP cache', {
          component: 'AdpService',
          cacheAgeMs: cacheAge,
          maxAgeMs: this.MAX_CACHE_AGE,
        });
        this.cache = null;
        this.cacheExpiry = 0;
        this.cacheCreatedAt = 0;
      }
    }

    // Load from Firestore
    try {
      const adpRef = doc(db, 'adpData', 'current');
      const adpSnap = await getDoc(adpRef);

      if (!adpSnap.exists()) {
        logger.warn('No ADP data found in Firestore', {
          component: 'AdpService',
        });
        return new Map();
      }

      const data = adpSnap.data();
      const players: AdpData[] = data.players || [];

      // Build map
      this.cache = new Map();
      for (const player of players) {
        this.cache.set(player.playerId, player.adp);
      }
      this.cacheExpiry = now + this.CACHE_TTL;
      this.cacheCreatedAt = now;

      logger.info('ADP cache refreshed', {
        component: 'AdpService',
        playerCount: this.cache.size,
      });

      return this.cache;
    } catch (error) {
      logger.error('Failed to load ADP data', error as Error, {
        component: 'AdpService',
      });

      // Return empty map if cache is unavailable
      return new Map();
    }
  }

  /**
   * Get ADP for a specific player
   */
  async getPlayerAdp(playerId: string): Promise<number | null> {
    const adpMap = await this.getCurrentAdp();
    return adpMap.get(playerId) ?? null;
  }

  /**
   * Clear the cache (useful for testing or force refresh)
   */
  clearCache(): void {
    this.cache = null;
    this.cacheExpiry = 0;
    this.cacheCreatedAt = 0;
  }

  /**
   * Update ADP data (admin function)
   */
  async updateAdpData(players: AdpData[]): Promise<void> {
    const adpRef = doc(db, 'adpData', 'current');

    await setDoc(adpRef, {
      players,
      lastUpdated: Timestamp.now(),
      playerCount: players.length,
    });

    // Clear cache to force reload on next access
    this.clearCache();

    logger.info('ADP data updated', {
      component: 'AdpService',
      playerCount: players.length,
    });
  }
}

// Singleton export
export const adpService = new AdpService();
```

---

## HIGH PRIORITY FIX #7: RATE LIMITING

**Problem:** Admin endpoints have no rate limiting.

**Note:** The project already has a rate limiter at `lib/rateLimiter.js`. We'll use that instead of creating a new one.

### Step 1: Create admin rate limiter instances

**Create File:** `lib/integrity/adminRateLimiter.ts`

```typescript
/**
 * Rate limiters for admin integrity endpoints
 * Uses the existing RateLimiter class from lib/rateLimiter.js
 */

import { RateLimiter } from '@/lib/rateLimiter';

/**
 * Rate limiter for admin read operations (viewing drafts, pairs)
 * 100 requests per minute per IP
 */
export const adminReadLimiter = new RateLimiter({
  maxRequests: 100,
  windowMs: 60 * 1000, // 1 minute
  endpoint: 'admin-integrity-read',
});

/**
 * Rate limiter for admin write operations (recording actions)
 * 20 requests per minute per IP
 */
export const adminWriteLimiter = new RateLimiter({
  maxRequests: 20,
  windowMs: 60 * 1000, // 1 minute
  endpoint: 'admin-integrity-write',
});
```

### Step 2: Add rate limiting to API routes

Add this at the start of each API route handler (after auth check):

**For read operations** (GET requests):
```typescript
import { adminReadLimiter } from '@/lib/integrity/adminRateLimiter';

// In handler, after auth check:
const rateLimitResult = await adminReadLimiter.check(req);

if (!rateLimitResult.allowed) {
  return res.status(429).json({
    error: 'Too many requests',
    retryAfter: Math.ceil(rateLimitResult.retryAfterMs / 1000), // seconds
  });
}
```

**For write operations** (POST requests):
```typescript
import { adminWriteLimiter } from '@/lib/integrity/adminRateLimiter';

// In handler, after auth check:
const rateLimitResult = await adminWriteLimiter.check(req);

if (!rateLimitResult.allowed) {
  return res.status(429).json({
    error: 'Too many requests',
    retryAfter: Math.ceil(rateLimitResult.retryAfterMs / 1000), // seconds
  });
}
```

**Example for actions.ts:**
```typescript
import { adminWriteLimiter } from '@/lib/integrity/adminRateLimiter';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const admin = await verifyAdminAccess(req.headers.authorization);
  if (!admin.isAdmin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Rate limiting for write operations
  if (req.method === 'POST') {
    const rateLimitResult = await adminWriteLimiter.check(req);
    if (!rateLimitResult.allowed) {
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil(rateLimitResult.retryAfterMs / 1000),
      });
    }
  }

  // ... rest of handler
}
```

---

## MEDIUM PRIORITY FIX #8: CONFIGURATION FILE

**Create File:** `lib/integrity/config.ts`

```typescript
/**
 * Configuration for collusion detection system
 *
 * Centralized configuration that can be overridden via environment variables
 */

// Helper to parse env vars with defaults
function envNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Risk score weights and thresholds for post-draft analysis
 */
export const RISK_CONFIG = {
  weights: {
    location: envNumber('RISK_WEIGHT_LOCATION', 0.35),
    behavior: envNumber('RISK_WEIGHT_BEHAVIOR', 0.30),
    benefit: envNumber('RISK_WEIGHT_BENEFIT', 0.35),
  },
  thresholds: {
    urgent: envNumber('RISK_THRESHOLD_URGENT', 90),
    review: envNumber('RISK_THRESHOLD_REVIEW', 70),
    monitor: envNumber('RISK_THRESHOLD_MONITOR', 50),
  },
  locationScores: {
    both: 80,      // Same room + same IP
    within50ft: 60, // Same room only
    sameIp: 40,    // Same IP only
    multipleEventsBonus: 15,
    multipleEventsThreshold: 5,
  },
  behaviorAnalysis: {
    significantReach: -15,      // Deviation threshold for "reaching"
    significantValue: 10,       // Deviation threshold for "getting value"
    egregiousReach: -30,        // Very suspicious reach
    roundCorrelationWindow: 24, // Picks within 2 rounds
    minScoreForInclusion: 30,   // Minimum behavior/benefit score to include pair
  },
};

/**
 * Cross-draft analysis configuration
 */
export const CROSS_DRAFT_CONFIG = {
  lookbackDays: envNumber('CROSS_DRAFT_LOOKBACK_DAYS', 90),
  maxHistoryEntries: 20, // Max history items to keep per pair
  thresholds: {
    critical: {
      coLocationRate: envNumber('CRITICAL_COLOCATION_RATE', 0.8),
      minDrafts: envNumber('CRITICAL_MIN_DRAFTS', 5),
    },
    high: {
      coLocationRate: envNumber('HIGH_COLOCATION_RATE', 0.5),
      minDrafts: envNumber('HIGH_MIN_DRAFTS', 3),
      avgRiskScore: envNumber('HIGH_AVG_RISK_SCORE', 60),
    },
    medium: {
      coLocationRate: envNumber('MEDIUM_COLOCATION_RATE', 0.3),
      minDrafts: envNumber('MEDIUM_MIN_DRAFTS', 2),
      avgRiskScore: envNumber('MEDIUM_AVG_RISK_SCORE', 40),
    },
  },
};

/**
 * Admin service configuration
 */
export const ADMIN_CONFIG = {
  defaultMaxResults: 50,
  maxMaxResults: 100,
  evidenceSnapshotMaxSize: 10000, // bytes
};

/**
 * Transaction retry configuration
 */
export const TRANSACTION_CONFIG = {
  maxAttempts: 3,
  baseDelayMs: 50,
  maxDelayMs: 200,
};
```

---

## MEDIUM PRIORITY FIX #9: UTILITY FUNCTIONS

**Create File:** `lib/integrity/utils.ts`

```typescript
/**
 * Utility functions for integrity system
 */

/**
 * Normalize a user pair to consistent ordering (lexicographic)
 * Ensures userId1 < userId2 always
 */
export function normalizeUserPair(userIdA: string, userIdB: string): [string, string] {
  return userIdA < userIdB ? [userIdA, userIdB] : [userIdB, userIdA];
}

/**
 * Create a pair ID from two user IDs
 * Always uses consistent ordering
 */
export function createPairId(userIdA: string, userIdB: string): string {
  const [userId1, userId2] = normalizeUserPair(userIdA, userIdB);
  return `${userId1}_${userId2}`;
}

/**
 * Parse a pair ID back to user IDs
 */
export function parsePairId(pairId: string): { userId1: string; userId2: string } | null {
  const parts = pairId.split('_');
  if (parts.length !== 2) return null;
  return { userId1: parts[0], userId2: parts[1] };
}

/**
 * Truncate user ID for display (first 8 characters)
 */
export function truncateUserId(userId: string, length: number = 8): string {
  return userId.length > length ? userId.slice(0, length) : userId;
}

/**
 * Calculate average of numbers array
 */
export function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

**Note:** The project already has a structured logger at `lib/structuredLogger.ts`. Use that instead of creating a new logger.

**Usage in integrity services:**
```typescript
import { logger } from '@/lib/structuredLogger';

// Example usage:
logger.info('Proximity flag recorded', {
  component: 'CollusionFlagService',
  draftId,
  pickNumber,
});

logger.error('Failed to record proximity flag', error, {
  component: 'CollusionFlagService',
  draftId,
  pickNumber,
  attempt,
});
```

The existing logger supports:
- `logger.debug(message, context?)`
- `logger.info(message, context?)`
- `logger.warn(message, context?)`
- `logger.error(message, error, context?)`

All methods accept a context object with any key-value pairs for structured logging.

---

## TESTING CHECKLIST

### Unit Tests to Create

Create test files in `__tests__/lib/integrity/`:

- [ ] `validation.test.ts` - Test all validation functions
- [ ] `utils.test.ts` - Test utility functions
- [ ] `CollusionFlagService.test.ts` - Test flag recording and retries
- [ ] `PostDraftAnalyzer.test.ts` - Test risk score calculations
- [ ] `CrossDraftAnalyzer.test.ts` - Test aggregation and error handling

### Integration Tests

- [ ] Test concurrent flag recording (simulate race condition)
- [ ] Test batch analysis with intentionally failing pairs
- [ ] Test API routes with invalid inputs
- [ ] Test rate limiting behavior

### Manual Testing Checklist

- [ ] Deploy Firestore indexes and verify they build
- [ ] Create a test draft with co-located users
- [ ] Verify flags are recorded correctly
- [ ] Run post-draft analysis
- [ ] Verify admin dashboard displays data
- [ ] Test admin action recording
- [ ] Run cross-draft analysis batch

---

## DEPLOYMENT CHECKLIST

### Pre-Deployment

- [ ] All critical issues fixed
- [ ] All high priority issues fixed
- [ ] Firestore indexes JSON updated
- [ ] Environment variables documented (see config.ts for available env vars)
- [ ] Code reviewed
- [ ] Tests passing
- [ ] Logger imports updated to use `@/lib/structuredLogger`
- [ ] Rate limiter instances created in `lib/integrity/adminRateLimiter.ts`

### Deployment Order

1. **Deploy Firestore indexes first** (they take time to build)
   ```bash
   firebase deploy --only firestore:indexes
   ```

2. **Wait for indexes** (check Firebase Console → Firestore → Indexes)

3. **Deploy code changes**
   ```bash
   npm run build
   vercel deploy --prod  # or your deployment command
   ```

4. **Verify environment variables** are set in production

5. **Run smoke tests**
   - Load admin dashboard
   - Check for query errors in logs

### Post-Deployment Monitoring

- [ ] Monitor error rates in logs (check structured logger output)
- [ ] Check transaction retry rates (should be < 5% - look for "Transaction conflict, retrying" logs)
- [ ] Verify query performance (< 1 second for all queries)
- [ ] Monitor rate limit hits (check for 429 responses in API logs)
- [ ] Review Firestore usage/costs (especially rate_limits collection)
- [ ] Verify indexes are being used (check Firebase Console → Firestore → Usage)

### Rollback Plan

If issues occur:
1. Revert code deployment
2. Indexes can remain (they don't break existing queries)
3. Document issue for next deployment

---

## FILE SUMMARY

### Files to Create

| File | Purpose |
|------|---------|
| `lib/integrity/validation.ts` | Input validation utilities |
| `lib/integrity/config.ts` | Centralized configuration |
| `lib/integrity/utils.ts` | Helper functions |
| `lib/integrity/adminRateLimiter.ts` | Admin rate limiter instances (uses existing RateLimiter) |

**Note:** The project already has:
- `lib/structuredLogger.ts` - Use this for logging (don't create new logger)
- `lib/rateLimiter.js` - Use this for rate limiting (create adminRateLimiter.ts to configure instances)

### Files to Modify

| File | Changes |
|------|---------|
| `firestore.indexes.json` | Add 8 new indexes |
| `lib/integrity/CollusionFlagService.ts` | Add retry logic |
| `lib/integrity/CrossDraftAnalyzer.ts` | Add error handling |
| `lib/integrity/PostDraftAnalyzer.ts` | Add error handling, performance limits |
| `lib/integrity/AdpService.ts` | Fix cache expiration |
| `pages/api/admin/integrity/actions.ts` | Add validation, rate limiting |
| `pages/api/admin/integrity/drafts/[draftId].ts` | Add validation, rate limiting |
| `pages/api/admin/integrity/drafts.ts` | Add rate limiting |
| `pages/api/admin/integrity/pairs.ts` | Add rate limiting |

---

## ESTIMATED IMPLEMENTATION TIME

| Phase | Tasks | Hours |
|-------|-------|-------|
| Critical Fixes | Indexes, Race Condition, Validation, Error Handling | 8-12 |
| High Priority | Performance, Cache, Rate Limiting | 6-8 |
| Medium Priority | Config, Utils, Logger | 3-4 |
| Testing | Unit tests, Integration tests | 6-10 |
| **Total** | | **23-34 hours** |

---

**Document Status:** Ready for Implementation
**Created:** January 2025
**Target:** Cursor AI Agent
