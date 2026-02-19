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

describe('Inpaint API Route', () => {
  let handler: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    mocks.mockHashImageInput.mockReturnValue('hash123');

    const inpaintModule = await import('/sessions/great-elegant-noether/mnt/td.d/pages/api/studio/ai/inpaint');
    handler = inpaintModule.default;
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

  it('Test 1: Cache hit returns cached InpaintingResult', async () => {
    const cachedResult = {
      candidates: [
        {
          id: 'candidate-1',
          imageBase64: 'cached-image-base64',
          score: 0.9,
          generatedAt: Date.now(),
        },
      ],
      selectedIndex: 0,
      processingTimeMs: 100,
    };

    mocks.mockCacheGet.mockResolvedValue(cachedResult);

    const req = createMockReq({
      imageBase64: 'image-base64',
      maskBase64: 'mask-base64',
      prompt: 'test prompt',
      strength: 0.8,
      qualityLevel: 'quality',
      numCandidates: 1,
    });

    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    expect(getBody()).toEqual({
      success: true,
      data: cachedResult,
    });
    expect(mocks.mockLogInfo).toHaveBeenCalledWith(
      'Inpaint cache hit',
      { userId: 'test-user-123' },
    );
  });

  it('Test 2: Stability success with parallel candidates', async () => {
    mocks.mockCacheGet.mockResolvedValue(null);
    mocks.mockHasStabilityKey.mockReturnValue(true);
    mocks.mockHashImageInput.mockReturnValue('hash-stability');

    const mockStabilityResponse = {
      success: true,
      data: {
        artifacts: [{ base64: 'stability-image-base64' }],
      },
    };

    mocks.mockCallStabilityAPI.mockResolvedValue(mockStabilityResponse);

    const req = createMockReq({
      imageBase64: 'image-base64',
      maskBase64: 'mask-base64',
      prompt: 'test prompt',
      strength: 0.8,
      qualityLevel: 'quality',
      numCandidates: 3,
    });

    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    expect(getBody().success).toBe(true);
    const result = getBody().data;
    expect(result.candidates).toHaveLength(3);
    expect(result.selectedIndex).toBe(0);
    expect(result.processingTimeMs).toBeGreaterThanOrEqual(0);

    // Verify candidates have scores in 0.85-0.95 range
    result.candidates.forEach((candidate: any) => {
      expect(candidate.score).toBeGreaterThanOrEqual(0.85);
      expect(candidate.score).toBeLessThanOrEqual(0.95);
      expect(candidate.imageBase64).toBe('stability-image-base64');
      expect(candidate.id).toBeDefined();
      expect(candidate.generatedAt).toBeDefined();
    });

    // Verify parallel calls (3 candidates)
    expect(mocks.mockCallStabilityAPI).toHaveBeenCalledTimes(3);

    // Verify caching due to scores > 0.5
    expect(mocks.mockCacheSet).toHaveBeenCalledWith('inpaint:hash-stability', result, 3_600_000);
  });

  it('Test 3: OpenAI fallback with sequential candidates', async () => {
    mocks.mockCacheGet.mockResolvedValue(null);
    mocks.mockHasStabilityKey.mockReturnValue(false);
    mocks.mockHasOpenAIKey.mockReturnValue(true);
    mocks.mockHashImageInput.mockReturnValue('hash-openai');

    const mockOpenAIResponse = {
      success: true,
      data: {
        data: [{ b64_json: 'openai-image-base64' }],
      },
    };

    mocks.mockCallOpenAIAPI.mockResolvedValue(mockOpenAIResponse);

    const req = createMockReq({
      imageBase64: 'image-base64',
      maskBase64: 'mask-base64',
      prompt: 'test prompt',
      strength: 0.8,
      qualityLevel: 'quality',
      numCandidates: 2,
    });

    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    expect(getBody().success).toBe(true);
    const result = getBody().data;
    expect(result.candidates).toHaveLength(2);

    // Verify candidates have scores in 0.80-0.90 range
    result.candidates.forEach((candidate: any) => {
      expect(candidate.score).toBeGreaterThanOrEqual(0.80);
      expect(candidate.score).toBeLessThanOrEqual(0.90);
      expect(candidate.imageBase64).toBe('openai-image-base64');
    });

    // Verify sequential calls (2 candidates)
    expect(mocks.mockCallOpenAIAPI).toHaveBeenCalledTimes(2);

    // Verify caching due to scores > 0.5
    expect(mocks.mockCacheSet).toHaveBeenCalledWith('inpaint:hash-openai', result, 3_600_000);
  });

  it('Test 4: No provider → mock candidates fallback', async () => {
    mocks.mockCacheGet.mockResolvedValue(null);
    mocks.mockHasStabilityKey.mockReturnValue(false);
    mocks.mockHasOpenAIKey.mockReturnValue(false);
    mocks.mockHashImageInput.mockReturnValue('hash-mock');

    const req = createMockReq({
      imageBase64: 'image-base64',
      maskBase64: 'mask-base64',
      prompt: 'test prompt',
      strength: 0.8,
      qualityLevel: 'quality',
      numCandidates: 2,
    });

    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    expect(getBody().success).toBe(true);
    const result = getBody().data;
    expect(result.candidates).toHaveLength(2);

    // Mock candidates have score 0.5
    result.candidates.forEach((candidate: any) => {
      expect(candidate.score).toBe(0.5);
      expect(candidate.imageBase64).toBe('image-base64');
    });

    expect(mocks.mockLogWarn).toHaveBeenCalledWith(
      'No AI provider key for inpainting, using mock candidates',
      { userId: 'test-user-123' },
    );
  });

  it('Test 5: Empty candidates fallback to original image', async () => {
    mocks.mockCacheGet.mockResolvedValue(null);
    mocks.mockHasStabilityKey.mockReturnValue(true);
    mocks.mockHashImageInput.mockReturnValue('hash-empty');

    // Stability returns empty artifacts
    mocks.mockCallStabilityAPI.mockResolvedValue({
      success: true,
      data: { artifacts: [] },
    });

    const req = createMockReq({
      imageBase64: 'image-base64',
      maskBase64: 'mask-base64',
      prompt: 'test prompt',
      strength: 0.8,
      qualityLevel: 'quality',
      numCandidates: 1,
    });

    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    const result = getBody().data;
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0].imageBase64).toBe('image-base64');
    expect(result.candidates[0].score).toBe(0.0);
  });

  it('Test 6: Previous instructions appended to prompt', async () => {
    mocks.mockCacheGet.mockResolvedValue(null);
    mocks.mockHasStabilityKey.mockReturnValue(true);

    const mockStabilityResponse = {
      success: true,
      data: { artifacts: [{ base64: 'stability-image-base64' }] },
    };

    mocks.mockCallStabilityAPI.mockResolvedValue(mockStabilityResponse);

    const req = createMockReq({
      imageBase64: 'image-base64',
      maskBase64: 'mask-base64',
      prompt: 'add details',
      strength: 0.8,
      qualityLevel: 'quality',
      numCandidates: 1,
      previousInstructions: ['make it bright', 'add contrast'],
    });

    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);

    // Verify the handler was called with full prompt that includes context
    const callArgs = mocks.mockCallStabilityAPI.mock.calls[0];
    expect(callArgs).toBeDefined();
    const payloadArg = callArgs[1];
    expect(payloadArg.text_prompts[0].text).toContain(
      'Context from previous edits:',
    );
    expect(payloadArg.text_prompts[0].text).toContain('make it bright');
    expect(payloadArg.text_prompts[0].text).toContain('add contrast');
    expect(payloadArg.text_prompts[0].text).toContain('add details');
  });

  it('Test 7: Caches when scores > 0.5', async () => {
    mocks.mockCacheGet.mockResolvedValue(null);
    mocks.mockHasStabilityKey.mockReturnValue(true);
    mocks.mockHashImageInput.mockReturnValue('hash-cache-high');

    const mockStabilityResponse = {
      success: true,
      data: { artifacts: [{ base64: 'stability-image-base64' }] },
    };

    mocks.mockCallStabilityAPI.mockResolvedValue(mockStabilityResponse);

    const req = createMockReq({
      imageBase64: 'image-base64',
      maskBase64: 'mask-base64',
      prompt: 'test prompt',
      strength: 0.8,
      qualityLevel: 'quality',
      numCandidates: 1,
    });

    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    const result = getBody().data;

    // Stability API returns candidates with scores 0.85-0.95 (all > 0.5)
    expect(result.candidates[0].score).toBeGreaterThan(0.5);

    // Verify caching was called
    expect(mocks.mockCacheSet).toHaveBeenCalledWith(
      'inpaint:hash-cache-high',
      result,
      3_600_000,
    );
  });

  it('Test 8: No cache when all scores ≤ 0.5 (mock candidates)', async () => {
    mocks.mockCacheGet.mockResolvedValue(null);
    mocks.mockHasStabilityKey.mockReturnValue(false);
    mocks.mockHasOpenAIKey.mockReturnValue(false);
    mocks.mockHashImageInput.mockReturnValue('hash-cache-mock');

    const req = createMockReq({
      imageBase64: 'image-base64',
      maskBase64: 'mask-base64',
      prompt: 'test prompt',
      strength: 0.8,
      qualityLevel: 'quality',
      numCandidates: 1,
    });

    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    const result = getBody().data;

    // Mock candidates have score 0.5 (which is NOT > 0.5)
    expect(result.candidates[0].score).toBe(0.5);

    // Verify caching was NOT called
    expect(mocks.mockCacheSet).not.toHaveBeenCalled();
  });

  it('Test 9: Rate limit configured correctly', async () => {
    // Rate limit is set in the third argument to createAuthenticatedRoute
    expect(mocks.capturedOptions).toEqual({
      actionType: 'ai',
      rateLimit: { maxRequests: 15, windowMs: 60_000 },
    });
  });

  it('Test 10: Schema validation is used', async () => {
    // Verify schema is passed to createAuthenticatedRoute
    expect(mocks.capturedSchema).toBeDefined();
  });

  it('Test 11: Seed parameter affects candidate generation', async () => {
    mocks.mockCacheGet.mockResolvedValue(null);
    mocks.mockHasStabilityKey.mockReturnValue(true);

    const mockStabilityResponse = {
      success: true,
      data: { artifacts: [{ base64: 'stability-image-base64' }] },
    };

    mocks.mockCallStabilityAPI.mockResolvedValue(mockStabilityResponse);

    const req = createMockReq({
      imageBase64: 'image-base64',
      maskBase64: 'mask-base64',
      prompt: 'test prompt',
      strength: 0.8,
      qualityLevel: 'quality',
      numCandidates: 3,
      seed: 42,
    });

    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);

    // Verify seed is incremented for each candidate
    const calls = mocks.mockCallStabilityAPI.mock.calls;
    expect(calls.length).toBe(3);

    // First call should have seed 42
    expect(calls[0][1].seed).toBe(42);
    // Second call should have seed 43
    expect(calls[1][1].seed).toBe(43);
    // Third call should have seed 44
    expect(calls[2][1].seed).toBe(44);
  });

  it('Test 12: Quality level affects steps parameter', async () => {
    mocks.mockCacheGet.mockResolvedValue(null);
    mocks.mockHasStabilityKey.mockReturnValue(true);

    const mockStabilityResponse = {
      success: true,
      data: { artifacts: [{ base64: 'stability-image-base64' }] },
    };

    mocks.mockCallStabilityAPI.mockResolvedValue(mockStabilityResponse);

    // Test with 'ultra' quality
    const req = createMockReq({
      imageBase64: 'image-base64',
      maskBase64: 'mask-base64',
      prompt: 'test prompt',
      strength: 0.8,
      qualityLevel: 'ultra',
      numCandidates: 1,
    });

    const { res, getStatus } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);

    // Verify steps is 50 for 'ultra'
    const callArgs = mocks.mockCallStabilityAPI.mock.calls[0];
    expect(callArgs[1].steps).toBe(50);
  });

  it('Test 13: Stability API failure returns warning', async () => {
    mocks.mockCacheGet.mockResolvedValue(null);
    mocks.mockHasStabilityKey.mockReturnValue(true);

    const mockError = new Error('API connection failed');

    mocks.mockCallStabilityAPI.mockRejectedValue(mockError);

    const req = createMockReq({
      imageBase64: 'image-base64',
      maskBase64: 'mask-base64',
      prompt: 'test prompt',
      strength: 0.8,
      qualityLevel: 'quality',
      numCandidates: 1,
    });

    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    const result = getBody().data;

    // Should fall back to empty candidates → original image
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0].score).toBe(0.0);

    // Should log warning
    expect(mocks.mockLogWarn).toHaveBeenCalledWith(
      'Stability inpaint candidate generation failed',
      expect.objectContaining({ error: mockError }),
    );
  });
});
