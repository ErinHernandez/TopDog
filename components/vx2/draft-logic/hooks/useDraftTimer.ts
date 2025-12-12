/**
 * VX2 Draft Logic - Draft Timer Hook
 * 
 * Timer with grace period support for draft picks.
 * All new implementation - no code reuse.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { TimerState, TimerUrgency, TimerStatus } from '../types';
import { DRAFT_CONFIG } from '../constants';
// Direct imports to avoid barrel export issues with Turbopack
import { formatTimer, getTimerUrgency } from '../utils/timer';

// ============================================================================
// TYPES
// ============================================================================

export interface UseDraftTimerOptions {
  /** Initial seconds (default: 30) */
  initialSeconds?: number;
  /** Grace period duration in seconds (default: 5) */
  gracePeriodSeconds?: number;
  /** Whether timer should be running */
  isActive: boolean;
  /** External pause control */
  isPaused?: boolean;
  /** Callback when timer expires (after grace period) */
  onExpire?: () => void;
  /** Callback when grace period starts */
  onGracePeriodStart?: () => void;
  /** Callback on each tick */
  onTick?: (secondsRemaining: number) => void;
}

export interface UseDraftTimerResult {
  /** Current timer state */
  state: TimerState;
  /** Seconds remaining */
  secondsRemaining: number;
  /** Formatted time string (e.g., "0:30") */
  formattedTime: string;
  /** Urgency level for styling */
  urgency: TimerUrgency;
  /** Whether in grace period */
  isInGracePeriod: boolean;
  /** Whether timer is running */
  isRunning: boolean;
  /** Full timer status */
  status: TimerStatus;
  /** Reset timer to initial value */
  reset: (newDuration?: number) => void;
  /** Pause timer */
  pause: () => void;
  /** Resume timer */
  resume: () => void;
  /** Start timer from beginning */
  start: (duration?: number) => void;
  /** Stop timer completely */
  stop: () => void;
}

// ============================================================================
// HOOK
// ============================================================================

export function useDraftTimer({
  initialSeconds = DRAFT_CONFIG.pickTimeSeconds,
  gracePeriodSeconds = DRAFT_CONFIG.gracePeriodSeconds,
  isActive,
  isPaused = false,
  onExpire,
  onGracePeriodStart,
  onTick,
}: UseDraftTimerOptions): UseDraftTimerResult {
  // State
  const [secondsRemaining, setSecondsRemaining] = useState(initialSeconds);
  const [state, setState] = useState<TimerState>('idle');
  const [localPaused, setLocalPaused] = useState(false);
  
  // Refs to prevent stale closures
  const onExpireRef = useRef(onExpire);
  const onGracePeriodStartRef = useRef(onGracePeriodStart);
  const onTickRef = useRef(onTick);
  const hasExpiredRef = useRef(false);
  const gracePeriodTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Update refs when callbacks change
  useEffect(() => {
    onExpireRef.current = onExpire;
    onGracePeriodStartRef.current = onGracePeriodStart;
    onTickRef.current = onTick;
  }, [onExpire, onGracePeriodStart, onTick]);
  
  // Derived state
  const isInGracePeriod = state === 'grace_period';
  const effectivePaused = isPaused || localPaused;
  const isRunning = isActive && !effectivePaused && state === 'running';
  
  // Cleanup grace period timeout
  useEffect(() => {
    return () => {
      if (gracePeriodTimeoutRef.current) {
        clearTimeout(gracePeriodTimeoutRef.current);
      }
    };
  }, []);
  
  // Main countdown effect
  useEffect(() => {
    if (!isActive || effectivePaused || state !== 'running') {
      return;
    }
    
    const interval = setInterval(() => {
      setSecondsRemaining(prev => {
        const newValue = prev - 1;
        
        // Call tick callback
        onTickRef.current?.(newValue);
        
        if (newValue <= 0) {
          // Enter grace period
          setState('grace_period');
          onGracePeriodStartRef.current?.();
          return 0;
        }
        
        return newValue;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isActive, effectivePaused, state]);
  
  // Grace period effect
  useEffect(() => {
    if (state !== 'grace_period' || hasExpiredRef.current) {
      return;
    }
    
    gracePeriodTimeoutRef.current = setTimeout(() => {
      hasExpiredRef.current = true;
      setState('expired');
      onExpireRef.current?.();
    }, gracePeriodSeconds * 1000);
    
    return () => {
      if (gracePeriodTimeoutRef.current) {
        clearTimeout(gracePeriodTimeoutRef.current);
      }
    };
  }, [state, gracePeriodSeconds]);
  
  // Start running when activated
  useEffect(() => {
    if (isActive && state === 'idle') {
      setState('running');
    }
  }, [isActive, state]);
  
  // Actions
  const reset = useCallback((newDuration?: number) => {
    setSecondsRemaining(newDuration ?? initialSeconds);
    setState('idle');
    hasExpiredRef.current = false;
    if (gracePeriodTimeoutRef.current) {
      clearTimeout(gracePeriodTimeoutRef.current);
    }
  }, [initialSeconds]);
  
  const pause = useCallback(() => {
    setLocalPaused(true);
    if (state === 'running') {
      setState('paused');
    }
  }, [state]);
  
  const resume = useCallback(() => {
    setLocalPaused(false);
    if (state === 'paused') {
      setState('running');
    }
  }, [state]);
  
  const start = useCallback((duration?: number) => {
    setSecondsRemaining(duration ?? initialSeconds);
    setState('running');
    hasExpiredRef.current = false;
    setLocalPaused(false);
  }, [initialSeconds]);
  
  const stop = useCallback(() => {
    setState('idle');
    setLocalPaused(false);
    if (gracePeriodTimeoutRef.current) {
      clearTimeout(gracePeriodTimeoutRef.current);
    }
  }, []);
  
  // Build status object
  const status: TimerStatus = {
    state,
    secondsRemaining,
    urgency: getTimerUrgency(secondsRemaining),
    isInGracePeriod,
  };
  
  return {
    state,
    secondsRemaining,
    formattedTime: formatTimer(secondsRemaining),
    urgency: getTimerUrgency(secondsRemaining),
    isInGracePeriod,
    isRunning,
    status,
    reset,
    pause,
    resume,
    start,
    stop,
  };
}

export default useDraftTimer;

