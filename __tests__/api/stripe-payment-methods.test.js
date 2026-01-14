/**
 * Tests for /api/stripe/payment-methods endpoint
 * 
 * Important payment route (P1 - 85%+ coverage).
 * Tests focus on realistic business scenarios:
 * - Listing payment methods (GET)
 * - Removing payment methods (DELETE)
 * - Setting default payment method (PATCH)
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
    statusCode: type === 'validation' ? 400 : type === 'not_found' ? 404 : type === 'stripe' ? 500 : 405,
    body: { message, error: type },
  })),
  ErrorType: {
    VALIDATION: 'validation',
    NOT_FOUND: 'not_found',
    STRIPE: 'stripe',
    METHOD_NOT_ALLOWED: 'method_not_allowed',
  },
}));

jest.mock('../../../lib/stripe', () => ({
  getCustomerWithPaymentMethods: jest.fn(),
  detachPaymentMethod: jest.fn(),
  setDefaultPaymentMethod: jest.fn(),
  getUserPaymentData: jest.fn(),
  logPaymentEvent: jest.fn(),
}));

jest.mock('../../../lib/apiAuth', () => ({
  withAuth: jest.fn((handler) => handler),
}));

jest.mock('../../../lib/rateLimitConfig', () => ({
  createPaymentRateLimiter: jest.fn(() => ({
    check: jest.fn(() => Promise.resolve({ allowed: true, remaining: 10 })),
  })),
  withRateLimit: jest.fn((handler) => handler),
}));

jest.mock('../../../lib/csrfProtection', () => ({
  withCSRFProtection: jest.fn((handler) => handler),
}));

const { createMockRequest, createMockResponse } = require('../../factories');
const stripeMocks = require('../../../lib/stripe');

describe('/api/stripe/payment-methods', () => {
  let handler;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    
    // Import handler after mocks are set up
    handler = require('../../../pages/api/stripe/payment-methods').default;
  });

  describe('GET - List Payment Methods', () => {
    it('returns empty array when user has no Stripe customer', async () => {
      stripeMocks.getUserPaymentData.mockResolvedValue(null);

      const req = createMockRequest({
        method: 'GET',
        query: { userId: 'user-123' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(stripeMocks.getUserPaymentData).toHaveBeenCalledWith('user-123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentMethods: [],
          defaultPaymentMethodId: null,
        })
      );
    });

    it('returns payment methods when customer exists', async () => {
      stripeMocks.getUserPaymentData.mockResolvedValue({
        stripeCustomerId: 'cus_test_123',
      });

      stripeMocks.getCustomerWithPaymentMethods.mockResolvedValue({
        customer: { id: 'cus_test_123' },
        paymentMethods: [
          {
            id: 'pm_test_123',
            type: 'card',
            card: {
              brand: 'visa',
              last4: '4242',
              exp_month: 12,
              exp_year: 2025,
              funding: 'credit',
            },
            created: 1234567890,
          },
        ],
        defaultPaymentMethodId: 'pm_test_123',
      });

      const req = createMockRequest({
        method: 'GET',
        query: { userId: 'user-123' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(stripeMocks.getCustomerWithPaymentMethods).toHaveBeenCalledWith('cus_test_123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentMethods: expect.arrayContaining([
            expect.objectContaining({
              id: 'pm_test_123',
              type: 'card',
              isDefault: true,
            }),
          ]),
          defaultPaymentMethodId: 'pm_test_123',
        })
      );
    });

    it('marks default payment method correctly', async () => {
      stripeMocks.getUserPaymentData.mockResolvedValue({
        stripeCustomerId: 'cus_test_123',
      });

      stripeMocks.getCustomerWithPaymentMethods.mockResolvedValue({
        customer: { id: 'cus_test_123' },
        paymentMethods: [
          {
            id: 'pm_test_123',
            type: 'card',
            card: { brand: 'visa', last4: '4242', exp_month: 12, exp_year: 2025 },
            created: 1234567890,
          },
          {
            id: 'pm_test_456',
            type: 'card',
            card: { brand: 'mastercard', last4: '8888', exp_month: 6, exp_year: 2026 },
            created: 1234567891,
          },
        ],
        defaultPaymentMethodId: 'pm_test_123',
      });

      const req = createMockRequest({
        method: 'GET',
        query: { userId: 'user-123' },
      });
      const res = createMockResponse();

      await handler(req, res);

      const responseBody = res.json.mock.calls[0][0];
      expect(responseBody.paymentMethods[0].isDefault).toBe(true);
      expect(responseBody.paymentMethods[1].isDefault).toBe(false);
    });

    it('requires userId query parameter', async () => {
      const req = createMockRequest({
        method: 'GET',
        query: {},
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'validation',
          message: expect.stringContaining('userId'),
        })
      );
    });

    it('handles errors when listing payment methods fails', async () => {
      stripeMocks.getUserPaymentData.mockResolvedValue({
        stripeCustomerId: 'cus_test_123',
      });

      stripeMocks.getCustomerWithPaymentMethods.mockRejectedValue(
        new Error('Stripe API error')
      );

      const req = createMockRequest({
        method: 'GET',
        query: { userId: 'user-123' },
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

  describe('DELETE - Detach Payment Method', () => {
    it('successfully removes payment method', async () => {
      stripeMocks.detachPaymentMethod.mockResolvedValue(undefined);
      stripeMocks.logPaymentEvent.mockResolvedValue(undefined);

      const req = createMockRequest({
        method: 'DELETE',
        body: {
          userId: 'user-123',
          paymentMethodId: 'pm_test_123',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(stripeMocks.detachPaymentMethod).toHaveBeenCalledWith('pm_test_123');
      expect(stripeMocks.logPaymentEvent).toHaveBeenCalledWith(
        'user-123',
        'payment_method_removed',
        expect.objectContaining({
          severity: 'low',
          metadata: { paymentMethodId: 'pm_test_123' },
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Payment method removed',
        })
      );
    });

    it('requires userId and paymentMethodId', async () => {
      const req = createMockRequest({
        method: 'DELETE',
        body: {
          userId: 'user-123',
          // Missing paymentMethodId
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(stripeMocks.detachPaymentMethod).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'validation',
          message: expect.stringContaining('userId and paymentMethodId are required'),
        })
      );
    });

    it('handles errors when detaching payment method fails', async () => {
      stripeMocks.detachPaymentMethod.mockRejectedValue(
        new Error('Payment method not found')
      );

      const req = createMockRequest({
        method: 'DELETE',
        body: {
          userId: 'user-123',
          paymentMethodId: 'pm_invalid',
        },
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

  describe('PATCH - Set Default Payment Method', () => {
    it('successfully sets default payment method', async () => {
      stripeMocks.getUserPaymentData.mockResolvedValue({
        stripeCustomerId: 'cus_test_123',
      });

      stripeMocks.setDefaultPaymentMethod.mockResolvedValue(undefined);

      const req = createMockRequest({
        method: 'PATCH',
        body: {
          userId: 'user-123',
          paymentMethodId: 'pm_test_456',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(stripeMocks.getUserPaymentData).toHaveBeenCalledWith('user-123');
      expect(stripeMocks.setDefaultPaymentMethod).toHaveBeenCalledWith(
        'cus_test_123',
        'pm_test_456'
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          defaultPaymentMethodId: 'pm_test_456',
        })
      );
    });

    it('requires userId and paymentMethodId', async () => {
      const req = createMockRequest({
        method: 'PATCH',
        body: {
          userId: 'user-123',
          // Missing paymentMethodId
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(stripeMocks.setDefaultPaymentMethod).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns error when user has no Stripe customer', async () => {
      stripeMocks.getUserPaymentData.mockResolvedValue(null);

      const req = createMockRequest({
        method: 'PATCH',
        body: {
          userId: 'user-123',
          paymentMethodId: 'pm_test_456',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(stripeMocks.setDefaultPaymentMethod).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'not_found',
          message: 'No Stripe customer found',
        })
      );
    });

    it('handles errors when setting default payment method fails', async () => {
      stripeMocks.getUserPaymentData.mockResolvedValue({
        stripeCustomerId: 'cus_test_123',
      });

      stripeMocks.setDefaultPaymentMethod.mockRejectedValue(
        new Error('Payment method not found')
      );

      const req = createMockRequest({
        method: 'PATCH',
        body: {
          userId: 'user-123',
          paymentMethodId: 'pm_invalid',
        },
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

  describe('Request Validation', () => {
    it('rejects unsupported HTTP methods', async () => {
      const req = createMockRequest({ method: 'POST' });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(405);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'method_not_allowed',
        })
      );
    });
  });
});
