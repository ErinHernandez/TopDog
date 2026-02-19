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
import { logger } from '@/lib/structuredLogger';

import { CROSS_DRAFT_CONFIG } from './config';
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

    // 1. Get all draft risk scores from last N days
    if (!db) {
      throw new Error('Firebase db not initialized');
    }
    const lookbackDate = new Date();
    lookbackDate.setDate(lookbackDate.getDate() - CROSS_DRAFT_CONFIG.lookbackDays);

    const q = query(
      collection(db, 'draftRiskScores'),
      where('analyzedAt', '>=', Timestamp.fromDate(lookbackDate)),
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

      } catch (error: unknown) {
        failedPairs++;
        const errorMessage = error instanceof Error ? error.message : String(error);

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
      riskScoreHistory: sortedScores.slice(-CROSS_DRAFT_CONFIG.maxHistoryEntries),
      overallRiskLevel,
      firstDraftTogether: sortedScores[0]?.timestamp || Timestamp.now(),
      lastDraftTogether: sortedScores[sortedScores.length - 1]?.timestamp || Timestamp.now(),
      lastAnalyzedAt: Timestamp.now(),
    };

    // Save to Firestore
    if (!db) {
      throw new Error('Firebase db not initialized');
    }
    await setDoc(doc(db, 'userPairAnalysis', pairId), analysis);

    return analysis;
  }

  /**
   * Get high-risk pairs for admin review
   */
  async getHighRiskPairs(minRiskLevel: 'medium' | 'high' | 'critical' = 'high'): Promise<UserPairAnalysis[]> {
    if (!db) {
      throw new Error('Firebase db not initialized');
    }
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
    if (!db) {
      throw new Error('Firebase db not initialized');
    }
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
    if (!db) {
      throw new Error('Firebase db not initialized');
    }
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
