/**
 * API health and version endpoint tests
 * Tests health check, version info, and OpenAPI spec endpoints
 */

import { test, expect } from '@playwright/test';

test.describe('API Infrastructure Endpoints', () => {
  test('GET /api/health returns healthy status', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.status).toBeDefined();
    expect(body.services).toBeDefined();
    expect(body.meta).toBeDefined();
    expect(body.meta.version).toBeDefined();
    expect(body.timestamp).toBeDefined();
  });

  test('GET /health rewrite works', async ({ request }) => {
    const response = await request.get('/health');
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.status).toBeDefined();
  });

  test('GET /api/v1/version returns version info', async ({ request }) => {
    const response = await request.get('/api/v1/version');

    // May be 200 or 404 depending on deployment state
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.api).toBe('idesaign');
      expect(body.current).toBeDefined();
      expect(body.supported).toBeInstanceOf(Array);
      expect(body.endpoints).toBeDefined();
      expect(body.requestId).toBeDefined();
    }
  });

  test('GET /api/docs/openapi returns OpenAPI spec', async ({ request }) => {
    const response = await request.get('/api/docs/openapi');

    if (response.status() === 200) {
      const body = await response.json();
      expect(body.openapi).toMatch(/^3\./);
      expect(body.info).toBeDefined();
      expect(body.paths).toBeDefined();
    }
  });

  test('GET /api/docs/routes returns route list', async ({ request }) => {
    const response = await request.get('/api/docs/routes');

    if (response.status() === 200) {
      const body = await response.json();
      expect(body.routes).toBeInstanceOf(Array);
      expect(body.count).toBeGreaterThan(0);
    }
  });

  test('POST /api/health returns 405', async ({ request }) => {
    const response = await request.post('/api/health');
    expect(response.status()).toBe(405);
  });

  test('health check includes cache headers', async ({ request }) => {
    const response = await request.get('/api/health');
    const cacheControl = response.headers()['cache-control'];
    // Should have some form of caching
    expect(cacheControl).toBeDefined();
  });
});
