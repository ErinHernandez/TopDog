/**
 * Tests for /api/stripe/cancel-payment endpoint
 * 
 * Important payment route (P1 - 85%+ coverage).
 * Tests focus on realistic business scenarios:
 * - Cancelling payments in cancellable states
 * - User ownership verification
 * - Payment status validation
 * - Transaction updates
 * - Security logging
 */

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      retrieve: jest.fn(),
      cancel: jest.fn(),
    },
    errors: {
      StripeError: class StripeError extends Error {
        constructor(message, code) {
          super(message);
          this.code = code;
        }
      },
    },
  }));
});

jest.mock('../../../lib/firebase/firebaseAdmin', () => ({
  adminDb: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
        update: jest.fn(),
      })),
    })),
  },
}));

jest.mock('../../../lib/apiErrorHandler', () => ({
  withErrorHandling: jest.fn((req, res, handler) => handler(req, res, {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  }).catch((error) => {
    // Simulate catch block behavior
    if (error && error.name === 'StripeError') {
      return res.status(400).json({
        ok: false,
        error: { code: error.code || 'STRIPE_ERROR', message: error.message },
      });
    }
    throw error;
  })),
  validateMethod: jest.fn((req, methods, logger) => {
    if (!methods.includes(req.method)) {
      throw new Error(`Method ${req.method} not allowed`);
    }
  }),
  validateBody: jest.fn((req, fields, logger) => {
    fields.forEach(field => {
      if (!req.body[field]) {
        throw new Error(`Missing body field: ${field}`);
      }
    });
  }),
  createSuccessResponse: jest.fn((data, statusCode, logger) => ({
    statusCode,
    body: data,
  })),
  createErrorResponse: jest.fn((type, message, details, requestId) => ({
    statusCode: type === 'rate_limit' ? 429 : 400,
    body: { message, error: type },
  })),
  ErrorType: {
    RATE_LIMIT: 'rate_limit',
    VALIDATION: 'validation',
    FORBIDDEN: 'forbidden',
  },
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

jest.mock('../../../lib/securityLogger', () => ({
  logSecurityEvent: jest.fn(),
  getClientIP: jest.fn(() => '127.0.0.1'),
  SecurityEventType: {
    RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
    SUSPICIOUS_ACTIVITY: 'suspicious_activity',
    PAYMENT_TRANSACTION: 'payment_transaction',
  },
}));

jest.mock('../../../lib/inputSanitization', () => ({
  sanitizeID: jest.fn((id) => id),
}));

const { createMockRequest, createMockResponse } = require('../../factories');
const Stripe = require('stripe');
const { adminDb } = require('../../../lib/firebase/firebaseAdmin');
const securityMocks = require('../../../lib/securityLogger');
const { verifyUserAccess } = require('../../../lib/apiAuth');

describe('/api/stripe/cancel-payment', () => {
  let handler;
  let mockStripe;
  let mockTransactionDoc;
  let mockTransactionRef;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    mockStripe = new Stripe('sk_test_123');
    mockTransactionDoc = {
      exists: jest.fn(() => false),
      data: jest.fn(),
    };
    mockTransactionRef = {
      get: jest.fn(() => Promise.resolve(mockTransactionDoc)),
      update: jest.fn(() => Promise.resolve()),
    };
    adminDb.collection.mockReturnValue({
      doc: jest.fn(() => mockTransactionRef),
    });

    // Import handler after mocks are set up
    handler = require('../../../pages/api/stripe/cancel-payment').default;
  });

  describe('Successful Payment Cancellation', () => {
    it('cancels payment in requires_action status', async () => {
      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: 'pi_test_123',
        status: 'requires_action',
        metadata: { userId: 'user-123' },
      });

      mockStripe.paymentIntents.cancel.mockResolvedValue({
        id: 'pi_test_123',
        status: 'canceled',
      });

      const req = createMockRequest({
        method: 'POST',
        body: {
          paymentIntentId: 'pi_test_123',
          userId: 'user-123',
        },
        user: { uid: 'user-123' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(mockStripe.paymentIntents.retrieve).toHaveBeenCalledWith('pi_test_123');
      expect(mockStripe.paymentIntents.cancel).toHaveBeenCalledWith('pi_test_123', {
        cancellation_reason: 'requested_by_customer',
      });
      expect(securityMocks.logSecurityEvent).toHaveBeenCalledWith(
        securityMocks.SecurityEventType.PAYMENT_TRANSACTION,
        'high',
        expect.objectContaining({
          action: 'payment_cancelled',
          paymentIntentId: 'pi_test_123',
          userId: 'user-123',
        }),
        'user-123',
        '127.0.0.1'
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: true,
          data: {
            paymentIntentId: 'pi_test_123',
            status: 'canceled',
          },
        })
      );
    });

    it('updates transaction in Firebase when transaction exists', async () => {
      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: 'pi_test_123',
        status: 'requires_action',
        metadata: { userId: 'user-123' },
      });

      mockStripe.paymentIntents.cancel.mockResolvedValue({
        id: 'pi_test_123',
        status: 'canceled',
      });

      mockTransactionDoc.exists = jest.fn(() => true);

      const req = createMockRequest({
        method: 'POST',
        body: {
          paymentIntentId: 'pi_test_123',
          userId: 'user-123',
        },
        user: { uid: 'user-123' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(mockTransactionRef.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'cancelled',
          cancelledBy: 'user',
        })
      );
    });

    it('cancels payment in processing status', async () => {
      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: 'pi_test_123',
        status: 'processing',
        metadata: { userId: 'user-123' },
      });

      mockStripe.paymentIntents.cancel.mockResolvedValue({
        id: 'pi_test_123',
        status: 'canceled',
      });

      const req = createMockRequest({
        method: 'POST',
        body: {
          paymentIntentId: 'pi_test_123',
          userId: 'user-123',
        },
        user: { uid: 'user-123' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(mockStripe.paymentIntents.cancel).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Payment Status Validation', () => {
    const nonCancellableStatuses = ['succeeded', 'canceled', 'payment_failed', 'requires_capture'];

    nonCancellableStatuses.forEach(status => {
      it(`rejects cancellation when payment status is ${status}`, async () => {
        mockStripe.paymentIntents.retrieve.mockResolvedValue({
          id: 'pi_test_123',
          status,
          metadata: { userId: 'user-123' },
        });

        const req = createMockRequest({
          method: 'POST',
          body: {
            paymentIntentId: 'pi_test_123',
            userId: 'user-123',
          },
          user: { uid: 'user-123' },
        });
        const res = createMockResponse();

        await handler(req, res);

        expect(mockStripe.paymentIntents.cancel).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            ok: false,
            error: {
              code: 'CANNOT_CANCEL',
              message: 'Payment cannot be cancelled in its current state',
            },
          })
        );
      });
    });
  });

  describe('User Ownership Verification', () => {
    it('verifies ownership via metadata userId', async () => {
      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: 'pi_test_123',
        status: 'requires_action',
        metadata: { userId: 'user-123' },
      });

      mockStripe.paymentIntents.cancel.mockResolvedValue({
        id: 'pi_test_123',
        status: 'canceled',
      });

      const req = createMockRequest({
        method: 'POST',
        body: {
          paymentIntentId: 'pi_test_123',
          userId: 'user-123',
        },
        user: { uid: 'user-123' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(verifyUserAccess).toHaveBeenCalledWith('user-123', 'user-123');
      expect(mockStripe.paymentIntents.cancel).toHaveBeenCalled();
    });

    it('rejects cancellation when userId does not match metadata', async () => {
      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: 'pi_test_123',
        status: 'requires_action',
        metadata: { userId: 'user-456' }, // Different user
        customer: 'cus_test_123',
      });

      // Mock user document for fallback check
      const mockUserDoc = {
        exists: jest.fn(() => true),
        data: jest.fn(() => ({ stripeCustomerId: 'cus_test_999' })),
      };
      const mockUserRef = {
        get: jest.fn(() => Promise.resolve(mockUserDoc)),
      };
      adminDb.collection.mockReturnValueOnce({
        doc: jest.fn(() => mockUserRef),
      }).mockReturnValueOnce({
        doc: jest.fn(() => mockTransactionRef),
      });

      const req = createMockRequest({
        method: 'POST',
        body: {
          paymentIntentId: 'pi_test_123',
          userId: 'user-123',
        },
        user: { uid: 'user-123' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(mockStripe.paymentIntents.cancel).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to cancel this payment',
          },
        })
      );
      expect(securityMocks.logSecurityEvent).toHaveBeenCalledWith(
        securityMocks.SecurityEventType.SUSPICIOUS_ACTIVITY,
        'high',
        expect.objectContaining({
          reason: 'payment_ownership_mismatch',
        }),
        'user-123',
        '127.0.0.1'
      );
    });
  });

  describe('Request Validation', () => {
    it('requires paymentIntentId and userId', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          paymentIntentId: 'pi_test_123',
          // Missing userId
        },
      });
      const res = createMockResponse();

      await expect(handler(req, res)).rejects.toThrow('Missing body field: userId');
    });

    it('rejects non-POST requests', async () => {
      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await expect(handler(req, res)).rejects.toThrow('Method GET not allowed');
    });
  });

  describe('Error Handling', () => {
    it('handles Stripe errors gracefully', async () => {
      const stripeError = new Stripe.errors.StripeError('Payment not found', 'resource_missing');
      mockStripe.paymentIntents.retrieve.mockRejectedValue(stripeError);

      const req = createMockRequest({
        method: 'POST',
        body: {
          paymentIntentId: 'pi_invalid',
          userId: 'user-123',
        },
        user: { uid: 'user-123' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: false,
          error: expect.objectContaining({
            code: 'resource_missing',
          }),
        })
      );
    });

    it('handles cancellation failures', async () => {
      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: 'pi_test_123',
        status: 'requires_action',
        metadata: { userId: 'user-123' },
      });

      mockStripe.paymentIntents.cancel.mockRejectedValue(
        new Error('Cannot cancel payment')
      );

      const req = createMockRequest({
        method: 'POST',
        body: {
          paymentIntentId: 'pi_test_123',
          userId: 'user-123',
        },
        user: { uid: 'user-123' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Rate Limiting', () => {
    it('handles rate limit exceeded', async () => {
      const rateLimitMocks = require('../../../lib/rateLimitConfig');
      const mockLimiter = rateLimitMocks.createPaymentRateLimiter();
      mockLimiter.check.mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + 60000,
        retryAfterMs: 30000,
      });

      const req = createMockRequest({
        method: 'POST',
        body: {
          paymentIntentId: 'pi_test_123',
          userId: 'user-123',
        },
        user: { uid: 'user-123' },
      });
      const res = createMockResponse();

      // Re-import handler to get new rate limiter
      jest.resetModules();
      handler = require('../../../pages/api/stripe/cancel-payment').default;

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(securityMocks.logSecurityEvent).toHaveBeenCalledWith(
        securityMocks.SecurityEventType.RATE_LIMIT_EXCEEDED,
        'medium',
        expect.objectContaining({
          endpoint: '/api/stripe/cancel-payment',
        }),
        'user-123',
        '127.0.0.1'
      );
    });
  });
});
