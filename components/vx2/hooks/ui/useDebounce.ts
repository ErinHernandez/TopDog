/**
 * useDebounce - UI hook for debouncing values
 *
 * Delays updating a value until after a specified delay.
 * Useful for search inputs, resize handlers, etc.
 *
 * @example
 * ```tsx
 * const [searchQuery, setSearchQuery] = useState('');
 * const debouncedQuery = useDebounce(searchQuery, 300);
 *
 * // Use debouncedQuery for API calls
 * useEffect(() => {
 *   if (debouncedQuery) {
 *     searchPlayers(debouncedQuery);
 *   }
 * }, [debouncedQuery]);
 * ```
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Options for useDebounce
 */
export interface UseDebounceOptions {
  /** Whether to call immediately on first change (default: false) */
  leading?: boolean;
  /** Maximum time to wait before forcing update (default: none) */
  maxWait?: number;
}

// ============================================================================
// VALUE DEBOUNCE HOOK
// ============================================================================

/**
 * Debounce a value
 *
 * @param value - Value to debounce
 * @param delay - Delay in milliseconds
 * @param options - Additional options
 * @returns Debounced value
 */
export function useDebounce<T>(value: T, delay: number, options: UseDebounceOptions = {}): T {
  const { leading = false, maxWait } = options;

  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const lastValueRef = useRef<T>(value);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    // Handle leading edge
    if (leading && lastValueRef.current !== value) {
      setDebouncedValue(value);
      lastUpdateRef.current = Date.now();
    }
    lastValueRef.current = value;

    const handler = setTimeout(() => {
      setDebouncedValue(value);
      lastUpdateRef.current = Date.now();
    }, delay);

    // Handle maxWait
    let maxWaitHandler: NodeJS.Timeout | null = null;
    if (maxWait) {
      const timeSinceLastUpdate = Date.now() - lastUpdateRef.current;
      const remainingMaxWait = Math.max(0, maxWait - timeSinceLastUpdate);

      if (remainingMaxWait < delay) {
        maxWaitHandler = setTimeout(() => {
          setDebouncedValue(value);
          lastUpdateRef.current = Date.now();
        }, remainingMaxWait);
      }
    }

    return () => {
      clearTimeout(handler);
      if (maxWaitHandler) {
        clearTimeout(maxWaitHandler);
      }
    };
  }, [value, delay, leading, maxWait]);

  return debouncedValue;
}

// ============================================================================
// CALLBACK DEBOUNCE HOOK
// ============================================================================

/**
 * Return type for useDebouncedCallback
 *
 * @template T - Function type to debounce (must be a function)
 *
 * Note: Uses `any[]` for parameters so any callback signature is accepted; function signature is preserved via T.
 */
export interface UseDebouncedCallbackResult<T extends (...args: any[]) => any> {
  /** Debounced function */
  debouncedCallback: T;
  /** Cancel pending invocation */
  cancel: () => void;
  /** Flush pending invocation immediately */
  flush: () => void;
  /** Whether there's a pending invocation */
  isPending: boolean;
}

/**
 * Debounce a callback function
 *
 * @template T - Function type to debounce (must be a function)
 * @param callback - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function with cancel/flush controls
 *
 * Note: Uses `any[]` for parameters so any callback signature is accepted; function signature is preserved via T.
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
): UseDebouncedCallbackResult<T> {
  const callbackRef = useRef(callback);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const argsRef = useRef<Parameters<T> | null>(null);
  const [isPending, setIsPending] = useState(false);

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    argsRef.current = null;
    setIsPending(false);
  }, []);

  const flush = useCallback(() => {
    if (timerRef.current && argsRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      callbackRef.current(...argsRef.current);
      argsRef.current = null;
      setIsPending(false);
    }
  }, []);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      argsRef.current = args;
      setIsPending(true);

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        if (argsRef.current) {
          callbackRef.current(...argsRef.current);
          argsRef.current = null;
        }
        timerRef.current = null;
        setIsPending(false);
      }, delay);
    },
    [delay],
  ) as T;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return {
    debouncedCallback,
    cancel,
    flush,
    isPending,
  };
}

export default useDebounce;
