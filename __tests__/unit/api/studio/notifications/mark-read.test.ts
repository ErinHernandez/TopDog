/**
 * POST /api/studio/notifications/mark-read — Unit Tests
 *
 * @phase 37
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';

// ─── Mocks ──────────────────────────────────────────────────────────────────

const mockMarkRead = vi.fn().mockResolvedValue(undefined);
const mockMarkAllRead = vi.fn().mockResolvedValue(undefined);

vi.mock('@/lib/studio/community/notifications', () => ({
  NotificationService: {
    markRead: (...args: unknown[]) => mockMarkRead(...args),
    markAllRead: (...args: unknown[]) => mockMarkAllRead(...args),
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

import handler from '@/pages/api/studio/notifications/mark-read';

function createMockReqRes(method = 'POST', body: unknown = {}) {
  const req = {
    method,
    body,
  } as unknown as NextApiRequest;

  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    setHeader: vi.fn().mockReturnThis(),
  } as unknown as NextApiResponse;

  return { req, res };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/studio/notifications/mark-read', () => {
  it('marks a single notification as read', async () => {
    const { req, res } = createMockReqRes('POST', { notificationId: 'notif-1' });

    await handler(req, res);

    expect(mockMarkRead).toHaveBeenCalledWith('notif-1');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('marks all notifications as read', async () => {
    const { req, res } = createMockReqRes('POST', { all: true });

    await handler(req, res);

    expect(mockMarkAllRead).toHaveBeenCalledWith('test-user-123');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 400 when body is empty', async () => {
    const { req, res } = createMockReqRes('POST', {});

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('rejects non-POST methods', async () => {
    const { req, res } = createMockReqRes('GET');

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
  });
});
