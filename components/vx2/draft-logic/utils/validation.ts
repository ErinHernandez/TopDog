/**
 * VX2 Draft Logic - Pick Validation
 * 
 * Validation utilities for draft picks.
 * All new implementations - no code reuse.
 */

import { DRAFT_CONFIG } from '../constants';
import type { 
  DraftPlayer, 
  DraftStatus,
  ValidationResult, 
  ValidationErrorCode,
  PositionLimits,
} from '../types';

import { canDraftPlayer } from './autodraft';
import { getParticipantForPick } from './snakeDraft';

// ============================================================================
// VALIDATION ERROR MESSAGES
// ============================================================================

/**
 * Human-readable error messages for validation codes
 */
export const VALIDATION_ERROR_MESSAGES: Record<ValidationErrorCode, string> = {
  NOT_YOUR_TURN: 'It is not your turn to pick',
  PLAYER_UNAVAILABLE: 'This player has already been drafted',
  POSITION_LIMIT_REACHED: 'You have reached the limit for this position',
  TIMER_EXPIRED: 'The pick timer has expired',
  DRAFT_NOT_ACTIVE: 'The draft is not currently active',
  INVALID_PLAYER: 'Invalid player selection',
};

/**
 * Create a validation result
 */
function createResult(
  valid: boolean, 
  errorCode?: ValidationErrorCode
): ValidationResult {
  if (valid) {
    return { valid: true };
  }
  
  return {
    valid: false,
    errorCode,
    errorMessage: errorCode ? VALIDATION_ERROR_MESSAGES[errorCode] : undefined,
  };
}

// ============================================================================
// INDIVIDUAL VALIDATORS
// ============================================================================

/**
 * Validate that the draft is in an active state.
 * 
 * @param status - Current draft status
 * @returns Validation result
 */
export function validateDraftActive(status: DraftStatus): ValidationResult {
  if (status !== 'active') {
    return createResult(false, 'DRAFT_NOT_ACTIVE');
  }
  return createResult(true);
}

/**
 * Validate that it's the user's turn to pick.
 * 
 * @param pickNumber - Current pick number
 * @param userParticipantIndex - User's participant index
 * @param teamCount - Number of teams
 * @returns Validation result
 */
export function validateTurn(
  pickNumber: number,
  userParticipantIndex: number,
  teamCount: number = DRAFT_CONFIG.teamCount
): ValidationResult {
  const currentParticipant = getParticipantForPick(pickNumber, teamCount);
  
  if (currentParticipant !== userParticipantIndex) {
    return createResult(false, 'NOT_YOUR_TURN');
  }
  
  return createResult(true);
}

/**
 * Validate that a player is still available (not already drafted).
 * 
 * @param player - Player to validate
 * @param pickedPlayerIds - Set of already-picked player IDs
 * @returns Validation result
 */
export function validatePlayerAvailable(
  player: DraftPlayer,
  pickedPlayerIds: Set<string>
): ValidationResult {
  if (pickedPlayerIds.has(player.id)) {
    return createResult(false, 'PLAYER_UNAVAILABLE');
  }
  
  return createResult(true);
}

/**
 * Validate that picking this player won't exceed position limits.
 * 
 * @param player - Player to validate
 * @param currentRoster - User's current roster
 * @param limits - Position limits
 * @returns Validation result
 */
export function validatePositionLimit(
  player: DraftPlayer,
  currentRoster: DraftPlayer[],
  limits: PositionLimits
): ValidationResult {
  if (!canDraftPlayer(player, currentRoster, limits)) {
    return createResult(false, 'POSITION_LIMIT_REACHED');
  }
  
  return createResult(true);
}

/**
 * Validate that the timer hasn't expired.
 * Note: Grace period picks are still allowed.
 * 
 * @param secondsRemaining - Seconds remaining on timer
 * @param isInGracePeriod - Whether in grace period
 * @returns Validation result
 */
export function validateTimer(
  secondsRemaining: number,
  isInGracePeriod: boolean
): ValidationResult {
  // Allow picks during grace period
  if (isInGracePeriod) {
    return createResult(true);
  }
  
  // Timer expired (not in grace period)
  if (secondsRemaining <= 0) {
    return createResult(false, 'TIMER_EXPIRED');
  }
  
  return createResult(true);
}

/**
 * Validate that the player object is valid.
 * 
 * @param player - Player to validate
 * @returns Validation result
 */
export function validatePlayer(player: DraftPlayer | null | undefined): ValidationResult {
  if (!player || !player.id || !player.name || !player.position) {
    return createResult(false, 'INVALID_PLAYER');
  }
  
  return createResult(true);
}

// ============================================================================
// COMBINED VALIDATORS
// ============================================================================

/**
 * Validate a manual pick with all checks.
 * 
 * @param player - Player to pick
 * @param pickNumber - Current pick number
 * @param userParticipantIndex - User's participant index
 * @param teamCount - Number of teams
 * @param pickedPlayerIds - Set of picked player IDs
 * @param currentRoster - User's current roster
 * @param positionLimits - Position limits
 * @param draftStatus - Current draft status
 * @returns Validation result (first failure or success)
 */
export function validateManualPick(
  player: DraftPlayer,
  pickNumber: number,
  userParticipantIndex: number,
  teamCount: number,
  pickedPlayerIds: Set<string>,
  currentRoster: DraftPlayer[],
  positionLimits: PositionLimits,
  draftStatus: DraftStatus
): ValidationResult {
  // Check player is valid
  const playerResult = validatePlayer(player);
  if (!playerResult.valid) return playerResult;
  
  // Check draft is active
  const activeResult = validateDraftActive(draftStatus);
  if (!activeResult.valid) return activeResult;
  
  // Check it's user's turn
  const turnResult = validateTurn(pickNumber, userParticipantIndex, teamCount);
  if (!turnResult.valid) return turnResult;
  
  // Check player is available
  const availableResult = validatePlayerAvailable(player, pickedPlayerIds);
  if (!availableResult.valid) return availableResult;
  
  // Check position limit
  const limitResult = validatePositionLimit(player, currentRoster, positionLimits);
  if (!limitResult.valid) return limitResult;
  
  return createResult(true);
}

/**
 * Validate an autopick (skips turn validation).
 * 
 * @param player - Player to pick
 * @param pickedPlayerIds - Set of picked player IDs
 * @param currentRoster - Current roster
 * @param positionLimits - Position limits
 * @param draftStatus - Current draft status
 * @returns Validation result
 */
export function validateAutopick(
  player: DraftPlayer,
  pickedPlayerIds: Set<string>,
  currentRoster: DraftPlayer[],
  positionLimits: PositionLimits,
  draftStatus: DraftStatus
): ValidationResult {
  // Check player is valid
  const playerResult = validatePlayer(player);
  if (!playerResult.valid) return playerResult;
  
  // Check draft is active
  const activeResult = validateDraftActive(draftStatus);
  if (!activeResult.valid) return activeResult;
  
  // Check player is available
  const availableResult = validatePlayerAvailable(player, pickedPlayerIds);
  if (!availableResult.valid) return availableResult;
  
  // Check position limit
  const limitResult = validatePositionLimit(player, currentRoster, positionLimits);
  if (!limitResult.valid) return limitResult;
  
  return createResult(true);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a validation result represents success.
 */
export function isValidationSuccess(result: ValidationResult): boolean {
  return result.valid === true;
}

/**
 * Get error message from validation result, or empty string if valid.
 */
export function getValidationError(result: ValidationResult): string {
  return result.errorMessage ?? '';
}

/**
 * Combine multiple validation results.
 * Returns the first failure, or success if all pass.
 * 
 * @param results - Array of validation results
 * @returns Combined result
 */
export function combineValidations(...results: ValidationResult[]): ValidationResult {
  for (const result of results) {
    if (!result.valid) {
      return result;
    }
  }
  return createResult(true);
}



