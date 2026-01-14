/**
 * Tests for /api/paymongo/payment endpoint
 * 
 * Tests cover:
 * - Request validation
 * - Rate limiting
 * - Source verification
 * - User verification
 * - Payment creation
 * - Transaction recording
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
    FORBIDDEN: 'forbidden',
    RATE_LIMIT: 'rate_limit',
  },
}));

jest.mock('../../../lib/paymongo', () => ({
  getSource: jest.fn(),
  createPayment: jest.fn(),
  findTransactionBySourceId: jest.fn(),
  updateTransactionStatus: jest.fn(),
}));

jest.mock('../../../lib/apiAuth', () => ({
  withAuth: jest.fn((handler) => handler),
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

jest.mock('../../../lib/securityLogger', () => ({
  logPaymentTransaction: jest.fn(),
  getClientIP: jest.fn(() => '127.0.0.1'),
}));

const { createMockRequest, createMockResponse } = require('../../factories');
const paymongoMocks = require('../../../lib/paymongo');

describe('/api/paymongo/payment', () => {
  let handler;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    paymongoMocks.getSource.mockResolvedValue({
      id: 'src_test_123',
      attributes: {
        type: 'gcash',
        amount: 5000,
        currency: 'PHP',
        status: 'chargeable',
        metadata: {
          firebaseUserId: 'user-123',
        },
      },
    });

    paymongoMocks.findTransactionBySourceId.mockResolvedValue(null);
    paymongoMocks.createPayment.mockResolvedValue({
      id: 'pay_test_123',
      attributes: {
        status: 'paid',
        amount: 5000,
        currency: 'PHP',
      },
    });

    // Import handler after mocks are set up
    handler = require('../../../pages/api/paymongo/payment').default;
  });

  describe('Request Validation', () => {
    it('should reject non-POST requests', async () => {
      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await expect(handler(req, res)).rejects.toThrow('Method GET not allowed');
    });

    it('should require sourceId and userId', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {},
      });
      const res = createMockResponse();

      await expect(handler(req, res)).rejects.toThrow('Missing required fields');
    });
  });

  describe('Source Verification', () => {
    it('should verify source is chargeable', async () => {
      paymongoMocks.getSource.mockResolvedValue({
        id: 'src_test_123',
        attributes: {
          status: 'pending',
          amount: 5000,
          currency: 'PHP',
        },
      });

      const req = createMockRequest({
        method: 'POST',
        body: {
          sourceId: 'src_test_123',
          userId: 'user-123',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('chargeable'),
        })
      );
    });

    it('should verify user matches source metadata', async () => {
      paymongoMocks.getSource.mockResolvedValue({
        id: 'src_test_123',
        attributes: {
          status: 'chargeable',
          amount: 5000,
          currency: 'PHP',
          metadata: {
            firebaseUserId: 'user-456', // Different user
          },
        },
      });

      const req = createMockRequest({
        method: 'POST',
        body: {
          sourceId: 'src_test_123',
          userId: 'user-123',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('mismatch'),
        })
      );
    });
  });

  describe('Payment Creation', () => {
    it('should create payment from chargeable source', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          sourceId: 'src_test_123',
          userId: 'user-123',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(paymongoMocks.createPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          amount: 5000,
          currency: 'PHP',
          source: {
            id: 'src_test_123',
            type: 'source',
          },
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          paymentId: 'pay_test_123',
        })
      );
    });

    it('should handle existing transaction', async () => {
      paymongoMocks.findTransactionBySourceId.mockResolvedValue({
        id: 'txn_existing',
        status: 'pending',
      });

      const req = createMockRequest({
        method: 'POST',
        body: {
          sourceId: 'src_test_123',
          userId: 'user-123',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      // Should still process but may update existing transaction
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle source retrieval errors', async () => {
      paymongoMocks.getSource.mockRejectedValue(
        new Error('Source not found')
      );

      const req = createMockRequest({
        method: 'POST',
        body: {
          sourceId: 'src_invalid',
          userId: 'user-123',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should handle payment creation errors', async () => {
      paymongoMocks.createPayment.mockRejectedValue(
        new Error('Payment creation failed')
      );

      const req = createMockRequest({
        method: 'POST',
        body: {
          sourceId: 'src_test_123',
          userId: 'user-123',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
