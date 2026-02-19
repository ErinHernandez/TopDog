/**
 * Display Currency Resolution
 * 
 * Determines which currency to display to a user based on:
 * 1. Manual preference set in settings
 * 2. Currency of most recent deposit
 * 3. Detected local currency based on country
 * 
 * All users (including US) can change their currency preference.
 */

import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

import { getDb } from '../firebase-utils';
import { serverLogger } from '../logger/serverLogger';

import { COUNTRY_TO_CURRENCY, CURRENCY_CONFIG, getCurrencyConfig } from './currencyConfig';


// ============================================================================
// TYPES
// ============================================================================

/**
 * Source of the display currency determination
 */
export type DisplayCurrencySource = 
  | 'preference'       // User manually set in preferences
  | 'last_deposit'     // Based on most recent deposit
  | 'local_detection'; // Based on user's country

/**
 * Result of display currency resolution
 */
export interface DisplayCurrencyResult {
  /** The resolved currency code */
  currency: string;
  /** How the currency was determined */
  source: DisplayCurrencySource;
  /** Whether user can change this currency */
  canChange: boolean;
  /** Currency symbol for display */
  symbol: string;
  /** Full currency name */
  name: string;
}

/**
 * User document fields related to currency
 */
export interface UserCurrencyData {
  /** User's country code */
  country?: string;
  /** Manual display currency preference (null = auto) */
  displayCurrencyPreference?: string | null;
  /** Currency of most recent deposit */
  lastDepositCurrency?: string;
  /** Timestamp of last deposit currency update */
  lastDepositCurrencyUpdatedAt?: Date;
}

// ============================================================================
// MAIN RESOLUTION FUNCTION
// ============================================================================

/**
 * Get the display currency for a user.
 * 
 * Resolution order:
 * 1. Manual preference -> Use that currency
 * 2. Last deposit currency -> Use that currency
 * 3. Local detection -> Use country's default currency
 * 
 * All users can change their currency preference.
 * 
 * @param userId - Firebase user ID
 * @param userCountry - User's country code (ISO 3166-1 alpha-2)
 * @returns DisplayCurrencyResult with currency and source information
 */
export async function getDisplayCurrency(
  userId: string,
  userCountry: string
): Promise<DisplayCurrencyResult> {
  const countryUpper = userCountry.toUpperCase();
  
  try {
    // Fetch user data from Firebase
    const db = getDb();
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.exists() ? userDoc.data() as UserCurrencyData : {};
    
    // Priority 1: Manual preference set in settings
    if (userData.displayCurrencyPreference) {
      const preferredCurrency = userData.displayCurrencyPreference.toUpperCase();
      if (CURRENCY_CONFIG[preferredCurrency]) {
        const config = getCurrencyConfig(preferredCurrency);
        return {
          currency: preferredCurrency,
          source: 'preference',
          canChange: true,
          symbol: config.symbol,
          name: config.name,
        };
      }
    }
    
    // Priority 2: Last deposit currency
    if (userData.lastDepositCurrency) {
      const lastCurrency = userData.lastDepositCurrency.toUpperCase();
      if (CURRENCY_CONFIG[lastCurrency]) {
        const config = getCurrencyConfig(lastCurrency);
        return {
          currency: lastCurrency,
          source: 'last_deposit',
          canChange: true,
          symbol: config.symbol,
          name: config.name,
        };
      }
    }
    
    // Priority 3: Local detection based on country
    const localCurrency = COUNTRY_TO_CURRENCY[countryUpper] || 'USD';
    const config = getCurrencyConfig(localCurrency);
    return {
      currency: localCurrency,
      source: 'local_detection',
      canChange: true,
      symbol: config.symbol,
      name: config.name,
    };
  } catch (error: unknown) {
    // Fallback on error - use local detection
    serverLogger.error('Error fetching user data', error instanceof Error ? error : new Error(String(error)));
    const localCurrency = COUNTRY_TO_CURRENCY[countryUpper] || 'USD';
    const config = getCurrencyConfig(localCurrency);
    return {
      currency: localCurrency,
      source: 'local_detection',
      canChange: true,
      symbol: config.symbol,
      name: config.name,
    };
  }
}

/**
 * Synchronous version that uses cached/provided user data.
 * Useful when user data is already loaded.
 */
export function resolveDisplayCurrency(
  userCountry: string,
  userData: UserCurrencyData
): DisplayCurrencyResult {
  const countryUpper = userCountry.toUpperCase();
  
  // Priority 1: Manual preference
  if (userData.displayCurrencyPreference) {
    const preferredCurrency = userData.displayCurrencyPreference.toUpperCase();
    if (CURRENCY_CONFIG[preferredCurrency]) {
      const config = getCurrencyConfig(preferredCurrency);
      return {
        currency: preferredCurrency,
        source: 'preference',
        canChange: true,
        symbol: config.symbol,
        name: config.name,
      };
    }
  }
  
  // Priority 2: Last deposit currency
  if (userData.lastDepositCurrency) {
    const lastCurrency = userData.lastDepositCurrency.toUpperCase();
    if (CURRENCY_CONFIG[lastCurrency]) {
      const config = getCurrencyConfig(lastCurrency);
      return {
        currency: lastCurrency,
        source: 'last_deposit',
        canChange: true,
        symbol: config.symbol,
        name: config.name,
      };
    }
  }
  
  // Priority 3: Local detection
  const localCurrency = COUNTRY_TO_CURRENCY[countryUpper] || 'USD';
  const config = getCurrencyConfig(localCurrency);
  return {
    currency: localCurrency,
    source: 'local_detection',
    canChange: true,
    symbol: config.symbol,
    name: config.name,
  };
}

// ============================================================================
// PREFERENCE MANAGEMENT
// ============================================================================

/**
 * Set the user's display currency preference.
 * 
 * @param userId - Firebase user ID
 * @param userCountry - User's country code (used for logging/analytics)
 * @param currency - Currency code to set, or null to reset to auto mode
 * @throws Error if currency is not supported
 */
export async function setDisplayCurrencyPreference(
  userId: string,
  userCountry: string,
  currency: string | null
): Promise<void> {
  // Validate currency if provided
  if (currency !== null) {
    const currencyUpper = currency.toUpperCase();
    if (!CURRENCY_CONFIG[currencyUpper]) {
      throw new Error(`Unsupported currency: ${currency}`);
    }
  }
  
  const db = getDb();
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    displayCurrencyPreference: currency ? currency.toUpperCase() : null,
    displayCurrencyPreferenceUpdatedAt: serverTimestamp(),
  });
}

/**
 * Reset user's display currency to auto mode (follows last deposit).
 */
export async function resetDisplayCurrencyPreference(
  userId: string,
  userCountry: string
): Promise<void> {
  return setDisplayCurrencyPreference(userId, userCountry, null);
}

/**
 * Update user's last deposit currency (called from webhook).
 * This is used to automatically update the display currency on deposit.
 */
export async function updateLastDepositCurrency(
  userId: string,
  currency: string
): Promise<void> {
  const currencyUpper = currency.toUpperCase();
  
  if (!CURRENCY_CONFIG[currencyUpper]) {
    serverLogger.warn(`Unknown currency on deposit: ${currency}`);
    return;
  }
  
  const db = getDb();
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    lastDepositCurrency: currencyUpper,
    lastDepositCurrencyUpdatedAt: serverTimestamp(),
  });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if a user can change their display currency.
 * All users can now change their currency preference.
 */
export function canChangeCurrency(userCountry: string): boolean {
  // All users can change currency (userCountry kept for API compatibility)
  return true;
}

/**
 * Get the source label for display in UI.
 */
export function getSourceLabel(source: DisplayCurrencySource): string {
  switch (source) {
    case 'preference':
      return 'Manually set';
    case 'last_deposit':
      return 'Based on your last deposit';
    case 'local_detection':
      return 'Based on your location';
    default:
      return '';
  }
}

/**
 * Get currency data for API responses.
 */
export function getCurrencyDisplayData(currency: string): {
  code: string;
  symbol: string;
  name: string;
  decimals: number;
} {
  const config = getCurrencyConfig(currency);
  return {
    code: config.code,
    symbol: config.symbol,
    name: config.name,
    decimals: config.decimals,
  };
}

