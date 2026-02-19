/**
 * Unit tests for RAW processing route handler
 * Tests the POST /api/studio/formats/process-raw endpoint
 * Validates job queue integration, error handling, and API response structure
 * Module: __tests__/unit/api/studio/formats/process-raw.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => {
  const mockEnqueueJob = vi.fn().mockResolvedValue('job-raw-123');
  const mockLogInfo = vi.fn();
  const mockLogError = vi.fn();
  return {
    mockEnqueueJob,
    mockLogInfo,
    mockLogError,
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

// Import after mocks
import handler from '@/pages/api/studio/formats/process-raw';

function createMockReq(overrides: Record<string, unknown> = {}): any {
  return {
    validatedBody: {
      fileBuffer: Buffer.from('raw-image-file-data').toString('base64'),
      fileName: 'photo.CR3',
      settings: {
        whiteBalance: 'auto',
        exposure: 0,
        contrast: 0,
        highlights: 0,
        shadows: 0,
        whites: 0,
        blacks: 0,
        clarity: 0,
        vibrance: 0,
        saturation: 0,
        noiseReduction: 25,
        sharpening: 40,
        lensCorrection: true,
        chromaticAberration: true,
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

describe('POST /api/studio/formats/process-raw', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockEnqueueJob.mockResolvedValue('job-raw-123');
  });

  it('should return 202 with job reference', async () => {
    const req = createMockReq();
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(202);
    const body = getBody();
    expect(body.success).toBe(true);
    expect(body.data.jobId).toBe('job-raw-123');
    expect(body.data.status).toBe('queued');
    expect(body.data.progressUrl).toContain('job-raw-123');
  });

  it('should always enqueue to job queue', async () => {
    const req = createMockReq();
    const { res } = createMockRes();

    await handler(req, res);

    expect(mocks.mockEnqueueJob).toHaveBeenCalledOnce();
  });

  it('should pass correct payload to job queue', async () => {
    const req = createMockReq();
    const { res } = createMockRes();

    await handler(req, res);

    const callArgs = mocks.mockEnqueueJob.mock.calls[0];
    const jobType = callArgs[0];
    const payload = callArgs[1];

    expect(jobType).toBe('IMAGE_EXPORT');
    expect(payload).toHaveProperty('fileBuffer');
    expect(payload).toHaveProperty('fileName');
    expect(payload).toHaveProperty('settings');
    expect(payload.fileBuffer).toBe(req.validatedBody.fileBuffer);
    expect(payload.fileName).toBe('photo.CR3');
  });

  it('should pass userId to job queue options', async () => {
    const req = createMockReq();
    const { res } = createMockRes();

    await handler(req, res);

    const callArgs = mocks.mockEnqueueJob.mock.calls[0];
    const options = callArgs[2];

    expect(options).toEqual({ userId: 'test-user-123' });
  });

  it('should have correct rate limit config (10 req/60s)', () => {
    expect(mocks.capturedOptions).toBeDefined();
    expect(mocks.capturedOptions.rateLimit).toBeDefined();
    expect(mocks.capturedOptions.rateLimit.maxRequests).toBe(10);
    expect(mocks.capturedOptions.rateLimit.windowMs).toBe(60_000);
  });

  it('should log enqueue event', async () => {
    const req = createMockReq();
    const { res } = createMockRes();

    await handler(req, res);

    expect(mocks.mockLogInfo).toHaveBeenCalledWith(
      'RAW processing enqueued',
      expect.objectContaining({
        userId: 'test-user-123',
        requestId: 'req-test-123',
        fileName: 'photo.CR3',
      })
    );
  });

  it('should handle job queue errors', async () => {
    mocks.mockEnqueueJob.mockRejectedValueOnce(new Error('Queue full'));
    const req = createMockReq();
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(500);
    const body = getBody();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('PROCESSING_FAILED');
  });

  it('should log errors on failure', async () => {
    mocks.mockEnqueueJob.mockRejectedValueOnce(new Error('Queue full'));
    const req = createMockReq();
    const { res } = createMockRes();

    await handler(req, res);

    expect(mocks.mockLogError).toHaveBeenCalled();
    const logCall = mocks.mockLogError.mock.calls[0][0];
    expect(logCall).toContain('RAW processing enqueue failed');
  });

  it('should pass correct schema to createAuthenticatedRoute', () => {
    expect(mocks.capturedSchema).toBeDefined();
  });

  it('should preserve custom settings in job payload', async () => {
    const customSettings = {
      whiteBalance: 'daylight' as const,
      exposure: 1.5,
      contrast: 0.5,
      highlights: 0.25,
      shadows: -0.1,
      whites: 0.3,
      blacks: -0.2,
      clarity: 0.4,
      vibrance: 0.15,
      saturation: 0.2,
      noiseReduction: 50,
      sharpening: 80,
      lensCorrection: false,
      chromaticAberration: false,
    };

    const req = createMockReq({
      settings: customSettings,
    });
    const { res } = createMockRes();

    await handler(req, res);

    const callArgs = mocks.mockEnqueueJob.mock.calls[0];
    const payload = callArgs[1];

    expect(payload.settings).toMatchObject({
      whiteBalance: 'daylight',
      exposure: 1.5,
      contrast: 0.5,
      highlights: 0.25,
      shadows: -0.1,
      whites: 0.3,
      blacks: -0.2,
      clarity: 0.4,
      vibrance: 0.15,
      saturation: 0.2,
      noiseReduction: 50,
      sharpening: 80,
      lensCorrection: false,
      chromaticAberration: false,
    });
  });
});
