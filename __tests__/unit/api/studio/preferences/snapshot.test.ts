/**
 * Preference Snapshot Route Tests
 * Tests recording of preference events for drift tracking
 * @module __tests__/unit/api/studio/preferences/snapshot.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  mockRecordPreference: vi.fn(),
  capturedSchema: null as any,
  capturedOptions: null as any,
  capturedHandler: null as ((req: any, res: any) => Promise<void>) | null,
}));

vi.mock('@/lib/studio/services/ai/imageGeneration/preferenceDriftTracker', () => ({
  getPreferenceDriftTracker: vi.fn(() => ({
    recordPreference: mocks.mockRecordPreference,
  })),
}));

vi.mock('@/lib/studio/api/createApiHandler', () => ({
  createAuthenticatedRoute: vi.fn((schema: any, handler: any, options?: any) => {
    mocks.capturedSchema = schema;
    mocks.capturedOptions = options;
    mocks.capturedHandler = handler;
    return handler;
  }),
}));

vi.mock('@/lib/studio/services/serverLogger', () => ({
  serverLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// Import after mocking
import handler from '@/pages/api/studio/preferences/snapshot';

function createMockReq(bodyOrQuery = {}): any {
  return {
    validatedBody: { ...bodyOrQuery },
    query: { ...bodyOrQuery },
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
    status: vi.fn((code: number) => { statusCode = code; return res; }),
    json: vi.fn((body: any) => { responseBody = body; return res; }),
    setHeader: vi.fn().mockReturnThis(),
    end: vi.fn(),
  };
  return { res, getStatus: () => statusCode, getBody: () => responseBody };
}

describe('POST /api/studio/preferences/snapshot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 200 with recorded:true on success', async () => {
    const req = createMockReq({
      sessionId: 'session-1',
      comparisonId: 'comp-1',
      blindMode: true,
      selectedModel: 'model-a',
      selectedModelId: 'model-a-id',
      rejectedModel: 'model-b',
      rejectedModelId: 'model-b-id',
      sameProviderComparison: false,
      timeToDecideMs: 3000,
      hoverBiasTowardWinner: 0.7,
    });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    const body = getBody();
    expect(body.success).toBe(true);
    expect(body.data.recorded).toBe(true);
  });

  it('should call recordPreference with correct event structure', async () => {
    const req = createMockReq({
      sessionId: 'session-1',
      comparisonId: 'comp-1',
      blindMode: true,
      selectedModel: 'model-a',
      selectedModelId: 'model-a-id',
      rejectedModel: 'model-b',
      rejectedModelId: 'model-b-id',
      sameProviderComparison: false,
      parameterDiff: [{ field: 'quality', valueA: 'high', valueB: 'low' }],
      timeToDecideMs: 3000,
      hoverBiasTowardWinner: 0.7,
    });
    const { res } = createMockRes();

    await handler(req, res);

    expect(mocks.mockRecordPreference).toHaveBeenCalledOnce();
    const event = mocks.mockRecordPreference.mock.calls[0][0];
    expect(event.userId).toBe('test-user-123');
    expect(event.sessionId).toBe('session-1');
    expect(event.comparisonId).toBe('comp-1');
    expect(event.blindMode).toBe(true);
    expect(event.selectedModel).toBe('model-a');
    expect(event.rejectedModel).toBe('model-b');
    expect(event.sameProviderComparison).toBe(false);
  });

  it('should set userId from auth context', async () => {
    const req = createMockReq({
      sessionId: 'session-1',
      comparisonId: 'comp-1',
      blindMode: false,
      selectedModel: 'model-x',
      selectedModelId: 'model-x-id',
      rejectedModel: 'model-y',
      rejectedModelId: 'model-y-id',
      sameProviderComparison: true,
      timeToDecideMs: 2000,
      hoverBiasTowardWinner: 0.5,
    });
    req.uid = 'different-user';
    const { res } = createMockRes();

    await handler(req, res);

    const event = mocks.mockRecordPreference.mock.calls[0][0];
    expect(event.userId).toBe('different-user');
  });

  it('should set timestamp to current date', async () => {
    const req = createMockReq({
      sessionId: 'session-1',
      comparisonId: 'comp-1',
      blindMode: true,
      selectedModel: 'model-a',
      selectedModelId: 'model-a-id',
      rejectedModel: 'model-b',
      rejectedModelId: 'model-b-id',
      sameProviderComparison: false,
      timeToDecideMs: 3000,
      hoverBiasTowardWinner: 0.7,
    });
    const { res } = createMockRes();

    const beforeTime = new Date();
    await handler(req, res);
    const afterTime = new Date();

    const event = mocks.mockRecordPreference.mock.calls[0][0];
    expect(event.timestamp).toBeInstanceOf(Date);
    expect(event.timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    expect(event.timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
  });

  it('should have correct rate limit configuration', async () => {
    expect(mocks.capturedOptions).toBeDefined();
    expect(mocks.capturedOptions.rateLimit).toBeDefined();
    expect(mocks.capturedOptions.rateLimit.maxRequests).toBe(60);
    expect(mocks.capturedOptions.rateLimit.windowMs).toBe(60_000);
  });

  it('should handle errors gracefully', async () => {
    mocks.mockRecordPreference.mockImplementation(() => {
      throw new Error('Tracker error');
    });

    const req = createMockReq({
      sessionId: 'session-1',
      comparisonId: 'comp-1',
      blindMode: true,
      selectedModel: 'model-a',
      selectedModelId: 'model-a-id',
      rejectedModel: 'model-b',
      rejectedModelId: 'model-b-id',
      sameProviderComparison: false,
      timeToDecideMs: 3000,
      hoverBiasTowardWinner: 0.7,
    });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(500);
    const body = getBody();
    expect(body.success).toBe(false);
    expect(body.error).toBeDefined();
  });
});
