import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  capturedHandler: null as ((req: any, res: any) => Promise<void>) | null,
  capturedSchema: null as any,
  capturedOptions: null as any,
  mockCallStabilityAPI: vi.fn(),
  mockCallOpenAIAPI: vi.fn(),
  mockCallReplicateModel: vi.fn(),
  mockHasStabilityKey: vi.fn(),
  mockHasOpenAIKey: vi.fn(),
  mockHasReplicateKey: vi.fn(),
  mockHashImageInput: vi.fn(),
  mockCacheGet: vi.fn(),
  mockCacheSet: vi.fn(),
  mockEnqueueJob: vi.fn(),
  mockLogInfo: vi.fn(),
  mockLogWarn: vi.fn(),
  mockLogError: vi.fn(),
  mockSharpMetadata: vi.fn().mockResolvedValue({ width: 512, height: 512 }),
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
  callStabilityAPI: mocks.mockCallStabilityAPI,
  callOpenAIAPI: mocks.mockCallOpenAIAPI,
  callReplicateModel: mocks.mockCallReplicateModel,
  hasStabilityKey: mocks.mockHasStabilityKey,
  hasOpenAIKey: mocks.mockHasOpenAIKey,
  hasReplicateKey: mocks.mockHasReplicateKey,
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

vi.mock('sharp', () => ({
  default: vi.fn(() => ({
    metadata: mocks.mockSharpMetadata,
  })),
}));

describe('Upscale API Route', () => {
  let handler: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    mocks.mockHashImageInput.mockReturnValue('hash-upscale');
    mocks.mockEnqueueJob.mockResolvedValue('job-id-12345');
    mocks.mockSharpMetadata.mockResolvedValue({ width: 512, height: 512 });

    const upscaleModule = await import('/sessions/great-elegant-noether/mnt/td.d/pages/api/studio/ai/upscale');
    handler = upscaleModule.default;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  function createMockReq(body: Record<string, unknown> = {}): any {
    return {
      validatedBody: body,
      uid: 'test-user-123',
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

  it('Test 1: Quality model returns async job with 202 status', async () => {
    const req = createMockReq({
      imageBase64: 'image-base64',
      targetScale: 2,
      model: 'quality',
      enhanceFaces: false,
    });

    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(202);
    expect(getBody().success).toBe(true);

    const jobReference = getBody().data;
    expect(jobReference).toEqual({
      jobId: 'job-id-12345',
      status: 'PENDING',
      progressUrl: '/api/studio/jobs/job-id-12345/progress',
    });

    // Verify job was enqueued
    expect(mocks.mockEnqueueJob).toHaveBeenCalled();
  });

  it('Test 2: Fast model with cache hit returns 200', async () => {
    const cachedResult = {
      upscaledImageBase64: 'cached-upscaled-base64',
      originalResolution: { width: 512, height: 512 },
      newResolution: { width: 1024, height: 1024 },
      processingTimeMs: 150,
    };

    mocks.mockCacheGet.mockResolvedValue(cachedResult);

    const req = createMockReq({
      imageBase64: 'image-base64',
      targetScale: 2,
      model: 'fast',
      enhanceFaces: false,
    });

    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    expect(getBody()).toEqual({
      success: true,
      data: cachedResult,
    });

    expect(mocks.mockLogInfo).toHaveBeenCalledWith(
      'Upscale cache hit',
      expect.objectContaining({
        userId: 'test-user-123',
        targetScale: 2,
        enhanceFaces: false,
      }),
    );
  });

  it('Test 3: Fast model + Stability 2x success', async () => {
    mocks.mockCacheGet.mockResolvedValue(null);
    mocks.mockHasStabilityKey.mockReturnValue(true);

    const mockStabilityResponse = {
      success: true,
      data: {
        artifacts: [{ base64: 'upscaled-2x-base64', finishReason: 'SUCCESS' }],
      },
    };

    mocks.mockCallStabilityAPI.mockResolvedValue(mockStabilityResponse);

    const req = createMockReq({
      imageBase64: 'image-base64',
      targetScale: 2,
      model: 'fast',
      enhanceFaces: false,
    });

    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    expect(getBody().success).toBe(true);

    const result = getBody().data;
    expect(result.upscaledImageBase64).toBe('upscaled-2x-base64');
    expect(result.originalResolution).toEqual({ width: 512, height: 512 });
    expect(result.newResolution).toEqual({ width: 1024, height: 1024 });

    // Verify single API call for 2x
    expect(mocks.mockCallStabilityAPI).toHaveBeenCalledTimes(1);
    const callArgs = mocks.mockCallStabilityAPI.mock.calls[0];
    expect(callArgs[0]).toContain('esrgan-v1-x2plus');
    expect(callArgs[1].image).toBe('image-base64');
  });

  it('Test 4: Fast model + Stability 4x single call with x4plus', async () => {
    mocks.mockCacheGet.mockResolvedValue(null);
    mocks.mockHasStabilityKey.mockReturnValue(true);

    const mockFourXResponse = {
      success: true,
      data: {
        artifacts: [{ base64: 'upscaled-4x-base64' }],
      },
    };

    mocks.mockCallStabilityAPI.mockResolvedValue(mockFourXResponse);

    const req = createMockReq({
      imageBase64: 'image-base64',
      targetScale: 4,
      model: 'fast',
      enhanceFaces: false,
    });

    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    expect(getBody().success).toBe(true);

    const result = getBody().data;
    expect(result.upscaledImageBase64).toBe('upscaled-4x-base64');
    expect(result.originalResolution).toEqual({ width: 512, height: 512 });
    expect(result.newResolution).toEqual({ width: 2048, height: 2048 });

    // Verify single API call for 4x using x4plus endpoint
    expect(mocks.mockCallStabilityAPI).toHaveBeenCalledTimes(1);
    const callArgs = mocks.mockCallStabilityAPI.mock.calls[0];
    expect(callArgs[0]).toContain('esrgan-v1-x4plus');
    expect(callArgs[1].image).toBe('image-base64');
  });

  it('Test 5: Fast + Replicate fallback', async () => {
    mocks.mockCacheGet.mockResolvedValue(null);
    mocks.mockHasStabilityKey.mockReturnValue(false);
    mocks.mockHasReplicateKey.mockReturnValue(true);

    const mockReplicateResponse = {
      success: true,
      data: 'replicate-upscaled-base64',
    };

    mocks.mockCallReplicateModel.mockResolvedValue(mockReplicateResponse);

    const req = createMockReq({
      imageBase64: 'image-base64',
      targetScale: 2,
      model: 'fast',
      enhanceFaces: true,
    });

    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    expect(getBody().success).toBe(true);

    const result = getBody().data;
    expect(result.upscaledImageBase64).toBe('replicate-upscaled-base64');

    // Verify Replicate was called
    expect(mocks.mockCallReplicateModel).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        image: 'image-base64',
        scale: 2,
        face_enhance: true,
      }),
    );
  });

  it('Test 6: Fast + no provider returns original image', async () => {
    mocks.mockCacheGet.mockResolvedValue(null);
    mocks.mockHasStabilityKey.mockReturnValue(false);
    mocks.mockHasReplicateKey.mockReturnValue(false);

    const req = createMockReq({
      imageBase64: 'image-base64',
      targetScale: 2,
      model: 'fast',
      enhanceFaces: false,
    });

    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    expect(getBody().success).toBe(true);

    const result = getBody().data;
    // Graceful degradation: returns original image
    expect(result.upscaledImageBase64).toBe('image-base64');
    expect(result.originalResolution).toEqual({ width: 512, height: 512 });
    expect(result.newResolution).toEqual({ width: 1024, height: 1024 });
  });

  it('Test 7: Correct resolution calculation for 2x scale', async () => {
    mocks.mockCacheGet.mockResolvedValue(null);
    mocks.mockHasStabilityKey.mockReturnValue(true);

    const mockStabilityResponse = {
      success: true,
      data: {
        artifacts: [{ base64: 'upscaled-base64' }],
      },
    };

    mocks.mockCallStabilityAPI.mockResolvedValue(mockStabilityResponse);

    const req = createMockReq({
      imageBase64: 'image-base64',
      targetScale: 2,
      model: 'fast',
      enhanceFaces: false,
    });

    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);

    const result = getBody().data;
    expect(result.originalResolution).toEqual({ width: 512, height: 512 });
    expect(result.newResolution).toEqual({
      width: 512 * 2,
      height: 512 * 2,
    });
  });

  it('Test 8: Correct resolution calculation for 4x scale', async () => {
    mocks.mockCacheGet.mockResolvedValue(null);
    mocks.mockHasStabilityKey.mockReturnValue(true);

    const mockFourXResponse = {
      success: true,
      data: { artifacts: [{ base64: 'upscaled-4x-base64' }] },
    };

    mocks.mockCallStabilityAPI.mockResolvedValue(mockFourXResponse);

    const req = createMockReq({
      imageBase64: 'image-base64',
      targetScale: 4,
      model: 'fast',
      enhanceFaces: false,
    });

    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);

    const result = getBody().data;
    expect(result.originalResolution).toEqual({ width: 512, height: 512 });
    expect(result.newResolution).toEqual({
      width: 512 * 4,
      height: 512 * 4,
    });
  });

  it('Test 9: Caches result with 2 hour TTL', async () => {
    mocks.mockCacheGet.mockResolvedValue(null);
    mocks.mockHasStabilityKey.mockReturnValue(true);

    const mockStabilityResponse = {
      success: true,
      data: {
        artifacts: [{ base64: 'upscaled-base64' }],
      },
    };

    mocks.mockCallStabilityAPI.mockResolvedValue(mockStabilityResponse);

    const req = createMockReq({
      imageBase64: 'image-base64',
      targetScale: 2,
      model: 'fast',
      enhanceFaces: false,
    });

    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);

    const result = getBody().data;

    // Verify caching with 7_200_000 ms TTL (2 hours)
    expect(mocks.mockCacheSet).toHaveBeenCalledWith(
      'upscale:hash-upscale',
      result,
      7_200_000,
    );
  });

  it('Test 10: Rate limit configured correctly', async () => {
    // Rate limit is set in the third argument to createAuthenticatedRoute
    expect(mocks.capturedOptions).toEqual({
      actionType: 'ai',
      rateLimit: { maxRequests: 10, windowMs: 60_000 },
    });
  });

  it('Test 11: Job queue payload contains correct operation', async () => {
    const req = createMockReq({
      imageBase64: 'image-base64',
      targetScale: 4,
      model: 'quality',
      enhanceFaces: true,
    });

    const { res, getStatus } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(202);

    // Verify enqueueJob was called with correct payload
    expect(mocks.mockEnqueueJob).toHaveBeenCalledWith(
      'AI_GENERATION',
      expect.objectContaining({
        operation: 'upscale',
        imageBase64: 'image-base64',
        targetScale: 4,
        model: 'quality',
        enhanceFaces: true,
        userId: 'test-user-123',
      }),
      expect.objectContaining({
        userId: 'test-user-123',
        priority: 5,
      }),
    );
  });

  it('Test 12: Provider throws error returns 500', async () => {
    mocks.mockCacheGet.mockResolvedValue(null);
    mocks.mockHasStabilityKey.mockReturnValue(true);

    const mockError = new Error('API rate limit exceeded');

    mocks.mockCallStabilityAPI.mockRejectedValue(mockError);

    const req = createMockReq({
      imageBase64: 'image-base64',
      targetScale: 2,
      model: 'fast',
      enhanceFaces: false,
    });

    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(500);

    const response = getBody();
    expect(response.success).toBe(false);
    expect(response.error).toEqual({
      code: 'UPSCALE_ERROR',
      message: 'API rate limit exceeded',
    });

    // Verify error was logged
    expect(mocks.mockLogError).toHaveBeenCalledWith(
      'Upscale API error',
      expect.objectContaining({
        userId: 'test-user-123',
        error: 'API rate limit exceeded',
      }),
    );
  });

  it('Test 13: Schema validation is used', async () => {
    // Verify schema is passed to createAuthenticatedRoute
    expect(mocks.capturedSchema).toBeDefined();
  });

  it('Test 14: Processing time is measured', async () => {
    mocks.mockCacheGet.mockResolvedValue(null);
    mocks.mockHasStabilityKey.mockReturnValue(true);

    const mockStabilityResponse = {
      success: true,
      data: {
        artifacts: [{ base64: 'upscaled-base64' }],
      },
    };

    mocks.mockCallStabilityAPI.mockResolvedValue(mockStabilityResponse);

    const req = createMockReq({
      imageBase64: 'image-base64',
      targetScale: 2,
      model: 'fast',
      enhanceFaces: false,
    });

    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);

    const result = getBody().data;
    expect(result.processingTimeMs).toBeGreaterThanOrEqual(0);
    expect(typeof result.processingTimeMs).toBe('number');
  });

  it('Test 15: Fast model does not use enhanceFaces for Stability', async () => {
    mocks.mockCacheGet.mockResolvedValue(null);
    mocks.mockHasStabilityKey.mockReturnValue(true);

    const mockStabilityResponse = {
      success: true,
      data: {
        artifacts: [{ base64: 'upscaled-base64' }],
      },
    };

    mocks.mockCallStabilityAPI.mockResolvedValue(mockStabilityResponse);

    const req = createMockReq({
      imageBase64: 'image-base64',
      targetScale: 2,
      model: 'fast',
      enhanceFaces: true,
    });

    const { res, getStatus } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);

    // Verify Stability API was called (not Replicate with face_enhance)
    expect(mocks.mockCallStabilityAPI).toHaveBeenCalled();
    expect(mocks.mockCallReplicateModel).not.toHaveBeenCalled();
  });

  it('Test 16: Fast model logs completion', async () => {
    mocks.mockCacheGet.mockResolvedValue(null);
    mocks.mockHasStabilityKey.mockReturnValue(true);

    const mockStabilityResponse = {
      success: true,
      data: {
        artifacts: [{ base64: 'upscaled-base64' }],
      },
    };

    mocks.mockCallStabilityAPI.mockResolvedValue(mockStabilityResponse);

    const req = createMockReq({
      imageBase64: 'image-base64',
      targetScale: 2,
      model: 'fast',
      enhanceFaces: false,
    });

    const { res, getStatus } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);

    // Verify completion was logged
    expect(mocks.mockLogInfo).toHaveBeenCalledWith(
      'Upscale completed',
      expect.objectContaining({
        userId: 'test-user-123',
        targetScale: 2,
        enhanceFaces: false,
        processingTimeMs: expect.any(Number),
      }),
    );
  });

  it('Test 17: Quality model logs job queueing', async () => {
    const req = createMockReq({
      imageBase64: 'image-base64',
      targetScale: 2,
      model: 'quality',
      enhanceFaces: false,
    });

    const { res, getStatus } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(202);

    // Verify job queueing was logged
    expect(mocks.mockLogInfo).toHaveBeenCalledWith(
      'Upscale job queued',
      expect.objectContaining({
        userId: 'test-user-123',
        jobId: 'job-id-12345',
        targetScale: 2,
        enhanceFaces: false,
      }),
    );
  });
});
