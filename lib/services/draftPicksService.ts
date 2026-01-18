/**
 * Draft Picks Service
 *
 * Optimized pick queries with batch operations and safety limits.
 * Uses existing patterns from:
 * - lib/firebase/retryUtils.ts → withFullProtection()
 *
 * @module lib/services/draftPicksService
 */

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';
import { withFullProtection } from '../firebase/retryUtils';
import { logger } from '../structuredLogger';

// ============================================================================
// TYPES
// ============================================================================

export interface DraftPick {
  id: string;
  pickNumber: number;
  round: number;
  pickInRound: number;
  playerId: string;
  playerName: string;
  playerPosition: string;
  playerTeam: string;
  participantId: string;
  participantIndex: number;
  timestamp: number;
}

export interface GetPicksOptions {
  /** Filter by participant ID */
  participantId?: string;
  /** Maximum picks to return */
  limit?: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Maximum picks in a draft (12 teams * 18 rounds = 216, with buffer) */
const MAX_PICKS_LIMIT = 500;

/** Batch size for concurrent room queries */
const BATCH_SIZE = 5;

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Get all picks for a draft room
 *
 * @param roomId - Draft room ID
 * @param options - Query options
 * @returns Array of picks ordered by pick number
 *
 * @example
 * // Get all picks in a room
 * const picks = await getDraftPicks('room123');
 *
 * @example
 * // Get only a specific participant's picks
 * const myPicks = await getDraftPicks('room123', {
 *   participantId: 'user456'
 * });
 */
export async function getDraftPicks(
  roomId: string,
  options: GetPicksOptions = {}
): Promise<DraftPick[]> {
  return withFullProtection(`picks:${roomId}`, async () => {
    if (!db) {
      throw new Error('Database not initialized');
    }

    const picksRef = collection(db, 'draftRooms', roomId, 'picks');
    const queryLimit = Math.min(options.limit || MAX_PICKS_LIMIT, MAX_PICKS_LIMIT);

    let q;
    if (options.participantId) {
      q = query(
        picksRef,
        where('participantId', '==', options.participantId),
        orderBy('pickNumber', 'asc'),
        limit(queryLimit)
      );
    } else {
      q = query(
        picksRef,
        orderBy('pickNumber', 'asc'),
        limit(queryLimit)
      );
    }

    const snapshot = await getDocs(q);

    const picks = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        pickNumber: data.pickNumber,
        round: data.round,
        pickInRound: data.pickInRound,
        playerId: data.playerId,
        playerName: data.playerName || 'Unknown',
        playerPosition: data.playerPosition,
        playerTeam: data.playerTeam || 'FA',
        participantId: data.participantId,
        participantIndex: data.participantIndex,
        timestamp: data.timestamp?.toMillis?.() || Date.now(),
      };
    });

    logger.debug('Draft picks fetched', {
      component: 'draftPicksService',
      roomId,
      pickCount: picks.length,
      participantId: options.participantId,
    });

    return picks;
  });
}

/**
 * Get set of drafted player IDs for a room
 *
 * @param roomId - Draft room ID
 * @returns Set of player IDs that have been drafted
 *
 * @example
 * const draftedIds = await getDraftedPlayerIds('room123');
 * const isAvailable = !draftedIds.has('player456');
 */
export async function getDraftedPlayerIds(roomId: string): Promise<Set<string>> {
  const picks = await getDraftPicks(roomId);
  return new Set(picks.map((p) => p.playerId));
}

/**
 * Batch get picks for multiple rooms
 *
 * Processes rooms in batches to avoid overwhelming Firestore.
 * Much more efficient than N+1 queries.
 *
 * @param roomIds - Array of room IDs to query
 * @param participantIdMap - Map of roomId -> participantId for filtering
 * @returns Map of roomId -> picks array
 *
 * @example
 * const roomIds = ['room1', 'room2', 'room3'];
 * const participantMap = new Map([
 *   ['room1', 'user1'],
 *   ['room2', 'user1'],
 *   ['room3', 'user1'],
 * ]);
 * const allPicks = await batchGetUserPicks(roomIds, participantMap);
 * const room1Picks = allPicks.get('room1');
 */
export async function batchGetUserPicks(
  roomIds: string[],
  participantIdMap: Map<string, string>
): Promise<Map<string, DraftPick[]>> {
  const results = new Map<string, DraftPick[]>();

  // Process in batches to control concurrency
  for (let i = 0; i < roomIds.length; i += BATCH_SIZE) {
    const batch = roomIds.slice(i, i + BATCH_SIZE);

    const promises = batch.map(async (roomId) => {
      const participantId = participantIdMap.get(roomId);
      if (!participantId) {
        return { roomId, picks: [] as DraftPick[] };
      }

      try {
        const picks = await getDraftPicks(roomId, { participantId });
        return { roomId, picks };
      } catch (error) {
        // Log error but don't fail the entire batch
        logger.error('Failed to fetch picks for room', error as Error, {
          component: 'draftPicksService',
          roomId,
          participantId,
        });
        return { roomId, picks: [] as DraftPick[] };
      }
    });

    const batchResults = await Promise.all(promises);
    batchResults.forEach(({ roomId, picks }) => {
      results.set(roomId, picks);
    });
  }

  logger.info('Batch picks fetched', {
    component: 'draftPicksService',
    roomCount: roomIds.length,
    batchCount: Math.ceil(roomIds.length / BATCH_SIZE),
  });

  return results;
}

/**
 * Count picks per position for a participant
 *
 * @param picks - Array of picks to count
 * @param participantIndex - Participant index to filter
 * @returns Object with position counts
 */
export function countPositionsForParticipant(
  picks: DraftPick[],
  participantIndex: number
): Record<'QB' | 'RB' | 'WR' | 'TE', number> {
  const counts = { QB: 0, RB: 0, WR: 0, TE: 0 };

  picks.forEach((pick) => {
    if (pick.participantIndex === participantIndex) {
      const pos = pick.playerPosition as keyof typeof counts;
      if (pos in counts) {
        counts[pos]++;
      }
    }
  });

  return counts;
}
