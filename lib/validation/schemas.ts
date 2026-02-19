/**
 * API Input Validation Schemas
 *
 * Centralized Zod schemas for validating API inputs across the application.
 * Provides type-safe validation with clear error messages.
 *
 * SECURITY: All API endpoints should use these schemas to validate inputs
 * before processing. This prevents injection attacks, type confusion, and
 * ensures data integrity.
 *
 * @module lib/validation/schemas
 */

import { z } from 'zod';

import { logger } from '../structuredLogger';

// ============================================================================
// PRIMITIVE VALIDATORS
// ============================================================================

/**
 * Firebase User ID - alphanumeric string of 28 characters
 */
export const firebaseUserIdSchema = z
  .string()
  .min(20, 'User ID too short')
  .max(128, 'User ID too long')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid user ID format');

/**
 * Email address
 */
export const emailSchema = z
  .string()
  .email('Invalid email format')
  .max(254, 'Email too long')
  .toLowerCase()
  .trim();

/**
 * Username - alphanumeric with underscores, 3-30 characters
 */
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username cannot exceed 30 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
  .trim();

/**
 * Display name - any characters, 1-50 characters
 */
export const displayNameSchema = z
  .string()
  .min(1, 'Display name is required')
  .max(50, 'Display name cannot exceed 50 characters')
  .trim();

/**
 * Positive integer
 */
export const positiveIntSchema = z
  .number()
  .int('Must be a whole number')
  .positive('Must be a positive number');

/**
 * Non-negative integer (includes zero)
 */
export const nonNegativeIntSchema = z
  .number()
  .int('Must be a whole number')
  .nonnegative('Cannot be negative');

/**
 * Amount in cents (positive integer)
 */
export const amountCentsSchema = z
  .number()
  .int('Amount must be a whole number in cents')
  .positive('Amount must be positive')
  .max(100_000_000, 'Amount exceeds maximum limit'); // Max $1M

/**
 * Currency code (ISO 4217)
 */
export const currencyCodeSchema = z
  .string()
  .length(3, 'Currency code must be 3 characters')
  .toUpperCase()
  .regex(/^[A-Z]{3}$/, 'Invalid currency code');

/**
 * Country code (ISO 3166-1 alpha-2)
 */
export const countryCodeSchema = z
  .string()
  .length(2, 'Country code must be 2 characters')
  .toUpperCase()
  .regex(/^[A-Z]{2}$/, 'Invalid country code format');

/**
 * UUID v4
 */
export const uuidSchema = z
  .string()
  .uuid('Invalid UUID format');

/**
 * ISO 8601 date string
 */
export const isoDateSchema = z
  .string()
  .datetime('Invalid date format');

/**
 * URL
 */
export const urlSchema = z
  .string()
  .url('Invalid URL format')
  .max(2048, 'URL too long');

// ============================================================================
// PAYMENT SCHEMAS
// ============================================================================

/**
 * Payment provider
 */
export const paymentProviderSchema = z.enum([
  'stripe',
  'paystack',
  'paymongo',
  'xendit',
]);

export type PaymentProvider = z.infer<typeof paymentProviderSchema>;

/**
 * Create payment intent request
 */
export const createPaymentIntentSchema = z.object({
  amountCents: amountCentsSchema,
  currency: currencyCodeSchema.default('USD'),
  paymentMethodId: z.string().optional(),
  savePaymentMethod: z.boolean().default(false),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type CreatePaymentIntentInput = z.infer<typeof createPaymentIntentSchema>;

/**
 * Withdrawal request
 */
export const withdrawalRequestSchema = z.object({
  amountCents: amountCentsSchema,
  currency: currencyCodeSchema.default('USD'),
  description: z.string().max(255).optional(),
});

export type WithdrawalRequestInput = z.infer<typeof withdrawalRequestSchema>;

/**
 * PayPal withdrawal request
 */
export const paypalWithdrawRequestSchema = z.object({
  amountCents: z
    .number()
    .int('Amount must be a whole number in cents')
    .positive('Amount must be positive')
    .min(100, 'Minimum withdrawal is $1.00') // $1.00 = 100 cents
    .max(1_000_000, 'Maximum withdrawal is $10,000.00'), // $10,000 = 1,000,000 cents
  linkedAccountId: z
    .string()
    .min(1, 'Linked account ID is required')
    .max(200, 'Linked account ID too long'),
  confirmationMethod: z.enum(['email', 'sms']).optional(),
});

export type PayPalWithdrawRequest = z.infer<typeof paypalWithdrawRequestSchema>;

/**
 * Paystack create transfer recipient request
 */
export const paystackCreateRecipientSchema = z.object({
  userId: firebaseUserIdSchema,
  type: z.enum(['nuban', 'mobile_money', 'basa']),
  name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
  accountNumber: z.string().min(10, 'Account number too short').max(20, 'Account number too long'),
  bankCode: z.string().min(3, 'Bank code too short').max(10, 'Bank code too long').optional(),
  country: z.enum(['NG', 'GH', 'ZA', 'KE']),
  setAsDefault: z.boolean().optional(),
});

export type PaystackCreateRecipientRequest = z.infer<typeof paystackCreateRecipientSchema>;

/**
 * Paystack delete transfer recipient request
 */
export const paystackDeleteRecipientSchema = z.object({
  userId: firebaseUserIdSchema,
  recipientCode: z.string().min(1, 'Recipient code is required').max(100, 'Recipient code too long'),
});

export type PaystackDeleteRecipientRequest = z.infer<typeof paystackDeleteRecipientSchema>;

/**
 * Paystack initiate transfer request
 */
export const paystackInitiateTransferSchema = z.object({
  userId: firebaseUserIdSchema,
  amountSmallestUnit: z
    .number()
    .int('Amount must be a whole number')
    .positive('Amount must be positive')
    .min(100, 'Minimum transfer amount is 100 (smallest unit)'),
  currency: z.enum(['NGN', 'GHS', 'ZAR', 'KES']),
  recipientCode: z.string().min(1, 'Recipient code is required').max(100, 'Recipient code too long'),
  reason: z.string().max(500, 'Reason too long').optional(),
  twoFactorToken: z.string().max(200, '2FA token too long').optional(),
  idempotencyKey: z.string().uuid('Invalid idempotency key format').optional(),
});

export type PaystackInitiateTransferRequest = z.infer<typeof paystackInitiateTransferSchema>;

/**
 * Stripe setup intent request
 */
export const stripeSetupIntentRequestSchema = z.object({
  userId: firebaseUserIdSchema,
  email: emailSchema,
  name: z.string().max(200, 'Name too long').optional(),
  paymentMethodTypes: z.array(z.enum(['card'])).optional(),
  idempotencyKey: z.string().uuid('Invalid idempotency key format').optional(),
});

export type StripeSetupIntentRequest = z.infer<typeof stripeSetupIntentRequestSchema>;

/**
 * Stripe cancel payment request
 */
export const stripeCancelPaymentRequestSchema = z.object({
  paymentIntentId: z.string().min(1, 'Payment intent ID is required').max(200, 'Payment intent ID too long'),
  userId: firebaseUserIdSchema,
  reason: z.enum(['requested_by_customer', 'abandoned', 'fraudulent']).optional(),
});

export type StripeCancelPaymentRequest = z.infer<typeof stripeCancelPaymentRequestSchema>;

/**
 * Analytics request
 */
export const analyticsRequestSchema = z.object({
  event: z.string().min(1, 'Event name is required').max(100, 'Event name too long'),
  userId: firebaseUserIdSchema.optional(),
  sessionId: z.string().uuid('Invalid session ID format').optional(),
  timestamp: z.number().int().positive('Timestamp must be positive').optional(),
  properties: z.record(z.string(), z.unknown()).optional(),
});

export type AnalyticsRequest = z.infer<typeof analyticsRequestSchema>;

/**
 * Set display currency request
 */
export const setDisplayCurrencySchema = z.object({
  userId: firebaseUserIdSchema,
  country: countryCodeSchema,
  currency: currencyCodeSchema,
});

export type SetDisplayCurrencyRequest = z.infer<typeof setDisplayCurrencySchema>;

/**
 * Reset display currency request
 */
export const resetDisplayCurrencySchema = z.object({
  userId: firebaseUserIdSchema,
  country: countryCodeSchema,
});

export type ResetDisplayCurrencyRequest = z.infer<typeof resetDisplayCurrencySchema>;

/**
 * Draft withdraw request
 */
export const draftWithdrawRequestSchema = z.object({
  userId: firebaseUserIdSchema,
  draftId: z.string().min(1, 'Draft ID is required').max(200, 'Draft ID too long'),
});

export type DraftWithdrawRequest = z.infer<typeof draftWithdrawRequestSchema>;

/**
 * Paymongo create payout request
 */
export const paymongoCreatePayoutSchema = z.object({
  amount: z
    .number()
    .positive('Amount must be positive')
    .min(0.01, 'Minimum amount is 0.01')
    .max(100000, 'Maximum amount is 100,000'),
  userId: firebaseUserIdSchema,
  bankAccountId: z.string().min(1, 'Bank account ID is required').max(200, 'Bank account ID too long'),
  newBankAccount: z.object({
    bankCode: z.string().min(3).max(10),
    accountNumber: z.string().min(10).max(20),
    accountHolderName: z.string().min(1).max(200),
    saveForFuture: z.boolean().optional(),
  }).optional(),
});

export type PaymongoCreatePayoutRequest = z.infer<typeof paymongoCreatePayoutSchema>;

/**
 * Xendit create disbursement request
 */
export const xenditCreateDisbursementSchema = z.object({
  amount: z
    .number()
    .positive('Amount must be positive')
    .min(10000, 'Minimum amount is 10,000 IDR')
    .max(100000000, 'Maximum amount is 100,000,000 IDR'),
  userId: firebaseUserIdSchema,
  accountId: z.string().min(1, 'Account ID is required').max(200, 'Account ID too long'),
  newAccount: z.object({
    bankCode: z.string().min(3, 'Bank code too short').max(10, 'Bank code too long'),
    accountNumber: z.string().min(10, 'Account number too short').max(20, 'Account number too long'),
    accountHolderName: z.string().min(1, 'Account holder name is required').max(200, 'Account holder name too long'),
    saveForFuture: z.boolean().optional(),
  }).optional(),
});

export type XenditCreateDisbursementRequest = z.infer<typeof xenditCreateDisbursementSchema>;

/**
 * PayPal create order request
 */
export const paypalCreateOrderSchema = z.object({
  amountCents: amountCentsSchema,
  userId: firebaseUserIdSchema,
  currency: currencyCodeSchema.default('USD'),
  riskContext: z.object({
    ipAddress: z.string().regex(/^(?:(?:25[0-5]|2[0-4]\d|1?\d{1,2})\.){3}(?:25[0-5]|2[0-4]\d|1?\d{1,2})$/, 'Invalid IP address').optional(),
    userAgent: z.string().max(500, 'User agent too long').optional(),
    deviceId: z.string().max(200, 'Device ID too long').optional(),
  }).optional(),
});

export type PayPalCreateOrderRequest = z.infer<typeof paypalCreateOrderSchema>;

/**
 * Stripe webhook event
 */
export const stripeWebhookEventSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  data: z.object({
    object: z.record(z.string(), z.unknown()),
  }),
  created: z.number().int().positive(),
});

/**
 * Payment method type string (validated by getAllowedPaymentMethods function)
 * Using string array since validation happens in business logic
 */
export const paymentMethodTypeSchema = z.string().min(1).max(50);

/**
 * Risk context for fraud detection
 */
export const riskContextSchema = z.object({
  ipAddress: z.string()
    .regex(/^(\d{1,3}\.){3}\d{1,3}$|^([a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}$/, 'Invalid IP address')
    .optional(),
  country: z.string().length(2).optional(),
  deviceId: z.string().max(255).optional(),
  sessionId: z.string().max(255).optional(),
}).optional();

/**
 * Stripe Payment Intent Request Body
 */
export const stripePaymentIntentRequestSchema = z.object({
  amountCents: amountCentsSchema,
  currency: currencyCodeSchema.optional().default('USD'),
  country: z.string().length(2).optional(),
  userId: firebaseUserIdSchema,
  email: emailSchema.optional(),
  name: z.string().max(255).optional(),
  paymentMethodTypes: z.array(z.string().min(1).max(50)).optional(),
  savePaymentMethod: z.boolean().optional().default(false),
  paymentMethodId: z.string().max(255).optional(),
  idempotencyKey: uuidSchema.optional(),
  riskContext: riskContextSchema,
});

export type StripePaymentIntentRequest = z.infer<typeof stripePaymentIntentRequestSchema>;

/**
 * PayMongo Create Payment Request Body
 */
export const paymongoCreatePaymentSchema = z.object({
  sourceId: z.string().min(1).max(255),
  userId: firebaseUserIdSchema,
  description: z.string().max(500).optional(),
});

export type PayMongoCreatePaymentRequest = z.infer<typeof paymongoCreatePaymentSchema>;

/**
 * PayStack Initialize Payment Request Body
 */
export const paystackInitializeSchema = z.object({
  amountSmallestUnit: z
    .number()
    .int('Amount must be a whole number')
    .positive('Amount must be positive')
    .min(100, 'Minimum amount is 100 (smallest unit)'),
  currency: z.enum(['NGN', 'GHS', 'ZAR', 'KES']).optional().default('NGN'),
  userId: firebaseUserIdSchema,
  email: emailSchema,
  country: countryCodeSchema.optional(),
  channel: z.enum(['card', 'ussd', 'mobile_money', 'bank_transfer']).optional().default('card'),
  ussdType: z.string().max(50).optional(),
  mobileMoneyPhone: z.string().max(20).optional(),
  mobileMoneyProvider: z.enum(['mtn', 'vodafone', 'tigo', 'mpesa']).optional(),
  callbackUrl: urlSchema.optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type PayStackInitializeRequest = z.infer<typeof paystackInitializeSchema>;

/**
 * Xendit E-Wallet Payment Request Body
 */
export const xenditEwalletSchema = z.object({
  amountCents: amountCentsSchema,
  currency: currencyCodeSchema.optional().default('PHP'),
  userId: firebaseUserIdSchema,
  email: emailSchema,
  ewalletType: z.enum(['gcash', 'grabpay', 'paymaya']),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type XenditEwalletRequest = z.infer<typeof xenditEwalletSchema>;

/**
 * Xendit Virtual Account Request Body
 */
export const xenditVirtualAccountSchema = z.object({
  amountCents: amountCentsSchema,
  currency: currencyCodeSchema.optional().default('IDR'),
  userId: firebaseUserIdSchema,
  email: emailSchema,
  bankCode: z.string().min(1).max(50),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type XenditVirtualAccountRequest = z.infer<typeof xenditVirtualAccountSchema>;

// ============================================================================
// AUTH SCHEMAS
// ============================================================================

/**
 * State code (US states)
 */
export const stateCodeSchema = z
  .string()
  .length(2, 'State code must be 2 characters')
  .toUpperCase()
  .regex(/^[A-Z]{2}$/, 'Invalid state code format')
  .optional();

/**
 * User signup request
 */
export const signupRequestSchema = z.object({
  uid: firebaseUserIdSchema,
  username: usernameSchema,
  email: emailSchema.optional(),
  countryCode: countryCodeSchema.optional().default('US'),
  stateCode: stateCodeSchema,
  displayName: displayNameSchema.optional(),
});

export type SignupRequest = z.infer<typeof signupRequestSchema>;

/**
 * Username claim request
 */
export const claimUsernameSchema = z.object({
  username: usernameSchema,
  claimToken: z.string().min(1).max(255),
  userId: firebaseUserIdSchema,
});

export type ClaimUsernameRequest = z.infer<typeof claimUsernameSchema>;

/**
 * Username check request
 */
export const checkUsernameSchema = z.object({
  username: usernameSchema,
  countryCode: countryCodeSchema.optional().default('US'),
});

export type CheckUsernameRequest = z.infer<typeof checkUsernameSchema>;

/**
 * Username change request
 */
export const changeUsernameSchema = z.object({
  newUsername: usernameSchema,
  countryCode: countryCodeSchema.optional().default('US'),
});

export type ChangeUsernameRequest = z.infer<typeof changeUsernameSchema>;

/**
 * Reserve username request (admin)
 */
export const reserveUsernameSchema = z.object({
  username: usernameSchema,
  userId: firebaseUserIdSchema.optional(),
  expiresAt: isoDateSchema.optional(),
  reason: z.string().max(500).optional(),
});

export type ReserveUsernameRequest = z.infer<typeof reserveUsernameSchema>;

/**
 * Check batch usernames request
 */
export const checkBatchUsernamesSchema = z.object({
  usernames: z.array(usernameSchema).min(1).max(100),
  countryCode: countryCodeSchema.optional().default('US'),
});

export type CheckBatchUsernamesRequest = z.infer<typeof checkBatchUsernamesSchema>;

// ============================================================================
// DRAFT SCHEMAS
// ============================================================================

/**
 * Draft room ID
 */
export const draftRoomIdSchema = z
  .string()
  .min(10, 'Draft room ID too short')
  .max(64, 'Draft room ID too long')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid draft room ID format');

/**
 * Player ID
 */
export const playerIdSchema = z
  .string()
  .min(1, 'Player ID is required')
  .max(64, 'Player ID too long');

/**
 * Position
 */
export const positionSchema = z.enum(['QB', 'RB', 'WR', 'TE', 'K', 'DEF', 'FLEX']);

export type Position = z.infer<typeof positionSchema>;

/**
 * Draft pick request
 */
export const draftPickRequestSchema = z.object({
  playerId: playerIdSchema,
  roomId: draftRoomIdSchema,
});

export type DraftPickRequestInput = z.infer<typeof draftPickRequestSchema>;

/**
 * Create draft room request
 */
export const createDraftRoomSchema = z.object({
  name: z.string().min(3).max(100).trim(),
  teamCount: z.number().int().min(2).max(20),
  rosterSize: z.number().int().min(10).max(30),
  pickTimeSeconds: z.number().int().min(30).max(86400), // 30 sec to 24 hours
  scoringFormat: z.enum(['ppr', 'half-ppr', 'standard']).default('ppr'),
  tournamentId: z.string().optional(),
});

export type CreateDraftRoomInput = z.infer<typeof createDraftRoomSchema>;

/**
 * Update queue request
 */
export const updateQueueSchema = z.object({
  roomId: draftRoomIdSchema,
  playerIds: z.array(playerIdSchema).max(100),
});

export type UpdateQueueInput = z.infer<typeof updateQueueSchema>;

// ============================================================================
// USER SCHEMAS
// ============================================================================

/**
 * Update profile request
 */
export const updateProfileSchema = z.object({
  username: usernameSchema.optional(),
  displayName: displayNameSchema.optional(),
  email: emailSchema.optional(),
  avatarUrl: urlSchema.optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/**
 * User settings
 */
export const userSettingsSchema = z.object({
  notifications: z.object({
    email: z.boolean().default(true),
    push: z.boolean().default(true),
    draftReminders: z.boolean().default(true),
    marketingEmails: z.boolean().default(false),
  }).optional(),
  preferences: z.object({
    timezone: z.string().max(100).default('America/New_York'),
    language: z.string().length(2).default('en'),
    darkMode: z.boolean().default(false),
  }).optional(),
});

export type UserSettingsInput = z.infer<typeof userSettingsSchema>;

// ============================================================================
// PAGINATION SCHEMAS
// ============================================================================

/**
 * Pagination parameters
 */
export const paginationSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().nonnegative().default(0),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

/**
 * Cursor-based pagination
 */
export const cursorPaginationSchema = z.object({
  cursor: z.string().max(500).optional(),
  limit: z.number().int().min(1).max(100).default(20),
});

export type CursorPaginationInput = z.infer<typeof cursorPaginationSchema>;

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Zod issue type (compatible with both v3 and v4)
 * Using PropertyKey for path to match Zod v4's $ZodIssue type
 */
export interface ZodIssue {
  path: PropertyKey[];
  message: string;
  code: string;
}

/**
 * Helper to convert PropertyKey[] to string for display
 */
function pathToString(path: PropertyKey[]): string {
  return path.map(p => String(p)).join('.');
}

/**
 * Validate input against a schema
 * Returns { success: true, data } or { success: false, errors }
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  input: unknown
): { success: true; data: T } | { success: false; errors: ZodIssue[] } {
  const result = schema.safeParse(input);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Zod v4 uses 'issues' instead of 'errors'
  const issues = result.error.issues as ZodIssue[];
  return { success: false, errors: issues };
}

/**
 * Create a validation middleware for Next.js API routes
 */
export function createValidator<T>(schema: z.ZodSchema<T>) {
  return (input: unknown): T => {
    const result = schema.safeParse(input);

    if (!result.success) {
      // Zod v4 uses 'issues' instead of 'errors'
      const issues = result.error.issues as ZodIssue[];
      const errorMessages = issues
        .map((err) => `${pathToString(err.path)}: ${err.message}`)
        .join(', ');

      throw new ValidationError(errorMessages, issues);
    }

    return result.data;
  };
}

/**
 * Custom validation error class
 */
export class ValidationError extends Error {
  public readonly errors: ZodIssue[];
  public readonly code = 'VALIDATION_ERROR';

  constructor(message: string, errors: ZodIssue[]) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

/**
 * Check if an error is a ValidationError
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

// ============================================================================
// FANTASY PLAYER SCHEMAS
// ============================================================================

/**
 * Fantasy player schema for external API responses
 * Handles both camelCase and PascalCase field names from external APIs
 */
export const fantasyPlayerSchema = z.object({
  Position: z.string().optional(),
  position: z.string().optional(),
  Name: z.string().optional(),
  name: z.string().optional(),
  Team: z.string().optional(),
  team: z.string().optional(),
  AverageDraftPositionPPR: z.number().optional(),
  adpPPR: z.number().optional(),
  AverageDraftPosition: z.number().optional(),
  adp: z.number().optional(),
  ProjectedFantasyPointsPPR: z.number().optional(),
  projectedPointsPPR: z.number().optional(),
  ProjectedFantasyPoints: z.number().optional(),
  projectedPoints: z.number().optional(),
  PositionRank: z.number().optional(),
  positionRank: z.number().optional(),
  ByeWeek: z.number().optional(),
  byeWeek: z.number().optional(),
  AverageDraftPositionRank: z.number().optional(),
  overallRank: z.number().optional(),
}).strict();

/**
 * Log unexpected fields in fantasy player schema
 */
export function logUnexpectedFields(input: Record<string, unknown>, expectedFields: Set<string>): void {
  const unexpectedFields = Object.keys(input).filter(key => !expectedFields.has(key));
  if (unexpectedFields.length > 0) {
    logger.warn('Unexpected fields in fantasy player data', {
      component: 'validation',
      operation: 'fantasy-player-schema',
      unexpectedFields,
      fieldCount: unexpectedFields.length,
    });
  }
}

/**
 * Array of fantasy players from external API
 */
export const fantasyPlayersResponseSchema = z.array(fantasyPlayerSchema);

// ============================================================================
// SANITIZATION HELPERS
// ============================================================================

/**
 * Sanitize a string by removing potentially dangerous characters
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets (XSS prevention)
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .trim();
}

/**
 * Sanitize an object's string values recursively
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitizeString(value);
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }

  return result as T;
}

const validationSchemasExports = {
  // Primitive schemas
  firebaseUserIdSchema,
  emailSchema,
  usernameSchema,
  displayNameSchema,
  positiveIntSchema,
  nonNegativeIntSchema,
  amountCentsSchema,
  currencyCodeSchema,
  uuidSchema,
  isoDateSchema,
  urlSchema,

  // Payment schemas
  paymentProviderSchema,
  createPaymentIntentSchema,
  withdrawalRequestSchema,
  stripeWebhookEventSchema,
  paymentMethodTypeSchema,
  riskContextSchema,
  stripePaymentIntentRequestSchema,
  paymongoCreatePaymentSchema,
  paystackInitializeSchema,
  xenditEwalletSchema,
  xenditVirtualAccountSchema,

  // Auth schemas
  countryCodeSchema,
  stateCodeSchema,
  signupRequestSchema,
  claimUsernameSchema,
  checkUsernameSchema,
  changeUsernameSchema,
  reserveUsernameSchema,
  checkBatchUsernamesSchema,

  // Draft schemas
  draftRoomIdSchema,
  playerIdSchema,
  positionSchema,
  draftPickRequestSchema,
  createDraftRoomSchema,
  updateQueueSchema,

  // User schemas
  updateProfileSchema,
  userSettingsSchema,

  // Pagination schemas
  paginationSchema,
  cursorPaginationSchema,

  // Helpers
  validateInput,
  createValidator,
  ValidationError,
  isValidationError,
  sanitizeString,
  sanitizeObject,
};

export default validationSchemasExports;
