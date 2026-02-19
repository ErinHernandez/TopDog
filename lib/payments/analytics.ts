/**
 * Payment Analytics
 * 
 * Tracks payment-related metrics for monitoring and future expansion decisions.
 * Implements the metrics defined in the Paystack integration plan:
 * - Users from non-Paystack African countries
 * - Bounce rate on deposit
 * - Support requests for local methods
 * - Revenue potential
 * 
 * @module lib/payments/analytics
 */

import { doc, setDoc, increment, serverTimestamp, collection, addDoc } from 'firebase/firestore';

import { getDb } from '../firebase-utils';
import { serverLogger } from '../logger/serverLogger';

import { isPaystackCountry, PAYSTACK_COUNTRIES } from './types';


// ============================================================================
// TYPES
// ============================================================================

/**
 * African countries not covered by Paystack
 * (potential Flutterwave candidates)
 */
export const NON_PAYSTACK_AFRICAN_COUNTRIES = [
  'TZ', // Tanzania
  'UG', // Uganda
  'RW', // Rwanda
  'ET', // Ethiopia
  'EG', // Egypt
  'SN', // Senegal
  'CI', // Cote d'Ivoire
  'CM', // Cameroon
  'AO', // Angola
  'MZ', // Mozambique
  'ZW', // Zimbabwe
  'ZM', // Zambia
  'MW', // Malawi
  'BW', // Botswana
  'NA', // Namibia
  'SZ', // Eswatini
  'LS', // Lesotho
  'MU', // Mauritius
  'SC', // Seychelles
  'MG', // Madagascar
  'RE', // Reunion
  'TN', // Tunisia
  'MA', // Morocco
  'DZ', // Algeria
  'LY', // Libya
  'SD', // Sudan
] as const;

/**
 * Payment analytics event types
 */
export type PaymentAnalyticsEvent = 
  | 'deposit_page_view'
  | 'deposit_initiated'
  | 'deposit_completed'
  | 'deposit_failed'
  | 'deposit_abandoned'
  | 'withdraw_page_view'
  | 'withdraw_initiated'
  | 'withdraw_completed'
  | 'withdraw_failed'
  | 'local_payment_requested'
  | 'provider_fallback';

/**
 * Analytics event data
 */
export interface PaymentAnalyticsData {
  event: PaymentAnalyticsEvent;
  userId?: string;
  country: string;
  provider: 'stripe' | 'paystack' | 'none';
  currency?: string;
  amount?: number;
  paymentMethod?: string;
  errorCode?: string;
  errorMessage?: string;
  timestamp?: Date;
  sessionId?: string;
  deviceType?: 'mobile' | 'desktop';
  metadata?: Record<string, unknown>;
}

// ============================================================================
// ANALYTICS FUNCTIONS
// ============================================================================

/**
 * Track a payment analytics event
 */
export async function trackPaymentEvent(data: PaymentAnalyticsData): Promise<void> {
  try {
    const eventData = {
      ...data,
      timestamp: serverTimestamp(),
      isAfricanCountry: isAfricanCountry(data.country),
      isPaystackCountry: isPaystackCountry(data.country),
      isNonPaystackAfrican: isNonPaystackAfricanCountry(data.country),
    };
    
    // Store in analytics collection
    const db = getDb();
    await addDoc(collection(db, 'payment_analytics'), eventData);
    
    // Update aggregate counters
    await updateAggregates(data);
  } catch (error) {
    // Don't fail the main operation if analytics fails
    serverLogger.error('PaymentAnalytics failed to track event', error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Update aggregate counters for monitoring
 */
async function updateAggregates(data: PaymentAnalyticsData): Promise<void> {
  const db = getDb();
  const dateStr = new Date().toISOString().split('T')[0];
  if (!dateStr) {
    throw new Error('Failed to format current date as YYYY-MM-DD');
  }
  const today = dateStr; // YYYY-MM-DD
  const month = today.substring(0, 7); // YYYY-MM
  
  // Daily aggregates
  const dailyRef = doc(db, 'payment_analytics_daily', today as string);
  
  const updates: Record<string, unknown> = {
    lastUpdated: serverTimestamp(),
  };
  
  // Count by event type
  updates[`events.${data.event}`] = increment(1);
  
  // Count by country
  updates[`countries.${data.country}`] = increment(1);
  
  // Count by provider
  updates[`providers.${data.provider}`] = increment(1);
  
  // Special tracking for non-Paystack African countries
  if (isNonPaystackAfricanCountry(data.country)) {
    updates['nonPaystackAfricanUsers'] = increment(1);
    
    // Track specific countries
    updates[`nonPaystackAfricanCountries.${data.country}`] = increment(1);
    
    // Track deposit attempts from these countries
    if (data.event === 'deposit_initiated') {
      updates['nonPaystackAfricanDepositAttempts'] = increment(1);
    }
    
    // Track bounces (page view without completion)
    if (data.event === 'deposit_abandoned') {
      updates['nonPaystackAfricanBounces'] = increment(1);
    }
  }
  
  await setDoc(dailyRef, updates, { merge: true });
  
  // Monthly aggregates (for trend analysis)
  const monthlyRef = doc(db, 'payment_analytics_monthly', month);
  await setDoc(monthlyRef, updates, { merge: true });
}

/**
 * Track when a user from a non-Paystack African country tries to deposit
 */
export async function trackNonPaystackAfricanUser(
  country: string,
  userId?: string,
  sessionId?: string
): Promise<void> {
  if (!isNonPaystackAfricanCountry(country)) return;
  
  await trackPaymentEvent({
    event: 'deposit_page_view',
    country,
    userId,
    sessionId,
    provider: 'none',
    metadata: {
      fallbackReason: 'country_not_supported_by_paystack',
      potentialProvider: 'flutterwave',
    },
  });
}

/**
 * Track provider fallback (e.g., Paystack country but Paystack unavailable)
 */
export async function trackProviderFallback(
  originalProvider: 'paystack' | 'stripe',
  fallbackProvider: 'stripe' | 'paystack',
  country: string,
  reason: string,
  userId?: string
): Promise<void> {
  await trackPaymentEvent({
    event: 'provider_fallback',
    country,
    userId,
    provider: fallbackProvider,
    metadata: {
      originalProvider,
      fallbackReason: reason,
    },
  });
}

/**
 * Track local payment method request (for support ticket analysis)
 */
export async function trackLocalPaymentRequest(
  country: string,
  requestedMethod: string,
  userId?: string
): Promise<void> {
  await trackPaymentEvent({
    event: 'local_payment_requested',
    country,
    userId,
    provider: 'none',
    paymentMethod: requestedMethod,
  });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a country is in Africa
 */
export function isAfricanCountry(country: string): boolean {
  const africanCountries = [
    ...PAYSTACK_COUNTRIES,
    ...NON_PAYSTACK_AFRICAN_COUNTRIES,
  ];
  return africanCountries.includes(country as typeof africanCountries[number]);
}

/**
 * Check if a country is African but not covered by Paystack
 */
export function isNonPaystackAfricanCountry(country: string): boolean {
  return NON_PAYSTACK_AFRICAN_COUNTRIES.includes(
    country as typeof NON_PAYSTACK_AFRICAN_COUNTRIES[number]
  );
}

/**
 * Get recommended provider expansion based on country demand
 */
export function getRecommendedExpansionProvider(country: string): string | null {
  // Flutterwave covers most of Sub-Saharan Africa
  if (isNonPaystackAfricanCountry(country)) {
    return 'flutterwave';
  }
  
  // Egypt-specific
  if (country === 'EG') {
    return 'paymob'; // Egypt specialist
  }
  
  return null;
}

// ============================================================================
// THRESHOLDS (from plan)
// ============================================================================

/**
 * Thresholds that trigger Phase 2 evaluation (Flutterwave)
 * Based on the Paystack integration plan
 */
export const EXPANSION_THRESHOLDS = {
  /** Monthly users from non-Paystack African countries */
  monthlyUsers: 500,
  /** Bounce rate on deposit page for non-Paystack Africa */
  bounceRatePercent: 30,
  /** Monthly support requests for local payment methods */
  supportRequests: 50,
  /** Monthly potential revenue from other African countries (USD) */
  revenueUsd: 5000,
} as const;

