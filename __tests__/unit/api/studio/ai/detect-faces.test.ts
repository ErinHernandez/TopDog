import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { NextApiResponse } from 'next';

// Hoisted mock state
const mocks = vi.hoisted(() => ({
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

describe('detect-faces API route', () => {
  let handler: ((req: any, res: any) => Promise<void>) | null = null;

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks();

    // Import the route module and get the handler from default export
    const module = await import('@/pages/api/studio/ai/detect-faces');
    handler = module.default;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return cached face detection result on cache hit', async () => {
    const cachedResult = {
      faceCount: 2,
      faceRegions: [
        { id: '1', x: 10, y: 20, width: 100, height: 100, confidence: 0.95 },
        { id: '2', x: 150, y: 25, width: 95, height: 105, confidence: 0.92 },
      ],
    };

    mocks.mockHashImageInput.mockReturnValue('hash-key-123');
    mocks.mockCacheGet.mockResolvedValue(cachedResult);

    const req = createMockReq({ imageBase64: 'base64-image-data' });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    expect(getBody()).toEqual({ success: true, data: cachedResult });
    expect(mocks.mockCacheGet).toHaveBeenCalledWith('faces:hash-key-123');
    expect(mocks.mockCallGoogleAIAPI).not.toHaveBeenCalled();
  });

  it('should detect faces using Google Cloud Vision API on success', async () => {
    mocks.mockHashImageInput.mockReturnValue('hash-key-123');
    mocks.mockCacheGet.mockResolvedValue(null);
    mocks.mockHasGoogleKey.mockReturnValue(true);
    mocks.mockCallGoogleAIAPI.mockResolvedValue({
      success: true,
      data: {
        responses: [
          {
            faceAnnotations: [
              {
                boundingPoly: {
                  vertices: [
                    { x: 10, y: 20 },
                    { x: 110, y: 20 },
                    { x: 110, y: 120 },
                    { x: 10, y: 120 },
                  ],
                },
                detectionConfidence: 0.95,
              },
              {
                boundingPoly: {
                  vertices: [
                    { x: 150, y: 25 },
                    { x: 245, y: 25 },
                    { x: 245, y: 130 },
                    { x: 150, y: 130 },
                  ],
                },
                detectionConfidence: 0.92,
              },
            ],
          },
        ],
      },
    });

    const req = createMockReq({ imageBase64: 'base64-image-data' });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    const body = getBody();
    expect(body.success).toBe(true);
    expect(body.data.faceCount).toBe(2);
    expect(body.data.faceRegions).toHaveLength(2);
    expect(body.data.faceRegions[0].x).toBe(10);
    expect(body.data.faceRegions[0].y).toBe(20);
    expect(body.data.faceRegions[0].confidence).toBe(0.95);
    expect(mocks.mockCacheSet).toHaveBeenCalledWith('faces:hash-key-123', body.data, 3_600_000);
  });

  it('should return zero faces when Google Vision detects no faces', async () => {
    mocks.mockHashImageInput.mockReturnValue('hash-key-123');
    mocks.mockCacheGet.mockResolvedValue(null);
    mocks.mockHasGoogleKey.mockReturnValue(true);
    mocks.mockCallGoogleAIAPI.mockResolvedValue({
      success: true,
      data: {
        responses: [
          {
            faceAnnotations: [],
          },
        ],
      },
    });

    const req = createMockReq({ imageBase64: 'base64-image-data' });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    const body = getBody();
    expect(body.data.faceCount).toBe(0);
    expect(body.data.faceRegions).toEqual([]);
  });

  it('should gracefully degrade when Google Vision API returns error', async () => {
    mocks.mockHashImageInput.mockReturnValue('hash-key-123');
    mocks.mockCacheGet.mockResolvedValue(null);
    mocks.mockHasGoogleKey.mockReturnValue(true);
    mocks.mockCallGoogleAIAPI.mockResolvedValue({
      success: false,
      error: 'API request failed',
    });

    const req = createMockReq({ imageBase64: 'base64-image-data' });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    const body = getBody();
    expect(body.data.faceCount).toBe(0);
    expect(body.data.faceRegions).toEqual([]);
  });

  it('should return zero faces when no Google API key is available', async () => {
    mocks.mockHashImageInput.mockReturnValue('hash-key-123');
    mocks.mockCacheGet.mockResolvedValue(null);
    mocks.mockHasGoogleKey.mockReturnValue(false);

    const req = createMockReq({ imageBase64: 'base64-image-data' });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    const body = getBody();
    expect(body.data.faceCount).toBe(0);
    expect(body.data.faceRegions).toEqual([]);
    expect(mocks.mockCallGoogleAIAPI).not.toHaveBeenCalled();
  });

  it('should cache the face detection result with correct TTL', async () => {
    mocks.mockHashImageInput.mockReturnValue('hash-key-123');
    mocks.mockCacheGet.mockResolvedValue(null);
    mocks.mockHasGoogleKey.mockReturnValue(true);
    mocks.mockCallGoogleAIAPI.mockResolvedValue({
      success: true,
      data: {
        responses: [
          {
            faceAnnotations: [
              {
                boundingPoly: {
                  vertices: [
                    { x: 10, y: 20 },
                    { x: 110, y: 20 },
                    { x: 110, y: 120 },
                    { x: 10, y: 120 },
                  ],
                },
                detectionConfidence: 0.95,
              },
            ],
          },
        ],
      },
    });

    const req = createMockReq({ imageBase64: 'base64-image-data' });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    const body = getBody();
    expect(mocks.mockCacheSet).toHaveBeenCalledWith('faces:hash-key-123', body.data, 3_600_000);
  });

  it('should have correct rate limit configuration', async () => {
    await import('@/pages/api/studio/ai/detect-faces');

    expect(mocks.capturedOptions).toBeDefined();
    expect(mocks.capturedOptions.rateLimit).toBeDefined();
    expect(mocks.capturedOptions.rateLimit.maxRequests).toBe(30);
    expect(mocks.capturedOptions.rateLimit.windowMs).toBe(60_000);
  });
});
