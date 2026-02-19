/**
 * API Handler Factory Tests
 *
 * Tests the factory functions for creating pre-composed API routes with
 * appropriate middleware stacks for authenticated, public, and admin routes.
 *
 * @module __tests__/unit/api/createApiHandler
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import {
  createAuthenticatedRoute,
  createPublicRoute,
  createAdminRoute,
} from '@/lib/studio/api/createApiHandler';

// ============================================================================
// HOISTED MOCKS
// ============================================================================

const { mockWithAuth } = vi.hoisted(() => ({
  mockWithAuth: vi.fn((handler) => handler),
}));

vi.mock('@/lib/studio/middleware/withAuth', () => ({
  withAuth: mockWithAuth,
  withOptionalAuth: vi.fn((handler) => handler),
}));

// ============================================================================
// MOCK UTILITIES
// ============================================================================

function createMockReq(overrides = {}): NextApiRequest {
  return {
    method: 'POST',
    headers: {},
    body: {},
    query: {},
    url: '/api/test',
    socket: {
      remoteAddress: '127.0.0.1',
    },
    ...overrides,
  } as unknown as NextApiRequest;
}

function createMockRes(): NextApiResponse {
  const res: any = {
    headersSent: false,
    statusCode: 200,
    _headers: {},
    _data: null,
  };

  res.status = vi.fn((code: number) => {
    res.statusCode = code;
    return res;
  });

  res.json = vi.fn((data: any) => {
    res._data = data;
    res.headersSent = true;
    return res;
  });

  res.setHeader = vi.fn((key: string, value: string) => {
    res._headers[key] = value;
    return res;
  });

  res.end = vi.fn(function (this: any) {
    res.headersSent = true;
    return res;
  });

  return res;
}

// ============================================================================
// TESTS
// ============================================================================

describe('createAuthenticatedRoute', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    mockWithAuth.mockClear();
    mockWithAuth.mockImplementation((handler) => handler);
  });

  it('creates authenticated route with validation', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const schema = z.object({
      name: z.string(),
    });

    const handler = vi.fn(async (req, res) => {
      res.status(200).json({ name: req.validatedBody.name });
    });

    const route = createAuthenticatedRoute(schema, handler as any);
    const req = createMockReq({
      body: { name: 'Alice' },
    });
    const res = createMockRes();

    await route(req, res);

    expect(res.json).toHaveBeenCalledWith({ name: 'Alice' });
  });

  it('rejects invalid body in authenticated route', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const schema = z.object({
      email: z.string().email(),
    });

    const handler = vi.fn();

    const route = createAuthenticatedRoute(schema, handler as any);
    const req = createMockReq({
      body: { email: 'invalid' },
    });
    const res = createMockRes();

    await route(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(handler).not.toHaveBeenCalled();
  });

  it('applies authentication middleware', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const schema = z.object({}).strict();
    const handler = vi.fn(async (req: any, res: any) => {
      res.status(200).json({ success: true });
    });

    const route = createAuthenticatedRoute(schema, handler as any);
    const req = createMockReq({ body: {} });
    const res = createMockRes();

    await route(req, res);

    // withAuth is called when the route is invoked, not at creation time
    expect(mockWithAuth).toHaveBeenCalled();
  });

  it('applies error handler middleware', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const schema = z.object({});
    const handler = vi.fn(async () => {
      throw new Error('Test error');
    });

    const route = createAuthenticatedRoute(schema, handler as any);
    const req = createMockReq();
    const res = createMockRes();

    await route(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('applies rate limiting', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const schema = z.object({});
    const handler = vi.fn(async (req, res) => {
      res.status(200).json({ success: true });
    });

    const route = createAuthenticatedRoute(schema, handler as any);

    // Make multiple requests to trigger rate limit
    const requests = Array.from({ length: 61 }, () => createMockReq());
    const responses = Array.from({ length: 61 }, () => createMockRes());

    for (let i = 0; i < 61; i++) {
      await route(requests[i], responses[i]);
    }

    // The 61st request should be rate limited (default is 60 per minute)
    expect(responses[60].status).toHaveBeenCalledWith(429);
  });

  it('uses custom rate limit config', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const schema = z.object({});
    const handler = vi.fn(async (req, res) => {
      res.status(200).json({ success: true });
    });

    const route = createAuthenticatedRoute(schema, handler as any, {
      rateLimit: { maxRequests: 2, windowMs: 1000 },
    });

    const req1 = createMockReq();
    const res1 = createMockRes();
    const req2 = createMockReq();
    const res2 = createMockRes();
    const req3 = createMockReq();
    const res3 = createMockRes();

    await route(req1, res1);
    await route(req2, res2);
    await route(req3, res3);

    expect(res3.status).toHaveBeenCalledWith(429);
  });

  it('supports additional middleware', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const schema = z.object({});
    const additionalMiddleware = vi.fn(async (req, res, next) => {
      (req as any).customFlag = true;
      await next();
    });

    const handler = vi.fn(async (req, res) => {
      res.status(200).json({ customFlag: (req as any).customFlag });
    });

    const route = createAuthenticatedRoute(schema, handler as any, {
      additionalMiddleware: [additionalMiddleware as any],
    });

    const req = createMockReq();
    const res = createMockRes();

    await route(req, res);

    expect(additionalMiddleware).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ customFlag: true });
  });

  it('includes request logger', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const schema = z.object({});
    const handler = vi.fn(async (req, res) => {
      res.status(200).json({ success: true });
    });

    const route = createAuthenticatedRoute(schema, handler as any);
    const req = createMockReq();
    const res = createMockRes();

    await route(req, res);

    // Logger fires after handler completes
    expect(logSpy).toHaveBeenCalled();
    const logStr = logSpy.mock.calls.find((c) => {
      try {
        const parsed = JSON.parse(c[0]);
        return parsed.level === 'info' && parsed.method !== undefined;
      } catch {
        return false;
      }
    });
    expect(logStr).toBeDefined();
  });

  it('adds requestId to request', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const schema = z.object({});
    const handler = vi.fn(async (req, res) => {
      res.status(200).json({ requestId: (req as any).requestId });
    });

    const route = createAuthenticatedRoute(schema, handler as any);
    const req = createMockReq();
    const res = createMockRes();

    await route(req, res);

    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall.requestId).toBeDefined();
  });
});

describe('createPublicRoute', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates public route with CORS', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const schema = z.object({
      message: z.string(),
    });

    const handler = vi.fn(async (req, res) => {
      res.status(200).json({ message: req.validatedBody.message });
    });

    const route = createPublicRoute(schema, handler as any);
    const req = createMockReq({
      body: { message: 'Hello' },
      headers: { origin: 'https://idesaign.ai' },
    });
    const res = createMockRes();

    await route(req, res);

    expect(res.json).toHaveBeenCalledWith({ message: 'Hello' });
  });

  it('includes CORS middleware', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const schema = z.object({});
    const handler = vi.fn(async (req, res) => {
      res.status(200).json({ success: true });
    });

    const route = createPublicRoute(schema, handler as any);
    const req = createMockReq({
      method: 'OPTIONS',
      headers: { origin: 'https://idesaign.ai' },
    });
    const res = createMockRes();

    await route(req, res);

    // CORS middleware should handle OPTIONS requests
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('handles preflight requests', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const schema = z.object({});
    const handler = vi.fn();

    const route = createPublicRoute(schema, handler as any);
    const req = createMockReq({
      method: 'OPTIONS',
    });
    const res = createMockRes();

    await route(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(handler).not.toHaveBeenCalled();
  });

  it('applies lower rate limit for public routes', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const schema = z.object({});
    const handler = vi.fn(async (req, res) => {
      res.status(200).json({ success: true });
    });

    const route = createPublicRoute(schema, handler as any);

    // Make 31 requests (default public limit is 30 per minute)
    const requests = Array.from({ length: 31 }, () => createMockReq());
    const responses = Array.from({ length: 31 }, () => createMockRes());

    for (let i = 0; i < 31; i++) {
      await route(requests[i], responses[i]);
    }

    expect(responses[30].status).toHaveBeenCalledWith(429);
  });

  it('validates request body', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const schema = z.object({
      data: z.string(),
    });

    const handler = vi.fn();

    const route = createPublicRoute(schema, handler as any);
    const req = createMockReq({
      body: { data: 123 }, // Invalid type
    });
    const res = createMockRes();

    await route(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(handler).not.toHaveBeenCalled();
  });

  it('includes error handler', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const schema = z.object({});
    const handler = vi.fn(async () => {
      throw new Error('Public route error');
    });

    const route = createPublicRoute(schema, handler as any);
    const req = createMockReq();
    const res = createMockRes();

    await route(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('supports custom rate limit for public routes', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const schema = z.object({});
    const handler = vi.fn(async (req, res) => {
      res.status(200).json({ success: true });
    });

    const route = createPublicRoute(schema, handler as any, {
      rateLimit: { maxRequests: 5, windowMs: 1000 },
    });

    const requests = Array.from({ length: 6 }, () => createMockReq());
    const responses = Array.from({ length: 6 }, () => createMockRes());

    for (let i = 0; i < 6; i++) {
      await route(requests[i], responses[i]);
    }

    expect(responses[5].status).toHaveBeenCalledWith(429);
  });
});

describe('createAdminRoute', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    mockWithAuth.mockClear();
    mockWithAuth.mockImplementation((handler) => handler);
  });

  it('creates admin route with validation', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const schema = z.object({
      action: z.string(),
    });

    const handler = vi.fn(async (req, res) => {
      res.status(200).json({ action: req.validatedBody.action });
    });

    const route = createAdminRoute(schema, handler as any);
    const req = createMockReq({
      body: { action: 'delete-user' },
    });
    (req as any).customClaims = { admin: true };
    const res = createMockRes();

    await route(req, res);

    expect(res.json).toHaveBeenCalledWith({ action: 'delete-user' });
  });

  it('rejects non-admin users', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const schema = z.object({});
    const handler = vi.fn();

    const route = createAdminRoute(schema, handler as any);
    const req = createMockReq();
    (req as any).customClaims = { admin: false };
    const res = createMockRes();

    await route(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(handler).not.toHaveBeenCalled();
  });

  it('rejects users without admin claim', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const schema = z.object({});
    const handler = vi.fn();

    const route = createAdminRoute(schema, handler as any);
    const req = createMockReq();
    (req as any).customClaims = {}; // No admin claim
    const res = createMockRes();

    await route(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('applies authentication middleware', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const schema = z.object({}).strict();
    const handler = vi.fn(async (req: any, res: any) => {
      res.status(200).json({ success: true });
    });

    const route = createAdminRoute(schema, handler as any);
    const req = createMockReq({ body: {} });
    (req as any).customClaims = { admin: true };
    const res = createMockRes();

    await route(req, res);

    // withAuth is called when the route is invoked, not at creation time
    expect(mockWithAuth).toHaveBeenCalled();
  });

  it('applies admin check middleware', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const schema = z.object({});
    const handler = vi.fn(async (req, res) => {
      res.status(200).json({ success: true });
    });

    const route = createAdminRoute(schema, handler as any);
    const req = createMockReq();
    (req as any).customClaims = { admin: true };
    const res = createMockRes();

    await route(req, res);

    expect(handler).toHaveBeenCalled();
  });

  it('validates admin route requests', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const schema = z.object({
      userId: z.string(),
    });

    const handler = vi.fn();

    const route = createAdminRoute(schema, handler as any);
    const req = createMockReq({
      body: { userId: 123 }, // Invalid type
    });
    (req as any).customClaims = { admin: true };
    const res = createMockRes();

    await route(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(handler).not.toHaveBeenCalled();
  });

  it('applies error handler to admin routes', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const schema = z.object({});
    const handler = vi.fn(async () => {
      throw new Error('Admin operation failed');
    });

    const route = createAdminRoute(schema, handler as any);
    const req = createMockReq();
    (req as any).customClaims = { admin: true };
    const res = createMockRes();

    await route(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('includes request logger for admin routes', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const schema = z.object({});
    const handler = vi.fn(async (req, res) => {
      res.status(200).json({ success: true });
    });

    const route = createAdminRoute(schema, handler as any);
    const req = createMockReq();
    (req as any).customClaims = { admin: true };
    const res = createMockRes();

    await route(req, res);

    // Logger fires after handler completes
    expect(logSpy).toHaveBeenCalled();
    const logStr = logSpy.mock.calls.find((c) => {
      try {
        const parsed = JSON.parse(c[0]);
        return parsed.level === 'info' && parsed.method !== undefined;
      } catch {
        return false;
      }
    });
    expect(logStr).toBeDefined();
  });

  it('applies rate limiting to admin routes', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const schema = z.object({});
    const handler = vi.fn(async (req, res) => {
      res.status(200).json({ success: true });
    });

    const route = createAdminRoute(schema, handler as any);

    // Make 31 requests (default admin limit is 30 per minute)
    const requests = Array.from({ length: 31 }, () => {
      const req = createMockReq();
      (req as any).customClaims = { admin: true };
      (req as any).uid = 'admin-user';
      return req;
    });
    const responses = Array.from({ length: 31 }, () => createMockRes());

    for (let i = 0; i < 31; i++) {
      await route(requests[i], responses[i]);
    }

    expect(responses[30].status).toHaveBeenCalledWith(429);
  });

  it('supports additional middleware for admin routes', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const schema = z.object({});
    const auditMiddleware = vi.fn(async (req, res, next) => {
      (req as any).auditLogged = true;
      await next();
    });

    const handler = vi.fn(async (req, res) => {
      res.status(200).json({ auditLogged: (req as any).auditLogged });
    });

    const route = createAdminRoute(schema, handler as any, {
      additionalMiddleware: [auditMiddleware as any],
    });

    const req = createMockReq();
    (req as any).customClaims = { admin: true };
    const res = createMockRes();

    await route(req, res);

    expect(auditMiddleware).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ auditLogged: true });
  });

  it('returns forbidden error with proper format', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const schema = z.object({});
    const handler = vi.fn();

    const route = createAdminRoute(schema, handler as any);
    const req = createMockReq();
    (req as any).customClaims = { admin: false };
    (req as any).requestId = 'req-123';
    const res = createMockRes();

    await route(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall).toMatchObject({
      success: false,
      error: {
        code: 'FORBIDDEN',
      },
    });
  });
});
