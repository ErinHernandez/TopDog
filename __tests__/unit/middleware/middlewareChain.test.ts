/**
 * Middleware Chain Tests
 *
 * Tests the middleware composition utilities for building API request pipelines.
 * Covers execution order, error handling, short-circuiting, and stack creation.
 *
 * @module __tests__/unit/middleware/middlewareChain
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';
import { withMiddleware, createMiddlewareStack } from '@/lib/studio/middleware/middlewareChain';
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

  res.end = vi.fn();

  return res;
}

// ============================================================================
// TESTS
// ============================================================================

describe('withMiddleware', () => {
  it('executes middleware in declared order', async () => {
    const executionOrder: string[] = [];

    const middleware1: Middleware = async (req, res, next) => {
      executionOrder.push('middleware1-before');
      await next();
      executionOrder.push('middleware1-after');
    };

    const middleware2: Middleware = async (req, res, next) => {
      executionOrder.push('middleware2-before');
      await next();
      executionOrder.push('middleware2-after');
    };

    const handler = vi.fn(async (req, res) => {
      executionOrder.push('handler');
      res.status(200).json({ success: true });
    });

    const composed = withMiddleware(handler, [middleware1, middleware2]);
    const req = createMockReq();
    const res = createMockRes();

    await composed(req, res);

    expect(executionOrder).toEqual([
      'middleware1-before',
      'middleware2-before',
      'handler',
      'middleware2-after',
      'middleware1-after',
    ]);
    expect(handler).toHaveBeenCalled();
  });

  it('runs handler after all middleware', async () => {
    const middleware: Middleware = async (req, res, next) => {
      await next();
    };

    const handler = vi.fn(async (req, res) => {
      res.status(200).json({ success: true });
    });

    const composed = withMiddleware(handler, [middleware]);
    const req = createMockReq();
    const res = createMockRes();

    await composed(req, res);

    expect(handler).toHaveBeenCalledWith(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  it('prevents subsequent middleware from running if one errors', async () => {
    const executionOrder: string[] = [];

    const middleware1: Middleware = async (req, res, next) => {
      executionOrder.push('middleware1');
      throw new Error('Middleware 1 failed');
    };

    const middleware2: Middleware = async (req, res, next) => {
      executionOrder.push('middleware2');
      await next();
    };

    const handler = vi.fn(async (req, res) => {
      executionOrder.push('handler');
      res.status(200).json({ success: true });
    });

    const composed = withMiddleware(handler, [middleware1, middleware2]);
    const req = createMockReq();
    const res = createMockRes();

    await composed(req, res);

    expect(executionOrder).toEqual(['middleware1']);
    expect(handler).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('stops chain when middleware sends response without calling next', async () => {
    const executionOrder: string[] = [];

    const middleware1: Middleware = async (req, res, next) => {
      executionOrder.push('middleware1');
      res.status(200).json({ shortCircuited: true });
      // Not calling next()
    };

    const middleware2: Middleware = async (req, res, next) => {
      executionOrder.push('middleware2');
      await next();
    };

    const handler = vi.fn(async (req, res) => {
      executionOrder.push('handler');
      res.status(200).json({ success: true });
    });

    const composed = withMiddleware(handler, [middleware1, middleware2]);
    const req = createMockReq();
    const res = createMockRes();

    await composed(req, res);

    expect(executionOrder).toEqual(['middleware1']);
    expect(handler).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ shortCircuited: true });
  });

  it('handles empty middleware array', async () => {
    const handler = vi.fn(async (req, res) => {
      res.status(200).json({ success: true });
    });

    const composed = withMiddleware(handler, []);
    const req = createMockReq();
    const res = createMockRes();

    await composed(req, res);

    expect(handler).toHaveBeenCalledWith(req, res);
  });

  it('attaches requestId when middleware adds it', async () => {
    const middleware: Middleware = async (req, res, next) => {
      (req as any).requestId = 'test-123';
      await next();
    };

    const handler = vi.fn(async (req, res) => {
      const requestId = (req as any).requestId;
      res.status(200).json({ requestId });
    });

    const composed = withMiddleware(handler, [middleware]);
    const req = createMockReq();
    const res = createMockRes();

    await composed(req, res);

    expect(res.json).toHaveBeenCalledWith({ requestId: 'test-123' });
  });

  it('returns 500 error if error occurs before response is sent', async () => {
    const middleware: Middleware = async (req, res, next) => {
      throw new Error('Something went wrong');
    };

    const handler = vi.fn();

    const composed = withMiddleware(handler, [middleware]);
    const req = createMockReq();
    const res = createMockRes();

    await composed(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Internal Server Error',
        message: 'Something went wrong',
      })
    );
  });

  it('does not send response if headers already sent', async () => {
    const middleware: Middleware = async (req, res, next) => {
      await next();
      throw new Error('Error after response');
    };

    const handler = vi.fn(async (req, res) => {
      res.headersSent = true;
      res.status(200).json({ success: true });
    });

    const composed = withMiddleware(handler, [middleware]);
    const req = createMockReq();
    const res = createMockRes();

    await composed(req, res);

    // Should only be called once (from handler)
    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  it('handles async middleware correctly', async () => {
    const executionOrder: string[] = [];

    const asyncMiddleware: Middleware = async (req, res, next) => {
      executionOrder.push('async-before');
      await new Promise((resolve) => setTimeout(resolve, 10));
      await next();
      executionOrder.push('async-after');
    };

    const handler = vi.fn(async (req, res) => {
      executionOrder.push('handler');
      res.status(200).json({ success: true });
    });

    const composed = withMiddleware(handler, [asyncMiddleware]);
    const req = createMockReq();
    const res = createMockRes();

    await composed(req, res);

    expect(executionOrder).toEqual(['async-before', 'handler', 'async-after']);
  });
});

describe('createMiddlewareStack', () => {
  it('creates reusable middleware stack', async () => {
    const middleware: Middleware = async (req, res, next) => {
      (req as any).stackApplied = true;
      await next();
    };

    const stack = createMiddlewareStack([middleware]);

    const handler = vi.fn(async (req, res) => {
      res.status(200).json({ stackApplied: (req as any).stackApplied });
    });

    const composed = stack(handler);
    const req = createMockReq();
    const res = createMockRes();

    await composed(req, res);

    expect(res.json).toHaveBeenCalledWith({ stackApplied: true });
  });

  it('supports multiple handlers with same stack', async () => {
    const middleware: Middleware = async (req, res, next) => {
      (req as any).stackId = 'shared-stack';
      await next();
    };

    const stack = createMiddlewareStack([middleware]);

    const handler1 = vi.fn(async (req, res) => {
      res.status(200).json({ handler: 1, stackId: (req as any).stackId });
    });

    const handler2 = vi.fn(async (req, res) => {
      res.status(200).json({ handler: 2, stackId: (req as any).stackId });
    });

    const composed1 = stack(handler1);
    const composed2 = stack(handler2);

    const req1 = createMockReq();
    const res1 = createMockRes();
    await composed1(req1, res1);

    const req2 = createMockReq();
    const res2 = createMockRes();
    await composed2(req2, res2);

    expect(res1.json).toHaveBeenCalledWith({ handler: 1, stackId: 'shared-stack' });
    expect(res2.json).toHaveBeenCalledWith({ handler: 2, stackId: 'shared-stack' });
  });

  it('stacks can be composed together', async () => {
    const middleware1: Middleware = async (req, res, next) => {
      (req as any).step1 = true;
      await next();
    };

    const middleware2: Middleware = async (req, res, next) => {
      (req as any).step2 = true;
      await next();
    };

    const stack = createMiddlewareStack([middleware1, middleware2]);

    const handler = vi.fn(async (req, res) => {
      res.status(200).json({
        step1: (req as any).step1,
        step2: (req as any).step2,
      });
    });

    const composed = stack(handler);
    const req = createMockReq();
    const res = createMockRes();

    await composed(req, res);

    expect(res.json).toHaveBeenCalledWith({ step1: true, step2: true });
  });
});
