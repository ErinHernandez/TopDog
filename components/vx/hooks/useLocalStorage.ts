/**
 * VX Local Storage Hook
 * 
 * Persists state to localStorage with SSR safety.
 * Useful for:
 * - User preferences (sort order, filters)
 * - Draft queue persistence
 * - Last viewed tab
 */

import { useState, useEffect, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================

type SetValue<T> = (value: T | ((prev: T) => T)) => void;

// ============================================================================
// HOOK
// ============================================================================

export default function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, SetValue<T>, () => void] {
  // State to store value
  // Initialize with initialValue to avoid hydration mismatch
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
    }
    setIsHydrated(true);
  }, [key]);

  // Save to localStorage whenever value changes (after hydration)
  useEffect(() => {
    if (!isHydrated || typeof window === 'undefined') return;

    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue, isHydrated]);

  // Setter function
  const setValue: SetValue<T> = useCallback((value) => {
    setStoredValue(prev => {
      const newValue = value instanceof Function ? value(prev) : value;
      return newValue;
    });
  }, []);

  // Remove from localStorage
  const removeValue = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

// ============================================================================
// SPECIFIC HOOKS
// ============================================================================

/**
 * Hook for persisting sort preferences
 */
export function useSortPreference(
  key: string,
  defaultSort: string = 'asc'
): [string, (sort: string) => void] {
  const [sort, setSort] = useLocalStorage(`vx-sort-${key}`, defaultSort);
  return [sort, setSort];
}

/**
 * Hook for persisting filter preferences
 */
export function useFilterPreference<T extends string[]>(
  key: string,
  defaultFilters: T
): [T, (filters: T) => void] {
  const [filters, setFilters] = useLocalStorage(`vx-filters-${key}`, defaultFilters);
  return [filters as T, setFilters as (filters: T) => void];
}

/**
 * Hook for persisting view mode (e.g., grid vs list)
 */
export function useViewMode(
  key: string,
  defaultMode: 'grid' | 'list' = 'list'
): ['grid' | 'list', () => void] {
  const [mode, setMode] = useLocalStorage(`vx-view-${key}`, defaultMode);
  
  const toggleMode = useCallback(() => {
    setMode(prev => prev === 'grid' ? 'list' : 'grid');
  }, [setMode]);
  
  return [mode, toggleMode];
}

/**
 * Hook for persisting collapsed/expanded state
 */
export function useCollapsedState(
  key: string,
  defaultCollapsed: boolean = false
): [boolean, () => void] {
  const [collapsed, setCollapsed] = useLocalStorage(`vx-collapsed-${key}`, defaultCollapsed);
  
  const toggleCollapsed = useCallback(() => {
    setCollapsed(prev => !prev);
  }, [setCollapsed]);
  
  return [collapsed, toggleCollapsed];
}

