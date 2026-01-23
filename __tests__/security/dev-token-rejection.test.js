/**
 * Security Test: Verify dev tokens are rejected in production mode
 *
 * CRITICAL: This test MUST pass before any production deployment
 */

describe('Dev Token Security', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe('apiAuth', () => {
    it('rejects dev-token when NODE_ENV is production', async () => {
      process.env.NODE_ENV = 'production';

      // Clear module cache to pick up new NODE_ENV
      jest.resetModules();
      const { verifyAuthToken } = require('../../lib/apiAuth');

      const result = await verifyAuthToken('Bearer dev-token');

      expect(result.uid).toBeNull();
      expect(result.error).toBeDefined();
    });

    it('accepts dev-token ONLY when NODE_ENV is development', async () => {
      process.env.NODE_ENV = 'development';
      jest.resetModules();
      const { verifyAuthToken } = require('../../lib/apiAuth');

      const result = await verifyAuthToken('Bearer dev-token');

      expect(result.uid).toBe('dev-uid');
    });
  });

  describe('adminAuth', () => {
    it('rejects dev-admin-token when NODE_ENV is production', async () => {
      process.env.NODE_ENV = 'production';
      jest.resetModules();
      const { verifyAdminAccess } = require('../../lib/adminAuth');

      const result = await verifyAdminAccess('Bearer dev-admin-token');

      expect(result.isAdmin).toBe(false);
    });
  });
});
