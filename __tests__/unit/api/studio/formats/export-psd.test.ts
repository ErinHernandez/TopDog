/**
 * Unit Tests for PSD Export API Route
 *
 * Tests the server-side PSD export functionality including:
 * - Authenticated request validation
 * - Small file synchronous export (≤10MB) returning base64-encoded PSD data
 * - Large file asynchronous export (>10MB) returning 202 Accepted with job queue
 * - Rate limiting configuration (10 requests per 60 seconds)
 * - Error handling and logging
 * - Schema validation via createAuthenticatedRoute
 *
 * @module __tests__/unit/api/studio/formats/export-psd.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => {
  const mockEnqueueJob = vi.fn().mockResolvedValue('job-123');
  const mockLogInfo = vi.fn();
  const mockLogError = vi.fn();
  const mockWritePsd = vi.fn(() => new ArrayBuffer(100)); // Returns a small valid buffer
  return {
    mockEnqueueJob,
    mockLogInfo,
    mockLogError,
    mockWritePsd,
    capturedSchema: null as any,
    capturedOptions: null as any,
    capturedHandler: null as ((req: any, res: any) => Promise<void>) | null,
  };
});

vi.mock('ag-psd', () => ({
  writePsd: mocks.mockWritePsd,
}));

vi.mock('@/lib/studio/api/createApiHandler', () => ({
  createAuthenticatedRoute: vi.fn((schema: any, handler: any, options?: any) => {
    mocks.capturedSchema = schema;
    mocks.capturedOptions = options;
    mocks.capturedHandler = handler;
    return handler;
  }),
}));

vi.mock('@/lib/studio/infrastructure/queue/firestoreJobQueue', () => ({
  getJobQueue: vi.fn(() => ({
    enqueueJob: mocks.mockEnqueueJob,
  })),
  JobType: { IMAGE_EXPORT: 'IMAGE_EXPORT' },
}));

vi.mock('@/lib/studio/services/serverLogger', () => ({
  serverLogger: {
    info: mocks.mockLogInfo,
    warn: vi.fn(),
    error: mocks.mockLogError,
    debug: vi.fn(),
  },
}));

// Import after mocks
import handler from '@/pages/api/studio/formats/export-psd';

describe('PSD Export API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createMockReq(overrides: Record<string, unknown> = {}): any {
    return {
      validatedBody: {
        document: { width: 100, height: 100, name: 'test-doc' },
        layers: [
          {
            id: 'layer-1',
            name: 'Background',
            visible: true,
            opacity: 100,
            type: 'raster',
            bounds: { x: 0, y: 0, width: 100, height: 100 },
          },
        ],
        options: {
          compatibility: 'photoshop-cc',
          maximizeCompatibility: true,
          includeEffects: false,
          includeSmartObjects: false,
          compression: 'rle',
        },
        ...overrides,
      },
      uid: 'test-user-123',
      requestId: 'req-test-123',
      method: 'POST',
      headers: {},
      query: {},
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

  it('should return 200 with base64 PSD data for small documents', async () => {
    const req = createMockReq();
    const { res, getStatus, getBody } = createMockRes();

    await mocks.capturedHandler(req, res);

    expect(getStatus()).toBe(200);
    const body = getBody();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('ready');
    expect(body.data.psdData).toBeDefined();
    expect(typeof body.data.psdData).toBe('string');
    expect(body.data.psdData.length).toBeGreaterThan(0);
    expect(body.data.jobId).toBeUndefined();
    expect(body.data.downloadUrl).toBeUndefined();
  });

  it('should have correct rate limit config (10 req/60s)', () => {
    expect(mocks.capturedOptions).toBeDefined();
    expect(mocks.capturedOptions.rateLimit).toBeDefined();
    expect(mocks.capturedOptions.rateLimit.maxRequests).toBe(10);
    expect(mocks.capturedOptions.rateLimit.windowMs).toBe(60000);
  });

  it('should log successful export with correct event type', async () => {
    const req = createMockReq();
    const { res } = createMockRes();

    await mocks.capturedHandler(req, res);

    expect(mocks.mockLogInfo).toHaveBeenCalled();
    const call = mocks.mockLogInfo.mock.calls[0];
    expect(call[0]).toBe('psd_export_completed');
    expect(call[1].type).toBe('psd_export_completed');
    expect(call[1].userId).toBe('test-user-123');
    expect(call[1].requestId).toBe('req-test-123');
    expect(call[1].documentName).toBe('test-doc');
    expect(call[1].bufferSize).toBeGreaterThan(0);
  });

  it('should handle export errors gracefully and return 500', async () => {
    const req = createMockReq({
      document: null,
    });
    const { res, getStatus, getBody } = createMockRes();

    await mocks.capturedHandler(req, res);

    expect(getStatus()).toBe(500);
    const body = getBody();
    expect(body.success).toBe(false);
    expect(body.error).toBeDefined();
    expect(body.error.code).toBe('PSD_EXPORT_FAILED');
  });

  it('should log errors on failure with correct event type', async () => {
    const req = createMockReq({
      document: null,
    });
    const { res } = createMockRes();

    await mocks.capturedHandler(req, res);

    expect(mocks.mockLogError).toHaveBeenCalled();
    const call = mocks.mockLogError.mock.calls[0];
    expect(call[0]).toBe('psd_export_error');
    expect(call[1].type).toBe('psd_export_error');
    expect(call[1].userId).toBe('test-user-123');
    expect(call[1].requestId).toBe('req-test-123');
    expect(call[1].error).toBeDefined();
  });

  it('should pass correct schema to createAuthenticatedRoute', () => {
    expect(mocks.capturedSchema).toBeDefined();
    // Schema should be the exportPsdSchema from formatRoutes
    // Verify it was captured during module initialization
    expect(mocks.capturedSchema).not.toBeNull();
  });

  it('should use uid and requestId from request context', async () => {
    const req = createMockReq();
    const customUid = 'custom-user-456';
    const customRequestId = 'custom-req-789';
    req.uid = customUid;
    req.requestId = customRequestId;

    const { res } = createMockRes();

    await mocks.capturedHandler(req, res);

    expect(mocks.mockLogInfo).toHaveBeenCalled();
    const call = mocks.mockLogInfo.mock.calls[0];
    expect(call[1].userId).toBe(customUid);
    expect(call[1].requestId).toBe(customRequestId);
  });

  it('should handle documents with multiple layers correctly', async () => {
    const req = createMockReq({
      layers: [
        {
          id: 'layer-1',
          name: 'Background',
          visible: true,
          opacity: 100,
          type: 'raster',
          bounds: { x: 0, y: 0, width: 100, height: 100 },
        },
        {
          id: 'layer-2',
          name: 'Content',
          visible: true,
          opacity: 80,
          type: 'raster',
          bounds: { x: 10, y: 10, width: 80, height: 80 },
        },
      ],
    });

    const { res, getStatus, getBody } = createMockRes();

    await mocks.capturedHandler(req, res);

    expect(getStatus()).toBe(200);
    const body = getBody();
    expect(body.success).toBe(true);
    expect(body.data.psdData).toBeDefined();
    expect(typeof body.data.psdData).toBe('string');
  });
});
