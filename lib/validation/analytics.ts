/**
 * Analytics Validation Schemas
 *
 * Schemas for analytics event tracking and telemetry.
 *
 * @module lib/validation/analytics
 */

import { z } from 'zod';

import { firebaseUserIdSchema, uuidSchema } from './primitives';

// ============================================================================
// ANALYTICS EVENTS
// ============================================================================

/**
 * Analytics event request
 */
export const analyticsRequestSchema = z.object({
  /** Event name (e.g., 'page_view', 'draft_pick', 'payment_completed') */
  event: z.string().min(1, 'Event name is required').max(100, 'Event name too long'),
  /** Optional user ID for authenticated events */
  userId: firebaseUserIdSchema.optional(),
  /** Session ID for grouping events */
  sessionId: uuidSchema.optional(),
  /** Unix timestamp in milliseconds */
  timestamp: z.number().int().positive('Timestamp must be positive').optional(),
  /** Arbitrary event properties */
  properties: z.record(z.string(), z.unknown()).optional(),
});

export type AnalyticsRequest = z.infer<typeof analyticsRequestSchema>;

/**
 * Batch analytics events request
 */
export const batchAnalyticsRequestSchema = z.object({
  events: z.array(analyticsRequestSchema).min(1).max(100),
});

export type BatchAnalyticsRequest = z.infer<typeof batchAnalyticsRequestSchema>;
