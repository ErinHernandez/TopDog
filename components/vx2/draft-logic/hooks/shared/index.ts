/**
 * Shared Draft Hooks
 *
 * Common hooks used across all 5 parallel draft room implementations.
 * These hooks provide cross-cutting concerns like state management,
 * callback stability, and real-time data synchronization.
 */

// State machine for managing draft lifecycle
export { useDraftStateMachine } from './useDraftStateMachine';
export type {
  UseDraftStateMachineOptions,
  UseDraftStateMachineResult,
  DraftStateType,
  StateTransition,
} from './useDraftStateMachine';

// Stable callback hook for avoiding stale closures
export { useStableCallback } from './useStableCallback';
export type { UseStableCallbackResult } from './useStableCallback';

// Firestore real-time subscription hook
export { useFirestoreSubscription } from './useFirestoreSubscription';
export type {
  UseFirestoreSubscriptionOptions,
  UseFirestoreSubscriptionResult,
} from './useFirestoreSubscription';
