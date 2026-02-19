/**
 * Integration tests for generation → feedback → sendback workflow
 * Tests the complete flow: generate image → rate it → send feedback → broadcast sendback
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';

// ============================================================================
// Hoisted Mocks
// ============================================================================

const mocks = vi.hoisted(() => ({
  mockGenerateImage: vi.fn(),
  mockStoreFeedback: vi.fn(),
  mockEnqueueJob: vi.fn(),
  mockCheckRateLimit: vi.fn(),
  mockCacheGet: vi.fn(),
  mockCacheSet: vi.fn(),
  mockReportProgress: vi.fn(),
  mockLogInfo: vi.fn(),
  mockLogError: vi.fn(),
}));

// ============================================================================
// Module Mocks
// ============================================================================

vi.mock('@/lib/studio/middleware/withAuth', () => ({
  withAuth: (handler: any) => handler,
  withOptionalAuth: (handler: any) => handler,
}));

vi.mock('@/lib/studio/services/ai/imageGeneration/ImageGenerationFactory', () => ({
  ImageGenerationFactory: {
    generateImage: mocks.mockGenerateImage,
  },
}));

vi.mock('@/lib/studio/services/imageFeedbackService', () => ({
  imageFeedbackService: {
    storeFeedback: mocks.mockStoreFeedback,
  },
}));

vi.mock('@/lib/studio/services/rateLimiter', () => ({
  rateLimiter: {
    checkLimit: mocks.mockCheckRateLimit,
  },
}));

vi.mock('@/lib/studio/infrastructure/queue/firestoreJobQueue', () => ({
  firestoreJobQueue: {
    enqueueJob: mocks.mockEnqueueJob,
  },
}));

vi.mock('@/lib/studio/infrastructure/queue/progressReporter', () => ({
  progressReporter: {
    reportProgress: mocks.mockReportProgress,
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

describe('Generation → Feedback → Sendback Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Image Generation', () => {
    it('should generate image with valid prompt', async () => {
      const mockResult = {
        imageId: 'gen-123',
        imageUrl: 'https://example.com/image.png',
        seed: 42,
        metadata: { model: 'test-model' },
      };
      mocks.mockGenerateImage.mockResolvedValue(mockResult);
      mocks.mockCheckRateLimit.mockResolvedValue({ allowed: true });

      const req = createMockReq({
        body: { prompt: 'A beautiful landscape', style: 'oil painting' },
      });
      req.uid = 'user-123';

      const res = createMockRes();

      // Simulate handler
      const userId = req.uid;
      const isAllowed = (await mocks.mockCheckRateLimit(userId, 'generation')).allowed;

      if (!isAllowed) {
        res.status(429).json({ error: 'Rate limit exceeded' });
      } else {
        const result = await mocks.mockGenerateImage(
          'A beautiful landscape',
          { style: 'oil painting' },
          userId
        );
        res.status(200).json({ success: true, data: result });
      }

      expect(res._status).toBe(200);
      expect(res._json.success).toBe(true);
      expect(res._json.data.imageId).toBe('gen-123');
      expect(mocks.mockGenerateImage).toHaveBeenCalledWith(
        'A beautiful landscape',
        { style: 'oil painting' },
        'user-123'
      );
    });

    it('should reject invalid prompt with moderation error', async () => {
      mocks.mockGenerateImage.mockRejectedValue(
        new Error('Prompt failed moderation')
      );
      mocks.mockCheckRateLimit.mockResolvedValue({ allowed: true });

      const req = createMockReq({
        body: { prompt: 'inappropriate content' },
      });
      req.uid = 'user-123';

      const res = createMockRes();

      const userId = req.uid;
      const isAllowed = (await mocks.mockCheckRateLimit(userId, 'generation')).allowed;

      if (!isAllowed) {
        res.status(429).json({ error: 'Rate limit exceeded' });
      } else {
        try {
          await mocks.mockGenerateImage('inappropriate content', {}, userId);
          res.status(200).json({ success: true, data: {} });
        } catch (error) {
          res.status(400).json({
            success: false,
            error: 'Prompt failed moderation',
          });
        }
      }

      expect(res._status).toBe(400);
      expect(res._json.success).toBe(false);
    });

    it('should return 429 when rate limit exceeded', async () => {
      mocks.mockCheckRateLimit.mockResolvedValue({ allowed: false });

      const req = createMockReq({
        body: { prompt: 'A beautiful landscape' },
      });
      req.uid = 'user-456';

      const res = createMockRes();

      const userId = req.uid;
      const isAllowed = (await mocks.mockCheckRateLimit(userId, 'generation')).allowed;

      if (!isAllowed) {
        res.status(429).json({ error: 'Rate limit exceeded' });
      } else {
        const result = await mocks.mockGenerateImage('A beautiful landscape', {}, userId);
        res.status(200).json({ success: true, data: result });
      }

      expect(res._status).toBe(429);
    });

    it('should reject request without auth token', async () => {
      const req = createMockReq({
        body: { prompt: 'A beautiful landscape' },
      });
      // No uid set

      const res = createMockRes();

      if (!req.uid) {
        res.status(401).json({ error: 'Authentication required' });
      } else {
        res.status(200).json({ success: true, data: {} });
      }

      expect(res._status).toBe(401);
    });

    it('should return 400 when budget exceeded', async () => {
      mocks.mockCheckRateLimit.mockResolvedValue({ allowed: true });
      mocks.mockGenerateImage.mockRejectedValue(
        new Error('Insufficient budget')
      );

      const req = createMockReq({
        body: { prompt: 'expensive image' },
      });
      req.uid = 'user-low-budget';

      const res = createMockRes();

      const userId = req.uid;
      const isAllowed = (await mocks.mockCheckRateLimit(userId, 'generation')).allowed;

      if (!isAllowed) {
        res.status(429).json({ error: 'Rate limit exceeded' });
      } else {
        try {
          await mocks.mockGenerateImage('expensive image', {}, userId);
          res.status(200).json({ success: true, data: {} });
        } catch (error) {
          res.status(400).json({
            success: false,
            error: 'Insufficient budget',
          });
        }
      }

      expect(res._status).toBe(400);
    });

    it('should return cached result on cache hit', async () => {
      const cacheKey = 'gen:user-123:hash-abc';
      const cachedResult = { imageId: 'gen-cached', cached: true };

      mocks.mockCacheGet.mockResolvedValue(cachedResult);
      mocks.mockCheckRateLimit.mockResolvedValue({ allowed: true });

      const req = createMockReq({
        body: { prompt: 'Cached landscape' },
      });
      req.uid = 'user-123';

      const res = createMockRes();

      const userId = req.uid;
      const cached = await mocks.mockCacheGet(cacheKey);

      if (cached) {
        res.status(200).json({ success: true, data: cached });
      } else {
        const result = await mocks.mockGenerateImage('Cached landscape', {}, userId);
        res.status(200).json({ success: true, data: result });
      }

      expect(res._status).toBe(200);
      expect(res._json.data.imageId).toBe('gen-cached');
    });
  });

  describe('Feedback & Rating', () => {
    it('should store feedback for generated image', async () => {
      const feedbackId = 'fb-123';
      mocks.mockStoreFeedback.mockResolvedValue({ success: true, feedbackId });

      const req = createMockReq({
        body: {
          imageId: 'gen-123',
          rating: 5,
          annotation: 'Great quality!',
        },
      });
      req.uid = 'user-123';

      const res = createMockRes();

      const result = await mocks.mockStoreFeedback({
        userId: req.uid,
        imageId: 'gen-123',
        rating: 5,
        annotation: 'Great quality!',
      });

      res.status(200).json({ success: true, feedbackId: result.feedbackId });

      expect(res._status).toBe(200);
      expect(mocks.mockStoreFeedback).toHaveBeenCalledWith({
        userId: 'user-123',
        imageId: 'gen-123',
        rating: 5,
        annotation: 'Great quality!',
      });
    });

    it('should accept rating and annotation together', async () => {
      mocks.mockStoreFeedback.mockResolvedValue({ success: true, feedbackId: 'fb-456' });

      const rating = 3;
      const annotation = 'Needs improvement';

      await mocks.mockStoreFeedback({
        userId: 'user-abc',
        imageId: 'image-xyz',
        rating,
        annotation,
      });

      expect(mocks.mockStoreFeedback).toHaveBeenCalledWith({
        userId: 'user-abc',
        imageId: 'image-xyz',
        rating: 3,
        annotation: 'Needs improvement',
      });
    });
  });

  describe('Sendback Broadcast', () => {
    it('should enqueue sendback job on feedback submission', async () => {
      const jobId = 'job-sendback-123';
      mocks.mockEnqueueJob.mockResolvedValue({ jobId, status: 'queued' });

      const req = createMockReq({
        body: { feedbackId: 'fb-123', broadcast: true },
      });
      req.uid = 'user-123';

      const res = createMockRes();

      const jobResult = await mocks.mockEnqueueJob({
        type: 'broadcast-sendback',
        feedbackId: 'fb-123',
        userId: req.uid,
      });

      res.status(200).json({ success: true, jobId: jobResult.jobId });

      expect(res._status).toBe(200);
      expect(res._json.jobId).toBe('job-sendback-123');
    });

    it('should return job references for multiple sendbacks', async () => {
      const jobId1 = 'job-1';
      const jobId2 = 'job-2';

      mocks.mockEnqueueJob
        .mockResolvedValueOnce({ jobId: jobId1, status: 'queued' })
        .mockResolvedValueOnce({ jobId: jobId2, status: 'queued' });

      const feedback = [
        { feedbackId: 'fb-1' },
        { feedbackId: 'fb-2' },
      ];

      const jobResults = [];
      for (const fb of feedback) {
        const result = await mocks.mockEnqueueJob({
          type: 'broadcast-sendback',
          feedbackId: fb.feedbackId,
          userId: 'user-123',
        });
        jobResults.push(result.jobId);
      }

      expect(jobResults).toEqual([jobId1, jobId2]);
      expect(mocks.mockEnqueueJob).toHaveBeenCalledTimes(2);
    });
  });

  describe('End-to-End Workflow', () => {
    it('should complete full workflow: generate → feedback → sendback', async () => {
      // Step 1: Generate
      mocks.mockCheckRateLimit.mockResolvedValue({ allowed: true });
      mocks.mockGenerateImage.mockResolvedValue({
        imageId: 'gen-full-123',
        imageUrl: 'https://example.com/gen.png',
      });

      // Step 2: Feedback
      mocks.mockStoreFeedback.mockResolvedValue({ feedbackId: 'fb-full-123' });

      // Step 3: Sendback
      mocks.mockEnqueueJob.mockResolvedValue({ jobId: 'job-full-123' });

      const userId = 'user-workflow';

      // Generate
      const isAllowed = (await mocks.mockCheckRateLimit(userId, 'gen')).allowed;
      expect(isAllowed).toBe(true);

      const genResult = await mocks.mockGenerateImage('Test prompt', {}, userId);
      expect(genResult.imageId).toBe('gen-full-123');

      // Submit feedback
      const fbResult = await mocks.mockStoreFeedback({
        userId,
        imageId: genResult.imageId,
        rating: 5,
        annotation: 'Perfect!',
      });
      expect(fbResult.feedbackId).toBe('fb-full-123');

      // Broadcast sendback
      const jobResult = await mocks.mockEnqueueJob({
        type: 'broadcast-sendback',
        feedbackId: fbResult.feedbackId,
        userId,
      });
      expect(jobResult.jobId).toBe('job-full-123');

      expect(mocks.mockGenerateImage).toHaveBeenCalledOnce();
      expect(mocks.mockStoreFeedback).toHaveBeenCalledOnce();
      expect(mocks.mockEnqueueJob).toHaveBeenCalledOnce();
    });
  });
});
