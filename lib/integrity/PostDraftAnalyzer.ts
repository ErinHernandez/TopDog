/**
 * PostDraftAnalyzer
 *
 * Runs after each draft completes.
 * Analyzes draft patterns and computes risk scores.
 *
 * CRITICAL: This analyzer runs AFTER drafts have already completed.
 * It does NOT affect draft execution in any way. All analysis is
 * passive and for review purposes only. Drafts are NEVER blocked
 * or modified by this service.
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
import { logger } from '@/lib/structuredLogger';

import { adpService } from './AdpService';
import { RISK_CONFIG, BEHAVIOR_ANALYSIS_CONFIG } from './config';
import type {
  DraftIntegrityFlags,
  DraftRiskScores,
  PairRiskScore,
  PickLocationRecord,
  DraftPick,
} from './types';

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

    // 5. Analyze each flagged pair with error handling
    const pairScores: PairRiskScore[] = [];

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
          const userId1 = allUsers[i]! < allUsers[j]! ? allUsers[i]! : allUsers[j]!;
          const userId2 = allUsers[i]! < allUsers[j]! ? allUsers[j]! : allUsers[i]!;

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

    // 7. Compute summary
    const scores = pairScores.map(p => p.compositeScore);
    const maxRiskScore = scores.length > 0 ? Math.max(...scores) : 0;
    const avgRiskScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const pairsAboveThreshold = pairScores.filter(p => p.compositeScore >= RISK_CONFIG.thresholds.monitor).length;

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

    if (!db) {
      throw new Error('Firebase db not initialized');
    }
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
        locationScore = RISK_CONFIG.locationScores.both;
        flags.push('Same room AND same network');
      } else if (flagData.flagType === 'within50ft') {
        locationScore = RISK_CONFIG.locationScores.within50ft;
        flags.push('Same room (within 50ft)');
      } else {
        locationScore = RISK_CONFIG.locationScores.sameIp;
        flags.push('Same network (same IP)');
      }

      // Bonus for multiple events
      if (flagData.eventCount > RISK_CONFIG.locationScores.multipleEventsThreshold) {
        locationScore = Math.min(100, locationScore + RISK_CONFIG.locationScores.multipleEventsBonus);
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
      locationScore * RISK_CONFIG.weights.location +
      behaviorScore * RISK_CONFIG.weights.behavior +
      benefitScore * RISK_CONFIG.weights.benefit
    );

    // === RECOMMENDATION ===
    let recommendation: 'clear' | 'monitor' | 'review' | 'urgent';
    if (compositeScore >= RISK_CONFIG.thresholds.urgent) {
      recommendation = 'urgent';
    } else if (compositeScore >= RISK_CONFIG.thresholds.review) {
      recommendation = 'review';
    } else if (compositeScore >= RISK_CONFIG.thresholds.monitor) {
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
    if (user1Deviation.avgDeviation < RISK_CONFIG.behaviorAnalysis.significantReach && 
        user2Deviation.avgDeviation > RISK_CONFIG.behaviorAnalysis.significantValue) {
      score += 40;
      flags.push(`${userId1.slice(0, 8)} reached (avg ${user1Deviation.avgDeviation.toFixed(1)} from ADP), ${userId2.slice(0, 8)} got value (avg +${user2Deviation.avgDeviation.toFixed(1)})`);
    } else if (user2Deviation.avgDeviation < RISK_CONFIG.behaviorAnalysis.significantReach && 
               user1Deviation.avgDeviation > RISK_CONFIG.behaviorAnalysis.significantValue) {
      score += 40;
      flags.push(`${userId2.slice(0, 8)} reached (avg ${user2Deviation.avgDeviation.toFixed(1)} from ADP), ${userId1.slice(0, 8)} got value (avg +${user1Deviation.avgDeviation.toFixed(1)})`);
    }

    // Both users have extreme deviations (coordinated strategy)
    if (Math.abs(user1Deviation.avgDeviation) > 20 && Math.abs(user2Deviation.avgDeviation) > 20) {
      score += 20;
      flags.push('Both users deviated significantly from ADP');
    }

    // === EGREGIOUS REACHES ===
    // Picks 30+ spots early are very suspicious
    const user1EgregiousReaches = user1Deviation.picks.filter(p => p.deviation < RISK_CONFIG.behaviorAnalysis.egregiousReach).length;
    const user2EgregiousReaches = user2Deviation.picks.filter(p => p.deviation < RISK_CONFIG.behaviorAnalysis.egregiousReach).length;

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
      const beneficiary = benefitToUser1 > benefitToUser2 ? userId1.slice(0, 8) : userId2.slice(0, 8);
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

      // Only consider significant reaches
      if (deviation >= RISK_CONFIG.behaviorAnalysis.significantReach) continue;

      // Find beneficiary's next pick after this reach
      const beneficiaryNextPick = beneficiaryPicks.find(
        p => p.pickNumber > pick.pickNumber
      );

      if (!beneficiaryNextPick) continue;

      // Was beneficiary's pick good value?
      const beneficiaryAdp = adpData.get(beneficiaryNextPick.playerId) || 200;
      const beneficiaryValue = beneficiaryAdp - beneficiaryNextPick.pickNumber;

      // If beneficiary got a player who "should have" gone earlier
      if (beneficiaryValue > RISK_CONFIG.behaviorAnalysis.significantValue) {
        // Check if this player was available because of the reach
        // (Simplified: assume correlation if reach was in same round)
        const roundDiff = Math.abs(pick.pickNumber - beneficiaryNextPick.pickNumber);
        if (roundDiff <= RISK_CONFIG.behaviorAnalysis.roundCorrelationWindow) {
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
    if (!db) {
      throw new Error('Firebase db not initialized');
    }
    const flagRef = doc(db, 'draftIntegrityFlags', draftId);
    const flagSnap = await getDoc(flagRef);
    if (!flagSnap.exists()) return null;
    return flagSnap.data() as DraftIntegrityFlags;
  }

  /**
   * Get pick locations for a draft
   */
  private async getPickLocations(draftId: string): Promise<PickLocationRecord[]> {
    if (!db) {
      throw new Error('Firebase db not initialized');
    }
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
   * Works with draftRooms collection structure
   */
  private async getDraftPicks(draftId: string): Promise<DraftPick[]> {
    if (!db) {
      throw new Error('Firebase db not initialized');
    }
    // Try draftRooms first (newer structure)
    try {
      const picksRef = collection(db, 'draftRooms', draftId, 'picks');
      const q = query(picksRef, orderBy('pickNumber'));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        return snap.docs.map(d => {
          const data = d.data();
          return {
            pickNumber: data.pickNumber,
            userId: data.participantId || data.userId,
            playerId: data.playerId,
            timestamp: data.timestamp || Timestamp.now(),
          };
        });
      }
    } catch (error) {
      // Fall through to try drafts collection
    }

    // Fallback to drafts collection (older structure)
    try {
      const picksRef = collection(db, 'drafts', draftId, 'picks');
      const q = query(picksRef, orderBy('pickNumber'));
      const snap = await getDocs(q);
      
      return snap.docs.map(d => {
        const data = d.data();
        return {
          pickNumber: data.pickNumber,
          userId: data.userId,
          playerId: data.playerId,
          timestamp: data.timestamp || Timestamp.now(),
        };
      });
    } catch (error) {
      logger.error('Failed to get draft picks', error as Error, {
        component: 'PostDraftAnalyzer',
        draftId,
      });
      return [];
    }
  }
}

// Singleton export
export const postDraftAnalyzer = new PostDraftAnalyzer();
