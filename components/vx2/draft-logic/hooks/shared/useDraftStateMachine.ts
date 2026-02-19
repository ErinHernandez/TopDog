/**
 * useDraftStateMachine - Draft lifecycle state machine hook
 *
 * Manages the draft lifecycle with a finite state machine pattern.
 * Ensures valid state transitions with validation, side effects handling,
 * and complete transition history tracking.
 *
 * States: idle → loading → connecting → active → paused → completing → completed → error
 *
 * @example
 * ```tsx
 * const { state, transition, canTransition, history } = useDraftStateMachine({
 *   initialState: 'idle',
 *   onStateChange: (from, to) => {
 *     analytics.track('draft_state_changed', { from, to });
 *   },
 * });
 *
 * // Check before transitioning
 * if (canTransition('loading')) {
 *   transition('loading');
 * }
 * ```
 */

import { useState, useCallback, useRef, useEffect } from 'react';

import { createScopedLogger } from '@/lib/clientLogger';

const logger = createScopedLogger('[DraftStateMachine]');

// ============================================================================
// TYPES
// ============================================================================

export type DraftStateType =
  | 'idle'
  | 'loading'
  | 'connecting'
  | 'active'
  | 'paused'
  | 'completing'
  | 'completed'
  | 'error';

export interface StateTransition {
  from: DraftStateType;
  to: DraftStateType;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface UseDraftStateMachineOptions {
  /** Initial state (default: 'idle') */
  initialState?: DraftStateType;
  /** Callback when state changes */
  onStateChange?: (from: DraftStateType, to: DraftStateType) => void;
  /** Callback when entering a state */
  onEnterState?: (state: DraftStateType) => void;
  /** Callback when exiting a state */
  onExitState?: (state: DraftStateType) => void;
  /** Enable debug logging */
  debug?: boolean;
}

export interface UseDraftStateMachineResult {
  /** Current state */
  state: DraftStateType;
  /** Transition to a new state */
  transition: (nextState: DraftStateType, metadata?: Record<string, unknown>) => boolean;
  /** Check if transition is valid */
  canTransition: (nextState: DraftStateType) => boolean;
  /** Get reason why transition is not allowed */
  getTransitionError: (nextState: DraftStateType) => string | null;
  /** Complete transition history */
  history: StateTransition[];
  /** Reset to initial state */
  reset: (initialState?: DraftStateType) => void;
  /** Get last transition */
  lastTransition: StateTransition | null;
}

// ============================================================================
// VALID TRANSITIONS
// ============================================================================

const VALID_TRANSITIONS: Record<DraftStateType, DraftStateType[]> = {
  idle: ['loading', 'error'],
  loading: ['connecting', 'error', 'idle'],
  connecting: ['active', 'error', 'idle'],
  active: ['paused', 'completing', 'error', 'idle'],
  paused: ['active', 'completing', 'error', 'idle'],
  completing: ['completed', 'error'],
  completed: ['idle'],
  error: ['idle', 'loading'],
};

// ============================================================================
// SIDE EFFECTS PER STATE
// ============================================================================

const STATE_SIDE_EFFECTS: Record<DraftStateType, () => void> = {
  idle: () => {
    logger.debug('Draft state: idle');
  },
  loading: () => {
    logger.debug('Draft state: loading - fetching room data');
  },
  connecting: () => {
    logger.debug('Draft state: connecting - establishing real-time subscription');
  },
  active: () => {
    logger.debug('Draft state: active - draft in progress');
  },
  paused: () => {
    logger.debug('Draft state: paused');
  },
  completing: () => {
    logger.debug('Draft state: completing - finalizing draft');
  },
  completed: () => {
    logger.debug('Draft state: completed');
  },
  error: () => {
    logger.error('Draft state: error');
  },
};

// ============================================================================
// HOOK
// ============================================================================

export function useDraftStateMachine({
  initialState = 'idle',
  onStateChange,
  onEnterState,
  onExitState,
  debug = false,
}: UseDraftStateMachineOptions = {}): UseDraftStateMachineResult {
  const [state, setState] = useState<DraftStateType>(initialState);
  const [history, setHistory] = useState<StateTransition[]>([]);

  // Store callbacks in refs to avoid stale closures
  const onStateChangeRef = useRef(onStateChange);
  const onEnterStateRef = useRef(onEnterState);
  const onExitStateRef = useRef(onExitState);

  // Update refs when callbacks change
  useEffect(() => {
    onStateChangeRef.current = onStateChange;
    onEnterStateRef.current = onEnterState;
    onExitStateRef.current = onExitState;
  }, [onStateChange, onEnterState, onExitState]);

  // Check if transition is valid
  const canTransition = useCallback((nextState: DraftStateType): boolean => {
    const validNextStates = VALID_TRANSITIONS[state];
    return validNextStates.includes(nextState);
  }, [state]);

  // Get transition error reason
  const getTransitionError = useCallback((nextState: DraftStateType): string | null => {
    if (state === nextState) {
      return 'Already in this state';
    }

    const validNextStates = VALID_TRANSITIONS[state];
    if (!validNextStates.includes(nextState)) {
      return `Cannot transition from "${state}" to "${nextState}". Valid transitions: ${validNextStates.join(', ')}`;
    }

    return null;
  }, [state]);

  // Perform state transition
  const transition = useCallback(
    (nextState: DraftStateType, metadata?: Record<string, unknown>): boolean => {
      if (!canTransition(nextState)) {
        const error = getTransitionError(nextState);
        logger.warn(`Invalid transition: ${error}`);
        return false;
      }

      const transitionRecord: StateTransition = {
        from: state,
        to: nextState,
        timestamp: Date.now(),
        metadata,
      };

      if (debug) {
        logger.debug('State transition', {
          from: state,
          to: nextState,
          metadata,
        });
      }

      // Call exit hook for current state
      onExitStateRef.current?.(state);

      // Update state
      setState(nextState);

      // Add to history
      setHistory(prev => [...prev, transitionRecord]);

      // Call side effect for new state
      STATE_SIDE_EFFECTS[nextState]();

      // Call enter hook for new state
      onEnterStateRef.current?.(nextState);

      // Call state change callback
      onStateChangeRef.current?.(state, nextState);

      return true;
    },
    [state, canTransition, getTransitionError, debug]
  );

  // Reset to initial state
  const reset = useCallback((newInitialState: DraftStateType = initialState) => {
    if (debug) {
      logger.debug('Resetting state machine', { from: state, to: newInitialState });
    }

    onExitStateRef.current?.(state);
    setState(newInitialState);
    setHistory([]);
    STATE_SIDE_EFFECTS[newInitialState]();
    onEnterStateRef.current?.(newInitialState);
  }, [state, initialState, debug]);

  // Get last transition
  const lastTransition = history.length > 0 ? history[history.length - 1]! : null;

  return {
    state,
    transition,
    canTransition,
    getTransitionError,
    history,
    reset,
    lastTransition,
  };
}

export default useDraftStateMachine;
