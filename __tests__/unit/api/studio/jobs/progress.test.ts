/**
 * Job Progress SSE Endpoint Tests
 *
 * Tests the SSE and JSON polling handlers for real-time job progress streaming.
 * Covers method validation, authorization, JSON responses, and SSE event streaming.
 *
 * @module __tests__/unit/api/studio/jobs/progress
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================================
// MOCK SETUP (HOISTED)
// ============================================================================

const mocks = vi.hoisted(() => ({
  mockGetJobStatus: vi.fn(),
  mockGetProgress: vi.fn(),
  mockLogInfo: vi.fn(),
  mockLogWarn: vi.fn(),
  mockLogError: vi.fn(),
  mockLogDebug: vi.fn(),
}));

vi.mock('@/lib/studio/middleware/withAuth', () => ({
  withAuth: (handler: any) => handler,
}));

vi.mock('@/lib/studio/infrastructure/queue/firestoreJobQueue', () => ({
  getJobQueue: () => ({
    getJobStatus: mocks.mockGetJobStatus,
  }),
}));

vi.mock('@/lib/studio/infrastructure/queue/progressReporter', () => ({
  getProgressReporter: () => ({
    getProgress: mocks.mockGetProgress,
  }),
}));

vi.mock('@/lib/studio/services/serverLogger', () => ({
  serverLogger: {
    info: mocks.mockLogInfo,
    warn: mocks.mockLogWarn,
    error: mocks.mockLogError,
    debug: mocks.mockLogDebug,
  },
}));

import handler from '@/pages/api/studio/jobs/[jobId]/progress';

// ============================================================================
// MOCK FACTORIES
// ============================================================================

function createMockReq(overrides = {}) {
  return {
    method: 'GET',
    headers: { accept: 'application/json' },
    query: { jobId: 'job-123' },
    uid: 'user-123',
    on: vi.fn(),
    removeListener: vi.fn(),
    ...overrides,
  } as any;
}

function createMockRes() {
  const res: any = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    setHeader: vi.fn().mockReturnThis(),
    write: vi.fn().mockReturnThis(),
    end: vi.fn(),
    flushHeaders: vi.fn(),
    statusCode: 200,
  };
  return res;
}

// ============================================================================
// TESTS
// ============================================================================

describe('GET /api/studio/jobs/[jobId]/progress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // METHOD VALIDATION
  // --------------------------------------------------------------------------

  describe('method validation', () => {
    it('should return 405 for non-GET methods', async () => {
      const req = createMockReq({ method: 'POST' });
      const res = createMockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(405);
      expect(res.setHeader).toHaveBeenCalledWith('Allow', 'GET');
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({ code: 'METHOD_NOT_ALLOWED' }),
        })
      );
    });
  });

  // --------------------------------------------------------------------------
  // INPUT VALIDATION
  // --------------------------------------------------------------------------

  describe('input validation', () => {
    it('should return 400 for missing jobId', async () => {
      const req = createMockReq({ query: {} });
      const res = createMockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({ code: 'INVALID_JOB_ID' }),
        })
      );
    });

    it('should return 400 for empty jobId', async () => {
      const req = createMockReq({ query: { jobId: '' } });
      const res = createMockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({ code: 'INVALID_JOB_ID' }),
        })
      );
    });
  });

  // --------------------------------------------------------------------------
  // JOB NOT FOUND
  // --------------------------------------------------------------------------

  describe('job not found', () => {
    it('should return 404 when job does not exist', async () => {
      mocks.mockGetJobStatus.mockResolvedValue(null);

      const req = createMockReq();
      const res = createMockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({ code: 'JOB_NOT_FOUND' }),
        })
      );
    });
  });

  // --------------------------------------------------------------------------
  // AUTHORIZATION
  // --------------------------------------------------------------------------

  describe('authorization', () => {
    it('should return 403 when user does not own the job', async () => {
      mocks.mockGetJobStatus.mockResolvedValue({
        jobId: 'job-123',
        status: 'PENDING',
        userId: 'different-user',
      });

      const req = createMockReq({ uid: 'user-123' });
      const res = createMockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({ code: 'FORBIDDEN' }),
        })
      );
    });

    it('should allow access when job has no userId (legacy)', async () => {
      mocks.mockGetJobStatus.mockResolvedValue({
        jobId: 'job-123',
        status: 'PENDING',
      });
      mocks.mockGetProgress.mockResolvedValue(null);

      const req = createMockReq({ headers: { accept: 'application/json' } });
      const res = createMockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });

    it('should allow access when user owns the job', async () => {
      mocks.mockGetJobStatus.mockResolvedValue({
        jobId: 'job-123',
        status: 'PENDING',
        userId: 'user-123',
      });
      mocks.mockGetProgress.mockResolvedValue(null);

      const req = createMockReq({
        uid: 'user-123',
        headers: { accept: 'application/json' },
      });
      const res = createMockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // JSON POLLING (Accept: application/json)
  // --------------------------------------------------------------------------

  describe('JSON polling (Accept: application/json)', () => {
    it('should return job status and progress as JSON', async () => {
      mocks.mockGetJobStatus.mockResolvedValue({
        jobId: 'job-123',
        status: 'IN_PROGRESS',
        userId: 'user-123',
        createdAt: '2024-01-01T10:00:00Z',
      });
      mocks.mockGetProgress.mockResolvedValue({
        stage: 'processing',
        percentComplete: 45,
        eta: 30000,
      });

      const req = createMockReq({ headers: { accept: 'application/json' } });
      const res = createMockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            jobId: 'job-123',
            status: 'IN_PROGRESS',
            isTerminal: false,
            progress: expect.objectContaining({
              stage: 'processing',
              percentComplete: 45,
              eta: 30000,
            }),
            createdAt: '2024-01-01T10:00:00Z',
          }),
        })
      );
    });

    it('should return isTerminal true for completed jobs', async () => {
      mocks.mockGetJobStatus.mockResolvedValue({
        jobId: 'job-123',
        status: 'COMPLETED',
        userId: 'user-123',
        completedAt: '2024-01-01T10:05:00Z',
      });
      mocks.mockGetProgress.mockResolvedValue(null);

      const req = createMockReq({ headers: { accept: 'application/json' } });
      const res = createMockRes();

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            status: 'COMPLETED',
            isTerminal: true,
            completedAt: '2024-01-01T10:05:00Z',
          }),
        })
      );
    });

    it('should return result for completed jobs', async () => {
      const resultData = { imageUrl: 'https://example.com/image.png' };
      mocks.mockGetJobStatus.mockResolvedValue({
        jobId: 'job-123',
        status: 'COMPLETED',
        userId: 'user-123',
        result: resultData,
      });
      mocks.mockGetProgress.mockResolvedValue(null);

      const req = createMockReq({ headers: { accept: 'application/json' } });
      const res = createMockRes();

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            result: resultData,
          }),
        })
      );
    });

    it('should return error for failed jobs', async () => {
      const errorData = { message: 'Processing failed', code: 'PROCESS_ERROR' };
      mocks.mockGetJobStatus.mockResolvedValue({
        jobId: 'job-123',
        status: 'FAILED',
        userId: 'user-123',
        error: errorData,
      });
      mocks.mockGetProgress.mockResolvedValue(null);

      const req = createMockReq({ headers: { accept: 'application/json' } });
      const res = createMockRes();

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            status: 'FAILED',
            isTerminal: true,
            error: errorData,
          }),
        })
      );
    });

    it('should handle job with no progress data', async () => {
      mocks.mockGetJobStatus.mockResolvedValue({
        jobId: 'job-123',
        status: 'PENDING',
        userId: 'user-123',
      });
      mocks.mockGetProgress.mockResolvedValue(null);

      const req = createMockReq({ headers: { accept: 'application/json' } });
      const res = createMockRes();

      await handler(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            jobId: 'job-123',
            status: 'PENDING',
          }),
        })
      );
      // Verify that the response doesn't include progress field when null
      const callArg = res.json.mock.calls[0][0];
      expect(callArg.data).not.toHaveProperty('progress');
    });

    it('should handle progress with optional eta field', async () => {
      mocks.mockGetJobStatus.mockResolvedValue({
        jobId: 'job-123',
        status: 'IN_PROGRESS',
        userId: 'user-123',
      });
      mocks.mockGetProgress.mockResolvedValue({
        stage: 'rendering',
        percentComplete: 75,
      });

      const req = createMockReq({ headers: { accept: 'application/json' } });
      const res = createMockRes();

      await handler(req, res);

      const callArg = res.json.mock.calls[0][0];
      expect(callArg.data.progress).toEqual({
        stage: 'rendering',
        percentComplete: 75,
      });
      expect(callArg.data.progress).not.toHaveProperty('eta');
    });

    it('should log job_progress_polled for JSON responses', async () => {
      mocks.mockGetJobStatus.mockResolvedValue({
        jobId: 'job-123',
        status: 'IN_PROGRESS',
        userId: 'user-123',
      });
      mocks.mockGetProgress.mockResolvedValue(null);

      const req = createMockReq({ uid: 'user-123', headers: { accept: 'application/json' } });
      const res = createMockRes();

      await handler(req, res);

      expect(mocks.mockLogInfo).toHaveBeenCalledWith(
        'job_progress_polled',
        expect.objectContaining({
          userId: 'user-123',
          jobId: 'job-123',
          status: 'IN_PROGRESS',
        })
      );
    });
  });

  // --------------------------------------------------------------------------
  // SSE STREAMING (Accept: text/event-stream)
  // --------------------------------------------------------------------------

  describe('SSE streaming (Accept: text/event-stream)', () => {
    it('should set SSE headers', async () => {
      // Mock getJobStatus to return completed immediately so loop terminates
      mocks.mockGetJobStatus.mockResolvedValue({
        jobId: 'job-123',
        status: 'COMPLETED',
        userId: 'user-123',
      });
      mocks.mockGetProgress.mockResolvedValue(null);

      const req = createMockReq({ headers: { accept: 'text/event-stream' } });
      const res = createMockRes();

      await handler(req, res);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
      expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache, no-transform');
      expect(res.setHeader).toHaveBeenCalledWith('Connection', 'keep-alive');
      expect(res.setHeader).toHaveBeenCalledWith('X-Accel-Buffering', 'no');
    });

    it('should flush headers after setting SSE headers', async () => {
      mocks.mockGetJobStatus.mockResolvedValue({
        jobId: 'job-123',
        status: 'COMPLETED',
        userId: 'user-123',
      });
      mocks.mockGetProgress.mockResolvedValue(null);

      const req = createMockReq({ headers: { accept: 'text/event-stream' } });
      const res = createMockRes();

      await handler(req, res);

      expect(res.flushHeaders).toHaveBeenCalled();
    });

    it('should send connected event initially', async () => {
      mocks.mockGetJobStatus.mockResolvedValue({
        jobId: 'job-123',
        status: 'COMPLETED',
        userId: 'user-123',
      });
      mocks.mockGetProgress.mockResolvedValue(null);

      const req = createMockReq({ headers: { accept: 'text/event-stream' } });
      const res = createMockRes();

      await handler(req, res);

      const writeCall = res.write.mock.calls.find((call: any[]) =>
        call[0].includes('event: connected')
      );
      expect(writeCall).toBeDefined();
      expect(writeCall[0]).toContain('jobId');
      expect(writeCall[0]).toContain('timestamp');
    });

    it('should send complete event for terminal COMPLETED jobs', async () => {
      mocks.mockGetJobStatus.mockResolvedValue({
        jobId: 'job-123',
        status: 'COMPLETED',
        userId: 'user-123',
        completedAt: '2024-01-01T10:05:00Z',
      });
      mocks.mockGetProgress.mockResolvedValue(null);

      const req = createMockReq({ headers: { accept: 'text/event-stream' } });
      const res = createMockRes();

      await handler(req, res);

      const writeCall = res.write.mock.calls.find((call: any[]) =>
        call[0].includes('event: complete')
      );
      expect(writeCall).toBeDefined();
      expect(writeCall[0]).toContain('COMPLETED');
      expect(writeCall[0]).toContain('completedAt');
    });

    it('should send complete event with result for successful jobs', async () => {
      const resultData = { imageUrl: 'https://example.com/image.png' };
      mocks.mockGetJobStatus.mockResolvedValue({
        jobId: 'job-123',
        status: 'COMPLETED',
        userId: 'user-123',
        result: resultData,
      });
      mocks.mockGetProgress.mockResolvedValue(null);

      const req = createMockReq({ headers: { accept: 'text/event-stream' } });
      const res = createMockRes();

      await handler(req, res);

      const writeCall = res.write.mock.calls.find((call: any[]) =>
        call[0].includes('event: complete')
      );
      expect(writeCall).toBeDefined();
      expect(writeCall[0]).toContain(JSON.stringify(resultData));
    });

    it('should send error event for FAILED jobs', async () => {
      const errorData = { message: 'Processing failed', code: 'PROCESS_ERROR' };
      mocks.mockGetJobStatus.mockResolvedValue({
        jobId: 'job-123',
        status: 'FAILED',
        userId: 'user-123',
        error: errorData,
      });
      mocks.mockGetProgress.mockResolvedValue(null);

      const req = createMockReq({ headers: { accept: 'text/event-stream' } });
      const res = createMockRes();

      await handler(req, res);

      const writeCall = res.write.mock.calls.find((call: any[]) =>
        call[0].includes('event: error')
      );
      expect(writeCall).toBeDefined();
      expect(writeCall[0]).toContain('FAILED');
    });

    it('should send error event for DEAD_LETTER jobs', async () => {
      mocks.mockGetJobStatus.mockResolvedValue({
        jobId: 'job-123',
        status: 'DEAD_LETTER',
        userId: 'user-123',
      });
      mocks.mockGetProgress.mockResolvedValue(null);

      const req = createMockReq({ headers: { accept: 'text/event-stream' } });
      const res = createMockRes();

      await handler(req, res);

      const writeCall = res.write.mock.calls.find((call: any[]) =>
        call[0].includes('event: error')
      );
      expect(writeCall).toBeDefined();
      expect(writeCall[0]).toContain('DEAD_LETTER');
    });

    it('should send heartbeat events while job is running', async () => {
      let jobCallCount = 0;
      mocks.mockGetJobStatus.mockImplementation(async () => {
        jobCallCount++;
        if (jobCallCount <= 2) {
          return { jobId: 'job-123', status: 'RUNNING', userId: 'user-123' };
        }
        return { jobId: 'job-123', status: 'COMPLETED', userId: 'user-123' };
      });
      mocks.mockGetProgress.mockResolvedValue(null);

      const req = createMockReq({ headers: { accept: 'text/event-stream' } });
      const res = createMockRes();

      vi.useFakeTimers();
      const handlerPromise = handler(req, res);
      await vi.advanceTimersByTimeAsync(2000);
      await handlerPromise;
      vi.useRealTimers();

      const heartbeatCall = res.write.mock.calls.find((call: any[]) =>
        call[0].includes('event: heartbeat')
      );
      expect(heartbeatCall).toBeDefined();
      expect(heartbeatCall[0]).toContain('timestamp');
    });

    it('should send progress events when progress data exists and changes', async () => {
      let jobCallCount = 0;
      mocks.mockGetJobStatus.mockImplementation(async () => {
        jobCallCount++;
        if (jobCallCount <= 2) {
          return { jobId: 'job-123', status: 'RUNNING', userId: 'user-123' };
        }
        return { jobId: 'job-123', status: 'COMPLETED', userId: 'user-123' };
      });
      mocks.mockGetProgress.mockResolvedValue({
        stage: 'processing',
        percentComplete: 50,
      });

      const req = createMockReq({ headers: { accept: 'text/event-stream' } });
      const res = createMockRes();

      vi.useFakeTimers();
      const handlerPromise = handler(req, res);
      await vi.advanceTimersByTimeAsync(2000);
      await handlerPromise;
      vi.useRealTimers();

      const progressCall = res.write.mock.calls.find((call: any[]) =>
        call[0].includes('event: progress')
      );
      expect(progressCall).toBeDefined();
      expect(progressCall[0]).toContain('processing');
      expect(progressCall[0]).toContain('50');
    });

    it('should end SSE stream and log when client disconnects', async () => {
      mocks.mockGetJobStatus.mockResolvedValue({
        jobId: 'job-123',
        status: 'COMPLETED',
        userId: 'user-123',
      });
      mocks.mockGetProgress.mockResolvedValue(null);

      const req = createMockReq({ headers: { accept: 'text/event-stream' } });
      const res = createMockRes();

      // Capture the close listener
      let closeListener: any;
      req.on.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          closeListener = callback;
        }
      });

      await handler(req, res);

      expect(res.end).toHaveBeenCalled();
      expect(mocks.mockLogInfo).toHaveBeenCalledWith(
        'sse_stream_ended',
        expect.objectContaining({
          userId: 'user-123',
          jobId: 'job-123',
        })
      );
    });

    it('should log sse_stream_started when SSE handler begins', async () => {
      mocks.mockGetJobStatus.mockResolvedValue({
        jobId: 'job-123',
        status: 'COMPLETED',
        userId: 'user-123',
      });
      mocks.mockGetProgress.mockResolvedValue(null);

      const req = createMockReq({ uid: 'user-123', headers: { accept: 'text/event-stream' } });
      const res = createMockRes();

      await handler(req, res);

      expect(mocks.mockLogInfo).toHaveBeenCalledWith(
        'sse_stream_started',
        expect.objectContaining({
          userId: 'user-123',
          jobId: 'job-123',
        })
      );
    });

    it('should handle job not found during SSE stream', async () => {
      let jobCallCount = 0;
      mocks.mockGetJobStatus.mockImplementation(async () => {
        jobCallCount++;
        if (jobCallCount === 1) {
          return { jobId: 'job-123', status: 'RUNNING', userId: 'user-123' };
        }
        return null;
      });
      mocks.mockGetProgress.mockResolvedValue(null);

      const req = createMockReq({ headers: { accept: 'text/event-stream' } });
      const res = createMockRes();

      await handler(req, res);

      const errorCall = res.write.mock.calls.find((call: any[]) =>
        call[0].includes('event: error')
      );
      expect(errorCall).toBeDefined();
      expect(errorCall[0]).toContain('Job not found');
    });
  });

  // --------------------------------------------------------------------------
  // CONTENT NEGOTIATION
  // --------------------------------------------------------------------------

  describe('content negotiation', () => {
    it('should default to JSON when Accept header is missing', async () => {
      mocks.mockGetJobStatus.mockResolvedValue({
        jobId: 'job-123',
        status: 'PENDING',
        userId: 'user-123',
      });
      mocks.mockGetProgress.mockResolvedValue(null);

      const req = createMockReq({ headers: {} });
      const res = createMockRes();

      await handler(req, res);

      expect(res.json).toHaveBeenCalled();
      expect(res.setHeader).not.toHaveBeenCalledWith(
        'Content-Type',
        'text/event-stream'
      );
    });

    it('should prefer SSE when Accept header contains text/event-stream', async () => {
      mocks.mockGetJobStatus.mockResolvedValue({
        jobId: 'job-123',
        status: 'COMPLETED',
        userId: 'user-123',
      });
      mocks.mockGetProgress.mockResolvedValue(null);

      const req = createMockReq({
        headers: { accept: 'text/event-stream, application/json' },
      });
      const res = createMockRes();

      await handler(req, res);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
      expect(res.write).toHaveBeenCalled();
    });
  });
});
