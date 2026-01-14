/**
 * Tests for /api/paystack/verify endpoint
 * 
 * Critical payment verification endpoint.
 * Tests focus on realistic business scenarios:
 * - Valid transaction verification
 * - Invalid/expired transaction verification
 * - Transaction status updates
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
  validateQueryParams: jest.fn((req, params, logger) => {
    params.forEach(param => {
      if (!req.query[param]) {
        throw new Error(`Missing query parameter: ${param}`);
      }
    });
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
    statusCode: type === 'validation' ? 400 : type === 'not_found' ? 404 : 500,
    body: { message, error: type },
  })),
  ErrorType: {
    VALIDATION: 'validation',
    NOT_FOUND: 'not_found',
    INTERNAL: 'internal',
  },
}));

jest.mock('../../../lib/paystack', () => ({
  verifyTransaction: jest.fn(),
  findTransactionByReference: jest.fn(),
  updateTransactionStatus: jest.fn(),
}));

jest.mock('../../../lib/paystack/currencyConfig', () => ({
  formatPaystackAmount: jest.fn((amount, currency) => {
    const formatted = (amount / 100).toFixed(2);
    return `${currency} ${formatted}`;
  }),
}));

jest.mock('../../../lib/errorTracking', () => ({
  captureError: jest.fn(),
}));

jest.mock('../../../lib/structuredLogger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

const { createMockRequest, createMockResponse } = require('../../factories');
const paystackMocks = require('../../../lib/paystack');

describe('/api/paystack/verify', () => {
  let handler;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    
    // Import handler after mocks are set up
    handler = require('../../../pages/api/paystack/verify').default;
  });

  describe('Valid Transaction Verification', () => {
    it('verifies valid successful transaction via GET', async () => {
      paystackMocks.verifyTransaction.mockResolvedValue({
        success: true,
        status: 'completed',
        data: {
          reference: 'ref_test_123',
          status: 'success',
          amount: 500000, // 5000 NGN in kobo
          currency: 'NGN',
          channel: 'card',
          gateway_response: 'Successful',
          paid_at: '2025-01-15T10:30:00.000Z',
        },
      });

      paystackMocks.findTransactionByReference.mockResolvedValue({
        id: 'txn_123',
        status: 'pending',
        reference: 'ref_test_123',
      });

      const req = createMockRequest({
        method: 'GET',
        query: { reference: 'ref_test_123' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(paystackMocks.verifyTransaction).toHaveBeenCalledWith('ref_test_123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            reference: 'ref_test_123',
            status: 'success',
            amountSmallestUnit: 500000,
            currency: 'NGN',
          }),
        })
      );
    });

    it('verifies valid successful transaction via POST', async () => {
      paystackMocks.verifyTransaction.mockResolvedValue({
        success: true,
        status: 'completed',
        data: {
          reference: 'ref_test_456',
          status: 'success',
          amount: 100000,
          currency: 'NGN',
          channel: 'bank',
          gateway_response: 'Successful',
          paid_at: '2025-01-15T11:00:00.000Z',
        },
      });

      paystackMocks.findTransactionByReference.mockResolvedValue(null);

      const req = createMockRequest({
        method: 'POST',
        body: { reference: 'ref_test_456' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(paystackMocks.verifyTransaction).toHaveBeenCalledWith('ref_test_456');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            status: 'success',
          }),
        })
      );
    });
  });

  describe('Invalid Transaction Verification', () => {
    it('returns error for transaction not found', async () => {
      paystackMocks.verifyTransaction.mockResolvedValue({
        success: false,
        status: 'failed',
        error: 'Transaction not found',
      });

      const req = createMockRequest({
        method: 'GET',
        query: { reference: 'ref_invalid_123' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(paystackMocks.verifyTransaction).toHaveBeenCalledWith('ref_invalid_123');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: false,
          error: expect.objectContaining({
            code: 'transaction_not_found',
          }),
        })
      );
    });

    it('returns error for missing reference (GET)', async () => {
      const req = createMockRequest({
        method: 'GET',
        query: {},
      });
      const res = createMockResponse();

      await expect(handler(req, res)).rejects.toThrow('Missing query parameter: reference');
    });

    it('returns error for missing reference (POST)', async () => {
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
            code: 'missing_reference',
          }),
        })
      );
    });
  });

  describe('Expired/Failed Transaction Verification', () => {
    it('handles failed transaction and updates status', async () => {
      paystackMocks.verifyTransaction.mockResolvedValue({
        success: false,
        status: 'failed',
        data: {
          reference: 'ref_failed_123',
          status: 'failed',
          amount: 500000,
          currency: 'NGN',
          gateway_response: 'Insufficient funds',
        },
      });

      paystackMocks.findTransactionByReference.mockResolvedValue({
        id: 'txn_failed_123',
        status: 'pending',
        reference: 'ref_failed_123',
      });

      const req = createMockRequest({
        method: 'GET',
        query: { reference: 'ref_failed_123' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(paystackMocks.updateTransactionStatus).toHaveBeenCalledWith(
        'txn_failed_123',
        'failed',
        'Insufficient funds'
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: true,
          data: expect.objectContaining({
            status: 'failed',
          }),
        })
      );
    });

    it('handles abandoned transaction', async () => {
      paystackMocks.verifyTransaction.mockResolvedValue({
        success: false,
        status: 'failed',
        data: {
          reference: 'ref_abandoned_123',
          status: 'abandoned',
          amount: 500000,
          currency: 'NGN',
          gateway_response: 'Transaction abandoned by user',
        },
      });

      paystackMocks.findTransactionByReference.mockResolvedValue({
        id: 'txn_abandoned_123',
        status: 'pending',
        reference: 'ref_abandoned_123',
      });

      const req = createMockRequest({
        method: 'GET',
        query: { reference: 'ref_abandoned_123' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(paystackMocks.updateTransactionStatus).toHaveBeenCalledWith(
        'txn_abandoned_123',
        'failed',
        'Transaction abandoned by user'
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'failed',
          }),
        })
      );
    });
  });

  describe('Pending Transaction Status', () => {
    it('handles pending transaction without updating status to failed', async () => {
      paystackMocks.verifyTransaction.mockResolvedValue({
        success: false,
        status: 'pending',
        data: {
          reference: 'ref_pending_123',
          status: 'pending',
          amount: 500000,
          currency: 'NGN',
        },
      });

      paystackMocks.findTransactionByReference.mockResolvedValue({
        id: 'txn_pending_123',
        status: 'pending',
        reference: 'ref_pending_123',
      });

      const req = createMockRequest({
        method: 'GET',
        query: { reference: 'ref_pending_123' },
      });
      const res = createMockResponse();

      await handler(req, res);

      // Should NOT update status for pending transactions
      expect(paystackMocks.updateTransactionStatus).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'pending',
          }),
        })
      );
    });
  });

  describe('Request Validation', () => {
    it('rejects non-GET/POST requests', async () => {
      const req = createMockRequest({ method: 'PUT' });
      const res = createMockResponse();

      await expect(handler(req, res)).rejects.toThrow('Method PUT not allowed');
    });
  });
});
