/**
 * VX Timer Hook
 * 
 * Reusable countdown timer hook with pause, reset, and speed controls.
 * Used for draft pick timers and countdown displays.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface UseTimerOptions {
  /** Initial time in seconds */
  initialTime: number;
  /** Whether timer starts immediately */
  autoStart?: boolean;
  /** Callback when timer reaches 0 */
  onComplete?: () => void;
  /** Callback on each tick */
  onTick?: (time: number) => void;
  /** Timer interval in ms (default: 1000) */
  interval?: number;
}

export interface UseTimerReturn {
  /** Current time remaining */
  time: number;
  /** Whether timer is running */
  isRunning: boolean;
  /** Whether timer has completed */
  isComplete: boolean;
  /** Start the timer */
  start: () => void;
  /** Pause the timer */
  pause: () => void;
  /** Toggle between start/pause */
  toggle: () => void;
  /** Reset to initial time */
  reset: (newTime?: number) => void;
  /** Set time directly */
  setTime: (time: number) => void;
}

// ============================================================================
// HOOK
// ============================================================================

export default function useTimer({
  initialTime,
  autoStart = false,
  onComplete,
  onTick,
  interval = 1000,
}: UseTimerOptions): UseTimerReturn {
  const [time, setTime] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isComplete, setIsComplete] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onCompleteRef = useRef(onComplete);
  const onTickRef = useRef(onTick);

  // Keep refs in sync
  useEffect(() => {
    onCompleteRef.current = onComplete;
    onTickRef.current = onTick;
  }, [onComplete, onTick]);

  // Timer effect
  useEffect(() => {
    if (isRunning && time > 0) {
      intervalRef.current = setInterval(() => {
        setTime(prevTime => {
          const newTime = prevTime - 1;
          onTickRef.current?.(newTime);
          
          if (newTime <= 0) {
            setIsRunning(false);
            setIsComplete(true);
            onCompleteRef.current?.();
            return 0;
          }
          
          return newTime;
        });
      }, interval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, interval]);

  // Clear interval when time reaches 0
  useEffect(() => {
    if (time <= 0 && intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, [time]);

  const start = useCallback(() => {
    if (time > 0) {
      setIsRunning(true);
      setIsComplete(false);
    }
  }, [time]);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const toggle = useCallback(() => {
    if (isRunning) {
      pause();
    } else {
      start();
    }
  }, [isRunning, start, pause]);

  const reset = useCallback((newTime?: number) => {
    setTime(newTime ?? initialTime);
    setIsRunning(false);
    setIsComplete(false);
  }, [initialTime]);

  const setTimeValue = useCallback((newTime: number) => {
    setTime(Math.max(0, newTime));
    if (newTime <= 0) {
      setIsComplete(true);
      setIsRunning(false);
    }
  }, []);

  return {
    time,
    isRunning,
    isComplete,
    start,
    pause,
    toggle,
    reset,
    setTime: setTimeValue,
  };
}

// ============================================================================
// COUNTDOWN TIMER (Simpler variant)
// ============================================================================

export interface UseCountdownOptions {
  /** Duration in seconds */
  seconds: number;
  /** Start immediately */
  autoStart?: boolean;
  /** Callback when complete */
  onComplete?: () => void;
}

export function useCountdown({
  seconds,
  autoStart = false,
  onComplete,
}: UseCountdownOptions): { 
  timeLeft: number; 
  isActive: boolean;
  start: () => void;
  reset: () => void;
} {
  const { time, isRunning, start, reset } = useTimer({
    initialTime: seconds,
    autoStart,
    onComplete,
  });

  return {
    timeLeft: time,
    isActive: isRunning,
    start,
    reset,
  };
}

