/**
 * VX2 Draft Logic Module
 * 
 * Enterprise-grade draft pick logic system.
 * All new code - follows VX2 TypeScript conventions.
 * 
 * @example
 * ```tsx
 * import { useDraftEngine, createMockAdapter } from '@/components/vx2/draft-logic';
 * 
 * function DraftRoom({ roomId }) {
 *   const adapter = useMemo(() => createMockAdapter(), []);
 *   const engine = useDraftEngine({ roomId, adapter });
 *   
 *   return (
 *     <div>
 *       <p>Pick {engine.currentPickNumber}</p>
 *       <p>Time: {engine.timer.formattedTime}</p>
 *     </div>
 *   );
 * }
 * ```
 */

// ============================================================================
// TYPES
// ============================================================================

export type {
  // Position types
  Position,
  PositionCounts,
  PositionLimits,
  
  // Player types
  DraftPlayer,
  QueuedPlayer,
  
  // Participant types
  Participant,
  
  // Pick types
  PickSource,
  DraftPick,
  
  // Draft state types
  DraftStatus,
  DraftSettings,
  DraftRoom,
  
  // Timer types
  TimerState,
  TimerUrgency,
  TimerStatus,
  
  // Autodraft types
  AutodraftSource,
  AutodraftResult,
  AutodraftConfig,
  
  // Validation types
  ValidationErrorCode,
  ValidationResult,
  
  // Adapter types
  AdapterMode,
  Unsubscribe,
  DraftAdapter,
  
  // Hook result types
  AsyncState,
  DraftEngineState,
  DraftEngineActions,
} from './types';

export { POSITIONS } from './types';

// ============================================================================
// CONSTANTS
// ============================================================================

export {
  DRAFT_CONFIG,
  TOTAL_PICKS,
  createDefaultSettings,
  DEFAULT_POSITION_LIMITS,
  MAX_POSITION_LIMITS,
  MIN_POSITION_LIMITS,
  TIMER_CONFIG,
  POSITION_COLORS,
  getPositionColor,
  ANIMATION_DURATIONS,
  STORAGE_KEYS,
} from './constants';

// ============================================================================
// UTILITIES
// ============================================================================

// Snake draft
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
} from './utils';

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
} from './utils';

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
} from './utils';

// Timer
export {
  formatTimer,
  formatTimerSeconds,
  getTimerUrgency,
  getTimerColor,
  shouldTimerPulse,
  getTimerProgress,
  getElapsedTime,
} from './utils';

// ============================================================================
// HOOKS
// ============================================================================

export {
  useDraftTimer,
  useDraftQueue,
  useAutodraft,
  usePickExecutor,
  useDraftEngine,
} from './hooks';

export type {
  UseDraftTimerOptions,
  UseDraftTimerResult,
  UseDraftQueueOptions,
  UseDraftQueueResult,
  UseAutodraftOptions,
  UseAutodraftResult,
  UsePickExecutorOptions,
  UsePickExecutorResult,
  UseDraftEngineOptions,
  UseDraftEngineResult,
} from './hooks';

// ============================================================================
// ADAPTERS
// ============================================================================

export {
  MockAdapter,
  createMockAdapter,
  createAdapter,
} from './adapters';


