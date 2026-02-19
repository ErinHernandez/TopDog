/**
 * History List Route Tests
 * Tests retrieval of generation history with filtering and search
 * @module __tests__/unit/api/studio/history/list.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => {
  const mockGetAllGenerations = vi.fn();
  const mockSearchHistory = vi.fn();
  const mockHistoryServiceCtor = vi.fn(function() {
    return {
      getAllGenerations: mockGetAllGenerations,
      searchHistory: mockSearchHistory,
    };
  });
  return {
    mockGetAllGenerations,
    mockSearchHistory,
    mockHistoryServiceCtor,
    capturedSchema: null as any,
    capturedOptions: null as any,
    capturedHandler: null as ((req: any, res: any) => Promise<void>) | null,
  };
});

const mockEntry = {
  id: 'entry-1',
  generationResult: {
    id: 'gen-1',
    imageUrl: 'http://example.com/img.png',
    prompt: 'a beautiful landscape',
    model: { id: 'model-1', name: 'Model A' },
    aspectRatio: '16:9' as const,
    width: 1024,
    height: 576,
    createdAt: new Date(),
    timeTakenMs: 5000,
    provider: 'openai' as const,
  },
  favorited: false,
  tags: [],
  createdAt: new Date(),
  userId: 'test-user-123',
};

vi.mock('@/lib/studio/services/ai/imageGeneration/historyService', () => ({
  GenerationHistoryService: mocks.mockHistoryServiceCtor,
}));

vi.mock('@/lib/firebase/server', () => ({
  getAdminDb: vi.fn(() => ({})),
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
import handler from '@/pages/api/studio/history/list';

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

describe('GET /api/studio/history/list', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockGetAllGenerations.mockResolvedValue([mockEntry]);
    mocks.mockSearchHistory.mockResolvedValue([mockEntry]);
  });

  it('should return entries list with total count', async () => {
    const req = createMockReq({});
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    const body = getBody();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data.entries)).toBe(true);
    expect(typeof body.data.total).toBe('number');
  });

  it('should use searchHistory when search filters are present', async () => {
    const req = createMockReq({ searchPrompt: 'landscape' });
    const { res } = createMockRes();

    await handler(req, res);

    expect(mocks.mockSearchHistory).toHaveBeenCalled();
    expect(mocks.mockGetAllGenerations).not.toHaveBeenCalled();
  });

  it('should use getAllGenerations when no filters are present', async () => {
    const req = createMockReq({});
    const { res } = createMockRes();

    await handler(req, res);

    expect(mocks.mockGetAllGenerations).toHaveBeenCalled();
    expect(mocks.mockSearchHistory).not.toHaveBeenCalled();
  });

  it('should use getAllGenerations with default limit of 50', async () => {
    const req = createMockReq({});
    const { res } = createMockRes();

    await handler(req, res);

    expect(mocks.mockGetAllGenerations).toHaveBeenCalledWith(50);
  });

  it('should pass custom limit to getAllGenerations', async () => {
    const req = createMockReq({ limit: '100' });
    const { res } = createMockRes();

    await handler(req, res);

    expect(mocks.mockGetAllGenerations).toHaveBeenCalledWith(100);
  });

  it('should pass filter to searchHistory when filters present', async () => {
    const req = createMockReq({
      searchPrompt: 'test',
      favorited: 'true',
      tags: 'nature',
    });
    const { res } = createMockRes();

    await handler(req, res);

    expect(mocks.mockSearchHistory).toHaveBeenCalledOnce();
    const args = mocks.mockSearchHistory.mock.calls[0];
    const filter = args[0];
    expect(filter.searchPrompt).toBe('test');
    expect(filter.favorited).toBe('true');
  });

  it('should apply offset for pagination', async () => {
    const entries = Array(10).fill(mockEntry);
    mocks.mockGetAllGenerations.mockResolvedValue(entries);

    const req = createMockReq({ offset: '5', limit: '3' });
    const { res, getBody } = createMockRes();

    await handler(req, res);

    const body = getBody();
    expect(body.data.entries.length).toBeLessThanOrEqual(3);
  });

  it('should handle date range filters', async () => {
    const req = createMockReq({
      dateFrom: '2025-01-01',
      dateTo: '2025-02-01',
    });
    const { res } = createMockRes();

    await handler(req, res);

    expect(mocks.mockSearchHistory).toHaveBeenCalled();
    const filter = mocks.mockSearchHistory.mock.calls[0][0];
    expect(filter.dateRange).toBeDefined();
    expect(filter.dateRange.from).toEqual(new Date('2025-01-01'));
    expect(filter.dateRange.to).toEqual(new Date('2025-02-01'));
  });

  it('should have correct rate limit configuration', () => {
    expect(mocks.capturedOptions).toBeDefined();
    expect(mocks.capturedOptions.rateLimit).toBeDefined();
    expect(mocks.capturedOptions.rateLimit.maxRequests).toBe(120);
    expect(mocks.capturedOptions.rateLimit.windowMs).toBe(60_000);
  });

  it('should handle errors gracefully', async () => {
    mocks.mockGetAllGenerations.mockRejectedValue(new Error('DB error'));

    const req = createMockReq({});
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(500);
    const body = getBody();
    expect(body.success).toBe(false);
    expect(body.error).toBeDefined();
  });

  it('should return total count accurately', async () => {
    const entries = Array(25).fill(mockEntry);
    mocks.mockGetAllGenerations.mockResolvedValue(entries);

    const req = createMockReq({ limit: '10' });
    const { res, getBody } = createMockRes();

    await handler(req, res);

    const body = getBody();
    expect(body.data.total).toBe(25);
    expect(body.data.entries.length).toBeLessThanOrEqual(10);
  });
});
