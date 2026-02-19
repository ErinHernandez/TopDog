/**
 * Location Services
 * 
 * Enterprise-grade location tracking for draft security and customization.
 */

// Types
export type {
  ConsentStatus,
  LocationConsent,
  UserLocations,
  LocationRecord,
  KnownLocation,
  LastLoginLocation,
  SuspiciousAttempt,
  SecurityCheck,
  GeoLocation,
  UserLocationDocument,
  ConsentModalContext,
  ConsentModalConfig,
} from './types';

export {
  CONSENT_MODAL_CONFIGS,
  DEFAULT_CONSENT,
  DEFAULT_LOCATIONS,
} from './types';

// Consent Management
export {
  getConsent,
  updateConsent,
  incrementPromptCount,
  shouldShowPrompt,
  isConsentGranted,
  revokeConsent,
  resetConsent,
} from './consentManager';

// Geolocation
export {
  getBrowserLocation,
  getIPLocation,
  getCurrentLocation,
  getLocationSilent,
  formatLocationCode,
  isValidLocation,
} from './geolocationProvider';

// Location Service
export {
  trackLocation,
  getUserLocations,
  getKnownLocations,
  markLocationTrusted,
  untrustLocation,
  getUnlockedFlags,
} from './locationService';

// Security Service
export {
  checkLoginSecurity,
  logSuspiciousAttempt,
  getSuspiciousAttempts,
  analyzeAccountSharing,
} from './securityService';

export type { AccountSharingIndicators } from './securityService';
