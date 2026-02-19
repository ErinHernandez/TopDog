/**
 * CORS Middleware Tests
 *
 * Tests the CORS middleware factory for handling cross-origin requests.
 * Covers header setting, preflight handling, and environment configuration.
 *
 * @module __tests__/unit/middleware/cors
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createCorsMiddleware } from '@/lib/studio/middleware/cors';
import type { Middleware } from '@/lib/studio/middleware/middlewareChain';

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

  res.end = vi.fn(() => {
    res.headersSent = true;
  });

  return res;
}

// ============================================================================
// TESTS
// ============================================================================

describe('createCorsMiddleware', () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.CORS_ALLOWED_ORIGINS;
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.CORS_ALLOWED_ORIGINS;
    } else {
      process.env.CORS_ALLOWED_ORIGINS = originalEnv;
    }
  });

  it('sets CORS headers on responses', async () => {
    delete process.env.CORS_ALLOWED_ORIGINS;

    const middleware = createCorsMiddleware();
    const req = createMockReq({
      headers: { origin: 'https://idesaign.ai' },
    });
    const res = createMockRes();
    const next = vi.fn(async () => {
      res.status(200).json({ success: true });
    });

    await middleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Access-Control-Allow-Origin',
      'https://idesaign.ai'
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      'Access-Control-Allow-Methods',
      expect.stringContaining('GET')
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      'Access-Control-Allow-Headers',
      expect.stringContaining('Content-Type')
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      'Access-Control-Max-Age',
      '3600'
    );
  });

  it('handles OPTIONS preflight requests', async () => {
    delete process.env.CORS_ALLOWED_ORIGINS;

    const middleware = createCorsMiddleware();
    const req = createMockReq({
      method: 'OPTIONS',
      headers: { origin: 'https://idesaign.ai' },
    });
    const res = createMockRes();
    const next = vi.fn();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.end).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('uses default origins when env not set', async () => {
    delete process.env.CORS_ALLOWED_ORIGINS;

    const middleware = createCorsMiddleware();
    const req = createMockReq({
      headers: { origin: 'https://idesaign.ai' },
    });
    const res = createMockRes();
    const next = vi.fn(async () => {});

    await middleware(req, res, next);

    // Should include the default origin
    expect(res.setHeader).toHaveBeenCalledWith(
      'Access-Control-Allow-Origin',
      'https://idesaign.ai'
    );
  });

  it('uses custom origins from env var', async () => {
    process.env.CORS_ALLOWED_ORIGINS = 'https://custom.example.com,https://another.example.com';

    const middleware = createCorsMiddleware();
    const req = createMockReq({
      headers: { origin: 'https://custom.example.com' },
    });
    const res = createMockRes();
    const next = vi.fn(async () => {});

    await middleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Access-Control-Allow-Origin',
      'https://custom.example.com'
    );
  });

  it('does not set origin header for disallowed origins', async () => {
    process.env.CORS_ALLOWED_ORIGINS = 'https://allowed.example.com';

    const middleware = createCorsMiddleware();
    const req = createMockReq({
      headers: { origin: 'https://disallowed.example.com' },
    });
    const res = createMockRes();
    const next = vi.fn(async () => {});

    await middleware(req, res, next);

    const calls = res.setHeader.mock.calls;
    const originCalls = calls.filter((call: any[]) => call[0] === 'Access-Control-Allow-Origin');
    expect(originCalls).toHaveLength(0);
  });

  it('handles missing origin header', async () => {
    delete process.env.CORS_ALLOWED_ORIGINS;

    const middleware = createCorsMiddleware();
    const req = createMockReq({
      headers: {}, // No origin header
    });
    const res = createMockRes();
    const next = vi.fn(async () => {});

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.setHeader).toHaveBeenCalledWith(
      'Access-Control-Allow-Methods',
      expect.any(String)
    );
  });

  it('accepts custom options', async () => {
    delete process.env.CORS_ALLOWED_ORIGINS;

    const middleware = createCorsMiddleware({
      methods: ['GET', 'POST'],
      headers: ['Content-Type', 'Authorization'],
      maxAge: 7200,
    });

    const req = createMockReq({
      headers: { origin: 'https://idesaign.ai' },
    });
    const res = createMockRes();
    const next = vi.fn(async () => {});

    await middleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Access-Control-Allow-Methods',
      'GET, POST'
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization'
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      'Access-Control-Max-Age',
      '7200'
    );
  });

  it('calls next() for non-OPTIONS requests', async () => {
    delete process.env.CORS_ALLOWED_ORIGINS;

    const middleware = createCorsMiddleware();
    const req = createMockReq({ method: 'GET' });
    const res = createMockRes();
    const next = vi.fn(async () => {});

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('trims whitespace from custom origins in env', async () => {
    process.env.CORS_ALLOWED_ORIGINS = ' https://example1.com , https://example2.com ';

    const middleware = createCorsMiddleware();
    const req = createMockReq({
      headers: { origin: 'https://example1.com' },
    });
    const res = createMockRes();
    const next = vi.fn(async () => {});

    await middleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Access-Control-Allow-Origin',
      'https://example1.com'
    );
  });
});
