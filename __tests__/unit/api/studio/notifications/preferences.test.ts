/**
 * GET/PUT /api/studio/notifications/preferences — Unit Tests
 *
 * @phase 37
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';

// ─── Mocks ──────────────────────────────────────────────────────────────────

const mockGetPreferences = vi.fn();
const mockUpdatePreferences = vi.fn();

vi.mock('@/lib/studio/community/notifications', () => ({
  NotificationService: {
    getPreferences: (...args: unknown[]) => mockGetPreferences(...args),
    updatePreferences: (...args: unknown[]) => mockUpdatePreferences(...args),
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

import handler from '@/pages/api/studio/notifications/preferences';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '@/lib/studio/community/notifications/types';

function createMockReqRes(method = 'GET', body: unknown = {}) {
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
  mockGetPreferences.mockResolvedValue(DEFAULT_NOTIFICATION_PREFERENCES);
  mockUpdatePreferences.mockResolvedValue(DEFAULT_NOTIFICATION_PREFERENCES);
});

describe('GET /api/studio/notifications/preferences', () => {
  it('returns 200 with user preferences', async () => {
    const { req, res } = createMockReqRes('GET');

    await handler(req, res);

    expect(mockGetPreferences).toHaveBeenCalledWith('test-user-123');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(DEFAULT_NOTIFICATION_PREFERENCES);
  });
});

describe('PUT /api/studio/notifications/preferences', () => {
  it('updates preferences and returns merged result', async () => {
    const updates = { enabled: false };
    const merged = { ...DEFAULT_NOTIFICATION_PREFERENCES, enabled: false };
    mockUpdatePreferences.mockResolvedValueOnce(merged);

    const { req, res } = createMockReqRes('PUT', updates);

    await handler(req, res);

    expect(mockUpdatePreferences).toHaveBeenCalledWith('test-user-123', updates);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(merged);
  });

  it('returns 400 when body is not an object', async () => {
    const { req, res } = createMockReqRes('PUT', null);

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when body is a string', async () => {
    const { req, res } = createMockReqRes('PUT', 'invalid');

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('Unsupported methods', () => {
  it('returns 405 for POST', async () => {
    const { req, res } = createMockReqRes('POST');

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
  });

  it('returns 405 for DELETE', async () => {
    const { req, res } = createMockReqRes('DELETE');

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
  });
});
