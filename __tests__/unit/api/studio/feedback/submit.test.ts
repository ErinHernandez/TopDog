/**
 * Feedback Submit API Route Tests
 * Tests for POST /api/studio/feedback/submit
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  mockSetRating: vi.fn(),
  mockSetTextFeedback: vi.fn(),
  mockSetQualityDimension: vi.fn(),
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
    setRating: mocks.mockSetRating,
    setTextFeedback: mocks.mockSetTextFeedback,
    setQualityDimension: mocks.mockSetQualityDimension,
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
    validatedBody: { resultId: 'result-123', ...body },
    uid: 'test-user-123',
    requestId: 'req-123',
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

describe('Feedback Submit API Route', () => {
  let handler: (req: any, res: any) => Promise<void>;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module = await import('@/pages/api/studio/feedback/submit');
    handler = module.default;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return 200 with updated:true on rating submission', async () => {
    mocks.mockSetRating.mockResolvedValue(undefined);

    const req = createMockReq({ rating: 8 });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    expect(getBody()).toEqual({
      success: true,
      data: { resultId: 'result-123', updated: true },
    });
  });

  it('should call setRating when rating provided', async () => {
    mocks.mockSetRating.mockResolvedValue(undefined);

    const req = createMockReq({ rating: 7 });
    const { res } = createMockRes();

    await handler(req, res);

    expect(mocks.mockSetRating).toHaveBeenCalledWith(
      'result-123',
      'test-user-123',
      'req-123',
      7,
    );
  });

  it('should call setTextFeedback when textFeedback provided', async () => {
    mocks.mockSetTextFeedback.mockResolvedValue(undefined);

    const req = createMockReq({ textFeedback: 'Great quality!' });
    const { res } = createMockRes();

    await handler(req, res);

    expect(mocks.mockSetTextFeedback).toHaveBeenCalledWith(
      'result-123',
      'test-user-123',
      'req-123',
      'Great quality!',
    );
  });

  it('should call setQualityDimension when dimension provided', async () => {
    mocks.mockSetQualityDimension.mockResolvedValue(undefined);

    const req = createMockReq({
      qualityDimension: { dimension: 'visualQuality', rating: 9 },
    });
    const { res } = createMockRes();

    await handler(req, res);

    expect(mocks.mockSetQualityDimension).toHaveBeenCalledWith(
      'result-123',
      'test-user-123',
      'req-123',
      'visualQuality',
      9,
    );
  });

  it('should handle multiple fields in one request', async () => {
    mocks.mockSetRating.mockResolvedValue(undefined);
    mocks.mockSetTextFeedback.mockResolvedValue(undefined);
    mocks.mockSetQualityDimension.mockResolvedValue(undefined);

    const req = createMockReq({
      rating: 8,
      textFeedback: 'Excellent',
      qualityDimension: { dimension: 'composition', rating: 9 },
    });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    expect(mocks.mockSetRating).toHaveBeenCalled();
    expect(mocks.mockSetTextFeedback).toHaveBeenCalled();
    expect(mocks.mockSetQualityDimension).toHaveBeenCalled();
    expect(getBody().success).toBe(true);
  });

  it('should have rate limit config of 60 req/60s', async () => {
    expect(mocks.capturedOptions).toEqual({
      rateLimit: { maxRequests: 60, windowMs: 60_000 },
    });
  });

  it('should log info on successful submission', async () => {
    mocks.mockSetRating.mockResolvedValue(undefined);

    const req = createMockReq({ rating: 7 });
    const { res } = createMockRes();

    await handler(req, res);

    expect(mocks.mockLogInfo).toHaveBeenCalledWith(
      'Feedback submitted',
      expect.objectContaining({
        userId: 'test-user-123',
        resultId: 'result-123',
        requestId: 'req-123',
        hasRating: true,
        hasTextFeedback: false,
        hasQualityDimension: false,
      }),
    );
  });

  it('should log error on submission failure', async () => {
    const testError = new Error('Service error');
    mocks.mockSetRating.mockRejectedValue(testError);

    const req = createMockReq({ rating: 7 });
    const { res } = createMockRes();

    try {
      await handler(req, res);
    } catch (e) {
      // Error is expected
    }

    expect(mocks.mockLogError).toHaveBeenCalledWith(
      'Feedback submission failed',
      expect.objectContaining({
        userId: 'test-user-123',
        resultId: 'result-123',
        requestId: 'req-123',
        error: 'Service error',
      }),
    );
  });
});
