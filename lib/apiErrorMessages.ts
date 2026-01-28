/**
 * Standardized API Error Messages
 *
 * Centralized error message definitions for consistent user-facing messages
 * across all API endpoints. Messages are designed to be:
 * - User-friendly (no technical jargon)
 * - Actionable (tell user what to do)
 * - Consistent (same issue = same message)
 *
 * @module lib/apiErrorMessages
 */

// ============================================================================
// ERROR MESSAGE CONSTANTS
// ============================================================================

/**
 * Authentication error messages
 */
export const AUTH_ERRORS = {
  /** User is not authenticated */
  UNAUTHENTICATED: 'Please sign in to continue.',
  /** Token is expired */
  TOKEN_EXPIRED: 'Your session has expired. Please sign in again.',
  /** Token is invalid */
  TOKEN_INVALID: 'Invalid authentication. Please sign in again.',
  /** User is authenticated but lacks permission */
  FORBIDDEN: 'You do not have permission to perform this action.',
  /** Account is disabled or suspended */
  ACCOUNT_DISABLED: 'Your account has been disabled. Contact support for assistance.',
  /** Email not verified */
  EMAIL_NOT_VERIFIED: 'Please verify your email address to continue.',
} as const;

/**
 * Validation error messages
 */
export const VALIDATION_ERRORS = {
  /** Generic validation failure */
  INVALID_INPUT: 'Please check your input and try again.',
  /** Required field missing */
  REQUIRED_FIELD: (field: string) => `${field} is required.`,
  /** Field too short */
  TOO_SHORT: (field: string, min: number) => `${field} must be at least ${min} characters.`,
  /** Field too long */
  TOO_LONG: (field: string, max: number) => `${field} cannot exceed ${max} characters.`,
  /** Invalid format */
  INVALID_FORMAT: (field: string) => `${field} format is invalid.`,
  /** Value out of range */
  OUT_OF_RANGE: (field: string, min: number, max: number) =>
    `${field} must be between ${min} and ${max}.`,
  /** Invalid email */
  INVALID_EMAIL: 'Please enter a valid email address.',
  /** Invalid username */
  INVALID_USERNAME: 'Username can only contain letters, numbers, and underscores.',
  /** Username taken */
  USERNAME_TAKEN: 'This username is already taken. Please choose another.',
  /** Email taken */
  EMAIL_TAKEN: 'An account with this email already exists.',
  /** Invalid amount */
  INVALID_AMOUNT: 'Please enter a valid amount.',
  /** Amount too low */
  AMOUNT_TOO_LOW: (min: string) => `Minimum amount is ${min}.`,
  /** Amount too high */
  AMOUNT_TOO_HIGH: (max: string) => `Maximum amount is ${max}.`,
} as const;

/**
 * Resource error messages
 */
export const RESOURCE_ERRORS = {
  /** Generic not found */
  NOT_FOUND: 'The requested resource was not found.',
  /** User not found */
  USER_NOT_FOUND: 'User not found.',
  /** Draft not found */
  DRAFT_NOT_FOUND: 'Draft room not found.',
  /** Tournament not found */
  TOURNAMENT_NOT_FOUND: 'Tournament not found.',
  /** Player not found */
  PLAYER_NOT_FOUND: 'Player not found.',
  /** Team not found */
  TEAM_NOT_FOUND: 'Team not found.',
  /** Payment not found */
  PAYMENT_NOT_FOUND: 'Payment record not found.',
  /** Already exists */
  ALREADY_EXISTS: (resource: string) => `${resource} already exists.`,
} as const;

/**
 * Rate limit error messages
 */
export const RATE_LIMIT_ERRORS = {
  /** Generic rate limit */
  TOO_MANY_REQUESTS: 'Too many requests. Please try again later.',
  /** Rate limit with retry time */
  RETRY_AFTER: (seconds: number) =>
    `Too many requests. Please try again in ${formatDuration(seconds)}.`,
  /** Signup rate limit */
  SIGNUP_LIMIT: 'Too many signup attempts. Please try again in an hour.',
  /** Login rate limit */
  LOGIN_LIMIT: 'Too many login attempts. Please try again in 15 minutes.',
  /** Payment rate limit */
  PAYMENT_LIMIT: 'Too many payment attempts. Please try again later.',
  /** Withdrawal rate limit */
  WITHDRAWAL_LIMIT: 'Withdrawal limit reached. Please try again in an hour.',
} as const;

/**
 * Payment error messages
 */
export const PAYMENT_ERRORS = {
  /** Generic payment failure */
  PAYMENT_FAILED: 'Payment could not be processed. Please try again.',
  /** Card declined */
  CARD_DECLINED: 'Your card was declined. Please try a different payment method.',
  /** Insufficient funds */
  INSUFFICIENT_FUNDS: 'Insufficient funds. Please check your balance and try again.',
  /** Invalid card */
  INVALID_CARD: 'Invalid card information. Please check and try again.',
  /** Card expired */
  CARD_EXPIRED: 'Your card has expired. Please use a different card.',
  /** Withdrawal failed */
  WITHDRAWAL_FAILED: 'Withdrawal could not be processed. Please try again.',
  /** Invalid withdrawal amount */
  INVALID_WITHDRAWAL_AMOUNT: 'Please enter a valid withdrawal amount.',
  /** Below minimum withdrawal */
  BELOW_MINIMUM_WITHDRAWAL: (min: string) => `Minimum withdrawal amount is ${min}.`,
  /** Above maximum withdrawal */
  ABOVE_MAXIMUM_WITHDRAWAL: (max: string) => `Maximum withdrawal amount is ${max}.`,
  /** Insufficient balance */
  INSUFFICIENT_BALANCE: 'Insufficient balance for this withdrawal.',
  /** Payment provider error */
  PROVIDER_ERROR: 'Payment service is temporarily unavailable. Please try again later.',
  /** Currency not supported */
  CURRENCY_NOT_SUPPORTED: 'This currency is not supported.',
  /** Region not supported */
  REGION_NOT_SUPPORTED: 'This payment method is not available in your region.',
} as const;

/**
 * Draft error messages
 */
export const DRAFT_ERRORS = {
  /** Not your turn */
  NOT_YOUR_TURN: 'It is not your turn to pick.',
  /** Pick time expired */
  PICK_TIME_EXPIRED: 'Your pick time has expired.',
  /** Player already drafted */
  PLAYER_ALREADY_DRAFTED: 'This player has already been drafted.',
  /** Draft not started */
  DRAFT_NOT_STARTED: 'The draft has not started yet.',
  /** Draft already complete */
  DRAFT_COMPLETE: 'This draft has already been completed.',
  /** Draft paused */
  DRAFT_PAUSED: 'This draft is currently paused.',
  /** Not a participant */
  NOT_A_PARTICIPANT: 'You are not a participant in this draft.',
  /** Draft full */
  DRAFT_FULL: 'This draft is full.',
  /** Registration closed */
  REGISTRATION_CLOSED: 'Registration for this draft has closed.',
  /** Invalid pick */
  INVALID_PICK: 'Invalid pick. Please select a different player.',
} as const;

/**
 * Tournament error messages
 */
export const TOURNAMENT_ERRORS = {
  /** Tournament not found */
  NOT_FOUND: 'Tournament not found.',
  /** Tournament full */
  FULL: 'This tournament is full.',
  /** Registration closed */
  REGISTRATION_CLOSED: 'Registration for this tournament has closed.',
  /** Already registered */
  ALREADY_REGISTERED: 'You are already registered for this tournament.',
  /** Not registered */
  NOT_REGISTERED: 'You are not registered for this tournament.',
  /** Tournament started */
  ALREADY_STARTED: 'This tournament has already started.',
  /** Tournament cancelled */
  CANCELLED: 'This tournament has been cancelled.',
  /** Private tournament */
  PRIVATE_ACCESS: 'This is a private tournament. You need an invitation to join.',
} as const;

/**
 * Server error messages
 */
export const SERVER_ERRORS = {
  /** Generic server error */
  INTERNAL_ERROR: 'Something went wrong. Please try again later.',
  /** Database error */
  DATABASE_ERROR: 'A database error occurred. Please try again later.',
  /** External service error */
  EXTERNAL_SERVICE_ERROR: 'An external service is unavailable. Please try again later.',
  /** Configuration error */
  CONFIGURATION_ERROR: 'A configuration error occurred. Please contact support.',
  /** Maintenance mode */
  MAINTENANCE: 'The service is currently under maintenance. Please try again later.',
  /** Feature disabled */
  FEATURE_DISABLED: 'This feature is currently unavailable.',
} as const;

/**
 * Export error messages
 */
export const EXPORT_ERRORS = {
  /** Export failed */
  EXPORT_FAILED: 'Export could not be completed. Please try again.',
  /** No data to export */
  NO_DATA: 'No data available to export.',
  /** Export too large */
  TOO_LARGE: 'Export is too large. Please narrow your selection.',
  /** Invalid format */
  INVALID_FORMAT: 'Invalid export format requested.',
  /** Access denied */
  ACCESS_DENIED: 'You do not have permission to export this data.',
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format duration in human-readable format
 */
function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} second${seconds === 1 ? '' : 's'}`;
  }
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  }
  const hours = Math.ceil(minutes / 60);
  return `${hours} hour${hours === 1 ? '' : 's'}`;
}

/**
 * Get appropriate error message for HTTP status code
 */
export function getMessageForStatus(statusCode: number): string {
  switch (statusCode) {
    case 400:
      return VALIDATION_ERRORS.INVALID_INPUT;
    case 401:
      return AUTH_ERRORS.UNAUTHENTICATED;
    case 403:
      return AUTH_ERRORS.FORBIDDEN;
    case 404:
      return RESOURCE_ERRORS.NOT_FOUND;
    case 429:
      return RATE_LIMIT_ERRORS.TOO_MANY_REQUESTS;
    case 500:
      return SERVER_ERRORS.INTERNAL_ERROR;
    case 502:
      return SERVER_ERRORS.EXTERNAL_SERVICE_ERROR;
    case 503:
      return SERVER_ERRORS.DATABASE_ERROR;
    default:
      return SERVER_ERRORS.INTERNAL_ERROR;
  }
}

/**
 * Create a user-friendly error message from a technical error
 */
export function sanitizeErrorMessage(error: Error | string): string {
  const message = typeof error === 'string' ? error : error.message;

  // Map technical errors to user-friendly messages
  const mappings: Array<[RegExp | string, string]> = [
    [/permission[- ]denied/i, AUTH_ERRORS.FORBIDDEN],
    [/not found/i, RESOURCE_ERRORS.NOT_FOUND],
    [/unauthorized/i, AUTH_ERRORS.UNAUTHENTICATED],
    [/token.*expired/i, AUTH_ERRORS.TOKEN_EXPIRED],
    [/invalid.*token/i, AUTH_ERRORS.TOKEN_INVALID],
    [/rate.*limit/i, RATE_LIMIT_ERRORS.TOO_MANY_REQUESTS],
    [/timeout/i, SERVER_ERRORS.EXTERNAL_SERVICE_ERROR],
    [/network/i, SERVER_ERRORS.EXTERNAL_SERVICE_ERROR],
    [/ECONNREFUSED/i, SERVER_ERRORS.EXTERNAL_SERVICE_ERROR],
    [/ENOTFOUND/i, SERVER_ERRORS.EXTERNAL_SERVICE_ERROR],
  ];

  for (const [pattern, replacement] of mappings) {
    if (typeof pattern === 'string' ? message.includes(pattern) : pattern.test(message)) {
      return replacement;
    }
  }

  // Don't expose technical details to users
  if (message.includes('Firebase') ||
      message.includes('Firestore') ||
      message.includes('TypeError') ||
      message.includes('ReferenceError') ||
      message.includes('at ') ||
      message.includes('stack')) {
    return SERVER_ERRORS.INTERNAL_ERROR;
  }

  return message;
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type AuthError = keyof typeof AUTH_ERRORS;
export type ValidationError = keyof typeof VALIDATION_ERRORS;
export type ResourceError = keyof typeof RESOURCE_ERRORS;
export type RateLimitError = keyof typeof RATE_LIMIT_ERRORS;
export type PaymentError = keyof typeof PAYMENT_ERRORS;
export type DraftError = keyof typeof DRAFT_ERRORS;
export type TournamentError = keyof typeof TOURNAMENT_ERRORS;
export type ServerError = keyof typeof SERVER_ERRORS;
export type ExportError = keyof typeof EXPORT_ERRORS;
