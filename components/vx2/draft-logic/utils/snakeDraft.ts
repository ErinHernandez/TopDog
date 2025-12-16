/**
 * VX2 Draft Logic - Snake Draft Calculations
 * 
 * Pure utility functions for snake draft position calculations.
 * All new implementations - no code reuse.
 */

import { DRAFT_CONFIG } from '../constants';

// ============================================================================
// PARTICIPANT CALCULATIONS
// ============================================================================

/**
 * Get the participant index for a given pick number in a snake draft.
 * 
 * Snake draft pattern:
 * - Odd rounds (1, 3, 5...): picks go 0 → 11
 * - Even rounds (2, 4, 6...): picks go 11 → 0 (snake back)
 * 
 * @param pickNumber - Overall pick number (1-indexed)
 * @param teamCount - Number of teams in draft
 * @returns Participant index (0-indexed)
 * 
 * @example
 * getParticipantForPick(1, 12)   // 0  (Round 1, first pick)
 * getParticipantForPick(12, 12)  // 11 (Round 1, last pick)
 * getParticipantForPick(13, 12)  // 11 (Round 2, first pick - snake!)
 * getParticipantForPick(24, 12)  // 0  (Round 2, last pick)
 * getParticipantForPick(25, 12)  // 0  (Round 3, first pick)
 */
export function getParticipantForPick(
  pickNumber: number,
  teamCount: number = DRAFT_CONFIG.teamCount
): number {
  if (pickNumber < 1 || teamCount < 1) {
    return 0;
  }
  
  const round = getRoundForPick(pickNumber, teamCount);
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
 * 
 * @example
 * getRoundForPick(1, 12)   // 1
 * getRoundForPick(12, 12)  // 1
 * getRoundForPick(13, 12)  // 2
 * getRoundForPick(25, 12)  // 3
 */
export function getRoundForPick(
  pickNumber: number,
  teamCount: number = DRAFT_CONFIG.teamCount
): number {
  if (pickNumber < 1 || teamCount < 1) {
    return 1;
  }
  return Math.ceil(pickNumber / teamCount);
}

/**
 * Get the pick position within a round (1-indexed).
 * 
 * @param pickNumber - Overall pick number (1-indexed)
 * @param teamCount - Number of teams in draft
 * @returns Pick position within round (1-indexed)
 * 
 * @example
 * getPickInRound(1, 12)   // 1
 * getPickInRound(12, 12)  // 12
 * getPickInRound(13, 12)  // 1
 * getPickInRound(15, 12)  // 3
 */
export function getPickInRound(
  pickNumber: number,
  teamCount: number = DRAFT_CONFIG.teamCount
): number {
  if (pickNumber < 1 || teamCount < 1) {
    return 1;
  }
  return ((pickNumber - 1) % teamCount) + 1;
}

/**
 * Check if a round uses snake (reversed) order.
 * Even rounds (2, 4, 6...) use snake order.
 * 
 * @param round - Round number (1-indexed)
 * @returns true if snake round
 */
export function isSnakeRound(round: number): boolean {
  return round % 2 === 0;
}

/**
 * Get all pick numbers for a specific participant.
 * 
 * @param participantIndex - Participant index (0-indexed)
 * @param teamCount - Number of teams
 * @param totalRounds - Number of rounds
 * @returns Array of pick numbers for this participant
 * 
 * @example
 * // First participant (index 0) in 12-team, 18-round draft
 * getPickNumbersForParticipant(0, 12, 18)
 * // Returns: [1, 24, 25, 48, 49, 72, 73, 96, 97, 120, 121, 144, 145, 168, 169, 192, 193, 216]
 */
export function getPickNumbersForParticipant(
  participantIndex: number,
  teamCount: number = DRAFT_CONFIG.teamCount,
  totalRounds: number = DRAFT_CONFIG.rosterSize
): number[] {
  const pickNumbers: number[] = [];
  const totalPicks = teamCount * totalRounds;
  
  for (let pick = 1; pick <= totalPicks; pick++) {
    if (getParticipantForPick(pick, teamCount) === participantIndex) {
      pickNumbers.push(pick);
    }
  }
  
  return pickNumbers;
}

/**
 * Check if a pick belongs to a specific participant.
 * 
 * @param pickNumber - Pick number to check
 * @param participantIndex - Participant index
 * @param teamCount - Number of teams
 * @returns true if pick belongs to participant
 */
export function isPickForParticipant(
  pickNumber: number,
  participantIndex: number,
  teamCount: number = DRAFT_CONFIG.teamCount
): boolean {
  return getParticipantForPick(pickNumber, teamCount) === participantIndex;
}

// ============================================================================
// DISTANCE CALCULATIONS
// ============================================================================

/**
 * Calculate picks until a participant's next turn.
 * 
 * @param currentPick - Current pick number
 * @param participantIndex - Participant index
 * @param teamCount - Number of teams
 * @param totalRounds - Total rounds
 * @returns Number of picks until next turn, or -1 if no more picks
 * 
 * @example
 * // Current pick is 5, participant 0's next pick is 24
 * getPicksUntilTurn(5, 0, 12, 18)  // 19
 */
export function getPicksUntilTurn(
  currentPick: number,
  participantIndex: number,
  teamCount: number = DRAFT_CONFIG.teamCount,
  totalRounds: number = DRAFT_CONFIG.rosterSize
): number {
  // If it's already their turn
  if (getParticipantForPick(currentPick, teamCount) === participantIndex) {
    return 0;
  }
  
  const myPicks = getPickNumbersForParticipant(participantIndex, teamCount, totalRounds);
  const nextPick = myPicks.find(p => p > currentPick);
  
  if (!nextPick) {
    return -1; // No more picks remaining
  }
  
  return nextPick - currentPick;
}

/**
 * Get the next pick number for a participant after a given pick.
 * 
 * @param afterPick - Pick number to search after
 * @param participantIndex - Participant index
 * @param teamCount - Number of teams
 * @param totalRounds - Total rounds
 * @returns Next pick number, or null if no more picks
 */
export function getNextPickForParticipant(
  afterPick: number,
  participantIndex: number,
  teamCount: number = DRAFT_CONFIG.teamCount,
  totalRounds: number = DRAFT_CONFIG.rosterSize
): number | null {
  const myPicks = getPickNumbersForParticipant(participantIndex, teamCount, totalRounds);
  const nextPick = myPicks.find(p => p > afterPick);
  return nextPick ?? null;
}

// ============================================================================
// FORMATTERS
// ============================================================================

/**
 * Format pick number as "Round.Pick" (e.g., "1.01", "2.12").
 * 
 * @param pickNumber - Overall pick number (1-indexed)
 * @param teamCount - Number of teams
 * @returns Formatted string like "1.01", "2.12", "13.07"
 * 
 * @example
 * formatPickNumber(1, 12)    // "1.01"
 * formatPickNumber(13, 12)   // "2.01"
 * formatPickNumber(145, 12)  // "13.01"
 */
export function formatPickNumber(
  pickNumber: number,
  teamCount: number = DRAFT_CONFIG.teamCount
): string {
  const round = getRoundForPick(pickNumber, teamCount);
  const pickInRound = getPickInRound(pickNumber, teamCount);
  return `${round}.${pickInRound.toString().padStart(2, '0')}`;
}

/**
 * Parse a formatted pick string back to pick number.
 * 
 * @param formatted - Formatted string like "1.01"
 * @param teamCount - Number of teams
 * @returns Pick number, or null if invalid format
 * 
 * @example
 * parsePickNumber("1.01", 12)  // 1
 * parsePickNumber("2.01", 12)  // 13
 */
export function parsePickNumber(
  formatted: string,
  teamCount: number = DRAFT_CONFIG.teamCount
): number | null {
  const match = formatted.match(/^(\d+)\.(\d+)$/);
  if (!match) {
    return null;
  }
  
  const round = parseInt(match[1], 10);
  const pickInRound = parseInt(match[2], 10);
  
  if (round < 1 || pickInRound < 1 || pickInRound > teamCount) {
    return null;
  }
  
  return (round - 1) * teamCount + pickInRound;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate that a pick number is within valid range.
 * 
 * @param pickNumber - Pick number to validate
 * @param teamCount - Number of teams
 * @param totalRounds - Total rounds
 * @returns true if valid
 */
export function isValidPickNumber(
  pickNumber: number,
  teamCount: number = DRAFT_CONFIG.teamCount,
  totalRounds: number = DRAFT_CONFIG.rosterSize
): boolean {
  const totalPicks = teamCount * totalRounds;
  return pickNumber >= 1 && pickNumber <= totalPicks;
}

/**
 * Get total picks in draft.
 * 
 * @param teamCount - Number of teams
 * @param totalRounds - Total rounds
 * @returns Total number of picks
 */
export function getTotalPicks(
  teamCount: number = DRAFT_CONFIG.teamCount,
  totalRounds: number = DRAFT_CONFIG.rosterSize
): number {
  return teamCount * totalRounds;
}


