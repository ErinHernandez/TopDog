/**
 * VX2 Draft Room Utilities
 * 
 * Pure utility functions for draft calculations and formatting.
 * No dependencies on VX.
 */

import type { Position, PositionCounts, TimerUrgency } from '../types';
import { TIMER_CONFIG, DRAFT_DEFAULTS } from '../constants';

// ============================================================================
// SNAKE DRAFT CALCULATIONS
// ============================================================================

/**
 * Get the participant index for a given pick number in a snake draft.
 * 
 * Snake draft pattern:
 * - Odd rounds: 0, 1, 2, ... 11
 * - Even rounds: 11, 10, 9, ... 0
 * 
 * @param pickNumber - Overall pick number (1-indexed)
 * @param teamCount - Number of teams in draft
 * @returns Participant index (0-indexed)
 * 
 * @example
 * getParticipantForPick(1, 12)  // 0 (first pick, first team)
 * getParticipantForPick(12, 12) // 11 (last pick of round 1)
 * getParticipantForPick(13, 12) // 11 (first pick of round 2, snake back)
 * getParticipantForPick(24, 12) // 0 (last pick of round 2)
 */
export function getParticipantForPick(
  pickNumber: number, 
  teamCount: number = DRAFT_DEFAULTS.teamCount
): number {
  // Guard against invalid inputs to prevent division by zero
  if (pickNumber < 1 || teamCount < 1) {
    return 0;
  }
  
  const round = Math.ceil(pickNumber / teamCount);
  const positionInRound = (pickNumber - 1) % teamCount;
  const isOddRound = round % 2 === 1;
  
  return isOddRound 
    ? positionInRound 
    : (teamCount - 1 - positionInRound);
}

/**
 * Get the round number for a given pick.
 * 
 * @param pickNumber - Overall pick number (1-indexed)
 * @param teamCount - Number of teams in draft
 * @returns Round number (1-indexed)
 */
export function getRoundForPick(
  pickNumber: number, 
  teamCount: number = DRAFT_DEFAULTS.teamCount
): number {
  // Guard against invalid inputs to prevent division by zero
  if (pickNumber < 1 || teamCount < 1) {
    return 1;
  }
  return Math.ceil(pickNumber / teamCount);
}

/**
 * Get the pick position within a round.
 * 
 * @param pickNumber - Overall pick number (1-indexed)
 * @param teamCount - Number of teams in draft
 * @returns Pick position within round (1-indexed)
 */
export function getPickInRound(
  pickNumber: number,
  teamCount: number = DRAFT_DEFAULTS.teamCount
): number {
  // Guard against invalid inputs to prevent division by zero
  if (pickNumber < 1 || teamCount < 1) {
    return 1;
  }
  return ((pickNumber - 1) % teamCount) + 1;
}

/**
 * Get all pick numbers for a specific participant.
 * 
 * @param participantIndex - Participant index (0-indexed)
 * @param teamCount - Number of teams
 * @param rosterSize - Number of rounds
 * @returns Array of pick numbers for this participant
 */
export function getPickNumbersForParticipant(
  participantIndex: number, 
  teamCount: number = DRAFT_DEFAULTS.teamCount, 
  rosterSize: number = DRAFT_DEFAULTS.rosterSize
): number[] {
  const pickNumbers: number[] = [];
  const totalPicks = teamCount * rosterSize;
  
  for (let pick = 1; pick <= totalPicks; pick++) {
    if (getParticipantForPick(pick, teamCount) === participantIndex) {
      pickNumbers.push(pick);
    }
  }
  
  return pickNumbers;
}

/**
 * Check if a pick number belongs to a specific participant.
 * 
 * @param pickNumber - Pick number to check
 * @param participantIndex - Participant index
 * @param teamCount - Number of teams
 */
export function isPickForParticipant(
  pickNumber: number,
  participantIndex: number,
  teamCount: number = DRAFT_DEFAULTS.teamCount
): boolean {
  return getParticipantForPick(pickNumber, teamCount) === participantIndex;
}

// ============================================================================
// FORMATTERS
// ============================================================================

/**
 * Format ADP for display.
 * 
 * @param adp - Average draft position
 * @returns Formatted string (e.g., "1.5", "12.0", or "-")
 */
export function formatADP(adp: number | null | undefined): string {
  if (adp === null || adp === undefined || adp <= 0) return '-';
  return adp.toFixed(1);
}

/**
 * Format timer seconds as M:SS.
 * 
 * @param seconds - Seconds remaining
 * @returns Formatted time string (e.g., "0:30", "1:05")
 */
export function formatTimer(seconds: number): string {
  const mins = Math.floor(Math.max(0, seconds) / 60);
  const secs = Math.max(0, seconds) % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format pick number as round.pick (e.g., "1.01", "2.12").
 * 
 * @param pickNumber - Overall pick number
 * @param teamCount - Number of teams
 * @returns Formatted pick string
 */
export function formatPickNumber(
  pickNumber: number, 
  teamCount: number = DRAFT_DEFAULTS.teamCount
): string {
  const round = getRoundForPick(pickNumber, teamCount);
  const pickInRound = getPickInRound(pickNumber, teamCount);
  return `${round}.${pickInRound.toString().padStart(2, '0')}`;
}

/**
 * Format projected points for display.
 * 
 * @param points - Projected points
 * @returns Formatted string (e.g., "285", "-")
 */
export function formatProjection(points: number | null | undefined): string {
  if (points === null || points === undefined || points <= 0) return '-';
  return Math.round(points).toString();
}

/**
 * Truncate player name if too long.
 * 
 * @param name - Player name
 * @param maxLength - Maximum length
 * @returns Truncated name with ellipsis if needed
 */
export function truncateName(name: string, maxLength: number = 20): string {
  if (name.length <= maxLength) return name;
  return name.slice(0, maxLength - 1) + '...';
}

// ============================================================================
// TIMER UTILITIES
// ============================================================================

/**
 * Get timer urgency level based on seconds remaining.
 * 
 * @param seconds - Seconds remaining
 * @returns Urgency level for styling
 */
export function getTimerUrgency(seconds: number): TimerUrgency {
  if (seconds <= TIMER_CONFIG.criticalThreshold) return 'critical';
  if (seconds <= TIMER_CONFIG.warningThreshold) return 'warning';
  return 'normal';
}

/**
 * Get timer color based on seconds remaining.
 * 
 * @param seconds - Seconds remaining
 * @returns CSS color string
 */
export function getTimerColor(seconds: number): string {
  const urgency = getTimerUrgency(seconds);
  return TIMER_CONFIG.colors[urgency];
}

// ============================================================================
// POSITION UTILITIES
// ============================================================================

/**
 * Create empty position counts object.
 */
export function createEmptyPositionCounts(): PositionCounts {
  return { QB: 0, RB: 0, WR: 0, TE: 0 };
}

/**
 * Calculate position counts from an array of positions.
 * 
 * @param positions - Array of position strings
 * @returns Position counts object
 */
export function calculatePositionCounts(positions: Position[]): PositionCounts {
  const counts = createEmptyPositionCounts();
  
  for (const pos of positions) {
    if (pos in counts) {
      counts[pos]++;
    }
  }
  
  return counts;
}

/**
 * Get total count across all positions.
 * 
 * @param counts - Position counts object
 * @returns Total count
 */
export function getTotalCount(counts: PositionCounts): number {
  return counts.QB + counts.RB + counts.WR + counts.TE;
}

// ============================================================================
// PLAYER ID UTILITIES
// ============================================================================

/**
 * Generate a player ID from name.
 * Used to match players across different data sources.
 * Handles suffixes like Jr., Sr., II, III, IV, etc.
 * 
 * @param name - Player full name
 * @returns Normalized ID (e.g., "chase_jamarr")
 */
export function generatePlayerId(name: string): string {
  // Trim first, then remove common suffixes
  const cleanedName = name
    .trim()
    .replace(/\s+(jr\.?|sr\.?|ii|iii|iv|v)$/i, '')
    .replace(/\s+/g, ' ')  // Normalize multiple spaces to single space
    .toLowerCase()
    .trim();
  
  const parts = cleanedName.split(' ');
  if (parts.length >= 2) {
    // Last name first, then first name
    return `${parts[parts.length - 1]}_${parts[0]}`.replace(/[^a-z_]/g, '');
  }
  return cleanedName.replace(/[^a-z]/g, '');
}

/**
 * Normalize a name for comparison.
 * 
 * @param name - Player name
 * @returns Normalized lowercase name
 */
export function normalizeName(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z\s]/g, '');
}

// ============================================================================
// SEARCH UTILITIES
// ============================================================================

/**
 * Check if a player matches a search query.
 * Searches name, team, and position.
 * 
 * @param player - Player to check
 * @param query - Search query
 * @returns Whether player matches
 */
export function playerMatchesSearch(
  player: { name: string; team: string; position: string },
  query: string
): boolean {
  if (!query.trim()) return true;
  
  const normalizedQuery = query.toLowerCase().trim();
  const name = (player.name?.toLowerCase() || '');
  const team = (player.team?.toLowerCase() || '');
  const position = (player.position?.toLowerCase() || '');
  
  return (
    name.includes(normalizedQuery) ||
    team.includes(normalizedQuery) ||
    position.includes(normalizedQuery)
  );
}
