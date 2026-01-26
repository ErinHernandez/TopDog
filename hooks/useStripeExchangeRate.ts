/**
 * useStripeExchangeRate Hook
 * 
 * React hook for fetching and using Stripe exchange rates.
 * Returns the current rate and conversion functions.
 * 
 * @example
 * ```tsx
 * const { 
 *   rate, 
 *   rateDisplay, 
 *   loading, 
 *   toLocal, 
 *   toUSD,
 *   get25Increments,
 * } = useStripeExchangeRate('AUD');
 * 
 * // Convert $50 USD to AUD
 * const audAmount = toLocal(50); // ~77.50
 * ```
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createScopedLogger } from '@/lib/clientLogger';

const logger = createScopedLogger('[useStripeExchangeRate]');

// ============================================================================
// TYPES
// ============================================================================

export interface StripeExchangeRateData {
  /** Currency code (e.g., 'AUD') */
  currency: string;
  /** Exchange rate: 1 USD = X local currency */
  rate: number;
  /** Human-readable rate display (e.g., "1 USD = 1.55 AUD") */
  rateDisplay: string;
  /** Timestamp when rate was fetched */
  fetchedAt: number;
  /** Source of the rate data */
  source: 'stripe' | 'cache' | 'fallback';
}

export interface UseStripeExchangeRateResult {
  /** Exchange rate: 1 USD = X local currency */
  rate: number | null;
  /** Human-readable rate display */
  rateDisplay: string | null;
  /** Whether the rate is currently loading */
  loading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Convert USD amount to local currency */
  toLocal: (usdAmount: number) => number;
  /** Convert local currency amount to USD */
  toUSD: (localAmount: number) => number;
  /** Get array of $25 USD increments in local currency */
  get25Increments: () => number[];
  /** Check if an amount is a valid $25 increment */
  isValid25Increment: (localAmount: number) => boolean;
  /** Get nearest valid $25 increments [lower, higher] */
  getNearestIncrements: (localAmount: number) => [number, number];
  /** Refresh the exchange rate */
  refresh: () => Promise<void>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Quick select amounts in USD */
const USD_QUICK_AMOUNTS = [25, 50, 100, 250, 500];

/** Minimum deposit in USD */
const MIN_USD = 25;

/** Maximum deposit in USD */
const MAX_USD = 10000;

// ============================================================================
// HOOK
// ============================================================================

export function useStripeExchangeRate(
  currency: string | null | undefined
): UseStripeExchangeRateResult {
  const [rateData, setRateData] = useState<StripeExchangeRateData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Normalized currency code
  const normalizedCurrency = currency?.toUpperCase() || 'USD';
  
  // Fetch exchange rate from API
  const fetchRate = useCallback(async () => {
    // USD doesn't need exchange rate lookup
    if (normalizedCurrency === 'USD') {
      setRateData({
        currency: 'USD',
        rate: 1,
        rateDisplay: '1 USD = 1 USD',
        fetchedAt: Date.now(),
        source: 'cache',
      });
      setLoading(false);
      setError(null);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `/api/stripe/exchange-rate?currency=${encodeURIComponent(normalizedCurrency)}`
      );
      
      const data = await response.json();
      
      if (data.ok && data.data) {
        setRateData({
          currency: data.data.currency,
          rate: data.data.rate,
          rateDisplay: data.data.rateDisplay,
          fetchedAt: data.data.fetchedAt,
          source: data.data.source,
        });
        setError(null);
      } else {
        setError(data.error?.message || 'Failed to fetch exchange rate');
        // Keep using old rate if available
      }
    } catch (err) {
      logger.error('Error fetching rate', err instanceof Error ? err : new Error(String(err)));
      setError('Network error fetching exchange rate');
      // Keep using old rate if available
    } finally {
      setLoading(false);
    }
  }, [normalizedCurrency]);
  
  // Fetch rate when currency changes
  useEffect(() => {
    fetchRate();
  }, [fetchRate]);
  
  // Get the current rate, defaulting to 1 for safety
  const rate = rateData?.rate ?? 1;
  
  // Convert USD to local currency
  const toLocal = useCallback((usdAmount: number): number => {
    return usdAmount * rate;
  }, [rate]);
  
  // Convert local currency to USD
  const toUSD = useCallback((localAmount: number): number => {
    if (rate === 0) return 0;
    return localAmount / rate;
  }, [rate]);
  
  // Get $25 USD increments in local currency
  const get25Increments = useCallback((): number[] => {
    return USD_QUICK_AMOUNTS.map(usd => {
      const local = usd * rate;
      // Round to 2 decimal places
      return Math.round(local * 100) / 100;
    });
  }, [rate]);
  
  // Check if an amount is a valid $25 USD increment
  const isValid25Increment = useCallback((localAmount: number): boolean => {
    const usdEquivalent = localAmount / rate;
    // Check if it's within 1% of a $25 increment
    const remainder = usdEquivalent % 25;
    const tolerance = 0.25; // 1% of $25
    return remainder < tolerance || remainder > (25 - tolerance);
  }, [rate]);
  
  // Get nearest valid $25 increments
  const getNearestIncrements = useCallback((localAmount: number): [number, number] => {
    const usdEquivalent = localAmount / rate;
    const lowerUSD = Math.floor(usdEquivalent / 25) * 25;
    const higherUSD = Math.ceil(usdEquivalent / 25) * 25;
    
    // Ensure minimum of $25
    const finalLowerUSD = Math.max(MIN_USD, lowerUSD);
    const finalHigherUSD = Math.max(MIN_USD, higherUSD);
    
    return [
      Math.round(finalLowerUSD * rate * 100) / 100,
      Math.round(finalHigherUSD * rate * 100) / 100,
    ];
  }, [rate]);
  
  return {
    rate: rateData?.rate ?? null,
    rateDisplay: rateData?.rateDisplay ?? null,
    loading,
    error,
    toLocal,
    toUSD,
    get25Increments,
    isValid25Increment,
    getNearestIncrements,
    refresh: fetchRate,
  };
}

// ============================================================================
// UTILITY CONSTANTS EXPORT
// ============================================================================

export { USD_QUICK_AMOUNTS, MIN_USD, MAX_USD };

export default useStripeExchangeRate;

