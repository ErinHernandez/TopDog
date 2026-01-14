/**
 * useDraftTimer
 * 
 * Hook for managing draft timer countdown and grace period.
 * Handles timer logic, pause/resume, and expiration callbacks.
 * 
 * Part of Phase 2: Extract Hooks
 */

import { useEffect, useRef, useCallback } from 'react';
import { useDraftState, useDraftDispatch } from '../context/DraftRoomContext';
import { logger } from '@/lib/structuredLogger';

export interface UseDraftTimerOptions {
  onExpire?: () => void;
  gracePeriodSeconds?: number;
}

export interface UseDraftTimerResult {
  timer: number;
  isInGracePeriod: boolean;
  reset: (seconds?: number) => void;
  pause: () => void;
  resume: () => void;
}

/**
 * Hook to manage draft timer countdown
 */
export function useDraftTimer({
  onExpire,
  gracePeriodSeconds = 1,
}: UseDraftTimerOptions = {}): UseDraftTimerResult {
  const state = useDraftState();
  const dispatchAction = useDraftDispatch();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const graceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { timer, isInGracePeriod } = state;
  const isActive = state.room?.status === 'active';
  const isPaused = state.room?.status === 'paused';

  // Reset timer
  const reset = useCallback(
    (seconds?: number) => {
      const timerSeconds =
        seconds ?? state.room?.settings?.timerSeconds ?? 30;
      dispatchAction({ type: 'SET_TIMER', payload: timerSeconds });
      dispatchAction({ type: 'SET_IS_IN_GRACE_PERIOD', payload: false });

      if (graceTimeoutRef.current) {
        clearTimeout(graceTimeoutRef.current);
        graceTimeoutRef.current = null;
      }
    },
    [state.room?.settings?.timerSeconds, dispatchAction]
  );

  // Pause timer
  const pause = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Resume timer
  const resume = useCallback(() => {
    if (isActive && !isPaused && timer > 0) {
      timerRef.current = setTimeout(() => {
        dispatchAction({ type: 'TICK_TIMER' });
      }, 1000);
    }
  }, [isActive, isPaused, timer, dispatchAction]);

  // Main timer logic
  useEffect(() => {
    if (!isActive || isPaused) {
      pause();
      return;
    }

    if (timer > 0) {
      timerRef.current = setTimeout(() => {
        dispatchAction({ type: 'TICK_TIMER' });
      }, 1000);
    } else if (timer === 0 && !isInGracePeriod) {
      // Timer expired - enter grace period
      logger.debug('Timer expired, entering grace period', {
        roomId: state.room?.id,
        component: 'useDraftTimer',
      });
      dispatchAction({ type: 'SET_IS_IN_GRACE_PERIOD', payload: true });

      // Set grace period timeout
      graceTimeoutRef.current = setTimeout(() => {
        logger.debug('Grace period expired, calling onExpire', {
          roomId: state.room?.id,
          component: 'useDraftTimer',
        });
        onExpire?.();
        dispatchAction({ type: 'SET_IS_IN_GRACE_PERIOD', payload: false });
      }, gracePeriodSeconds * 1000);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (graceTimeoutRef.current) {
        clearTimeout(graceTimeoutRef.current);
        graceTimeoutRef.current = null;
      }
    };
  }, [
    timer,
    isActive,
    isPaused,
    isInGracePeriod,
    onExpire,
    gracePeriodSeconds,
    pause,
    dispatchAction,
    state.room?.id,
  ]);

  // Reset timer when pick changes (tracked via picks length)
  useEffect(() => {
    if (isActive && !isPaused && state.picks.length > 0) {
      reset();
    }
  }, [state.picks.length, isActive, isPaused, reset, state.room?.settings?.timerSeconds]);

  return {
    timer,
    isInGracePeriod,
    reset,
    pause,
    resume,
  };
}
