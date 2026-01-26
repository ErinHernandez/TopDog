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

export default {
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
