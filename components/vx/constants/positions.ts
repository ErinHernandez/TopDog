/**
 * VX Position Constants
 * 
 * Position-related configuration including colors, roster structure, and sorting.
 */

import { POSITION_COLORS } from './colors';

// ============================================================================
// POSITION TYPES
// ============================================================================

export type FantasyPosition = 'QB' | 'RB' | 'WR' | 'TE';
export type RosterPosition = FantasyPosition | 'FLEX' | 'BN';
export type AllPositions = RosterPosition | 'ALL';

// ============================================================================
// POSITION ARRAYS
// ============================================================================

/** Fantasy-relevant positions for filtering */
export const POSITIONS: FantasyPosition[] = ['QB', 'RB', 'WR', 'TE'];

/** Positions eligible for FLEX spot */
export const FLEX_POSITIONS: FantasyPosition[] = ['RB', 'WR', 'TE'];

/** All position filter options including ALL and FLEX */
export const FILTER_POSITIONS: AllPositions[] = ['ALL', 'QB', 'RB', 'WR', 'TE', 'FLEX'];

// ============================================================================
// ROSTER STRUCTURE
// ============================================================================

/** Starting lineup positions (9 slots) */
export const STARTING_LINEUP: RosterPosition[] = [
  'QB',
  'RB', 'RB',
  'WR', 'WR', 'WR',
  'TE',
  'FLEX', 'FLEX',
];

/** Number of bench spots */
export const BENCH_SPOTS = 9;

/** Total roster size */
export const ROSTER_SIZE = STARTING_LINEUP.length + BENCH_SPOTS; // 18

/** Position requirements for a complete roster */
export const ROSTER_REQUIREMENTS = {
  QB: { min: 1, max: 2 },
  RB: { min: 2, max: 6 },
  WR: { min: 3, max: 8 },
  TE: { min: 1, max: 3 },
} as const;

// ============================================================================
// POSITION CONFIGURATION
// ============================================================================

export interface PositionConfig {
  name: string;
  color: string;
  shortName: string;
  flexEligible: boolean;
}

export const POSITION_CONFIG: Record<RosterPosition, PositionConfig> = {
  QB: {
    name: 'Quarterback',
    color: POSITION_COLORS.QB,
    shortName: 'QB',
    flexEligible: false,
  },
  RB: {
    name: 'Running Back',
    color: POSITION_COLORS.RB,
    shortName: 'RB',
    flexEligible: true,
  },
  WR: {
    name: 'Wide Receiver',
    color: POSITION_COLORS.WR,
    shortName: 'WR',
    flexEligible: true,
  },
  TE: {
    name: 'Tight End',
    color: POSITION_COLORS.TE,
    shortName: 'TE',
    flexEligible: true,
  },
  FLEX: {
    name: 'Flex',
    color: '#9CA3AF', // Gray (uses gradient visually)
    shortName: 'FLEX',
    flexEligible: false,
  },
  BN: {
    name: 'Bench',
    color: POSITION_COLORS.BN,
    shortName: 'BN',
    flexEligible: false,
  },
};

// ============================================================================
// SORT OPTIONS
// ============================================================================

export type SortDirection = 'asc' | 'desc';
export type SortField = 'adp' | 'name' | 'proj' | 'rank' | 'position' | 'team';

export interface SortOption {
  field: SortField;
  direction: SortDirection;
  label: string;
}

export const SORT_OPTIONS: SortOption[] = [
  { field: 'adp', direction: 'asc', label: 'ADP (Low to High)' },
  { field: 'adp', direction: 'desc', label: 'ADP (High to Low)' },
  { field: 'name', direction: 'asc', label: 'Name (A-Z)' },
  { field: 'name', direction: 'desc', label: 'Name (Z-A)' },
  { field: 'proj', direction: 'desc', label: 'Projection (High to Low)' },
  { field: 'proj', direction: 'asc', label: 'Projection (Low to High)' },
  { field: 'rank', direction: 'asc', label: 'Rank (Best First)' },
  { field: 'rank', direction: 'desc', label: 'Rank (Worst First)' },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a position is eligible for FLEX
 */
export function isFlexEligible(position: string): boolean {
  return FLEX_POSITIONS.includes(position as FantasyPosition);
}

/**
 * Get position config by position key
 */
export function getPositionConfig(position: string): PositionConfig {
  return POSITION_CONFIG[position as RosterPosition] || POSITION_CONFIG.BN;
}

/**
 * Filter players by position (handles FLEX and ALL)
 */
export function filterByPosition<T extends { position: string }>(
  players: T[],
  position: AllPositions | 'FLEX'
): T[] {
  if (position === 'ALL') return players;
  if (position === 'FLEX') {
    return players.filter(p => FLEX_POSITIONS.includes(p.position as FantasyPosition));
  }
  return players.filter(p => p.position === position);
}

