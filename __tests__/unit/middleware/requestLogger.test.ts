/**
 * Request Logger Middleware Tests
 *
 * Tests the request logger middleware for proper logging of HTTP request
 * details including method, path, status code, and duration.
 *
 * @module __tests__/unit/middleware/requestLogger
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createRequestLogger } from '@/lib/studio/middleware/requestLogger';

// ============================================================================
// MOCK UTILITIES
// ============================================================================

function createMockReq(overrides = {}): NextApiRequest {
  return {
    method: 'GET',
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

  res.end = vi.fn(function (this: any) {
    res.headersSent = true;
    return res;
  });

  return res;
}

// ============================================================================
// TESTS
// ============================================================================

describe('createRequestLogger', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs request method and path', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const middleware = createRequestLogger();
    const req = createMockReq({
      method: 'POST',
      url: '/api/users',
    });
    const res = createMockRes();
    const next = vi.fn(async () => {
      res.status(200).end();
    });

    await middleware(req, res, next);

    expect(logSpy).toHaveBeenCalledTimes(1);
    const logData = JSON.parse(logSpy.mock.calls[0][0]);

    expect(logData.method).toBe('POST');
    expect(logData.path).toBe('/api/users');
  });

  it('logs response status code', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const middleware = createRequestLogger();
    const req = createMockReq();
    const res = createMockRes();
    const next = vi.fn(async () => {
      res.status(201).end();
    });

    await middleware(req, res, next);

    const logData = JSON.parse(logSpy.mock.calls[0][0]);
    expect(logData.statusCode).toBe(201);
  });

  it('includes duration in milliseconds', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const middleware = createRequestLogger();
    const req = createMockReq();
    const res = createMockRes();
    const next = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      res.status(200).end();
    });

    await middleware(req, res, next);

    const logData = JSON.parse(logSpy.mock.calls[0][0]);

    expect(logData.durationMs).toBeDefined();
    expect(typeof logData.durationMs).toBe('number');
    expect(logData.durationMs).toBeGreaterThanOrEqual(40); // Small margin for timer jitter
  });

  it('logs request with userId when available', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const middleware = createRequestLogger();
    const req = createMockReq();
    (req as any).uid = 'user-456';
    const res = createMockRes();
    const next = vi.fn(async () => {
      res.status(200).end();
    });

    await middleware(req, res, next);

    const logData = JSON.parse(logSpy.mock.calls[0][0]);
    expect(logData.userId).toBe('user-456');
  });

  it('does not include userId when not present', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const middleware = createRequestLogger();
    const req = createMockReq();
    // No uid set
    const res = createMockRes();
    const next = vi.fn(async () => {
      res.status(200).end();
    });

    await middleware(req, res, next);

    const logData = JSON.parse(logSpy.mock.calls[0][0]);
    expect(logData.userId).toBeUndefined();
  });

  it('logs as info level', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const middleware = createRequestLogger();
    const req = createMockReq();
    const res = createMockRes();
    const next = vi.fn(async () => {
      res.status(200).end();
    });

    await middleware(req, res, next);

    const logData = JSON.parse(logSpy.mock.calls[0][0]);
    expect(logData.level).toBe('info');
  });

  it('includes timestamp in ISO format', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const middleware = createRequestLogger();
    const req = createMockReq();
    const res = createMockRes();
    const next = vi.fn(async () => {
      res.status(200).end();
    });

    await middleware(req, res, next);

    const logData = JSON.parse(logSpy.mock.calls[0][0]);

    expect(logData.timestamp).toBeDefined();
    expect(typeof logData.timestamp).toBe('string');
    // Check if it's a valid ISO timestamp
    expect(() => new Date(logData.timestamp)).not.toThrow();
  });

  it('logs after handler completes', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const middleware = createRequestLogger();
    const req = createMockReq({
      method: 'DELETE',
      url: '/api/items/123',
    });
    const res = createMockRes();
    const next = vi.fn(async () => {
      res.status(204).end();
    });

    await middleware(req, res, next);

    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalled();

    const logData = JSON.parse(logSpy.mock.calls[0][0]);
    expect(logData.method).toBe('DELETE');
    expect(logData.path).toBe('/api/items/123');
    expect(logData.statusCode).toBe(204);
  });

  it('logs GET request correctly', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const middleware = createRequestLogger();
    const req = createMockReq({
      method: 'GET',
      url: '/api/data',
    });
    const res = createMockRes();
    const next = vi.fn(async () => {
      res.status(200).end();
    });

    await middleware(req, res, next);

    const logData = JSON.parse(logSpy.mock.calls[0][0]);

    expect(logData.method).toBe('GET');
    expect(logData.statusCode).toBe(200);
  });

  it('logs POST request with body data', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const middleware = createRequestLogger();
    const req = createMockReq({
      method: 'POST',
      url: '/api/create',
      body: { name: 'test' },
    });
    const res = createMockRes();
    const next = vi.fn(async () => {
      res.status(201).end();
    });

    await middleware(req, res, next);

    const logData = JSON.parse(logSpy.mock.calls[0][0]);

    expect(logData.method).toBe('POST');
    expect(logData.path).toBe('/api/create');
    expect(logData.statusCode).toBe(201);
  });

  it('logs error status codes', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const middleware = createRequestLogger();
    const req = createMockReq();
    const res = createMockRes();
    const next = vi.fn(async () => {
      res.status(500).end();
    });

    await middleware(req, res, next);

    const logData = JSON.parse(logSpy.mock.calls[0][0]);
    expect(logData.statusCode).toBe(500);
  });

  it('measures duration accurately', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const middleware = createRequestLogger();
    const req = createMockReq();
    const res = createMockRes();

    const delay = 100;
    const next = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, delay));
      res.status(200).end();
    });

    await middleware(req, res, next);

    const logData = JSON.parse(logSpy.mock.calls[0][0]);

    expect(logData.durationMs).toBeGreaterThanOrEqual(delay - 10); // Small margin for timer jitter
    expect(logData.durationMs).toBeLessThan(delay + 200); // Allow generous margin
  });

  it('calls next before logging', async () => {
    const executionOrder: string[] = [];

    vi.spyOn(console, 'log').mockImplementation(() => {
      executionOrder.push('log');
    });

    const middleware = createRequestLogger();
    const req = createMockReq();
    const res = createMockRes();
    const next = vi.fn(async () => {
      executionOrder.push('next');
      res.status(200).end();
    });

    await middleware(req, res, next);

    expect(executionOrder).toEqual(['next', 'log']);
  });

  it('handles multiple requests independently', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const middleware = createRequestLogger();

    // First request
    const req1 = createMockReq({ method: 'GET', url: '/api/first' });
    const res1 = createMockRes();
    const next1 = vi.fn(async () => {
      res1.status(200).end();
    });

    // Second request
    const req2 = createMockReq({ method: 'POST', url: '/api/second' });
    const res2 = createMockRes();
    const next2 = vi.fn(async () => {
      res2.status(201).end();
    });

    await middleware(req1, res1, next1);
    await middleware(req2, res2, next2);

    expect(logSpy).toHaveBeenCalledTimes(2);

    const log1 = JSON.parse(logSpy.mock.calls[0][0]);
    const log2 = JSON.parse(logSpy.mock.calls[1][0]);

    expect(log1.path).toBe('/api/first');
    expect(log1.statusCode).toBe(200);

    expect(log2.path).toBe('/api/second');
    expect(log2.statusCode).toBe(201);
  });

  it('logs when handler uses res.json instead of res.end', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const middleware = createRequestLogger();
    const req = createMockReq({ method: 'POST', url: '/api/json' });
    const res = createMockRes();
    const next = vi.fn(async () => {
      res.status(200).json({ data: 'test' });
    });

    await middleware(req, res, next);

    expect(logSpy).toHaveBeenCalledTimes(1);
    const logData = JSON.parse(logSpy.mock.calls[0][0]);
    expect(logData.statusCode).toBe(200);
    expect(logData.path).toBe('/api/json');
  });
});
