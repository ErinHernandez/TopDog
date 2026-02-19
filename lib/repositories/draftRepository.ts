/**
 * Draft Repository
 *
 * Typed repository for drafts and draft-related collections
 */

import { where, orderBy, Timestamp } from 'firebase/firestore';

import { getFirebaseAdapter, FirebaseAdapter } from '@/lib/firebase/firebaseAdapter';
import { logger } from '@/lib/structuredLogger';
import { type FirestoreDraft, type FirestorePick } from '@/types/firestore';

import { BaseRepository } from './baseRepository';

/**
 * Repository for draft documents (/drafts/{draftId})
 */
class DraftRepository extends BaseRepository<FirestoreDraft> {
  private picksRepository: DraftPicksSubRepository;

  constructor(adapter = getFirebaseAdapter()) {
    super('drafts', adapter);
    this.picksRepository = new DraftPicksSubRepository(adapter);
  }

  /**
   * Get a draft by ID
   */
  async getById(draftId: string): Promise<FirestoreDraft | null> {
    return this.get(draftId);
  }

  /**
   * Get all drafts for a tournament
   */
  async getByTournament(tournamentId: string): Promise<FirestoreDraft[]> {
    return this.queryWhere('tournamentId', '==', tournamentId);
  }

  /**
   * Get active drafts
   */
  async getActive(): Promise<FirestoreDraft[]> {
    return this.queryWhere('status', '==', 'active');
  }

  /**
   * Get drafts by status
   */
  async getByStatus(status: string): Promise<FirestoreDraft[]> {
    return this.queryWhere('status', '==', status);
  }

  /**
   * Update draft status
   */
  async updateStatus(draftId: string, status: string): Promise<void> {
    await this.update(draftId, {
      status,
      updatedAt: Timestamp.now(),
    } as Partial<FirestoreDraft>);
  }

  /**
   * Update current pick number and deadline
   */
  async updatePickState(
    draftId: string,
    currentPickNumber: number,
    currentPickDeadline: Timestamp
  ): Promise<void> {
    await this.update(draftId, {
      currentPickNumber,
      currentPickDeadline,
      updatedAt: Timestamp.now(),
    } as Partial<FirestoreDraft>);
  }

  /**
   * Create a new draft
   */
  async createDraft(draftId: string, data: Omit<FirestoreDraft, 'id'>): Promise<void> {
    await this.set(draftId, { ...data, id: draftId } as FirestoreDraft);
  }

  /**
   * Access draft picks sub-collection
   */
  getPicks(): DraftPicksSubRepository {
    return this.picksRepository;
  }

  /**
   * Get all picks for a draft (delegates to picks repository)
   */
  async getAllPicks(draftId: string): Promise<FirestorePick[]> {
    return this.picksRepository.getByDraft(draftId);
  }

  /**
   * Delete a draft
   */
  async deleteDraft(draftId: string): Promise<void> {
    await this.delete(draftId);
  }
}

/**
 * Sub-repository for draft picks (nested collection)
 */
class DraftPicksSubRepository {
  private adapter: FirebaseAdapter;

  constructor(adapter: FirebaseAdapter) {
    this.adapter = adapter;
  }

  /**
   * Get all picks for a draft, ordered by pick number
   */
  async getByDraft(draftId: string): Promise<FirestorePick[]> {
    try {
      return await this.adapter.queryDocuments<FirestorePick>(
        `drafts/${draftId}/picks`,
        [],
        { orderByField: 'pickNumber', orderDirection: 'asc' }
      );
    } catch (error) {
      logger.error('Failed to get draft picks', error as Error, {
        component: 'repository',
        operation: 'getByDraft',
        draftId,
      });
      throw error;
    }
  }

  /**
   * Get a single pick
   */
  async getById(draftId: string, pickId: string): Promise<FirestorePick | null> {
    try {
      return await this.adapter.getDocument<FirestorePick>(
        `drafts/${draftId}/picks`,
        pickId
      );
    } catch (error) {
      logger.error('Failed to get pick', error as Error, {
        component: 'repository',
        operation: 'getById',
        draftId,
        pickId,
      });
      throw error;
    }
  }

  /**
   * Add a new pick
   */
  async add(draftId: string, data: Omit<FirestorePick, 'id'>): Promise<string> {
    try {
      return await this.adapter.addDocument<FirestorePick>(
        `drafts/${draftId}/picks`,
        data
      );
    } catch (error) {
      logger.error('Failed to add pick', error as Error, {
        component: 'repository',
        operation: 'add',
        draftId,
      });
      throw error;
    }
  }

  /**
   * Update a pick
   */
  async update(draftId: string, pickId: string, updates: Partial<FirestorePick>): Promise<void> {
    try {
      await this.adapter.updateDocument(
        `drafts/${draftId}/picks`,
        pickId,
        updates
      );
    } catch (error) {
      logger.error('Failed to update pick', error as Error, {
        component: 'repository',
        operation: 'update',
        draftId,
        pickId,
      });
      throw error;
    }
  }

  /**
   * Get picks by participant
   */
  async getByParticipant(
    draftId: string,
    participantIndex: number
  ): Promise<FirestorePick[]> {
    try {
      return await this.adapter.queryDocuments<FirestorePick>(
        `drafts/${draftId}/picks`,
        [where('participantIndex', '==', participantIndex)],
        { orderByField: 'pickNumber', orderDirection: 'asc' }
      );
    } catch (error) {
      logger.error('Failed to get participant picks', error as Error, {
        component: 'repository',
        operation: 'getByParticipant',
        draftId,
        participantIndex,
      });
      throw error;
    }
  }
}

// Singleton instance
let draftRepositoryInstance: DraftRepository | null = null;

/**
 * Get the singleton DraftRepository instance
 */
export function getDraftRepository(): DraftRepository {
  if (!draftRepositoryInstance) {
    draftRepositoryInstance = new DraftRepository();
  }
  return draftRepositoryInstance;
}

// Default export
export const draftRepository = getDraftRepository();
