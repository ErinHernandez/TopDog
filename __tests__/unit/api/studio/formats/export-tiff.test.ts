/**
 * @file TIFF Export API Route Tests
 * @module __tests__/unit/api/studio/formats/export-tiff.test
 * @description Tests for the export-tiff route handler covering:
 * - Small image synchronous export (< 5MB)
 * - Large image async job enqueue (>= 5MB)
 * - Rate limiting configuration
 * - Logging and monitoring
 * - Error handling for job queue and export operations
 * - Schema validation and payload construction
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => {
  const mockEnqueueJob = vi.fn().mockResolvedValue('job-tiff-123');
  const mockLogInfo = vi.fn();
  const mockLogError = vi.fn();
  
  // Sharp mocks
  const mockTiffBuffer = Buffer.from('mock-tiff-data');
  const mockToBuffer = vi.fn().mockResolvedValue(mockTiffBuffer);
  const mockTiff = vi.fn().mockReturnValue({ toBuffer: mockToBuffer });
  const mockSharpInstance = vi.fn().mockReturnValue({ tiff: mockTiff });
  
  return {
    mockEnqueueJob,
    mockLogInfo,
    mockLogError,
    mockSharpInstance,
    mockTiff,
    mockToBuffer,
    mockTiffBuffer,
    capturedSchema: null as any,
    capturedOptions: null as any,
    capturedHandler: null as ((req: any, res: any) => Promise<void>) | null,
  };
});

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

vi.mock('sharp', () => ({
  default: mocks.mockSharpInstance,
}));

// Import after mocks
import handler from '@/pages/api/studio/formats/export-tiff';

/**
 * Creates a mock request object with validated body and metadata
 * @param overrides - Optional overrides for specific request properties
 * @returns Mock request object with standard test defaults
 */
function createMockReq(overrides: Record<string, unknown> = {}): any {
  return {
    validatedBody: {
      imageData: Buffer.from('test-image-data').toString('base64'),
      width: 100,
      height: 100,
      exportOptions: {
        compression: 'lzw',
        multiPage: false,
        bitDepth: 8,
        predictor: false,
        bigTiff: false,
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

/**
 * Creates a mock response object with status and body tracking
 * @returns Object containing response mock and getter functions
 */
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
  return {
    res,
    getStatus: () => statusCode,
    getBody: () => responseBody,
  };
}

describe('export-tiff route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 200 with base64 blob for small images', async () => {
    const req = createMockReq({
      width: 100,
      height: 100,
    });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    const body = getBody();
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(body.data.blob).toBeDefined();
    expect(typeof body.data.blob).toBe('string');
    expect(body.data.status).toBe('complete');
    expect(body.data.estimatedSizeBytes).toBe(100 * 100 * 4);
  });

  it('should return 202 with jobId for large images', async () => {
    const req = createMockReq({
      width: 2000,
      height: 2000,
    });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(202);
    const body = getBody();
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(body.data.jobId).toBe('job-tiff-123');
    expect(body.data.status).toBe('pending');
    expect(mocks.mockEnqueueJob).toHaveBeenCalledWith(
      'IMAGE_EXPORT',
      expect.any(Object),
      expect.objectContaining({ userId: 'test-user-123' })
    );
  });

  it('should have correct rate limit config (15 req/60s)', () => {
    expect(mocks.capturedOptions).toBeDefined();
    expect(mocks.capturedOptions.rateLimit).toBeDefined();
    expect(mocks.capturedOptions.rateLimit.maxRequests).toBe(15);
    expect(mocks.capturedOptions.rateLimit.windowMs).toBe(60_000);
  });

  it('should log synchronous export completion', async () => {
    const req = createMockReq({
      width: 100,
      height: 100,
    });
    const { res } = createMockRes();

    await handler(req, res);

    // Check that the "Synchronous TIFF export completed" log was called
    expect(mocks.mockLogInfo).toHaveBeenCalledWith(
      'Synchronous TIFF export completed',
      expect.objectContaining({ userId: 'test-user-123' })
    );
  });

  it('should log async job enqueue', async () => {
    const req = createMockReq({
      width: 2000,
      height: 2000,
    });
    const { res } = createMockRes();

    await handler(req, res);

    expect(mocks.mockLogInfo).toHaveBeenCalledWith(
      'TIFF export job enqueued successfully',
      expect.objectContaining({ jobId: 'job-tiff-123' })
    );
  });

  it('should handle job queue errors', async () => {
    mocks.mockEnqueueJob.mockRejectedValueOnce(
      new Error('Queue unavailable')
    );
    const req = createMockReq({
      width: 2000,
      height: 2000,
    });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(500);
    const body = getBody();
    expect(body.success).toBe(false);
    expect(body.error).toBeDefined();
  });

  it('should pass correct schema', () => {
    expect(mocks.capturedSchema).toBeDefined();
    expect(mocks.capturedSchema).not.toBeNull();
  });

  it('should include metadata in job payload when provided', async () => {
    const metadata = { title: 'Test', author: 'Tester' };
    const req = createMockReq({
      width: 2000,
      height: 2000,
      metadata,
    });
    const { res } = createMockRes();

    await handler(req, res);

    expect(mocks.mockEnqueueJob).toHaveBeenCalledWith(
      'IMAGE_EXPORT',
      expect.objectContaining({
        metadata,
      }),
      expect.any(Object)
    );
  });

  it('should pass export options to job queue for large images', async () => {
    const exportOptions = {
      compression: 'deflate',
      multiPage: true,
      bitDepth: 16,
      predictor: true,
      bigTiff: true,
    };
    const req = createMockReq({
      width: 2000,
      height: 2000,
      exportOptions,
    });
    const { res } = createMockRes();

    await handler(req, res);

    expect(mocks.mockEnqueueJob).toHaveBeenCalledWith(
      'IMAGE_EXPORT',
      expect.objectContaining({
        exportOptions,
      }),
      expect.any(Object)
    );
  });

  it('should calculate estimated size correctly', async () => {
    const testCases = [
      { width: 100, height: 100, expected: 40000 },
      { width: 500, height: 500, expected: 1000000 },
      { width: 2000, height: 2000, expected: 16000000 },
    ];

    for (const testCase of testCases) {
      mocks.mockEnqueueJob.mockResolvedValueOnce('job-tiff-123');
      const req = createMockReq({
        width: testCase.width,
        height: testCase.height,
      });
      const { res, getBody } = createMockRes();

      await handler(req, res);

      const body = getBody();
      expect(body.data.estimatedSizeBytes).toBe(testCase.expected);
    }
  });
});
