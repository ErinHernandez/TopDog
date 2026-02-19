/**
 * Route Registry
 *
 * Central registry for all API route metadata. Routes register their OpenAPI
 * metadata here, and the spec generator reads from this registry to produce
 * the OpenAPI 3.1.0 specification.
 *
 * @module lib/api-docs/registry
 */

import type {
  RouteDefinition,
  RegistryConfig,
  TagDefinition,
  RouteCategory,
} from './types';

// ============================================================================
// REGISTRY CONFIGURATION
// ============================================================================

export const REGISTRY_CONFIG: RegistryConfig = {
  title: 'Idesaign API',
  version: '1.0.0',
  description:
    'Comprehensive API for Idesaign, a Next.js 15 AI-powered design and image generation platform. ' +
    'Supports image processing, AI tools, file management, generation, community features, ' +
    'marketplace functionality, and administrative operations.',
  contact: {
    name: 'Idesaign Support',
    url: 'https://idesaign.ai/support',
  },
  license: {
    name: 'Proprietary',
    url: 'https://idesaign.ai/license',
  },
  servers: [
    { url: 'https://idesaign.ai', description: 'Production server' },
    { url: 'https://staging.idesaign.ai', description: 'Staging server' },
    { url: 'http://localhost:3000', description: 'Local development server' },
  ],
  tags: [
    { name: 'Health', description: 'Service health monitoring endpoints' },
    { name: 'AI Tools', description: 'AI-powered image processing and generation tools' },
    { name: 'Files', description: 'File upload, listing, and deletion operations' },
    { name: 'Formats', description: 'Export format support and processing (PSD, TIFF, RAW)' },
    { name: 'Generation', description: 'Image generation with AI models' },
    { name: 'History', description: 'Generation history tracking and management' },
    { name: 'Feedback', description: 'User feedback collection and preference tracking' },
    { name: 'Comparison', description: 'A/B comparison and evaluation' },
    { name: 'Projects', description: 'Project CRUD operations and management' },
    { name: 'Uploads', description: 'Image, asset, and font upload endpoints' },
    { name: 'Jobs', description: 'Asynchronous job progress tracking' },
    { name: 'Community', description: 'Community gallery, posts, prompts, and social features' },
    { name: 'Marketplace', description: 'Marketplace catalog and data access' },
    { name: 'Checkout', description: 'Stripe checkout and subscription management' },
    { name: 'Notifications', description: 'User notification management' },
    { name: 'Admin', description: 'Administrative analytics and platform management' },
    { name: 'Admin Audit', description: 'Audit logging and compliance trail' },
    { name: 'Admin Buyers', description: 'Buyer management and API key provisioning' },
    { name: 'Admin Products', description: 'Product and release management' },
    { name: 'Admin Observability', description: 'Alerts, incidents, and metrics monitoring' },
    { name: 'Integration', description: 'Third-party integrations and data transfer' },
    { name: 'Webhooks', description: 'Webhook handlers for external services' },
    { name: 'SMS', description: 'SMS messaging via Twilio' },
    { name: 'Versioning', description: 'API version information and management' },
  ],
};

// ============================================================================
// ROUTE STORAGE
// ============================================================================

/** Internal route store */
const routeStore: RouteDefinition[] = [];

// ============================================================================
// REGISTRY API
// ============================================================================

/**
 * Register a single route definition
 */
export function registerRoute(route: RouteDefinition): void {
  // Prevent duplicates
  const existing = routeStore.findIndex(
    (r) => r.operationId === route.operationId
  );
  if (existing >= 0) {
    routeStore[existing] = route;
  } else {
    routeStore.push(route);
  }
}

/**
 * Register multiple route definitions at once
 */
export function registerRoutes(routes: RouteDefinition[]): void {
  for (const route of routes) {
    registerRoute(route);
  }
}

/**
 * Get all registered routes
 */
export function getRoutes(): ReadonlyArray<RouteDefinition> {
  return routeStore;
}

/**
 * Get routes filtered by category
 */
export function getRoutesByCategory(
  category: RouteCategory
): ReadonlyArray<RouteDefinition> {
  return routeStore.filter((r) => r.category === category);
}

/**
 * Get a route by its operation ID
 */
export function getRouteByOperationId(
  operationId: string
): RouteDefinition | undefined {
  return routeStore.find((r) => r.operationId === operationId);
}

/**
 * Get all unique categories that have registered routes
 */
export function getActiveCategories(): RouteCategory[] {
  const categories = new Set<RouteCategory>();
  for (const route of routeStore) {
    categories.add(route.category);
  }
  return Array.from(categories);
}

/**
 * Get tag definitions for active categories only
 */
export function getActiveTags(): TagDefinition[] {
  const activeCategories = getActiveCategories();
  return REGISTRY_CONFIG.tags.filter((tag) =>
    activeCategories.includes(tag.name)
  );
}

/**
 * Get total number of registered routes
 */
export function getRouteCount(): number {
  return routeStore.length;
}

/**
 * Clear all registered routes (for testing)
 */
export function clearRoutes(): void {
  routeStore.length = 0;
}

/**
 * Get summary statistics for the registry
 */
export function getRegistryStats(): {
  totalRoutes: number;
  byCategory: Record<string, number>;
  byMethod: Record<string, number>;
  byAuth: Record<string, number>;
} {
  const byCategory: Record<string, number> = {};
  const byMethod: Record<string, number> = {};
  const byAuth: Record<string, number> = {};

  for (const route of routeStore) {
    byCategory[route.category] = (byCategory[route.category] || 0) + 1;
    byMethod[route.method] = (byMethod[route.method] || 0) + 1;
    byAuth[route.auth] = (byAuth[route.auth] || 0) + 1;
  }

  return {
    totalRoutes: routeStore.length,
    byCategory,
    byMethod,
    byAuth,
  };
}
