/**
 * Tests for /api/stripe/payment-intent endpoint
 * 
 * Critical payment processing endpoint that creates Stripe payment intents.
 * Tests cover:
 * - Request validation
 * - Amount validation (currency-specific)
 * - Currency validation
 * - Payment method filtering
 * - Risk assessment
 * - Customer creation/retrieval
 * - Payment intent creation
 * - Error handling
 */

jest.mock('stripe');

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
    INTERNAL: 'internal',
  },
}));

jest.mock('../../../lib/stripe', () => ({
  getOrCreateCustomer: jest.fn(),
  createPaymentIntent: jest.fn(),
  createTransaction: jest.fn(),
  assessPaymentRisk: jest.fn(),
  logPaymentEvent: jest.fn(),
  getCurrencyConfig: jest.fn(),
  validateAmount: jest.fn(),
}));

jest.mock('../../../lib/csrfProtection', () => ({
  withCSRFProtection: jest.fn((handler) => handler),
}));

jest.mock('../../../lib/securityLogger', () => ({
  logPaymentTransaction: jest.fn(),
  getClientIP: jest.fn(() => '127.0.0.1'),
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-idempotency-key'),
}));

const Stripe = require('stripe');
const { createMockRequest, createMockResponse } = require('../../factories');
const stripeMocks = require('../../__mocks__/stripe');

describe('/api/stripe/payment-intent', () => {
  let handler;
  let mockStripe;
  let originalEnv;
  let stripeLibMocks;

  beforeAll(() => {
    originalEnv = {
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    };
  });

  afterAll(() => {
    process.env.STRIPE_SECRET_KEY = originalEnv.STRIPE_SECRET_KEY;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    // Set up environment
    process.env.STRIPE_SECRET_KEY = 'sk_test_12345';

    // Create mock Stripe instance
    mockStripe = stripeMocks.createMockStripe();
    Stripe.mockImplementation(() => mockStripe);

    stripeLibMocks = require('../../../lib/stripe');
    stripeLibMocks.getCurrencyConfig.mockResolvedValue({
      code: 'USD',
      minAmount: 500, // $5.00
      maxAmount: 1000000, // $10,000.00
    });
    stripeLibMocks.validateAmount.mockReturnValue({ valid: true });
    stripeLibMocks.assessPaymentRisk.mockResolvedValue({ risk: 'low' });
    stripeLibMocks.getOrCreateCustomer.mockResolvedValue({
      id: 'cus_test_123',
      email: 'user@example.com',
    });
    stripeLibMocks.createPaymentIntent.mockResolvedValue({
      id: 'pi_test_123',
      client_secret: 'pi_test_123_secret_test',
      status: 'requires_payment_method',
    });

    // Import handler after mocks are set up
    handler = require('../../../pages/api/stripe/payment-intent').default;
  });

  describe('Request Validation', () => {
    it('should reject non-POST requests', async () => {
      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await expect(handler(req, res)).rejects.toThrow('Method GET not allowed');
    });

    it('should require amountCents', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should require userId', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          amountCents: 5000,
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should validate minimum amount', async () => {
      stripeLibMocks.validateAmount.mockReturnValue({
        valid: false,
        error: 'Amount below minimum',
      });

      const req = createMockRequest({
        method: 'POST',
        body: {
          amountCents: 100, // Below $5.00 minimum
          userId: 'user-123',
          currency: 'USD',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Currency Validation', () => {
    it('should default to USD if currency not provided', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          amountCents: 5000,
          userId: 'user-123',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(stripeLibMocks.getCurrencyConfig).toHaveBeenCalledWith('USD');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should validate currency code', async () => {
      stripeLibMocks.getCurrencyConfig.mockResolvedValue(null);

      const req = createMockRequest({
        method: 'POST',
        body: {
          amountCents: 5000,
          userId: 'user-123',
          currency: 'INVALID',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Payment Intent Creation', () => {
    it('should create payment intent with valid data', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          amountCents: 5000,
          userId: 'user-123',
          currency: 'USD',
          email: 'user@example.com',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(stripeLibMocks.getOrCreateCustomer).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          email: 'user@example.com',
        })
      );
      expect(stripeLibMocks.createPaymentIntent).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should include risk assessment when provided', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          amountCents: 5000,
          userId: 'user-123',
          currency: 'USD',
          riskContext: {
            ipAddress: '127.0.0.1',
            country: 'US',
          },
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(stripeLibMocks.assessPaymentRisk).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should filter payment methods by currency and country', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          amountCents: 5000,
          userId: 'user-123',
          currency: 'EUR',
          country: 'NL',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(stripeLibMocks.createPaymentIntent).toHaveBeenCalledWith(
        expect.objectContaining({
          payment_method_types: expect.arrayContaining(['ideal']),
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should use existing payment method if provided', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          amountCents: 5000,
          userId: 'user-123',
          currency: 'USD',
          paymentMethodId: 'pm_test_123',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(stripeLibMocks.createPaymentIntent).toHaveBeenCalledWith(
        expect.objectContaining({
          payment_method: 'pm_test_123',
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle customer creation errors', async () => {
      stripeLibMocks.getOrCreateCustomer.mockRejectedValue(
        new Error('Customer creation failed')
      );

      const req = createMockRequest({
        method: 'POST',
        body: {
          amountCents: 5000,
          userId: 'user-123',
          currency: 'USD',
          email: 'user@example.com',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should handle payment intent creation errors', async () => {
      stripeLibMocks.createPaymentIntent.mockRejectedValue(
        new Error('Payment intent creation failed')
      );

      const req = createMockRequest({
        method: 'POST',
        body: {
          amountCents: 5000,
          userId: 'user-123',
          currency: 'USD',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should handle high risk payments', async () => {
      stripeLibMocks.assessPaymentRisk.mockResolvedValue({
        risk: 'high',
        reason: 'Suspicious activity',
      });

      const req = createMockRequest({
        method: 'POST',
        body: {
          amountCents: 5000,
          userId: 'user-123',
          currency: 'USD',
          riskContext: {
            ipAddress: '127.0.0.1',
          },
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      // Should still create payment intent but log risk
      expect(stripeLibMocks.logPaymentEvent).toHaveBeenCalled();
    });
  });

  describe('Idempotency', () => {
    it('should use provided idempotency key', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          amountCents: 5000,
          userId: 'user-123',
          currency: 'USD',
          idempotencyKey: 'custom-key-123',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(stripeLibMocks.createPaymentIntent).toHaveBeenCalledWith(
        expect.objectContaining({
          idempotencyKey: 'custom-key-123',
        })
      );
    });

    it('should generate idempotency key if not provided', async () => {
      const { v4 } = require('uuid');
      v4.mockReturnValueOnce('generated-key-123');

      const req = createMockRequest({
        method: 'POST',
        body: {
          amountCents: 5000,
          userId: 'user-123',
          currency: 'USD',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(stripeLibMocks.createPaymentIntent).toHaveBeenCalledWith(
        expect.objectContaining({
          idempotencyKey: 'generated-key-123',
        })
      );
    });
  });
});
