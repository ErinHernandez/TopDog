/**
 * useStableCallback - Stable callback reference hook
 *
 * Prevents stale closures in callbacks by returning a stable function reference
 * that always calls the latest version of the callback. Useful for:
 * - Timer callbacks that don't trigger re-renders
 * - WebSocket/Firestore handlers
 * - Event listeners that persist across renders
 * - Dependencies in useEffect
 *
 * @example
 * ```tsx
 * const handleTimerTick = useCallback((seconds: number) => {
 *   console.log(`Timer: ${seconds}s`);
 *   setUIState(seconds);
 * }, []);
 *
 * const stableHandle = useStableCallback(handleTimerTick);
 *
 * useEffect(() => {
 *   const interval = setInterval(() => {
 *     stableHandle(5); // Always calls latest handleTimerTick
 *   }, 1000);
 *   return () => clearInterval(interval);
 * }, []); // Empty deps - stableHandle never changes
 * ```
 */

import { useRef, useEffect, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface UseStableCallbackResult<T extends (...args: unknown[]) => unknown> {
  /** Stable callback function - never changes reference */
  (...args: Parameters<T>): ReturnType<T>;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Creates a stable callback reference that always calls the latest version
 * of the provided callback. This prevents stale closures while keeping the
 * callback reference stable across renders.
 *
 * @param callback - The callback function to stabilize
 * @returns A stable function reference that always calls the latest callback
 *
 * @example
 * ```tsx
 * // Without useStableCallback: handleTick reference changes on each render
 * const handleTick = useCallback((seconds) => {
 *   setSeconds(seconds);
 * }, []);
 *
 * useEffect(() => {
 *   const interval = setInterval(handleTick, 1000);
 *   // Need handleTick in deps, but it changes on each render
 *   return () => clearInterval(interval);
 * }, [handleTick]); // Interval recreated on every render!
 *
 * // With useStableCallback: stableCallback never changes
 * const stableCallback = useStableCallback(handleTick);
 *
 * useEffect(() => {
 *   const interval = setInterval(stableCallback, 1000);
 *   return () => clearInterval(interval);
 * }, []); // Interval created once, runs latest handleTick
 * ```
 */
export function useStableCallback<T extends (...args: unknown[]) => unknown>(
  callback: T
): UseStableCallbackResult<T> {
  // Store the latest callback in a ref
  const callbackRef = useRef<T>(callback);

  // Update the ref whenever callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Return a stable function that always calls the latest callback
   
  return useCallback(
    ((...args: Parameters<T>) => {
      return callbackRef.current(...args);
    }) as UseStableCallbackResult<T>,
    [] // Empty deps - this function never changes
  );
}

// ============================================================================
// EXPORT
// ============================================================================

export default useStableCallback;
