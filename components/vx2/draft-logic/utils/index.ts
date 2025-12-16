/**
 * VX2 Draft Logic - Utils Barrel Export
 */

// Snake draft calculations
export {
  getParticipantForPick,
  getRoundForPick,
  getPickInRound,
  isSnakeRound,
  getPickNumbersForParticipant,
  isPickForParticipant,
  getPicksUntilTurn,
  getNextPickForParticipant,
  formatPickNumber,
  parsePickNumber,
  isValidPickNumber,
  getTotalPicks,
} from './snakeDraft';

// Autodraft AI
export {
  createEmptyPositionCounts,
  calculatePositionCounts,
  getTotalRosterSize,
  canDraftPlayer,
  filterDraftablePlayers,
  getRemainingSlots,
  selectAutodraftPlayer,
  getBestAvailableByADP,
  getBestAvailableAtPosition,
  getMostNeededPosition,
  isRosterBalanced,
  getTrackerColor,
} from './autodraft';

// Validation
export {
  VALIDATION_ERROR_MESSAGES,
  validateDraftActive,
  validateTurn,
  validatePlayerAvailable,
  validatePositionLimit,
  validateTimer,
  validatePlayer,
  validateManualPick,
  validateAutopick,
  isValidationSuccess,
  getValidationError,
  combineValidations,
} from './validation';

// Timer utilities
export {
  formatTimer,
  formatTimerSeconds,
  getTimerUrgency,
  getTimerColor,
  shouldTimerPulse,
  getTimerProgress,
  getElapsedTime,
} from './timer';


