/**
 * VX2 Draft Logic - Type Definitions
 * 
 * Fresh type definitions for the draft pick system.
 * All new code - no imports from existing draft modules.
 */

// ============================================================================
// POSITION TYPES
// ============================================================================

/**
 * Fantasy football positions
 */
export type Position = 'QB' | 'RB' | 'WR' | 'TE';

/**
 * All positions as array (for iteration)
 */
export const POSITIONS: readonly Position[] = ['QB', 'RB', 'WR', 'TE'] as const;

/**
 * Position counts for roster tracking
 */
export interface PositionCounts {
  QB: number;
  RB: number;
  WR: number;
  TE: number;
}

/**
 * Position limits for autodraft
 */
export interface PositionLimits {
  QB: number;
  RB: number;
  WR: number;
  TE: number;
}

// ============================================================================
// PLAYER TYPES
// ============================================================================

/**
 * Player in the draft pool
 */
export interface DraftPlayer {
  /** Unique identifier */
  id: string;
  /** Full display name */
  name: string;
  /** Position */
  position: Position;
  /** NFL team abbreviation */
  team: string;
  /** Average draft position */
  adp: number;
  /** Projected fantasy points (optional) */
  projectedPoints?: number;
  /** Bye week (1-14) */
  byeWeek?: number;
}

/**
 * Player in the user's queue
 */
export interface QueuedPlayer extends DraftPlayer {
  /** Position in queue (0-indexed) */
  queuePosition: number;
  /** Timestamp when added to queue */
  queuedAt: number;
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
  /** Draft position (0-indexed) */
  draftPosition: number;
  /** Whether this is the current user */
  isCurrentUser: boolean;
}

// ============================================================================
// PICK TYPES
// ============================================================================

/**
 * Source of a draft pick
 */
export type PickSource = 'manual' | 'queue' | 'custom_ranking' | 'adp';

/**
 * A completed draft pick
 */
export interface DraftPick {
  /** Unique identifier */
  id: string;
  /** Overall pick number (1-indexed) */
  pickNumber: number;
  /** Round number (1-indexed) */
  round: number;
  /** Pick within round (1-indexed) */
  pickInRound: number;
  /** Player selected */
  player: DraftPlayer;
  /** ID of participant who made the pick */
  participantId: string;
  /** Index of participant (0-indexed) */
  participantIndex: number;
  /** Unix timestamp when pick was made */
  timestamp: number;
  /** Whether this was an autopick */
  isAutopick: boolean;
  /** Source of the pick selection */
  source: PickSource;
  /** Team composition at time of pick */
  rosterAtPick: PositionCounts;
}

// ============================================================================
// DRAFT STATE TYPES
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
  /** Number of teams */
  teamCount: number;
  /** Roster size (rounds) */
  rosterSize: number;
  /** Seconds per pick */
  pickTimeSeconds: number;
  /** Grace period before autopick (seconds) */
  gracePeriodSeconds: number;
}

/**
 * Draft room data
 */
export interface DraftRoom {
  /** Unique identifier */
  id: string;
  /** Room name/title */
  name: string;
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
// TIMER TYPES
// ============================================================================

/**
 * Timer state
 */
export type TimerState = 'idle' | 'running' | 'paused' | 'grace_period' | 'expired';

/**
 * Timer urgency level for styling
 */
export type TimerUrgency = 'normal' | 'warning' | 'critical';

/**
 * Full timer status
 */
export interface TimerStatus {
  /** Current state */
  state: TimerState;
  /** Seconds remaining */
  secondsRemaining: number;
  /** Urgency level */
  urgency: TimerUrgency;
  /** Whether in grace period */
  isInGracePeriod: boolean;
}

// ============================================================================
// AUTODRAFT TYPES
// ============================================================================

/**
 * Autodraft source (how player was selected)
 */
export type AutodraftSource = 'queue' | 'custom_ranking' | 'adp';

/**
 * Autodraft selection result
 */
export interface AutodraftResult {
  /** Selected player */
  player: DraftPlayer;
  /** How player was selected */
  source: AutodraftSource;
}

/**
 * Autodraft configuration
 */
export interface AutodraftConfig {
  /** Whether autodraft is enabled */
  isEnabled: boolean;
  /** Position limits */
  positionLimits: PositionLimits;
  /** Custom rankings (player IDs in order) */
  customRankings: string[];
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

/**
 * Validation error codes
 */
export type ValidationErrorCode =
  | 'NOT_YOUR_TURN'
  | 'PLAYER_UNAVAILABLE'
  | 'POSITION_LIMIT_REACHED'
  | 'TIMER_EXPIRED'
  | 'DRAFT_NOT_ACTIVE'
  | 'INVALID_PLAYER';

/**
 * Validation result
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Error code if invalid */
  errorCode?: ValidationErrorCode;
  /** Human-readable error message */
  errorMessage?: string;
}

// ============================================================================
// ADAPTER TYPES
// ============================================================================

/**
 * Adapter mode
 */
export type AdapterMode = 'mock' | 'firebase' | 'local';

/**
 * Unsubscribe function type
 */
export type Unsubscribe = () => void;

/**
 * Draft data adapter interface
 */
export interface DraftAdapter {
  /** Get room data */
  getRoom(roomId: string): Promise<DraftRoom | null>;
  
  /** Subscribe to room updates */
  subscribeToRoom(
    roomId: string, 
    callback: (room: DraftRoom) => void
  ): Unsubscribe;
  
  /** Get all picks for a room */
  getPicks(roomId: string): Promise<DraftPick[]>;
  
  /** Subscribe to picks */
  subscribeToPicks(
    roomId: string, 
    callback: (picks: DraftPick[]) => void
  ): Unsubscribe;
  
  /** Add a new pick */
  addPick(roomId: string, pick: Omit<DraftPick, 'id'>): Promise<DraftPick>;
  
  /** Get available players */
  getAvailablePlayers(roomId: string): Promise<DraftPlayer[]>;
  
  /** Get autodraft config for user */
  getAutodraftConfig(userId: string): Promise<AutodraftConfig | null>;
  
  /** Save autodraft config */
  saveAutodraftConfig(
    userId: string, 
    config: Partial<AutodraftConfig>
  ): Promise<void>;
  
  /** Update room status */
  updateRoomStatus(roomId: string, status: DraftStatus): Promise<void>;
}

// ============================================================================
// HOOK RESULT TYPES
// ============================================================================

/**
 * Standard async data pattern
 */
export interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Draft engine state
 */
export interface DraftEngineState {
  /** Room data */
  room: DraftRoom | null;
  /** Current status */
  status: DraftStatus;
  /** All participants */
  participants: Participant[];
  /** All completed picks */
  picks: DraftPick[];
  /** Available players */
  availablePlayers: DraftPlayer[];
  /** Current pick number */
  currentPickNumber: number;
  /** Current round */
  currentRound: number;
  /** Current picker */
  currentPicker: Participant | null;
  /** Whether it's the user's turn */
  isMyTurn: boolean;
  /** User's participant index */
  userParticipantIndex: number;
  /** Picks until user's next turn */
  picksUntilMyTurn: number;
  /** Loading state */
  isLoading: boolean;
  /** Error message */
  error: string | null;
}

/**
 * Draft engine actions
 */
export interface DraftEngineActions {
  /** Start the draft */
  startDraft: () => void;
  /** Pause the draft */
  pauseDraft: () => void;
  /** Resume the draft */
  resumeDraft: () => void;
  /** Make a pick */
  makePick: (player: DraftPlayer) => Promise<boolean>;
  /** Force an autopick */
  forcePick: () => Promise<boolean>;
  /** Refresh data */
  refresh: () => Promise<void>;
}


