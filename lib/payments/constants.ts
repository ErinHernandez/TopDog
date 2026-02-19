/**
 * Payment Constants
 *
 * Centralized constants for payment-related operations.
 * Extracted from various payment service files to improve maintainability.
 *
 * @module lib/payments/constants
 */

// ============================================================================
// TIME-RELATED CONSTANTS
// ============================================================================

/** Minutes until confirmation code expires */
export const CONFIRMATION_CODE_EXPIRATION_MINUTES = 15;

/** Hours until held withdrawal is released */
export const HELD_WITHDRAWAL_DURATION_HOURS = 24;

/** Hours to look back for withdrawal velocity checks */
export const WITHDRAWAL_LOOKBACK_HOURS = 24;

/** Start of unusual hours window (2 AM) */
export const RISK_SCORE_UNUSUAL_HOURS_START = 2;

/** End of unusual hours window (6 AM) */
export const RISK_SCORE_UNUSUAL_HOURS_END = 6;

// ============================================================================
// CONFIRMATION CODE CONSTANTS
// ============================================================================

/** Minimum value for 6-digit confirmation codes */
export const CONFIRMATION_CODE_MIN = 100000;

/** Maximum value for 6-digit confirmation codes */
export const CONFIRMATION_CODE_MAX = 999999;

// ============================================================================
// WITHDRAWAL LIMITS
// ============================================================================

/** Number of withdrawals after which to show warning */
export const WITHDRAWAL_WARNING_THRESHOLD = 2;

/** Maximum withdrawals allowed per day */
export const WITHDRAWAL_MAX_PER_DAY = 3;

// ============================================================================
// RISK ASSESSMENT THRESHOLDS (in cents)
// ============================================================================

/** High amount threshold for risk assessment ($500) */
export const RISK_ASSESSMENT_HIGH_AMOUNT_THRESHOLD = 50000;

/** Very high amount threshold for risk assessment ($1000) */
export const RISK_ASSESSMENT_VERY_HIGH_AMOUNT_THRESHOLD = 100000;

/** Number of transactions to trigger velocity risk flag */
export const RISK_ASSESSMENT_VELOCITY_THRESHOLD = 5;

/** Total amount threshold for high recent activity ($1000) */
export const RISK_ASSESSMENT_HIGH_TOTAL_THRESHOLD = 100000;

// ============================================================================
// RISK SCORE THRESHOLDS
// ============================================================================

/** Risk score at which to decline transaction */
export const RISK_SCORE_DECLINE_THRESHOLD = 50;

/** Risk score at which to flag for review */
export const RISK_SCORE_REVIEW_THRESHOLD = 30;

/** Maximum score for automatic approval */
export const RISK_SCORE_APPROVE_MAX = 30;

/** Maximum score for review recommendation */
export const RISK_SCORE_REVIEW_MAX = 50;

/** Maximum score for challenge recommendation */
export const RISK_SCORE_CHALLENGE_MAX = 70;

/** Maximum score for manual review recommendation */
export const RISK_SCORE_MANUAL_REVIEW_MAX = 90;

/** Maximum possible risk score */
export const RISK_SCORE_MAX = 100;

// ============================================================================
// RISK SCORE FACTORS
// ============================================================================

/** Divisor for round amount detection ($100) */
export const RISK_SCORE_ROUND_AMOUNT_DIVISOR = 10000;

/** Minimum amount to check for round amounts ($500) */
export const RISK_SCORE_ROUND_AMOUNT_MIN = 50000;

// ============================================================================
// API & TOKEN MANAGEMENT
// ============================================================================

/** Buffer time before Stripe token expiration (60 seconds) */
export const STRIPE_TOKEN_BUFFER_MS = 60000;

/** Buffer time before PayPal token expiration (60 seconds) */
export const PAYPAL_TOKEN_BUFFER_MS = 60000;

/** Limit for Stripe customer list queries */
export const STRIPE_CUSTOMERS_LIST_LIMIT = 1;

// ============================================================================
// CONVERSION MULTIPLIERS
// ============================================================================

/** Multiplier to convert Unix timestamp to milliseconds */
export const UNIX_TIMESTAMP_TO_MS = 1000;

/** Milliseconds per minute */
export const MS_PER_MINUTE = 60 * 1000;

/** Milliseconds per hour */
export const MS_PER_HOUR = 60 * 60 * 1000;

/** Milliseconds per day */
export const MS_PER_DAY = 24 * 60 * 60 * 1000;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert minutes to milliseconds
 */
export function minutesToMs(minutes: number): number {
  return minutes * MS_PER_MINUTE;
}

/**
 * Convert hours to milliseconds
 */
export function hoursToMs(hours: number): number {
  return hours * MS_PER_HOUR;
}

/**
 * Convert days to milliseconds
 */
export function daysToMs(days: number): number {
  return days * MS_PER_DAY;
}

/**
 * Convert cents to dollars
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

/**
 * Convert dollars to cents
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}
