/**
 * Age Verification Module
 *
 * Handles age verification for fantasy sports compliance with state-specific
 * minimum age requirements. Provides utilities for calculating age from date
 * of birth and verifying compliance with jurisdiction requirements.
 *
 * Compliance Notes:
 * - Most US states require 18+ for fantasy sports participation
 * - Some states (AL, MO, MT, etc.) require 21+ for paid fantasy sports
 * - Handles edge cases: leap year birthdays, timezone differences
 *
 * @module lib/compliance/ageVerification
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Result of age verification check
 */
export interface AgeVerificationResult {
  /** Whether the user meets the minimum age requirement */
  verified: boolean;
  /** User's current age in years */
  age: number;
  /** Minimum age required for this jurisdiction */
  minimumAge: number;
  /** Jurisdiction code (state or country) */
  jurisdiction: string;
  /** ISO timestamp when verification was performed */
  verifiedAt?: string;
  /** Days until user reaches minimum age (if not verified, null if already verified) */
  daysUntilEligible?: number;
}

/**
 * User data for age verification
 */
export interface UserAgeData {
  /** ISO date string or Date object representing date of birth */
  dateOfBirth?: string | Date;
  /** Whether user has been age verified */
  ageVerified?: boolean;
  /** Timestamp of last age verification */
  ageVerifiedAt?: string | Date;
}

/**
 * List of US states requiring 21+ minimum age
 * Based on state laws regarding paid daily fantasy sports
 */
export const STATES_21_MINIMUM_AGE = new Set<string>([
  'AL', // Alabama
  'AR', // Arkansas
  'CT', // Connecticut
  'FL', // Florida
  'GA', // Georgia
  'KY', // Kentucky
  'LA', // Louisiana
  'MD', // Maryland
  'MA', // Massachusetts
  'MI', // Michigan
  'MN', // Minnesota
  'MO', // Missouri
  'MT', // Montana
  'NE', // Nebraska
  'NH', // New Hampshire
  'NJ', // New Jersey
  'NV', // Nevada
  'NY', // New York
  'OH', // Ohio
  'PA', // Pennsylvania
  'RI', // Rhode Island
  'SC', // South Carolina
  'TN', // Tennessee
  'TX', // Texas
  'VT', // Vermont
  'VA', // Virginia
  'WA', // Washington
  'WV', // West Virginia
  'WI', // Wisconsin
]);

/**
 * List of US states that completely prohibit paid daily fantasy sports
 * Players from these states cannot participate in paid tournaments
 */
export const STATES_PROHIBITED = new Set<string>([
  'AZ', // Arizona - historically prohibited
  'HI', // Hawaii
  'ID', // Idaho
  'IL', // Illinois (as of recent regulations)
  'IA', // Iowa
  'OR', // Oregon
  'WY', // Wyoming
]);

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate the exact age from a date of birth
 *
 * Properly handles:
 * - Leap year birthdays
 * - Timezone differences
 * - Edge cases around birthday
 *
 * @param dateOfBirth - Date of birth as Date object or ISO string
 * @returns Age in years as integer
 * @throws Error if date is invalid or in the future
 *
 * @example
 * ```ts
 * const age = calculateAge(new Date('2005-03-15'));
 * // Returns 19 (as of 2024)
 *
 * const age = calculateAge('2006-02-29'); // Leap year birthday
 * // Returns 18 (as of 2024)
 * ```
 */
export function calculateAge(dateOfBirth: Date | string): number {
  // Parse input
  const birthDate = typeof dateOfBirth === 'string'
    ? new Date(dateOfBirth)
    : dateOfBirth;

  // Validate date
  if (isNaN(birthDate.getTime())) {
    throw new Error('Invalid date of birth');
  }

  // Check date is not in the future
  const now = new Date();
  if (birthDate > now) {
    throw new Error('Date of birth cannot be in the future');
  }

  // Calculate age using UTC to avoid timezone issues
  const today = new Date();
  const birthYear = birthDate.getUTCFullYear();
  const birthMonth = birthDate.getUTCMonth();
  const birthDay = birthDate.getUTCDate();

  const currentYear = today.getUTCFullYear();
  const currentMonth = today.getUTCMonth();
  const currentDay = today.getUTCDate();

  let age = currentYear - birthYear;

  // Adjust if birthday hasn't occurred yet this year
  if (currentMonth < birthMonth || (currentMonth === birthMonth && currentDay < birthDay)) {
    age--;
  }

  return age;
}

/**
 * Determine minimum age requirement based on jurisdiction
 *
 * @param jurisdiction - US state code (e.g., 'CA', 'TX') or country code
 * @returns Minimum age requirement (18 or 21)
 */
export function getMinimumAgeForJurisdiction(jurisdiction: string): number {
  const stateCode = jurisdiction.toUpperCase();

  // Check if state requires 21+ minimum
  if (STATES_21_MINIMUM_AGE.has(stateCode)) {
    return 21;
  }

  // Default to 18 for other jurisdictions
  return 18;
}

/**
 * Check if a state prohibits paid fantasy sports entirely
 *
 * @param jurisdiction - US state code
 * @returns True if state prohibits paid fantasy sports
 */
export function isJurisdictionProhibited(jurisdiction: string): boolean {
  const stateCode = jurisdiction.toUpperCase();
  return STATES_PROHIBITED.has(stateCode);
}

/**
 * Calculate days until user reaches minimum age
 *
 * @param dateOfBirth - Date of birth
 * @param minimumAge - Required minimum age
 * @returns Number of days until eligible, or null if already eligible
 */
export function calculateDaysUntilEligible(
  dateOfBirth: Date | string,
  minimumAge: number
): number | null {
  const birthDate = typeof dateOfBirth === 'string'
    ? new Date(dateOfBirth)
    : dateOfBirth;

  // Find the date when user will reach minimum age
  const eligibleDate = new Date(birthDate);
  eligibleDate.setUTCFullYear(
    eligibleDate.getUTCFullYear() + minimumAge
  );

  const now = new Date();
  const daysUntil = Math.ceil((eligibleDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return daysUntil > 0 ? daysUntil : null;
}

// ============================================================================
// MAIN VERIFICATION FUNCTIONS
// ============================================================================

/**
 * Verify user age against jurisdiction requirements
 *
 * Comprehensive age verification that:
 * 1. Parses and validates the date of birth
 * 2. Calculates current age
 * 3. Checks against jurisdiction-specific minimum age
 * 4. Handles edge cases and errors gracefully
 *
 * @param dateOfBirth - Date of birth as ISO string or Date object
 * @param jurisdiction - Optional state/country code (defaults to 'US')
 * @returns Age verification result
 *
 * @example
 * ```ts
 * // Standard verification
 * const result = verifyAge('2006-05-15', 'CA');
 * if (result.verified) {
 *   console.log(`User is ${result.age} years old and eligible`);
 * }
 *
 * // With state requiring 21+
 * const resultMO = verifyAge('2005-03-20', 'MO');
 * console.log(resultMO.minimumAge); // 21
 *
 * // User not yet eligible
 * const resultFuture = verifyAge('2010-01-01', 'TX');
 * if (!resultFuture.verified) {
 *   console.log(`Please wait ${resultFuture.daysUntilEligible} days`);
 * }
 * ```
 */
export function verifyAge(
  dateOfBirth: Date | string,
  jurisdiction: string = 'US'
): AgeVerificationResult {
  try {
    // Parse date of birth
    const birthDate = typeof dateOfBirth === 'string'
      ? new Date(dateOfBirth)
      : dateOfBirth;

    // Validate date
    if (isNaN(birthDate.getTime())) {
      return {
        verified: false,
        age: 0,
        minimumAge: getMinimumAgeForJurisdiction(jurisdiction),
        jurisdiction,
        verifiedAt: new Date().toISOString(),
      };
    }

    // Check if date is in the future
    const now = new Date();
    if (birthDate > now) {
      return {
        verified: false,
        age: 0,
        minimumAge: getMinimumAgeForJurisdiction(jurisdiction),
        jurisdiction,
        verifiedAt: new Date().toISOString(),
      };
    }

    // Calculate age
    const age = calculateAge(birthDate);
    const minimumAge = getMinimumAgeForJurisdiction(jurisdiction);
    const verified = age >= minimumAge;

    return {
      verified,
      age,
      minimumAge,
      jurisdiction: jurisdiction.toUpperCase(),
      verifiedAt: new Date().toISOString(),
      daysUntilEligible: verified ? undefined : (calculateDaysUntilEligible(birthDate, minimumAge) ?? undefined),
    };
  } catch (error) {
    // Handle unexpected errors gracefully
    const minimumAge = getMinimumAgeForJurisdiction(jurisdiction);
    return {
      verified: false,
      age: 0,
      minimumAge,
      jurisdiction: jurisdiction.toUpperCase(),
      verifiedAt: new Date().toISOString(),
    };
  }
}

/**
 * Check if user's age has been verified
 *
 * Simple utility to check if user object has age verification flag set.
 * Does not re-verify age - only checks if verification flag exists.
 *
 * @param user - User object with optional age verification fields
 * @returns True if user is marked as age verified
 *
 * @example
 * ```ts
 * const user = { ageVerified: true };
 * if (isAgeVerified(user)) {
 *   console.log('User is age verified');
 * }
 * ```
 */
export function isAgeVerified(user: UserAgeData | undefined | null): boolean {
  if (!user) {
    return false;
  }

  return user.ageVerified === true;
}

/**
 * Validate age verification timestamp is recent
 *
 * Checks if age verification was performed within a certain time window.
 * Useful for re-verification requirements.
 *
 * @param ageVerifiedAt - Timestamp of age verification
 * @param maxAgeMs - Maximum age of verification in milliseconds (default: 1 year)
 * @returns True if verification is still valid
 */
export function isAgeVerificationValid(
  ageVerifiedAt: string | Date | undefined | null,
  maxAgeMs: number = 365 * 24 * 60 * 60 * 1000 // 1 year default
): boolean {
  if (!ageVerifiedAt) {
    return false;
  }

  const verifiedDate = typeof ageVerifiedAt === 'string'
    ? new Date(ageVerifiedAt)
    : ageVerifiedAt;

  if (isNaN(verifiedDate.getTime())) {
    return false;
  }

  const now = new Date();
  const ageOfVerification = now.getTime() - verifiedDate.getTime();

  return ageOfVerification < maxAgeMs;
}
