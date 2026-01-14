/**
 * Tests for /api/stripe/customer endpoint
 * 
 * Tests cover:
 * - Request validation
 * - Authentication
 * - Rate limiting
 * - Customer creation/retrieval
 * - Payment method retrieval
 * - Error handling
 */

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
    FORBIDDEN: 'forbidden',
    STRIPE: 'stripe',
  },
}));

jest.mock('../../../lib/stripe', () => ({
  getOrCreateCustomer: jest.fn(),
  getCustomerWithPaymentMethods: jest.fn(),
  getUserPaymentData: jest.fn(),
}));

jest.mock('../../../lib/apiAuth', () => ({
  withAuth: jest.fn((handler) => handler),
  verifyUserAccess: jest.fn((uid, userId) => uid === userId),
}));

jest.mock('../../../lib/csrfProtection', () => ({
  withCSRFProtection: jest.fn((handler) => handler),
}));

jest.mock('../../../lib/rateLimitConfig', () => ({
  createPaymentRateLimiter: jest.fn(() => ({
    check: jest.fn(() => ({
      allowed: true,
      remaining: 10,
      resetAt: Date.now() + 60000,
      retryAfterMs: 0,
    })),
    config: { maxRequests: 10 },
  })),
  withRateLimit: jest.fn((handler) => handler),
}));

const { createMockRequest, createMockResponse } = require('../../factories');
const stripeMocks = require('../../../lib/stripe');
const { verifyUserAccess } = require('../../../lib/apiAuth');

describe('/api/stripe/customer', () => {
  let handler;
  let rateLimitMocks;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    rateLimitMocks = require('../../../lib/rateLimitConfig');
    const limiter = rateLimitMocks.createPaymentRateLimiter();
    rateLimitMocks.withRateLimit.mockImplementation((handler) => handler);

    stripeMocks.getOrCreateCustomer.mockResolvedValue({
      id: 'cus_test_123',
      email: 'user@example.com',
      name: 'Test User',
      created: Math.floor(Date.now() / 1000),
    });

    stripeMocks.getCustomerWithPaymentMethods.mockResolvedValue({
      id: 'cus_test_123',
      email: 'user@example.com',
      paymentMethods: [
        {
          id: 'pm_test_123',
          type: 'card',
          card: { last4: '4242', brand: 'visa' },
        },
      ],
    });

    // Import handler after mocks are set up
    handler = require('../../../pages/api/stripe/customer').default;
  });

  describe('Request Validation', () => {
    it('should reject unsupported HTTP methods', async () => {
      const req = createMockRequest({ method: 'DELETE' });
      const res = createMockResponse();

      await expect(handler(req, res)).rejects.toThrow('Method DELETE not allowed');
    });

    it('should require userId and email for POST', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {},
        user: { uid: 'user-123' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      const limiter = rateLimitMocks.createPaymentRateLimiter();
      limiter.check.mockReturnValue({
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + 60000,
        retryAfterMs: 60000,
      });

      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          email: 'user@example.com',
        },
        user: { uid: 'user-123' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'RATE_LIMIT_EXCEEDED',
        })
      );
    });

    it('should set rate limit headers', async () => {
      const req = createMockRequest({
        method: 'GET',
        query: { userId: 'user-123' },
        user: { uid: 'user-123' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 10);
      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', expect.any(Number));
    });
  });

  describe('POST - Create Customer', () => {
    it('should create customer with valid data', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          email: 'user@example.com',
          name: 'Test User',
        },
        user: { uid: 'user-123' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(stripeMocks.getOrCreateCustomer).toHaveBeenCalledWith({
        userId: 'user-123',
        email: 'user@example.com',
        name: 'Test User',
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should verify user access', async () => {
      verifyUserAccess.mockReturnValue(false);

      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-456',
          email: 'user@example.com',
        },
        user: { uid: 'user-123' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should handle customer creation errors', async () => {
      stripeMocks.getOrCreateCustomer.mockRejectedValue(
        new Error('Customer creation failed')
      );

      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          email: 'user@example.com',
        },
        user: { uid: 'user-123' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('GET - Retrieve Customer', () => {
    it('should retrieve customer with payment methods', async () => {
      const req = createMockRequest({
        method: 'GET',
        query: { userId: 'user-123' },
        user: { uid: 'user-123' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(stripeMocks.getCustomerWithPaymentMethods).toHaveBeenCalledWith('user-123');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should require userId query parameter', async () => {
      const req = createMockRequest({
        method: 'GET',
        query: {},
        user: { uid: 'user-123' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
