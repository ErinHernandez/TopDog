/**
 * Exchange Rate Service
 * 
 * Fetches real-time exchange rates for currency conversion.
 * Uses the Frankfurter API (European Central Bank rates) as primary source.
 * Results are cached for 15 minutes to minimize API calls.
 * 
 * Note: Stripe's actual exchange rate is only available after payment capture.
 * For display purposes, we use ECB rates which are updated daily and closely
 * match what payment processors use. The actual conversion at deposit time
 * may vary slightly (typically <1%).
 */

// ============================================================================
// TYPES
// ============================================================================

export interface StripeExchangeRate {
  /** Currency code (e.g., 'AUD') */
  currency: string;
  /** Exchange rate: 1 USD = X local currency */
  rate: number;
  /** Human-readable rate display (e.g., "1 USD = 1.55 AUD") */
  rateDisplay: string;
  /** Timestamp when rate was fetched */
  fetchedAt: number;
  /** Timestamp when rate expires (15 min TTL) */
  expiresAt: number;
}

interface CacheEntry {
  rate: StripeExchangeRate;
  timestamp: number;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/** Cache TTL in milliseconds (15 minutes) */
const CACHE_TTL_MS = 15 * 60 * 1000;

// ============================================================================
// CACHE
// ============================================================================

/**
 * In-memory cache for exchange rates.
 * In production with multiple serverless instances, consider using Redis.
 */
const rateCache: Map<string, CacheEntry> = new Map();

/**
 * Check if a cached rate is still valid
 */
function isCacheValid(entry: CacheEntry | undefined): entry is CacheEntry {
  if (!entry) return false;
  return Date.now() < entry.rate.expiresAt;
}

/**
 * Get cached rate if valid
 */
export function getCachedRate(currency: string): StripeExchangeRate | null {
  const normalizedCurrency = currency.toUpperCase();
  const entry = rateCache.get(normalizedCurrency);
  
  if (isCacheValid(entry)) {
    return entry.rate;
  }
  
  // Clean up expired entry
  if (entry) {
    rateCache.delete(normalizedCurrency);
  }
  
  return null;
}

/**
 * Store rate in cache
 */
function cacheRate(rate: StripeExchangeRate): void {
  rateCache.set(rate.currency, {
    rate,
    timestamp: Date.now(),
  });
}

// ============================================================================
// EXTERNAL RATE API
// ============================================================================

/**
 * Frankfurter API - Free, open-source exchange rate API
 * Uses European Central Bank (ECB) rates, updated daily around 16:00 CET
 * No API key required, no rate limits for reasonable usage
 * 
 * @see https://www.frankfurter.app/docs/
 */
const FRANKFURTER_API_BASE = 'https://api.frankfurter.app';

/**
 * Fallback rates in case external API fails.
 * Updated periodically - these are approximate market rates.
 * Last updated: January 2026
 */
const FALLBACK_RATES: Record<string, number> = {
  'AUD': 1.55,
  'EUR': 0.92,
  'GBP': 0.79,
  'CAD': 1.36,
  'MXN': 17.15,
  'JPY': 149.50,
  'CHF': 0.88,
  'SEK': 10.45,
  'NOK': 10.75,
  'DKK': 6.88,
  'NZD': 1.68,
  'SGD': 1.34,
  'HKD': 7.82,
  'INR': 83.25,
  'BRL': 4.95,
  'ZAR': 18.50,
  'NGN': 1550.00,
  'GHS': 15.50,
  'KES': 153.00,
  'PLN': 4.02,
  'CZK': 23.25,
  'HUF': 365.00,
  'RON': 4.58,
  'BGN': 1.80,
  'ISK': 138.00,
  'THB': 35.50,
  'MYR': 4.72,
  'PHP': 56.25,
  'IDR': 15750.00,
  'TWD': 31.50,
  'KRW': 1325.00,
  'AED': 3.67,
  'SAR': 3.75,
  'QAR': 3.64,
  'KWD': 0.31,
  'BHD': 0.38,
  'OMR': 0.38,
  'ILS': 3.65,
  'TRY': 32.50,
  'EGP': 48.50,
  'CLP': 925.00,
  'COP': 4050.00,
  'PEN': 3.75,
  'ARS': 875.00,
  'VND': 24500.00,
  'PKR': 278.00,
  'BDT': 110.00,
  'LKR': 325.00,
  'NPR': 133.00,
};

// ============================================================================
// EXCHANGE RATE FETCHING
// ============================================================================

/**
 * Get the current exchange rate for a currency.
 * Uses European Central Bank rates via the Frankfurter API.
 * Results are cached for 15 minutes.
 * 
 * @param currency - ISO 4217 currency code (e.g., 'AUD', 'EUR')
 * @returns Exchange rate data with caching
 */
export async function getStripeExchangeRate(
  currency: string
): Promise<StripeExchangeRate> {
  const normalizedCurrency = currency.toUpperCase();
  
  // USD doesn't need conversion
  if (normalizedCurrency === 'USD') {
    const now = Date.now();
    return {
      currency: 'USD',
      rate: 1,
      rateDisplay: '1 USD = 1 USD',
      fetchedAt: now,
      expiresAt: now + CACHE_TTL_MS,
    };
  }
  
  // Check cache first
  const cached = getCachedRate(normalizedCurrency);
  if (cached) {
    return cached;
  }
  
  // Fetch fresh rate from external API
  const rate = await fetchExchangeRate(normalizedCurrency);
  
  // Cache the result
  cacheRate(rate);
  
  return rate;
}

/**
 * Fetch exchange rate from Frankfurter API (European Central Bank rates).
 * Falls back to static rates if API is unavailable.
 */
async function fetchExchangeRate(currency: string): Promise<StripeExchangeRate> {
  const upperCurrency = currency.toUpperCase();
  const now = Date.now();
  
  try {
    // Fetch rate from Frankfurter API
    // API returns: { "amount": 1, "base": "USD", "date": "2026-01-06", "rates": { "EUR": 0.92 } }
    const response = await fetch(
      `${FRANKFURTER_API_BASE}/latest?from=USD&to=${upperCurrency}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        // 5 second timeout
        signal: AbortSignal.timeout(5000),
      }
    );
    
    if (!response.ok) {
      throw new Error(`Frankfurter API returned ${response.status}`);
    }
    
    const data = await response.json() as {
      amount: number;
      base: string;
      date: string;
      rates: Record<string, number>;
    };
    
    const rate = data.rates[upperCurrency];
    
    if (typeof rate !== 'number' || isNaN(rate) || rate <= 0) {
      throw new Error(`Invalid rate returned for ${upperCurrency}: ${rate}`);
    }
    
    console.log(`[ExchangeRates] Fetched ${upperCurrency} rate from ECB: ${rate}`);
    
    return {
      currency: upperCurrency,
      rate,
      rateDisplay: `1 USD = ${formatRate(rate)} ${upperCurrency}`,
      fetchedAt: now,
      expiresAt: now + CACHE_TTL_MS,
    };
    
  } catch (error) {
    console.warn('[ExchangeRates] API fetch failed, using fallback rate:', error);
    
    // Use fallback rate
    const fallbackRate = FALLBACK_RATES[upperCurrency];
    
    if (fallbackRate) {
      return {
        currency: upperCurrency,
        rate: fallbackRate,
        rateDisplay: `1 USD = ${formatRate(fallbackRate)} ${upperCurrency}`,
        fetchedAt: now,
        expiresAt: now + CACHE_TTL_MS,
      };
    }
    
    // Unknown currency - return 1:1 with short TTL
    console.error(`[ExchangeRates] Unknown currency ${upperCurrency}, no fallback available`);
    return {
      currency: upperCurrency,
      rate: 1,
      rateDisplay: `1 USD = 1.00 ${upperCurrency} (unknown)`,
      fetchedAt: now,
      expiresAt: now + (5 * 60 * 1000), // 5 min TTL for unknown
    };
  }
}

/**
 * Format rate for display - adjusts decimal places based on rate magnitude
 */
function formatRate(rate: number): string {
  if (rate >= 100) {
    // Large rates like JPY, KRW - show as whole number
    return rate.toFixed(0);
  } else if (rate >= 10) {
    // Medium rates - 1 decimal
    return rate.toFixed(1);
  } else {
    // Small rates - 2 decimals
    return rate.toFixed(2);
  }
}

// ============================================================================
// CONVERSION FUNCTIONS
// ============================================================================

/**
 * Convert USD amount to local currency using the exchange rate.
 * 
 * @param usdAmount - Amount in USD (display amount, e.g., 25 for $25)
 * @param rate - Exchange rate (1 USD = X local)
 * @returns Amount in local currency (display amount)
 */
export function convertFromUSD(usdAmount: number, rate: number): number {
  return usdAmount * rate;
}

/**
 * Convert local currency amount to USD using the exchange rate.
 * 
 * @param localAmount - Amount in local currency (display amount)
 * @param rate - Exchange rate (1 USD = X local)
 * @returns Amount in USD (display amount)
 */
export function convertToUSD(localAmount: number, rate: number): number {
  if (rate === 0) return 0;
  return localAmount / rate;
}

/**
 * Round amount to a nice display value.
 * Rounds to nearest whole number for most currencies,
 * keeps 2 decimals for currencies with fractional amounts.
 */
export function roundForDisplay(amount: number, currency: string): number {
  const upperCurrency = currency.toUpperCase();
  
  // Zero-decimal currencies (JPY, KRW, etc.) - already whole numbers
  const zeroDecimal = ['JPY', 'KRW', 'VND', 'IDR', 'CLP', 'PYG', 'UGX', 'RWF'];
  if (zeroDecimal.includes(upperCurrency)) {
    return Math.round(amount);
  }
  
  // For most currencies, round to 2 decimal places
  return Math.round(amount * 100) / 100;
}

/**
 * Get $25 USD increments converted to local currency.
 * Returns array of amounts in local currency.
 * 
 * @param rate - Exchange rate (1 USD = X local)
 * @param maxUSD - Maximum USD amount (default 500)
 * @returns Array of local currency amounts
 */
export function getUSD25Increments(
  rate: number,
  currency: string,
  maxUSD: number = 500
): number[] {
  const increments: number[] = [];
  const usdAmounts = [25, 50, 100, 250, 500];
  
  for (const usd of usdAmounts) {
    if (usd <= maxUSD) {
      const local = convertFromUSD(usd, rate);
      increments.push(roundForDisplay(local, currency));
    }
  }
  
  return increments;
}

/**
 * Check if an amount is a valid $25 USD increment.
 * Allows for small rounding differences.
 * 
 * @param localAmount - Amount in local currency
 * @param rate - Exchange rate
 * @returns True if amount is a $25 USD increment
 */
export function isValid25Increment(localAmount: number, rate: number): boolean {
  const usdEquivalent = convertToUSD(localAmount, rate);
  // Check if it's within 1% of a $25 increment
  const remainder = usdEquivalent % 25;
  const tolerance = 0.25; // 1% of $25
  return remainder < tolerance || remainder > (25 - tolerance);
}

/**
 * Get the nearest valid $25 USD increments (floor and ceil).
 * 
 * @param localAmount - Amount in local currency
 * @param rate - Exchange rate
 * @param currency - Currency code for rounding
 * @returns [lower, higher] amounts in local currency
 */
export function getNearestIncrements(
  localAmount: number,
  rate: number,
  currency: string
): [number, number] {
  const usdEquivalent = convertToUSD(localAmount, rate);
  const lowerUSD = Math.floor(usdEquivalent / 25) * 25;
  const higherUSD = Math.ceil(usdEquivalent / 25) * 25;
  
  // Ensure minimum of $25
  const finalLowerUSD = Math.max(25, lowerUSD);
  const finalHigherUSD = Math.max(25, higherUSD);
  
  return [
    roundForDisplay(convertFromUSD(finalLowerUSD, rate), currency),
    roundForDisplay(convertFromUSD(finalHigherUSD, rate), currency),
  ];
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  getStripeExchangeRate,
  getCachedRate,
  convertFromUSD,
  convertToUSD,
  roundForDisplay,
  getUSD25Increments,
  isValid25Increment,
  getNearestIncrements,
};

