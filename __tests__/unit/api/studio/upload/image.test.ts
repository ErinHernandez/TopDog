/**
 * Image Upload API Route Tests
 *
 * Tests the image upload endpoint which:
 * - Validates image files (format, size, dimensions)
 * - Extracts image metadata (width, height, color space, etc.)
 * - Generates thumbnail
 * - Uploads original and thumbnail to Firebase Storage
 * - Creates asset record in Firestore
 * - Returns file metadata and URLs
 *
 * @module __tests__/unit/api/studio/upload/image
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================================
// MOCKS — hoisted so they work with vi.mock()
// ============================================================================

const mocks = vi.hoisted(() => ({
  mockValidateFile: vi.fn(),
  mockExtractImageMetadata: vi.fn(),
  mockGenerateThumbnail: vi.fn(),
  mockExtractFontMetadata: vi.fn(),
  mockAddAsset: vi.fn(),
  mockUploadToStorage: vi.fn(),
  mockGetAsset: vi.fn(),
  mockSearchAssets: vi.fn(),
  mockDeleteAsset: vi.fn(),
  mockLogInfo: vi.fn(),
  mockLogWarn: vi.fn(),
  mockLogError: vi.fn(),
  capturedSchema: null as any,
  capturedOptions: null as any,
  capturedHandler: null as ((req: any, res: any) => Promise<void>) | null,
}));

// Mock file processing service
vi.mock('@/lib/studio/services/fileProcessingService', () => ({
  getFileProcessingService: vi.fn(() => ({
    validateFile: mocks.mockValidateFile,
    extractImageMetadata: mocks.mockExtractImageMetadata,
    generateThumbnail: mocks.mockGenerateThumbnail,
    extractFontMetadata: mocks.mockExtractFontMetadata,
  })),
}));

// Mock asset management service
vi.mock('@/lib/studio/services/assetManagementService', () => ({
  getAssetManagementService: vi.fn(() => ({
    addAsset: mocks.mockAddAsset,
    uploadToStorage: mocks.mockUploadToStorage,
    getAsset: mocks.mockGetAsset,
    searchAssets: mocks.mockSearchAssets,
    deleteAsset: mocks.mockDeleteAsset,
  })),
}));

// Mock server logger
vi.mock('@/lib/studio/services/serverLogger', () => ({
  serverLogger: {
    info: mocks.mockLogInfo,
    warn: mocks.mockLogWarn,
    error: mocks.mockLogError,
    debug: vi.fn(),
  },
}));

// Mock createAuthenticatedRoute to capture schema and options
vi.mock('@/lib/studio/api/createApiHandler', () => ({
  createAuthenticatedRoute: vi.fn((schema: any, handler: any, options?: any) => {
    mocks.capturedSchema = schema;
    mocks.capturedOptions = options;
    mocks.capturedHandler = handler;
    return handler;
  }),
}));

// ============================================================================
// IMPORTS (after mocks)
// ============================================================================

const importHandler = async () => {
  const module = await import('@/pages/api/studio/upload/image');
  return module.default;
};

// ============================================================================
// HELPERS
// ============================================================================

function createMockReq(body: Record<string, unknown> = {}): any {
  return {
    validatedBody: {
      fileBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
      fileName: 'photo.jpg',
      mimeType: 'image/jpeg',
      tags: [],
      ...body,
    },
    uid: 'test-user-123',
    requestId: 'req-123',
    method: 'POST',
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
  return {
    res,
    getStatus: () => statusCode,
    getBody: () => responseBody,
  };
}

// ============================================================================
// TESTS
// ============================================================================

describe('image upload API route', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Set default mock return values
    mocks.mockValidateFile.mockReturnValue({
      valid: true,
      errors: [],
      sizeBytes: 500000,
    });

    mocks.mockExtractImageMetadata.mockResolvedValue({
      width: 1920,
      height: 1080,
      format: 'jpeg',
      colorSpace: 'srgb',
      hasAlpha: false,
      dpi: 72,
      sizeBytes: 500000,
    });

    mocks.mockGenerateThumbnail.mockResolvedValue('thumbnail-base64-data');

    mocks.mockUploadToStorage.mockResolvedValue(
      'https://storage.example.com/image.jpg'
    );

    mocks.mockAddAsset.mockResolvedValue({
      id: 'asset-123',
      userId: 'test-user-123',
      fileName: 'photo.jpg',
      mimeType: 'image/jpeg',
      assetType: 'image',
      sizeBytes: 500000,
      metadata: {
        width: 1920,
        height: 1080,
        colorSpace: 'srgb',
        hasAlpha: false,
        dpi: 72,
        format: 'jpeg',
      },
      storageUrl: 'https://storage.example.com/image.jpg',
      createdAt: '2026-02-10T00:00:00Z',
      updatedAt: '2026-02-10T00:00:00Z',
    });
  });

  it('should return 200 with file metadata on successful upload', async () => {
    const handler = await importHandler();
    const req = createMockReq();
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    const body = getBody();
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(body.data.fileId).toBe('asset-123');
    expect(body.data.format).toBe('jpeg');
    expect(body.data.dimensions).toEqual({ width: 1920, height: 1080 });
  });

  it('should validate file and return 400 when validation fails', async () => {
    const handler = await importHandler();
    mocks.mockValidateFile.mockReturnValue({
      valid: false,
      errors: ['File exceeds maximum size of 100MB'],
      sizeBytes: 0,
    });

    const req = createMockReq();
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(400);
    const body = getBody();
    expect(body.success).toBe(false);
    expect(body.error).toBeDefined();
    expect(body.error.code).toBe('VALIDATION_FAILED');
  });

  it('should extract image metadata (width, height, format, etc.)', async () => {
    const handler = await importHandler();
    const req = createMockReq();
    const { res, getBody } = createMockRes();

    await handler(req, res);

    const body = getBody();
    expect(body.data.dimensions.width).toBe(1920);
    expect(body.data.dimensions.height).toBe(1080);
    expect(body.data.format).toBe('jpeg');
    expect(body.data.colorSpace).toBe('srgb');
    expect(body.data.dpi).toBe(72);
  });

  it('should generate thumbnail for uploaded image', async () => {
    const handler = await importHandler();
    const req = createMockReq();
    const { res } = createMockRes();

    await handler(req, res);

    expect(mocks.mockGenerateThumbnail).toHaveBeenCalledWith(
      req.validatedBody.fileBase64,
      300
    );
  });

  it('should upload original to Firebase Storage', async () => {
    const handler = await importHandler();
    const req = createMockReq();
    const { res } = createMockRes();

    await handler(req, res);

    expect(mocks.mockUploadToStorage).toHaveBeenCalledWith(
      'test-user-123',
      'asset-123',
      expect.any(Buffer),
      'image/jpeg'
    );
  });

  it('should create asset record in Firestore via assetManagementService', async () => {
    const handler = await importHandler();
    const req = createMockReq();
    const { res } = createMockRes();

    await handler(req, res);

    expect(mocks.mockAddAsset).toHaveBeenCalledWith(
      'test-user-123',
      expect.objectContaining({
        fileName: 'photo.jpg',
        mimeType: 'image/jpeg',
        assetType: 'image',
      })
    );
  });

  it('should return thumbnailUrl and storageUrl in response', async () => {
    const handler = await importHandler();
    const req = createMockReq();
    const { res, getBody } = createMockRes();

    await handler(req, res);

    const body = getBody();
    expect(body.data.thumbnailUrl).toBeDefined();
    expect(body.data.storageUrl).toBeDefined();
    expect(typeof body.data.thumbnailUrl).toBe('string');
    expect(typeof body.data.storageUrl).toBe('string');
  });

  it('should handle file processing errors with 400 status', async () => {
    const handler = await importHandler();
    mocks.mockExtractImageMetadata.mockRejectedValue(
      new Error('Invalid image format')
    );

    const req = createMockReq();
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(500);
    const body = getBody();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UPLOAD_FAILED');
  });

  it('should handle storage upload errors with 500 status', async () => {
    const handler = await importHandler();
    mocks.mockUploadToStorage.mockRejectedValue(
      new Error('Storage upload failed')
    );

    const req = createMockReq();
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(500);
    const body = getBody();
    expect(body.success).toBe(false);
  });

  it('should have correct rate limit configuration', async () => {
    await importHandler();

    expect(mocks.capturedOptions).toBeDefined();
    expect(mocks.capturedOptions.rateLimit).toBeDefined();
    expect(mocks.capturedOptions.rateLimit.maxRequests).toBe(20);
    expect(mocks.capturedOptions.rateLimit.windowMs).toBe(60000);
  });

  it('should log successful upload with serverLogger', async () => {
    const handler = await importHandler();
    const req = createMockReq();
    const { res } = createMockRes();

    await handler(req, res);

    expect(mocks.mockLogInfo).toHaveBeenCalled();
    const calls = mocks.mockLogInfo.mock.calls;
    expect(calls.some((c) => c[0].includes('upload completed'))).toBe(true);
  });

  it('should reject uploads with invalid MIME type', async () => {
    const handler = await importHandler();
    const req = createMockReq({
      mimeType: 'application/x-executable',
    });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(400);
    const body = getBody();
    expect(body.error.code).toBe('INVALID_MIME_TYPE');
  });

  it('should reject images exceeding dimension limits', async () => {
    const handler = await importHandler();
    mocks.mockExtractImageMetadata.mockResolvedValue({
      width: 10000,
      height: 10000,
      format: 'jpeg',
      colorSpace: 'srgb',
      hasAlpha: false,
      dpi: 72,
    });

    const req = createMockReq();
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(400);
    const body = getBody();
    expect(body.error.code).toBe('DIMENSION_EXCEEDED');
  });

  it('should include tags in asset metadata when provided', async () => {
    const handler = await importHandler();
    const req = createMockReq({
      tags: ['landscape', 'nature'],
    });
    const { res } = createMockRes();

    await handler(req, res);

    expect(mocks.mockAddAsset).toHaveBeenCalledWith(
      'test-user-123',
      expect.objectContaining({
        tags: ['landscape', 'nature'],
      })
    );
  });
});
