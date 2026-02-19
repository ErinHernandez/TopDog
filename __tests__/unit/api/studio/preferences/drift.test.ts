/**
 * Preference Drift Route Tests
 * Tests computation of preference drift between blind and sighted modes
 * @module __tests__/unit/api/studio/preferences/drift.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  mockComputeUserDrift: vi.fn(),
  capturedSchema: null as any,
  capturedOptions: null as any,
  capturedHandler: null as ((req: any, res: any) => Promise<void>) | null,
}));

vi.mock('@/lib/studio/services/ai/imageGeneration/preferenceDriftTracker', () => ({
  getPreferenceDriftTracker: vi.fn(() => ({
    computeUserDrift: mocks.mockComputeUserDrift,
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
import handler from '@/pages/api/studio/preferences/drift';

function createMockReq(query = {}): any {
  return {
    query,
    uid: 'test-user-123',
    requestId: 'req-123',
    method: 'GET',
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

describe('GET /api/studio/preferences/drift', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockComputeUserDrift.mockReturnValue({
      userId: 'test-user-123',
      periodStart: new Date(),
      periodEnd: new Date(),
      blindModeComparisons: 15,
      sightedModeComparisons: 12,
      blindModeWinRates: { 'model-a': { wins: 8, total: 15, winRate: 0.53 } },
      sightedModeWinRates: { 'model-a': { wins: 5, total: 12, winRate: 0.42 } },
      driftScores: { 'model-a': 0.11 },
      overallDrift: 0.11,
      statisticallySignificant: true,
      sampleThreshold: 10,
    });
  });

  it('should return drift record on success', async () => {
    const req = createMockReq({});
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    const body = getBody();
    expect(body.success).toBe(true);
    expect(body.data.overallDrift).toBe(0.11);
    expect(body.data.statisticallySignificant).toBe(true);
  });

  it('should use default 30-day window when period not specified', async () => {
    const req = createMockReq({});
    const { res } = createMockRes();

    const beforeCall = new Date();
    await handler(req, res);
    const afterCall = new Date();

    expect(mocks.mockComputeUserDrift).toHaveBeenCalledOnce();
    const args = mocks.mockComputeUserDrift.mock.calls[0];

    // First arg: userId
    expect(args[0]).toBe('test-user-123');
    // Second arg: periodStart should be ~30 days ago
    const periodStart = args[1] as Date;
    expect(periodStart).toBeInstanceOf(Date);
    const diff = afterCall.getTime() - periodStart.getTime();
    const days = diff / (1000 * 60 * 60 * 24);
    expect(days).toBeCloseTo(30, 1);
    // Third arg: periodEnd should be now
    const periodEnd = args[2] as Date;
    expect(periodEnd.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
    expect(periodEnd.getTime()).toBeLessThanOrEqual(afterCall.getTime());
  });

  it('should pass custom period if specified', async () => {
    const customStart = new Date('2025-01-01');
    const customEnd = new Date('2025-02-01');

    const req = createMockReq({
      periodStart: customStart.toISOString(),
      periodEnd: customEnd.toISOString(),
    });
    const { res } = createMockRes();

    await handler(req, res);

    expect(mocks.mockComputeUserDrift).toHaveBeenCalledOnce();
    const args = mocks.mockComputeUserDrift.mock.calls[0];
    expect(args[1]).toEqual(customStart);
    expect(args[2]).toEqual(customEnd);
  });

  it('should pass sampleThreshold when provided', async () => {
    const req = createMockReq({ sampleThreshold: '25' });
    const { res } = createMockRes();

    await handler(req, res);

    expect(mocks.mockComputeUserDrift).toHaveBeenCalledOnce();
    const args = mocks.mockComputeUserDrift.mock.calls[0];
    expect(args[3]).toBe(25);
  });

  it('should not pass sampleThreshold if not provided', async () => {
    const req = createMockReq({});
    const { res } = createMockRes();

    await handler(req, res);

    expect(mocks.mockComputeUserDrift).toHaveBeenCalledOnce();
    const args = mocks.mockComputeUserDrift.mock.calls[0];
    expect(args[3]).toBeUndefined();
  });

  it('should have correct rate limit configuration', () => {
    expect(mocks.capturedOptions).toBeDefined();
    expect(mocks.capturedOptions.rateLimit).toBeDefined();
    expect(mocks.capturedOptions.rateLimit.maxRequests).toBe(30);
    expect(mocks.capturedOptions.rateLimit.windowMs).toBe(60_000);
  });

  it('should handle errors gracefully', async () => {
    mocks.mockComputeUserDrift.mockImplementation(() => {
      throw new Error('Computation error');
    });

    const req = createMockReq({});
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(500);
    const body = getBody();
    expect(body.success).toBe(false);
    expect(body.error).toBeDefined();
  });

  it('should include user ID in drift record', async () => {
    mocks.mockComputeUserDrift.mockReturnValue({
      userId: 'custom-user-456',
      periodStart: new Date(),
      periodEnd: new Date(),
      blindModeComparisons: 15,
      sightedModeComparisons: 12,
      blindModeWinRates: { 'model-a': { wins: 8, total: 15, winRate: 0.53 } },
      sightedModeWinRates: { 'model-a': { wins: 5, total: 12, winRate: 0.42 } },
      driftScores: { 'model-a': 0.11 },
      overallDrift: 0.11,
      statisticallySignificant: true,
      sampleThreshold: 10,
    });

    const req = createMockReq({});
    req.uid = 'custom-user-456';
    const { res, getBody } = createMockRes();

    await handler(req, res);

    const body = getBody();
    expect(body.data.userId).toBe('custom-user-456');
  });
});
