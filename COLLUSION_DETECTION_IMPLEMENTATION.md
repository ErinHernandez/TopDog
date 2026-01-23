# Collusion Detection System - Implementation Guide

**Project:** Bestball Tournament Integrity
**Date:** January 2025
**Status:** Ready for Implementation
**Target:** AI Agent / LLM in Cursor
**Dependency:** `LOCATION_INTEGRITY_SYSTEM_DESIGN.md` must be implemented first

---

## EXECUTIVE SUMMARY

This document provides complete implementation details for a collusion detection system that analyzes location and behavioral data to identify potentially coordinated users in best ball drafts.

### Prerequisites

The Location Integrity System (`LOCATION_INTEGRITY_SYSTEM_DESIGN.md`) must be deployed and collecting data. This system reads from:
- `pickLocations` collection (per-pick location + proximity data)
- `draftLocationState` collection (ephemeral, during draft)
- `userBadges` collection (aggregated badges)

### What This System Creates

1. **Real-time flagging** during drafts (Stage 1)
2. **Post-draft risk scoring** after each draft completes (Stage 2)
3. **Cross-draft pattern analysis** via scheduled batch job (Stage 3)
4. **Admin review dashboard** for flagged cases (Stage 4)

### What This System Does NOT Do

- **NEVER blocks or stops drafts** - All flagging is passive and non-blocking
- **NEVER prevents picks from being made** - Drafts always complete normally
- Automatically ban users (human review required)
- Prove collusion (flags for investigation only)
- Replace human judgment (provides data, not verdicts)

---

## TABLE OF CONTENTS

1. [Data Architecture](#1-data-architecture)
2. [Firestore Schema](#2-firestore-schema)
3. [Stage 1: Real-Time Flagging](#3-stage-1-real-time-flagging)
4. [Stage 2: Post-Draft Risk Scoring](#4-stage-2-post-draft-risk-scoring)
5. [Stage 3: Cross-Draft Pattern Analysis](#5-stage-3-cross-draft-pattern-analysis)
6. [Stage 4: Admin Review Dashboard](#6-stage-4-admin-review-dashboard)
7. [ADP Data Integration](#7-adp-data-integration)
8. [Types & Interfaces](#8-types--interfaces)
9. [Implementation Phases](#9-implementation-phases)
10. [Testing Checklist](#10-testing-checklist)

---

## 1. DATA ARCHITECTURE

### Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      COLLUSION DETECTION PIPELINE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  STAGE 1: Real-Time (During Draft)                                          │
│  ┌─────────────────────┐                                                    │
│  │   pickLocations     │──→ Check proximity flags ──→ Write to             │
│  │   (from integrity)  │      (within50ft, sameIp)    draftIntegrityFlags  │
│  └─────────────────────┘                                                    │
│                                                                             │
│  STAGE 2: Post-Draft (After Draft Completes)                                │
│  ┌─────────────────────┐    ┌─────────────────────┐                        │
│  │   pickLocations     │    │     draft picks     │                        │
│  │   (all picks)       │──→ │   + ADP data        │──→ draftRiskScores    │
│  └─────────────────────┘    └─────────────────────┘                        │
│                                                                             │
│  STAGE 3: Cross-Draft (Scheduled Batch)                                     │
│  ┌─────────────────────┐                                                    │
│  │  draftRiskScores    │──→ Aggregate by user pair ──→ userPairAnalysis   │
│  │  (all drafts)       │      Pattern detection                            │
│  └─────────────────────┘                                                    │
│                                                                             │
│  STAGE 4: Admin Review                                                      │
│  ┌─────────────────────┐                                                    │
│  │  userPairAnalysis   │──→ Dashboard ──→ Human Review ──→ adminActions    │
│  │  (flagged pairs)    │                                                    │
│  └─────────────────────┘                                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Pick made** → Location Integrity System records to `pickLocations`
2. **Proximity detected** → Real-time flag written to `draftIntegrityFlags`
3. **Draft completes** → Post-draft analysis runs, writes to `draftRiskScores`
4. **Weekly batch** → Cross-draft analysis runs, writes to `userPairAnalysis`
5. **Admin reviews** → Dashboard shows flagged pairs, admin records decisions

---

## 2. FIRESTORE SCHEMA

### Collection: `draftIntegrityFlags`

**Document ID:** `{draftId}`

Real-time flags detected during a draft.

```typescript
interface DraftIntegrityFlags {
  draftId: string;

  // Pairs flagged during this draft
  flaggedPairs: IntegrityFlag[];

  // Summary counts
  totalWithin50ftEvents: number;
  totalSameIpEvents: number;
  uniqueUserPairsFlagged: number;

  // Metadata
  draftStartedAt: Timestamp;
  lastUpdatedAt: Timestamp;
  status: 'active' | 'completed' | 'reviewed';
}

interface IntegrityFlag {
  // The pair
  userId1: string;           // Lexicographically smaller userId
  userId2: string;           // Lexicographically larger userId

  // Flag details
  flagType: 'within50ft' | 'sameIp' | 'both';

  // Events (each pick where flag triggered)
  events: FlagEvent[];

  // First/last occurrence
  firstDetectedAt: Timestamp;
  lastDetectedAt: Timestamp;

  // Count
  eventCount: number;
}

interface FlagEvent {
  pickNumber: number;
  triggeringUserId: string;   // User who made the pick
  otherUserId: string;        // User they were co-located with
  distance?: number;          // Distance in meters (if within50ft)
  timestamp: Timestamp;
}
```

### Collection: `draftRiskScores`

**Document ID:** `{draftId}`

Risk analysis after draft completes.

```typescript
interface DraftRiskScores {
  draftId: string;
  analyzedAt: Timestamp;

  // Per-pair risk scores
  pairScores: PairRiskScore[];

  // Draft-level summary
  maxRiskScore: number;
  avgRiskScore: number;
  pairsAboveThreshold: number;   // Pairs with score >= 50

  // Status
  status: 'pending' | 'analyzed' | 'reviewed';
  reviewedBy?: string;
  reviewedAt?: Timestamp;
  reviewNotes?: string;
}

interface PairRiskScore {
  userId1: string;
  userId2: string;

  // Component scores (0-100)
  locationScore: number;      // Based on proximity overlap
  behaviorScore: number;      // Based on draft pattern analysis
  benefitScore: number;       // Based on value transfer analysis

  // Composite
  compositeScore: number;     // Weighted combination

  // Flags for human review
  flags: string[];            // Human-readable reasons

  // Recommendation
  recommendation: 'clear' | 'monitor' | 'review' | 'urgent';
}
```

### Collection: `userPairAnalysis`

**Document ID:** `{userId1}_{userId2}` (lexicographically ordered)

Cross-draft analysis of user pairs.

```typescript
interface UserPairAnalysis {
  pairId: string;             // "{userId1}_{userId2}"
  userId1: string;
  userId2: string;

  // Aggregate stats
  totalDraftsTogether: number;
  draftsWithin50ft: number;
  draftsSameIp: number;
  draftsWithBothFlags: number;

  // Rates
  coLocationRate: number;     // draftsWithin50ft / totalDraftsTogether
  sameIpRate: number;         // draftsSameIp / totalDraftsTogether

  // Behavioral analysis (when co-located vs not)
  avgRiskScoreColocated: number;
  avgRiskScoreNotColocated: number;
  riskScoreDifferential: number;

  // Historical risk scores
  riskScoreHistory: {
    draftId: string;
    score: number;
    wasColocated: boolean;
    timestamp: Timestamp;
  }[];

  // Overall assessment
  overallRiskLevel: 'low' | 'medium' | 'high' | 'critical';

  // Metadata
  firstDraftTogether: Timestamp;
  lastDraftTogether: Timestamp;
  lastAnalyzedAt: Timestamp;
}
```

### Collection: `adminActions`

**Document ID:** Auto-generated

Audit trail of admin decisions.

```typescript
interface AdminAction {
  id: string;

  // What was reviewed
  targetType: 'draft' | 'userPair' | 'user';
  targetId: string;           // draftId, pairId, or userId

  // Who and when
  adminId: string;
  adminEmail: string;
  timestamp: Timestamp;

  // Decision
  action: 'cleared' | 'warned' | 'suspended' | 'banned' | 'escalated';
  reason: string;
  notes?: string;

  // Evidence
  evidenceSnapshot: object;   // Snapshot of data at time of decision
}
```

### Firestore Indexes Required

```
draftIntegrityFlags:
  - draftId (default)
  - status + lastUpdatedAt

draftRiskScores:
  - draftId (default)
  - status + analyzedAt
  - maxRiskScore (desc) + analyzedAt

userPairAnalysis:
  - pairId (default)
  - overallRiskLevel + lastAnalyzedAt
  - userId1 + lastAnalyzedAt
  - userId2 + lastAnalyzedAt
  - coLocationRate (desc) + totalDraftsTogether

adminActions:
  - targetType + targetId + timestamp
  - adminId + timestamp
```

---

## 3. STAGE 1: REAL-TIME FLAGGING

### File: `lib/integrity/CollusionFlagService.ts`

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
  arrayUnion,
  Timestamp,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type {
  DraftIntegrityFlags,
  IntegrityFlag,
  FlagEvent,
} from './types';

export class CollusionFlagService {

  /**
   * Record a flag event when proximity is detected
   * Called by LocationIntegrityService.recordPickLocation()
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

    const flagRef = doc(db, 'draftIntegrityFlags', draftId);
    const now = Timestamp.now();

    await runTransaction(db, async (transaction) => {
      const flagSnap = await transaction.get(flagRef);

      let flags: DraftIntegrityFlags;

      if (!flagSnap.exists()) {
        // Create new document
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

        // Determine flag type
        let flagType: 'within50ft' | 'sameIp' | 'both';
        if (isWithin50ft && isSameIp) {
          flagType = 'both';
        } else if (isWithin50ft) {
          flagType = 'within50ft';
        } else {
          flagType = 'sameIp';
        }

        // Create event
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
          // Update existing pair
          const pair = flags.flaggedPairs[pairIndex];
          pair.events.push(event);
          pair.lastDetectedAt = now;
          pair.eventCount++;

          // Upgrade flag type if needed
          if (flagType === 'both') {
            pair.flagType = 'both';
          } else if (pair.flagType !== 'both' && pair.flagType !== flagType) {
            pair.flagType = 'both';
          }
        } else {
          // New pair
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

        // Update counts
        if (isWithin50ft) flags.totalWithin50ftEvents++;
        if (isSameIp) flags.totalSameIpEvents++;
      }

      flags.lastUpdatedAt = now;

      transaction.set(flagRef, flags);
    });
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

    // Trigger post-draft analysis (async)
    this.triggerPostDraftAnalysis(draftId).catch(console.error);
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
   * In production, this would call a Cloud Function
   */
  private async triggerPostDraftAnalysis(draftId: string): Promise<void> {
    // Option 1: Direct call (for development)
    const { PostDraftAnalyzer } = await import('./PostDraftAnalyzer');
    const analyzer = new PostDraftAnalyzer();
    await analyzer.analyzeDraft(draftId);

    // Option 2: Cloud Function (for production)
    // await fetch(`${process.env.CLOUD_FUNCTIONS_URL}/analyzeDraft`, {
    //   method: 'POST',
    //   body: JSON.stringify({ draftId }),
    // });
  }
}

// Singleton export
export const collusionFlagService = new CollusionFlagService();
```

### Integration with LocationIntegrityService

**File:** `lib/integrity/LocationIntegrityService.ts`

Add this call at the end of `recordPickLocation()`:

```typescript
import { collusionFlagService } from './CollusionFlagService';

// Inside recordPickLocation(), after writing to pickLocations:

// 6. Record collusion flags (if any proximity detected)
if (proximityFlags.within50ft.length > 0 || proximityFlags.sameIp.length > 0) {
  await collusionFlagService.recordProximityFlag({
    draftId,
    pickNumber,
    triggeringUserId: userId,
    within50ft: proximityFlags.within50ft,
    sameIp: proximityFlags.sameIp,
  });
}
```

---

## 4. STAGE 2: POST-DRAFT RISK SCORING

### File: `lib/integrity/PostDraftAnalyzer.ts`

```typescript
/**
 * PostDraftAnalyzer
 *
 * Runs after each draft completes.
 * Analyzes draft patterns and computes risk scores.
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
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type {
  DraftIntegrityFlags,
  DraftRiskScores,
  PairRiskScore,
  PickLocationRecord,
} from './types';
import { adpService } from './AdpService';

// Risk score weights
const WEIGHTS = {
  location: 0.35,
  behavior: 0.30,
  benefit: 0.35,
};

// Thresholds
const THRESHOLDS = {
  urgent: 90,
  review: 70,
  monitor: 50,
};

export class PostDraftAnalyzer {

  /**
   * Analyze a completed draft
   */
  async analyzeDraft(draftId: string): Promise<DraftRiskScores> {
    // 1. Get integrity flags
    const flags = await this.getIntegrityFlags(draftId);

    // 2. Get all pick locations for this draft
    const pickLocations = await this.getPickLocations(draftId);

    // 3. Get draft picks (player selections)
    const draftPicks = await this.getDraftPicks(draftId);

    // 4. Get ADP data for scoring
    const adpData = await adpService.getCurrentAdp();

    // 5. Analyze each flagged pair
    const pairScores: PairRiskScore[] = [];

    if (flags) {
      for (const flaggedPair of flags.flaggedPairs) {
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
      }
    }

    // 6. Also check non-flagged pairs that might have suspicious behavior
    // (pairs that weren't co-located but show suspicious patterns)
    const allUsers = [...new Set(pickLocations.map(p => p.userId))];
    for (let i = 0; i < allUsers.length; i++) {
      for (let j = i + 1; j < allUsers.length; j++) {
        const userId1 = allUsers[i] < allUsers[j] ? allUsers[i] : allUsers[j];
        const userId2 = allUsers[i] < allUsers[j] ? allUsers[j] : allUsers[i];

        // Skip if already analyzed (was flagged)
        if (pairScores.some(p => p.userId1 === userId1 && p.userId2 === userId2)) {
          continue;
        }

        // Analyze behavior only (no location flags)
        const score = await this.analyzePair(
          userId1,
          userId2,
          draftId,
          null,  // No flag data
          pickLocations,
          draftPicks,
          adpData
        );

        // Only include if behavior score is significant
        if (score.behaviorScore >= 30 || score.benefitScore >= 30) {
          pairScores.push(score);
        }
      }
    }

    // 7. Compute summary
    const scores = pairScores.map(p => p.compositeScore);
    const maxRiskScore = scores.length > 0 ? Math.max(...scores) : 0;
    const avgRiskScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const pairsAboveThreshold = pairScores.filter(p => p.compositeScore >= THRESHOLDS.monitor).length;

    // 8. Save results
    const result: DraftRiskScores = {
      draftId,
      analyzedAt: Timestamp.now(),
      pairScores,
      maxRiskScore,
      avgRiskScore,
      pairsAboveThreshold,
      status: 'analyzed',
    };

    await setDoc(doc(db, 'draftRiskScores', draftId), result);

    return result;
  }

  /**
   * Analyze a specific user pair
   */
  private async analyzePair(
    userId1: string,
    userId2: string,
    draftId: string,
    flagData: {
      flagType: string;
      eventCount: number;
    } | null,
    pickLocations: PickLocationRecord[],
    draftPicks: DraftPick[],
    adpData: Map<string, number>
  ): Promise<PairRiskScore> {
    const flags: string[] = [];

    // === LOCATION SCORE ===
    let locationScore = 0;

    if (flagData) {
      if (flagData.flagType === 'both') {
        locationScore = 80;  // Same room + same IP
        flags.push('Same room AND same network');
      } else if (flagData.flagType === 'within50ft') {
        locationScore = 60;  // Same room only
        flags.push('Same room (within 50ft)');
      } else {
        locationScore = 40;  // Same IP only
        flags.push('Same network (same IP)');
      }

      // Bonus for multiple events
      if (flagData.eventCount > 5) {
        locationScore = Math.min(100, locationScore + 15);
        flags.push(`Co-located ${flagData.eventCount} times during draft`);
      }
    }

    // === BEHAVIOR SCORE ===
    const behaviorScore = this.computeBehaviorScore(
      userId1,
      userId2,
      draftPicks,
      adpData,
      flags
    );

    // === BENEFIT SCORE ===
    const benefitScore = this.computeBenefitScore(
      userId1,
      userId2,
      draftPicks,
      adpData,
      flags
    );

    // === COMPOSITE SCORE ===
    const compositeScore = Math.round(
      locationScore * WEIGHTS.location +
      behaviorScore * WEIGHTS.behavior +
      benefitScore * WEIGHTS.benefit
    );

    // === RECOMMENDATION ===
    let recommendation: 'clear' | 'monitor' | 'review' | 'urgent';
    if (compositeScore >= THRESHOLDS.urgent) {
      recommendation = 'urgent';
    } else if (compositeScore >= THRESHOLDS.review) {
      recommendation = 'review';
    } else if (compositeScore >= THRESHOLDS.monitor) {
      recommendation = 'monitor';
    } else {
      recommendation = 'clear';
    }

    return {
      userId1,
      userId2,
      locationScore,
      behaviorScore,
      benefitScore,
      compositeScore,
      flags,
      recommendation,
    };
  }

  /**
   * Compute behavior score based on draft patterns
   */
  private computeBehaviorScore(
    userId1: string,
    userId2: string,
    draftPicks: DraftPick[],
    adpData: Map<string, number>,
    flags: string[]
  ): number {
    let score = 0;

    // Get each user's picks
    const user1Picks = draftPicks.filter(p => p.userId === userId1);
    const user2Picks = draftPicks.filter(p => p.userId === userId2);

    // === ADP DEVIATION ANALYSIS ===
    const user1Deviation = this.computeAdpDeviation(user1Picks, adpData);
    const user2Deviation = this.computeAdpDeviation(user2Picks, adpData);

    // One user reaching (negative deviation) while other gets value (positive)
    if (user1Deviation.avgDeviation < -15 && user2Deviation.avgDeviation > 10) {
      score += 40;
      flags.push(`${userId1} reached (avg ${user1Deviation.avgDeviation.toFixed(1)} from ADP), ${userId2} got value (avg +${user2Deviation.avgDeviation.toFixed(1)})`);
    } else if (user2Deviation.avgDeviation < -15 && user1Deviation.avgDeviation > 10) {
      score += 40;
      flags.push(`${userId2} reached (avg ${user2Deviation.avgDeviation.toFixed(1)} from ADP), ${userId1} got value (avg +${user1Deviation.avgDeviation.toFixed(1)})`);
    }

    // Both users have extreme deviations (coordinated strategy)
    if (Math.abs(user1Deviation.avgDeviation) > 20 && Math.abs(user2Deviation.avgDeviation) > 20) {
      score += 20;
      flags.push('Both users deviated significantly from ADP');
    }

    // === EGREGIOUS REACHES ===
    // Picks 30+ spots early are very suspicious
    const user1EgregiousReaches = user1Deviation.picks.filter(p => p.deviation < -30).length;
    const user2EgregiousReaches = user2Deviation.picks.filter(p => p.deviation < -30).length;

    if (user1EgregiousReaches >= 2 || user2EgregiousReaches >= 2) {
      score += 25;
      flags.push(`Egregious reaches detected (30+ spots early)`);
    }

    // Cap at 100
    return Math.min(100, score);
  }

  /**
   * Compute benefit score based on value transfer
   */
  private computeBenefitScore(
    userId1: string,
    userId2: string,
    draftPicks: DraftPick[],
    adpData: Map<string, number>,
    flags: string[]
  ): number {
    let score = 0;

    // Get draft order
    const sortedPicks = [...draftPicks].sort((a, b) => a.pickNumber - b.pickNumber);

    // For each user's reach, check if the other user benefited
    const user1Picks = draftPicks.filter(p => p.userId === userId1);
    const user2Picks = draftPicks.filter(p => p.userId === userId2);

    // Compute benefit from user1's reaches to user2
    const benefitToUser2 = this.computeBenefit(
      user1Picks,
      user2Picks,
      sortedPicks,
      adpData
    );

    // Compute benefit from user2's reaches to user1
    const benefitToUser1 = this.computeBenefit(
      user2Picks,
      user1Picks,
      sortedPicks,
      adpData
    );

    // One-sided benefit is more suspicious than mutual
    const totalBenefit = benefitToUser1 + benefitToUser2;
    const benefitImbalance = Math.abs(benefitToUser1 - benefitToUser2);

    if (totalBenefit > 50) {
      score += 30;
      flags.push(`High value transfer detected (${totalBenefit.toFixed(0)} total)`);
    }

    if (benefitImbalance > 30) {
      score += 25;
      const beneficiary = benefitToUser1 > benefitToUser2 ? userId1 : userId2;
      flags.push(`One-sided benefit: ${beneficiary} received ${benefitImbalance.toFixed(0)} more value`);
    }

    // Extremely high benefit
    if (totalBenefit > 100) {
      score += 20;
    }

    // Cap at 100
    return Math.min(100, score);
  }

  /**
   * Compute ADP deviation for a user's picks
   */
  private computeAdpDeviation(
    picks: DraftPick[],
    adpData: Map<string, number>
  ): {
    avgDeviation: number;
    picks: { playerId: string; pickNumber: number; adp: number; deviation: number }[];
  } {
    const deviations: { playerId: string; pickNumber: number; adp: number; deviation: number }[] = [];

    for (const pick of picks) {
      const adp = adpData.get(pick.playerId) || 200;  // Default to late if unknown
      const deviation = pick.pickNumber - adp;  // Negative = reached, Positive = fell
      deviations.push({
        playerId: pick.playerId,
        pickNumber: pick.pickNumber,
        adp,
        deviation,
      });
    }

    const avgDeviation = deviations.length > 0
      ? deviations.reduce((sum, d) => sum + d.deviation, 0) / deviations.length
      : 0;

    return { avgDeviation, picks: deviations };
  }

  /**
   * Compute benefit one user received from another's reaches
   */
  private computeBenefit(
    reacherPicks: DraftPick[],
    beneficiaryPicks: DraftPick[],
    allPicks: DraftPick[],
    adpData: Map<string, number>
  ): number {
    let totalBenefit = 0;

    for (const pick of reacherPicks) {
      const adp = adpData.get(pick.playerId) || 200;
      const deviation = pick.pickNumber - adp;

      // Only consider significant reaches (15+ spots early)
      if (deviation >= -15) continue;

      // Find beneficiary's next pick after this reach
      const beneficiaryNextPick = beneficiaryPicks.find(
        p => p.pickNumber > pick.pickNumber
      );

      if (!beneficiaryNextPick) continue;

      // Was beneficiary's pick good value?
      const beneficiaryAdp = adpData.get(beneficiaryNextPick.playerId) || 200;
      const beneficiaryValue = beneficiaryAdp - beneficiaryNextPick.pickNumber;

      // If beneficiary got a player who "should have" gone earlier
      if (beneficiaryValue > 10) {
        // Check if this player was available because of the reach
        // (Simplified: assume correlation if reach was in same round)
        const roundDiff = Math.abs(pick.pickNumber - beneficiaryNextPick.pickNumber);
        if (roundDiff <= 24) {  // Within 2 rounds
          totalBenefit += beneficiaryValue;
        }
      }
    }

    return totalBenefit;
  }

  /**
   * Get integrity flags for a draft
   */
  private async getIntegrityFlags(draftId: string): Promise<DraftIntegrityFlags | null> {
    const flagRef = doc(db, 'draftIntegrityFlags', draftId);
    const flagSnap = await getDoc(flagRef);
    if (!flagSnap.exists()) return null;
    return flagSnap.data() as DraftIntegrityFlags;
  }

  /**
   * Get pick locations for a draft
   */
  private async getPickLocations(draftId: string): Promise<PickLocationRecord[]> {
    const q = query(
      collection(db, 'pickLocations'),
      where('draftId', '==', draftId),
      orderBy('pickNumber')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as PickLocationRecord);
  }

  /**
   * Get draft picks (player selections)
   * NOTE: This queries YOUR existing draft data - adjust collection/field names
   */
  private async getDraftPicks(draftId: string): Promise<DraftPick[]> {
    // TODO: Replace with your actual draft picks collection
    // This is a placeholder - implement based on your data model

    const q = query(
      collection(db, 'drafts', draftId, 'picks'),
      orderBy('pickNumber')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      pickNumber: d.data().pickNumber,
      userId: d.data().userId,
      playerId: d.data().playerId,
      timestamp: d.data().timestamp,
    }));
  }
}

interface DraftPick {
  pickNumber: number;
  userId: string;
  playerId: string;
  timestamp: Timestamp;
}

// Singleton export
export const postDraftAnalyzer = new PostDraftAnalyzer();
```

---

## 5. STAGE 3: CROSS-DRAFT PATTERN ANALYSIS

### File: `lib/integrity/CrossDraftAnalyzer.ts`

```typescript
/**
 * CrossDraftAnalyzer
 *
 * Batch job that runs periodically (e.g., weekly).
 * Aggregates risk data across all drafts to identify persistent patterns.
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
import type {
  DraftRiskScores,
  UserPairAnalysis,
} from './types';

// Risk level thresholds for overall assessment
const OVERALL_THRESHOLDS = {
  critical: {
    coLocationRate: 0.8,
    minDrafts: 5,
  },
  high: {
    coLocationRate: 0.5,
    minDrafts: 3,
    avgRiskScore: 60,
  },
  medium: {
    coLocationRate: 0.3,
    minDrafts: 2,
    avgRiskScore: 40,
  },
};

export class CrossDraftAnalyzer {

  /**
   * Run full cross-draft analysis
   * Call this from a scheduled Cloud Function
   */
  async runFullAnalysis(): Promise<{
    pairsAnalyzed: number;
    criticalPairs: number;
    highRiskPairs: number;
  }> {
    // 1. Get all draft risk scores from last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const q = query(
      collection(db, 'draftRiskScores'),
      where('analyzedAt', '>=', Timestamp.fromDate(ninetyDaysAgo)),
      orderBy('analyzedAt', 'desc')
    );
    const snap = await getDocs(q);
    const allScores = snap.docs.map(d => d.data() as DraftRiskScores);

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

    // 3. Analyze each pair
    let pairsAnalyzed = 0;
    let criticalPairs = 0;
    let highRiskPairs = 0;

    for (const [pairId, data] of pairMap) {
      const analysis = await this.analyzePair(pairId, data);

      pairsAnalyzed++;
      if (analysis.overallRiskLevel === 'critical') criticalPairs++;
      if (analysis.overallRiskLevel === 'high') highRiskPairs++;
    }

    return { pairsAnalyzed, criticalPairs, highRiskPairs };
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
    const draftsSameIp = colocatedDrafts.length;  // Simplified; could track separately
    const draftsWithBothFlags = colocatedDrafts.filter(s => s.score >= 50).length;

    // Rates
    const coLocationRate = totalDraftsTogether > 0
      ? draftsWithin50ft / totalDraftsTogether
      : 0;
    const sameIpRate = totalDraftsTogether > 0
      ? draftsSameIp / totalDraftsTogether
      : 0;

    // Behavioral analysis: compare scores when co-located vs not
    const colocatedScores = scores.filter(s => s.wasColocated).map(s => s.score);
    const notColocatedScores = scores.filter(s => !s.wasColocated).map(s => s.score);

    const avgRiskScoreColocated = colocatedScores.length > 0
      ? colocatedScores.reduce((a, b) => a + b, 0) / colocatedScores.length
      : 0;
    const avgRiskScoreNotColocated = notColocatedScores.length > 0
      ? notColocatedScores.reduce((a, b) => a + b, 0) / notColocatedScores.length
      : 0;
    const riskScoreDifferential = avgRiskScoreColocated - avgRiskScoreNotColocated;

    // Determine overall risk level
    let overallRiskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    if (
      coLocationRate >= OVERALL_THRESHOLDS.critical.coLocationRate &&
      totalDraftsTogether >= OVERALL_THRESHOLDS.critical.minDrafts
    ) {
      overallRiskLevel = 'critical';
    } else if (
      coLocationRate >= OVERALL_THRESHOLDS.high.coLocationRate &&
      totalDraftsTogether >= OVERALL_THRESHOLDS.high.minDrafts &&
      avgRiskScoreColocated >= OVERALL_THRESHOLDS.high.avgRiskScore
    ) {
      overallRiskLevel = 'high';
    } else if (
      coLocationRate >= OVERALL_THRESHOLDS.medium.coLocationRate &&
      totalDraftsTogether >= OVERALL_THRESHOLDS.medium.minDrafts &&
      avgRiskScoreColocated >= OVERALL_THRESHOLDS.medium.avgRiskScore
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
      riskScoreHistory: sortedScores.slice(-20),  // Keep last 20
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
    // Ensure lexicographic order
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
    // Need to query both userId1 and userId2
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

    // Sort by risk level
    const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    results.sort((a, b) => riskOrder[a.overallRiskLevel] - riskOrder[b.overallRiskLevel]);

    return results;
  }
}

// Singleton export
export const crossDraftAnalyzer = new CrossDraftAnalyzer();
```

### Cloud Function: Scheduled Analysis

**File:** `functions/src/scheduledAnalysis.ts`

```typescript
import * as functions from 'firebase-functions';
import { CrossDraftAnalyzer } from './integrity/CrossDraftAnalyzer';

/**
 * Run cross-draft analysis weekly
 * Scheduled for Sunday at 3 AM
 */
export const weeklyCollusionAnalysis = functions.pubsub
  .schedule('0 3 * * 0')  // Every Sunday at 3 AM
  .timeZone('America/New_York')
  .onRun(async (context) => {
    const analyzer = new CrossDraftAnalyzer();

    try {
      const result = await analyzer.runFullAnalysis();

      console.log('Weekly collusion analysis complete:', result);

      // Send alert if critical pairs found
      if (result.criticalPairs > 0) {
        // TODO: Send Slack/email alert to integrity team
        console.warn(`ALERT: ${result.criticalPairs} critical risk pairs detected!`);
      }

      return result;
    } catch (error) {
      console.error('Collusion analysis failed:', error);
      throw error;
    }
  });

/**
 * Trigger analysis after draft completes
 */
export const onDraftComplete = functions.firestore
  .document('drafts/{draftId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Check if draft just completed
    if (before.status !== 'completed' && after.status === 'completed') {
      const { PostDraftAnalyzer } = await import('./integrity/PostDraftAnalyzer');
      const analyzer = new PostDraftAnalyzer();

      await analyzer.analyzeDraft(context.params.draftId);
    }
  });
```

---

## 6. STAGE 4: ADMIN REVIEW DASHBOARD

### File: `lib/integrity/AdminService.ts`

```typescript
/**
 * AdminService
 *
 * Backend service for admin review functionality.
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
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type {
  DraftRiskScores,
  UserPairAnalysis,
  AdminAction,
} from './types';

export class AdminService {

  /**
   * Get drafts needing review (high risk scores)
   */
  async getDraftsForReview(maxResults: number = 50): Promise<DraftRiskScores[]> {
    const q = query(
      collection(db, 'draftRiskScores'),
      where('status', '==', 'analyzed'),
      where('maxRiskScore', '>=', 50),
      orderBy('maxRiskScore', 'desc'),
      limit(maxResults)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as DraftRiskScores);
  }

  /**
   * Get user pairs needing review
   */
  async getPairsForReview(maxResults: number = 50): Promise<UserPairAnalysis[]> {
    const q = query(
      collection(db, 'userPairAnalysis'),
      where('overallRiskLevel', 'in', ['high', 'critical']),
      orderBy('lastDraftTogether', 'desc'),
      limit(maxResults)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as UserPairAnalysis);
  }

  /**
   * Record an admin action
   */
  async recordAction(params: {
    targetType: 'draft' | 'userPair' | 'user';
    targetId: string;
    adminId: string;
    adminEmail: string;
    action: 'cleared' | 'warned' | 'suspended' | 'banned' | 'escalated';
    reason: string;
    notes?: string;
    evidenceSnapshot: object;
  }): Promise<AdminAction> {
    const actionRef = doc(collection(db, 'adminActions'));

    const action: AdminAction = {
      id: actionRef.id,
      targetType: params.targetType,
      targetId: params.targetId,
      adminId: params.adminId,
      adminEmail: params.adminEmail,
      timestamp: Timestamp.now(),
      action: params.action,
      reason: params.reason,
      notes: params.notes,
      evidenceSnapshot: params.evidenceSnapshot,
    };

    await setDoc(actionRef, action);

    // Update the target's status
    if (params.targetType === 'draft') {
      await this.updateDraftReviewStatus(params.targetId, params.action, params.adminId);
    } else if (params.targetType === 'userPair') {
      await this.updatePairReviewStatus(params.targetId, params.action, params.adminId);
    }

    return action;
  }

  /**
   * Update draft review status
   */
  private async updateDraftReviewStatus(
    draftId: string,
    action: string,
    adminId: string
  ): Promise<void> {
    const docRef = doc(db, 'draftRiskScores', draftId);
    await setDoc(docRef, {
      status: 'reviewed',
      reviewedBy: adminId,
      reviewedAt: serverTimestamp(),
      reviewAction: action,
    }, { merge: true });
  }

  /**
   * Update pair review status
   */
  private async updatePairReviewStatus(
    pairId: string,
    action: string,
    adminId: string
  ): Promise<void> {
    const docRef = doc(db, 'userPairAnalysis', pairId);
    await setDoc(docRef, {
      lastReviewedBy: adminId,
      lastReviewedAt: serverTimestamp(),
      lastReviewAction: action,
    }, { merge: true });
  }

  /**
   * Get action history for a target
   */
  async getActionHistory(
    targetType: 'draft' | 'userPair' | 'user',
    targetId: string
  ): Promise<AdminAction[]> {
    const q = query(
      collection(db, 'adminActions'),
      where('targetType', '==', targetType),
      where('targetId', '==', targetId),
      orderBy('timestamp', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as AdminAction);
  }

  /**
   * Get draft detail for review
   */
  async getDraftDetail(draftId: string): Promise<{
    riskScores: DraftRiskScores | null;
    integrityFlags: DraftIntegrityFlags | null;
    pickLocations: PickLocationRecord[];
  }> {
    const [riskScores, integrityFlags, pickLocations] = await Promise.all([
      this.getDraftRiskScores(draftId),
      this.getDraftIntegrityFlags(draftId),
      this.getDraftPickLocations(draftId),
    ]);

    return { riskScores, integrityFlags, pickLocations };
  }

  private async getDraftRiskScores(draftId: string): Promise<DraftRiskScores | null> {
    const docRef = doc(db, 'draftRiskScores', draftId);
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data() as DraftRiskScores : null;
  }

  private async getDraftIntegrityFlags(draftId: string): Promise<DraftIntegrityFlags | null> {
    const docRef = doc(db, 'draftIntegrityFlags', draftId);
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data() as DraftIntegrityFlags : null;
  }

  private async getDraftPickLocations(draftId: string): Promise<PickLocationRecord[]> {
    const q = query(
      collection(db, 'pickLocations'),
      where('draftId', '==', draftId),
      orderBy('pickNumber')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as PickLocationRecord);
  }
}

// Singleton export
export const adminService = new AdminService();
```

### API Routes for Admin Dashboard

**File:** `pages/api/admin/integrity/drafts.ts`

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { adminService } from '@/lib/integrity/AdminService';
import { verifyAdminAuth } from '@/lib/auth/adminAuth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verify admin authentication
  const admin = await verifyAdminAuth(req);
  if (!admin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const drafts = await adminService.getDraftsForReview(50);
      return res.status(200).json(drafts);
    } catch (error) {
      console.error('Failed to get drafts for review:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
```

**File:** `pages/api/admin/integrity/drafts/[draftId].ts`

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { adminService } from '@/lib/integrity/AdminService';
import { verifyAdminAuth } from '@/lib/auth/adminAuth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const admin = await verifyAdminAuth(req);
  if (!admin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { draftId } = req.query;

  if (req.method === 'GET') {
    try {
      const detail = await adminService.getDraftDetail(draftId as string);
      return res.status(200).json(detail);
    } catch (error) {
      console.error('Failed to get draft detail:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
```

**File:** `pages/api/admin/integrity/actions.ts`

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { adminService } from '@/lib/integrity/AdminService';
import { verifyAdminAuth } from '@/lib/auth/adminAuth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const admin = await verifyAdminAuth(req);
  if (!admin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'POST') {
    try {
      const { targetType, targetId, action, reason, notes, evidenceSnapshot } = req.body;

      const result = await adminService.recordAction({
        targetType,
        targetId,
        adminId: admin.uid,
        adminEmail: admin.email,
        action,
        reason,
        notes,
        evidenceSnapshot,
      });

      return res.status(200).json(result);
    } catch (error) {
      console.error('Failed to record action:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
```

### Admin Dashboard Component

**File:** `components/admin/IntegrityDashboard.tsx`

```tsx
/**
 * IntegrityDashboard
 *
 * Admin dashboard for reviewing collusion flags.
 */

import React, { useEffect, useState } from 'react';
import type {
  DraftRiskScores,
  UserPairAnalysis,
} from '@/lib/integrity/types';

export function IntegrityDashboard() {
  const [drafts, setDrafts] = useState<DraftRiskScores[]>([]);
  const [pairs, setPairs] = useState<UserPairAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDraft, setSelectedDraft] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [draftsRes, pairsRes] = await Promise.all([
        fetch('/api/admin/integrity/drafts'),
        fetch('/api/admin/integrity/pairs'),
      ]);

      const draftsData = await draftsRes.json();
      const pairsData = await pairsRes.json();

      setDrafts(draftsData);
      setPairs(pairsData);
    } catch (error) {
      console.error('Failed to load integrity data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="p-8">Loading integrity data...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Integrity Review Dashboard</h1>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Drafts for Review"
          value={drafts.length}
          color="yellow"
        />
        <StatCard
          label="High Risk Pairs"
          value={pairs.filter(p => p.overallRiskLevel === 'high').length}
          color="orange"
        />
        <StatCard
          label="Critical Pairs"
          value={pairs.filter(p => p.overallRiskLevel === 'critical').length}
          color="red"
        />
        <StatCard
          label="Reviewed Today"
          value={drafts.filter(d => d.status === 'reviewed').length}
          color="green"
        />
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6">
        <TabButton active={!selectedDraft} onClick={() => setSelectedDraft(null)}>
          Flagged Drafts
        </TabButton>
        <TabButton active={false} onClick={() => {}}>
          User Pairs
        </TabButton>
      </div>

      {/* Draft List */}
      {!selectedDraft && (
        <div className="bg-white rounded-lg shadow">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Draft ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Max Risk</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Flagged Pairs</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Analyzed</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {drafts.map(draft => (
                <tr key={draft.draftId} className="border-t">
                  <td className="px-4 py-3 text-sm font-mono">{draft.draftId.slice(0, 8)}...</td>
                  <td className="px-4 py-3">
                    <RiskBadge score={draft.maxRiskScore} />
                  </td>
                  <td className="px-4 py-3 text-sm">{draft.pairsAboveThreshold}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {draft.analyzedAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={draft.status} />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedDraft(draft.draftId)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Draft Detail View */}
      {selectedDraft && (
        <DraftDetailView
          draftId={selectedDraft}
          onBack={() => setSelectedDraft(null)}
          onAction={loadData}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    yellow: 'bg-yellow-100 text-yellow-800',
    orange: 'bg-orange-100 text-orange-800',
    red: 'bg-red-100 text-red-800',
    green: 'bg-green-100 text-green-800',
  };

  return (
    <div className={`rounded-lg p-4 ${colors[color]}`}>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm">{label}</div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium ${
        active
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  );
}

function RiskBadge({ score }: { score: number }) {
  let color = 'bg-green-100 text-green-800';
  if (score >= 90) {
    color = 'bg-red-100 text-red-800';
  } else if (score >= 70) {
    color = 'bg-orange-100 text-orange-800';
  } else if (score >= 50) {
    color = 'bg-yellow-100 text-yellow-800';
  }

  return (
    <span className={`px-2 py-1 rounded-full text-sm font-medium ${color}`}>
      {score}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-800',
    analyzed: 'bg-blue-100 text-blue-800',
    reviewed: 'bg-green-100 text-green-800',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-sm font-medium ${colors[status] || colors.pending}`}>
      {status}
    </span>
  );
}

function DraftDetailView({
  draftId,
  onBack,
  onAction,
}: {
  draftId: string;
  onBack: () => void;
  onAction: () => void;
}) {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionReason, setActionReason] = useState('');
  const [actionNotes, setActionNotes] = useState('');

  useEffect(() => {
    loadDetail();
  }, [draftId]);

  async function loadDetail() {
    try {
      const res = await fetch(`/api/admin/integrity/drafts/${draftId}`);
      const data = await res.json();
      setDetail(data);
    } catch (error) {
      console.error('Failed to load draft detail:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(action: string) {
    if (!actionReason.trim()) {
      alert('Please provide a reason for this action');
      return;
    }

    try {
      await fetch('/api/admin/integrity/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType: 'draft',
          targetId: draftId,
          action,
          reason: actionReason,
          notes: actionNotes,
          evidenceSnapshot: detail,
        }),
      });

      onAction();
      onBack();
    } catch (error) {
      console.error('Failed to record action:', error);
    }
  }

  if (loading) {
    return <div className="p-8">Loading draft detail...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Draft: {draftId}</h2>
        <button
          onClick={onBack}
          className="text-gray-500 hover:text-gray-700"
        >
          ← Back to list
        </button>
      </div>

      {/* Risk Scores */}
      {detail?.riskScores && (
        <div className="mb-6">
          <h3 className="font-medium mb-2">Pair Risk Scores</h3>
          <div className="space-y-2">
            {detail.riskScores.pairScores.map((pair: any, idx: number) => (
              <div key={idx} className="border rounded p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-mono text-sm">{pair.userId1.slice(0, 8)}</span>
                    {' ↔ '}
                    <span className="font-mono text-sm">{pair.userId2.slice(0, 8)}</span>
                  </div>
                  <RiskBadge score={pair.compositeScore} />
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Location: {pair.locationScore} | Behavior: {pair.behaviorScore} | Benefit: {pair.benefitScore}
                </div>
                {pair.flags.length > 0 && (
                  <div className="mt-2">
                    {pair.flags.map((flag: string, i: number) => (
                      <div key={i} className="text-sm text-orange-600">• {flag}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Form */}
      <div className="border-t pt-6">
        <h3 className="font-medium mb-4">Take Action</h3>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Reason</label>
          <input
            type="text"
            value={actionReason}
            onChange={(e) => setActionReason(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="Explain the reason for this action"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Notes (optional)</label>
          <textarea
            value={actionNotes}
            onChange={(e) => setActionNotes(e.target.value)}
            className="w-full border rounded px-3 py-2"
            rows={3}
            placeholder="Additional notes"
          />
        </div>

        <div className="flex space-x-4">
          <button
            onClick={() => handleAction('cleared')}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Clear
          </button>
          <button
            onClick={() => handleAction('warned')}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            Warn Users
          </button>
          <button
            onClick={() => handleAction('suspended')}
            className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
          >
            Suspend
          </button>
          <button
            onClick={() => handleAction('escalated')}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Escalate
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 7. ADP DATA INTEGRATION

### File: `lib/integrity/AdpService.ts`

```typescript
/**
 * AdpService
 *
 * Provides Average Draft Position (ADP) data for risk scoring.
 * ADP is the consensus ranking of players used to detect "reaches" and "falls".
 */

import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface AdpData {
  playerId: string;
  playerName: string;
  position: string;
  team: string;
  adp: number;  // Overall pick number (1-228)
  adpByPosition: number;  // Rank within position
  lastUpdated: Timestamp;
}

export class AdpService {
  private cache: Map<string, number> | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_TTL = 1000 * 60 * 60;  // 1 hour

  /**
   * Get current ADP data
   * Returns Map of playerId -> ADP (overall pick number)
   */
  async getCurrentAdp(): Promise<Map<string, number>> {
    // Check cache
    if (this.cache && Date.now() < this.cacheExpiry) {
      return this.cache;
    }

    // Load from Firestore
    const adpRef = doc(db, 'adpData', 'current');
    const adpSnap = await getDoc(adpRef);

    if (!adpSnap.exists()) {
      // No ADP data - return empty map
      console.warn('No ADP data found');
      return new Map();
    }

    const data = adpSnap.data();
    const players: AdpData[] = data.players || [];

    // Build map
    this.cache = new Map();
    for (const player of players) {
      this.cache.set(player.playerId, player.adp);
    }
    this.cacheExpiry = Date.now() + this.CACHE_TTL;

    return this.cache;
  }

  /**
   * Get ADP for a specific player
   */
  async getPlayerAdp(playerId: string): Promise<number | null> {
    const adpMap = await this.getCurrentAdp();
    return adpMap.get(playerId) ?? null;
  }

  /**
   * Update ADP data (admin function)
   * Called when new ADP data is available (e.g., weekly update from external source)
   */
  async updateAdpData(players: AdpData[]): Promise<void> {
    const adpRef = doc(db, 'adpData', 'current');

    await setDoc(adpRef, {
      players,
      lastUpdated: Timestamp.now(),
      playerCount: players.length,
    });

    // Clear cache
    this.cache = null;
    this.cacheExpiry = 0;
  }

  /**
   * Import ADP data from external source
   * NOTE: Replace this with your actual ADP data source
   */
  async importFromSource(sourceUrl: string): Promise<void> {
    // Example: Fetch from external API
    // const response = await fetch(sourceUrl);
    // const data = await response.json();

    // Transform to AdpData format
    // const players = data.map((p: any) => ({
    //   playerId: p.id,
    //   playerName: p.name,
    //   position: p.position,
    //   team: p.team,
    //   adp: p.averageDraftPosition,
    //   adpByPosition: p.positionRank,
    //   lastUpdated: Timestamp.now(),
    // }));

    // await this.updateAdpData(players);

    throw new Error('Not implemented - replace with your ADP source');
  }
}

// Singleton export
export const adpService = new AdpService();
```

### ADP Data Structure in Firestore

**Collection:** `adpData`
**Document ID:** `current`

```typescript
{
  players: [
    {
      playerId: "player_123",
      playerName: "Patrick Mahomes",
      position: "QB",
      team: "KC",
      adp: 24.5,  // Consensus: picked around pick 24-25
      adpByPosition: 1,  // QB1
      lastUpdated: Timestamp
    },
    // ... 200+ players
  ],
  lastUpdated: Timestamp,
  playerCount: 228
}
```

---

## 8. TYPES & INTERFACES

### File: `lib/integrity/types.ts`

```typescript
/**
 * Collusion Detection Types
 *
 * Shared types for the collusion detection system.
 */

import { Timestamp } from 'firebase/firestore';

// === STAGE 1: Real-Time Flagging ===

export interface DraftIntegrityFlags {
  draftId: string;
  flaggedPairs: IntegrityFlag[];
  totalWithin50ftEvents: number;
  totalSameIpEvents: number;
  uniqueUserPairsFlagged: number;
  draftStartedAt: Timestamp;
  lastUpdatedAt: Timestamp;
  status: 'active' | 'completed' | 'reviewed';
}

export interface IntegrityFlag {
  userId1: string;
  userId2: string;
  flagType: 'within50ft' | 'sameIp' | 'both';
  events: FlagEvent[];
  firstDetectedAt: Timestamp;
  lastDetectedAt: Timestamp;
  eventCount: number;
}

export interface FlagEvent {
  pickNumber: number;
  triggeringUserId: string;
  otherUserId: string;
  distance?: number;
  timestamp: Timestamp;
}

// === STAGE 2: Post-Draft Risk Scoring ===

export interface DraftRiskScores {
  draftId: string;
  analyzedAt: Timestamp;
  pairScores: PairRiskScore[];
  maxRiskScore: number;
  avgRiskScore: number;
  pairsAboveThreshold: number;
  status: 'pending' | 'analyzed' | 'reviewed';
  reviewedBy?: string;
  reviewedAt?: Timestamp;
  reviewNotes?: string;
  reviewAction?: string;
}

export interface PairRiskScore {
  userId1: string;
  userId2: string;
  locationScore: number;
  behaviorScore: number;
  benefitScore: number;
  compositeScore: number;
  flags: string[];
  recommendation: 'clear' | 'monitor' | 'review' | 'urgent';
}

// === STAGE 3: Cross-Draft Analysis ===

export interface UserPairAnalysis {
  pairId: string;
  userId1: string;
  userId2: string;
  totalDraftsTogether: number;
  draftsWithin50ft: number;
  draftsSameIp: number;
  draftsWithBothFlags: number;
  coLocationRate: number;
  sameIpRate: number;
  avgRiskScoreColocated: number;
  avgRiskScoreNotColocated: number;
  riskScoreDifferential: number;
  riskScoreHistory: {
    draftId: string;
    score: number;
    wasColocated: boolean;
    timestamp: Timestamp;
  }[];
  overallRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  firstDraftTogether: Timestamp;
  lastDraftTogether: Timestamp;
  lastAnalyzedAt: Timestamp;
  lastReviewedBy?: string;
  lastReviewedAt?: Timestamp;
  lastReviewAction?: string;
}

// === STAGE 4: Admin Actions ===

export interface AdminAction {
  id: string;
  targetType: 'draft' | 'userPair' | 'user';
  targetId: string;
  adminId: string;
  adminEmail: string;
  timestamp: Timestamp;
  action: 'cleared' | 'warned' | 'suspended' | 'banned' | 'escalated';
  reason: string;
  notes?: string;
  evidenceSnapshot: object;
}

// === From Location Integrity System ===

export interface PickLocationRecord {
  id: string;
  draftId: string;
  pickNumber: number;
  userId: string;
  timestamp: Timestamp;
  lat: number;
  lng: number;
  accuracy: number;
  ipAddress: string;
  countyCode: string | null;
  countryCode: string;
  stateCode: string | null;
  within50ft: string[];
  sameIp: string[];
  deviceId: string;
  createdAt: Timestamp;
}
```

---

## 9. IMPLEMENTATION PHASES

### Phase 1: Real-Time Flagging (3-4 hours)

**Tasks:**
1. [ ] Create `lib/integrity/types.ts` with all type definitions
2. [ ] Create `lib/integrity/CollusionFlagService.ts`
3. [ ] Integrate `recordProximityFlag()` call into `LocationIntegrityService`
4. [ ] Create Firestore indexes for `draftIntegrityFlags`
5. [ ] Test real-time flagging during a draft

**Test:**
- Simulate two users within 50ft
- Verify flag document is created
- Verify events are appended on subsequent picks

### Phase 2: Post-Draft Risk Scoring (5-6 hours)

**Tasks:**
1. [ ] Create `lib/integrity/AdpService.ts`
2. [ ] Populate `adpData/current` document with player ADP
3. [ ] Create `lib/integrity/PostDraftAnalyzer.ts`
4. [ ] Implement `computeBehaviorScore()` logic
5. [ ] Implement `computeBenefitScore()` logic
6. [ ] Add Cloud Function trigger on draft completion
7. [ ] Create Firestore indexes for `draftRiskScores`
8. [ ] Test post-draft analysis on completed draft

**Test:**
- Complete a draft with flagged pairs
- Verify risk scores are computed
- Verify flags are generated correctly

### Phase 3: Cross-Draft Analysis (3-4 hours)

**Tasks:**
1. [ ] Create `lib/integrity/CrossDraftAnalyzer.ts`
2. [ ] Create scheduled Cloud Function for weekly analysis
3. [ ] Create Firestore indexes for `userPairAnalysis`
4. [ ] Test batch analysis on historical drafts

**Test:**
- Run analysis on multiple drafts
- Verify pair aggregation is correct
- Verify risk levels are assigned correctly

### Phase 4: Admin Dashboard (4-5 hours)

**Tasks:**
1. [ ] Create `lib/integrity/AdminService.ts`
2. [ ] Create API routes for admin endpoints
3. [ ] Create `components/admin/IntegrityDashboard.tsx`
4. [ ] Create admin auth verification (`lib/auth/adminAuth.ts`)
5. [ ] Add dashboard to admin pages
6. [ ] Create Firestore indexes for `adminActions`
7. [ ] Test full admin workflow

**Test:**
- View flagged drafts
- Drill into draft detail
- Record admin action
- Verify audit trail

**Total Estimated Time:** 15-19 hours

---

## 10. TESTING CHECKLIST

### Unit Tests

- [ ] `CollusionFlagService.recordProximityFlag()` creates correct flag structure
- [ ] `PostDraftAnalyzer.computeAdpDeviation()` calculates correctly
- [ ] `PostDraftAnalyzer.computeBenefitScore()` identifies value transfer
- [ ] `CrossDraftAnalyzer` aggregates pairs correctly
- [ ] Risk level thresholds work as expected

### Integration Tests

- [ ] Flag is recorded when `within50ft` is non-empty
- [ ] Flag is recorded when `sameIp` is non-empty
- [ ] Post-draft analysis runs on draft completion
- [ ] Cross-draft analysis aggregates multiple drafts
- [ ] Admin actions update target status

### End-to-End Tests

- [ ] Complete draft with two co-located users
- [ ] Verify real-time flags appear
- [ ] Verify post-draft risk scores are computed
- [ ] Verify admin can review and take action
- [ ] Run weekly analysis and verify pair data

### Edge Cases

- [ ] Draft with no co-locations (no flags)
- [ ] User pair with only 1 draft together (insufficient data)
- [ ] Missing ADP data for a player (use default 200)
- [ ] Admin action on already-reviewed draft

---

## FILE STRUCTURE SUMMARY

```
lib/integrity/
├── types.ts                    # All TypeScript interfaces
├── LocationIntegrityService.ts # (From main design - add flag call)
├── CollusionFlagService.ts     # Stage 1: Real-time flagging
├── PostDraftAnalyzer.ts        # Stage 2: Post-draft analysis
├── CrossDraftAnalyzer.ts       # Stage 3: Cross-draft patterns
├── AdminService.ts             # Stage 4: Admin review
├── AdpService.ts               # ADP data management
├── countyData.ts               # (From main design)
├── locationNames.ts            # (From main design)
└── index.ts                    # Exports

pages/api/admin/integrity/
├── drafts.ts                   # List drafts for review
├── drafts/[draftId].ts         # Draft detail
├── pairs.ts                    # List user pairs
├── pairs/[pairId].ts           # Pair detail
└── actions.ts                  # Record admin action

components/admin/
└── IntegrityDashboard.tsx      # Admin review UI

functions/src/
├── scheduledAnalysis.ts        # Weekly batch job
└── integrity/                  # Copies of services for Cloud Functions
    ├── PostDraftAnalyzer.ts
    └── CrossDraftAnalyzer.ts
```

---

## FIRESTORE COLLECTIONS SUMMARY

| Collection | Purpose | Document ID |
|------------|---------|-------------|
| `pickLocations` | Per-pick location data | `{draftId}_{pickNumber}_{userId}` |
| `draftLocationState` | Ephemeral draft state | `{draftId}` |
| `userBadges` | User location badges | `{userId}` |
| `draftIntegrityFlags` | Real-time flags | `{draftId}` |
| `draftRiskScores` | Post-draft analysis | `{draftId}` |
| `userPairAnalysis` | Cross-draft patterns | `{userId1}_{userId2}` |
| `adminActions` | Admin audit trail | Auto-generated |
| `adpData` | Player ADP rankings | `current` |

---

## NEXT STEPS AFTER IMPLEMENTATION

1. **Populate ADP data** - Import player rankings from your data source
2. **Monitor initial results** - Review first batch of flagged drafts manually
3. **Tune thresholds** - Adjust score weights and thresholds based on false positive rate
4. **Add alerting** - Send Slack/email alerts for critical risk pairs
5. **Build ML model** - If labeled data accumulates, train a classifier
