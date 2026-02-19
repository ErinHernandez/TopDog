/**
 * GET /api/studio/admin/audit/list — Unit Tests
 *
 * @phase 38
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';

// ─── Mocks ──────────────────────────────────────────────────────────────────

const mockQuery = vi.fn();

vi.mock('@/lib/studio/audit/auditService', () => ({
  AuditService: {
    query: (...args: unknown[]) => mockQuery(...args),
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

import handler from '@/pages/api/studio/admin/audit/list';

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
  mockQuery.mockResolvedValue({ entries: [], hasMore: false });
});

describe('GET /api/studio/admin/audit/list', () => {
  it('returns 200 with audit entries', async () => {
    const { req, res } = createMockReqRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it('rejects non-GET methods', async () => {
    const { req, res } = createMockReqRes('POST');

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
  });

  it('returns 401 for unauthenticated requests', async () => {
    mockVerifyAdminToken.mockResolvedValue({
      authenticated: false,
      error: 'No token provided',
    });

    const { req, res } = createMockReqRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 403 for non-admin users', async () => {
    mockVerifyAdminToken.mockResolvedValue({
      authenticated: false,
      error: 'User is not an admin',
    });

    const { req, res } = createMockReqRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('passes category filter', async () => {
    const { req, res } = createMockReqRes('GET', { category: 'admin' });

    await handler(req, res);

    expect(mockQuery).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'admin' }),
    );
  });

  it('rejects invalid category', async () => {
    const { req, res } = createMockReqRes('GET', { category: 'invalid' });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('passes severity filter', async () => {
    const { req, res } = createMockReqRes('GET', { severity: 'critical' });

    await handler(req, res);

    expect(mockQuery).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'critical' }),
    );
  });

  it('rejects invalid severity', async () => {
    const { req, res } = createMockReqRes('GET', { severity: 'extreme' });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('passes actorId and targetId filters', async () => {
    const { req, res } = createMockReqRes('GET', {
      actorId: 'user-1',
      targetId: 'post-1',
    });

    await handler(req, res);

    expect(mockQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: 'user-1',
        targetId: 'post-1',
      }),
    );
  });

  it('passes failedOnly filter', async () => {
    const { req, res } = createMockReqRes('GET', { failedOnly: 'true' });

    await handler(req, res);

    expect(mockQuery).toHaveBeenCalledWith(
      expect.objectContaining({ failedOnly: true }),
    );
  });

  it('caps limit at 200', async () => {
    const { req, res } = createMockReqRes('GET', { limit: '999' });

    await handler(req, res);

    expect(mockQuery).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 200 }),
    );
  });

  it('parses startTime as epoch ms', async () => {
    const ts = String(Date.now() - 86400000);
    const { req, res } = createMockReqRes('GET', { startTime: ts });

    await handler(req, res);

    expect(mockQuery).toHaveBeenCalledWith(
      expect.objectContaining({ startTime: Number(ts) }),
    );
  });

  it('parses startTime as ISO date', async () => {
    const { req, res } = createMockReqRes('GET', { startTime: '2025-01-01' });

    await handler(req, res);

    expect(mockQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        startTime: new Date('2025-01-01').getTime(),
      }),
    );
  });

  it('returns 400 for invalid startTime', async () => {
    const { req, res } = createMockReqRes('GET', { startTime: 'not-a-date' });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});
