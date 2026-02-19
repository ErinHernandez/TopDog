/**
 * API Documentation Module
 *
 * Public API for the documentation system. Provides access to the route registry,
 * OpenAPI spec generator, and all route definitions.
 *
 * Usage:
 *   import { initializeRoutes, generateSpec } from '@/lib/api-docs';
 *   initializeRoutes();
 *   const spec = generateSpec();
 *
 * @module lib/api-docs
 */

// Types
export type {
  RouteDefinition,
  RouteParameter,
  RouteResponse,
  RouteCategory,
  HttpMethod,
  AuthMethod,
  ParameterLocation,
  ParameterType,
  RegistryConfig,
  TagDefinition,
  ServerDefinition,
  OpenApiSpec,
  OpenApiOperation,
} from './types';

// Registry
export {
  REGISTRY_CONFIG,
  registerRoute,
  registerRoutes,
  getRoutes,
  getRoutesByCategory,
  getRouteByOperationId,
  getActiveCategories,
  getActiveTags,
  getRouteCount,
  clearRoutes,
  getRegistryStats,
} from './registry';

// Spec Generator
export {
  generateSpec,
  generateSpecJson,
  getSpecSummary,
} from './specGenerator';

// Route Definitions
export { initializeRoutes, ALL_ROUTES } from './routes';
