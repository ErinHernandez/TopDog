/**
 * useCountdown - Countdown timer hook
 *
 * Provides a countdown timer that decrements every second until reaching zero.
 * Abstracts the common pattern of resend cooldowns, OTP timers, etc.
 *
 * @example
 * ```tsx
 * const { seconds, isActive, start } = useCountdown(60);
 *
 * return (
 *   <button onClick={start} disabled={isActive}>
 *     {isActive ? `Resend in ${seconds}s` : 'Resend Code'}
 *   </button>
 * );
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface UseCountdownOptions {
  /** Callback fired when countdown reaches zero */
  onComplete?: () => void;
  /** Whether to start countdown immediately on mount (default: false) */
  autoStart?: boolean;
}

export interface UseCountdownReturn {
  /** Current countdown value in seconds */
  seconds: number;
  /** Whether the countdown is currently active */
  isActive: boolean;
  /** Start or restart the countdown */
  start: () => void;
  /** Stop the countdown without resetting */
  stop: () => void;
  /** Reset to initial value without starting */
  reset: () => void;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * Countdown timer hook
 *
 * @param initialSeconds - Starting value for countdown
 * @param options - Optional configuration
 * @returns Countdown state and controls
 */
export function useCountdown(
  initialSeconds: number,
  options: UseCountdownOptions = {}
): UseCountdownReturn {
  const { onComplete, autoStart = false } = options;

  const [seconds, setSeconds] = useState(autoStart ? initialSeconds : 0);
  const onCompleteRef = useRef(onComplete);

  // Keep callback ref updated
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Countdown effect
  useEffect(() => {
    if (seconds <= 0) {
      return;
    }

    const timer = setTimeout(() => {
       
      setSeconds(s => {
        const newValue = s - 1;
        if (newValue === 0) {
          onCompleteRef.current?.();
        }
        return newValue;
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [seconds]);

  const start = useCallback(() => {
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  const stop = useCallback(() => {
    setSeconds(0);
  }, []);

  const reset = useCallback(() => {
    setSeconds(0);
  }, []);

  return {
    seconds,
    isActive: seconds > 0,
    start,
    stop,
    reset,
  };
}

export default useCountdown;
