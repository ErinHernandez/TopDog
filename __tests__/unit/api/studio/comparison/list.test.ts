/**
 * A/B Comparison List API Route Tests
 * 
 * Tests the comparison listing endpoint which:
 * - Queries Firestore user_comparisons collection
 * - Supports pagination with limit/offset
 * - Returns comparisons sorted by createdAt descending
 * - Has rate limiting (60 req/60s)
 * 
 * @module __tests__/unit/api/studio/comparison/list
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { ApiResponse } from '@/lib/studio/types/api';

// ============================================================================
// MOCKS — hoisted so they work with vi.mock()
// ============================================================================

const mocks = vi.hoisted(() => ({
  mockLogInfo: vi.fn(),
  mockLogError: vi.fn(),
  capturedSchema: null as any,
  capturedOptions: null as any,
  capturedHandler: null as ((req: any, res: any) => Promise<void>) | null,
  mockGetAdminDb: vi.fn(),
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

vi.mock('@/lib/firebase/server', () => ({
  getAdminDb: mocks.mockGetAdminDb,
}));

// ============================================================================
// IMPORTS (after mocks)
// ============================================================================

import handler from '@/pages/api/studio/comparison/list';

// ============================================================================
// HELPERS
// ============================================================================

function createMockReq(body: Record<string, unknown> = {}): any {
  return {
    validatedBody: {
      limit: 20,
      offset: 0,
      ...body,
    },
    query: {},
    uid: 'test-user-123',
    requestId: 'req-test-123',
    method: 'GET',
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

/**
 * Creates a mock Firestore instance with collection/where/orderBy/offset/limit/get support
 */
function createMockFirestore(comparisons: any[] = []) {
  const mockQueryBuilder = {
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    get: vi.fn().mockResolvedValue({
      docs: comparisons.map((comp) => ({
        id: comp.id,
        data: () => comp,
      })),
    }),
    count: vi.fn().mockReturnValue({
      get: vi.fn().mockResolvedValue({
        data: () => ({ count: comparisons.length }),
      }),
    }),
  };

  const mockCollection = vi.fn().mockReturnValue(mockQueryBuilder);

  return {
    collection: mockCollection,
  };
}

// ============================================================================
// TESTS
// ============================================================================

describe('GET /api/studio/comparison/list', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty comparisons list', async () => {
    const mockDb = createMockFirestore([]);
    mocks.mockGetAdminDb.mockReturnValue(mockDb);

    const { res, getStatus, getBody } = createMockRes();
    const req = createMockReq();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    const body = getBody();
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(body.data.comparisons).toEqual([]);
    expect(body.data.total).toBe(0);
  });

  it('should log comparisons list retrieved with correct params', async () => {
    const mockDb = createMockFirestore([]);
    mocks.mockGetAdminDb.mockReturnValue(mockDb);

    const { res } = createMockRes();
    const req = createMockReq();

    await handler(req, res);

    expect(mocks.mockLogInfo).toHaveBeenCalledWith(
      'Comparisons list retrieved',
      expect.objectContaining({
        userId: 'test-user-123',
        count: 0,
        total: 0,
        offset: 0,
        limit: 20,
      }),
    );
  });

  it('should return comparisons with pagination', async () => {
    const mockComparisons = [
      {
        id: 'comp-1',
        imageAUrl: 'url-a-1',
        imageBUrl: 'url-b-1',
        modelA: { id: 'model-a-1', name: 'Model A', provider: 'openai' },
        modelB: { id: 'model-b-1', name: 'Model B', provider: 'anthropic' },
        prompt: 'Test prompt 1',
        winnerId: 'model-a-1',
        createdAt: new Date('2024-01-01T10:00:00Z'),
      },
      {
        id: 'comp-2',
        imageAUrl: 'url-a-2',
        imageBUrl: 'url-b-2',
        modelA: { id: 'model-a-2', name: 'Model C', provider: 'openai' },
        modelB: { id: 'model-b-2', name: 'Model D', provider: 'anthropic' },
        prompt: 'Test prompt 2',
        createdAt: new Date('2024-01-02T10:00:00Z'),
      },
    ];

    const mockDb = createMockFirestore(mockComparisons);
    mocks.mockGetAdminDb.mockReturnValue(mockDb);

    const { res, getStatus, getBody } = createMockRes();
    const req = createMockReq({ limit: 10, offset: 5 });

    await handler(req, res);

    expect(getStatus()).toBe(200);
    const body = getBody();
    expect(body.success).toBe(true);
    expect(body.data.comparisons).toHaveLength(2);
    expect(body.data.total).toBe(2);
    expect(body.data.comparisons[0].id).toBe('comp-1');
    expect(body.data.comparisons[1].id).toBe('comp-2');

    // Verify pagination was applied
    expect(mocks.mockLogInfo).toHaveBeenCalledWith(
      'Comparisons list retrieved',
      expect.objectContaining({
        count: 2,
        total: 2,
        offset: 5,
        limit: 10,
      }),
    );
  });

  it('should have rate limit config (60 req/60s)', () => {
    expect(mocks.capturedOptions).toBeDefined();
    expect(mocks.capturedOptions.rateLimit).toBeDefined();
    expect(mocks.capturedOptions.rateLimit.maxRequests).toBe(60);
    expect(mocks.capturedOptions.rateLimit.windowMs).toBe(60000);
  });

  it('should handle Firestore errors gracefully', async () => {
    mocks.mockGetAdminDb.mockImplementation(() => {
      throw new Error('Firestore connection failed');
    });

    const { res, getStatus, getBody } = createMockRes();
    const req = createMockReq();

    await handler(req, res);

    expect(getStatus()).toBe(500);
    const body = getBody();
    expect(body.success).toBe(false);
    expect(body.error).toBeDefined();
    expect(mocks.mockLogError).toHaveBeenCalled();
  });

  it('should query Firestore with userId filter', async () => {
    const mockDb = createMockFirestore([]);
    mocks.mockGetAdminDb.mockReturnValue(mockDb);

    const { res } = createMockRes();
    const req = createMockReq();

    await handler(req, res);

    // Verify collection was accessed
    expect(mockDb.collection).toHaveBeenCalledWith('user_comparisons');

    // Verify where filter was applied with userId
    const calls = mockDb.collection('user_comparisons').where.mock.calls;
    expect(calls.some((call) => call[0] === 'userId' && call[1] === '==' && call[2] === 'test-user-123')).toBe(true);
  });

  it('should handle missing comparison fields with defaults', async () => {
    const mockComparisons = [
      {
        id: 'comp-minimal',
        // Missing many fields - should use defaults
        createdAt: new Date('2024-01-01T10:00:00Z'),
      },
    ];

    const mockDb = createMockFirestore(mockComparisons);
    mocks.mockGetAdminDb.mockReturnValue(mockDb);

    const { res, getStatus, getBody } = createMockRes();
    const req = createMockReq();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    const body = getBody();
    expect(body.data.comparisons[0]).toEqual(
      expect.objectContaining({
        id: 'comp-minimal',
        imageAUrl: '',
        imageBUrl: '',
        modelA: { id: '', name: '', provider: '' },
        modelB: { id: '', name: '', provider: '' },
        prompt: '',
      }),
    );
  });
});
