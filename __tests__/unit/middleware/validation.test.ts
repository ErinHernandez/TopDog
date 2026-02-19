/**
 * Validation Middleware Tests
 *
 * Tests the Zod validation middleware for request body and query validation.
 * Covers validation success, failure, error formatting, and target selection.
 *
 * @module __tests__/unit/middleware/validation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { createValidationMiddleware } from '@/lib/studio/middleware/validation';

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
    ...overrides,
  } as NextApiRequest;
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

  res.end = vi.fn();

  return res;
}

// ============================================================================
// TESTS
// ============================================================================

describe('createValidationMiddleware', () => {
  it('passes validation with valid body and calls next', async () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });

    const middleware = createValidationMiddleware(schema);
    const req = createMockReq({
      body: { name: 'John', age: 30 },
    });
    const res = createMockRes();
    const next = vi.fn(async () => {
      res.status(200).json({ success: true });
    });

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect((req as any).validatedBody).toEqual({ name: 'John', age: 30 });
  });

  it('fails validation with invalid body and returns 400', async () => {
    const schema = z.object({
      email: z.string().email(),
    });

    const middleware = createValidationMiddleware(schema);
    const req = createMockReq({
      body: { email: 'not-an-email' },
    });
    const res = createMockRes();
    const next = vi.fn();

    await middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
        }),
      })
    );
  });

  it('attaches validatedBody to request on successful validation', async () => {
    const schema = z.object({
      title: z.string(),
      description: z.string(),
    });

    const middleware = createValidationMiddleware(schema);
    const body = { title: 'Test', description: 'A test object' };
    const req = createMockReq({ body });
    const res = createMockRes();
    const next = vi.fn(async () => {});

    await middleware(req, res, next);

    expect((req as any).validatedBody).toBeDefined();
    expect((req as any).validatedBody).toEqual(body);
  });

  it('validates query params when target="query"', async () => {
    const schema = z.object({
      page: z.string().transform(Number),
      limit: z.string().transform(Number),
    });

    const middleware = createValidationMiddleware(schema, 'query');
    const req = createMockReq({
      query: { page: '1', limit: '10' },
    });
    const res = createMockRes();
    const next = vi.fn(async () => {});

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect((req as any).validatedQuery).toEqual({ page: 1, limit: 10 });
  });

  it('returns 400 with validation error details', async () => {
    const schema = z.object({
      name: z.string(),
      email: z.string().email(),
    });

    const middleware = createValidationMiddleware(schema);
    const req = createMockReq({
      body: { name: '', email: 'invalid-email' },
    });
    const res = createMockRes();
    const next = vi.fn();

    await middleware(req, res, next);

    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall.success).toBe(false);
    expect(jsonCall.error.details).toBeDefined();
    expect(jsonCall.error.details.length).toBeGreaterThan(0);
    expect(jsonCall.error.details[0]).toHaveProperty('field');
    expect(jsonCall.error.details[0]).toHaveProperty('message');
  });

  it('handles nested object validation', async () => {
    const schema = z.object({
      user: z.object({
        name: z.string(),
        email: z.string().email(),
      }),
    });

    const middleware = createValidationMiddleware(schema);
    const req = createMockReq({
      body: {
        user: { name: 'Alice', email: 'alice@example.com' },
      },
    });
    const res = createMockRes();
    const next = vi.fn(async () => {});

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect((req as any).validatedBody).toEqual({
      user: { name: 'Alice', email: 'alice@example.com' },
    });
  });

  it('handles nested validation errors with field paths', async () => {
    const schema = z.object({
      user: z.object({
        name: z.string(),
        email: z.string().email(),
      }),
    });

    const middleware = createValidationMiddleware(schema);
    const req = createMockReq({
      body: {
        user: { name: 'Bob', email: 'invalid-email' },
      },
    });
    const res = createMockRes();
    const next = vi.fn();

    await middleware(req, res, next);

    const jsonCall = res.json.mock.calls[0][0];
    const errorDetails = jsonCall.error.details;
    expect(errorDetails).toContainEqual(
      expect.objectContaining({
        field: expect.stringContaining('user'),
      })
    );
  });

  it('coerces types when using z.coerce schemas', async () => {
    const schema = z.object({
      count: z.coerce.number(),
      active: z.coerce.boolean(),
    });

    const middleware = createValidationMiddleware(schema);
    const req = createMockReq({
      body: { count: '42', active: 'true' },
    });
    const res = createMockRes();
    const next = vi.fn(async () => {});

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect((req as any).validatedBody).toBeDefined();
    expect((req as any).validatedBody.count).toBe(42);
    expect((req as any).validatedBody.active).toBe(true);
  });

  it('rejects non-coercible types without z.coerce', async () => {
    const schema = z.object({
      count: z.number(),
    });

    const middleware = createValidationMiddleware(schema);
    const req = createMockReq({
      body: { count: 'not-a-number' },
    });
    const res = createMockRes();
    const next = vi.fn();

    await middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('defaults to body validation target', async () => {
    const schema = z.object({
      name: z.string(),
    });

    // Not specifying target parameter (should default to 'body')
    const middleware = createValidationMiddleware(schema);
    const req = createMockReq({
      body: { name: 'Test' },
    });
    const res = createMockRes();
    const next = vi.fn(async () => {});

    await middleware(req, res, next);

    expect((req as any).validatedBody).toEqual({ name: 'Test' });
    expect((req as any).validatedQuery).toBeUndefined();
  });

  it('validates empty objects when allowed by schema', async () => {
    const schema = z.object({}).strict();

    const middleware = createValidationMiddleware(schema);
    const req = createMockReq({
      body: {},
    });
    const res = createMockRes();
    const next = vi.fn(async () => {});

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect((req as any).validatedBody).toEqual({});
  });

  it('rejects extra fields when schema is strict', async () => {
    const schema = z.object({
      name: z.string(),
    }).strict();

    const middleware = createValidationMiddleware(schema);
    const req = createMockReq({
      body: { name: 'Test', extra: 'field' },
    });
    const res = createMockRes();
    const next = vi.fn();

    await middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('attaches validatedQuery on successful query validation', async () => {
    const schema = z.object({
      search: z.string(),
    });

    const middleware = createValidationMiddleware(schema, 'query');
    const req = createMockReq({
      query: { search: 'test' },
    });
    const res = createMockRes();
    const next = vi.fn(async () => {});

    await middleware(req, res, next);

    expect((req as any).validatedQuery).toEqual({ search: 'test' });
    expect((req as any).validatedBody).toBeUndefined();
  });
});
