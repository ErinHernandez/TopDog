import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { NextApiResponse } from 'next';

// Hoisted mock state
const mocks = vi.hoisted(() => ({
  capturedHandler: null as ((req: any, res: any) => Promise<void>) | null,
  capturedSchema: null as any,
  capturedOptions: null as any,
  // Provider mocks
  mockCallStabilityAPI: vi.fn(),
  mockHasStabilityKey: vi.fn(),
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
  hasStabilityKey: mocks.mockHasStabilityKey,
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

describe('remove-bg API route', () => {
  let handler: (req: any, res: any) => Promise<void>;

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks();

    // Import the route module AFTER mocks are set up
    const module = await import('@/pages/api/studio/ai/remove-bg');
    handler = module.default;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return cached background removal result on cache hit', async () => {
    const cachedResult = {
      maskBase64: 'mask-data-base64',
      resultBase64: 'result-base64-with-bg-removed',
      edgeQuality: 'moderate' as const,
      processingTimeMs: 150,
      confidence: 0.95,
    };

    mocks.mockHashImageInput.mockReturnValue('hash-key-123');
    mocks.mockCacheGet.mockResolvedValue(cachedResult);

    const req = createMockReq({
      imageBase64: 'base64-image-data',
      qualityLevel: 'quality',
    });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    expect(getBody()).toEqual({ success: true, data: cachedResult });
    expect(mocks.mockCacheGet).toHaveBeenCalledWith('rmbg:hash-key-123');
    expect(mocks.mockCallStabilityAPI).not.toHaveBeenCalled();
    expect(mocks.mockLogInfo).toHaveBeenCalledWith(
      'Background removal cache hit',
      expect.objectContaining({ userId: 'test-user-123' })
    );
  });

  it('should remove background using Stability API on success', async () => {
    mocks.mockHashImageInput.mockReturnValue('hash-key-123');
    mocks.mockCacheGet.mockResolvedValue(null);
    mocks.mockHasStabilityKey.mockReturnValue(true);
    mocks.mockCallStabilityAPI.mockResolvedValue({
      success: true,
      data: {
        artifacts: [
          {
            base64: 'result-base64-with-transparent-bg',
            finishReason: 'SUCCESS',
          },
        ],
      },
    });

    const req = createMockReq({
      imageBase64: 'base64-image-data',
      qualityLevel: 'quality',
      background: 'transparent',
    });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    const body = getBody();
    expect(body.success).toBe(true);
    expect(body.data.maskBase64).toBe('result-base64-with-transparent-bg');
    expect(body.data.resultBase64).toBe('result-base64-with-transparent-bg');
    expect(body.data.confidence).toBe(0.95);
    expect(body.data.edgeQuality).toBe('moderate');
    expect(mocks.mockCallStabilityAPI).toHaveBeenCalledWith(
      '/v2beta/stable-image/edit/remove-background',
      expect.objectContaining({
        image: 'base64-image-data',
        output_format: 'png',
      })
    );
  });

  it('should gracefully degrade when no Stability key is available', async () => {
    mocks.mockHashImageInput.mockReturnValue('hash-key-123');
    mocks.mockCacheGet.mockResolvedValue(null);
    mocks.mockHasStabilityKey.mockReturnValue(false);

    const req = createMockReq({
      imageBase64: 'base64-image-data',
      qualityLevel: 'quality',
    });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    const body = getBody();
    expect(body.success).toBe(true);
    expect(body.data.maskBase64).toBe('');
    expect(body.data.resultBase64).toBe('base64-image-data');
    expect(body.data.confidence).toBe(0.0);
    expect(mocks.mockCallStabilityAPI).not.toHaveBeenCalled();
    expect(mocks.mockLogWarn).toHaveBeenCalledWith(
      'No AI provider key for background removal',
      expect.objectContaining({ userId: 'test-user-123' })
    );
  });

  it('should gracefully degrade when Stability API returns error', async () => {
    mocks.mockHashImageInput.mockReturnValue('hash-key-123');
    mocks.mockCacheGet.mockResolvedValue(null);
    mocks.mockHasStabilityKey.mockReturnValue(true);
    mocks.mockCallStabilityAPI.mockResolvedValue({
      success: false,
      error: 'API request failed',
      statusCode: 500,
    });

    const req = createMockReq({
      imageBase64: 'base64-image-data',
      qualityLevel: 'quality',
    });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    const body = getBody();
    expect(body.success).toBe(true);
    expect(body.data.maskBase64).toBe('');
    expect(body.data.resultBase64).toBe('base64-image-data');
    expect(body.data.confidence).toBe(0.0);
    expect(mocks.mockLogWarn).toHaveBeenCalledWith(
      'Stability background removal failed',
      expect.objectContaining({
        userId: 'test-user-123',
        error: 'API request failed',
        statusCode: 500,
      })
    );
  });

  it('should cache background removal result with correct TTL when successful', async () => {
    mocks.mockHashImageInput.mockReturnValue('hash-key-123');
    mocks.mockCacheGet.mockResolvedValue(null);
    mocks.mockHasStabilityKey.mockReturnValue(true);
    mocks.mockCallStabilityAPI.mockResolvedValue({
      success: true,
      data: {
        artifacts: [
          {
            base64: 'result-base64-with-transparent-bg',
            finishReason: 'SUCCESS',
          },
        ],
      },
    });

    const req = createMockReq({
      imageBase64: 'base64-image-data',
      qualityLevel: 'quality',
      background: 'transparent',
    });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    const body = getBody();
    expect(mocks.mockCacheSet).toHaveBeenCalledWith('rmbg:hash-key-123', body.data, 7_200_000);
  });

  it('should not cache result when confidence is 0', async () => {
    mocks.mockHashImageInput.mockReturnValue('hash-key-123');
    mocks.mockCacheGet.mockResolvedValue(null);
    mocks.mockHasStabilityKey.mockReturnValue(false);

    const req = createMockReq({
      imageBase64: 'base64-image-data',
      qualityLevel: 'quality',
    });
    const { res, getStatus } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    expect(mocks.mockCacheSet).not.toHaveBeenCalled();
  });

  it('should have correct rate limit configuration', async () => {
    await import('@/pages/api/studio/ai/remove-bg');

    expect(mocks.capturedOptions).toBeDefined();
    expect(mocks.capturedOptions.rateLimit).toBeDefined();
    expect(mocks.capturedOptions.rateLimit.maxRequests).toBe(20);
    expect(mocks.capturedOptions.rateLimit.windowMs).toBe(60_000);
  });

  it('should handle edgeQuality mapping based on qualityLevel', async () => {
    mocks.mockHashImageInput.mockReturnValue('hash-key-123');
    mocks.mockCacheGet.mockResolvedValue(null);
    mocks.mockHasStabilityKey.mockReturnValue(true);
    mocks.mockCallStabilityAPI.mockResolvedValue({
      success: true,
      data: {
        artifacts: [
          {
            base64: 'result-base64',
            finishReason: 'SUCCESS',
          },
        ],
      },
    });

    const req = createMockReq({
      imageBase64: 'base64-image-data',
      qualityLevel: 'ultra',
      background: 'transparent',
    });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    const body = getBody();
    expect(body.data.edgeQuality).toBe('clean');
  });

  it('should map quality level draft to soft edge quality', async () => {
    mocks.mockHashImageInput.mockReturnValue('hash-key-123');
    mocks.mockCacheGet.mockResolvedValue(null);
    mocks.mockHasStabilityKey.mockReturnValue(true);
    mocks.mockCallStabilityAPI.mockResolvedValue({
      success: true,
      data: {
        artifacts: [
          {
            base64: 'result-base64',
            finishReason: 'SUCCESS',
          },
        ],
      },
    });

    const req = createMockReq({
      imageBase64: 'base64-image-data',
      qualityLevel: 'draft',
      background: 'transparent',
    });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    const body = getBody();
    expect(body.data.edgeQuality).toBe('soft');
  });
});
