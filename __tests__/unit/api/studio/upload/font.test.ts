/**
 * Font Upload API Route Tests
 *
 * Tests the font upload endpoint which:
 * - Validates font files (format, size)
 * - Extracts font metadata (family name, format)
 * - Uploads font file to Firebase Storage
 * - Creates asset record in Firestore
 * - Returns font metadata and storage URL
 *
 * @module __tests__/unit/api/studio/upload/font
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
  const module = await import('@/pages/api/studio/upload/font');
  return module.default;
};

// ============================================================================
// HELPERS
// ============================================================================

function createMockReq(body: Record<string, unknown> = {}): any {
  return {
    validatedBody: {
      fileBase64: 'base64-font-data',
      fileName: 'Arial.ttf',
      mimeType: 'font/ttf',
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

describe('font upload API route', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Set default mock return values
    mocks.mockValidateFile.mockReturnValue({
      valid: true,
      errors: [],
      sizeBytes: 500000,
    });

    mocks.mockExtractFontMetadata.mockResolvedValue({
      familyName: 'Arial',
      format: 'ttf',
    });

    mocks.mockUploadToStorage.mockResolvedValue(
      'https://storage.example.com/font.ttf'
    );

    mocks.mockAddAsset.mockResolvedValue({
      id: 'asset-123',
      userId: 'test-user-123',
      fileName: 'Arial.ttf',
      mimeType: 'font/ttf',
      assetType: 'font',
      sizeBytes: 500000,
      metadata: {
        familyName: 'Arial',
        format: 'ttf',
      },
      storageUrl: 'https://storage.example.com/font.ttf',
      createdAt: '2026-02-10T00:00:00Z',
      updatedAt: '2026-02-10T00:00:00Z',
    });
  });

  it('should return 200 with font metadata on successful upload', async () => {
    const handler = await importHandler();
    const req = createMockReq();
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    const body = getBody();
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(body.data.fontId).toBe('asset-123');
    expect(body.data.familyName).toBe('Arial');
  });

  it('should validate font file and return 400 when invalid', async () => {
    const handler = await importHandler();
    mocks.mockValidateFile.mockReturnValue({
      valid: false,
      errors: ['File exceeds maximum size of 10MB'],
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

  it('should extract font metadata (family name, format)', async () => {
    const handler = await importHandler();
    const req = createMockReq();
    const { res, getBody } = createMockRes();

    await handler(req, res);

    const body = getBody();
    expect(body.data.familyName).toBe('Arial');
    expect(body.data.format).toBe('ttf');
  });

  it('should upload font to Firebase Storage', async () => {
    const handler = await importHandler();
    const req = createMockReq();
    const { res } = createMockRes();

    await handler(req, res);

    expect(mocks.mockUploadToStorage).toHaveBeenCalledWith(
      'test-user-123',
      'asset-123',
      expect.any(Buffer),
      'font/ttf'
    );
  });

  it('should create asset record for font', async () => {
    const handler = await importHandler();
    const req = createMockReq();
    const { res } = createMockRes();

    await handler(req, res);

    expect(mocks.mockAddAsset).toHaveBeenCalledWith(
      'test-user-123',
      expect.objectContaining({
        fileName: 'Arial.ttf',
        mimeType: 'font/ttf',
        assetType: 'font',
      })
    );
  });

  it('should return fontId and familyName in response', async () => {
    const handler = await importHandler();
    const req = createMockReq();
    const { res, getBody } = createMockRes();

    await handler(req, res);

    const body = getBody();
    expect(body.data.fontId).toBe('asset-123');
    expect(body.data.familyName).toBe('Arial');
  });

  it('should handle validation errors gracefully', async () => {
    const handler = await importHandler();
    mocks.mockValidateFile.mockReturnValue({
      valid: false,
      errors: ['Invalid font format', 'File is corrupted'],
      sizeBytes: 0,
    });

    const req = createMockReq();
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(400);
    const body = getBody();
    expect(body.error).toBeDefined();
    expect(body.error.message).toContain('Invalid font format');
  });

  it('should have correct rate limit configuration', async () => {
    await importHandler();

    expect(mocks.capturedOptions).toBeDefined();
    expect(mocks.capturedOptions.rateLimit).toBeDefined();
    expect(mocks.capturedOptions.rateLimit.maxRequests).toBe(15);
    expect(mocks.capturedOptions.rateLimit.windowMs).toBe(60000);
  });

  it('should reject uploads with invalid MIME type', async () => {
    const handler = await importHandler();
    const req = createMockReq({
      mimeType: 'application/pdf',
    });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(400);
    const body = getBody();
    expect(body.error.code).toBe('INVALID_MIME_TYPE');
  });

  it('should include storage URL in response', async () => {
    const handler = await importHandler();
    const req = createMockReq();
    const { res, getBody } = createMockRes();

    await handler(req, res);

    const body = getBody();
    expect(body.data.storageUrl).toBeDefined();
    expect(typeof body.data.storageUrl).toBe('string');
    expect(body.data.storageUrl.startsWith('http')).toBe(true);
  });

  it('should include file size in response', async () => {
    const handler = await importHandler();
    const req = createMockReq();
    const { res, getBody } = createMockRes();

    await handler(req, res);

    const body = getBody();
    expect(body.data.sizeBytes).toBe(500000);
  });

  it('should log successful font upload', async () => {
    const handler = await importHandler();
    const req = createMockReq();
    const { res } = createMockRes();

    await handler(req, res);

    expect(mocks.mockLogInfo).toHaveBeenCalled();
    const calls = mocks.mockLogInfo.mock.calls;
    expect(calls.some((c) => c[0].includes('upload completed'))).toBe(true);
  });
});
