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

describe('text-edit API route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockHashImageInput.mockReturnValue('test-hash-456');
    mocks.mockCacheGet.mockResolvedValue(null);
    mocks.mockCacheSet.mockResolvedValue(undefined);
    mocks.mockHasOpenAIKey.mockReturnValue(false);
    mocks.mockHasStabilityKey.mockReturnValue(false);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should return cached TextToEditResult on cache hit', async () => {
    const handler = await import('@/pages/api/studio/ai/text-edit').then(
      (m) => m.default
    );

    const cachedResult = {
      imageBase64: 'cached-edited-image',
      instructionHash: 'hash-abc',
      processingTimeMs: 150,
      confidence: 0.9,
      maskUsed: false,
    };
    mocks.mockCacheGet.mockResolvedValueOnce(cachedResult);

    const req = createMockReq({
      imageBase64: 'base64-data',
      instruction: 'Make the sky bluer',
      qualityLevel: 'standard',
    });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    const body = getBody();
    expect(body.success).toBe(true);
    expect(body.data).toEqual(cachedResult);
    expect(mocks.mockLogInfo).toHaveBeenCalledWith(
      'Text-edit cache hit',
      { userId: 'test-user-123' }
    );
  });

  it('should return edited image with confidence 0.9 on OpenAI success', async () => {
    const handler = await import('@/pages/api/studio/ai/text-edit').then(
      (m) => m.default
    );

    mocks.mockHasOpenAIKey.mockReturnValue(true);
    mocks.mockCallOpenAIAPI.mockResolvedValueOnce({
      success: true,
      data: {
        data: [{ b64_json: 'openai-edited-image' }],
      },
    });

    const req = createMockReq({
      imageBase64: 'base64-data',
      instruction: 'Remove the person from the background',
      qualityLevel: 'standard',
    });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    const body = getBody();
    expect(body.success).toBe(true);
    expect(body.data.imageBase64).toBe('openai-edited-image');
    expect(body.data.confidence).toBe(0.9);
    expect(body.data.maskUsed).toBe(false);
  });

  it('should pass mask parameter to OpenAI API when maskBase64 is provided', async () => {
    const handler = await import('@/pages/api/studio/ai/text-edit').then(
      (m) => m.default
    );

    mocks.mockHasOpenAIKey.mockReturnValue(true);
    mocks.mockCallOpenAIAPI.mockResolvedValueOnce({
      success: true,
      data: {
        data: [{ b64_json: 'masked-edited-image' }],
      },
    });

    const req = createMockReq({
      imageBase64: 'base64-data',
      instruction: 'Change the color to red',
      maskBase64: 'mask-base64',
      qualityLevel: 'standard',
    });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    const body = getBody();
    expect(body.data.maskUsed).toBe(true);
    expect(mocks.mockCallOpenAIAPI).toHaveBeenCalledWith(
      '/images/edits',
      expect.objectContaining({
        mask: 'mask-base64',
      })
    );
  });

  it('should fallback to Stability with confidence 0.75 when OpenAI unavailable', async () => {
    const handler = await import('@/pages/api/studio/ai/text-edit').then(
      (m) => m.default
    );

    mocks.mockHasOpenAIKey.mockReturnValue(false);
    mocks.mockHasStabilityKey.mockReturnValue(true);
    mocks.mockCallStabilityAPI.mockResolvedValueOnce({
      success: true,
      data: {
        artifacts: [{ base64: 'stability-edited-image' }],
      },
    });

    const req = createMockReq({
      imageBase64: 'base64-data',
      instruction: 'Make it darker',
      qualityLevel: 'standard',
    });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    const body = getBody();
    expect(body.data.imageBase64).toBe('stability-edited-image');
    expect(body.data.confidence).toBe(0.75);
  });

  it('should return original image with confidence 0.0 when OpenAI call fails', async () => {
    const handler = await import('@/pages/api/studio/ai/text-edit').then(
      (m) => m.default
    );

    mocks.mockHasOpenAIKey.mockReturnValue(true);
    mocks.mockCallOpenAIAPI.mockResolvedValueOnce({
      success: false,
      error: 'OpenAI error',
    });

    const req = createMockReq({
      imageBase64: 'base64-data',
      instruction: 'Increase contrast',
      qualityLevel: 'quality',
    });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    const body = getBody();
    expect(body.data.imageBase64).toBe('base64-data');
    expect(body.data.confidence).toBe(0.0);
    expect(mocks.mockCallStabilityAPI).not.toHaveBeenCalled();
  });

  it('should return original image with confidence 0.0 when no provider is available', async () => {
    const handler = await import('@/pages/api/studio/ai/text-edit').then(
      (m) => m.default
    );

    mocks.mockHasOpenAIKey.mockReturnValue(false);
    mocks.mockHasStabilityKey.mockReturnValue(false);

    const req = createMockReq({
      imageBase64: 'original-base64',
      instruction: 'Make it brighter',
      qualityLevel: 'standard',
    });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    const body = getBody();
    expect(body.data.imageBase64).toBe('original-base64');
    expect(body.data.confidence).toBe(0.0);
    expect(mocks.mockLogWarn).toHaveBeenCalledWith(
      'No AI provider key for text-edit',
      { userId: 'test-user-123' }
    );
  });

  it('should include previousInstructions context in prompt', async () => {
    const handler = await import('@/pages/api/studio/ai/text-edit').then(
      (m) => m.default
    );

    mocks.mockHasOpenAIKey.mockReturnValue(true);
    mocks.mockCallOpenAIAPI.mockResolvedValueOnce({
      success: true,
      data: {
        data: [{ b64_json: 'edited-image' }],
      },
    });

    const req = createMockReq({
      imageBase64: 'base64-data',
      instruction: 'Now add shadows',
      previousInstructions: ['Remove background', 'Add lighting'],
      qualityLevel: 'standard',
    });
    const { res, getStatus } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    expect(mocks.mockCallOpenAIAPI).toHaveBeenCalledWith(
      '/images/edits',
      expect.objectContaining({
        prompt: expect.stringContaining('Previous edits:'),
        prompt: expect.stringContaining('Remove background'),
        prompt: expect.stringContaining('Add lighting'),
        prompt: expect.stringContaining('New instruction: Now add shadows'),
      })
    );
  });

  it('should NOT cache result when confidence is 0.0', async () => {
    const handler = await import('@/pages/api/studio/ai/text-edit').then(
      (m) => m.default
    );

    mocks.mockHasOpenAIKey.mockReturnValue(false);
    mocks.mockHasStabilityKey.mockReturnValue(false);

    const req = createMockReq({
      imageBase64: 'original-base64',
      instruction: 'Edit image',
      qualityLevel: 'standard',
    });
    const { res, getStatus } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    expect(mocks.mockCacheSet).not.toHaveBeenCalled();
  });

  it('should cache result with 3600000ms TTL when confidence > 0', async () => {
    const handler = await import('@/pages/api/studio/ai/text-edit').then(
      (m) => m.default
    );

    mocks.mockHasOpenAIKey.mockReturnValue(true);
    mocks.mockCallOpenAIAPI.mockResolvedValueOnce({
      success: true,
      data: {
        data: [{ b64_json: 'edited-image' }],
      },
    });

    const req = createMockReq({
      imageBase64: 'base64-data',
      instruction: 'Brighten the image',
      qualityLevel: 'quality',
    });
    const { res, getStatus } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    expect(mocks.mockCacheSet).toHaveBeenCalledWith(
      'textedit:test-hash-456',
      expect.objectContaining({
        imageBase64: 'edited-image',
        confidence: 0.9,
      }),
      3_600_000
    );
  });

  it('should respect rate limit maxRequests of 20', async () => {
    await import('@/pages/api/studio/ai/text-edit');

    expect(mocks.capturedOptions).toEqual({
      actionType: 'ai',
      rateLimit: { maxRequests: 20, windowMs: 60_000 },
    });
  });
});
