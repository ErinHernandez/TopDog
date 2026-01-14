/**
 * Tests for /api/stripe/setup-intent endpoint
 * 
 * Important payment route (P1 - 85%+ coverage).
 * Tests focus on realistic business scenarios:
 * - Creating setup intent for saving payment methods
 * - User access verification
 * - Rate limiting
 * - Idempotency key handling
 */

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234'),
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
  createSuccessResponse: jest.fn((data, statusCode, logger) => ({
    statusCode,
    body: data,
  })),
  createErrorResponse: jest.fn((type, message, details, requestId) => ({
    statusCode: type === 'validation' ? 400 : type === 'forbidden' ? 403 : type === 'stripe' ? 500 : 405,
    body: { message, error: type },
  })),
  ErrorType: {
    VALIDATION: 'validation',
    FORBIDDEN: 'forbidden',
    STRIPE: 'stripe',
    METHOD_NOT_ALLOWED: 'method_not_allowed',
  },
}));

jest.mock('../../../lib/stripe', () => ({
  getOrCreateCustomer: jest.fn(),
  createSetupIntent: jest.fn(),
  logPaymentEvent: jest.fn(),
}));

jest.mock('../../../lib/apiAuth', () => ({
  withAuth: jest.fn((handler) => handler),
  verifyUserAccess: jest.fn(() => true),
}));

jest.mock('../../../lib/rateLimitConfig', () => ({
  createPaymentRateLimiter: jest.fn(() => ({
    config: { maxRequests: 10 },
    check: jest.fn(() => Promise.resolve({ 
      allowed: true, 
      remaining: 10,
      resetAt: Date.now() + 60000,
      retryAfterMs: 0,
    })),
  })),
  withRateLimit: jest.fn((handler) => handler),
}));

jest.mock('../../../lib/csrfProtection', () => ({
  withCSRFProtection: jest.fn((handler) => handler),
}));

const { createMockRequest, createMockResponse } = require('../../factories');
const stripeMocks = require('../../../lib/stripe');
const { verifyUserAccess } = require('../../../lib/apiAuth');
const rateLimitMocks = require('../../../lib/rateLimitConfig');

describe('/api/stripe/setup-intent', () => {
  let handler;
  let mockRateLimiter;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    mockRateLimiter = rateLimitMocks.createPaymentRateLimiter();
    
    // Import handler after mocks are set up
    handler = require('../../../pages/api/stripe/setup-intent').default;
  });

  describe('Successful Setup Intent Creation', () => {
    it('creates setup intent with customer and returns client secret', async () => {
      stripeMocks.getOrCreateCustomer.mockResolvedValue({
        id: 'cus_test_123',
        email: 'user@example.com',
      });

      stripeMocks.createSetupIntent.mockResolvedValue({
        clientSecret: 'seti_test_123_secret_abc',
        setupIntentId: 'seti_test_123',
      });

      stripeMocks.logPaymentEvent.mockResolvedValue(undefined);

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

      expect(stripeMocks.getOrCreateCustomer).toHaveBeenCalledWith({
        userId: 'user-123',
        email: 'user@example.com',
        name: undefined,
      });
      expect(stripeMocks.createSetupIntent).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          customerId: 'cus_test_123',
          paymentMethodTypes: ['card'],
        })
      );
      expect(stripeMocks.logPaymentEvent).toHaveBeenCalledWith(
        'user-123',
        'payment_method_added',
        expect.objectContaining({
          severity: 'low',
          metadata: { action: 'setup_intent_created' },
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          clientSecret: 'seti_test_123_secret_abc',
          setupIntentId: 'seti_test_123',
          customerId: 'cus_test_123',
        })
      );
    });

    it('uses provided idempotency key', async () => {
      stripeMocks.getOrCreateCustomer.mockResolvedValue({
        id: 'cus_test_123',
      });

      stripeMocks.createSetupIntent.mockResolvedValue({
        clientSecret: 'seti_test_123_secret_abc',
        setupIntentId: 'seti_test_123',
      });

      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          email: 'user@example.com',
          idempotencyKey: 'custom-key-123',
        },
        user: { uid: 'user-123' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(stripeMocks.createSetupIntent).toHaveBeenCalledWith(
        expect.objectContaining({
          idempotencyKey: 'custom-key-123',
        })
      );
    });

    it('generates idempotency key when not provided', async () => {
      stripeMocks.getOrCreateCustomer.mockResolvedValue({
        id: 'cus_test_123',
      });

      stripeMocks.createSetupIntent.mockResolvedValue({
        clientSecret: 'seti_test_123_secret_abc',
        setupIntentId: 'seti_test_123',
      });

      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          email: 'user@example.com',
          // No idempotencyKey provided
        },
        user: { uid: 'user-123' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(stripeMocks.createSetupIntent).toHaveBeenCalledWith(
        expect.objectContaining({
          idempotencyKey: expect.stringMatching(/^si_user-123_\d+_test-uuid-1234$/),
        })
      );
    });

    it('filters payment method types to allowed values', async () => {
      stripeMocks.getOrCreateCustomer.mockResolvedValue({
        id: 'cus_test_123',
      });

      stripeMocks.createSetupIntent.mockResolvedValue({
        clientSecret: 'seti_test_123_secret_abc',
        setupIntentId: 'seti_test_123',
      });

      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          email: 'user@example.com',
          paymentMethodTypes: ['card', 'invalid_type'], // invalid_type should be filtered out
        },
        user: { uid: 'user-123' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(stripeMocks.createSetupIntent).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentMethodTypes: ['card'], // Only 'card' allowed
        })
      );
    });
  });

  describe('Request Validation', () => {
    it('requires userId and email', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          // Missing email
        },
        user: { uid: 'user-123' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(stripeMocks.getOrCreateCustomer).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'validation',
          message: 'userId and email are required',
        })
      );
    });

    it('rejects non-POST requests', async () => {
      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await handler(req, res);

      expect(stripeMocks.getOrCreateCustomer).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(405);
    });
  });

  describe('User Access Control', () => {
    it('verifies user access matches userId', async () => {
      verifyUserAccess.mockReturnValue(false);

      stripeMocks.getOrCreateCustomer.mockResolvedValue({
        id: 'cus_test_123',
      });

      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-456',
          email: 'user@example.com',
        },
        user: { uid: 'user-123' }, // Different user
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(verifyUserAccess).toHaveBeenCalledWith('user-123', 'user-456');
      expect(stripeMocks.getOrCreateCustomer).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'forbidden',
          message: 'Access denied',
        })
      );
    });
  });

  describe('Rate Limiting', () => {
    it('handles rate limit exceeded', async () => {
      mockRateLimiter.check.mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + 60000,
        retryAfterMs: 30000,
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
          success: false,
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
          retryAfter: 30,
        })
      );
    });

    it('sets rate limit headers on successful request', async () => {
      stripeMocks.getOrCreateCustomer.mockResolvedValue({
        id: 'cus_test_123',
      });

      stripeMocks.createSetupIntent.mockResolvedValue({
        clientSecret: 'seti_test_123_secret_abc',
        setupIntentId: 'seti_test_123',
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

      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 10);
      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 10);
    });
  });

  describe('Error Handling', () => {
    it('handles customer creation failures', async () => {
      stripeMocks.getOrCreateCustomer.mockRejectedValue(
        new Error('Failed to create customer')
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

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'stripe',
        })
      );
    });

    it('handles setup intent creation failures', async () => {
      stripeMocks.getOrCreateCustomer.mockResolvedValue({
        id: 'cus_test_123',
      });

      stripeMocks.createSetupIntent.mockRejectedValue(
        new Error('Stripe API error')
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

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'stripe',
        })
      );
    });
  });
});
