/**
 * GET /api/studio/admin/audit/export — Unit Tests
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

import handler from '@/pages/api/studio/admin/audit/export';

function createMockReqRes(method = 'GET', query: Record<string, string> = {}) {
  const req = {
    method,
    query,
    headers: {},
  } as unknown as NextApiRequest;

  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
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

describe('GET /api/studio/admin/audit/export', () => {
  it('returns CSV with correct headers', async () => {
    const { req, res } = createMockReqRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      expect.stringContaining('attachment; filename="audit-log-'),
    );

    const csvOutput = (res.send as any).mock.calls[0][0];
    const headerRow = csvOutput.split('\n')[0];
    expect(headerRow).toContain('id,timestamp,category,action,severity');
  });

  it('includes audit entries in CSV rows', async () => {
    mockQuery.mockResolvedValue({
      entries: [
        {
          id: 'audit_1',
          timestamp: 1700000000000,
          category: 'admin',
          action: 'admin.update.feature_flag',
          severity: 'info',
          actorId: 'admin-1',
          actorEmail: 'admin@example.com',
          actorIsAdmin: true,
          description: 'Updated flag',
          targetId: 'dark-mode',
          targetType: 'feature_flag',
          success: true,
        },
      ],
      hasMore: false,
    });

    const { req, res } = createMockReqRes();

    await handler(req, res);

    const csvOutput = (res.send as any).mock.calls[0][0];
    const lines = csvOutput.split('\n');
    expect(lines).toHaveLength(2); // header + 1 row
    expect(lines[1]).toContain('audit_1');
    expect(lines[1]).toContain('admin');
  });

  it('escapes CSV fields with commas', async () => {
    mockQuery.mockResolvedValue({
      entries: [
        {
          id: 'audit_2',
          timestamp: 1700000000000,
          category: 'content',
          action: 'content.moderate.post',
          severity: 'warning',
          actorId: 'admin-1',
          actorIsAdmin: true,
          description: 'Moderated post for reason: spam, abuse',
          success: true,
        },
      ],
      hasMore: false,
    });

    const { req, res } = createMockReqRes();

    await handler(req, res);

    const csvOutput = (res.send as any).mock.calls[0][0];
    // Description with comma should be quoted
    expect(csvOutput).toContain('"Moderated post for reason: spam, abuse"');
  });

  it('defaults limit to 1000', async () => {
    const { req, res } = createMockReqRes();

    await handler(req, res);

    expect(mockQuery).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 1000 }),
    );
  });

  it('caps limit at 5000', async () => {
    const { req, res } = createMockReqRes('GET', { limit: '99999' });

    await handler(req, res);

    expect(mockQuery).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 5000 }),
    );
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
});
