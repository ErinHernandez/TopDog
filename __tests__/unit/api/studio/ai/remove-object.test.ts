import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { NextApiResponse } from 'next';

// Hoisted mock state
const mocks = vi.hoisted(() => ({
  capturedHandler: null as ((req: any, res: any) => Promise<void>) | null,
  capturedSchema: null as any,
  capturedOptions: null as any,
  // Provider mocks
  mockCallStabilityAPI: vi.fn(),
  mockCallOpenAIAPI: vi.fn(),
  mockHasStabilityKey: vi.fn(),
  mockHasOpenAIKey: vi.fn(),
  mockHashImageInput: vi.fn(),
  // Cache mocks
  mockCacheGet: vi.fn(),
  mockCacheSet: vi.fn(),
  // Logger mocks
  mockLogInfo: vi.fn(),
  mockLogWarn: vi.fn(),
  mockLogError: vi.fn(),
}));

// Mock createAuthenticatedRoute to capture handler
vi.mock('@/lib/studio/api/createApiHandler', () => ({
  createAuthenticatedRoute: vi.fn((schema: any, handler: any, options?: any) => {
    mocks.capturedSchema = schema;
    mocks.capturedHandler = handler;
    mocks.capturedOptions = options;
    return handler;
  }),
}));

// Mock provider client
vi.mock('@/lib/studio/services/ai/providerClient', () => ({
  callStabilityAPI: mocks.mockCallStabilityAPI,
  callOpenAIAPI: mocks.mockCallOpenAIAPI,
  hasStabilityKey: mocks.mockHasStabilityKey,
  hasOpenAIKey: mocks.mockHasOpenAIKey,
  hashImageInput: mocks.mockHashImageInput,
}));

// Mock cache
vi.mock('@/lib/studio/infrastructure/cache/cacheManager', () => ({
  getCacheManager: vi.fn(() => ({
    get: mocks.mockCacheGet,
    set: mocks.mockCacheSet,
  })),
}));

// Mock server logger
vi.mock('@/lib/studio/services/serverLogger', () => ({
  serverLogger: {
    info: mocks.mockLogInfo,
    warn: mocks.mockLogWarn,
    error: mocks.mockLogError,
    debug: vi.fn(),
  },
}));

// Helper functions
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

describe('remove-object API route', () => {
  let handler: (req: any, res: any) => Promise<void>;

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks();

    // Import the route module AFTER mocks are set up
    const module = await import('@/pages/api/studio/ai/remove-object');
    handler = module.default;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return cached object removal result on cache hit', async () => {
    const cachedResult = {
      imageBase64: 'result-base64-object-removed',
      processingTimeMs: 200,
      confidence: 0.92,
    };

    mocks.mockHashImageInput.mockReturnValue('hash-key-456');
    mocks.mockCacheGet.mockResolvedValue(cachedResult);

    const req = createMockReq({
      imageBase64: 'base64-image-data',
      maskBase64: 'base64-mask-data',
      qualityLevel: 'quality',
      fillMode: 'inpaint',
    });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    expect(getBody()).toEqual({ success: true, data: cachedResult });
    expect(mocks.mockCacheGet).toHaveBeenCalledWith('rmobj:hash-key-456');
    expect(mocks.mockCallStabilityAPI).not.toHaveBeenCalled();
    expect(mocks.mockLogInfo).toHaveBeenCalledWith(
      'Object removal cache hit',
      expect.objectContaining({ userId: 'test-user-123' })
    );
  });

  it('should remove object using Stability inpainting on success', async () => {
    mocks.mockHashImageInput.mockReturnValue('hash-key-456');
    mocks.mockCacheGet.mockResolvedValue(null);
    mocks.mockHasStabilityKey.mockReturnValue(true);
    mocks.mockCallStabilityAPI.mockResolvedValue({
      success: true,
      data: {
        artifacts: [
          {
            base64: 'result-base64-object-removed',
          },
        ],
      },
    });

    const req = createMockReq({
      imageBase64: 'base64-image-data',
      maskBase64: 'base64-mask-data',
      qualityLevel: 'quality',
      fillMode: 'inpaint',
    });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    const body = getBody();
    expect(body.success).toBe(true);
    expect(body.data.imageBase64).toBe('result-base64-object-removed');
    expect(body.data.confidence).toBe(0.92);
    expect(mocks.mockCallStabilityAPI).toHaveBeenCalledWith(
      '/v2beta/stable-image/edit/inpaint',
      expect.objectContaining({
        image: 'base64-image-data',
        mask: 'base64-mask-data',
        prompt: 'Remove the object and fill with surrounding background seamlessly',
        output_format: 'png',
      })
    );
  });

  it('should use OpenAI fallback when Stability key is unavailable', async () => {
    mocks.mockHashImageInput.mockReturnValue('hash-key-456');
    mocks.mockCacheGet.mockResolvedValue(null);
    mocks.mockHasStabilityKey.mockReturnValue(false);
    mocks.mockHasOpenAIKey.mockReturnValue(true);
    mocks.mockCallOpenAIAPI.mockResolvedValue({
      success: true,
      data: {
        data: [
          {
            b64_json: 'result-base64-from-openai',
          },
        ],
      },
    });

    const req = createMockReq({
      imageBase64: 'base64-image-data',
      maskBase64: 'base64-mask-data',
      qualityLevel: 'quality',
      fillMode: 'inpaint',
    });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    const body = getBody();
    expect(body.success).toBe(true);
    expect(body.data.imageBase64).toBe('result-base64-from-openai');
    expect(body.data.confidence).toBe(0.88);
    expect(mocks.mockCallStabilityAPI).not.toHaveBeenCalled();
    expect(mocks.mockCallOpenAIAPI).toHaveBeenCalledWith(
      '/images/edits',
      expect.objectContaining({
        model: 'gpt-image-1',
        image: 'base64-image-data',
        mask: 'base64-mask-data',
        prompt: 'Fill this area with the surrounding background, removing any objects',
        n: 1,
        size: '1024x1024',
        response_format: 'b64_json',
      })
    );
  });

  it('should gracefully degrade when no provider key is available', async () => {
    mocks.mockHashImageInput.mockReturnValue('hash-key-456');
    mocks.mockCacheGet.mockResolvedValue(null);
    mocks.mockHasStabilityKey.mockReturnValue(false);
    mocks.mockHasOpenAIKey.mockReturnValue(false);

    const req = createMockReq({
      imageBase64: 'base64-image-data',
      maskBase64: 'base64-mask-data',
      qualityLevel: 'quality',
      fillMode: 'inpaint',
    });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    const body = getBody();
    expect(body.success).toBe(true);
    expect(body.data.imageBase64).toBe('base64-image-data');
    expect(body.data.confidence).toBe(0.0);
    expect(mocks.mockCallStabilityAPI).not.toHaveBeenCalled();
    expect(mocks.mockCallOpenAIAPI).not.toHaveBeenCalled();
    expect(mocks.mockLogWarn).toHaveBeenCalledWith(
      'No AI provider key for object removal',
      expect.objectContaining({ userId: 'test-user-123' })
    );
  });

  it('should gracefully degrade when Stability API returns error', async () => {
    mocks.mockHashImageInput.mockReturnValue('hash-key-456');
    mocks.mockCacheGet.mockResolvedValue(null);
    mocks.mockHasStabilityKey.mockReturnValue(true);
    mocks.mockCallStabilityAPI.mockResolvedValue({
      success: false,
      error: 'API request failed',
    });

    const req = createMockReq({
      imageBase64: 'base64-image-data',
      maskBase64: 'base64-mask-data',
      qualityLevel: 'quality',
      fillMode: 'inpaint',
    });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    const body = getBody();
    expect(body.success).toBe(true);
    expect(body.data.imageBase64).toBe('base64-image-data');
    expect(body.data.confidence).toBe(0.0);
    expect(mocks.mockLogWarn).toHaveBeenCalledWith(
      'Stability object removal failed',
      expect.objectContaining({
        userId: 'test-user-123',
        error: 'API request failed',
      })
    );
  });

  it('should gracefully degrade when OpenAI API returns error', async () => {
    mocks.mockHashImageInput.mockReturnValue('hash-key-456');
    mocks.mockCacheGet.mockResolvedValue(null);
    mocks.mockHasStabilityKey.mockReturnValue(false);
    mocks.mockHasOpenAIKey.mockReturnValue(true);
    mocks.mockCallOpenAIAPI.mockResolvedValue({
      success: false,
      error: 'OpenAI API failed',
    });

    const req = createMockReq({
      imageBase64: 'base64-image-data',
      maskBase64: 'base64-mask-data',
      qualityLevel: 'quality',
      fillMode: 'inpaint',
    });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    const body = getBody();
    expect(body.success).toBe(true);
    expect(body.data.imageBase64).toBe('base64-image-data');
    expect(body.data.confidence).toBe(0.0);
    expect(mocks.mockLogWarn).toHaveBeenCalledWith(
      'OpenAI object removal failed',
      expect.objectContaining({
        userId: 'test-user-123',
        error: 'OpenAI API failed',
      })
    );
  });

  it('should cache object removal result with correct TTL when successful', async () => {
    mocks.mockHashImageInput.mockReturnValue('hash-key-456');
    mocks.mockCacheGet.mockResolvedValue(null);
    mocks.mockHasStabilityKey.mockReturnValue(true);
    mocks.mockCallStabilityAPI.mockResolvedValue({
      success: true,
      data: {
        artifacts: [
          {
            base64: 'result-base64-object-removed',
          },
        ],
      },
    });

    const req = createMockReq({
      imageBase64: 'base64-image-data',
      maskBase64: 'base64-mask-data',
      qualityLevel: 'quality',
      fillMode: 'inpaint',
    });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    const body = getBody();
    expect(mocks.mockCacheSet).toHaveBeenCalledWith('rmobj:hash-key-456', body.data, 3_600_000);
  });

  it('should not cache result when confidence is 0', async () => {
    mocks.mockHashImageInput.mockReturnValue('hash-key-456');
    mocks.mockCacheGet.mockResolvedValue(null);
    mocks.mockHasStabilityKey.mockReturnValue(false);
    mocks.mockHasOpenAIKey.mockReturnValue(false);

    const req = createMockReq({
      imageBase64: 'base64-image-data',
      maskBase64: 'base64-mask-data',
      qualityLevel: 'quality',
      fillMode: 'inpaint',
    });
    const { res, getStatus } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    expect(mocks.mockCacheSet).not.toHaveBeenCalled();
  });

  it('should have correct rate limit configuration', async () => {
    await import('@/pages/api/studio/ai/remove-object');

    expect(mocks.capturedOptions).toBeDefined();
    expect(mocks.capturedOptions.rateLimit).toBeDefined();
    expect(mocks.capturedOptions.rateLimit.maxRequests).toBe(20);
    expect(mocks.capturedOptions.rateLimit.windowMs).toBe(60_000);
  });

  it('should pass correct steps parameter for ultra quality level to Stability', async () => {
    mocks.mockHashImageInput.mockReturnValue('hash-key-456');
    mocks.mockCacheGet.mockResolvedValue(null);
    mocks.mockHasStabilityKey.mockReturnValue(true);
    mocks.mockCallStabilityAPI.mockResolvedValue({
      success: true,
      data: {
        artifacts: [
          {
            base64: 'result-base64',
          },
        ],
      },
    });

    const req = createMockReq({
      imageBase64: 'base64-image-data',
      maskBase64: 'base64-mask-data',
      qualityLevel: 'ultra',
      fillMode: 'inpaint',
    });
    const { res } = createMockRes();

    await handler(req, res);

    expect(mocks.mockCallStabilityAPI).toHaveBeenCalledWith(
      '/v2beta/stable-image/edit/inpaint',
      expect.objectContaining({
        steps: 50,
      })
    );
  });

  it('should pass correct steps parameter for quality level to Stability', async () => {
    mocks.mockHashImageInput.mockReturnValue('hash-key-456');
    mocks.mockCacheGet.mockResolvedValue(null);
    mocks.mockHasStabilityKey.mockReturnValue(true);
    mocks.mockCallStabilityAPI.mockResolvedValue({
      success: true,
      data: {
        artifacts: [
          {
            base64: 'result-base64',
          },
        ],
      },
    });

    const req = createMockReq({
      imageBase64: 'base64-image-data',
      maskBase64: 'base64-mask-data',
      qualityLevel: 'quality',
      fillMode: 'inpaint',
    });
    const { res } = createMockRes();

    await handler(req, res);

    expect(mocks.mockCallStabilityAPI).toHaveBeenCalledWith(
      '/v2beta/stable-image/edit/inpaint',
      expect.objectContaining({
        steps: 30,
      })
    );
  });

  it('should not pass steps parameter for draft quality level to Stability', async () => {
    mocks.mockHashImageInput.mockReturnValue('hash-key-456');
    mocks.mockCacheGet.mockResolvedValue(null);
    mocks.mockHasStabilityKey.mockReturnValue(true);
    mocks.mockCallStabilityAPI.mockResolvedValue({
      success: true,
      data: {
        artifacts: [
          {
            base64: 'result-base64',
          },
        ],
      },
    });

    const req = createMockReq({
      imageBase64: 'base64-image-data',
      maskBase64: 'base64-mask-data',
      qualityLevel: 'draft',
      fillMode: 'inpaint',
    });
    const { res } = createMockRes();

    await handler(req, res);

    const calls = mocks.mockCallStabilityAPI.mock.calls;
    const lastCall = calls[calls.length - 1];
    const payloadArg = lastCall[1];
    expect(payloadArg.steps).toBeUndefined();
  });
});
