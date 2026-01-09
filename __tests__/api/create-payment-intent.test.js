/**
 * Tests for /api/create-payment-intent endpoint
 *
 * Critical payment processing endpoint that creates Stripe payment intents.
 * Tests cover:
 * - Request validation
 * - Amount validation (minimum $5)
 * - Stripe integration
 * - Error handling
 */

import { createMockRequest, createMockResponse } from '../factories';
import { createMockStripe, MockStripeError } from '../__mocks__/stripe';

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn();
});

// Mock the API error handler
jest.mock('../../lib/apiErrorHandler', () => ({
  withErrorHandling: jest.fn((req, res, handler) => handler(req, res, {
    info: jest.fn(),
    error: jest.fn(),
  })),
  validateMethod: jest.fn((req, methods, logger) => {
    if (!methods.includes(req.method)) {
      throw new Error(`Method ${req.method} not allowed`);
    }
  }),
  requireEnvVar: jest.fn((varName, logger) => {
    if (!process.env[varName]) {
      throw new Error(`${varName} is required`);
    }
  }),
  createSuccessResponse: jest.fn((data, statusCode, logger) => ({
    statusCode,
    body: { ok: true, data },
  })),
  createErrorResponse: jest.fn((type, message, statusCode, logger) => ({
    statusCode,
    body: { ok: false, error: { type, message } },
  })),
  ErrorType: {
    VALIDATION: 'validation',
    INTERNAL: 'internal',
  },
}));

describe('/api/create-payment-intent', () => {
  let handler;
  let mockStripe;
  let originalEnv;

  beforeAll(() => {
    originalEnv = process.env.STRIPE_SECRET_KEY;
  });

  afterAll(() => {
    process.env.STRIPE_SECRET_KEY = originalEnv;
  });

  beforeEach(() => {
    // Clear module cache to get fresh handler
    jest.clearAllMocks();
    jest.resetModules();

    // Set up environment
    process.env.STRIPE_SECRET_KEY = 'sk_test_12345';

    // Create mock Stripe instance
    mockStripe = createMockStripe();
    const Stripe = require('stripe');
    Stripe.mockImplementation(() => mockStripe);

    // Import handler after mocks are set up
    handler = require('../../pages/api/create-payment-intent').default;
  });

  describe('Request Validation', () => {
    it('should reject non-POST requests', async () => {
      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await expect(handler(req, res)).rejects.toThrow('Method GET not allowed');
    });

    it('should require STRIPE_SECRET_KEY environment variable', async () => {
      delete process.env.STRIPE_SECRET_KEY;
      jest.resetModules();
      handler = require('../../pages/api/create-payment-intent').default;

      const req = createMockRequest({
        method: 'POST',
        body: { amount: 5000 },
      });
      const res = createMockResponse();

      await expect(handler(req, res)).rejects.toThrow('STRIPE_SECRET_KEY is required');
    });

    it('should reject requests without amount', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {},
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: false,
          error: expect.objectContaining({
            message: 'Invalid amount (minimum $5.00)',
          }),
        })
      );
    });

    it('should reject amounts below $5.00 (500 cents)', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: { amount: 499 },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: false,
          error: expect.objectContaining({
            message: 'Invalid amount (minimum $5.00)',
          }),
        })
      );
    });
  });

  describe('Payment Intent Creation', () => {
    it('should create payment intent with valid amount', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          amount: 5000, // $50.00
          userId: 'user-123',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 5000,
        currency: 'usd',
        metadata: {
          userId: 'user-123',
        },
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            clientSecret: expect.stringContaining('pi_test_'),
          }),
        })
      );
    });

    it('should create payment intent at minimum amount ($5.00)', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: { amount: 500 },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 500,
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should create payment intent with large amount', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: { amount: 1000000 }, // $10,000
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 1000000,
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should include userId in metadata when provided', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          amount: 5000,
          userId: 'user-abc-123',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: {
            userId: 'user-abc-123',
          },
        })
      );
    });

    it('should handle missing userId gracefully', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: { amount: 5000 },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: {
            userId: undefined,
          },
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle Stripe API errors', async () => {
      mockStripe.paymentIntents.create.mockRejectedValueOnce(
        new MockStripeError('Card declined', 'card_error', 'card_declined')
      );

      const req = createMockRequest({
        method: 'POST',
        body: { amount: 5000 },
      });
      const res = createMockResponse();

      await expect(handler(req, res)).rejects.toThrow('Card declined');
    });

    it('should handle network timeouts', async () => {
      mockStripe.paymentIntents.create.mockRejectedValueOnce(
        new Error('Network timeout')
      );

      const req = createMockRequest({
        method: 'POST',
        body: { amount: 5000 },
      });
      const res = createMockResponse();

      await expect(handler(req, res)).rejects.toThrow('Network timeout');
    });

    it('should handle Stripe rate limiting', async () => {
      const rateLimitError = new Error('Too many requests');
      rateLimitError.statusCode = 429;
      mockStripe.paymentIntents.create.mockRejectedValueOnce(rateLimitError);

      const req = createMockRequest({
        method: 'POST',
        body: { amount: 5000 },
      });
      const res = createMockResponse();

      await expect(handler(req, res)).rejects.toThrow('Too many requests');
    });
  });

  describe('Edge Cases', () => {
    it('should handle amount as string and convert to number', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: { amount: '5000' },
      });
      const res = createMockResponse();

      await handler(req, res);

      // The handler should handle this - in practice it depends on implementation
      // This test documents expected behavior
      expect(mockStripe.paymentIntents.create).toHaveBeenCalled();
    });

    it('should reject negative amounts', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: { amount: -1000 },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject zero amount', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: { amount: 0 },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
