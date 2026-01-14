/**
 * Tests for lib/adminAuth.js
 * 
 * Tier 1 security library (90%+ coverage).
 * Tests focus on permission escalation prevention:
 * - Token validation (valid, invalid, expired)
 * - Custom claims verification (primary method)
 * - UID-based fallback (deprecated)
 * - Development vs production behavior
 * - Permission escalation attacks
 * - Token tampering attempts
 */

jest.mock('firebase-admin', () => ({
  apps: [],
  initializeApp: jest.fn(),
  credential: {
    cert: jest.fn(),
  },
  auth: jest.fn(() => ({
    verifyIdToken: jest.fn(),
  })),
}));

jest.mock('../../../lib/errorTracking', () => ({
  captureError: jest.fn(),
}));

const admin = require('firebase-admin');

describe('verifyAdminAccess', () => {
  let verifyAdminAccess;
  let mockVerifyIdToken;
  let originalEnv;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    // Save original env
    originalEnv = { ...process.env };

    // Setup admin auth mock
    mockVerifyIdToken = jest.fn();
    admin.auth.mockReturnValue({
      verifyIdToken: mockVerifyIdToken,
    });

    // Reset Firebase Admin apps
    admin.apps.length = 0;

    // Import module
    const adminAuth = require('../../../lib/adminAuth');
    verifyAdminAccess = adminAuth.verifyAdminAccess;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Authorization Header Validation', () => {
    it('rejects missing authorization header', async () => {
      const result = await verifyAdminAccess(null);

      expect(result.isAdmin).toBe(false);
      expect(result.error).toBe('Missing authorization header');
    });

    it('rejects empty authorization header', async () => {
      const result = await verifyAdminAccess('');

      expect(result.isAdmin).toBe(false);
      expect(result.error).toBe('Missing authorization header');
    });

    it('rejects authorization header without Bearer prefix', async () => {
      const result = await verifyAdminAccess('Invalid token');

      expect(result.isAdmin).toBe(false);
      expect(result.error).toBe('Missing authorization header');
    });

    it('accepts valid Bearer token format', async () => {
      process.env.NODE_ENV = 'production';
      process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify({ project_id: 'test' });
      process.env.ADMIN_UIDS = '';

      mockVerifyIdToken.mockResolvedValue({
        uid: 'user-123',
        email: 'user@example.com',
        admin: true,
      });

      // Re-require to trigger initialization
      jest.resetModules();
      const adminAuth = require('../../../lib/adminAuth');
      verifyAdminAccess = adminAuth.verifyAdminAccess;

      const result = await verifyAdminAccess('Bearer valid-token');

      expect(result.isAdmin).toBe(true);
      expect(result.uid).toBe('user-123');
    });
  });

  describe('Development Token Handling', () => {
    it('accepts dev-admin-token in development mode', async () => {
      process.env.NODE_ENV = 'development';

      jest.resetModules();
      const adminAuth = require('../../../lib/adminAuth');
      verifyAdminAccess = adminAuth.verifyAdminAccess;

      const result = await verifyAdminAccess('Bearer dev-admin-token');

      expect(result.isAdmin).toBe(true);
      expect(result.uid).toBe('dev-admin');
      expect(result.email).toBe('admin@dev.local');
    });

    it('rejects dev-admin-token in production mode', async () => {
      process.env.NODE_ENV = 'production';

      jest.resetModules();
      const adminAuth = require('../../../lib/adminAuth');
      verifyAdminAccess = adminAuth.verifyAdminAccess;

      const result = await verifyAdminAccess('Bearer dev-admin-token');

      expect(result.isAdmin).toBe(false);
      expect(result.error).toBe('Invalid authentication token');
    });

    it('logs security event when dev token attempted in production', async () => {
      process.env.NODE_ENV = 'production';
      const consoleError = jest.spyOn(console, 'error').mockImplementation();

      jest.resetModules();
      const adminAuth = require('../../../lib/adminAuth');
      verifyAdminAccess = adminAuth.verifyAdminAccess;

      await verifyAdminAccess('Bearer dev-admin-token');

      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining('[Security] Dev admin token attempted in production')
      );

      consoleError.mockRestore();
    });
  });

  describe('Custom Claims Verification (Primary Method)', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify({ project_id: 'test' });
      process.env.ADMIN_UIDS = '';
    });

    it('grants admin access when custom claim admin is true', async () => {
      mockVerifyIdToken.mockResolvedValue({
        uid: 'admin-123',
        email: 'admin@example.com',
        admin: true, // Custom claim
      });

      jest.resetModules();
      const adminAuth = require('../../../lib/adminAuth');
      verifyAdminAccess = adminAuth.verifyAdminAccess;

      const result = await verifyAdminAccess('Bearer valid-token');

      expect(result.isAdmin).toBe(true);
      expect(result.uid).toBe('admin-123');
      expect(result.email).toBe('admin@example.com');
      expect(mockVerifyIdToken).toHaveBeenCalledWith('valid-token');
    });

    it('denies admin access when custom claim admin is false', async () => {
      mockVerifyIdToken.mockResolvedValue({
        uid: 'user-123',
        email: 'user@example.com',
        admin: false,
      });

      jest.resetModules();
      const adminAuth = require('../../../lib/adminAuth');
      verifyAdminAccess = adminAuth.verifyAdminAccess;

      const result = await verifyAdminAccess('Bearer valid-token');

      expect(result.isAdmin).toBe(false);
      expect(result.error).toBe('User is not an admin');
    });

    it('denies admin access when custom claim admin is missing', async () => {
      mockVerifyIdToken.mockResolvedValue({
        uid: 'user-123',
        email: 'user@example.com',
        // admin claim missing
      });

      jest.resetModules();
      const adminAuth = require('../../../lib/adminAuth');
      verifyAdminAccess = adminAuth.verifyAdminAccess;

      const result = await verifyAdminAccess('Bearer valid-token');

      expect(result.isAdmin).toBe(false);
      expect(result.error).toBe('User is not an admin');
    });

    it('denies admin access when custom claim admin is undefined', async () => {
      mockVerifyIdToken.mockResolvedValue({
        uid: 'user-123',
        email: 'user@example.com',
        admin: undefined,
      });

      jest.resetModules();
      const adminAuth = require('../../../lib/adminAuth');
      verifyAdminAccess = adminAuth.verifyAdminAccess;

      const result = await verifyAdminAccess('Bearer valid-token');

      expect(result.isAdmin).toBe(false);
      expect(result.error).toBe('User is not an admin');
    });
  });

  describe('UID-Based Fallback (Deprecated)', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify({ project_id: 'test' });
    });

    it('grants admin access when UID is in ADMIN_UIDS list', async () => {
      process.env.ADMIN_UIDS = 'admin-123,admin-456';

      mockVerifyIdToken.mockResolvedValue({
        uid: 'admin-123',
        email: 'admin@example.com',
        // No custom claim
      });

      jest.resetModules();
      const adminAuth = require('../../../lib/adminAuth');
      verifyAdminAccess = adminAuth.verifyAdminAccess;

      const result = await verifyAdminAccess('Bearer valid-token');

      expect(result.isAdmin).toBe(true);
      expect(result.uid).toBe('admin-123');
    });

    it('handles ADMIN_UIDS with whitespace', async () => {
      process.env.ADMIN_UIDS = ' admin-123 , admin-456 ';

      mockVerifyIdToken.mockResolvedValue({
        uid: 'admin-123',
        email: 'admin@example.com',
      });

      jest.resetModules();
      const adminAuth = require('../../../lib/adminAuth');
      verifyAdminAccess = adminAuth.verifyAdminAccess;

      const result = await verifyAdminAccess('Bearer valid-token');

      expect(result.isAdmin).toBe(true);
    });

    it('denies admin access when UID is not in ADMIN_UIDS list', async () => {
      process.env.ADMIN_UIDS = 'admin-123,admin-456';

      mockVerifyIdToken.mockResolvedValue({
        uid: 'user-789',
        email: 'user@example.com',
      });

      jest.resetModules();
      const adminAuth = require('../../../lib/adminAuth');
      verifyAdminAccess = adminAuth.verifyAdminAccess;

      const result = await verifyAdminAccess('Bearer valid-token');

      expect(result.isAdmin).toBe(false);
      expect(result.error).toBe('User is not an admin');
    });

    it('denies admin access when ADMIN_UIDS is empty', async () => {
      process.env.ADMIN_UIDS = '';

      mockVerifyIdToken.mockResolvedValue({
        uid: 'admin-123',
        email: 'admin@example.com',
      });

      jest.resetModules();
      const adminAuth = require('../../../lib/adminAuth');
      verifyAdminAccess = adminAuth.verifyAdminAccess;

      const result = await verifyAdminAccess('Bearer valid-token');

      expect(result.isAdmin).toBe(false);
      expect(result.error).toBe('User is not an admin');
    });

    it('prioritizes custom claims over UID fallback', async () => {
      process.env.ADMIN_UIDS = 'user-123'; // UID in list but not admin

      mockVerifyIdToken.mockResolvedValue({
        uid: 'user-123',
        email: 'user@example.com',
        admin: true, // Custom claim takes precedence
      });

      jest.resetModules();
      const adminAuth = require('../../../lib/adminAuth');
      verifyAdminAccess = adminAuth.verifyAdminAccess;

      const result = await verifyAdminAccess('Bearer valid-token');

      expect(result.isAdmin).toBe(true);
      // Should not use UID fallback when custom claim exists
    });
  });

  describe('Firebase Admin Initialization', () => {
    it('denies access when Firebase Admin is not initialized', async () => {
      process.env.NODE_ENV = 'production';
      delete process.env.FIREBASE_SERVICE_ACCOUNT;

      jest.resetModules();
      const adminAuth = require('../../../lib/adminAuth');
      verifyAdminAccess = adminAuth.verifyAdminAccess;

      const result = await verifyAdminAccess('Bearer valid-token');

      expect(result.isAdmin).toBe(false);
      expect(result.error).toContain('Admin authentication service unavailable');
    });

    it('handles Firebase Admin initialization errors', async () => {
      process.env.NODE_ENV = 'production';
      process.env.FIREBASE_SERVICE_ACCOUNT = 'invalid-json';

      jest.resetModules();
      const adminAuth = require('../../../lib/adminAuth');
      verifyAdminAccess = adminAuth.verifyAdminAccess;

      const result = await verifyAdminAccess('Bearer valid-token');

      expect(result.isAdmin).toBe(false);
      expect(result.error).toContain('Admin authentication service unavailable');
    });
  });

  describe('Token Verification Errors', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify({ project_id: 'test' });
      process.env.ADMIN_UIDS = '';
    });

    it('handles expired tokens', async () => {
      const error = new Error('Token expired');
      error.code = 'auth/id-token-expired';
      mockVerifyIdToken.mockRejectedValue(error);

      jest.resetModules();
      const adminAuth = require('../../../lib/adminAuth');
      verifyAdminAccess = adminAuth.verifyAdminAccess;

      const result = await verifyAdminAccess('Bearer expired-token');

      expect(result.isAdmin).toBe(false);
      expect(result.error).toBe('Invalid or expired token');
    });

    it('handles invalid token format', async () => {
      const error = new Error('Invalid token');
      error.code = 'auth/argument-error';
      mockVerifyIdToken.mockRejectedValue(error);

      jest.resetModules();
      const adminAuth = require('../../../lib/adminAuth');
      verifyAdminAccess = adminAuth.verifyAdminAccess;

      const result = await verifyAdminAccess('Bearer invalid-token');

      expect(result.isAdmin).toBe(false);
      expect(result.error).toBe('Invalid or expired token');
    });

    it('handles revoked tokens', async () => {
      const error = new Error('Token revoked');
      error.code = 'auth/id-token-revoked';
      mockVerifyIdToken.mockRejectedValue(error);

      jest.resetModules();
      const adminAuth = require('../../../lib/adminAuth');
      verifyAdminAccess = adminAuth.verifyAdminAccess;

      const result = await verifyAdminAccess('Bearer revoked-token');

      expect(result.isAdmin).toBe(false);
      expect(result.error).toBe('Invalid or expired token');
    });

    it('handles network errors during token verification', async () => {
      const error = new Error('Network error');
      mockVerifyIdToken.mockRejectedValue(error);

      jest.resetModules();
      const adminAuth = require('../../../lib/adminAuth');
      verifyAdminAccess = adminAuth.verifyAdminAccess;

      const result = await verifyAdminAccess('Bearer token');

      expect(result.isAdmin).toBe(false);
      expect(result.error).toBe('Invalid or expired token');
    });

    it('logs token verification errors', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Token verification failed');
      mockVerifyIdToken.mockRejectedValue(error);

      jest.resetModules();
      const adminAuth = require('../../../lib/adminAuth');
      verifyAdminAccess = adminAuth.verifyAdminAccess;

      await verifyAdminAccess('Bearer token');

      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining('[AdminAuth] Token verification error:'),
        expect.anything()
      );

      consoleError.mockRestore();
    });
  });

  describe('Permission Escalation Prevention', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify({ project_id: 'test' });
      process.env.ADMIN_UIDS = '';
    });

    it('rejects tokens with tampered admin claim', async () => {
      // Simulate token tampering - admin claim set to string instead of boolean
      mockVerifyIdToken.mockResolvedValue({
        uid: 'user-123',
        email: 'user@example.com',
        admin: 'true', // String, not boolean
      });

      jest.resetModules();
      const adminAuth = require('../../../lib/adminAuth');
      verifyAdminAccess = adminAuth.verifyAdminAccess;

      const result = await verifyAdminAccess('Bearer tampered-token');

      // Should reject because admin !== true (strict equality)
      expect(result.isAdmin).toBe(false);
      expect(result.error).toBe('User is not an admin');
    });

    it('prevents privilege escalation via UID manipulation', async () => {
      process.env.ADMIN_UIDS = 'admin-123';

      mockVerifyIdToken.mockResolvedValue({
        uid: 'user-456', // Different UID than in ADMIN_UIDS
        email: 'user@example.com',
      });

      jest.resetModules();
      const adminAuth = require('../../../lib/adminAuth');
      verifyAdminAccess = adminAuth.verifyAdminAccess;

      const result = await verifyAdminAccess('Bearer token');

      expect(result.isAdmin).toBe(false);
      expect(result.error).toBe('User is not an admin');
    });

    it('rejects tokens without proper Firebase verification', async () => {
      // If verifyIdToken fails, should reject even if token looks valid
      mockVerifyIdToken.mockRejectedValue(new Error('Invalid token'));

      jest.resetModules();
      const adminAuth = require('../../../lib/adminAuth');
      verifyAdminAccess = adminAuth.verifyAdminAccess;

      const result = await verifyAdminAccess('Bearer fake-valid-looking-token');

      expect(result.isAdmin).toBe(false);
      expect(result.error).toBe('Invalid or expired token');
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify({ project_id: 'test' });
    });

    it('handles missing email in token', async () => {
      process.env.ADMIN_UIDS = 'admin-123';

      mockVerifyIdToken.mockResolvedValue({
        uid: 'admin-123',
        // email missing
        admin: false,
      });

      jest.resetModules();
      const adminAuth = require('../../../lib/adminAuth');
      verifyAdminAccess = adminAuth.verifyAdminAccess;

      const result = await verifyAdminAccess('Bearer token');

      expect(result.isAdmin).toBe(true);
      expect(result.email).toBeUndefined();
    });

    it('handles ADMIN_UIDS with empty entries', async () => {
      process.env.ADMIN_UIDS = 'admin-123,,admin-456,';

      mockVerifyIdToken.mockResolvedValue({
        uid: 'admin-123',
        email: 'admin@example.com',
      });

      jest.resetModules();
      const adminAuth = require('../../../lib/adminAuth');
      verifyAdminAccess = adminAuth.verifyAdminAccess;

      const result = await verifyAdminAccess('Bearer token');

      expect(result.isAdmin).toBe(true);
    });
  });
});
