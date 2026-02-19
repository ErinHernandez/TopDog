/**
 * useDisplayCurrency Hook
 * 
 * React hook for managing user display currency.
 * Provides the current display currency and methods to update preferences.
 * 
 * @example
 * ```tsx
 * const { 
 *   currency, 
 *   symbol, 
 *   source, 
 *   canChange, 
 *   setCurrency, 
 *   resetToAuto,
 *   isLoading 
 * } = useDisplayCurrency(userId, userCountry);
 * ```
 */

import { useState, useEffect, useCallback } from 'react';

import { createScopedLogger } from '@/lib/clientLogger';

const logger = createScopedLogger('[useDisplayCurrency]');

// ============================================================================
// TYPES
// ============================================================================

export type DisplayCurrencySource = 
  | 'preference'       // User manually set in preferences
  | 'last_deposit'     // Based on most recent deposit
  | 'local_detection'; // Based on user's country

export interface CurrencyOption {
  value: string;
  label: string;
  symbol: string;
}

export interface DisplayCurrencyState {
  /** The resolved currency code (e.g., 'USD', 'EUR') */
  currency: string;
  /** Currency symbol for display (e.g., '$', '€') */
  symbol: string;
  /** Full currency name */
  name: string;
  /** How the currency was determined */
  source: DisplayCurrencySource;
  /** Human-readable source label */
  sourceLabel: string;
  /** Whether user can change this currency */
  canChange: boolean;
  /** Number of decimal places for this currency */
  decimals: number;
  /** Available currencies for selection (only if canChange) */
  availableCurrencies?: CurrencyOption[];
  /** Whether the hook is loading */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
}

export interface UseDisplayCurrencyReturn extends DisplayCurrencyState {
  /** Set a new display currency preference */
  setCurrency: (currency: string) => Promise<void>;
  /** Reset to auto mode (follows last deposit) */
  resetToAuto: () => Promise<void>;
  /** Refresh the display currency */
  refresh: () => Promise<void>;
  /** Whether an update is in progress */
  isUpdating: boolean;
}

// ============================================================================
// HOOK
// ============================================================================

export function useDisplayCurrency(
  userId: string | null | undefined,
  userCountry: string | null | undefined
): UseDisplayCurrencyReturn {
  // State
  const [state, setState] = useState<DisplayCurrencyState>({
    currency: 'USD',
    symbol: '$',
    name: 'US Dollar',
    source: 'local_detection',
    sourceLabel: 'Based on your location',
    canChange: false,
    decimals: 2,
    availableCurrencies: undefined,
    isLoading: true,
    error: null,
  });
  
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Fetch display currency from API
  const fetchDisplayCurrency = useCallback(async () => {
    if (!userId || !userCountry) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: null,
      }));
      return;
    }
    
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await fetch(
        `/api/user/display-currency?userId=${encodeURIComponent(userId)}&country=${encodeURIComponent(userCountry)}`
      );
      
      const data = await response.json();
      
      if (data.ok && data.data) {
        setState({
          currency: data.data.currency,
          symbol: data.data.symbol,
          name: data.data.name,
          source: data.data.source,
          sourceLabel: data.data.sourceLabel,
          canChange: data.data.canChange,
          decimals: data.data.decimals,
          availableCurrencies: data.data.availableCurrencies,
          isLoading: false,
          error: null,
        });
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: data.error?.message || 'Failed to load display currency',
        }));
      }
    } catch (err) {
      logger.error('Error fetching', err instanceof Error ? err : new Error(String(err)));
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Network error',
      }));
    }
  }, [userId, userCountry]);
  
  // Initial fetch
  useEffect(() => {
    fetchDisplayCurrency();
  }, [fetchDisplayCurrency]);
  
  // Set new currency preference
  const setCurrency = useCallback(async (currency: string) => {
    if (!userId || !userCountry) {
      return;
    }
    
    try {
      setIsUpdating(true);
      
      const response = await fetch('/api/user/display-currency', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          country: userCountry,
          currency,
        }),
      });
      
      const data = await response.json();
      
      if (data.ok && data.data) {
        setState(prev => ({
          ...prev,
          currency: data.data.currency,
          symbol: data.data.symbol,
          name: data.data.name,
          source: data.data.source,
          sourceLabel: data.data.sourceLabel,
          canChange: data.data.canChange,
          error: null,
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: data.error?.message || 'Failed to update currency',
        }));
      }
    } catch (err) {
      logger.error('Error setting currency', err instanceof Error ? err : new Error(String(err)));
      setState(prev => ({
        ...prev,
        error: 'Network error',
      }));
    } finally {
      setIsUpdating(false);
    }
  }, [userId, userCountry]);
  
  // Reset to auto mode
  const resetToAuto = useCallback(async () => {
    if (!userId || !userCountry) {
      return;
    }
    
    try {
      setIsUpdating(true);
      
      const response = await fetch('/api/user/display-currency', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          country: userCountry,
        }),
      });
      
      const data = await response.json();
      
      if (data.ok && data.data) {
        setState(prev => ({
          ...prev,
          currency: data.data.currency,
          symbol: data.data.symbol,
          name: data.data.name,
          source: data.data.source,
          sourceLabel: data.data.sourceLabel,
          canChange: data.data.canChange,
          error: null,
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: data.error?.message || 'Failed to reset currency',
        }));
      }
    } catch (err) {
      logger.error('Error resetting currency', err instanceof Error ? err : new Error(String(err)));
      setState(prev => ({
        ...prev,
        error: 'Network error',
      }));
    } finally {
      setIsUpdating(false);
    }
  }, [userId, userCountry]);
  
  return {
    ...state,
    setCurrency,
    resetToAuto,
    refresh: fetchDisplayCurrency,
    isUpdating,
  };
}

// ============================================================================
// UTILITY HOOK - Format Currency Amount
// ============================================================================

/**
 * Hook to get a currency formatter function for the user's display currency.
 */
export function useCurrencyFormatter(
  currency: string,
  decimals: number = 2
): (amountSmallestUnit: number) => string {
  return useCallback((amountSmallestUnit: number) => {
    const isZeroDecimal = decimals === 0;
    const displayAmount = isZeroDecimal ? amountSmallestUnit : amountSmallestUnit / 100;
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: isZeroDecimal ? 0 : 2,
      maximumFractionDigits: isZeroDecimal ? 0 : 2,
    }).format(displayAmount);
  }, [currency, decimals]);
}

export default useDisplayCurrency;

