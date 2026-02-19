/**
 * Location Types
 * 
 * Enterprise-grade type definitions for location tracking and security.
 * Part of the customization system for draft room personalization.
 */

import { Timestamp } from 'firebase/firestore';

// ============================================================================
// CONSENT TYPES
// ============================================================================

/**
 * Consent status states:
 * - pending: User hasn't responded yet
 * - granted: User approved location tracking
 * - denied: User explicitly denied
 * - revoked: User revoked previously granted consent
 */
export type ConsentStatus = 'pending' | 'granted' | 'denied' | 'revoked';

export interface LocationConsent {
  status: ConsentStatus;
  grantedAt?: Date | Timestamp;
  revokedAt?: Date | Timestamp;
  promptCount: number;
  lastPromptAt?: Date | Timestamp;
  dontAskAgain: boolean;
}

// ============================================================================
// LOCATION DATA TYPES
// ============================================================================

export interface UserLocations {
  countries: string[];  // ISO country codes: ["US", "CA", "MX"]
  states: string[];     // US state codes only: ["CA", "NY", "TX"]
}

export interface LocationRecord {
  code: string;
  name: string;
  firstSeen: Date | Timestamp;
  lastSeen: Date | Timestamp;
  visitCount: number;
}

// ============================================================================
// SECURITY TYPES
// ============================================================================

export interface KnownLocation {
  code: string;           // Country or "US-STATE" code
  firstSeen: Date | Timestamp;
  lastSeen: Date | Timestamp;
  loginCount: number;
  isTrusted: boolean;     // User marked as "my location"
}

export interface LastLoginLocation {
  code: string;
  timestamp: Date | Timestamp;
  ip?: string;            // Hashed for privacy
}

export interface SuspiciousAttempt {
  code: string;
  timestamp: Date | Timestamp;
  action: 'blocked' | 'warned' | 'allowed';
  reason: string;
}

export interface SecurityCheck {
  isNewLocation: boolean;
  isSuspicious: boolean;
  riskScore: number;  // 0-100
  action: 'allow' | 'warn' | 'verify' | 'block';
}

// ============================================================================
// GEOLOCATION RESULT
// ============================================================================

export interface GeoLocation {
  countryCode: string;
  countryName: string;
  stateCode?: string;   // US only
  stateName?: string;
  source: 'browser' | 'ip' | 'manual';
  accuracy: 'high' | 'medium' | 'low';
}

// ============================================================================
// FIREBASE DOCUMENT STRUCTURE
// ============================================================================

/**
 * Firebase Collection: `userLocations/{userId}`
 */
export interface UserLocationDocument {
  // Consent Management
  consent: {
    status: ConsentStatus;
    grantedAt?: Timestamp;
    revokedAt?: Timestamp;
    promptCount: number;
    lastPromptAt?: Timestamp;
    dontAskAgain: boolean;
  };
  
  // Location History (only populated if consent.status === 'granted')
  locations: {
    countries: string[];
    states: string[];
  };
  
  // Security Tracking
  security: {
    knownLocations: KnownLocation[];
    lastLoginLocation?: LastLoginLocation;
    suspiciousAttempts: SuspiciousAttempt[];
  };
  
  // Metadata
  updatedAt: Timestamp;
  createdAt: Timestamp;
}

// ============================================================================
// CONSENT MODAL CONTEXT
// ============================================================================

export type ConsentModalContext = 
  | 'app_open' 
  | 'draft_room' 
  | 'customization' 
  | 'suspicious';

export interface ConsentModalConfig {
  title: string;
  subtitle: string;
  urgency: 'low' | 'medium' | 'high';
}

export const CONSENT_MODAL_CONFIGS: Record<ConsentModalContext, ConsentModalConfig> = {
  app_open: {
    title: 'Enable Location Features',
    subtitle: 'Enhance your fantasy football experience',
    urgency: 'low',
  },
  draft_room: {
    title: 'Protect Your Draft',
    subtitle: 'Location tracking helps prevent unauthorized picks',
    urgency: 'medium',
  },
  customization: {
    title: 'Unlock Flag Customizations',
    subtitle: 'Collect flags from places you visit',
    urgency: 'low',
  },
  suspicious: {
    title: 'Unusual Activity Detected',
    subtitle: 'Enable location tracking to secure your account',
    urgency: 'high',
  },
};

// ============================================================================
// DEFAULT VALUES
// ============================================================================

export const DEFAULT_CONSENT: LocationConsent = {
  status: 'pending',
  promptCount: 0,
  dontAskAgain: false,
};

export const DEFAULT_LOCATIONS: UserLocations = {
  countries: [],
  states: [],
};
