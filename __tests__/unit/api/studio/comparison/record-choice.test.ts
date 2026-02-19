/**
 * A/B Comparison Record Choice API Route Tests
 * 
 * Tests the record choice endpoint which:
 * - Records user's preference choice (a, b, or tie)
 * - Logs the choice with telemetry
 * - Records preference in drift tracker if blind mode enabled
 * - Does NOT record if blind mode is disabled
 * - Has rate limiting (30 req/60s)
 * 
 * @module __tests__/unit/api/studio/comparison/record-choice
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { ApiResponse } from '@/lib/studio/types/api';

// ============================================================================
// MOCKS — hoisted so they work with vi.mock()
// ============================================================================

const mocks = vi.hoisted(() => ({
  mockRecordPreference: vi.fn(),
  mockLogInfo: vi.fn(),
  mockLogError: vi.fn(),
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
  serverLogger: {
    info: mocks.mockLogInfo,
    warn: vi.fn(),
    error: mocks.mockLogError,
    debug: vi.fn(),
  },
}));

// ============================================================================
// IMPORTS (after mocks)
// ============================================================================

import handler from '@/pages/api/studio/comparison/record-choice';

// ============================================================================
// HELPERS
// ============================================================================

function createMockReq(body: Record<string, unknown> = {}): any {
  return {
    validatedBody: {
      comparisonId: 'comp-test-123',
      winner: 'a',
      timeToDecideMs: 5000,
      blindMode: false,
      hoverPatterns: [
        {
          modelKey: 'a',
          hoverStartMs: 100,
          hoverDurationMs: 2000,
          region: 'full',
        },
      ],
      ...body,
    },
    query: {},
    uid: 'test-user-123',
    requestId: 'req-test-123',
    method: 'POST',
    headers: {},
  };
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

// ============================================================================
// TESTS
// ============================================================================

describe('POST /api/studio/comparison/record-choice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return recorded:true', async () => {
    const { res, getStatus, getBody } = createMockRes();
    const req = createMockReq();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    const body = getBody();
    expect(body.success).toBe(true);
    expect(body.data.recorded).toBe(true);
    expect(body.data.comparisonId).toBe('comp-test-123');
  });

  it('should log the choice', async () => {
    const { res } = createMockRes();
    const req = createMockReq();

    await handler(req, res);

    expect(mocks.mockLogInfo).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'comparison_choice_recorded',
        comparisonId: 'comp-test-123',
        winner: 'a',
        timeToDecideMs: 5000,
      })
    );
  });

  it('should record preference when blindMode is true', async () => {
    const { res } = createMockRes();
    const req = createMockReq({ blindMode: true });

    await handler(req, res);

    expect(mocks.mockRecordPreference).toHaveBeenCalledWith(
      expect.objectContaining({
        blindMode: true,
        comparisonId: 'comp-test-123',
        timeToDecideMs: 5000,
      })
    );
  });

  it('should NOT record preference when blindMode is false', async () => {
    const { res } = createMockRes();
    const req = createMockReq({ blindMode: false });

    await handler(req, res);

    expect(mocks.mockRecordPreference).not.toHaveBeenCalled();
  });

  it('should include hover patterns count in log', async () => {
    const { res } = createMockRes();
    const req = createMockReq({
      hoverPatterns: [
        { modelKey: 'a', hoverStartMs: 0, hoverDurationMs: 1000 },
        { modelKey: 'b', hoverStartMs: 1000, hoverDurationMs: 500 },
      ],
    });

    await handler(req, res);

    expect(mocks.mockLogInfo).toHaveBeenCalledWith(
      expect.objectContaining({
        hoverPatternCount: 2,
      })
    );
  });

  it('should handle no hover patterns', async () => {
    const { res } = createMockRes();
    const req = createMockReq({ hoverPatterns: undefined });

    await handler(req, res);

    expect(mocks.mockLogInfo).toHaveBeenCalledWith(
      expect.objectContaining({
        hoverPatternCount: 0,
      })
    );
  });

  it('should have rate limit config (30 req/60s)', () => {
    expect(mocks.capturedOptions).toBeDefined();
    expect(mocks.capturedOptions.rateLimit).toBeDefined();
    expect(mocks.capturedOptions.rateLimit.maxRequests).toBe(30);
    expect(mocks.capturedOptions.rateLimit.windowMs).toBe(60000);
  });

  it('should handle errors and log them', async () => {
    const { res, getStatus, getBody } = createMockRes();
    const req = createMockReq();

    // Simulate an error
    req.validatedBody = null;

    await handler(req, res);

    expect(getStatus()).toBe(500);
    const body = getBody();
    expect(body.success).toBe(false);
    expect(body.error).toBeDefined();

    expect(mocks.mockLogError).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'comparison_record_choice_error',
      })
    );
  });

  it('should record preference in drift tracker when blind mode enabled', async () => {
    const { res } = createMockRes();
    const req = createMockReq({ blindMode: true });

    await handler(req, res);

    expect(mocks.mockLogInfo).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'preference_recorded_in_drift_tracker',
      })
    );
  });
});
