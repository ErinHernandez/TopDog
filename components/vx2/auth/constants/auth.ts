/**
 * VX2 Auth Constants
 * 
 * Configuration and constants for the authentication system.
 * All magic numbers and strings should live here.
 */

// ============================================================================
// USERNAME CONSTRAINTS
// ============================================================================

export const USERNAME_CONSTRAINTS = {
  /** Minimum username length */
  MIN_LENGTH: 3,
  /** Maximum username length */
  MAX_LENGTH: 18,
  /** Minimum length for display purposes */
  MIN_DISPLAY_LENGTH: 2,
  /** Debounce delay for validation (ms) */
  VALIDATION_DEBOUNCE_MS: 300,
  /** Debounce delay for availability check (ms) */
  AVAILABILITY_DEBOUNCE_MS: 500,
} as const;

/**
 * Reserved usernames that cannot be registered
 * These are system-reserved or could cause confusion
 */
export const RESERVED_USERNAMES = new Set([
  // System
  'admin', 'administrator', 'root', 'system', 'bot',
  'moderator', 'mod', 'support', 'help', 'info',
  'api', 'www', 'web', 'app', 'mobile',
  
  // Brand
  'topdog', 'top_dog', 'top-dog', 'topdogfantasy',
  'bestball', 'best_ball', 'best-ball',
  'draftkings', 'underdog', 'sleeper', 'fanduel',
  
  // Common offensive terms (basic filter)
  'test', 'null', 'undefined', 'anonymous',
  'deleted', 'banned', 'suspended',
  
  // Reserved for future use
  'official', 'verified', 'staff', 'team',
  'news', 'blog', 'store', 'shop',
]) as ReadonlySet<string>;

// ============================================================================
// PASSWORD CONSTRAINTS
// ============================================================================

export const PASSWORD_CONSTRAINTS = {
  /** Minimum password length */
  MIN_LENGTH: 8,
  /** Maximum password length */
  MAX_LENGTH: 128,
  /** Require at least one uppercase letter */
  REQUIRE_UPPERCASE: true,
  /** Require at least one lowercase letter */
  REQUIRE_LOWERCASE: true,
  /** Require at least one number */
  REQUIRE_NUMBER: true,
  /** Require at least one special character */
  REQUIRE_SPECIAL: false,
} as const;

// ============================================================================
// PHONE AUTH CONSTRAINTS
// ============================================================================

export const PHONE_CONSTRAINTS = {
  /** OTP code length */
  OTP_LENGTH: 6,
  /** OTP expiry time (seconds) */
  OTP_EXPIRY_SECONDS: 300,
  /** Maximum resend attempts */
  MAX_RESEND_ATTEMPTS: 3,
  /** Cooldown between resends (seconds) */
  RESEND_COOLDOWN_SECONDS: 60,
} as const;

// ============================================================================
// RATE LIMITING
// ============================================================================

export const RATE_LIMITS = {
  /** Max login attempts before lockout */
  MAX_LOGIN_ATTEMPTS: 5,
  /** Lockout duration (minutes) */
  LOCKOUT_DURATION_MINUTES: 15,
  /** Max password reset requests per hour */
  MAX_PASSWORD_RESET_PER_HOUR: 3,
  /** Max username changes per year */
  MAX_USERNAME_CHANGES_PER_YEAR: 2,
} as const;

// ============================================================================
// SESSION & TOKEN CONFIG
// ============================================================================

export const SESSION_CONFIG = {
  /** Session timeout (ms) - 24 hours */
  SESSION_TIMEOUT_MS: 24 * 60 * 60 * 1000,
  /** Token refresh threshold (ms) - 5 minutes */
  TOKEN_REFRESH_THRESHOLD_MS: 5 * 60 * 1000,
  /** Remember me duration (days) */
  REMEMBER_ME_DAYS: 30,
} as const;

// ============================================================================
// VIP CONFIG
// ============================================================================

export const VIP_CONFIG = {
  /** Default reservation expiry (days) */
  DEFAULT_RESERVATION_EXPIRY_DAYS: 90,
  /** Maximum reservations per admin */
  MAX_RESERVATIONS_PER_ADMIN: 100,
  /** Reservation cleanup interval (hours) */
  CLEANUP_INTERVAL_HOURS: 24,
} as const;

// ============================================================================
// VALIDATION PATTERNS
// ============================================================================

export const VALIDATION_PATTERNS = {
  /** Email regex pattern */
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  /** Phone number pattern (E.164 format) */
  PHONE_E164: /^\+[1-9]\d{1,14}$/,
  /** Username base pattern (alphanumeric + underscore) */
  USERNAME_BASE: /^[a-zA-Z0-9_]+$/,
  /** No consecutive underscores */
  NO_CONSECUTIVE_UNDERSCORES: /^(?!.*__)/,
  /** Must start with letter */
  STARTS_WITH_LETTER: /^[a-zA-Z]/,
  /** No spaces */
  NO_SPACES: /^\S+$/,
} as const;

// ============================================================================
// ERROR CODES
// ============================================================================

export const AUTH_ERROR_CODES = {
  // Firebase Auth errors
  EMAIL_ALREADY_IN_USE: 'auth/email-already-in-use',
  INVALID_EMAIL: 'auth/invalid-email',
  OPERATION_NOT_ALLOWED: 'auth/operation-not-allowed',
  WEAK_PASSWORD: 'auth/weak-password',
  USER_DISABLED: 'auth/user-disabled',
  USER_NOT_FOUND: 'auth/user-not-found',
  WRONG_PASSWORD: 'auth/wrong-password',
  TOO_MANY_REQUESTS: 'auth/too-many-requests',
  NETWORK_REQUEST_FAILED: 'auth/network-request-failed',
  INVALID_VERIFICATION_CODE: 'auth/invalid-verification-code',
  INVALID_VERIFICATION_ID: 'auth/invalid-verification-id',
  CODE_EXPIRED: 'auth/code-expired',
  
  // Custom errors
  USERNAME_TAKEN: 'auth/username-taken',
  USERNAME_INVALID: 'auth/username-invalid',
  USERNAME_RESERVED: 'auth/username-reserved',
  USERNAME_VIP_RESERVED: 'auth/username-vip-reserved',
  PROFILE_NOT_FOUND: 'auth/profile-not-found',
  PROFILE_INCOMPLETE: 'auth/profile-incomplete',
  RATE_LIMITED: 'auth/rate-limited',
  SESSION_EXPIRED: 'auth/session-expired',
  COUNTRY_NOT_ALLOWED: 'auth/country-not-allowed',
} as const;

// ============================================================================
// ERROR MESSAGES
// ============================================================================

export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  [AUTH_ERROR_CODES.EMAIL_ALREADY_IN_USE]: 'This email is already registered.',
  [AUTH_ERROR_CODES.INVALID_EMAIL]: 'Please enter a valid email address.',
  [AUTH_ERROR_CODES.WEAK_PASSWORD]: 'Password must be at least 8 characters.',
  [AUTH_ERROR_CODES.USER_DISABLED]: 'This account has been disabled.',
  [AUTH_ERROR_CODES.USER_NOT_FOUND]: 'No account found with this email.',
  [AUTH_ERROR_CODES.WRONG_PASSWORD]: 'Incorrect password.',
  [AUTH_ERROR_CODES.TOO_MANY_REQUESTS]: 'Too many attempts. Please try again later.',
  [AUTH_ERROR_CODES.NETWORK_REQUEST_FAILED]: 'Network error. Please check your connection.',
  [AUTH_ERROR_CODES.INVALID_VERIFICATION_CODE]: 'Invalid verification code.',
  [AUTH_ERROR_CODES.CODE_EXPIRED]: 'Verification code has expired.',
  [AUTH_ERROR_CODES.USERNAME_TAKEN]: 'This username is already taken.',
  [AUTH_ERROR_CODES.USERNAME_INVALID]: 'Username contains invalid characters.',
  [AUTH_ERROR_CODES.USERNAME_RESERVED]: 'This username is reserved.',
  [AUTH_ERROR_CODES.USERNAME_VIP_RESERVED]: 'This username is reserved for a VIP user.',
  [AUTH_ERROR_CODES.PROFILE_NOT_FOUND]: 'User profile not found.',
  [AUTH_ERROR_CODES.RATE_LIMITED]: 'Too many requests. Please wait before trying again.',
  [AUTH_ERROR_CODES.SESSION_EXPIRED]: 'Your session has expired. Please sign in again.',
  [AUTH_ERROR_CODES.COUNTRY_NOT_ALLOWED]: 'This service is not available in your country.',
};

/**
 * Get human-readable error message
 */
export function getAuthErrorMessage(code: string): string {
  return AUTH_ERROR_MESSAGES[code] || 'An unexpected error occurred. Please try again.';
}

// ============================================================================
// UI CONSTANTS
// ============================================================================

export const AUTH_UI = {
  /** Input field sizes */
  INPUT_SIZES: {
    sm: { height: 36, fontSize: 14 },
    md: { height: 44, fontSize: 16 },
    lg: { height: 52, fontSize: 18 },
  },
  /** Animation durations (ms) */
  ANIMATION: {
    fast: 150,
    normal: 250,
    slow: 350,
  },
  /** Form step transition delay (ms) */
  STEP_TRANSITION_DELAY: 200,
} as const;

// ============================================================================
// STORAGE KEYS
// ============================================================================

export const STORAGE_KEYS = {
  /** Remember me preference */
  REMEMBER_ME: 'topdog_auth_remember_me',
  /** Last used email */
  LAST_EMAIL: 'topdog_auth_last_email',
  /** Auth state persistence */
  AUTH_PERSISTENCE: 'topdog_auth_persistence',
  /** Username draft (for interrupted signups) */
  USERNAME_DRAFT: 'topdog_auth_username_draft',
} as const;

