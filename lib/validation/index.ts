/**
 * Validation Schemas Index
 *
 * Central export point for all validation schemas.
 * Import from here for cleaner imports in API routes.
 *
 * @example
 * import { paypalWithdrawRequestSchema, validateInput } from '@/lib/validation';
 *
 * @module lib/validation
 */

// Primitives - base-level validators
export * from './primitives';

// Domain-specific schemas
export * from './payment';
export * from './auth';
export * from './draft';
export * from './user';
export * from './vision';
export * from './analytics';
export * from './pagination';
export * from './playerSchema';

// Helpers and utilities
export * from './helpers';

// Legacy: re-export default from monolithic schemas file for backwards compatibility.
// Note: Using explicit default export to avoid duplicate named export conflicts.
// MIGRATION NOTE: Prefer domain-specific imports (e.g., import { x } from '@/lib/validation/payment')
// over `schemas.x`. Once all callers are migrated, remove this re-export and ./schemas.ts.
// Tracked in: CODE_REVIEW_REMEDIATION_TRACKER.md Phase 4 #30
export { default as schemas } from './schemas';

// Re-export zod for convenience
export { z } from 'zod';
