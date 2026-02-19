/**
 * Firestore Schema Types
 *
 * TypeScript interfaces matching the Firestore document structure.
 * See docs/FIRESTORE_SCHEMA.md for full documentation.
 */

import { Timestamp } from 'firebase/firestore';

import { toMillis } from '@/lib/firebaseTimestamp';

// ============================================================================
// DRAFT TYPES
// ============================================================================

export type DraftType = 'fast' | 'slow';
export type DraftStatus = 'scheduled' | 'filling' | 'active' | 'paused' | 'completed' | 'cancelled';

export interface DraftParticipant {
  /** Draft position (0-11) */
  participantIndex: number;
  /** User ID */
  userId: string;
  /** Display name (denormalized) */
  username: string;
  /** Real-time connection status */
  isConnected: boolean;
  /** Last activity */
  lastSeenAt: Timestamp;
  /** Auto-draft enabled */
  autopickEnabled: boolean;
}

/**
 * /drafts/{draftId}
 */
export interface FirestoreDraft {
  id: string;
  tournamentId: string;
  
  // Configuration
  draftType: DraftType;
  pickTimeSeconds: number;
  numTeams: number;
  numRounds: number;
  snakeOrder: boolean;
  
  // State
  status: DraftStatus;
  currentPickNumber: number;
  currentPickDeadline: Timestamp;
  
  // Participants
  participants: DraftParticipant[];
  
  // Timestamps
  scheduledStartTime: Timestamp;
  actualStartTime: Timestamp | null;
  completedTime: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// PICK TYPES
// ============================================================================

/**
 * /drafts/{draftId}/picks/{pickNumber}
 */
export interface FirestorePick {
  pickNumber: number;
  playerId: string;
  participantIndex: number;
  userId: string;
  
  roundNumber: number;
  pickInRound: number;
  
  timestamp: Timestamp;
  timeUsedSeconds: number;
  wasAutopick: boolean;
  
  // Denormalized
  draftType: DraftType;
  tournamentId: string;
}

/**
 * /picks_flat/{pickId}
 * 
 * Denormalized for ADP queries across all drafts.
 */
export interface FirestorePickFlat {
  id: string;
  draftId: string;
  pickNumber: number;
  playerId: string;
  draftType: DraftType;
  timestamp: Timestamp;
  tournamentId?: string;
  userId?: string;
}

// ============================================================================
// TOURNAMENT TYPES
// ============================================================================

export type TournamentStatus = 'upcoming' | 'filling' | 'active' | 'completed';

/**
 * /tournaments/{tournamentId}
 */
export interface FirestoreTournament {
  id: string;
  name: string;
  entryFee: number;
  prizePool: number;
  maxEntries: number;
  currentEntries: number;
  
  draftType: DraftType;
  status: TournamentStatus;
  
  draftWindowStart: Timestamp;
  draftWindowEnd: Timestamp;
  
  createdAt: Timestamp;
}

// ============================================================================
// USER TYPES
// ============================================================================

/**
 * /users/{userId}
 */
export interface FirestoreUser {
  id: string;
  username: string;
  email: string;
  
  defaultAutopickEnabled: boolean;
  queuedPlayers: string[];
  
  totalDrafts: number;
  totalTeams: number;
  
  createdAt: Timestamp;
  lastActiveAt: Timestamp;
}

// ============================================================================
// TEAM TYPES
// ============================================================================

export type TeamStatus = 'drafting' | 'active' | 'eliminated' | 'won';

export interface TeamPlayer {
  playerId: string;
  name: string;
  position: string;
  team: string;
  pickNumber: number;
}

/**
 * /users/{userId}/teams/{teamId}
 */
export interface FirestoreTeam {
  id: string;
  tournamentId: string;
  tournamentName: string;
  draftType: DraftType;
  
  /** Custom team name (optional, falls back to tournamentName) */
  name?: string;
  
  roster: TeamPlayer[];
  
  status: TeamStatus;
  totalPoints?: number;
  rank?: number;
  payout?: number;
  
  createdAt: Timestamp;
  completedAt?: Timestamp;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Pick data for ADP calculation (from picks_flat collection)
 */
export interface ADPPickData {
  playerId: string;
  pickNumber: number;
  timestamp: number; // Unix timestamp (converted from Firestore Timestamp)
  draftId: string;
  draftType: DraftType;
}

/**
 * Convert Firestore Timestamp to Unix timestamp for ADP calculation
 * @deprecated Use toMillis() from firebaseTimestamp.ts instead
 */
export function toUnixTimestamp(ts: Timestamp): number {
  return toMillis(ts);
}

/**
 * Convert FirestorePickFlat to ADPPickData
 */
export function toADPPickData(pick: FirestorePickFlat): ADPPickData {
  return {
    playerId: pick.playerId,
    pickNumber: pick.pickNumber,
    timestamp: toMillis(pick.timestamp),
    draftId: pick.draftId,
    draftType: pick.draftType,
  };
}

