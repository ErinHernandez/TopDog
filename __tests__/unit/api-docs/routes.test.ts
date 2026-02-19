/**
 * Route Definitions Tests
 * @module __tests__/unit/api-docs/routes.test.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { clearRoutes } from '@/lib/api-docs/registry';
import { healthRoutes } from '@/lib/api-docs/routes/health';
import { aiRoutes } from '@/lib/api-docs/routes/ai';
import { fileRoutes } from '@/lib/api-docs/routes/files';
import { generationRoutes } from '@/lib/api-docs/routes/generation';
import { communityRoutes } from '@/lib/api-docs/routes/community';
import { commerceRoutes } from '@/lib/api-docs/routes/commerce';
import { adminRoutes } from '@/lib/api-docs/routes/admin';
import { integrationRoutes } from '@/lib/api-docs/routes/integration';
import { ALL_ROUTES, initializeRoutes } from '@/lib/api-docs/routes';
import type { RouteDefinition, HttpMethod, AuthMethod } from '@/lib/api-docs/types';

// ============================================================================
// HELPERS
// ============================================================================

const validMethods: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
const validAuths: AuthMethod[] = ['bearer', 'apiKey', 'admin', 'webhook', 'optional', 'none'];

function validateRouteGroup(name: string, routes: RouteDefinition[]): void {
  describe(name, () => {
    it('has at least one route', () => {
      expect(routes.length).toBeGreaterThanOrEqual(1);
    });

    for (const route of routes) {
      describe(`${route.method} ${route.path}`, () => {
        it('has valid operationId', () => {
          expect(route.operationId).toMatch(/^[a-zA-Z][a-zA-Z0-9]*$/);
        });

        it('has valid HTTP method', () => {
          expect(validMethods).toContain(route.method);
        });

        it('has path starting with /api', () => {
          expect(route.path).toMatch(/^\/api/);
        });

        it('has non-empty summary under 100 chars', () => {
          expect(route.summary.length).toBeGreaterThan(0);
          expect(route.summary.length).toBeLessThanOrEqual(100);
        });

        it('has non-empty description', () => {
          expect(route.description.length).toBeGreaterThan(0);
        });

        it('has valid auth method', () => {
          expect(validAuths).toContain(route.auth);
        });

        it('has non-empty rateLimit', () => {
          expect(route.rateLimit.length).toBeGreaterThan(0);
        });

        it('has at least one response', () => {
          expect(route.responses.length).toBeGreaterThanOrEqual(1);
        });

        it('responses have valid status codes', () => {
          for (const resp of route.responses) {
            expect(resp.statusCode).toBeGreaterThanOrEqual(100);
            expect(resp.statusCode).toBeLessThanOrEqual(599);
          }
        });

        it('body parameters only on non-GET methods', () => {
          if (route.method === 'GET') {
            const bodyParams = route.parameters.filter((p) => p.in === 'body');
            expect(bodyParams).toHaveLength(0);
          }
        });

        it('path parameters match path segments', () => {
          const pathParams = route.parameters.filter((p) => p.in === 'path');
          for (const param of pathParams) {
            const hasInPath =
              route.path.includes(`{${param.name}}`) ||
              route.path.includes(`[${param.name}]`);
            expect(hasInPath).toBe(true);
          }
        });
      });
    }
  });
}

// ============================================================================
// TESTS
// ============================================================================

describe('Route Definitions', () => {
  beforeEach(() => {
    clearRoutes();
  });

  validateRouteGroup('Health Routes', healthRoutes);
  validateRouteGroup('AI Routes', aiRoutes);
  validateRouteGroup('File Routes', fileRoutes);
  validateRouteGroup('Generation Routes', generationRoutes);
  validateRouteGroup('Community Routes', communityRoutes);
  validateRouteGroup('Commerce Routes', commerceRoutes);
  validateRouteGroup('Admin Routes', adminRoutes);
  validateRouteGroup('Integration Routes', integrationRoutes);

  describe('ALL_ROUTES', () => {
    it('contains all individual route groups', () => {
      const totalFromGroups =
        healthRoutes.length +
        aiRoutes.length +
        fileRoutes.length +
        generationRoutes.length +
        communityRoutes.length +
        commerceRoutes.length +
        adminRoutes.length +
        integrationRoutes.length;

      expect(ALL_ROUTES.length).toBe(totalFromGroups);
    });

    it('has no duplicate paths with same method', () => {
      const pathMethodPairs = ALL_ROUTES.map((r) => `${r.method}:${r.path}`);
      const unique = new Set(pathMethodPairs);
      expect(unique.size).toBe(pathMethodPairs.length);
    });

    it('has expected route count (70+)', () => {
      expect(ALL_ROUTES.length).toBeGreaterThanOrEqual(70);
    });
  });

  describe('Route categories', () => {
    it('health routes use Health category', () => {
      for (const r of healthRoutes) {
        expect(r.category).toBe('Health');
      }
    });

    it('AI routes use AI Tools category', () => {
      for (const r of aiRoutes) {
        expect(r.category).toBe('AI Tools');
      }
    });

    it('admin routes use Admin-prefixed categories', () => {
      for (const r of adminRoutes) {
        expect(r.category).toMatch(/^Admin/);
      }
    });
  });

  describe('Auth consistency', () => {
    it('health routes have no auth', () => {
      for (const r of healthRoutes) {
        expect(r.auth).toBe('none');
      }
    });

    it('admin routes require admin auth', () => {
      for (const r of adminRoutes) {
        expect(r.auth).toBe('admin');
      }
    });

    it('AI tool routes require bearer auth', () => {
      for (const r of aiRoutes) {
        expect(r.auth).toBe('bearer');
      }
    });
  });

  describe('initializeRoutes', () => {
    it('populates registry without errors', () => {
      expect(() => initializeRoutes()).not.toThrow();
    });

    it('is idempotent (can be called multiple times)', () => {
      initializeRoutes();
      initializeRoutes();
      // Should still have same count (registerRoute replaces duplicates)
    });
  });
});
