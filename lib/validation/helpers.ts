/**
 * Validation Helper Functions
 *
 * Utilities for validating inputs and handling validation errors.
 *
 * @module lib/validation/helpers
 */

import { z } from 'zod';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Zod issue type (compatible with both v3 and v4)
 */
export interface ZodIssue {
  path: PropertyKey[];
  message: string;
  code: string;
}

/**
 * Validation result type
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: ZodIssue[] };

// ============================================================================
// VALIDATION ERROR CLASS
// ============================================================================

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
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Convert PropertyKey[] path to string for display
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
): ValidationResult<T> {
  const result = schema.safeParse(input);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const issues = result.error.issues as ZodIssue[];
  return { success: false, errors: issues };
}

/**
 * Create a validation function that throws on invalid input
 */
export function createValidator<T>(schema: z.ZodSchema<T>) {
  return (input: unknown): T => {
    const result = schema.safeParse(input);

    if (!result.success) {
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
 * Format validation errors for API response
 */
export function formatValidationErrors(errors: ZodIssue[]): {
  code: string;
  message: string;
  details: Array<{ field: string; message: string }>;
} {
  return {
    code: 'VALIDATION_ERROR',
    message: 'Invalid request data',
    details: errors.map((err) => ({
      field: pathToString(err.path) || 'body',
      message: err.message,
    })),
  };
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
