/**
 * OpenAPI Spec Generator Tests
 * @module __tests__/unit/api-docs/specGenerator.test.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateSpec,
  generateSpecJson,
  getSpecSummary,
} from '@/lib/api-docs/specGenerator';
import {
  registerRoutes,
  clearRoutes,
} from '@/lib/api-docs/registry';
import { initializeRoutes, ALL_ROUTES } from '@/lib/api-docs/routes';
import type { RouteDefinition } from '@/lib/api-docs/types';

// ============================================================================
// FIXTURES
// ============================================================================

const sampleRoutes: RouteDefinition[] = [
  {
    operationId: 'getHealth',
    method: 'GET',
    path: '/api/health',
    summary: 'Health check',
    description: 'Basic health check',
    category: 'Health',
    auth: 'none',
    rateLimit: 'Unlimited',
    parameters: [],
    responses: [
      { statusCode: 200, description: 'OK', example: '{"status":"ok"}' },
    ],
  },
  {
    operationId: 'listProjects',
    method: 'GET',
    path: '/api/studio/projects/list',
    summary: 'List projects',
    description: 'List user projects',
    category: 'Projects',
    auth: 'bearer',
    rateLimit: '200/min',
    parameters: [
      { name: 'limit', in: 'query', required: false, description: 'Max results', type: 'integer', default: 20 },
      { name: 'offset', in: 'query', required: false, description: 'Offset', type: 'integer', default: 0 },
    ],
    responses: [
      { statusCode: 200, description: 'Project list', example: '{"projects":[],"total":0}' },
    ],
  },
  {
    operationId: 'createProject',
    method: 'POST',
    path: '/api/studio/projects/create',
    summary: 'Create project',
    description: 'Create a new project',
    category: 'Projects',
    auth: 'bearer',
    rateLimit: '50/hour',
    parameters: [
      { name: 'name', in: 'body', required: true, description: 'Project name', type: 'string' },
      { name: 'width', in: 'body', required: false, description: 'Canvas width', type: 'integer', default: 1920 },
    ],
    responses: [
      { statusCode: 201, description: 'Created', example: '{"projectId":"prj_abc"}' },
    ],
  },
  {
    operationId: 'getProject',
    method: 'GET',
    path: '/api/studio/projects/[id]',
    summary: 'Get project',
    description: 'Get project by ID',
    category: 'Projects',
    auth: 'bearer',
    rateLimit: '200/min',
    parameters: [
      { name: 'id', in: 'path', required: true, description: 'Project ID', type: 'string' },
    ],
    responses: [
      { statusCode: 200, description: 'Project', example: '{"projectId":"prj_abc"}' },
      { statusCode: 404, description: 'Not found' },
    ],
  },
  {
    operationId: 'listAuditLogs',
    method: 'GET',
    path: '/api/studio/admin/audit/list',
    summary: 'Query audit logs',
    description: 'Query audit logs',
    category: 'Admin Audit',
    auth: 'admin',
    rateLimit: '100/min',
    parameters: [
      { name: 'category', in: 'query', required: false, description: 'Filter', type: 'string', enum: ['admin', 'auth', 'content'] },
    ],
    responses: [
      { statusCode: 200, description: 'Audit entries', example: '{"entries":[]}' },
    ],
  },
  {
    operationId: 'uploadImage',
    method: 'POST',
    path: '/api/studio/upload/image',
    summary: 'Upload image',
    description: 'Upload an image file',
    category: 'Uploads',
    auth: 'bearer',
    rateLimit: '50/hour',
    bodyLimit: '10mb',
    parameters: [
      { name: 'image', in: 'body', required: true, description: 'Image file', type: 'file' },
    ],
    responses: [
      { statusCode: 200, description: 'Uploaded', example: '{"assetId":"img_abc"}' },
    ],
  },
];

// ============================================================================
// TESTS
// ============================================================================

describe('OpenAPI Spec Generator', () => {
  beforeEach(() => {
    clearRoutes();
  });

  describe('generateSpec', () => {
    it('produces valid OpenAPI 3.1.0 structure', () => {
      registerRoutes(sampleRoutes);
      const spec = generateSpec();

      expect(spec.openapi).toBe('3.1.0');
      expect(spec.info.title).toBe('Idesaign API');
      expect(spec.info.version).toBe('1.0.0');
      expect(spec.servers).toHaveLength(3);
      expect(spec.components.securitySchemes).toBeDefined();
      expect(spec.components.schemas).toBeDefined();
      expect(spec.components.responses).toBeDefined();
    });

    it('generates paths for all registered routes', () => {
      registerRoutes(sampleRoutes);
      const spec = generateSpec();
      const paths = Object.keys(spec.paths);

      expect(paths).toContain('/api/health');
      expect(paths).toContain('/api/studio/projects/list');
      expect(paths).toContain('/api/studio/projects/create');
      expect(paths).toContain('/api/studio/admin/audit/list');
    });

    it('converts Next.js dynamic routes to OpenAPI path params', () => {
      registerRoutes(sampleRoutes);
      const spec = generateSpec();

      // [id] should become {id}
      expect(spec.paths['/api/studio/projects/{id}']).toBeDefined();
      expect(spec.paths['/api/studio/projects/[id]']).toBeUndefined();
    });

    it('sorts paths alphabetically', () => {
      registerRoutes(sampleRoutes);
      const spec = generateSpec();
      const paths = Object.keys(spec.paths);

      for (let i = 1; i < paths.length; i++) {
        expect(paths[i] >= paths[i - 1]).toBe(true);
      }
    });

    it('sets correct HTTP methods', () => {
      registerRoutes(sampleRoutes);
      const spec = generateSpec();

      expect(spec.paths['/api/health']?.get).toBeDefined();
      expect(spec.paths['/api/studio/projects/create']?.post).toBeDefined();
    });

    it('includes tags from active categories', () => {
      registerRoutes(sampleRoutes);
      const spec = generateSpec();
      const tagNames = spec.tags.map((t) => t.name);

      expect(tagNames).toContain('Health');
      expect(tagNames).toContain('Projects');
      expect(tagNames).toContain('Admin Audit');
      expect(tagNames).toContain('Uploads');
    });

    it('sets security based on auth method', () => {
      registerRoutes(sampleRoutes);
      const spec = generateSpec();

      // No auth route
      const healthOp = spec.paths['/api/health']?.get;
      expect(healthOp?.security).toEqual([]);

      // Bearer auth route
      const listOp = spec.paths['/api/studio/projects/list']?.get;
      expect(listOp?.security).toEqual([{ BearerAuth: [] }]);

      // Admin auth route
      const auditOp = spec.paths['/api/studio/admin/audit/list']?.get;
      expect(auditOp?.security).toEqual([{ AdminAuth: [] }]);
    });

    it('includes query parameters for GET routes', () => {
      registerRoutes(sampleRoutes);
      const spec = generateSpec();

      const listOp = spec.paths['/api/studio/projects/list']?.get;
      expect(listOp?.parameters).toBeDefined();
      expect(listOp?.parameters).toHaveLength(2);

      const limitParam = listOp?.parameters?.find((p) => p.name === 'limit');
      expect(limitParam?.in).toBe('query');
      expect(limitParam?.required).toBe(false);
      expect(limitParam?.schema.default).toBe(20);
    });

    it('includes path parameters', () => {
      registerRoutes(sampleRoutes);
      const spec = generateSpec();

      const getOp = spec.paths['/api/studio/projects/{id}']?.get;
      expect(getOp?.parameters).toHaveLength(1);
      expect(getOp?.parameters?.[0].name).toBe('id');
      expect(getOp?.parameters?.[0].in).toBe('path');
      expect(getOp?.parameters?.[0].required).toBe(true);
    });

    it('generates request body for POST routes', () => {
      registerRoutes(sampleRoutes);
      const spec = generateSpec();

      const createOp = spec.paths['/api/studio/projects/create']?.post;
      expect(createOp?.requestBody).toBeDefined();
      expect(createOp?.requestBody?.required).toBe(true);

      const content = createOp?.requestBody?.content['application/json'];
      expect(content).toBeDefined();
      expect(content?.schema.properties?.name).toBeDefined();
    });

    it('uses multipart/form-data for file uploads', () => {
      registerRoutes(sampleRoutes);
      const spec = generateSpec();

      const uploadOp = spec.paths['/api/studio/upload/image']?.post;
      expect(uploadOp?.requestBody?.content['multipart/form-data']).toBeDefined();
    });

    it('includes enum values in parameters', () => {
      registerRoutes(sampleRoutes);
      const spec = generateSpec();

      const auditOp = spec.paths['/api/studio/admin/audit/list']?.get;
      const categoryParam = auditOp?.parameters?.find((p) => p.name === 'category');
      expect(categoryParam?.schema.enum).toEqual(['admin', 'auth', 'content']);
    });

    it('adds standard error responses based on auth', () => {
      registerRoutes(sampleRoutes);
      const spec = generateSpec();

      // Bearer auth routes get 401 and 429
      const listOp = spec.paths['/api/studio/projects/list']?.get;
      expect(listOp?.responses['401']).toBeDefined();
      expect(listOp?.responses['429']).toBeDefined();

      // Admin routes also get 403
      const auditOp = spec.paths['/api/studio/admin/audit/list']?.get;
      expect(auditOp?.responses['401']).toBeDefined();
      expect(auditOp?.responses['403']).toBeDefined();

      // No-auth routes don't get 401
      const healthOp = spec.paths['/api/health']?.get;
      expect(healthOp?.responses['401']).toBeUndefined();
    });

    it('parses response examples as JSON', () => {
      registerRoutes(sampleRoutes);
      const spec = generateSpec();

      const healthOp = spec.paths['/api/health']?.get;
      const content = healthOp?.responses['200']?.content?.['application/json'];
      expect(content?.example).toEqual({ status: 'ok' });
    });

    it('includes security scheme definitions', () => {
      registerRoutes(sampleRoutes);
      const spec = generateSpec();

      expect(spec.components.securitySchemes.BearerAuth).toBeDefined();
      expect(spec.components.securitySchemes.BearerAuth.type).toBe('http');
      expect(spec.components.securitySchemes.ApiKeyAuth).toBeDefined();
      expect(spec.components.securitySchemes.ApiKeyAuth.type).toBe('apiKey');
      expect(spec.components.securitySchemes.AdminAuth).toBeDefined();
    });

    it('includes shared schemas', () => {
      registerRoutes(sampleRoutes);
      const spec = generateSpec();

      expect(spec.components.schemas.ErrorResponse).toBeDefined();
      expect(spec.components.schemas.PaginationMeta).toBeDefined();
    });

    it('includes shared response definitions', () => {
      registerRoutes(sampleRoutes);
      const spec = generateSpec();

      expect(spec.components.responses.Unauthorized).toBeDefined();
      expect(spec.components.responses.Forbidden).toBeDefined();
      expect(spec.components.responses.RateLimitExceeded).toBeDefined();
      expect(spec.components.responses.ServerError).toBeDefined();
    });
  });

  describe('generateSpecJson', () => {
    it('returns valid JSON string', () => {
      registerRoutes(sampleRoutes);
      const json = generateSpecJson();
      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('respects indent parameter', () => {
      registerRoutes(sampleRoutes);
      const compact = generateSpecJson(0);
      const pretty = generateSpecJson(2);
      expect(pretty.length).toBeGreaterThan(compact.length);
    });
  });

  describe('getSpecSummary', () => {
    it('returns correct summary', () => {
      registerRoutes(sampleRoutes);
      const summary = getSpecSummary();

      expect(summary.version).toBe('1.0.0');
      expect(summary.totalPaths).toBe(6); // 6 unique paths
      expect(summary.totalOperations).toBe(6);
      expect(summary.tags).toContain('Health');
      expect(summary.tags).toContain('Projects');
      expect(summary.securitySchemes).toContain('BearerAuth');
      expect(summary.securitySchemes).toContain('ApiKeyAuth');
      expect(summary.securitySchemes).toContain('AdminAuth');
    });
  });

  describe('Full route registration', () => {
    it('registers all route definitions without errors', () => {
      expect(() => initializeRoutes()).not.toThrow();
    });

    it('registers a substantial number of routes', () => {
      initializeRoutes();
      const spec = generateSpec();
      const totalOps = Object.values(spec.paths).reduce(
        (sum, methods) => sum + Object.keys(methods).length,
        0
      );
      // We defined 80+ routes
      expect(totalOps).toBeGreaterThanOrEqual(70);
    });

    it('ALL_ROUTES has no duplicate operation IDs', () => {
      const ids = ALL_ROUTES.map((r) => r.operationId);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('ALL_ROUTES all have required fields', () => {
      for (const route of ALL_ROUTES) {
        expect(route.operationId).toBeTruthy();
        expect(route.method).toBeTruthy();
        expect(route.path).toBeTruthy();
        expect(route.summary).toBeTruthy();
        expect(route.description).toBeTruthy();
        expect(route.category).toBeTruthy();
        expect(route.auth).toBeTruthy();
        expect(route.rateLimit).toBeTruthy();
        expect(Array.isArray(route.responses)).toBe(true);
        expect(route.responses.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('generates valid JSON for full spec', () => {
      initializeRoutes();
      const json = generateSpecJson();
      const parsed = JSON.parse(json);
      expect(parsed.openapi).toBe('3.1.0');
      expect(Object.keys(parsed.paths).length).toBeGreaterThanOrEqual(50);
    });
  });
});
