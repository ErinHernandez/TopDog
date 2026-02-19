/**
 * Authentication Validation Schemas
 *
 * Schemas for user authentication, signup, and username management.
 *
 * @module lib/validation/auth
 */

import { z } from 'zod';

import {
  firebaseUserIdSchema,
  emailSchema,
  usernameSchema,
  displayNameSchema,
  countryCodeSchema,
  stateCodeSchema,
  isoDateSchema,
} from './primitives';

// ============================================================================
// SIGNUP & REGISTRATION
// ============================================================================

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

// ============================================================================
// USERNAME MANAGEMENT
// ============================================================================

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
 * Username availability check request
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
 * Reserve username request (admin only)
 * Matches POST /api/auth/username/reserve body.
 */
export const reserveUsernameSchema = z.object({
  username: usernameSchema,
  reservedFor: z.string().min(1, 'Reserved for (VIP name) is required').max(100),
  userId: firebaseUserIdSchema.optional(),
  expiresAt: isoDateSchema.optional(),
  expiresInDays: z.number().int().min(1).max(365).optional(),
  priority: z.enum(['normal', 'high']).optional(),
  reason: z.string().max(500).optional(),
  notes: z.string().max(500).optional(),
});

export type ReserveUsernameRequest = z.infer<typeof reserveUsernameSchema>;

/**
 * Batch username check request
 */
export const checkBatchUsernamesSchema = z.object({
  usernames: z.array(usernameSchema).min(1).max(100),
  countryCode: countryCodeSchema.optional().default('US'),
});

export type CheckBatchUsernamesRequest = z.infer<typeof checkBatchUsernamesSchema>;

// ============================================================================
// USER PROFILE
// ============================================================================

/**
 * Update profile request
 */
export const updateProfileSchema = z.object({
  username: usernameSchema.optional(),
  displayName: displayNameSchema.optional(),
  email: emailSchema.optional(),
  avatarUrl: z.string().url().max(2048).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/**
 * User notification settings
 */
export const notificationSettingsSchema = z.object({
  email: z.boolean().default(true),
  push: z.boolean().default(true),
  draftReminders: z.boolean().default(true),
  marketingEmails: z.boolean().default(false),
});

/**
 * User preference settings
 */
export const preferenceSettingsSchema = z.object({
  timezone: z.string().max(100).default('America/New_York'),
  language: z.string().length(2).default('en'),
  darkMode: z.boolean().default(false),
});

/**
 * User settings
 */
export const userSettingsSchema = z.object({
  notifications: notificationSettingsSchema.optional(),
  preferences: preferenceSettingsSchema.optional(),
});

export type UserSettingsInput = z.infer<typeof userSettingsSchema>;

// ============================================================================
// DISPLAY CURRENCY
// ============================================================================

/**
 * Set display currency request
 */
export const setDisplayCurrencySchema = z.object({
  userId: firebaseUserIdSchema,
  country: countryCodeSchema,
  currency: z.string().length(3).toUpperCase(),
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
