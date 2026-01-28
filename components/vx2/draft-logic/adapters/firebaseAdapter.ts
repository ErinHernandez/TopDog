/**
 * VX2 Draft Logic - Firebase Adapter
 *
 * Real-time Firebase/Firestore adapter for draft room data.
 * Implements the DraftAdapter interface with Firestore subscriptions.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  type Unsubscribe as FirestoreUnsubscribe,
} from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import type {
  DraftAdapter,
  DraftRoom,
  DraftPick,
  DraftPlayer,
  DraftStatus,
  AutodraftConfig,
  Participant,
  Unsubscribe,
} from '../types';
import { DRAFT_CONFIG, DEFAULT_POSITION_LIMITS } from '../constants';
import { createScopedLogger } from '../../../../lib/clientLogger';

const logger = createScopedLogger('[FirebaseAdapter]');

// ============================================================================
// TYPES
// ============================================================================

interface FirestoreDraftRoom {
  name: string;
  status: DraftStatus;
  currentPickNumber: number;
  teamCount: number;
  rosterSize: number;
  pickTimeSeconds: number;
  gracePeriodSeconds: number;
  participants: Participant[];
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface FirestoreDraftPick {
  pickNumber: number;
  round: number;
  pickInRound: number;
  playerId: string;
  playerName: string;
  playerPosition: string;
  playerTeam: string;
  participantId: string;
  participantIndex: number;
  timestamp: Timestamp;
  isAutopick: boolean;
  source: string;
  rosterAtPick: Record<string, number>;
}

interface FirestoreAutodraftConfig {
  isEnabled: boolean;
  positionLimits: Record<string, number>;
  customRankings: string[];
  updatedAt: Timestamp;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function convertFirestoreRoomToRoom(id: string, data: FirestoreDraftRoom): DraftRoom {
  return {
    id,
    name: data.name,
    status: data.status,
    currentPickNumber: data.currentPickNumber,
    settings: {
      teamCount: data.teamCount,
      rosterSize: data.rosterSize,
      pickTimeSeconds: data.pickTimeSeconds,
      gracePeriodSeconds: data.gracePeriodSeconds,
    },
    participants: data.participants || [],
    startedAt: data.startedAt?.toMillis(),
    completedAt: data.completedAt?.toMillis(),
  };
}

function convertFirestorePickToPick(id: string, data: FirestoreDraftPick): DraftPick {
  return {
    id,
    pickNumber: data.pickNumber,
    round: data.round,
    pickInRound: data.pickInRound,
    player: {
      id: data.playerId,
      name: data.playerName,
      position: data.playerPosition as 'QB' | 'RB' | 'WR' | 'TE',
      team: data.playerTeam,
      adp: 0, // Not stored in pick
    },
    participantId: data.participantId,
    participantIndex: data.participantIndex,
    timestamp: data.timestamp?.toMillis() || Date.now(),
    isAutopick: data.isAutopick,
    source: data.source as 'manual' | 'queue' | 'custom_ranking' | 'adp',
    rosterAtPick: {
      QB: data.rosterAtPick?.QB || 0,
      RB: data.rosterAtPick?.RB || 0,
      WR: data.rosterAtPick?.WR || 0,
      TE: data.rosterAtPick?.TE || 0,
    },
  };
}

// ============================================================================
// FIREBASE ADAPTER IMPLEMENTATION
// ============================================================================

export class FirebaseAdapter implements DraftAdapter {
  private playersCache: DraftPlayer[] | null = null;
  private playersCacheTime: number = 0;
  private readonly PLAYERS_CACHE_TTL = 60000; // 1 minute

  constructor() {
    logger.info('Firebase adapter initialized');
  }

  // -------------------------------------------------------------------------
  // ROOM OPERATIONS
  // -------------------------------------------------------------------------

  async getRoom(roomId: string): Promise<DraftRoom | null> {
    try {
      if (!db) {
        logger.error('Firebase not initialized');
        return null;
      }

      const roomRef = doc(db, 'draftRooms', roomId);
      const roomDoc = await getDoc(roomRef);

      if (!roomDoc.exists()) {
        logger.warn(`Room ${roomId} not found`);
        return null;
      }

      return convertFirestoreRoomToRoom(roomId, roomDoc.data() as FirestoreDraftRoom);
    } catch (error) {
      logger.error('Error getting room', error as Error, { roomId });
      throw error;
    }
  }

  subscribeToRoom(
    roomId: string,
    callback: (room: DraftRoom) => void
  ): Unsubscribe {
    if (!db) {
      logger.error('Firebase not initialized');
      return () => {};
    }

    const roomRef = doc(db, 'draftRooms', roomId);

    const unsubscribe: FirestoreUnsubscribe = onSnapshot(
      roomRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const room = convertFirestoreRoomToRoom(roomId, snapshot.data() as FirestoreDraftRoom);
          callback(room);
        }
      },
      (error) => {
        logger.error('Room subscription error', error as Error, { roomId });
      }
    );

    return unsubscribe;
  }

  async updateRoomStatus(roomId: string, status: DraftStatus): Promise<void> {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }

      const roomRef = doc(db, 'draftRooms', roomId);
      const updates: Record<string, unknown> = {
        status,
        updatedAt: serverTimestamp(),
      };

      if (status === 'active') {
        updates.startedAt = serverTimestamp();
      } else if (status === 'complete') {
        updates.completedAt = serverTimestamp();
      }

      await updateDoc(roomRef, updates);
      logger.info('Room status updated', { roomId, status });
    } catch (error) {
      logger.error('Error updating room status', error as Error, { roomId, status });
      throw error;
    }
  }

  // -------------------------------------------------------------------------
  // PICK OPERATIONS
  // -------------------------------------------------------------------------

  async getPicks(roomId: string): Promise<DraftPick[]> {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }

      const picksRef = collection(db, 'draftRooms', roomId, 'picks');
      const q = query(picksRef, orderBy('pickNumber', 'asc'), limit(500));
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) =>
        convertFirestorePickToPick(doc.id, doc.data() as FirestoreDraftPick)
      );
    } catch (error) {
      logger.error('Error getting picks', error as Error, { roomId });
      throw error;
    }
  }

  subscribeToPicks(
    roomId: string,
    callback: (picks: DraftPick[]) => void
  ): Unsubscribe {
    if (!db) {
      logger.error('Firebase not initialized');
      return () => {};
    }

    const picksRef = collection(db, 'draftRooms', roomId, 'picks');
    const q = query(picksRef, orderBy('pickNumber', 'asc'));

    const unsubscribe: FirestoreUnsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const picks = snapshot.docs.map((doc) =>
          convertFirestorePickToPick(doc.id, doc.data() as FirestoreDraftPick)
        );
        callback(picks);
      },
      (error) => {
        logger.error('Picks subscription error', error as Error, { roomId });
      }
    );

    return unsubscribe;
  }

  async addPick(roomId: string, pick: Omit<DraftPick, 'id'>): Promise<DraftPick> {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }

      const picksRef = collection(db, 'draftRooms', roomId, 'picks');

      const firestorePick: Omit<FirestoreDraftPick, 'timestamp'> & { timestamp: ReturnType<typeof serverTimestamp> } = {
        pickNumber: pick.pickNumber,
        round: pick.round,
        pickInRound: pick.pickInRound,
        playerId: pick.player.id,
        playerName: pick.player.name,
        playerPosition: pick.player.position,
        playerTeam: pick.player.team,
        participantId: pick.participantId,
        participantIndex: pick.participantIndex,
        timestamp: serverTimestamp(),
        isAutopick: pick.isAutopick,
        source: pick.source,
        rosterAtPick: { ...pick.rosterAtPick },
      };

      const docRef = await addDoc(picksRef, firestorePick);

      // Also update the room's current pick number
      const roomRef = doc(db, 'draftRooms', roomId);
      await updateDoc(roomRef, {
        currentPickNumber: pick.pickNumber + 1,
        updatedAt: serverTimestamp(),
      });

      logger.info('Pick added', { roomId, pickNumber: pick.pickNumber, playerId: pick.player.id });

      return {
        id: docRef.id,
        ...pick,
        timestamp: Date.now(),
      };
    } catch (error) {
      logger.error('Error adding pick', error as Error, { roomId, pickNumber: pick.pickNumber });
      throw error;
    }
  }

  // -------------------------------------------------------------------------
  // PLAYER OPERATIONS
  // -------------------------------------------------------------------------

  async getAvailablePlayers(roomId: string): Promise<DraftPlayer[]> {
    try {
      // Use cached players if still valid
      const now = Date.now();
      if (this.playersCache && now - this.playersCacheTime < this.PLAYERS_CACHE_TTL) {
        return this.playersCache;
      }

      if (!db) {
        throw new Error('Firebase not initialized');
      }

      // Fetch players from the players collection (limit to 600 - typical draft pool size)
      const playersRef = collection(db, 'players');
      const snapshot = await getDocs(query(playersRef, limit(600)));

      const players: DraftPlayer[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || data.displayName || 'Unknown',
          position: data.position as 'QB' | 'RB' | 'WR' | 'TE',
          team: data.team || data.nflTeam || 'FA',
          adp: data.adp || data.averageDraftPosition || 999,
          projectedPoints: data.projectedPoints || data.fantasyPoints,
          byeWeek: data.byeWeek,
        };
      });

      // Cache the results
      this.playersCache = players;
      this.playersCacheTime = now;

      logger.info('Players loaded', { count: players.length });
      return players;
    } catch (error) {
      logger.error('Error getting players', error as Error, { roomId });
      throw error;
    }
  }

  // -------------------------------------------------------------------------
  // AUTODRAFT CONFIG OPERATIONS
  // -------------------------------------------------------------------------

  async getAutodraftConfig(userId: string): Promise<AutodraftConfig | null> {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }

      const configRef = doc(db, 'users', userId, 'draftSettings', 'autodraft');
      const configDoc = await getDoc(configRef);

      if (!configDoc.exists()) {
        return null;
      }

      const data = configDoc.data() as FirestoreAutodraftConfig;
      return {
        isEnabled: data.isEnabled ?? true,
        positionLimits: {
          QB: data.positionLimits?.QB ?? DEFAULT_POSITION_LIMITS.QB,
          RB: data.positionLimits?.RB ?? DEFAULT_POSITION_LIMITS.RB,
          WR: data.positionLimits?.WR ?? DEFAULT_POSITION_LIMITS.WR,
          TE: data.positionLimits?.TE ?? DEFAULT_POSITION_LIMITS.TE,
        },
        customRankings: data.customRankings || [],
      };
    } catch (error) {
      logger.error('Error getting autodraft config', error as Error, { userId });
      throw error;
    }
  }

  async saveAutodraftConfig(
    userId: string,
    config: Partial<AutodraftConfig>
  ): Promise<void> {
    try {
      if (!db) {
        throw new Error('Firebase not initialized');
      }

      const configRef = doc(db, 'users', userId, 'draftSettings', 'autodraft');

      await setDoc(
        configRef,
        {
          ...config,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      logger.info('Autodraft config saved', { userId });
    } catch (error) {
      logger.error('Error saving autodraft config', error as Error, { userId });
      throw error;
    }
  }

  // -------------------------------------------------------------------------
  // CLEANUP
  // -------------------------------------------------------------------------

  /**
   * Clear player cache
   */
  clearCache(): void {
    this.playersCache = null;
    this.playersCacheTime = 0;
  }
}

/**
 * Create a Firebase adapter instance
 */
export function createFirebaseAdapter(): DraftAdapter {
  return new FirebaseAdapter();
}

export default FirebaseAdapter;
