/**
 * Tests for lib/apiAuth.js
 * 
 * Authentication middleware tests focusing on:
 * - Token validation
 * - Token expiry handling
 * - Development vs production behavior
 * - User context injection
 */

jest.mock('firebase-admin', () => {
  const mockVerifyIdToken = jest.fn();
  
  return {
    apps: [],
    credential: {
      cert: jest.fn(),
    },
    initializeApp: jest.fn(),
    auth: jest.fn(() => ({
      verifyIdToken: mockVerifyIdToken,
    })),
    __mockVerifyIdToken: mockVerifyIdToken,
  };
});

const admin = require('firebase-admin');

describe('lib/apiAuth', () => {
  let apiAuth;
  let originalEnv;

  beforeAll(() => {
    originalEnv = {
      NODE_ENV: process.env.NODE_ENV,
      FIREBASE_SERVICE_ACCOUNT: process.env.FIREBASE_SERVICE_ACCOUNT,
    };
  });

  afterAll(() => {
    process.env.NODE_ENV = originalEnv.NODE_ENV;
    process.env.FIREBASE_SERVICE_ACCOUNT = originalEnv.FIREBASE_SERVICE_ACCOUNT;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    
    // Reset Firebase Admin state
    admin.apps.length = 0;
    admin.initializeApp.mockClear();
    
    process.env.NODE_ENV = 'test';
    process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify({
      project_id: 'test-project',
    });
    
    apiAuth = require('../../../lib/apiAuth');
  });

  describe('verifyAuthToken', () => {
    describe('Token Validation', () => {
      it('returns user info for valid Firebase token', async () => {
        admin.apps.push({}); // Simulate initialized app
        const mockVerifyIdToken = admin.auth().verifyIdToken;
        mockVerifyIdToken.mockResolvedValue({
          uid: 'user123',
          email: 'user@example.com',
        });

        const result = await apiAuth.verifyAuthToken('Bearer valid-token-123');

        expect(mockVerifyIdToken).toHaveBeenCalledWith('valid-token-123');
        expect(result).toEqual({
          uid: 'user123',
          email: 'user@example.com',
        });
      });

      it('rejects missing authorization header', async () => {
        const result = await apiAuth.verifyAuthToken(null);

        expect(result).toEqual({
          uid: null,
          error: 'Missing authorization header',
        });
      });

      it('rejects malformed authorization header', async () => {
        const result = await apiAuth.verifyAuthToken('InvalidFormat token');

        expect(result).toEqual({
          uid: null,
          error: 'Missing authorization header',
        });
      });

      it('rejects invalid Firebase token', async () => {
        admin.apps.push({});
        const mockVerifyIdToken = admin.auth().verifyIdToken;
        mockVerifyIdToken.mockRejectedValue(new Error('Invalid token'));

        const result = await apiAuth.verifyAuthToken('Bearer invalid-token');

        expect(result).toEqual({
          uid: null,
          error: 'Invalid or expired token',
        });
      });
    });

    describe('Token Expiry', () => {
      it('handles expired token error', async () => {
        admin.apps.push({});
        const mockVerifyIdToken = admin.auth().verifyIdToken;
        const expiryError = new Error('Token expired');
        expiryError.code = 'auth/id-token-expired';
        mockVerifyIdToken.mockRejectedValue(expiryError);

        const result = await apiAuth.verifyAuthToken('Bearer expired-token');

        expect(result).toEqual({
          uid: null,
          error: 'Invalid or expired token',
        });
      });
    });

    describe('Development Mode', () => {
      it('allows dev-token in development mode', async () => {
        process.env.NODE_ENV = 'development';

        // Reset module to pick up new NODE_ENV
        jest.resetModules();
        apiAuth = require('../../../lib/apiAuth');

        const result = await apiAuth.verifyAuthToken('Bearer dev-token');

        expect(result).toEqual({
          uid: 'dev-uid',
          email: 'dev@example.com',
        });
      });

      it('rejects dev-token in production mode', async () => {
        process.env.NODE_ENV = 'production';

        // Reset module to pick up new NODE_ENV
        jest.resetModules();
        apiAuth = require('../../../lib/apiAuth');

        const result = await apiAuth.verifyAuthToken('Bearer dev-token');

        expect(result).toEqual({
          uid: null,
          error: 'Invalid authentication token',
        });
      });
    });

    describe('Service Availability', () => {
      it('handles Firebase Admin not initialized', async () => {
        admin.apps.length = 0; // No apps initialized

        const result = await apiAuth.verifyAuthToken('Bearer some-token');

        expect(result).toEqual({
          uid: null,
          error: 'Authentication service unavailable',
        });
      });
    });
  });

  describe('withAuth middleware', () => {
    describe('Required Authentication', () => {
      it('allows authenticated requests', async () => {
        admin.apps.push({});
        const mockVerifyIdToken = admin.auth().verifyIdToken;
        mockVerifyIdToken.mockResolvedValue({
          uid: 'user123',
          email: 'user@example.com',
        });

        const handler = jest.fn((req, res) => {
          expect(req.user).toEqual({
            uid: 'user123',
            email: 'user@example.com',
          });
          res.json({ success: true });
        });

        const wrappedHandler = apiAuth.withAuth(handler);
        const req = {
          headers: {
            authorization: 'Bearer valid-token',
          },
        };
        const res = {
          json: jest.fn(),
          status: jest.fn().mockReturnThis(),
        };

        await wrappedHandler(req, res);

        expect(handler).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith({ success: true });
      });

      it('rejects unauthenticated requests when required', async () => {
        const handler = jest.fn();
        const wrappedHandler = apiAuth.withAuth(handler, { required: true });

        const req = {
          headers: {},
        };
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };

        await wrappedHandler(req, res);

        expect(handler).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'UNAUTHORIZED',
          message: expect.stringContaining('Authentication required'),
        });
      });
    });

    describe('Optional Authentication', () => {
      it('allows unauthenticated requests when not required', async () => {
        const handler = jest.fn((req, res) => {
          expect(req.user).toBeNull();
          res.json({ success: true });
        });

        const wrappedHandler = apiAuth.withAuth(handler, { required: false });

        const req = {
          headers: {},
        };
        const res = {
          json: jest.fn(),
        };

        await wrappedHandler(req, res);

        expect(handler).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith({ success: true });
      });
    });

    describe('Anonymous Users', () => {
      it('allows anonymous users when allowAnonymous is true', async () => {
        const handler = jest.fn((req, res) => {
          expect(req.user).toBeNull();
          res.json({ success: true });
        });

        const wrappedHandler = apiAuth.withAuth(handler, {
          required: false,
          allowAnonymous: true,
        });

        const req = {
          headers: {},
        };
        const res = {
          json: jest.fn(),
        };

        await wrappedHandler(req, res);

        expect(handler).toHaveBeenCalled();
      });

      it('rejects anonymous users when allowAnonymous is false', async () => {
        const handler = jest.fn();
        const wrappedHandler = apiAuth.withAuth(handler, {
          required: false,
          allowAnonymous: false,
        });

        const req = {
          headers: {},
        };
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };

        await wrappedHandler(req, res);

        expect(handler).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
      });
    });
  });

  describe('verifyUserAccess', () => {
    it('returns true when user IDs match', () => {
      expect(apiAuth.verifyUserAccess('user123', 'user123')).toBe(true);
    });

    it('returns false when user IDs do not match', () => {
      expect(apiAuth.verifyUserAccess('user123', 'user456')).toBe(false);
    });

    it('returns false when either user ID is missing', () => {
      expect(apiAuth.verifyUserAccess(null, 'user123')).toBe(false);
      expect(apiAuth.verifyUserAccess('user123', null)).toBe(false);
      expect(apiAuth.verifyUserAccess(null, null)).toBe(false);
    });
  });
});
