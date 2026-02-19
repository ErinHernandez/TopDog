/**
 * GET /api/studio/admin/audit/summary — Unit Tests
 *
 * @phase 38
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';

// ─── Mocks ──────────────────────────────────────────────────────────────────

const mockGetSummary = vi.fn();

vi.mock('@/lib/studio/audit/auditService', () => ({
  AuditService: {
    getSummary: (...args: unknown[]) => mockGetSummary(...args),
  },
}));

const mockVerifyAdminToken = vi.fn();

vi.mock('@/lib/studio/telemetry/marketplace/adminAuth', () => ({
  verifyAdminToken: (...args: unknown[]) => mockVerifyAdminToken(...args),
}));

vi.mock('@/lib/studio/api/wrapRoute', () => ({
  wrapProtectedRoute: (handler: Function) => handler,
}));

// ─── Import handler after mocks ─────────────────────────────────────────────

import handler from '@/pages/api/studio/admin/audit/summary';

function createMockReqRes(method = 'GET', query: Record<string, string> = {}) {
  const req = {
    method,
    query,
    headers: {},
  } as unknown as NextApiRequest;

  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    setHeader: vi.fn().mockReturnThis(),
  } as unknown as NextApiResponse;

  return { req, res };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockVerifyAdminToken.mockResolvedValue({ authenticated: true, uid: 'admin-1' });
  mockGetSummary.mockResolvedValue({
    total: 100,
    byCategory: { admin: 40, auth: 30, content: 30 },
    bySeverity: { info: 80, warning: 15, critical: 5 },
    failedCount: 3,
  });
});

describe('GET /api/studio/admin/audit/summary', () => {
  it('returns 200 with summary data', async () => {
    const { req, res } = createMockReqRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        total: 100,
        byCategory: expect.any(Object),
        bySeverity: expect.any(Object),
        failedCount: 3,
        timeRange: expect.any(Object),
        requestId: expect.any(String),
      }),
    );
  });

  it('defaults time range to last 24 hours', async () => {
    const { req, res } = createMockReqRes();
    const now = Date.now();

    await handler(req, res);

    const [startTime, endTime] = mockGetSummary.mock.calls[0];
    expect(endTime).toBeGreaterThanOrEqual(now - 100);
    expect(startTime).toBeLessThan(endTime);
    expect(endTime - startTime).toBeGreaterThanOrEqual(23 * 60 * 60 * 1000);
  });

  it('accepts custom time range', async () => {
    const start = String(Date.now() - 7 * 86400000);
    const end = String(Date.now());
    const { req, res } = createMockReqRes('GET', {
      startTime: start,
      endTime: end,
    });

    await handler(req, res);

    expect(mockGetSummary).toHaveBeenCalledWith(Number(start), Number(end));
  });

  it('rejects non-GET methods', async () => {
    const { req, res } = createMockReqRes('POST');

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
  });

  it('returns 401 for unauthenticated requests', async () => {
    mockVerifyAdminToken.mockResolvedValue({
      authenticated: false,
      error: 'No token',
    });

    const { req, res } = createMockReqRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 400 for invalid startTime', async () => {
    const { req, res } = createMockReqRes('GET', { startTime: 'garbage' });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});
