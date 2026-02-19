/**
 * useTemporaryState - Auto-resetting state hook
 *
 * Provides state that automatically resets to a default value after a delay.
 * Perfect for temporary UI feedback like "Saved!", shake animations, etc.
 *
 * @example
 * ```tsx
 * const [saved, setSaved] = useTemporaryState(false, 2000);
 *
 * const handleSave = async () => {
 *   await saveData();
 *   setSaved(true); // Automatically resets to false after 2000ms
 * };
 *
 * return <button>{saved ? 'Saved!' : 'Save'}</button>;
 * ```
 */

import { useState, useCallback, useEffect, useRef } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type UseTemporaryStateReturn<T> = [
  /** Current value */
  value: T,
  /** Set value (auto-resets after delay) */
  setValue: (newValue: T) => void,
  /** Set value permanently (no auto-reset) */
  setValuePermanent: (newValue: T) => void
];

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * State that automatically resets to default after a delay
 *
 * @param defaultValue - Value to reset to after delay
 * @param resetDelayMs - Delay in milliseconds before resetting
 * @returns Tuple of [value, setValue, setValuePermanent]
 */
export function useTemporaryState<T>(
  defaultValue: T,
  resetDelayMs: number
): UseTemporaryStateReturn<T> {
  const [value, setValueInternal] = useState<T>(defaultValue);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const defaultValueRef = useRef(defaultValue);

  // Keep default value ref updated
  useEffect(() => {
    defaultValueRef.current = defaultValue;
  }, [defaultValue]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const setValue = useCallback((newValue: T) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setValueInternal(newValue);

    // Schedule reset to default
    timeoutRef.current = setTimeout(() => {
       
      setValueInternal(defaultValueRef.current);
      timeoutRef.current = null;
    }, resetDelayMs);
  }, [resetDelayMs]);

  const setValuePermanent = useCallback((newValue: T) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setValueInternal(newValue);
  }, []);

  return [value, setValue, setValuePermanent];
}

export default useTemporaryState;
