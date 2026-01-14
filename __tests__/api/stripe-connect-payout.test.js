/**
 * Tests for /api/stripe/connect/payout endpoint
 * 
 * Critical payout route that sends money out (Tier 0 - 95%+ coverage).
 * Tests focus on realistic business scenarios:
 * - Successful payout creation
 * - Insufficient balance scenarios
 * - Account configuration issues
 * - Flagged account handling
 * - Amount validation
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
    statusCode: type === 'validation' ? 400 : type === 'not_found' ? 404 : type === 'forbidden' ? 403 : 500,
    body: { message, error: type },
  })),
  ErrorType: {
    VALIDATION: 'validation',
    NOT_FOUND: 'not_found',
    FORBIDDEN: 'forbidden',
    STRIPE: 'stripe',
    INTERNAL: 'internal',
  },
}));

jest.mock('../../../lib/stripe', () => ({
  createPayout: jest.fn(),
  getUserPaymentData: jest.fn(),
  getConnectAccountStatus: jest.fn(),
  logPaymentEvent: jest.fn(),
}));

jest.mock('../../../lib/firebase-utils', () => ({
  getDb: jest.fn(() => ({
    collection: jest.fn(),
  })),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  collection: jest.fn(),
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-123'),
}));

const { createMockRequest, createMockResponse } = require('../../factories');
const stripeMocks = require('../../../lib/stripe');
const { doc, getDoc } = require('firebase/firestore');

describe('/api/stripe/connect/payout', () => {
  let handler;
  let mockUserDoc;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    // Setup mock Firestore document
    mockUserDoc = {
      exists: jest.fn(() => true),
      data: jest.fn(() => ({
        balance: 500.00, // $500.00 in dollars
        paymentFlagged: false,
      })),
    };

    getDoc.mockResolvedValue(mockUserDoc);
    doc.mockImplementation((db, collection, id) => ({ db, collection, id }));

    // Setup default mocks
    stripeMocks.getUserPaymentData.mockResolvedValue({
      stripeConnectAccountId: 'acct_test_123',
    });

    stripeMocks.getConnectAccountStatus.mockResolvedValue({
      payoutsEnabled: true,
    });

    stripeMocks.createPayout.mockResolvedValue({
      payoutId: 'po_test_123',
      amountCents: 10000,
      status: 'pending',
    });

    stripeMocks.logPaymentEvent.mockResolvedValue(undefined);

    // Import handler after mocks are set up
    handler = require('../../../pages/api/stripe/connect/payout').default;
  });

  describe('Successful Payout Creation', () => {
    it('creates payout when user has sufficient balance and account is configured', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amountCents: 10000, // $100.00
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(stripeMocks.getUserPaymentData).toHaveBeenCalledWith('user-123');
      expect(stripeMocks.getConnectAccountStatus).toHaveBeenCalledWith('acct_test_123');
      expect(stripeMocks.createPayout).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          amountCents: 10000,
          description: 'Withdrawal',
        })
      );
      expect(stripeMocks.logPaymentEvent).toHaveBeenCalledWith(
        'user-123',
        'payout_initiated',
        expect.objectContaining({
          amountCents: 10000,
          severity: 'low',
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          payoutId: 'po_test_123',
          amountCents: 10000,
          status: 'pending',
        })
      );
    });

    it('uses provided idempotency key', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amountCents: 10000,
          idempotencyKey: 'custom-key-456',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(stripeMocks.createPayout).toHaveBeenCalledWith(
        expect.objectContaining({
          idempotencyKey: 'custom-key-456',
        })
      );
    });
  });

  describe('Insufficient Balance Scenarios', () => {
    it('rejects payout when user balance is insufficient', async () => {
      mockUserDoc.data.mockReturnValue({
        balance: 50.00, // $50.00
        paymentFlagged: false,
      });

      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amountCents: 10000, // $100.00 - exceeds balance
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(stripeMocks.createPayout).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'validation',
          message: 'Insufficient balance',
        })
      );
    });

    it('rejects payout when balance equals zero', async () => {
      mockUserDoc.data.mockReturnValue({
        balance: 0,
        paymentFlagged: false,
      });

      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amountCents: 1000, // $10.00 - minimum
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(stripeMocks.createPayout).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Account Configuration Issues', () => {
    it('rejects payout when Connect account is not configured', async () => {
      stripeMocks.getUserPaymentData.mockResolvedValue(null);

      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amountCents: 10000,
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(stripeMocks.createPayout).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'validation',
          message: expect.stringContaining('No payout account configured'),
        })
      );
    });

    it('rejects payout when account setup is incomplete', async () => {
      stripeMocks.getConnectAccountStatus.mockResolvedValue({
        payoutsEnabled: false,
        onboardingUrl: 'https://connect.stripe.com/setup/...',
      });

      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amountCents: 10000,
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(stripeMocks.createPayout).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'validation',
          message: expect.stringContaining('Payout account setup is not complete'),
          onboardingUrl: expect.any(String),
        })
      );
    });
  });

  describe('Flagged Account Handling', () => {
    it('rejects payout when user account is flagged', async () => {
      mockUserDoc.data.mockReturnValue({
        balance: 500.00,
        paymentFlagged: true,
      });

      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amountCents: 10000,
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(stripeMocks.createPayout).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'forbidden',
          message: expect.stringContaining('Withdrawals are temporarily unavailable'),
        })
      );
    });
  });

  describe('Amount Validation', () => {
    it('rejects payout below minimum amount ($10)', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amountCents: 999, // $9.99 - below minimum
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(stripeMocks.createPayout).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'validation',
          message: expect.stringContaining('Minimum withdrawal is $10.00'),
        })
      );
    });

    it('rejects payout above maximum amount ($100,000)', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amountCents: 10000001, // $100,000.01 - above maximum
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(stripeMocks.createPayout).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'validation',
          message: expect.stringContaining('Maximum withdrawal is $100,000.00'),
        })
      );
    });

    it('accepts payout at minimum amount', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amountCents: 1000, // $10.00 - exactly minimum
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(stripeMocks.createPayout).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Request Validation', () => {
    it('rejects requests with missing userId', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          amountCents: 10000,
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(stripeMocks.createPayout).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'validation',
          message: expect.stringContaining('userId and amountCents are required'),
        })
      );
    });

    it('rejects requests with missing amountCents', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(stripeMocks.createPayout).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('rejects non-POST requests', async () => {
      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await expect(handler(req, res)).rejects.toThrow('Method GET not allowed');
    });
  });

  describe('User Not Found', () => {
    it('rejects payout when user does not exist', async () => {
      mockUserDoc.exists.mockReturnValue(false);

      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-nonexistent',
          amountCents: 10000,
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(stripeMocks.createPayout).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'not_found',
          message: 'User not found',
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('handles payout creation failures gracefully', async () => {
      stripeMocks.createPayout.mockRejectedValue(new Error('Stripe API error'));

      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amountCents: 10000,
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(stripeMocks.logPaymentEvent).toHaveBeenCalledWith(
        'user-123',
        'payout_failed',
        expect.objectContaining({
          amountCents: 10000,
          severity: 'high',
        })
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'stripe',
        })
      );
    });
  });
});
