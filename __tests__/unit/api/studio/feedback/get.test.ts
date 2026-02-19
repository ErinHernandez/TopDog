/**
 * Feedback Get API Route Tests
 * Tests for GET /api/studio/feedback/[resultId]
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  mockGetFeedback: vi.fn(),
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
    getFeedback: mocks.mockGetFeedback,
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

function createMockReq(resultId: string = 'result-123'): any {
  return {
    validatedBody: { resultId },
    uid: 'test-user-123',
    requestId: 'req-456',
    method: 'GET',
    query: { resultId },
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

describe('Feedback Get API Route', () => {
  let handler: (req: any, res: any) => Promise<void>;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module = await import('@/pages/api/studio/feedback/[resultId]');
    handler = module.default;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return feedback when found', async () => {
    const feedbackData = {
      resultId: 'result-123',
      userId: 'test-user-123',
      rating: 8,
      textFeedback: 'Great work!',
      qualityDimensions: [
        { dimension: 'visualQuality', rating: 9 },
      ],
    };

    mocks.mockGetFeedback.mockResolvedValue(feedbackData);

    const req = createMockReq('result-123');
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    expect(getBody()).toEqual({
      success: true,
      data: feedbackData,
    });
  });

  it('should return 404 when feedback not found', async () => {
    mocks.mockGetFeedback.mockResolvedValue(null);

    const req = createMockReq('result-nonexistent');
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(404);
    expect(getBody()).toEqual({
      success: false,
      error: {
        code: 'FEEDBACK_NOT_FOUND',
        message: expect.stringContaining('No feedback found'),
      },
    });
  });

  it('should call getFeedback with resultId and userId', async () => {
    mocks.mockGetFeedback.mockResolvedValue({
      resultId: 'result-123',
      userId: 'test-user-123',
    });

    const req = createMockReq('result-123');
    const { res } = createMockRes();

    await handler(req, res);

    expect(mocks.mockGetFeedback).toHaveBeenCalledWith('result-123', 'test-user-123');
  });

  it('should have rate limit config of 120 req/60s', async () => {
    expect(mocks.capturedOptions).toEqual({
      rateLimit: { maxRequests: 120, windowMs: 60_000 },
    });
  });

  it('should log info when feedback is retrieved', async () => {
    const feedbackData = {
      resultId: 'result-123',
      userId: 'test-user-123',
      rating: 7,
    };

    mocks.mockGetFeedback.mockResolvedValue(feedbackData);

    const req = createMockReq('result-123');
    const { res } = createMockRes();

    await handler(req, res);

    expect(mocks.mockLogInfo).toHaveBeenCalledWith(
      'Feedback retrieved',
      expect.objectContaining({
        userId: 'test-user-123',
        resultId: 'result-123',
        requestId: 'req-456',
      }),
    );
  });

  it('should log error on retrieval failure', async () => {
    const testError = new Error('Database error');
    mocks.mockGetFeedback.mockRejectedValue(testError);

    const req = createMockReq('result-123');
    const { res } = createMockRes();

    try {
      await handler(req, res);
    } catch (e) {
      // Error is expected
    }

    expect(mocks.mockLogError).toHaveBeenCalledWith(
      'Feedback retrieval failed',
      expect.objectContaining({
        userId: 'test-user-123',
        requestId: 'req-456',
        error: 'Database error',
      }),
    );
  });
});
