/**
 * Tests for /api/auth/verify-admin endpoint
 * 
 * Tests cover:
 * - Request validation
 * - Authentication
 * - Admin verification
 * - Error handling
 */

jest.mock('../../../lib/apiErrorHandler', () => ({
  withErrorHandling: jest.fn((req, res, handler) => handler(req, res, {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  })),
}));

jest.mock('../../../lib/adminAuth', () => ({
  verifyAdminAccess: jest.fn(),
}));

const { createMockRequest, createMockResponse } = require('../../factories');
const { verifyAdminAccess } = require('../../../lib/adminAuth');

describe('/api/auth/verify-admin', () => {
  let handler;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    verifyAdminAccess.mockResolvedValue({
      isAdmin: false,
      error: 'Access denied',
    });

    // Import handler after mocks are set up
    handler = require('../../../pages/api/auth/verify-admin').default;
  });

  describe('Request Validation', () => {
    it('should reject non-GET requests', async () => {
      const req = createMockRequest({ method: 'POST' });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(405);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          isAdmin: false,
          error: 'Method not allowed',
        })
      );
    });

    it('should require authorization header', async () => {
      const req = createMockRequest({
        method: 'GET',
        headers: {},
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          isAdmin: false,
          error: 'Authorization header required',
        })
      );
    });
  });

  describe('Admin Verification', () => {
    it('should return true for admin users', async () => {
      verifyAdminAccess.mockResolvedValue({
        isAdmin: true,
        uid: 'admin-123',
        email: 'admin@example.com',
      });

      const req = createMockRequest({
        method: 'GET',
        headers: {
          authorization: 'Bearer admin-token',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(verifyAdminAccess).toHaveBeenCalledWith('Bearer admin-token');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          isAdmin: true,
          uid: 'admin-123',
          email: 'admin@example.com',
        })
      );
    });

    it('should return false for non-admin users', async () => {
      verifyAdminAccess.mockResolvedValue({
        isAdmin: false,
        error: 'Access denied',
      });

      const req = createMockRequest({
        method: 'GET',
        headers: {
          authorization: 'Bearer user-token',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          isAdmin: false,
          error: 'Access denied',
        })
      );
    });

    it('should handle verification errors', async () => {
      verifyAdminAccess.mockRejectedValue(new Error('Verification failed'));

      const req = createMockRequest({
        method: 'GET',
        headers: {
          authorization: 'Bearer invalid-token',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});
