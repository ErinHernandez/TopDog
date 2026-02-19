import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  capturedHandler: null as ((req: any, res: any) => Promise<void>) | null,
  capturedSchema: null as any,
  capturedOptions: null as any,
  mockCallOpenAIAPI: vi.fn(),
  mockCallStabilityAPI: vi.fn(),
  mockHasOpenAIKey: vi.fn(),
  mockHasStabilityKey: vi.fn(),
  mockHashImageInput: vi.fn(),
  mockCacheGet: vi.fn(),
  mockCacheSet: vi.fn(),
  mockEnqueueJob: vi.fn(),
  mockLogInfo: vi.fn(),
  mockLogWarn: vi.fn(),
  mockLogError: vi.fn(),
}));

vi.mock('@/lib/studio/api/createApiHandler', () => ({
  createAuthenticatedRoute: vi.fn((schema: any, handler: any, options?: any) => {
    mocks.capturedSchema = schema;
    mocks.capturedHandler = handler;
    mocks.capturedOptions = options;
    return handler;
  }),
}));

vi.mock('@/lib/studio/services/ai/providerClient', () => ({
  callOpenAIAPI: mocks.mockCallOpenAIAPI,
  callStabilityAPI: mocks.mockCallStabilityAPI,
  hasOpenAIKey: mocks.mockHasOpenAIKey,
  hasStabilityKey: mocks.mockHasStabilityKey,
  hashImageInput: mocks.mockHashImageInput,
}));

vi.mock('@/lib/studio/infrastructure/cache/cacheManager', () => ({
  getCacheManager: vi.fn(() => ({
    get: mocks.mockCacheGet,
    set: mocks.mockCacheSet,
  })),
}));

vi.mock('@/lib/studio/infrastructure/queue/firestoreJobQueue', () => ({
  getJobQueue: vi.fn(() => ({
    enqueueJob: mocks.mockEnqueueJob,
  })),
  JobType: {
    AI_GENERATION: 'AI_GENERATION',
    IMAGE_EXPORT: 'IMAGE_EXPORT',
    UPLOAD_PROCESSING: 'UPLOAD_PROCESSING',
    BATCH_OPERATION: 'BATCH_OPERATION',
  },
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
  return { validatedBody: body, uid: 'test-user-123', method: 'POST', headers: {} };
}

function createMockRes(): {
  res: any;
  getStatus: () => number;
  getBody: () => any;
} {
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

describe('style-transfer API route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockHashImageInput.mockReturnValue('test-hash-123');
    mocks.mockCacheGet.mockResolvedValue(null);
    mocks.mockCacheSet.mockResolvedValue(undefined);
    mocks.mockEnqueueJob.mockResolvedValue('job-id-456');
    mocks.mockHasOpenAIKey.mockReturnValue(false);
    mocks.mockHasStabilityKey.mockReturnValue(false);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should return cached StyleTransferResult on cache hit', async () => {
    const handler = await import('@/pages/api/studio/ai/style-transfer').then(
      (m) => m.default
    );

    const cachedResult = {
      styledImageBase64: 'cached-image-data',
      processingTimeMs: 100,
    };
    mocks.mockCacheGet.mockResolvedValueOnce(cachedResult);

    const req = createMockReq({
      imageBase64: 'base64-data',
      style: 'oil_painting',
      strength: 0.8,
      qualityLevel: 'standard',
    });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    const body = getBody();
    expect(body.success).toBe(true);
    expect(body.data).toEqual(cachedResult);
    expect(mocks.mockLogInfo).toHaveBeenCalledWith(
      'Style transfer cache hit',
      { userId: 'test-user-123' }
    );
  });

  it('should queue async job and return 202 with JobReference for ultra quality', async () => {
    const handler = await import('@/pages/api/studio/ai/style-transfer').then(
      (m) => m.default
    );

    const req = createMockReq({
      imageBase64: 'base64-data',
      style: 'anime_manga',
      strength: 0.9,
      qualityLevel: 'ultra',
    });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(202);
    const body = getBody();
    expect(body.success).toBe(true);
    expect(body.data).toEqual({
      jobId: 'job-id-456',
      status: 'PENDING',
      progressUrl: '/api/studio/jobs/job-id-456/progress',
    });
    expect(mocks.mockEnqueueJob).toHaveBeenCalledWith(
      'AI_GENERATION',
      expect.objectContaining({
        operation: 'style-transfer',
        imageBase64: 'base64-data',
        style: 'anime_manga',
        strength: 0.9,
        qualityLevel: 'ultra',
        userId: 'test-user-123',
      }),
      { userId: 'test-user-123', priority: 1 }
    );
  });

  it('should return styled image on OpenAI success', async () => {
    const handler = await import('@/pages/api/studio/ai/style-transfer').then(
      (m) => m.default
    );

    mocks.mockHasOpenAIKey.mockReturnValue(true);
    mocks.mockCallOpenAIAPI.mockResolvedValueOnce({
      success: true,
      data: {
        data: [{ b64_json: 'styled-image-base64' }],
      },
    });

    const req = createMockReq({
      imageBase64: 'base64-data',
      style: 'watercolor',
      strength: 0.7,
      qualityLevel: 'standard',
    });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    const body = getBody();
    expect(body.success).toBe(true);
    expect(body.data.styledImageBase64).toBe('styled-image-base64');
    expect(body.data.processingTimeMs).toBeGreaterThanOrEqual(0);
  });

  it('should return original image when OpenAI call fails', async () => {
    const handler = await import('@/pages/api/studio/ai/style-transfer').then(
      (m) => m.default
    );

    mocks.mockHasOpenAIKey.mockReturnValue(true);
    mocks.mockCallOpenAIAPI.mockResolvedValueOnce({
      success: false,
      error: 'OpenAI error',
    });

    const req = createMockReq({
      imageBase64: 'base64-data',
      style: 'sketch',
      strength: 0.6,
      qualityLevel: 'standard',
    });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    const body = getBody();
    expect(body.success).toBe(true);
    expect(body.data.styledImageBase64).toBe('base64-data');
    expect(mocks.mockCallStabilityAPI).not.toHaveBeenCalled();
  });

  it('should return original image when no provider is available', async () => {
    const handler = await import('@/pages/api/studio/ai/style-transfer').then(
      (m) => m.default
    );

    mocks.mockHasOpenAIKey.mockReturnValue(false);
    mocks.mockHasStabilityKey.mockReturnValue(false);

    const req = createMockReq({
      imageBase64: 'original-base64',
      style: 'pop_art',
      strength: 0.8,
      qualityLevel: 'standard',
    });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    const body = getBody();
    expect(body.data.styledImageBase64).toBe('original-base64');
    expect(mocks.mockLogWarn).toHaveBeenCalledWith(
      'No AI provider key for style transfer',
      { userId: 'test-user-123' }
    );
  });

  it('should use custom style prompt when style is custom', async () => {
    const handler = await import('@/pages/api/studio/ai/style-transfer').then(
      (m) => m.default
    );

    mocks.mockHasOpenAIKey.mockReturnValue(true);
    mocks.mockCallOpenAIAPI.mockResolvedValueOnce({
      success: true,
      data: {
        data: [{ b64_json: 'styled-image' }],
      },
    });

    const req = createMockReq({
      imageBase64: 'base64-data',
      style: 'custom',
      stylePrompt: 'Make it look like a Renaissance painting',
      strength: 0.75,
      qualityLevel: 'standard',
    });
    const { res, getStatus } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    expect(mocks.mockCallOpenAIAPI).toHaveBeenCalledWith(
      '/images/edits',
      expect.objectContaining({
        prompt: expect.stringContaining('Make it look like a Renaissance painting'),
      })
    );
  });

  it('should use predefined style prompt from STYLE_PROMPTS map', async () => {
    const handler = await import('@/pages/api/studio/ai/style-transfer').then(
      (m) => m.default
    );

    mocks.mockHasOpenAIKey.mockReturnValue(true);
    mocks.mockCallOpenAIAPI.mockResolvedValueOnce({
      success: true,
      data: {
        data: [{ b64_json: 'styled-image' }],
      },
    });

    const req = createMockReq({
      imageBase64: 'base64-data',
      style: 'oil_painting',
      strength: 0.8,
      qualityLevel: 'standard',
    });
    const { res, getStatus } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    expect(mocks.mockCallOpenAIAPI).toHaveBeenCalledWith(
      '/images/edits',
      expect.objectContaining({
        prompt: expect.stringContaining(
          'Transform this image into a classical oil painting style'
        ),
      })
    );
  });

  it('should cache result with 3600000ms TTL', async () => {
    const handler = await import('@/pages/api/studio/ai/style-transfer').then(
      (m) => m.default
    );

    mocks.mockHasOpenAIKey.mockReturnValue(true);
    mocks.mockCallOpenAIAPI.mockResolvedValueOnce({
      success: true,
      data: {
        data: [{ b64_json: 'styled-image' }],
      },
    });

    const req = createMockReq({
      imageBase64: 'base64-data',
      style: 'impressionist',
      strength: 0.7,
      qualityLevel: 'standard',
    });
    const { res, getStatus } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    expect(mocks.mockCacheSet).toHaveBeenCalledWith(
      'style:test-hash-123',
      expect.objectContaining({
        styledImageBase64: 'styled-image',
      }),
      3_600_000
    );
  });

  it('should respect rate limit maxRequests of 15', async () => {
    await import('@/pages/api/studio/ai/style-transfer');

    expect(mocks.capturedOptions).toEqual({
      actionType: 'ai',
      rateLimit: { maxRequests: 15, windowMs: 60_000 },
    });
  });
});
