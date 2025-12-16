/**
 * useDraftTimer - Draft pick timer hook
 * 
 * Manages countdown timer with warning/critical states.
 * Supports pause, resume, and reset functionality.
 * 
 * @example
 * ```tsx
 * const { seconds, formatted, urgency, isExpired } = useDraftTimer({
 *   initialSeconds: 30,
 *   isActive: isDraftActive && isMyTurn,
 *   onExpire: handleAutoPick,
 * });
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { TimerUrgency } from '../types';
import { formatTimer, getTimerUrgency, getTimerColor } from '../utils';
import { DRAFT_DEFAULTS } from '../constants';

// ============================================================================
// TYPES
// ============================================================================

export interface UseDraftTimerOptions {
  /** Initial seconds on the timer */
  initialSeconds?: number;
  /** Whether the timer should be running */
  isActive?: boolean;
  /** Whether the timer is paused */
  isPaused?: boolean;
  /** Callback when timer expires */
  onExpire?: () => void;
  /** Callback each second (for sync) */
  onTick?: (seconds: number) => void;
}

export interface UseDraftTimerResult {
  /** Current seconds remaining */
  seconds: number;
  /** Formatted time string (e.g., "0:30") */
  formatted: string;
  /** Urgency level for styling */
  urgency: TimerUrgency;
  /** Color for the timer display */
  color: string;
  /** Whether timer has expired */
  isExpired: boolean;
  /** Whether timer is currently running */
  isRunning: boolean;
  
  /** Reset timer to a specific value */
  reset: (seconds?: number) => void;
  /** Pause the timer */
  pause: () => void;
  /** Resume the timer */
  resume: () => void;
  /** Set seconds directly */
  setSeconds: (seconds: number) => void;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for managing draft pick timer
 */
export function useDraftTimer({
  initialSeconds = DRAFT_DEFAULTS.pickTimeSeconds,
  isActive = false,
  isPaused = false,
  onExpire,
  onTick,
}: UseDraftTimerOptions = {}): UseDraftTimerResult {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [internalPaused, setInternalPaused] = useState(false);
  
  // Track if we've already called onExpire for this expiration
  const hasExpiredRef = useRef(false);
  // Track the expiration delay timeout
  const expireTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Store onExpire in ref to avoid effect cleanup when callback changes
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;
  
  // Delay before auto-pick after timer hits 0 (in milliseconds)
  const EXPIRE_DELAY_MS = 1200;
  
  // Derived state
  const isExpired = seconds <= 0;
  const isRunning = isActive && !isPaused && !internalPaused && !isExpired;
  const urgency = getTimerUrgency(seconds);
  const color = getTimerColor(seconds);
  const formatted = formatTimer(seconds);
  
  // Timer countdown effect
  useEffect(() => {
    if (!isRunning) return;
    
    const interval = setInterval(() => {
      setSeconds(prev => {
        const next = prev - 1;
        
        // Call onTick callback
        onTick?.(next);
        
        return next;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isRunning, onTick]);
  
  // Handle expiration with delay (timer sits at 0 for 1.2s before auto-pick)
  useEffect(() => {
    if (isExpired && !hasExpiredRef.current && isActive) {
      hasExpiredRef.current = true;
      
      // Clear any existing timeout
      if (expireTimeoutRef.current) {
        clearTimeout(expireTimeoutRef.current);
      }
      
      // Wait 1.2 seconds at 0 before triggering auto-pick
      // Use ref to avoid cleanup when callback identity changes
      expireTimeoutRef.current = setTimeout(() => {
        onExpireRef.current?.();
      }, EXPIRE_DELAY_MS);
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (expireTimeoutRef.current) {
        clearTimeout(expireTimeoutRef.current);
      }
    };
  }, [isExpired, isActive]); // Removed onExpire - using ref instead
  
  // Reset expired ref when timer is reset
  useEffect(() => {
    if (seconds > 0) {
      hasExpiredRef.current = false;
    }
  }, [seconds]);
  
  // Track previous isActive to detect transitions
  const wasActiveRef = useRef(isActive);
  
  // Reset when isActive transitions from false to true (not when timer naturally expires)
  useEffect(() => {
    const wasActive = wasActiveRef.current;
    wasActiveRef.current = isActive;
    
    // Only reset if transitioning from inactive to active while timer is at 0
    if (!wasActive && isActive && seconds <= 0) {
      setSeconds(initialSeconds);
      hasExpiredRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, initialSeconds]);
  
  // Actions
  const reset = useCallback((newSeconds?: number) => {
    // Clear any pending expire timeout
    if (expireTimeoutRef.current) {
      clearTimeout(expireTimeoutRef.current);
      expireTimeoutRef.current = null;
    }
    setSeconds(newSeconds ?? initialSeconds);
    hasExpiredRef.current = false;
  }, [initialSeconds]);
  
  const pause = useCallback(() => {
    setInternalPaused(true);
  }, []);
  
  const resume = useCallback(() => {
    setInternalPaused(false);
  }, []);
  
  const setSecondsValue = useCallback((value: number) => {
    setSeconds(Math.max(0, value));
    if (value > 0) {
      hasExpiredRef.current = false;
    }
  }, []);
  
  return {
    seconds,
    formatted,
    urgency,
    color,
    isExpired,
    isRunning,
    reset,
    pause,
    resume,
    setSeconds: setSecondsValue,
  };
}

export default useDraftTimer;
