/**
 * Tests for /api/paymongo/payout endpoint
 * 
 * Critical payout route that sends money out (Tier 0 - 95%+ coverage).
 * Tests focus on realistic business scenarios:
 * - Successful payout with saved bank account
 * - Successful payout with new bank account
 * - Insufficient balance scenarios
 * - Amount validation (minimum 500 PHP)
 * - Bank account validation
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

jest.mock('../../../lib/paymongo', () => ({
  createPayout: jest.fn(),
  createPayMongoTransaction: jest.fn(),
  getSavedBankAccounts: jest.fn(),
  generateReference: jest.fn(() => 'PAY_test_123'),
}));

jest.mock('../../../lib/paymongo/currencyConfig', () => ({
  toSmallestUnit: jest.fn((amount) => Math.round(amount * 100)),
  toDisplayAmount: jest.fn((centavos) => centavos / 100),
  validateWithdrawalAmount: jest.fn(() => ({ isValid: true })),
  formatPhpAmount: jest.fn((centavos) => `₱${(centavos / 100).toFixed(2)}`),
}));

jest.mock('../../../lib/firebase', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  collection: jest.fn(),
}));

const { createMockRequest, createMockResponse } = require('../../factories');
const paymongoMocks = require('../../../lib/paymongo');
const currencyMocks = require('../../../lib/paymongo/currencyConfig');
const { doc, getDoc } = require('firebase/firestore');

describe('/api/paymongo/payout', () => {
  let handler;
  let mockUserDoc;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    // Setup mock Firestore document
    mockUserDoc = {
      exists: jest.fn(() => true),
      data: jest.fn(() => ({
        balance: 1000.00, // ₱1,000.00 PHP
      })),
    };

    getDoc.mockResolvedValue(mockUserDoc);
    doc.mockImplementation(() => ({ id: 'test-doc-ref' }));

    // Setup default mocks
    currencyMocks.toSmallestUnit.mockImplementation((amount) => Math.round(amount * 100));
    currencyMocks.toDisplayAmount.mockImplementation((centavos) => centavos / 100);
    currencyMocks.validateWithdrawalAmount.mockReturnValue({ isValid: true });

    paymongoMocks.getSavedBankAccounts.mockResolvedValue([
      {
        id: 'bank_account_123',
        bankCode: 'BDO',
        bankName: 'BDO Unibank',
        accountNumber: '1234567890',
        accountHolderName: 'Test User',
        accountNumberMasked: '****7890',
      },
    ]);

    paymongoMocks.createPayout.mockResolvedValue({
      payoutId: 'payout_test_123',
      status: 'pending',
    });

    paymongoMocks.createPayMongoTransaction.mockResolvedValue({
      id: 'txn_test_123',
    });

    // Import handler after mocks are set up
    handler = require('../../../pages/api/paymongo/payout').default;
  });

  describe('Successful Payout Creation', () => {
    it('creates payout with saved bank account when user has sufficient balance', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amount: 500, // ₱500.00 (minimum)
          bankAccountId: 'bank_account_123',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(paymongoMocks.getSavedBankAccounts).toHaveBeenCalledWith('user-123');
      expect(paymongoMocks.createPayout).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          amount: 50000, // 50,000 centavos
          currency: 'PHP',
          bank_code: 'BDO',
          account_number: '1234567890',
          account_holder_name: 'Test User',
        })
      );
      expect(paymongoMocks.createPayMongoTransaction).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          payoutId: 'payout_test_123',
          transactionId: 'txn_test_123',
          status: 'pending',
        })
      );
    });

    it('creates payout with new bank account details', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amount: 1000,
          bankAccountId: 'new',
          newBankAccount: {
            bankCode: 'BPI',
            accountNumber: '9876543210',
            accountHolderName: 'New User',
            saveForFuture: false,
          },
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(paymongoMocks.createPayout).toHaveBeenCalledWith(
        expect.objectContaining({
          bank_code: 'BPI',
          account_number: '9876543210',
          account_holder_name: 'New User',
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Insufficient Balance Scenarios', () => {
    it('rejects payout when user balance is insufficient', async () => {
      mockUserDoc.data.mockReturnValue({
        balance: 100.00, // ₱100.00
      });

      currencyMocks.validateWithdrawalAmount.mockReturnValue({
        isValid: false,
        error: 'Insufficient balance. You have ₱100.00',
      });

      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amount: 500, // ₱500.00 - exceeds balance
          bankAccountId: 'bank_account_123',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(paymongoMocks.createPayout).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Insufficient balance'),
        })
      );
    });

    it('rejects payout when balance equals zero', async () => {
      mockUserDoc.data.mockReturnValue({
        balance: 0,
      });

      currencyMocks.validateWithdrawalAmount.mockReturnValue({
        isValid: false,
        error: 'Insufficient balance. You have ₱0.00',
      });

      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amount: 500,
          bankAccountId: 'bank_account_123',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(paymongoMocks.createPayout).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Amount Validation', () => {
    it('rejects payout below minimum amount (₱500)', async () => {
      currencyMocks.validateWithdrawalAmount.mockReturnValue({
        isValid: false,
        error: 'Minimum withdrawal is ₱500.00',
        formattedMin: '₱500.00',
      });

      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amount: 499, // ₱499.00 - below minimum
          bankAccountId: 'bank_account_123',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(paymongoMocks.createPayout).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Minimum withdrawal is ₱500.00'),
        })
      );
    });

    it('rejects negative amounts', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amount: -100,
          bankAccountId: 'bank_account_123',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(paymongoMocks.createPayout).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Invalid amount',
        })
      );
    });

    it('rejects zero amounts', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amount: 0,
          bankAccountId: 'bank_account_123',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('accepts payout at minimum amount (₱500)', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amount: 500, // ₱500.00 - exactly minimum
          bankAccountId: 'bank_account_123',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(paymongoMocks.createPayout).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Bank Account Validation', () => {
    it('rejects payout when saved bank account does not exist', async () => {
      paymongoMocks.getSavedBankAccounts.mockResolvedValue([]);

      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amount: 500,
          bankAccountId: 'bank_account_nonexistent',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(paymongoMocks.createPayout).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Bank account not found',
        })
      );
    });

    it('rejects payout when new bank account details are missing', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amount: 500,
          bankAccountId: 'new',
          // Missing newBankAccount
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(paymongoMocks.createPayout).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'New bank account details required',
        })
      );
    });

    it('rejects payout when new bank account fields are incomplete', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amount: 500,
          bankAccountId: 'new',
          newBankAccount: {
            bankCode: 'BDO',
            // Missing accountNumber and accountHolderName
          },
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(paymongoMocks.createPayout).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Request Validation', () => {
    it('rejects requests with missing userId', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          amount: 500,
          bankAccountId: 'bank_account_123',
        },
      });
      const res = createMockResponse();

      await expect(handler(req, res)).rejects.toThrow('Missing body field: userId');
    });

    it('rejects requests with missing amount', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          bankAccountId: 'bank_account_123',
        },
      });
      const res = createMockResponse();

      await expect(handler(req, res)).rejects.toThrow('Missing body field: amount');
    });

    it('rejects requests with missing bankAccountId', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amount: 500,
        },
      });
      const res = createMockResponse();

      await expect(handler(req, res)).rejects.toThrow('Missing body field: bankAccountId');
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
          amount: 500,
          bankAccountId: 'bank_account_123',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(paymongoMocks.createPayout).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'User not found',
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('handles payout creation failures gracefully', async () => {
      paymongoMocks.createPayout.mockRejectedValue(new Error('PayMongo API error'));

      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amount: 500,
          bankAccountId: 'bank_account_123',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
