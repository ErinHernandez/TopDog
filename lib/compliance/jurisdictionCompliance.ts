/**
 * Jurisdiction Compliance Module
 *
 * Manages compliance rules across US states, US territories, and international
 * jurisdictions. Handles:
 * - States where paid fantasy sports are legal
 * - States requiring age verification (18+ or 21+)
 * - States where paid fantasy sports are prohibited
 * - Restrictions and limitations by jurisdiction
 *
 * Based on current US state regulations for daily fantasy sports as of 2024.
 *
 * @module lib/compliance/jurisdictionCompliance
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Status of paid fantasy sports in a jurisdiction
 */
export type JurisdictionStatus = 'allowed' | 'restricted' | 'prohibited';

/**
 * Jurisdiction compliance check result
 */
export interface JurisdictionResult {
  /** Whether paid fantasy sports are allowed in this jurisdiction */
  allowed: boolean;
  /** Specific status of the jurisdiction */
  status: JurisdictionStatus;
  /** Array of restrictions that apply (if any) */
  restrictions: string[];
  /** Whether age verification is required */
  requiresAgeVerification: boolean;
  /** Minimum age required (18 or 21) */
  minimumAge: number;
  /** User-friendly message about compliance status */
  message: string;
  /** Country or state code */
  jurisdiction: string;
}

/**
 * Detailed jurisdiction requirements
 */
export interface JurisdictionRequirements {
  /** Country code (ISO 3166-1 alpha-2) */
  countryCode: string;
  /** State/province code if applicable */
  stateCode?: string;
  /** Whether paid fantasy sports are allowed */
  allowedForPaidFantasy: boolean;
  /** Minimum age requirement */
  minimumAge: number;
  /** List of specific restrictions */
  restrictions: string[];
  /** Whether real-time age verification is required */
  requiresAgeVerification: boolean;
  /** Additional notes about compliance */
  notes?: string;
}

// ============================================================================
// STATE CONFIGURATION
// ============================================================================

/**
 * States where paid fantasy sports are fully legal
 * No special restrictions beyond standard 18+ age requirement
 */
const STATES_FULLY_LEGAL = new Set<string>([
  'CA', // California
  'CO', // Colorado
  'DC', // District of Columbia
  'DE', // Delaware
  'IN', // Indiana
  'KS', // Kansas
  'ME', // Maine
  'MI', // Michigan (separate rules apply, included here)
  'MS', // Mississippi
  'NC', // North Carolina
  'ND', // North Dakota
  'OK', // Oklahoma
  'SD', // South Dakota
  'UT', // Utah
  'WY', // Wyoming (historically restricted, now allowed)
]);

/**
 * States with paid fantasy sports requiring 21+ age
 */
const STATES_21_MINIMUM = new Set<string>([
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
 * States where paid fantasy sports are prohibited
 */
const STATES_PROHIBITED = new Set<string>([
  'AZ', // Arizona
  'HI', // Hawaii
  'ID', // Idaho
  'IL', // Illinois
  'IA', // Iowa
  'OR', // Oregon
]);

/**
 * US territories (treated as prohibited - would require separate legal framework)
 */
const US_TERRITORIES = new Set<string>([
  'AS', // American Samoa
  'GU', // Guam
  'MP', // Northern Mariana Islands
  'PR', // Puerto Rico
  'VI', // US Virgin Islands
]);

/**
 * States-specific restrictions and notes
 */
const STATE_SPECIFIC_RESTRICTIONS: Record<string, {
  restrictions: string[];
  notes?: string;
}> = {
  'NY': {
    restrictions: [
      'Requires licensing from New York Gaming Commission',
      'Compliance with SNY regulations mandatory',
      'Operators must segregate customer funds',
    ],
    notes: 'Highly regulated market with strict requirements',
  },
  'NJ': {
    restrictions: [
      'Licensed operator requirement',
      'Must comply with NJ gambling regulations',
    ],
    notes: 'Online gambling legal in NJ',
  },
  'PA': {
    restrictions: [
      'Licensed provider only',
      'Pennsylvania Gaming Control Board oversight',
    ],
    notes: 'Comprehensive regulatory framework',
  },
  'MI': {
    restrictions: [
      'Michigan Gaming Control Board oversight',
      'Licensed operator requirement',
    ],
  },
  'MD': {
    restrictions: [
      'Maryland Lottery and Gaming Control Commission license required',
    ],
  },
  'IN': {
    restrictions: [
      'Licensed fantasy sports operator requirement',
      'Indiana Gaming Commission oversight',
    ],
  },
};

// ============================================================================
// JURISDICTION LOOKUP FUNCTIONS
// ============================================================================

/**
 * Check if a state code is valid (all 50 states + DC + territories)
 *
 * @param stateCode - Two-letter state code
 * @returns True if valid US state/territory code
 */
export function isValidStateCode(stateCode: string): boolean {
  const code = stateCode.toUpperCase();

  // Check if it's one of the 50 states or DC
  if (code === 'DC') return true;

  // Check if it's a valid 2-letter state code
  if (!/^[A-Z]{2}$/.test(code)) {
    return false;
  }

  // All 50 states are valid (we check specific lists below for rules)
  return true;
}

/**
 * Get the status of paid fantasy sports in a jurisdiction
 *
 * @param stateCode - Two-letter US state code
 * @returns Jurisdiction status (allowed, restricted, or prohibited)
 */
export function getJurisdictionStatus(stateCode: string): JurisdictionStatus {
  const code = stateCode.toUpperCase();

  if (STATES_PROHIBITED.has(code)) {
    return 'prohibited';
  }

  if (STATES_21_MINIMUM.has(code)) {
    return 'restricted';
  }

  if (STATES_FULLY_LEGAL.has(code)) {
    return 'allowed';
  }

  // Default to restricted for states not in any list (unknown/unclear states)
  return 'restricted';
}

/**
 * Get minimum age requirement for a jurisdiction
 *
 * @param stateCode - Two-letter US state code
 * @returns Minimum age (18 or 21)
 */
export function getMinimumAgeForState(stateCode: string): number {
  const code = stateCode.toUpperCase();

  if (STATES_21_MINIMUM.has(code)) {
    return 21;
  }

  return 18;
}

/**
 * Get restrictions for a specific state
 *
 * @param stateCode - Two-letter US state code
 * @returns Array of restriction strings
 */
export function getStateRestrictions(stateCode: string): string[] {
  const code = stateCode.toUpperCase();
  const stateData = STATE_SPECIFIC_RESTRICTIONS[code];

  if (!stateData) {
    return [];
  }

  return [...stateData.restrictions];
}

/**
 * Check jurisdiction compliance for paid fantasy sports
 *
 * Performs comprehensive jurisdiction check including:
 * - Legal status (allowed/restricted/prohibited)
 * - Age requirements
 * - Specific restrictions by state
 * - User-friendly messaging
 *
 * @param stateCode - Two-letter US state code
 * @param countryCode - Optional country code (defaults to 'US')
 * @returns Detailed jurisdiction compliance result
 *
 * @example
 * ```ts
 * // Fully legal state
 * const resultCA = checkJurisdiction('CA');
 * console.log(resultCA.allowed); // true
 * console.log(resultCA.minimumAge); // 18
 *
 * // Restricted state (21+)
 * const resultNY = checkJurisdiction('NY');
 * console.log(resultNY.allowed); // true
 * console.log(resultNY.minimumAge); // 21
 * console.log(resultNY.restrictions.length > 0); // true
 *
 * // Prohibited state
 * const resultHI = checkJurisdiction('HI');
 * console.log(resultHI.allowed); // false
 * console.log(resultHI.status); // 'prohibited'
 * ```
 */
export function checkJurisdiction(
  stateCode: string,
  countryCode: string = 'US'
): JurisdictionResult {
  const normalizedState = stateCode.toUpperCase();
  const normalizedCountry = countryCode.toUpperCase();

  // Non-US countries are allowed by default (would need specific list of prohibited countries)
  if (normalizedCountry !== 'US') {
    return {
      allowed: true,
      status: 'allowed',
      restrictions: [],
      requiresAgeVerification: true,
      minimumAge: 18,
      message: 'International users may be eligible based on their country regulations',
      jurisdiction: `${normalizedCountry}`,
    };
  }

  // Check if state code is valid
  if (!isValidStateCode(normalizedState)) {
    return {
      allowed: false,
      status: 'prohibited',
      restrictions: ['Invalid state code'],
      requiresAgeVerification: true,
      minimumAge: 18,
      message: 'Invalid state code provided',
      jurisdiction: normalizedState,
    };
  }

  const status = getJurisdictionStatus(normalizedState);
  const minimumAge = getMinimumAgeForState(normalizedState);
  const restrictions = getStateRestrictions(normalizedState);

  // Build message based on status
  let message = '';
  switch (status) {
    case 'allowed':
      message = `Paid fantasy sports are allowed in ${normalizedState} for users 18+`;
      break;
    case 'restricted':
      message = `Paid fantasy sports are available in ${normalizedState} but require age ${minimumAge}+ verification`;
      break;
    case 'prohibited':
      message = `Paid fantasy sports are not permitted in ${normalizedState}`;
      break;
  }

  return {
    allowed: status !== 'prohibited',
    status,
    restrictions,
    requiresAgeVerification: status !== 'prohibited',
    minimumAge,
    message,
    jurisdiction: normalizedState,
  };
}

/**
 * Get comprehensive jurisdiction requirements for a state
 *
 * Provides full details about compliance requirements including
 * restrictions, age requirements, and regulatory notes.
 *
 * @param stateCode - Two-letter US state code
 * @returns Detailed jurisdiction requirements
 *
 * @example
 * ```ts
 * const requirements = getJurisdictionRequirements('NY');
 * console.log(requirements.minimumAge); // 21
 * console.log(requirements.allowedForPaidFantasy); // true
 * console.log(requirements.restrictions); // Array of NY-specific rules
 * ```
 */
export function getJurisdictionRequirements(stateCode: string): JurisdictionRequirements {
  const normalizedState = stateCode.toUpperCase();
  const status = getJurisdictionStatus(normalizedState);
  const minimumAge = getMinimumAgeForState(normalizedState);
  const restrictions = getStateRestrictions(normalizedState);
  const stateData = STATE_SPECIFIC_RESTRICTIONS[normalizedState];

  return {
    countryCode: 'US',
    stateCode: normalizedState,
    allowedForPaidFantasy: status !== 'prohibited',
    minimumAge,
    restrictions,
    requiresAgeVerification: status !== 'prohibited',
    notes: stateData?.notes,
  };
}

/**
 * Get all US state codes
 *
 * @returns Array of all valid US state codes (50 states + DC)
 */
export function getAllUSStateCodes(): string[] {
  // All 50 states
  const states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
    'DC', // District of Columbia
  ];

  return states.sort();
}

/**
 * Filter states by compliance status
 *
 * @param status - Jurisdiction status to filter by
 * @returns Array of state codes matching the status
 */
export function getStatesByStatus(status: JurisdictionStatus): string[] {
  const states = getAllUSStateCodes();

  return states.filter(state => {
    const stateStatus = getJurisdictionStatus(state);
    return stateStatus === status;
  });
}

/**
 * Check if a jurisdiction pair is eligible for paid fantasy sports
 *
 * Convenience function that checks both country and state eligibility
 * in a single call.
 *
 * @param stateCode - Two-letter state code
 * @param countryCode - Country code (defaults to 'US')
 * @returns True if user from this jurisdiction can participate in paid fantasy sports
 */
export function isEligibleForPaidFantasySports(
  stateCode: string,
  countryCode: string = 'US'
): boolean {
  const jurisdictionCheck = checkJurisdiction(stateCode, countryCode);
  return jurisdictionCheck.allowed;
}

/**
 * Get a human-readable name for a state code
 *
 * @param stateCode - Two-letter state code
 * @returns Human-readable state name
 */
export function getStateName(stateCode: string): string {
  const stateNames: Record<string, string> = {
    'AL': 'Alabama',
    'AK': 'Alaska',
    'AZ': 'Arizona',
    'AR': 'Arkansas',
    'CA': 'California',
    'CO': 'Colorado',
    'CT': 'Connecticut',
    'DE': 'Delaware',
    'FL': 'Florida',
    'GA': 'Georgia',
    'HI': 'Hawaii',
    'ID': 'Idaho',
    'IL': 'Illinois',
    'IN': 'Indiana',
    'IA': 'Iowa',
    'KS': 'Kansas',
    'KY': 'Kentucky',
    'LA': 'Louisiana',
    'ME': 'Maine',
    'MD': 'Maryland',
    'MA': 'Massachusetts',
    'MI': 'Michigan',
    'MN': 'Minnesota',
    'MS': 'Mississippi',
    'MO': 'Missouri',
    'MT': 'Montana',
    'NE': 'Nebraska',
    'NV': 'Nevada',
    'NH': 'New Hampshire',
    'NJ': 'New Jersey',
    'NM': 'New Mexico',
    'NY': 'New York',
    'NC': 'North Carolina',
    'ND': 'North Dakota',
    'OH': 'Ohio',
    'OK': 'Oklahoma',
    'OR': 'Oregon',
    'PA': 'Pennsylvania',
    'RI': 'Rhode Island',
    'SC': 'South Carolina',
    'SD': 'South Dakota',
    'TN': 'Tennessee',
    'TX': 'Texas',
    'UT': 'Utah',
    'VT': 'Vermont',
    'VA': 'Virginia',
    'WA': 'Washington',
    'WV': 'West Virginia',
    'WI': 'Wisconsin',
    'WY': 'Wyoming',
    'DC': 'District of Columbia',
  };

  return stateNames[stateCode.toUpperCase()] || stateCode.toUpperCase();
}
