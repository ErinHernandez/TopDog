/**
 * Tests for /api/auth/signup endpoint
 * 
 * Tests cover:
 * - Request validation
 * - Username validation
 * - Country validation
 * - Rate limiting
 * - User creation
 * - Error handling
 */

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
  runTransaction: jest.fn(),
}));

jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
}));

jest.mock('../../../lib/apiErrorHandler', () => ({
  withErrorHandling: jest.fn((req, res, handler) => handler(req, res, {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  })),
  validateMethod: jest.fn((req, methods, logger) => {
    if (!methods.includes(req.method)) {
      throw new Error(`Method ${req.method} not allowed`);
    }
  }),
  validateBody: jest.fn((req, requiredFields, logger) => {
    const missing = requiredFields.filter(field => !req.body[field]);
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
  }),
  createSuccessResponse: jest.fn((data, statusCode, logger) => ({
    statusCode,
    body: data,
  })),
  createErrorResponse: jest.fn((type, message, details, requestId) => ({
    statusCode: 400,
    body: { message, error: type },
  })),
  ErrorType: {
    VALIDATION: 'validation',
    RATE_LIMIT: 'rate_limit',
  },
}));

jest.mock('../../../lib/localeCharacters', () => ({
  isApprovedCountry: jest.fn(() => true),
}));

jest.mock('../../../lib/rateLimiter', () => ({
  createSignupLimiter: jest.fn(() => ({
    check: jest.fn(() => ({
      allowed: true,
      remaining: 5,
      resetAt: Date.now() + 60000,
      retryAfterMs: 0,
    })),
  })),
}));

jest.mock('../../../lib/structuredLogger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

const { getDocs, runTransaction } = require('firebase/firestore');
const { createMockRequest, createMockResponse } = require('../../factories');
const { isApprovedCountry } = require('../../../lib/localeCharacters');

describe('/api/auth/signup', () => {
  let handler;
  let rateLimiterMocks;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    // Mock Firestore queries
    getDocs.mockResolvedValue({
      empty: true,
      docs: [],
    });

    runTransaction.mockImplementation(async (db, updateFunction) => {
      return await updateFunction({
        get: jest.fn().mockResolvedValue({
          exists: () => false,
          data: () => null,
        }),
        set: jest.fn(),
      });
    });

    isApprovedCountry.mockReturnValue(true);

    rateLimiterMocks = require('../../../lib/rateLimiter');
    const limiter = rateLimiterMocks.createSignupLimiter();
    limiter.check.mockReturnValue({
      allowed: true,
      remaining: 5,
      resetAt: Date.now() + 60000,
      retryAfterMs: 0,
    });

    // Import handler after mocks are set up
    handler = require('../../../pages/api/auth/signup').default;
  });

  describe('Request Validation', () => {
    it('should reject non-POST requests', async () => {
      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await expect(handler(req, res)).rejects.toThrow('Method GET not allowed');
    });

    it('should require uid', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          username: 'testuser',
          email: 'user@example.com',
        },
      });
      const res = createMockResponse();

      await expect(handler(req, res)).rejects.toThrow('Missing required fields');
    });

    it('should require username', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          uid: 'user-123',
          email: 'user@example.com',
        },
      });
      const res = createMockResponse();

      await expect(handler(req, res)).rejects.toThrow('Missing required fields');
    });

    it('should require email', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          uid: 'user-123',
          username: 'testuser',
        },
      });
      const res = createMockResponse();

      await expect(handler(req, res)).rejects.toThrow('Missing required fields');
    });
  });

  describe('Username Validation', () => {
    it('should reject usernames that are too short', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          uid: 'user-123',
          username: 'ab',
          email: 'user@example.com',
          countryCode: 'US',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject usernames that are too long', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          uid: 'user-123',
          username: 'a'.repeat(20), // > 18 chars
          email: 'user@example.com',
          countryCode: 'US',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject reserved usernames', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          uid: 'user-123',
          username: 'admin',
          email: 'user@example.com',
          countryCode: 'US',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject usernames with spaces', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          uid: 'user-123',
          username: 'test user',
          email: 'user@example.com',
          countryCode: 'US',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Country Validation', () => {
    it('should reject unapproved countries', async () => {
      isApprovedCountry.mockReturnValue(false);

      const req = createMockRequest({
        method: 'POST',
        body: {
          uid: 'user-123',
          username: 'testuser',
          email: 'user@example.com',
          countryCode: 'XX',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('User Creation', () => {
    it('should create user with valid data', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          uid: 'user-123',
          username: 'testuser',
          email: 'user@example.com',
          countryCode: 'US',
          displayName: 'Test User',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(runTransaction).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should check for existing username', async () => {
      getDocs.mockResolvedValueOnce({
        empty: false,
        docs: [{
          id: 'existing-user',
          data: () => ({ username: 'testuser' }),
        }],
      });

      const req = createMockRequest({
        method: 'POST',
        body: {
          uid: 'user-123',
          username: 'testuser',
          email: 'user@example.com',
          countryCode: 'US',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      const limiter = rateLimiterMocks.createSignupLimiter();
      limiter.check.mockReturnValue({
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + 60000,
        retryAfterMs: 60000,
      });

      const req = createMockRequest({
        method: 'POST',
        body: {
          uid: 'user-123',
          username: 'testuser',
          email: 'user@example.com',
          countryCode: 'US',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(429);
    });
  });

  describe('Error Handling', () => {
    it('should handle Firestore errors', async () => {
      runTransaction.mockRejectedValue(new Error('Database error'));

      const req = createMockRequest({
        method: 'POST',
        body: {
          uid: 'user-123',
          username: 'testuser',
          email: 'user@example.com',
          countryCode: 'US',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
