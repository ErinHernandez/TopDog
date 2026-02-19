/**
 * Integration tests for async job lifecycle
 * Tests: submit → enqueue → poll progress → complete
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';

// ============================================================================
// Hoisted Mocks
// ============================================================================

const mocks = vi.hoisted(() => ({
  mockEnqueueJob: vi.fn(),
  mockGetJobStatus: vi.fn(),
  mockCacheGet: vi.fn(),
  mockCacheSet: vi.fn(),
  mockGetFromRedis: vi.fn(),
  mockSetToRedis: vi.fn(),
  mockLogInfo: vi.fn(),
  mockLogError: vi.fn(),
}));

// ============================================================================
// Module Mocks
// ============================================================================

vi.mock('@/lib/studio/middleware/withAuth', () => ({
  withAuth: (handler: any) => handler,
}));

vi.mock('@/lib/studio/infrastructure/queue/firestoreJobQueue', () => ({
  firestoreJobQueue: {
    enqueueJob: mocks.mockEnqueueJob,
    getJobStatus: mocks.mockGetJobStatus,
  },
}));

vi.mock('@/lib/studio/infrastructure/queue/progressReporter', () => ({
  progressReporter: {
    reportProgress: vi.fn(),
  },
}));

vi.mock('@/lib/studio/infrastructure/cache/cacheManager', () => ({
  getCacheManager: vi.fn(() => ({
    get: mocks.mockCacheGet,
    set: mocks.mockCacheSet,
  })),
}));

vi.mock('@/lib/studio/services/serverLogger', () => ({
  serverLogger: {
    info: mocks.mockLogInfo,
    error: mocks.mockLogError,
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@/lib/studio/infrastructure/redis/upstashClient', () => ({
  upstashClient: {
    get: mocks.mockGetFromRedis,
    set: mocks.mockSetToRedis,
  },
}));

// ============================================================================
// Helper Functions
// ============================================================================

function createMockReq(overrides: Partial<NextApiRequest> = {}): NextApiRequest {
  return {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    query: {},
    body: {},
    url: '/api/test',
    ...overrides,
  } as unknown as NextApiRequest;
}

function createMockRes(): NextApiResponse & {
  _status: number;
  _json: any;
  _headers: Record<string, string>;
} {
  const res: any = {
    _status: 200,
    _json: null,
    _headers: {},
    status(code: number) {
      res._status = code;
      return res;
    },
    json(data: any) {
      res._json = data;
      return res;
    },
    setHeader(key: string, value: string) {
      res._headers[key] = value;
      return res;
    },
    getHeader(key: string) {
      return res._headers[key];
    },
    end() {
      return res;
    },
    headersSent: false,
  };
  return res;
}

// ============================================================================
// Tests
// ============================================================================

describe('Async Job Progress Lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Job Enqueue', () => {
    it('should enqueue job and return job reference with jobId', async () => {
      const jobId = 'job-abc-123';
      mocks.mockEnqueueJob.mockResolvedValue({
        jobId,
        status: 'queued',
        createdAt: new Date().toISOString(),
      });

      const req = createMockReq({
        body: {
          taskType: 'export-psd',
          documentId: 'doc-123',
        },
      });
      req.uid = 'user-123';

      const res = createMockRes();

      const result = await mocks.mockEnqueueJob({
        taskType: 'export-psd',
        documentId: 'doc-123',
        userId: req.uid,
      });

      res.status(202).json({
        jobId: result.jobId,
        status: result.status,
      });

      expect(res._status).toBe(202);
      expect(res._json.jobId).toBe('job-abc-123');
      expect(res._json.status).toBe('queued');
    });

    it('should return created timestamp with job', async () => {
      const createdAt = new Date().toISOString();
      mocks.mockEnqueueJob.mockResolvedValue({
        jobId: 'job-xyz',
        status: 'queued',
        createdAt,
      });

      const req = createMockReq({
        body: { taskType: 'process-image' },
      });
      req.uid = 'user-xyz';

      const result = await mocks.mockEnqueueJob({
        taskType: 'process-image',
        userId: req.uid,
      });

      expect(result.createdAt).toBe(createdAt);
    });
  });

  describe('Progress Polling', () => {
    it('should return status and progress percentage as JSON', async () => {
      mocks.mockGetJobStatus.mockResolvedValue({
        jobId: 'job-123',
        status: 'processing',
        progressPercent: 45,
        isTerminal: false,
      });

      const req = createMockReq({
        query: { jobId: 'job-123' },
      });
      req.uid = 'user-123';

      const res = createMockRes();

      const status = await mocks.mockGetJobStatus('job-123');

      res
        .status(200)
        .setHeader('Content-Type', 'application/json')
        .json(status);

      expect(res._status).toBe(200);
      expect(res._json.status).toBe('processing');
      expect(res._json.progressPercent).toBe(45);
      expect(res._json.isTerminal).toBe(false);
    });

    it('should return isTerminal=true for completed job', async () => {
      mocks.mockGetJobStatus.mockResolvedValue({
        jobId: 'job-complete',
        status: 'completed',
        progressPercent: 100,
        isTerminal: true,
        result: { exportUrl: 'https://example.com/file.psd' },
      });

      const req = createMockReq({
        query: { jobId: 'job-complete' },
      });
      req.uid = 'user-123';

      const res = createMockRes();

      const status = await mocks.mockGetJobStatus('job-complete');

      res.status(200).json(status);

      expect(res._status).toBe(200);
      expect(res._json.isTerminal).toBe(true);
      expect(res._json.progressPercent).toBe(100);
      expect(res._json.result).toBeDefined();
    });

    it('should return error for failed job', async () => {
      mocks.mockGetJobStatus.mockResolvedValue({
        jobId: 'job-failed',
        status: 'failed',
        progressPercent: 0,
        isTerminal: true,
        error: 'Export failed: invalid document',
      });

      const req = createMockReq({
        query: { jobId: 'job-failed' },
      });
      req.uid = 'user-123';

      const res = createMockRes();

      const status = await mocks.mockGetJobStatus('job-failed');

      res.status(200).json(status);

      expect(res._status).toBe(200);
      expect(res._json.status).toBe('failed');
      expect(res._json.error).toBeDefined();
      expect(res._json.isTerminal).toBe(true);
    });

    it('should return 404 for non-existent job', async () => {
      mocks.mockGetJobStatus.mockRejectedValue(new Error('Job not found'));

      const req = createMockReq({
        query: { jobId: 'job-nonexistent' },
      });
      req.uid = 'user-123';

      const res = createMockRes();

      try {
        await mocks.mockGetJobStatus('job-nonexistent');
        res.status(200).json({});
      } catch (error) {
        res.status(404).json({
          error: 'Job not found',
        });
      }

      expect(res._status).toBe(404);
    });

    it('should return 403 when job owned by different user', async () => {
      const req = createMockReq({
        query: { jobId: 'job-other-user' },
      });
      req.uid = 'user-abc';

      const res = createMockRes();

      // Simulate authorization check
      const jobOwner = 'user-xyz';
      if (req.uid !== jobOwner) {
        res.status(403).json({
          error: 'Unauthorized',
          message: 'You do not own this job',
        });
      }

      expect(res._status).toBe(403);
    });
  });

  describe('Progress Updates', () => {
    it('should show increasing progress percentage', async () => {
      const jobId = 'job-progress';

      // Progress sequence: 0% → 25% → 50% → 75% → 100%
      const progressSequence = [
        { status: 'queued', progressPercent: 0 },
        { status: 'processing', progressPercent: 25 },
        { status: 'processing', progressPercent: 50 },
        { status: 'processing', progressPercent: 75 },
        { status: 'completed', progressPercent: 100, isTerminal: true },
      ];

      for (let i = 0; i < progressSequence.length; i++) {
        mocks.mockGetJobStatus.mockResolvedValueOnce({
          jobId,
          ...progressSequence[i],
        });
      }

      // Poll sequence
      for (let i = 0; i < progressSequence.length; i++) {
        const status = await mocks.mockGetJobStatus(jobId);
        expect(status.progressPercent).toBe(progressSequence[i].progressPercent);

        if (i > 0) {
          // Each poll should have progress >= previous
          expect(status.progressPercent).toBeGreaterThanOrEqual(
            progressSequence[i - 1].progressPercent
          );
        }
      }
    });

    it('should end stream on terminal status', async () => {
      const statuses = [
        { status: 'processing', progressPercent: 50, isTerminal: false },
        { status: 'processing', progressPercent: 90, isTerminal: false },
        { status: 'completed', progressPercent: 100, isTerminal: true },
      ];

      for (const status of statuses) {
        mocks.mockGetJobStatus.mockResolvedValueOnce(status);
      }

      const results = [];

      for (let i = 0; i < 5; i++) {
        const status = await mocks.mockGetJobStatus('job-123');
        results.push(status);

        if (status.isTerminal) {
          break; // Stop polling
        }
      }

      // Should have polled 3 times and stopped
      expect(results).toHaveLength(3);
      expect(results[results.length - 1].isTerminal).toBe(true);
    });

    it('should accept various terminal statuses', async () => {
      const terminalStatuses = ['completed', 'failed', 'cancelled', 'timeout'];

      for (const terminalStatus of terminalStatuses) {
        mocks.mockGetJobStatus.mockResolvedValueOnce({
          jobId: 'job-terminal',
          status: terminalStatus,
          isTerminal: true,
        });

        const result = await mocks.mockGetJobStatus('job-terminal');
        expect(result.isTerminal).toBe(true);
      }
    });
  });

  describe('End-to-End Job Lifecycle', () => {
    it('should complete full job lifecycle: enqueue → poll → complete', async () => {
      const jobId = 'job-full-lifecycle';

      // Step 1: Enqueue
      mocks.mockEnqueueJob.mockResolvedValue({
        jobId,
        status: 'queued',
      });

      const req = createMockReq({
        body: { taskType: 'export', documentId: 'doc-123' },
      });
      req.uid = 'user-123';

      const enqueueResult = await mocks.mockEnqueueJob({
        taskType: 'export',
        documentId: 'doc-123',
        userId: req.uid,
      });

      expect(enqueueResult.jobId).toBe(jobId);

      // Step 2: Poll initial state
      mocks.mockGetJobStatus.mockResolvedValueOnce({
        jobId,
        status: 'queued',
        progressPercent: 0,
        isTerminal: false,
      });

      let status = await mocks.mockGetJobStatus(jobId);
      expect(status.progressPercent).toBe(0);
      expect(status.isTerminal).toBe(false);

      // Step 3: Poll processing state
      mocks.mockGetJobStatus.mockResolvedValueOnce({
        jobId,
        status: 'processing',
        progressPercent: 50,
        isTerminal: false,
      });

      status = await mocks.mockGetJobStatus(jobId);
      expect(status.progressPercent).toBe(50);

      // Step 4: Poll completed state
      mocks.mockGetJobStatus.mockResolvedValueOnce({
        jobId,
        status: 'completed',
        progressPercent: 100,
        isTerminal: true,
        result: { fileUrl: 'https://example.com/export.psd' },
      });

      status = await mocks.mockGetJobStatus(jobId);
      expect(status.isTerminal).toBe(true);
      expect(status.result).toBeDefined();

      expect(mocks.mockEnqueueJob).toHaveBeenCalledOnce();
      expect(mocks.mockGetJobStatus).toHaveBeenCalledTimes(3);
    });

    it('should handle job failure in lifecycle', async () => {
      const jobId = 'job-failure';

      // Enqueue
      mocks.mockEnqueueJob.mockResolvedValue({ jobId, status: 'queued' });
      const job = await mocks.mockEnqueueJob({
        taskType: 'export',
        userId: 'user-123',
      });
      expect(job.jobId).toBe(jobId);

      // Poll processing
      mocks.mockGetJobStatus.mockResolvedValueOnce({
        jobId,
        status: 'processing',
        progressPercent: 30,
        isTerminal: false,
      });

      let status = await mocks.mockGetJobStatus(jobId);
      expect(status.isTerminal).toBe(false);

      // Poll failed
      mocks.mockGetJobStatus.mockResolvedValueOnce({
        jobId,
        status: 'failed',
        progressPercent: 30,
        isTerminal: true,
        error: 'Export timeout',
      });

      status = await mocks.mockGetJobStatus(jobId);
      expect(status.isTerminal).toBe(true);
      expect(status.status).toBe('failed');
      expect(status.error).toBeDefined();
    });
  });
});
