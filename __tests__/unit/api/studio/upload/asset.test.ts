/**
 * Generic Asset Upload API Route Tests
 *
 * Tests the generic asset upload endpoint which:
 * - Validates files (format, size, dimensions for images)
 * - Determines asset type from MIME type
 * - Extracts metadata based on asset type
 * - Generates thumbnails for image assets only
 * - Uploads to Firebase Storage
 * - Creates asset record
 * - Handles tags and custom asset types
 *
 * @module __tests__/unit/api/studio/upload/asset
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
  const module = await import('@/pages/api/studio/upload/asset');
  return module.default;
};

// ============================================================================
// HELPERS
// ============================================================================

function createMockReq(body: Record<string, unknown> = {}): any {
  return {
    validatedBody: {
      fileBase64: 'base64-data',
      fileName: 'document.pdf',
      mimeType: 'application/pdf',
      assetType: undefined,
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

describe('asset upload API route', () => {
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
    });

    mocks.mockGenerateThumbnail.mockResolvedValue('thumbnail-base64');

    mocks.mockExtractFontMetadata.mockResolvedValue({
      familyName: 'Arial',
      format: 'ttf',
    });

    mocks.mockUploadToStorage.mockResolvedValue(
      'https://storage.example.com/asset.pdf'
    );

    mocks.mockAddAsset.mockResolvedValue({
      id: 'asset-123',
      userId: 'test-user-123',
      fileName: 'document.pdf',
      mimeType: 'application/pdf',
      assetType: 'document',
      sizeBytes: 500000,
      storageUrl: 'https://storage.example.com/asset.pdf',
      createdAt: '2026-02-10T00:00:00Z',
      updatedAt: '2026-02-10T00:00:00Z',
    });
  });

  it('should return 200 with asset metadata on successful upload', async () => {
    const handler = await importHandler();
    const req = createMockReq();
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    const body = getBody();
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(body.data.assetId).toBe('asset-123');
  });

  it('should validate file and return 400 when invalid', async () => {
    const handler = await importHandler();
    mocks.mockValidateFile.mockReturnValue({
      valid: false,
      errors: ['File exceeds maximum size'],
      sizeBytes: 0,
    });

    const req = createMockReq();
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(400);
    const body = getBody();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_FAILED');
  });

  it('should determine asset type from MIME type when not provided', async () => {
    const handler = await importHandler();
    const req = createMockReq({
      mimeType: 'font/ttf',
      fileName: 'Arial.ttf',
      assetType: undefined,
    });
    const { res, getBody } = createMockRes();

    await handler(req, res);

    const body = getBody();
    expect(body.data.assetType).toBe('font');
  });

  it('should generate thumbnail for image assets', async () => {
    const handler = await importHandler();
    const req = createMockReq({
      mimeType: 'image/jpeg',
      fileName: 'photo.jpg',
    });
    const { res } = createMockRes();

    await handler(req, res);

    expect(mocks.mockGenerateThumbnail).toHaveBeenCalled();
  });

  it('should not generate thumbnail for non-image assets', async () => {
    const handler = await importHandler();
    const req = createMockReq({
      mimeType: 'application/pdf',
      fileName: 'document.pdf',
    });
    const { res } = createMockRes();

    await handler(req, res);

    expect(mocks.mockGenerateThumbnail).not.toHaveBeenCalled();
  });

  it('should upload to Firebase Storage', async () => {
    const handler = await importHandler();
    const req = createMockReq();
    const { res } = createMockRes();

    await handler(req, res);

    expect(mocks.mockUploadToStorage).toHaveBeenCalledWith(
      'test-user-123',
      'asset-123',
      expect.any(Buffer),
      'application/pdf'
    );
  });

  it('should create asset record', async () => {
    const handler = await importHandler();
    const req = createMockReq();
    const { res } = createMockRes();

    await handler(req, res);

    expect(mocks.mockAddAsset).toHaveBeenCalledWith(
      'test-user-123',
      expect.objectContaining({
        fileName: 'document.pdf',
        mimeType: 'application/pdf',
        assetType: 'document',
      })
    );
  });

  it('should handle tags in request', async () => {
    const handler = await importHandler();
    const req = createMockReq({
      tags: ['important', 'archive'],
    });
    const { res } = createMockRes();

    await handler(req, res);

    expect(mocks.mockAddAsset).toHaveBeenCalledWith(
      'test-user-123',
      expect.objectContaining({
        tags: ['important', 'archive'],
      })
    );
  });

  it('should return correct response structure', async () => {
    const handler = await importHandler();
    const req = createMockReq();
    const { res, getBody } = createMockRes();

    await handler(req, res);

    const body = getBody();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('assetId');
    expect(body.data).toHaveProperty('assetType');
    expect(body.data).toHaveProperty('sizeBytes');
    expect(body.data).toHaveProperty('storageUrl');
  });

  it('should have correct rate limit configuration', async () => {
    await importHandler();

    expect(mocks.capturedOptions).toBeDefined();
    expect(mocks.capturedOptions.rateLimit).toBeDefined();
    expect(mocks.capturedOptions.rateLimit.maxRequests).toBe(20);
    expect(mocks.capturedOptions.rateLimit.windowMs).toBe(60000);
  });

  it('should include thumbnailUrl for image assets', async () => {
    const handler = await importHandler();
    mocks.mockUploadToStorage.mockResolvedValue(
      'https://storage.example.com/thumb.jpg'
    );
    const req = createMockReq({
      mimeType: 'image/jpeg',
      fileName: 'photo.jpg',
    });
    const { res, getBody } = createMockRes();

    await handler(req, res);

    const body = getBody();
    expect(body.data.thumbnailUrl).toBeDefined();
  });

  it('should not include thumbnailUrl for non-image assets', async () => {
    const handler = await importHandler();
    const req = createMockReq({
      mimeType: 'application/pdf',
      fileName: 'document.pdf',
    });
    const { res, getBody } = createMockRes();

    await handler(req, res);

    const body = getBody();
    expect(body.data.thumbnailUrl).toBeUndefined();
  });

  it('should extract image metadata for images', async () => {
    const handler = await importHandler();
    mocks.mockExtractImageMetadata.mockResolvedValue({
      width: 800,
      height: 600,
      format: 'png',
      colorSpace: 'srgb',
      hasAlpha: true,
      dpi: 96,
    });
    const req = createMockReq({
      mimeType: 'image/png',
      fileName: 'image.png',
    });
    const { res, getBody } = createMockRes();

    await handler(req, res);

    const body = getBody();
    expect(body.data.metadata).toBeDefined();
    expect(body.data.metadata.width).toBe(800);
    expect(body.data.metadata.height).toBe(600);
  });

  it('should extract font metadata for fonts', async () => {
    const handler = await importHandler();
    mocks.mockExtractFontMetadata.mockResolvedValue({
      familyName: 'Helvetica',
      format: 'otf',
    });
    const req = createMockReq({
      mimeType: 'font/otf',
      fileName: 'Helvetica.otf',
    });
    const { res, getBody } = createMockRes();

    await handler(req, res);

    const body = getBody();
    expect(body.data.metadata).toBeDefined();
    expect(body.data.metadata.familyName).toBe('Helvetica');
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
    const req = createMockReq({
      mimeType: 'image/jpeg',
      fileName: 'large.jpg',
    });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(400);
    const body = getBody();
    expect(body.error.code).toBe('DIMENSION_EXCEEDED');
  });

  it('should support custom assetType override', async () => {
    const handler = await importHandler();
    const req = createMockReq({
      mimeType: 'image/jpeg',
      fileName: 'photo.jpg',
      assetType: 'custom-type',
    });
    const { res, getBody } = createMockRes();

    await handler(req, res);

    const body = getBody();
    expect(body.data.assetType).toBe('custom-type');
  });

  it('should include format in response', async () => {
    const handler = await importHandler();
    const req = createMockReq();
    const { res, getBody } = createMockRes();

    await handler(req, res);

    const body = getBody();
    expect(body.data.format).toBeDefined();
  });

  it('should handle storage errors gracefully', async () => {
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
    expect(body.error.code).toBe('UPLOAD_FAILED');
  });

  it('should log successful asset uploads', async () => {
    const handler = await importHandler();
    const req = createMockReq();
    const { res } = createMockRes();

    await handler(req, res);

    expect(mocks.mockLogInfo).toHaveBeenCalled();
    const calls = mocks.mockLogInfo.mock.calls;
    expect(calls.some((c) => c[0].includes('upload'))).toBe(true);
  });
});
