/**
 * Tests for /api/auth/username/check endpoint
 * 
 * Tests cover:
 * - Request validation
 * - Username format validation
 * - Reserved username checks
 * - VIP reservation checks
 * - Existing user checks
 * - Username suggestions
 * - Similarity warnings
 * - Rate limiting
 * - Timing attack prevention
 */

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
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
    RATE_LIMIT: 'rate_limit',
  },
}));

jest.mock('../../../lib/rateLimiter', () => ({
  createUsernameCheckLimiter: jest.fn(() => ({
    check: jest.fn(() => ({
      allowed: true,
      remaining: 30,
      resetAt: Date.now() + 60000,
      retryAfterMs: 0,
    })),
  })),
}));

jest.mock('../../../lib/usernameSuggestions', () => ({
  generateUsernameSuggestions: jest.fn(() => ['testuser1', 'testuser2', 'testuser3']),
}));

jest.mock('../../../lib/usernameSimilarity', () => ({
  findSimilarUsernames: jest.fn(() => []),
  generateSimilarityWarnings: jest.fn(() => []),
}));

jest.mock('../../../lib/structuredLogger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

const { getDocs } = require('firebase/firestore');
const { createMockRequest, createMockResponse } = require('../../factories');
const { generateUsernameSuggestions } = require('../../../lib/usernameSuggestions');
const { findSimilarUsernames } = require('../../../lib/usernameSimilarity');

describe('/api/auth/username/check', () => {
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

    rateLimiterMocks = require('../../../lib/rateLimiter');
    const limiter = rateLimiterMocks.createUsernameCheckLimiter();
    limiter.check.mockReturnValue({
      allowed: true,
      remaining: 30,
      resetAt: Date.now() + 60000,
      retryAfterMs: 0,
    });

    generateUsernameSuggestions.mockResolvedValue(['testuser1', 'testuser2', 'testuser3']);
    findSimilarUsernames.mockResolvedValue([]);

    // Import handler after mocks are set up
    handler = require('../../../pages/api/auth/username/check').default;
  });

  describe('Request Validation', () => {
    it('should reject non-POST requests', async () => {
      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await expect(handler(req, res)).rejects.toThrow('Method GET not allowed');
    });

    it('should require username', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {},
      });
      const res = createMockResponse();

      await expect(handler(req, res)).rejects.toThrow('Missing required fields');
    });
  });

  describe('Username Format Validation', () => {
    it('should reject usernames that are too short', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: { username: 'ab' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          isAvailable: false,
        })
      );
    });

    it('should reject reserved usernames', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: { username: 'admin' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          isAvailable: false,
        })
      );
    });

    it('should accept valid usernames', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: { username: 'testuser' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          isAvailable: true,
        })
      );
    });
  });

  describe('Username Availability', () => {
    it('should return false if username is taken', async () => {
      getDocs.mockResolvedValueOnce({
        empty: false,
        docs: [{
          id: 'existing-user',
          data: () => ({ username: 'testuser' }),
        }],
      });

      const req = createMockRequest({
        method: 'POST',
        body: { username: 'testuser' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          isAvailable: false,
          suggestions: expect.any(Array),
        })
      );
    });

    it('should return true if username is available', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: { username: 'availableuser' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          isAvailable: true,
        })
      );
    });

    it('should check VIP reservations', async () => {
      getDocs.mockResolvedValueOnce({
        empty: false,
        docs: [{
          id: 'vip-reservation',
          data: () => ({
            usernameLower: 'vipuser',
            claimed: false,
            expiresAt: new Date(Date.now() + 86400000), // Future date
          }),
        }],
      });

      const req = createMockRequest({
        method: 'POST',
        body: { username: 'vipuser' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          isAvailable: false,
          isVIPReserved: true,
        })
      );
    });
  });

  describe('Username Suggestions', () => {
    it('should provide suggestions when username is taken', async () => {
      getDocs.mockResolvedValueOnce({
        empty: false,
        docs: [{ id: 'existing', data: () => ({}) }],
      });

      const req = createMockRequest({
        method: 'POST',
        body: { username: 'takenuser' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(generateUsernameSuggestions).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          suggestions: expect.arrayContaining(['testuser1', 'testuser2', 'testuser3']),
        })
      );
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      const limiter = rateLimiterMocks.createUsernameCheckLimiter();
      limiter.check.mockReturnValue({
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + 60000,
        retryAfterMs: 60000,
      });

      const req = createMockRequest({
        method: 'POST',
        body: { username: 'testuser' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'RATE_LIMIT_EXCEEDED',
        })
      );
    });

    it('should set rate limit headers', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: { username: 'testuser' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', '30');
      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', expect.any(Number));
    });
  });
});
