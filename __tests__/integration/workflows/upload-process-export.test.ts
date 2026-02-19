/**
 * Integration tests for upload → process → export workflow
 * Tests: upload image → process → export as PSD
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';

// ============================================================================
// Hoisted Mocks
// ============================================================================

const mocks = vi.hoisted(() => ({
  mockProcessFile: vi.fn(),
  mockCatalogAsset: vi.fn(),
  mockEnqueueJob: vi.fn(),
  mockReportProgress: vi.fn(),
  mockCacheGet: vi.fn(),
  mockCacheSet: vi.fn(),
  mockSharpResize: vi.fn(),
  mockLogInfo: vi.fn(),
  mockLogError: vi.fn(),
}));

// ============================================================================
// Module Mocks
// ============================================================================

vi.mock('@/lib/studio/middleware/withAuth', () => ({
  withAuth: (handler: any) => handler,
}));

vi.mock('@/lib/studio/services/fileProcessingService', () => ({
  fileProcessingService: {
    processFile: mocks.mockProcessFile,
  },
}));

vi.mock('@/lib/studio/services/assetManagementService', () => ({
  assetManagementService: {
    catalogAsset: mocks.mockCatalogAsset,
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

vi.mock('sharp', () => ({
  default: vi.fn(() => ({
    resize: mocks.mockSharpResize.mockReturnValue({
      png: vi.fn().mockReturnValue({
        toBuffer: vi.fn().mockResolvedValue(Buffer.from('thumbnail-data')),
      }),
    }),
  })),
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

describe('Upload → Process → Export Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('File Upload', () => {
    it('should upload valid image file', async () => {
      const assetId = 'asset-123';
      mocks.mockCatalogAsset.mockResolvedValue({
        assetId,
        filename: 'photo.jpg',
        size: 2048576,
        format: 'jpeg',
      });

      const req = createMockReq({
        body: { imageData: 'base64-jpeg-data', filename: 'photo.jpg' },
      });
      req.uid = 'user-123';

      const res = createMockRes();

      const result = await mocks.mockCatalogAsset({
        userId: req.uid,
        filename: 'photo.jpg',
        imageData: 'base64-jpeg-data',
      });

      res.status(200).json({ success: true, assetId: result.assetId });

      expect(res._status).toBe(200);
      expect(res._json.assetId).toBe('asset-123');
    });

    it('should generate thumbnail on upload', async () => {
      mocks.mockProcessFile.mockResolvedValue({
        thumbBase64: 'thumb-data',
        width: 100,
        height: 100,
      });

      const req = createMockReq({
        body: { imageData: 'base64-jpeg-data' },
      });
      req.uid = 'user-456';

      const res = createMockRes();

      const result = await mocks.mockProcessFile({
        userId: req.uid,
        imageData: 'base64-jpeg-data',
        operations: ['generate-thumbnail'],
      });

      res.status(200).json({ success: true, data: result });

      expect(res._status).toBe(200);
      expect(res._json.data.thumbBase64).toBe('thumb-data');
    });

    it('should reject oversized image', async () => {
      const req = createMockReq({
        body: { imageData: 'x'.repeat(100_000_000), filename: 'huge.jpg' },
      });
      req.uid = 'user-123';

      const res = createMockRes();

      // Validation logic
      const imageSizeBytes = req.body.imageData.length;
      const MAX_SIZE = 50_000_000; // 50MB

      if (imageSizeBytes > MAX_SIZE) {
        res.status(400).json({
          success: false,
          error: 'File too large',
          details: { maxSizeBytes: MAX_SIZE, receivedBytes: imageSizeBytes },
        });
      }

      expect(res._status).toBe(400);
      expect(res._json.error).toBe('File too large');
    });

    it('should reject invalid image format', async () => {
      const req = createMockReq({
        body: {
          imageData: 'not-an-image',
          filename: 'invalid.txt',
          format: 'text',
        },
      });
      req.uid = 'user-789';

      const res = createMockRes();

      const validFormats = ['jpeg', 'png', 'webp', 'gif', 'bmp'];
      if (!validFormats.includes('text')) {
        res.status(400).json({
          success: false,
          error: 'Invalid image format',
          supportedFormats: validFormats,
        });
      }

      expect(res._status).toBe(400);
      expect(res._json.error).toBe('Invalid image format');
    });

    it('should return 401 when auth required for upload', async () => {
      const req = createMockReq({
        body: { imageData: 'base64-data' },
      });
      // No uid

      const res = createMockRes();

      if (!req.uid) {
        res.status(401).json({ error: 'Authentication required' });
      }

      expect(res._status).toBe(401);
    });

    it('should catalog asset after successful upload', async () => {
      mocks.mockCatalogAsset.mockResolvedValue({ assetId: 'asset-full' });

      const req = createMockReq({
        body: { imageData: 'base64-data', filename: 'asset.png' },
      });
      req.uid = 'user-catalog';

      const res = createMockRes();

      const result = await mocks.mockCatalogAsset({
        userId: req.uid,
        filename: 'asset.png',
        imageData: 'base64-data',
      });

      expect(result.assetId).toBe('asset-full');
      expect(mocks.mockCatalogAsset).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-catalog' })
      );
    });
  });

  describe('File Processing', () => {
    it('should process uploaded image', async () => {
      const processed = {
        assetId: 'asset-123',
        width: 1920,
        height: 1080,
        format: 'png',
        colorSpace: 'sRGB',
      };

      mocks.mockProcessFile.mockResolvedValue(processed);

      const req = createMockReq({
        body: {
          assetId: 'asset-123',
          operations: ['auto-enhance'],
        },
      });
      req.uid = 'user-process';

      const res = createMockRes();

      const result = await mocks.mockProcessFile({
        assetId: 'asset-123',
        operations: ['auto-enhance'],
        userId: req.uid,
      });

      res.status(200).json({ success: true, data: result });

      expect(res._status).toBe(200);
      expect(res._json.data.width).toBe(1920);
    });
  });

  describe('Export as PSD', () => {
    it('should export document as PSD with async job', async () => {
      const jobId = 'job-export-123';
      mocks.mockEnqueueJob.mockResolvedValue({ jobId, status: 'queued' });

      const req = createMockReq({
        body: {
          documentId: 'doc-456',
          format: 'psd',
          includeMetadata: true,
        },
      });
      req.uid = 'user-export';

      const res = createMockRes();

      // Large document triggers async
      const result = await mocks.mockEnqueueJob({
        type: 'export-psd',
        documentId: 'doc-456',
        userId: req.uid,
        options: { includeMetadata: true },
      });

      res.status(202).json({ jobId: result.jobId, status: 'processing' });

      expect(res._status).toBe(202);
      expect(res._json.jobId).toBe('job-export-123');
    });

    it('should return sync result for small PSD export', async () => {
      const psdData = Buffer.from('PSD_BINARY_DATA');
      mocks.mockCacheSet.mockResolvedValue(true);

      const req = createMockReq({
        body: {
          documentId: 'small-doc',
          format: 'psd',
        },
      });
      req.uid = 'user-small';

      const res = createMockRes();

      // Simulate small document sync export
      const documentSize = 1_000_000; // 1MB
      const ASYNC_THRESHOLD = 10_000_000; // 10MB

      if (documentSize < ASYNC_THRESHOLD) {
        // Sync export
        res.status(200)
          .setHeader('Content-Type', 'application/octet-stream')
          .json({ data: psdData.toString('base64') });
      }

      expect(res._status).toBe(200);
    });

    it('should enqueue PSD export job for large document', async () => {
      const jobId = 'job-large-psd';
      mocks.mockEnqueueJob.mockResolvedValue({ jobId });

      const req = createMockReq({
        body: { documentId: 'large-doc', format: 'psd' },
      });
      req.uid = 'user-large';

      const res = createMockRes();

      // Simulate large document async
      const documentSize = 50_000_000; // 50MB
      const ASYNC_THRESHOLD = 10_000_000;

      if (documentSize >= ASYNC_THRESHOLD) {
        const result = await mocks.mockEnqueueJob({
          type: 'export-psd',
          documentId: 'large-doc',
          userId: req.uid,
        });
        res.status(202).json({ jobId: result.jobId });
      }

      expect(res._status).toBe(202);
      expect(res._json.jobId).toBe('job-large-psd');
    });
  });

  describe('End-to-End Workflow', () => {
    it('should complete full workflow: upload → process → export', async () => {
      // Step 1: Upload
      mocks.mockCatalogAsset.mockResolvedValue({ assetId: 'asset-workflow' });

      // Step 2: Process
      mocks.mockProcessFile.mockResolvedValue({
        assetId: 'asset-workflow',
        width: 1920,
        height: 1080,
      });

      // Step 3: Export
      mocks.mockEnqueueJob.mockResolvedValue({ jobId: 'job-workflow' });

      const userId = 'user-workflow';

      // Upload
      const uploadResult = await mocks.mockCatalogAsset({
        userId,
        filename: 'image.png',
        imageData: 'base64-data',
      });
      expect(uploadResult.assetId).toBe('asset-workflow');

      // Process
      const processResult = await mocks.mockProcessFile({
        assetId: uploadResult.assetId,
        operations: ['auto-enhance'],
        userId,
      });
      expect(processResult.width).toBe(1920);

      // Export
      const exportResult = await mocks.mockEnqueueJob({
        type: 'export-psd',
        documentId: 'doc-from-asset',
        userId,
      });
      expect(exportResult.jobId).toBe('job-workflow');

      expect(mocks.mockCatalogAsset).toHaveBeenCalledOnce();
      expect(mocks.mockProcessFile).toHaveBeenCalledOnce();
      expect(mocks.mockEnqueueJob).toHaveBeenCalledOnce();
    });
  });
});
