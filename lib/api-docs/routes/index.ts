/**
 * Route Definitions Barrel Export
 *
 * Aggregates all route definitions and registers them with the central registry.
 * Import this module to ensure all routes are registered before spec generation.
 *
 * @module lib/api-docs/routes
 */

import { registerRoutes } from '../registry';
import { healthRoutes } from './health';
import { aiRoutes } from './ai';
import { fileRoutes } from './files';
import { generationRoutes } from './generation';
import { communityRoutes } from './community';
import { commerceRoutes } from './commerce';
import { adminRoutes } from './admin';
import { integrationRoutes } from './integration';

/** All route definitions combined */
export const ALL_ROUTES = [
  ...healthRoutes,
  ...aiRoutes,
  ...fileRoutes,
  ...generationRoutes,
  ...communityRoutes,
  ...commerceRoutes,
  ...adminRoutes,
  ...integrationRoutes,
];

/**
 * Initialize the route registry by registering all route definitions.
 * Call this once before generating the OpenAPI spec.
 */
export function initializeRoutes(): void {
  registerRoutes(ALL_ROUTES);
}

// Re-export individual route groups for selective use
export { healthRoutes } from './health';
export { aiRoutes } from './ai';
export { fileRoutes } from './files';
export { generationRoutes } from './generation';
export { communityRoutes } from './community';
export { commerceRoutes } from './commerce';
export { adminRoutes } from './admin';
export { integrationRoutes } from './integration';
