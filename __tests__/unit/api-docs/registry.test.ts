/**
 * Route Registry Tests
 * @module __tests__/unit/api-docs/registry.test.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
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
  REGISTRY_CONFIG,
} from '@/lib/api-docs/registry';
import type { RouteDefinition } from '@/lib/api-docs/types';

// ============================================================================
// TEST FIXTURES
// ============================================================================

const mockRoute: RouteDefinition = {
  operationId: 'testRoute',
  method: 'GET',
  path: '/api/test',
  summary: 'Test route',
  description: 'A test route for unit testing',
  category: 'Health',
  auth: 'none',
  rateLimit: '100/min',
  parameters: [],
  responses: [{ statusCode: 200, description: 'OK' }],
};

const mockAdminRoute: RouteDefinition = {
  operationId: 'testAdmin',
  method: 'GET',
  path: '/api/admin/test',
  summary: 'Admin test',
  description: 'An admin test route',
  category: 'Admin',
  auth: 'admin',
  rateLimit: '50/min',
  parameters: [],
  responses: [{ statusCode: 200, description: 'OK' }],
};

const mockPostRoute: RouteDefinition = {
  operationId: 'createThing',
  method: 'POST',
  path: '/api/thing',
  summary: 'Create thing',
  description: 'Create a new thing',
  category: 'Community',
  auth: 'bearer',
  rateLimit: '20/hour',
  parameters: [
    { name: 'name', in: 'body', required: true, description: 'Name', type: 'string' },
  ],
  responses: [{ statusCode: 201, description: 'Created' }],
};

// ============================================================================
// TESTS
// ============================================================================

describe('Route Registry', () => {
  beforeEach(() => {
    clearRoutes();
  });

  describe('REGISTRY_CONFIG', () => {
    it('has correct API metadata', () => {
      expect(REGISTRY_CONFIG.title).toBe('Idesaign API');
      expect(REGISTRY_CONFIG.version).toBe('1.0.0');
    });

    it('has all server environments', () => {
      expect(REGISTRY_CONFIG.servers).toHaveLength(3);
      const urls = REGISTRY_CONFIG.servers.map((s) => s.url);
      expect(urls).toContain('https://idesaign.ai');
      expect(urls).toContain('https://staging.idesaign.ai');
      expect(urls).toContain('http://localhost:3000');
    });

    it('has tag definitions for all categories', () => {
      expect(REGISTRY_CONFIG.tags.length).toBeGreaterThanOrEqual(20);
      const names = REGISTRY_CONFIG.tags.map((t) => t.name);
      expect(names).toContain('Health');
      expect(names).toContain('AI Tools');
      expect(names).toContain('Admin');
      expect(names).toContain('Admin Audit');
      expect(names).toContain('Notifications');
    });
  });

  describe('registerRoute', () => {
    it('adds a route to the store', () => {
      registerRoute(mockRoute);
      expect(getRouteCount()).toBe(1);
    });

    it('prevents duplicate operation IDs by replacing', () => {
      registerRoute(mockRoute);
      const updated = { ...mockRoute, summary: 'Updated summary' };
      registerRoute(updated);
      expect(getRouteCount()).toBe(1);
      expect(getRoutes()[0].summary).toBe('Updated summary');
    });
  });

  describe('registerRoutes', () => {
    it('registers multiple routes at once', () => {
      registerRoutes([mockRoute, mockAdminRoute, mockPostRoute]);
      expect(getRouteCount()).toBe(3);
    });
  });

  describe('getRoutes', () => {
    it('returns empty array when no routes registered', () => {
      expect(getRoutes()).toEqual([]);
    });

    it('returns all registered routes', () => {
      registerRoutes([mockRoute, mockAdminRoute]);
      const routes = getRoutes();
      expect(routes).toHaveLength(2);
    });

    it('returns readonly array', () => {
      registerRoute(mockRoute);
      const routes = getRoutes();
      expect(Array.isArray(routes)).toBe(true);
    });
  });

  describe('getRoutesByCategory', () => {
    it('filters routes by category', () => {
      registerRoutes([mockRoute, mockAdminRoute, mockPostRoute]);
      const healthRoutes = getRoutesByCategory('Health');
      expect(healthRoutes).toHaveLength(1);
      expect(healthRoutes[0].operationId).toBe('testRoute');
    });

    it('returns empty array for categories with no routes', () => {
      registerRoute(mockRoute);
      expect(getRoutesByCategory('Webhooks')).toEqual([]);
    });
  });

  describe('getRouteByOperationId', () => {
    it('finds route by operation ID', () => {
      registerRoutes([mockRoute, mockAdminRoute]);
      const found = getRouteByOperationId('testAdmin');
      expect(found).toBeDefined();
      expect(found?.path).toBe('/api/admin/test');
    });

    it('returns undefined for unknown operation ID', () => {
      registerRoute(mockRoute);
      expect(getRouteByOperationId('nonexistent')).toBeUndefined();
    });
  });

  describe('getActiveCategories', () => {
    it('returns unique categories from registered routes', () => {
      registerRoutes([mockRoute, mockAdminRoute, mockPostRoute]);
      const categories = getActiveCategories();
      expect(categories).toContain('Health');
      expect(categories).toContain('Admin');
      expect(categories).toContain('Community');
      expect(categories).toHaveLength(3);
    });
  });

  describe('getActiveTags', () => {
    it('returns tag definitions for active categories only', () => {
      registerRoute(mockRoute);
      const tags = getActiveTags();
      expect(tags).toHaveLength(1);
      expect(tags[0].name).toBe('Health');
      expect(tags[0].description).toBeDefined();
    });
  });

  describe('clearRoutes', () => {
    it('removes all registered routes', () => {
      registerRoutes([mockRoute, mockAdminRoute]);
      expect(getRouteCount()).toBe(2);
      clearRoutes();
      expect(getRouteCount()).toBe(0);
    });
  });

  describe('getRegistryStats', () => {
    it('returns correct statistics', () => {
      registerRoutes([mockRoute, mockAdminRoute, mockPostRoute]);
      const stats = getRegistryStats();

      expect(stats.totalRoutes).toBe(3);
      expect(stats.byCategory).toEqual({
        Health: 1,
        Admin: 1,
        Community: 1,
      });
      expect(stats.byMethod).toEqual({
        GET: 2,
        POST: 1,
      });
      expect(stats.byAuth).toEqual({
        none: 1,
        admin: 1,
        bearer: 1,
      });
    });

    it('returns zeros when empty', () => {
      const stats = getRegistryStats();
      expect(stats.totalRoutes).toBe(0);
      expect(stats.byCategory).toEqual({});
    });
  });
});
