/**
 * Error Handler Middleware Tests
 *
 * Tests the error handler middleware for proper error classification,
 * response formatting, and request ID attachment.
 *
 * @module __tests__/unit/middleware/errorHandler
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createErrorHandler } from '@/lib/studio/middleware/errorHandler';
import {
  ApiValidationError,
  ApiNotFoundError,
  ApiForbiddenError,
  ApiConflictError,
} from '@/lib/studio/middleware/errorHandler';

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

describe('createErrorHandler', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('adds requestId to request object', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const middleware = createErrorHandler();
    const req = createMockReq();
    const res = createMockRes();
    const next = vi.fn(async () => {});

    await middleware(req, res, next);

    expect((req as any).requestId).toBeDefined();
    expect(typeof (req as any).requestId).toBe('string');
    expect((req as any).requestId.length).toBeGreaterThan(0);
  });

  it('generates unique requestId for each request', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const middleware = createErrorHandler();

    const req1 = createMockReq();
    const res1 = createMockRes();
    const next1 = vi.fn(async () => {});

    const req2 = createMockReq();
    const res2 = createMockRes();
    const next2 = vi.fn(async () => {});

    await middleware(req1, res1, next1);
    await middleware(req2, res2, next2);

    const id1 = (req1 as any).requestId;
    const id2 = (req2 as any).requestId;

    expect(id1).not.toBe(id2);
  });

  it('catches thrown errors and formats response', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const middleware = createErrorHandler();
    const req = createMockReq();
    const res = createMockRes();
    const next = vi.fn(async () => {
      throw new Error('Something went wrong');
    });

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          message: 'Something went wrong',
          requestId: (req as any).requestId,
        }),
      })
    );
  });

  it('maps ApiValidationError to 400', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const middleware = createErrorHandler();
    const req = createMockReq();
    const res = createMockRes();
    const next = vi.fn(async () => {
      throw new ApiValidationError('Invalid email format');
    });

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall.error.code).toBe('VALIDATION_ERROR');
    expect(jsonCall.error.message).toBe('Invalid email format');
  });

  it('maps ApiNotFoundError to 404', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const middleware = createErrorHandler();
    const req = createMockReq();
    const res = createMockRes();
    const next = vi.fn(async () => {
      throw new ApiNotFoundError('User not found');
    });

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall.error.code).toBe('NOT_FOUND');
    expect(jsonCall.error.message).toBe('User not found');
  });

  it('maps ApiForbiddenError to 403', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const middleware = createErrorHandler();
    const req = createMockReq();
    const res = createMockRes();
    const next = vi.fn(async () => {
      throw new ApiForbiddenError('Insufficient permissions');
    });

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall.error.code).toBe('FORBIDDEN');
    expect(jsonCall.error.message).toBe('Insufficient permissions');
  });

  it('maps ApiConflictError to 409', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const middleware = createErrorHandler();
    const req = createMockReq();
    const res = createMockRes();
    const next = vi.fn(async () => {
      throw new ApiConflictError('Resource already exists');
    });

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(409);
    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall.error.code).toBe('CONFLICT');
    expect(jsonCall.error.message).toBe('Resource already exists');
  });

  it('returns 500 for unknown errors', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const middleware = createErrorHandler();
    const req = createMockReq();
    const res = createMockRes();
    const next = vi.fn(async () => {
      throw new Error('Unexpected error');
    });

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall.error.code).toBe('INTERNAL_SERVER_ERROR');
  });

  it('logs error with context information', async () => {
    const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const middleware = createErrorHandler();
    const req = createMockReq({
      method: 'POST',
      url: '/api/users',
    });
    const res = createMockRes();
    const next = vi.fn(async () => {
      throw new ApiNotFoundError('User not found');
    });

    await middleware(req, res, next);

    expect(logSpy).toHaveBeenCalled();
    const logCall = logSpy.mock.calls[0][0];
    const logData = JSON.parse(logCall);

    expect(logData).toMatchObject({
      level: 'error',
      method: 'POST',
      path: '/api/users',
      statusCode: 404,
    });
    expect(logData.requestId).toBeDefined();
    expect(logData.error.code).toBe('NOT_FOUND');
  });

  it('includes userId in error log when available', async () => {
    const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const middleware = createErrorHandler();
    const req = createMockReq();
    (req as any).uid = 'user-123';
    const res = createMockRes();
    const next = vi.fn(async () => {
      throw new Error('Something failed');
    });

    await middleware(req, res, next);

    const logCall = logSpy.mock.calls[0][0];
    const logData = JSON.parse(logCall);

    expect(logData.userId).toBe('user-123');
  });

  it('includes error stack in log', async () => {
    const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const middleware = createErrorHandler();
    const req = createMockReq();
    const res = createMockRes();
    const next = vi.fn(async () => {
      throw new Error('Test error');
    });

    await middleware(req, res, next);

    const logCall = logSpy.mock.calls[0][0];
    const logData = JSON.parse(logCall);

    expect(logData.error.stack).toBeDefined();
  });

  it('handles non-Error exceptions', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const middleware = createErrorHandler();
    const req = createMockReq();
    const res = createMockRes();
    const next = vi.fn(async () => {
      throw 'String error'; // Not an Error object
    });

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall.success).toBe(false);
    expect(jsonCall.error.code).toBe('INTERNAL_SERVER_ERROR');
  });

  it('does not send response if headers already sent', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const middleware = createErrorHandler();
    const req = createMockReq();
    const res = createMockRes();
    res.headersSent = true;

    const next = vi.fn(async () => {
      throw new Error('Error after headers sent');
    });

    await middleware(req, res, next);

    // Should not call status or json
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it('returns error response with requestId matching request', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const middleware = createErrorHandler();
    const req = createMockReq();
    const res = createMockRes();
    const next = vi.fn(async () => {
      throw new ApiNotFoundError('Not found');
    });

    await middleware(req, res, next);

    const jsonCall = res.json.mock.calls[0][0];
    const requestId = (req as any).requestId;

    expect(jsonCall.error.requestId).toBe(requestId);
  });

  it('sets correct success flag to false in error response', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const middleware = createErrorHandler();
    const req = createMockReq();
    const res = createMockRes();
    const next = vi.fn(async () => {
      throw new Error('Test error');
    });

    await middleware(req, res, next);

    const jsonCall = res.json.mock.calls[0][0];
    expect(jsonCall.success).toBe(false);
  });
});

// ============================================================================
// ERROR CLASS TESTS
// ============================================================================

describe('Error Classes', () => {
  it('ApiValidationError has correct statusCode and code', () => {
    const error = new ApiValidationError('Invalid input');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.message).toBe('Invalid input');
  });

  it('ApiNotFoundError has correct statusCode and code', () => {
    const error = new ApiNotFoundError('Not found');
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
    expect(error.message).toBe('Not found');
  });

  it('ApiForbiddenError has correct statusCode and code', () => {
    const error = new ApiForbiddenError('Forbidden');
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe('FORBIDDEN');
    expect(error.message).toBe('Forbidden');
  });

  it('ApiConflictError has correct statusCode and code', () => {
    const error = new ApiConflictError('Conflict');
    expect(error.statusCode).toBe(409);
    expect(error.code).toBe('CONFLICT');
    expect(error.message).toBe('Conflict');
  });

  it('Error classes have default messages', () => {
    const notFound = new ApiNotFoundError();
    const forbidden = new ApiForbiddenError();
    const conflict = new ApiConflictError();

    expect(notFound.message).toBe('Resource not found');
    expect(forbidden.message).toBe('Access forbidden');
    expect(conflict.message).toBe('Resource conflict');
  });

  it('Error classes are instanceof Error', () => {
    expect(new ApiValidationError('test')).toBeInstanceOf(Error);
    expect(new ApiNotFoundError()).toBeInstanceOf(Error);
    expect(new ApiForbiddenError()).toBeInstanceOf(Error);
    expect(new ApiConflictError()).toBeInstanceOf(Error);
  });
});
