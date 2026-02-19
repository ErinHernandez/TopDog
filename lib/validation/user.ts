/**
 * User Validation Schemas
 *
 * Schemas for user profile and contact updates.
 *
 * @module lib/validation/user
 */

import { z } from 'zod';

import { firebaseUserIdSchema, emailSchema } from './primitives';

// ============================================================================
// CONTACT
// ============================================================================

/**
 * Phone number - at least 10 digits after stripping non-digits, max 30 chars
 */
const phoneSchema = z
  .string()
  .max(30, 'Phone number too long')
  .trim()
  .optional()
  .refine(
    (val) => val === undefined || val === '' || val.replace(/\D/g, '').length >= 10,
    { message: 'Invalid phone format' }
  );

/**
 * Update contact request (POST /api/user/update-contact)
 * Requires userId and at least one of email or phone.
 */
export const updateContactSchema = z
  .object({
    userId: firebaseUserIdSchema,
    email: emailSchema.optional(),
    phone: phoneSchema,
  })
  .refine(
    (data) => {
      const hasEmail = data.email != null && String(data.email).trim() !== '';
      const hasPhone = data.phone != null && String(data.phone).trim() !== '';
      return hasEmail || hasPhone;
    },
    { message: 'Either email or phone is required', path: ['email'] }
  );

export type UpdateContactInput = z.infer<typeof updateContactSchema>;
