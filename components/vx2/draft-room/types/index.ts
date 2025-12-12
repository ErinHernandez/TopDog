/**
 * VX2 Draft Room Types
 * 
 * Fresh type definitions for the VX2 draft room.
 * No dependencies on VX - uses VX2 core types only.
 */

// ============================================================================
// POSITION TYPES
// ============================================================================

/**
 * Fantasy football positions
 */
export type Position = 'QB' | 'RB' | 'WR' | 'TE';

/**
 * All positions including flex
 */
export type RosterPosition = Position | 'FLEX';

// ============================================================================
// PLAYER TYPES
// ============================================================================

/**
 * Player in the draft pool
 */
export interface DraftPlayer {
  /** Unique identifier (e.g., 'chase_jamarr') */
  id: string;
  /** Full display name */
  name: string;
  /** Position */
  position: Position;
  /** NFL team abbreviation */
  team: string;
  /** Average draft position */
  adp: number;
  /** Projected fantasy points */
  projectedPoints: number;
  /** Bye week (1-14) */
  byeWeek: number;
  /** User's custom rank (optional, for dev/testing) */
  rank?: number;
}

/**
 * Player in the user's queue
 */
export interface QueuedPlayer extends DraftPlayer {
  /** Timestamp when added to queue */
  queuedAt: number;
  /** Position in queue (0-indexed) */
  queuePosition: number;
}

// ============================================================================
// PARTICIPANT TYPES
// ============================================================================

/**
 * Draft participant (team owner)
 */
export interface Participant {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Whether this is the current user */
  isUser: boolean;
  /** Draft position (0-indexed, used for snake draft) */
  draftPosition: number;
}

// ============================================================================
// PICK TYPES
// ============================================================================

/**
 * A completed draft pick
 */
export interface DraftPick {
  /** Unique identifier */
  id: string;
  /** Overall pick number (1-216 for 12-team, 18-round) */
  pickNumber: number;
  /** Round number (1-18) */
  round: number;
  /** Pick within round (1-12) */
  pickInRound: number;
  /** Player selected */
  player: DraftPlayer;
  /** ID of participant who made the pick */
  participantId: string;
  /** Index of participant (0-11) */
  participantIndex: number;
  /** Unix timestamp when pick was made */
  timestamp: number;
}

// ============================================================================
// DRAFT ROOM TYPES
// ============================================================================

/**
 * Draft room status
 */
export type DraftStatus = 
  | 'loading'      // Initial load
  | 'waiting'      // Pre-draft countdown
  | 'active'       // Draft in progress
  | 'paused'       // Draft paused
  | 'complete';    // Draft finished

/**
 * Draft settings/configuration
 */
export interface DraftSettings {
  /** Number of teams (typically 12) */
  teamCount: number;
  /** Roster size (typically 18) */
  rosterSize: number;
  /** Seconds per pick */
  pickTimeSeconds: number;
  /** Grace period before auto-pick */
  gracePeriodSeconds: number;
}

/**
 * Draft room data
 */
export interface DraftRoom {
  /** Unique identifier */
  id: string;
  /** Current status */
  status: DraftStatus;
  /** Current pick number (1-indexed) */
  currentPickNumber: number;
  /** Draft settings */
  settings: DraftSettings;
  /** List of participants */
  participants: Participant[];
  /** Unix timestamp when draft started */
  startedAt?: number;
  /** Unix timestamp when draft completed */
  completedAt?: number;
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

/**
 * Draft room tab identifiers
 */
export type DraftTab = 'players' | 'queue' | 'rosters' | 'board' | 'info';

/**
 * Player list sort options
 */
export type PlayerSortOption = 
  | 'adp-asc' 
  | 'adp-desc' 
  | 'name-asc' 
  | 'name-desc'
  | 'proj-asc'
  | 'proj-desc'
  | 'rank-asc'
  | 'rank-desc';

/**
 * Position counts for roster tracking
 */
export interface PositionCounts {
  QB: number;
  RB: number;
  WR: number;
  TE: number;
}

// ============================================================================
// TIMER TYPES
// ============================================================================

/**
 * Timer state
 */
export type TimerState = 'running' | 'paused' | 'expired';

/**
 * Timer urgency level for styling
 */
export type TimerUrgency = 'normal' | 'warning' | 'critical';

// ============================================================================
// HOOK RESULT TYPES
// ============================================================================

/**
 * Standard async data result pattern
 */
export interface AsyncDataResult<T> {
  data: T;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}
