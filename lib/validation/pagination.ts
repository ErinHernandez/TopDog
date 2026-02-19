/**
 * Pagination Validation Schemas
 *
 * Schemas for list pagination across all API endpoints.
 *
 * @module lib/validation/pagination
 */

import { z } from 'zod';

// ============================================================================
// OFFSET-BASED PAGINATION
// ============================================================================

/**
 * Standard pagination parameters
 */
export const paginationSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().nonnegative().default(0),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

// ============================================================================
// CURSOR-BASED PAGINATION
// ============================================================================

/**
 * Cursor-based pagination (for large datasets)
 */
export const cursorPaginationSchema = z.object({
  cursor: z.string().max(500).optional(),
  limit: z.number().int().min(1).max(100).default(20),
});

export type CursorPaginationInput = z.infer<typeof cursorPaginationSchema>;

// ============================================================================
// PAGINATION RESPONSE HELPERS
// ============================================================================

/**
 * Create pagination metadata for response
 */
export function createPaginationMeta(
  total: number,
  limit: number,
  offset: number
): {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  nextOffset: number | null;
} {
  const hasMore = offset + limit < total;
  return {
    total,
    limit,
    offset,
    hasMore,
    nextOffset: hasMore ? offset + limit : null,
  };
}
