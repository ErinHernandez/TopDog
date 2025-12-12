/**
 * VX Shared Types
 * 
 * Centralized type definitions used across all VX components.
 */

import type { FantasyPosition } from '../constants/positions';

// ============================================================================
// PLAYER TYPES
// ============================================================================

export interface Player {
  /** Unique player ID (e.g., 'chase_jamarr') - used for ADP lookups */
  id?: string;
  name: string;
  position: FantasyPosition;
  team: string;
  adp: number | null;
  bye?: number | null;
  proj?: string | null;
  projectedPoints?: number | null;
}

// ============================================================================
// PARTICIPANT TYPES
// ============================================================================

export interface Participant {
  name: string;
  team?: string;
  userId?: string;
}

// ============================================================================
// PICK TYPES
// ============================================================================

export interface Pick {
  pickNumber: number;
  player: Player;
  participantIndex: number;
  roundNumber?: number;
  timestamp?: number;
}

// ============================================================================
// DRAFT STATE TYPES
// ============================================================================

export interface DraftState {
  isDraftActive: boolean;
  isPaused: boolean;
  currentPickNumber: number;
  timer: number;
  isMyTurn: boolean;
  myPickNumbers: number[];
  currentUserIndex: number;
}

