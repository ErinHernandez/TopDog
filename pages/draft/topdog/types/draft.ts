/**
 * Draft Room Type Definitions
 * 
 * TypeScript types for draft room state, actions, and data structures.
 * 
 * Part of Phase 1: Types and Context
 */

import { Timestamp } from 'firebase/firestore';

// ============================================================================
// CORE TYPES
// ============================================================================

export interface Player {
  name: string;
  position: 'QB' | 'RB' | 'WR' | 'TE';
  team: string;
  adp: number;
  bye: number;
}

export interface DraftPick {
  pickNumber: number;
  round: number;
  user: string;
  player: string;
  roomId: string;
  timestamp: Timestamp;
}

export interface DraftSettings {
  timerSeconds: number;
  totalRounds: number;
  maxParticipants: number;
}

export interface DraftRoom {
  id: string;
  name?: string;
  status: 'waiting' | 'active' | 'paused' | 'completed';
  currentPick: number;
  participants: string[];
  draftOrder: string[];
  settings: DraftSettings;
  createdAt: Timestamp;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  pausedAt?: Timestamp;
  lastPickAt?: Timestamp;
  mockDrafters?: string[];
  createdBy?: string;
  draftOrderTimestamp?: Timestamp;
}

export type DraftStatus = 'waiting' | 'active' | 'paused' | 'completed';

// ============================================================================
// STATE TYPES
// ============================================================================

export interface DraftState {
  // Connection
  isConnected: boolean;
  isLoading: boolean;
  error: Error | null;

  // Room data
  room: DraftRoom | null;
  picks: DraftPick[];
  availablePlayers: Player[];

  // User state
  currentUser: string;
  isMyTurn: boolean;
  myPicks: DraftPick[];

  // Timer
  timer: number;
  isInGracePeriod: boolean;

  // Queue
  queue: Player[];

  // UI state
  selectedPlayer: Player | null;
  filters: {
    search: string;
    positions: string[];
    sortBy: 'adp' | 'rankings';
    sortDirection: 'asc' | 'desc';
  };

  // Rankings
  rankings: string[];
  customRankings: string[];
}

// ============================================================================
// ACTION TYPES
// ============================================================================

export type DraftAction =
  | { type: 'SET_ROOM'; payload: DraftRoom }
  | { type: 'SET_PICKS'; payload: DraftPick[] }
  | { type: 'ADD_PICK'; payload: DraftPick }
  | { type: 'SET_TIMER'; payload: number }
  | { type: 'TICK_TIMER' }
  | { type: 'SET_QUEUE'; payload: Player[] }
  | { type: 'ADD_TO_QUEUE'; payload: Player }
  | { type: 'REMOVE_FROM_QUEUE'; payload: string }
  | { type: 'SET_FILTERS'; payload: Partial<DraftState['filters']> }
  | { type: 'SELECT_PLAYER'; payload: Player | null }
  | { type: 'SET_ERROR'; payload: Error | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_AVAILABLE_PLAYERS'; payload: Player[] }
  | { type: 'SET_RANKINGS'; payload: string[] }
  | { type: 'SET_CUSTOM_RANKINGS'; payload: string[] }
  | { type: 'SET_IS_MY_TURN'; payload: boolean }
  | { type: 'SET_IS_IN_GRACE_PERIOD'; payload: boolean };
