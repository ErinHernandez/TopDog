/**
 * VX2 Draft Logic - Autodraft AI
 * 
 * Player selection algorithm for autopick.
 * Priority: Queue → Custom Rankings → ADP
 * 
 * All new implementations - no code reuse.
 */

import type { 
  DraftPlayer, 
  PositionLimits, 
  PositionCounts,
  Position,
  AutodraftResult,
  AutodraftSource,
} from '../types';
import { DEFAULT_POSITION_LIMITS, DRAFT_CONFIG } from '../constants';

// ============================================================================
// POSITION COUNTING
// ============================================================================

/**
 * Create an empty position counts object.
 */
export function createEmptyPositionCounts(): PositionCounts {
  return { QB: 0, RB: 0, WR: 0, TE: 0 };
}

/**
 * Calculate position counts from a roster of players.
 * 
 * @param roster - Array of players
 * @returns Position counts
 */
export function calculatePositionCounts(roster: DraftPlayer[]): PositionCounts {
  const counts = createEmptyPositionCounts();
  
  for (const player of roster) {
    if (player.position in counts) {
      counts[player.position]++;
    }
  }
  
  return counts;
}

/**
 * Get total roster size from position counts.
 */
export function getTotalRosterSize(counts: PositionCounts): number {
  return counts.QB + counts.RB + counts.WR + counts.TE;
}

// ============================================================================
// POSITION LIMIT VALIDATION
// ============================================================================

/**
 * Check if a player can be drafted within position limits.
 * 
 * @param player - Player to check
 * @param currentRoster - Current roster (players already drafted by this participant)
 * @param limits - Position limits
 * @returns true if player can be drafted
 * 
 * @example
 * const roster = [{ position: 'QB' }, { position: 'QB' }];
 * canDraftPlayer({ position: 'QB' }, roster, { QB: 2, ... })  // false (limit reached)
 * canDraftPlayer({ position: 'RB' }, roster, { RB: 10, ... }) // true
 */
export function canDraftPlayer(
  player: DraftPlayer,
  currentRoster: DraftPlayer[],
  limits: PositionLimits = DEFAULT_POSITION_LIMITS
): boolean {
  const positionCounts = calculatePositionCounts(currentRoster);
  const currentCount = positionCounts[player.position] ?? 0;
  const limit = limits[player.position] ?? Infinity;
  
  return currentCount < limit;
}

/**
 * Filter players to only those within position limits.
 * 
 * @param players - Available players
 * @param currentRoster - Current roster
 * @param limits - Position limits
 * @returns Filtered array of draftable players
 */
export function filterDraftablePlayers(
  players: DraftPlayer[],
  currentRoster: DraftPlayer[],
  limits: PositionLimits = DEFAULT_POSITION_LIMITS
): DraftPlayer[] {
  return players.filter(player => canDraftPlayer(player, currentRoster, limits));
}

/**
 * Get remaining slots for each position.
 * 
 * @param currentRoster - Current roster
 * @param limits - Position limits
 * @returns Remaining slots per position
 */
export function getRemainingSlots(
  currentRoster: DraftPlayer[],
  limits: PositionLimits = DEFAULT_POSITION_LIMITS
): PositionCounts {
  const counts = calculatePositionCounts(currentRoster);
  
  return {
    QB: Math.max(0, limits.QB - counts.QB),
    RB: Math.max(0, limits.RB - counts.RB),
    WR: Math.max(0, limits.WR - counts.WR),
    TE: Math.max(0, limits.TE - counts.TE),
  };
}

// ============================================================================
// AUTODRAFT SELECTION
// ============================================================================

/**
 * Select the best player for autodraft.
 * 
 * Priority order:
 * 1. First available player from queue (respecting position limits)
 * 2. Highest-ranked player from custom rankings (respecting position limits)
 * 3. Best available by ADP (respecting position limits)
 * 
 * @param availablePlayers - Players still available in draft
 * @param currentRoster - Current roster for this participant
 * @param queue - User's queue (player IDs in priority order)
 * @param customRankings - User's custom rankings (player IDs in rank order)
 * @param positionLimits - Position limits
 * @returns Selected player and source, or null if none available
 * 
 * @example
 * const result = selectAutodraftPlayer(available, roster, ['player1'], [], limits);
 * // { player: {...}, source: 'queue' }
 */
export function selectAutodraftPlayer(
  availablePlayers: DraftPlayer[],
  currentRoster: DraftPlayer[],
  queue: string[] = [],
  customRankings: string[] = [],
  positionLimits: PositionLimits = DEFAULT_POSITION_LIMITS
): AutodraftResult | null {
  // Filter to only draftable players (within position limits)
  const draftablePlayers = filterDraftablePlayers(
    availablePlayers,
    currentRoster,
    positionLimits
  );
  
  if (draftablePlayers.length === 0) {
    return null;
  }
  
  // Create lookup map for O(1) availability checks
  const availableById = new Map(draftablePlayers.map(p => [p.id, p]));
  
  // Priority 1: Check queue
  for (const playerId of queue) {
    const player = availableById.get(playerId);
    if (player) {
      return { player, source: 'queue' };
    }
  }
  
  // Priority 2: Check custom rankings
  for (const playerId of customRankings) {
    const player = availableById.get(playerId);
    if (player) {
      return { player, source: 'custom_ranking' };
    }
  }
  
  // Priority 3: Best by ADP
  const sortedByADP = [...draftablePlayers].sort((a, b) => {
    // Handle missing ADP values
    const adpA = a.adp ?? 999;
    const adpB = b.adp ?? 999;
    return adpA - adpB;
  });
  
  return { player: sortedByADP[0], source: 'adp' };
}

/**
 * Get the best available player by ADP only.
 * Used when queue and rankings are empty.
 * 
 * @param availablePlayers - Available players
 * @param currentRoster - Current roster
 * @param positionLimits - Position limits
 * @returns Best available player, or null
 */
export function getBestAvailableByADP(
  availablePlayers: DraftPlayer[],
  currentRoster: DraftPlayer[],
  positionLimits: PositionLimits = DEFAULT_POSITION_LIMITS
): DraftPlayer | null {
  const draftable = filterDraftablePlayers(availablePlayers, currentRoster, positionLimits);
  
  if (draftable.length === 0) {
    return null;
  }
  
  return draftable.reduce((best, player) => {
    const bestADP = best.adp ?? 999;
    const playerADP = player.adp ?? 999;
    return playerADP < bestADP ? player : best;
  });
}

/**
 * Get best available player at a specific position.
 * 
 * @param position - Position to filter by
 * @param availablePlayers - Available players
 * @param currentRoster - Current roster
 * @param positionLimits - Position limits
 * @returns Best player at position, or null
 */
export function getBestAvailableAtPosition(
  position: Position,
  availablePlayers: DraftPlayer[],
  currentRoster: DraftPlayer[],
  positionLimits: PositionLimits = DEFAULT_POSITION_LIMITS
): DraftPlayer | null {
  const atPosition = availablePlayers.filter(p => p.position === position);
  return getBestAvailableByADP(atPosition, currentRoster, positionLimits);
}

// ============================================================================
// ROSTER ANALYSIS
// ============================================================================

/**
 * Determine the most needed position based on current roster.
 * Returns the position with the most remaining slots.
 * 
 * @param currentRoster - Current roster
 * @param limits - Position limits
 * @returns Most needed position
 */
export function getMostNeededPosition(
  currentRoster: DraftPlayer[],
  limits: PositionLimits = DEFAULT_POSITION_LIMITS
): Position {
  const remaining = getRemainingSlots(currentRoster, limits);
  
  let mostNeeded: Position = 'WR';
  let maxRemaining = 0;
  
  for (const pos of ['QB', 'RB', 'WR', 'TE'] as Position[]) {
    if (remaining[pos] > maxRemaining) {
      maxRemaining = remaining[pos];
      mostNeeded = pos;
    }
  }
  
  return mostNeeded;
}

/**
 * Check if roster construction is balanced.
 * A roster is balanced if no position has hit its limit while others have many slots.
 * 
 * @param currentRoster - Current roster
 * @param limits - Position limits
 * @returns true if balanced
 */
export function isRosterBalanced(
  currentRoster: DraftPlayer[],
  limits: PositionLimits = DEFAULT_POSITION_LIMITS
): boolean {
  const remaining = getRemainingSlots(currentRoster, limits);
  const values = Object.values(remaining);
  
  // Check if any position is maxed while others have many slots
  const hasMaxed = values.some(v => v === 0);
  const hasMany = values.some(v => v >= 5);
  
  return !(hasMaxed && hasMany);
}

/**
 * Get tracker color based on roster needs.
 * Returns the color of the most needed position.
 * 
 * @param currentRoster - Current roster
 * @param limits - Position limits
 * @returns Hex color string
 */
export function getTrackerColor(
  currentRoster: DraftPlayer[],
  limits: PositionLimits = DEFAULT_POSITION_LIMITS
): string {
  const remaining = getRemainingSlots(currentRoster, limits);
  const counts = calculatePositionCounts(currentRoster);
  
  // If all positions have same count, return neutral
  const uniqueCounts = new Set(Object.values(counts));
  if (uniqueCounts.size === 1) {
    return '#6B7280'; // Gray
  }
  
  // Return color of most needed position
  const colors: Record<Position, string> = {
    QB: '#F472B6',
    RB: '#0FBA80',
    WR: '#FBBF25',
    TE: '#7C3AED',
  };
  
  const mostNeeded = getMostNeededPosition(currentRoster, limits);
  return colors[mostNeeded];
}


