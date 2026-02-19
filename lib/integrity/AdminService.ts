/**
 * AdminService
 *
 * Backend service for admin review functionality.
 *
 * NOTE: This service is for reviewing completed drafts only.
 * It does NOT block or prevent drafts from completing.
 * All actions are taken after the fact based on review.
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
  DraftIntegrityFlags,
  UserPairAnalysis,
  AdminAction,
  PickLocationRecord,
} from './types';

export class AdminService {
  /**
   * Get drafts needing review (high risk scores)
   */
  async getDraftsForReview(maxResults: number = 50): Promise<DraftRiskScores[]> {
    if (!db) {
      throw new Error('Firebase db not initialized');
    }
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
    if (!db) {
      throw new Error('Firebase db not initialized');
    }
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
    if (!db) {
      throw new Error('Firebase db not initialized');
    }
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
    if (!db) {
      throw new Error('Firebase db not initialized');
    }
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
    if (!db) {
      throw new Error('Firebase db not initialized');
    }
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
    if (!db) {
      throw new Error('Firebase db not initialized');
    }
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
    if (!db) {
      throw new Error('Firebase db not initialized');
    }
    const docRef = doc(db, 'draftRiskScores', draftId);
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data() as DraftRiskScores : null;
  }

  private async getDraftIntegrityFlags(draftId: string): Promise<DraftIntegrityFlags | null> {
    if (!db) {
      throw new Error('Firebase db not initialized');
    }
    const docRef = doc(db, 'draftIntegrityFlags', draftId);
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data() as DraftIntegrityFlags : null;
  }

  private async getDraftPickLocations(draftId: string): Promise<PickLocationRecord[]> {
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
}

// Singleton export
export const adminService = new AdminService();
