/**
 * Feedback Broadcast Sendback API Route Tests
 * Tests for POST /api/studio/feedback/broadcast-sendback
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  mockBuildBroadcastSendback: vi.fn(),
  capturedSchema: null as any,
  capturedOptions: null as any,
  capturedHandler: null as ((req: any, res: any) => Promise<void>) | null,
  mockLogInfo: vi.fn(),
  mockLogWarn: vi.fn(),
  mockLogError: vi.fn(),
}));

vi.mock('@/lib/studio/api/createApiHandler', () => ({
  createAuthenticatedRoute: vi.fn((schema: any, handler: any, options?: any) => {
    mocks.capturedSchema = schema;
    mocks.capturedOptions = options;
    mocks.capturedHandler = handler;
    return handler;
  }),
}));

vi.mock('@/lib/studio/services/ai/imageGeneration/imageFeedbackService', () => ({
  getImageFeedbackService: vi.fn(() => ({
    buildBroadcastSendback: mocks.mockBuildBroadcastSendback,
  })),
}));

vi.mock('@/lib/studio/services/serverLogger', () => ({
  serverLogger: {
    info: mocks.mockLogInfo,
    warn: mocks.mockLogWarn,
    error: mocks.mockLogError,
    debug: vi.fn(),
  },
}));

function createMockReq(body: Record<string, unknown> = {}): any {
  return {
    validatedBody: { resultId: 'result-123', sessionId: 'session-456', ...body },
    uid: 'test-user-123',
    requestId: 'req-789',
    method: 'POST',
    headers: {},
  };
}

function createMockRes(): { res: any; getStatus: () => number; getBody: () => any } {
  let statusCode = 200;
  let responseBody: any = null;
  const res = {
    status: vi.fn((code: number) => {
      statusCode = code;
      return res;
    }),
    json: vi.fn((body: any) => {
      responseBody = body;
      return res;
    }),
    setHeader: vi.fn().mockReturnThis(),
    end: vi.fn(),
  };
  return { res, getStatus: () => statusCode, getBody: () => responseBody };
}

describe('Feedback Broadcast Sendback API Route', () => {
  let handler: (req: any, res: any) => Promise<void>;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module = await import('@/pages/api/studio/feedback/broadcast-sendback');
    handler = module.default;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return broadcast sendback request on success', async () => {
    const sendbackRequest = {
      resultId: 'result-123',
      sessionId: 'session-456',
      broadcastId: 'broadcast-001',
      timestamp: '2024-02-10T12:00:00Z',
      status: 'queued',
    };

    mocks.mockBuildBroadcastSendback.mockResolvedValue(sendbackRequest);

    const req = createMockReq();
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    expect(getBody()).toEqual({
      success: true,
      data: sendbackRequest,
    });
  });

  it('should call buildBroadcastSendback with correct params', async () => {
    const sendbackRequest = {
      resultId: 'result-123',
      sessionId: 'session-456',
      broadcastId: 'broadcast-001',
    };

    mocks.mockBuildBroadcastSendback.mockResolvedValue(sendbackRequest);

    const req = createMockReq();
    const { res } = createMockRes();

    await handler(req, res);

    expect(mocks.mockBuildBroadcastSendback).toHaveBeenCalledWith(
      'result-123',
      'test-user-123',
      'session-456',
    );
  });

  it('should have rate limit config of 10 req/60s', async () => {
    expect(mocks.capturedOptions).toEqual({
      rateLimit: { maxRequests: 10, windowMs: 60_000 },
    });
  });

  it('should log info on successful broadcast', async () => {
    const sendbackRequest = {
      resultId: 'result-123',
      sessionId: 'session-456',
    };

    mocks.mockBuildBroadcastSendback.mockResolvedValue(sendbackRequest);

    const req = createMockReq();
    const { res } = createMockRes();

    await handler(req, res);

    expect(mocks.mockLogInfo).toHaveBeenCalledWith(
      'Broadcast sendback initiated',
      expect.objectContaining({
        userId: 'test-user-123',
        resultId: 'result-123',
        sessionId: 'session-456',
        requestId: 'req-789',
      }),
    );
  });

  it('should log error on broadcast failure', async () => {
    const testError = new Error('Broadcast error');
    mocks.mockBuildBroadcastSendback.mockRejectedValue(testError);

    const req = createMockReq();
    const { res } = createMockRes();

    try {
      await handler(req, res);
    } catch (e) {
      // Error is expected
    }

    expect(mocks.mockLogError).toHaveBeenCalledWith(
      'Broadcast sendback failed',
      expect.objectContaining({
        userId: 'test-user-123',
        resultId: 'result-123',
        sessionId: 'session-456',
        requestId: 'req-789',
        error: 'Broadcast error',
      }),
    );
  });

  it('should return 200 status on success', async () => {
    mocks.mockBuildBroadcastSendback.mockResolvedValue({
      resultId: 'result-123',
      sessionId: 'session-456',
      broadcastId: 'broadcast-001',
    });

    const req = createMockReq();
    const { res, getStatus } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
  });
});
