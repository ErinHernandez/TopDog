/**
 * Primitive Validation Schemas
 *
 * Base-level validators for common data types used throughout the application.
 * These are the building blocks for more complex domain-specific schemas.
 *
 * @module lib/validation/primitives
 */

import { z } from 'zod';

// ============================================================================
// STRING PRIMITIVES
// ============================================================================

/**
 * Firebase User ID - alphanumeric string of 20-128 characters
 */
export const firebaseUserIdSchema = z
  .string()
  .min(20, 'User ID too short')
  .max(128, 'User ID too long')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid user ID format');

/**
 * Email address with normalization
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
 * URL with length limit
 */
export const urlSchema = z
  .string()
  .url('Invalid URL format')
  .max(2048, 'URL too long');

// ============================================================================
// NUMERIC PRIMITIVES
// ============================================================================

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
 * Amount in cents (positive integer, max $1M)
 */
export const amountCentsSchema = z
  .number()
  .int('Amount must be a whole number in cents')
  .positive('Amount must be positive')
  .max(100_000_000, 'Amount exceeds maximum limit'); // Max $1M

// ============================================================================
// GEOGRAPHIC & LOCALE PRIMITIVES
// ============================================================================

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
 * US State code
 */
export const stateCodeSchema = z
  .string()
  .length(2, 'State code must be 2 characters')
  .toUpperCase()
  .regex(/^[A-Z]{2}$/, 'Invalid state code format')
  .optional();

// ============================================================================
// NETWORK PRIMITIVES
// ============================================================================

/**
 * IPv4 address pattern
 */
const IPV4_PATTERN = /^(?:(?:25[0-5]|2[0-4]\d|1?\d{1,2})\.){3}(?:25[0-5]|2[0-4]\d|1?\d{1,2})$/;

/**
 * IPv6 address pattern (simplified - covers most common formats)
 */
const IPV6_PATTERN = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::(?:[0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}$|^(?:[0-9a-fA-F]{1,4}:){1,7}:$|^(?:[0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}$|^(?:[0-9a-fA-F]{1,4}:){1,5}(?::[0-9a-fA-F]{1,4}){1,2}$|^(?:[0-9a-fA-F]{1,4}:){1,4}(?::[0-9a-fA-F]{1,4}){1,3}$|^(?:[0-9a-fA-F]{1,4}:){1,3}(?::[0-9a-fA-F]{1,4}){1,4}$|^(?:[0-9a-fA-F]{1,4}:){1,2}(?::[0-9a-fA-F]{1,4}){1,5}$|^[0-9a-fA-F]{1,4}:(?::[0-9a-fA-F]{1,4}){1,6}$|^::$/;

/**
 * IP address (supports both IPv4 and IPv6)
 */
export const ipAddressSchema = z
  .string()
  .refine(
    (val) => IPV4_PATTERN.test(val) || IPV6_PATTERN.test(val),
    'Invalid IP address format (must be valid IPv4 or IPv6)'
  );

/**
 * Optional IP address
 */
export const optionalIpAddressSchema = ipAddressSchema.optional();

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type FirebaseUserId = z.infer<typeof firebaseUserIdSchema>;
export type Email = z.infer<typeof emailSchema>;
export type Username = z.infer<typeof usernameSchema>;
export type CurrencyCode = z.infer<typeof currencyCodeSchema>;
export type CountryCode = z.infer<typeof countryCodeSchema>;
