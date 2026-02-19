/**
 * VX2 Draft Logic - Timer Utilities
 * 
 * Pure utility functions for timer formatting and state.
 * All new implementations - no code reuse.
 */

import { TIMER_CONFIG } from '../constants';
import type { TimerUrgency } from '../types';

// ============================================================================
// TIMER FORMATTING
// ============================================================================

/**
 * Format seconds as M:SS string.
 * 
 * @param seconds - Seconds remaining
 * @returns Formatted string (e.g., "0:30", "1:05", "0:00")
 * 
 * @example
 * formatTimer(30)   // "0:30"
 * formatTimer(65)   // "1:05"
 * formatTimer(0)    // "0:00"
 * formatTimer(-5)   // "0:00"
 */
export function formatTimer(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format seconds as SS string (just seconds, no minutes).
 * 
 * @param seconds - Seconds remaining
 * @returns Formatted string (e.g., "30", "05", "00")
 */
export function formatTimerSeconds(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  return safeSeconds.toString().padStart(2, '0');
}

// ============================================================================
// TIMER URGENCY
// ============================================================================

/**
 * Get timer urgency level based on seconds remaining.
 * 
 * @param seconds - Seconds remaining
 * @returns Urgency level for styling
 * 
 * @example
 * getTimerUrgency(15)  // 'normal'
 * getTimerUrgency(8)   // 'warning'
 * getTimerUrgency(3)   // 'critical'
 */
export function getTimerUrgency(seconds: number): TimerUrgency {
  if (seconds <= TIMER_CONFIG.criticalThreshold) {
    return 'critical';
  }
  if (seconds <= TIMER_CONFIG.warningThreshold) {
    return 'warning';
  }
  return 'normal';
}

/**
 * Get timer color based on seconds remaining.
 * 
 * @param seconds - Seconds remaining
 * @returns CSS color string
 */
export function getTimerColor(seconds: number): string {
  const urgency = getTimerUrgency(seconds);
  return TIMER_CONFIG.colors[urgency];
}

/**
 * Check if timer should pulse (critical state).
 * 
 * @param seconds - Seconds remaining
 * @returns true if should pulse
 */
export function shouldTimerPulse(seconds: number): boolean {
  return seconds <= TIMER_CONFIG.criticalThreshold && seconds > 0;
}

// ============================================================================
// TIMER CALCULATIONS
// ============================================================================

/**
 * Calculate progress percentage for timer bar.
 * 
 * @param remaining - Seconds remaining
 * @param total - Total seconds
 * @returns Percentage (0-100)
 */
export function getTimerProgress(remaining: number, total: number): number {
  if (total <= 0) return 0;
  const progress = (remaining / total) * 100;
  return Math.max(0, Math.min(100, progress));
}

/**
 * Calculate elapsed time.
 * 
 * @param remaining - Seconds remaining
 * @param total - Total seconds
 * @returns Elapsed seconds
 */
export function getElapsedTime(remaining: number, total: number): number {
  return Math.max(0, total - remaining);
}


