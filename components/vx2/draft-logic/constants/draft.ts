/**
 * VX2 Draft Logic - Constants
 * 
 * Draft configuration and constants.
 * All new code - no imports from existing modules.
 */

import type { PositionLimits, DraftSettings, Position } from '../types';

// ============================================================================
// DRAFT CONFIGURATION
// ============================================================================

/**
 * Default draft settings
 */
export const DRAFT_CONFIG = {
  /** Standard team count */
  teamCount: 12,
  /** Standard roster size for best ball */
  rosterSize: 18,
  /** Seconds per pick */
  pickTimeSeconds: 30,
  /** Grace period before autopick */
  gracePeriodSeconds: 5,
  /** Fast mode for testing */
  fastModeSeconds: 3,
} as const;

/**
 * Total picks in a standard draft
 */
export const TOTAL_PICKS = DRAFT_CONFIG.teamCount * DRAFT_CONFIG.rosterSize; // 216

/**
 * Create draft settings from config
 */
export function createDefaultSettings(): DraftSettings {
  return {
    teamCount: DRAFT_CONFIG.teamCount,
    rosterSize: DRAFT_CONFIG.rosterSize,
    pickTimeSeconds: DRAFT_CONFIG.pickTimeSeconds,
    gracePeriodSeconds: DRAFT_CONFIG.gracePeriodSeconds,
  };
}

// ============================================================================
// POSITION LIMITS
// ============================================================================

/**
 * Default position limits for best ball autodraft
 */
export const DEFAULT_POSITION_LIMITS: PositionLimits = {
  QB: 4,
  RB: 10,
  WR: 11,
  TE: 5,
} as const;

/**
 * Maximum position limits (UI slider max)
 */
export const MAX_POSITION_LIMITS: PositionLimits = {
  QB: 4,
  RB: 10,
  WR: 11,
  TE: 5,
} as const;

/**
 * Minimum position limits
 */
export const MIN_POSITION_LIMITS: PositionLimits = {
  QB: 0,
  RB: 0,
  WR: 0,
  TE: 0,
} as const;

// ============================================================================
// TIMER CONFIGURATION
// ============================================================================

/**
 * Timer thresholds and colors
 */
export const TIMER_CONFIG = {
  /** Seconds when warning state triggers */
  warningThreshold: 10,
  /** Seconds when critical state triggers */
  criticalThreshold: 5,
  /** Colors by urgency */
  colors: {
    normal: '#22C55E',    // Green
    warning: '#F59E0B',   // Amber
    critical: '#EF4444',  // Red
  },
} as const;

// ============================================================================
// POSITION COLORS
// ============================================================================

/**
 * Position colors for UI
 */
export const POSITION_COLORS: Record<Position, string> = {
  QB: '#F472B6',  // Pink
  RB: '#0FBA80',  // Green
  WR: '#FBBF25',  // Yellow/Gold
  TE: '#7C3AED',  // Purple
} as const;

/**
 * Get color for a position
 */
export function getPositionColor(position: Position): string {
  return POSITION_COLORS[position] ?? '#6B7280';
}

// ============================================================================
// ANIMATION DURATIONS
// ============================================================================

/**
 * Animation durations in milliseconds
 */
export const ANIMATION_DURATIONS = {
  /** Pick card transition */
  pickTransition: 200,
  /** Tab switch */
  tabSwitch: 150,
  /** Timer pulse when critical */
  timerPulse: 500,
  /** Grace period display */
  gracePeriod: 1000,
} as const;

// ============================================================================
// STORAGE KEYS
// ============================================================================

/**
 * LocalStorage keys
 */
export const STORAGE_KEYS = {
  /** Autodraft config */
  autodraftConfig: 'vx2_autodraft_config',
  /** Custom rankings */
  customRankings: 'vx2_custom_rankings',
  /** Queue */
  queue: 'vx2_draft_queue',
} as const;

