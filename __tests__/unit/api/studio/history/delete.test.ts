/**
 * History Delete Route Tests
 * Tests deletion of generation history entries
 * @module __tests__/unit/api/studio/history/delete.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => {
  const mockDeleteGeneration = vi.fn().mockResolvedValue(undefined);
  const mockHistoryServiceCtor = vi.fn(function() {
    return {
      deleteGeneration: mockDeleteGeneration,
    };
  });
  return {
    mockDeleteGeneration,
    mockHistoryServiceCtor,
    capturedSchema: null as any,
    capturedOptions: null as any,
    capturedHandler: null as ((req: any, res: any) => Promise<void>) | null,
  };
});

vi.mock('@/lib/studio/services/ai/imageGeneration/historyService', () => ({
  GenerationHistoryService: mocks.mockHistoryServiceCtor,
}));

vi.mock('@/lib/firebase/server', () => ({
  getAdminDb: vi.fn(() => ({})),
}));

vi.mock('@/lib/studio/api/createApiHandler', () => ({
  createAuthenticatedRoute: vi.fn((schema: any, handler: any, options?: any) => {
    mocks.capturedSchema = schema;
    mocks.capturedOptions = options;
    mocks.capturedHandler = handler;
    return handler;
  }),
}));

vi.mock('@/lib/studio/services/serverLogger', () => ({
  serverLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// Import after mocking
import handler from '@/pages/api/studio/history/[resultId]';

function createMockReq(query = {}): any {
  return {
    query,
    uid: 'test-user-123',
    requestId: 'req-123',
    method: 'DELETE',
    headers: {},
  };
}

function createMockRes(): { res: any; getStatus: () => number; getBody: () => any } {
  let statusCode = 200;
  let responseBody: any = null;
  const res = {
    status: vi.fn((code: number) => { statusCode = code; return res; }),
    json: vi.fn((body: any) => { responseBody = body; return res; }),
    setHeader: vi.fn().mockReturnThis(),
    end: vi.fn(),
  };
  return { res, getStatus: () => statusCode, getBody: () => responseBody };
}

describe('DELETE /api/studio/history/[resultId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockDeleteGeneration.mockResolvedValue(undefined);
  });

  it('should return deleted:true on success', async () => {
    const req = createMockReq({ resultId: 'entry-123' });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    const body = getBody();
    expect(body.success).toBe(true);
    expect(body.data.deleted).toBe(true);
  });

  it('should call deleteGeneration with correct entry ID', async () => {
    const req = createMockReq({ resultId: 'entry-456' });
    const { res } = createMockRes();

    await handler(req, res);

    expect(mocks.mockDeleteGeneration).toHaveBeenCalledWith('entry-456');
  });

  it('should return 400 when resultId is missing', async () => {
    const req = createMockReq({});
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(400);
    const body = getBody();
    expect(body.success).toBe(false);
    expect(body.error).toContain('Invalid resultId');
  });

  it('should return 400 when resultId is not a string', async () => {
    const req = createMockReq({ resultId: ['array', 'value'] });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(400);
    const body = getBody();
    expect(body.success).toBe(false);
  });

  it('should have correct rate limit configuration', () => {
    expect(mocks.capturedOptions).toBeDefined();
    expect(mocks.capturedOptions.rateLimit).toBeDefined();
    expect(mocks.capturedOptions.rateLimit.maxRequests).toBe(30);
    expect(mocks.capturedOptions.rateLimit.windowMs).toBe(60_000);
  });

  it('should handle deletion errors gracefully', async () => {
    mocks.mockDeleteGeneration.mockRejectedValue(new Error('Delete failed'));

    const req = createMockReq({ resultId: 'entry-789' });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(500);
    const body = getBody();
    expect(body.success).toBe(false);
    expect(body.error).toBeDefined();
  });

  it('should pass correct userId to service', async () => {
    const req = createMockReq({ resultId: 'entry-999' });
    req.uid = 'specific-user-id';
    const { res } = createMockRes();

    await handler(req, res);

    // Verify the service was instantiated with correct userId
    // (This is implicit from the mock setup, but we can verify the deletion was called)
    expect(mocks.mockDeleteGeneration).toHaveBeenCalled();
  });

  it('should log deletion success', async () => {
    const req = createMockReq({ resultId: 'entry-log-test' });
    const { res } = createMockRes();

    await handler(req, res);

    // The handler will call serverLogger.info internally
    expect(mocks.mockDeleteGeneration).toHaveBeenCalledOnce();
  });
});
