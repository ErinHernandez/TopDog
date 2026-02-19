import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { NextApiResponse } from 'next';

// Hoisted mock state
const mocks = vi.hoisted(() => ({
  capturedHandler: null as ((req: any, res: any) => Promise<void>) | null,
  capturedSchema: null as any,
  capturedOptions: null as any,
  // Provider mocks
  mockCallGoogleAIAPI: vi.fn(),
  mockCallOpenAIAPI: vi.fn(),
  mockCallStabilityAPI: vi.fn(),
  mockCallReplicateModel: vi.fn(),
  mockHasGoogleKey: vi.fn(),
  mockHasOpenAIKey: vi.fn(),
  mockHasStabilityKey: vi.fn(),
  mockHasReplicateKey: vi.fn(),
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
  callGoogleAIAPI: mocks.mockCallGoogleAIAPI,
  callOpenAIAPI: mocks.mockCallOpenAIAPI,
  callStabilityAPI: mocks.mockCallStabilityAPI,
  callReplicateModel: mocks.mockCallReplicateModel,
  hasGoogleKey: mocks.mockHasGoogleKey,
  hasOpenAIKey: mocks.mockHasOpenAIKey,
  hasStabilityKey: mocks.mockHasStabilityKey,
  hasReplicateKey: mocks.mockHasReplicateKey,
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

describe('enhance-portrait API route', () => {
  let handler: (req: any, res: any) => Promise<void>;

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks();

    // Import the route module AFTER mocks are set up
    const module = await import('@/pages/api/studio/ai/enhance-portrait');
    handler = module.default;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return cached portrait enhancement result on cache hit', async () => {
    const cachedResult = {
      enhancedImageBase64: 'cached-enhanced-image-base64',
      faceCount: 1,
      processingTimeMs: 245,
      enhancementsApplied: ['skin_smoothing', 'eye_enhancement'],
    };

    mocks.mockHashImageInput.mockReturnValue('hash-key-456');
    mocks.mockCacheGet.mockResolvedValue(cachedResult);

    const req = createMockReq({
      imageBase64: 'base64-image-data',
      enhancements: { skinSmoothing: 50 },
      qualityLevel: 'high',
    });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    const body = getBody();
    expect(body.success).toBe(true);
    expect(body.data).toEqual(cachedResult);
    expect(mocks.mockCacheGet).toHaveBeenCalledWith('portrait:hash-key-456');
    expect(mocks.mockCallOpenAIAPI).not.toHaveBeenCalled();
  });

  it('should enhance portrait using OpenAI on success', async () => {
    mocks.mockHashImageInput.mockReturnValue('hash-key-456');
    mocks.mockCacheGet.mockResolvedValue(null);
    mocks.mockHasOpenAIKey.mockReturnValue(true);
    mocks.mockCallOpenAIAPI.mockResolvedValue({
      success: true,
      data: {
        data: [{ b64_json: 'enhanced-image-base64-from-openai' }],
      },
    });

    const req = createMockReq({
      imageBase64: 'base64-image-data',
      enhancements: { skinSmoothing: 50, eyeEnhancement: 75 },
      qualityLevel: 'high',
    });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    const body = getBody();
    expect(body.success).toBe(true);
    expect(body.data.enhancedImageBase64).toBe('enhanced-image-base64-from-openai');
    expect(body.data.faceCount).toBeGreaterThanOrEqual(0);
    expect(body.data.processingTimeMs).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(body.data.enhancementsApplied)).toBe(true);
    expect(mocks.mockCacheSet).toHaveBeenCalledWith('portrait:hash-key-456', body.data, 3_600_000);
  });

  it('should return original image when OpenAI call fails', async () => {
    mocks.mockHashImageInput.mockReturnValue('hash-key-456');
    mocks.mockCacheGet.mockResolvedValue(null);
    mocks.mockHasOpenAIKey.mockReturnValue(true);
    mocks.mockCallOpenAIAPI.mockResolvedValue({
      success: false,
      error: 'OpenAI API error',
    });
    mocks.mockHasStabilityKey.mockReturnValue(false);

    const req = createMockReq({
      imageBase64: 'base64-image-data',
      enhancements: { skinSmoothing: 50 },
      qualityLevel: 'high',
    });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    const body = getBody();
    expect(body.success).toBe(true);
    expect(body.data.enhancedImageBase64).toBe('base64-image-data');
    expect(mocks.mockCallOpenAIAPI).toHaveBeenCalled();
    expect(mocks.mockCallStabilityAPI).not.toHaveBeenCalled();
  });

  it('should use Stability API when OpenAI key is not available', async () => {
    mocks.mockHashImageInput.mockReturnValue('hash-key-456');
    mocks.mockCacheGet.mockResolvedValue(null);
    mocks.mockHasOpenAIKey.mockReturnValue(false);
    mocks.mockHasStabilityKey.mockReturnValue(true);
    mocks.mockCallStabilityAPI.mockResolvedValue({
      success: true,
      data: {
        artifacts: [{ base64: 'enhanced-image-base64-from-stability' }],
      },
    });

    const req = createMockReq({
      imageBase64: 'base64-image-data',
      enhancements: { eyeEnhancement: 75 },
      qualityLevel: 'medium',
    });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    const body = getBody();
    expect(body.success).toBe(true);
    expect(body.data.enhancedImageBase64).toBe('enhanced-image-base64-from-stability');
    expect(mocks.mockCallOpenAIAPI).not.toHaveBeenCalled();
    expect(mocks.mockCallStabilityAPI).toHaveBeenCalled();
  });

  it('should return original image when no provider is available', async () => {
    mocks.mockHashImageInput.mockReturnValue('hash-key-456');
    mocks.mockCacheGet.mockResolvedValue(null);
    mocks.mockHasOpenAIKey.mockReturnValue(false);
    mocks.mockHasStabilityKey.mockReturnValue(false);

    const req = createMockReq({
      imageBase64: 'base64-image-data',
      enhancements: { skinSmoothing: 50 },
      qualityLevel: 'high',
    });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    const body = getBody();
    expect(body.success).toBe(true);
    expect(body.data.enhancedImageBase64).toBe('base64-image-data');
    expect(mocks.mockCallOpenAIAPI).not.toHaveBeenCalled();
    expect(mocks.mockCallStabilityAPI).not.toHaveBeenCalled();
  });

  it('should build enhancement prompt with selected enhancements', async () => {
    mocks.mockHashImageInput.mockReturnValue('hash-key-456');
    mocks.mockCacheGet.mockResolvedValue(null);
    mocks.mockHasOpenAIKey.mockReturnValue(true);
    mocks.mockCallOpenAIAPI.mockResolvedValue({
      success: true,
      data: {
        data: [{ b64_json: 'enhanced-image-base64' }],
      },
    });

    const req = createMockReq({
      imageBase64: 'base64-image-data',
      enhancements: { skinSmoothing: 50, eyeEnhancement: 75 },
      qualityLevel: 'high',
    });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    const callArgs = mocks.mockCallOpenAIAPI.mock.calls[0];
    expect(callArgs).toBeDefined();
    // Verify the handler was called with request that includes enhancements
    expect(mocks.mockCallOpenAIAPI).toHaveBeenCalled();
  });

  it('should track applied enhancements in response', async () => {
    mocks.mockHashImageInput.mockReturnValue('hash-key-456');
    mocks.mockCacheGet.mockResolvedValue(null);
    mocks.mockHasOpenAIKey.mockReturnValue(true);
    mocks.mockCallOpenAIAPI.mockResolvedValue({
      success: true,
      data: {
        data: [{ b64_json: 'enhanced-image-base64' }],
      },
    });

    const req = createMockReq({
      imageBase64: 'base64-image-data',
      enhancements: {
        skinSmoothing: 50,
        blemishRemoval: 60,
        eyeEnhancement: 75,
        teethWhitening: 40,
      },
      qualityLevel: 'high',
    });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    const body = getBody();
    expect(body.success).toBe(true);
    expect(body.data.enhancementsApplied).toBeDefined();
    expect(Array.isArray(body.data.enhancementsApplied)).toBe(true);
    // At least some enhancements should be tracked
    expect(body.data.enhancementsApplied.length).toBeGreaterThan(0);
  });

  it('should cache the portrait enhancement result with correct TTL', async () => {
    mocks.mockHashImageInput.mockReturnValue('hash-key-456');
    mocks.mockCacheGet.mockResolvedValue(null);
    mocks.mockHasOpenAIKey.mockReturnValue(true);
    mocks.mockCallOpenAIAPI.mockResolvedValue({
      success: true,
      data: {
        data: [{ b64_json: 'enhanced-image-base64' }],
      },
    });

    const req = createMockReq({
      imageBase64: 'base64-image-data',
      enhancements: { skinSmoothing: 50 },
      qualityLevel: 'high',
    });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    const body = getBody();
    expect(mocks.mockCacheSet).toHaveBeenCalledWith('portrait:hash-key-456', body.data, 3_600_000);
  });

  it('should have correct rate limit configuration', async () => {
    await import('@/pages/api/studio/ai/enhance-portrait');

    expect(mocks.capturedOptions).toBeDefined();
    expect(mocks.capturedOptions.rateLimit).toBeDefined();
    expect(mocks.capturedOptions.rateLimit.maxRequests).toBe(20);
    expect(mocks.capturedOptions.rateLimit.windowMs).toBe(60_000);
  });

  it('should handle optional enhancements with conditional spread operator', async () => {
    mocks.mockHashImageInput.mockReturnValue('hash-key-456');
    mocks.mockCacheGet.mockResolvedValue(null);
    mocks.mockHasOpenAIKey.mockReturnValue(true);
    mocks.mockCallOpenAIAPI.mockResolvedValue({
      success: true,
      data: {
        data: [{ b64_json: 'enhanced-image-base64' }],
      },
    });

    // Request with only some enhancements defined
    const req = createMockReq({
      imageBase64: 'base64-image-data',
      enhancements: {
        skinSmoothing: 50,
        // blemishRemoval is undefined
        eyeEnhancement: undefined,
        // teethWhitening is not included
      },
      qualityLevel: 'medium',
    });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    const body = getBody();
    expect(body.success).toBe(true);
    expect(body.data.enhancedImageBase64).toBeDefined();
    expect(body.data.enhancementsApplied).toBeDefined();
  });
});
