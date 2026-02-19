/**
 * File Delete Route Tests
 * Tests deletion of user files from Firestore and Firebase Storage.
 * Validates ownership verification (IDOR prevention), storage cleanup,
 * and graceful error handling.
 * @module __tests__/unit/api/studio/files/delete.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks ───────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => {
  const mockDocGet = vi.fn();
  const mockDocDelete = vi.fn().mockResolvedValue(undefined);
  const mockDocRef = { get: mockDocGet, delete: mockDocDelete };
  const mockCollection = vi.fn(() => ({
    doc: vi.fn(() => mockDocRef),
  }));
  const mockFileDelete = vi.fn().mockResolvedValue(undefined);
  const mockBucketFile = vi.fn(() => ({ delete: mockFileDelete }));
  const mockBucket = vi.fn(() => ({ file: mockBucketFile }));

  return {
    mockDocGet,
    mockDocDelete,
    mockDocRef,
    mockCollection,
    mockFileDelete,
    mockBucketFile,
    mockBucket,
  };
});

// ── Module mocks ────────────────────────────────────────────────────────────

vi.mock('@/lib/firebase/server', () => ({
  getAdminDb: vi.fn(() => ({
    collection: mocks.mockCollection,
  })),
  getAdminStorage: vi.fn(() => ({
    bucket: mocks.mockBucket,
  })),
  getAdminAuth: vi.fn(() => ({
    verifyIdToken: vi.fn().mockResolvedValue({
      uid: 'test-user-123',
      email: 'test@example.com',
      email_verified: true,
    }),
  })),
}));

vi.mock('@/lib/studio/middleware/middlewareChain', () => ({
  withMiddleware: vi.fn((_middlewares: unknown[], handler: unknown) => handler),
}));

vi.mock('@/lib/studio/middleware/cors', () => ({
  createCorsMiddleware: vi.fn(() => vi.fn()),
}));

vi.mock('@/lib/studio/middleware/errorHandler', () => ({
  createErrorHandler: vi.fn(() => vi.fn()),
}));

vi.mock('@/lib/studio/middleware/requestLogger', () => ({
  createRequestLogger: vi.fn(() => vi.fn()),
}));

vi.mock('@/lib/studio/middleware/rateLimitingMiddleware', () => ({
  createRateLimitMiddleware: vi.fn(() => vi.fn()),
}));

// Mock withAuth as pass-through so we test the handler logic directly.
// The real withAuth middleware is tested separately in withAuth.test.ts.
vi.mock('@/lib/studio/middleware/withAuth', () => ({
  withAuth: vi.fn((handler: any) => handler),
}));

vi.mock('@/lib/studio/api/wrapRoute', () => ({
  wrapProtectedRoute: vi.fn((handler: any) => handler),
}));

// Import handler after mocks are established
import handler from '@/pages/api/studio/files/delete';

// ── Test helpers ────────────────────────────────────────────────────────────

function createMockReq(overrides: Record<string, unknown> = {}): any {
  return {
    method: 'DELETE',
    query: {},
    headers: { authorization: 'Bearer test-token' },
    uid: 'test-user-123',
    ...overrides,
  };
}

function createMockRes(): {
  res: any;
  getStatus: () => number;
  getBody: () => any;
} {
  let statusCode = 200;
  let responseBody: any = null;
  const res: any = {
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

function mockFileDoc(data: Record<string, unknown> | null) {
  if (data === null) {
    mocks.mockDocGet.mockResolvedValue({ exists: false, data: () => undefined });
  } else {
    mocks.mockDocGet.mockResolvedValue({ exists: true, data: () => data });
  }
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('DELETE /api/studio/files/delete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockDocDelete.mockResolvedValue(undefined);
    mocks.mockFileDelete.mockResolvedValue(undefined);
  });

  // ── Method enforcement ──────────────────────────────────────────────────

  it('should reject non-DELETE methods', async () => {
    const req = createMockReq({ method: 'GET' });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(405);
    expect(getBody().error).toBe('Method not allowed');
  });

  it('should reject POST method', async () => {
    const req = createMockReq({ method: 'POST' });
    const { res, getStatus } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(405);
  });

  // ── Authentication ──────────────────────────────────────────────────────

  it('should return 401 when userId is missing', async () => {
    const req = createMockReq({ uid: undefined, query: { fileId: 'file-123' } });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(401);
    expect(getBody().error).toBe('Authentication required');
  });

  // ── Parameter validation ────────────────────────────────────────────────

  it('should return 400 when fileId is missing', async () => {
    const req = createMockReq({ query: {} });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(400);
    expect(getBody().error).toBe('Missing fileId parameter');
  });

  it('should return 400 when fileId is an array', async () => {
    const req = createMockReq({ query: { fileId: ['a', 'b'] } });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(400);
    expect(getBody().error).toBe('Missing fileId parameter');
  });

  it('should accept projectId as alias for fileId', async () => {
    mockFileDoc({
      userId: 'test-user-123',
      storagePath: 'user_files/test-user-123/file-compat/image.png',
    });

    const req = createMockReq({ query: { projectId: 'file-compat' } });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    expect(getBody().success).toBe(true);
    expect(getBody().fileId).toBe('file-compat');
  });

  it('should reject fileId containing path traversal characters', async () => {
    const req = createMockReq({ query: { fileId: '../../../etc/passwd' } });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(400);
    expect(getBody().error).toBe('Invalid fileId');
  });

  it('should reject fileId containing forward slashes', async () => {
    const req = createMockReq({ query: { fileId: 'some/nested/id' } });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(400);
    expect(getBody().error).toBe('Invalid fileId');
  });

  // ── Ownership verification (T.4.4 — IDOR prevention) ───────────────────

  it('should return 404 when file does not exist', async () => {
    mockFileDoc(null);

    const req = createMockReq({ query: { fileId: 'nonexistent-file' } });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(404);
    expect(getBody().error).toBe('File not found');
  });

  it('should return 404 when file belongs to another user (IDOR prevention)', async () => {
    mockFileDoc({
      userId: 'other-user-456',
      storagePath: 'user_files/other-user-456/file-123/secret.png',
    });

    const req = createMockReq({ query: { fileId: 'file-123' } });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(404);
    expect(getBody().error).toBe('File not found');
    // Crucially: Storage and Firestore delete should NOT have been called
    expect(mocks.mockFileDelete).not.toHaveBeenCalled();
    expect(mocks.mockDocDelete).not.toHaveBeenCalled();
  });

  // ── Successful deletion ─────────────────────────────────────────────────

  it('should delete file from both Storage and Firestore on success', async () => {
    const storagePath = 'user_files/test-user-123/file-abc/photo.jpg';
    mockFileDoc({
      userId: 'test-user-123',
      storagePath,
      fileName: 'photo.jpg',
    });

    const req = createMockReq({ query: { fileId: 'file-abc' } });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    expect(getBody().success).toBe(true);
    expect(getBody().fileId).toBe('file-abc');

    // Verify Storage deletion was called with correct path
    expect(mocks.mockBucketFile).toHaveBeenCalledWith(storagePath);
    expect(mocks.mockFileDelete).toHaveBeenCalledOnce();

    // Verify Firestore document deletion
    expect(mocks.mockDocDelete).toHaveBeenCalledOnce();
  });

  it('should still delete Firestore doc when storagePath is missing', async () => {
    mockFileDoc({
      userId: 'test-user-123',
      // No storagePath — file may have been uploaded metadata-only
    });

    const req = createMockReq({ query: { fileId: 'file-no-storage' } });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    expect(getBody().success).toBe(true);

    // Storage should NOT have been called
    expect(mocks.mockBucketFile).not.toHaveBeenCalled();
    // Firestore doc should still be deleted
    expect(mocks.mockDocDelete).toHaveBeenCalledOnce();
  });

  // ── Graceful error handling ─────────────────────────────────────────────

  it('should continue Firestore deletion when Storage deletion fails', async () => {
    mockFileDoc({
      userId: 'test-user-123',
      storagePath: 'user_files/test-user-123/file-err/broken.png',
    });
    mocks.mockFileDelete.mockRejectedValue(new Error('Storage unavailable'));

    const req = createMockReq({ query: { fileId: 'file-err' } });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    // Should still succeed — Storage failure is non-fatal
    expect(getStatus()).toBe(200);
    expect(getBody().success).toBe(true);

    // Firestore deletion should still proceed
    expect(mocks.mockDocDelete).toHaveBeenCalledOnce();
  });

  it('should return 500 when Firestore read fails', async () => {
    mocks.mockDocGet.mockRejectedValue(new Error('Firestore connection timeout'));

    const req = createMockReq({ query: { fileId: 'file-timeout' } });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(500);
    expect(getBody().success).toBe(false);
    // Error message should be generic (don't leak internals)
    expect(getBody().error).toBe('Failed to delete file');
  });

  it('should return 500 when Firestore delete fails', async () => {
    mockFileDoc({
      userId: 'test-user-123',
      storagePath: 'user_files/test-user-123/file-delerr/image.png',
    });
    mocks.mockDocDelete.mockRejectedValue(new Error('Write permission denied'));

    const req = createMockReq({ query: { fileId: 'file-delerr' } });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(500);
    expect(getBody().success).toBe(false);
    expect(getBody().error).toBe('Failed to delete file');
  });

  // ── Edge cases ──────────────────────────────────────────────────────────

  it('should handle file with empty storagePath', async () => {
    mockFileDoc({
      userId: 'test-user-123',
      storagePath: '',
    });

    const req = createMockReq({ query: { fileId: 'file-empty-path' } });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    expect(getBody().success).toBe(true);
    // Empty string is falsy, so storage deletion should be skipped
    expect(mocks.mockBucketFile).not.toHaveBeenCalled();
    expect(mocks.mockDocDelete).toHaveBeenCalledOnce();
  });

  it('should prefer fileId over projectId when both are provided', async () => {
    mockFileDoc({
      userId: 'test-user-123',
      storagePath: 'user_files/test-user-123/file-preferred/img.png',
    });

    const req = createMockReq({
      query: { fileId: 'file-preferred', projectId: 'file-ignored' },
    });
    const { res, getStatus, getBody } = createMockRes();

    await handler(req, res);

    expect(getStatus()).toBe(200);
    expect(getBody().fileId).toBe('file-preferred');
  });
});
