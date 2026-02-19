/**
 * GET /api/studio/notifications/list — Unit Tests
 *
 * @phase 37
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';

// ─── Mocks ──────────────────────────────────────────────────────────────────

const mockQuery = vi.fn();

vi.mock('@/lib/studio/community/notifications', () => ({
  NotificationService: {
    query: (...args: unknown[]) => mockQuery(...args),
  },
}));

vi.mock('@/lib/studio/middleware/withAuth', () => ({
  withAuth: (handler: Function) => {
    return (req: NextApiRequest, res: NextApiResponse) => {
      (req as any).uid = 'test-user-123';
      return handler(req, res);
    };
  },
}));

vi.mock('@/lib/studio/api/wrapRoute', () => ({
  wrapProtectedRoute: (handler: Function) => handler,
}));

// ─── Import handler after mocks ─────────────────────────────────────────────

import handler from '@/pages/api/studio/notifications/list';

function createMockReqRes(method = 'GET', query: Record<string, string> = {}) {
  const req = {
    method,
    query,
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
  mockQuery.mockResolvedValue({
    notifications: [],
    unreadCount: 0,
    hasMore: false,
  });
});

describe('GET /api/studio/notifications/list', () => {
  it('returns 200 with notification list', async () => {
    const { req, res } = createMockReqRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'test-user-123' }),
    );
  });

  it('passes type filter when provided', async () => {
    const { req, res } = createMockReqRes('GET', { type: 'like' });

    await handler(req, res);

    expect(mockQuery).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'like' }),
    );
  });

  it('passes limit when provided', async () => {
    const { req, res } = createMockReqRes('GET', { limit: '10' });

    await handler(req, res);

    expect(mockQuery).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 10 }),
    );
  });

  it('caps limit at 100', async () => {
    const { req, res } = createMockReqRes('GET', { limit: '500' });

    await handler(req, res);

    expect(mockQuery).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 100 }),
    );
  });

  it('ignores invalid type values and returns unfiltered results', async () => {
    const { req, res } = createMockReqRes('GET', { type: 'invalid' });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.objectContaining({ type: undefined }),
    );
  });

  it('rejects non-GET methods', async () => {
    const { req, res } = createMockReqRes('POST');

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
  });
});
