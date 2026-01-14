/**
 * Tests for /api/paystack/transfer/initiate endpoint
 * 
 * Critical payout route that sends money out (Tier 0 - 95%+ coverage).
 * Tests focus on realistic business scenarios:
 * - Successful transfer initiation
 * - Insufficient balance scenarios
 * - Currency validation and conversion
 * - Recipient validation
 * - Transfer fee calculation
 * - Concurrent withdrawal prevention
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
    statusCode: type === 'validation' ? 400 : type === 'not_found' ? 404 : type === 'external_api' ? 502 : 500,
    body: { message, error: type },
  })),
  ErrorType: {
    VALIDATION: 'validation',
    NOT_FOUND: 'not_found',
    EXTERNAL_API: 'external_api',
    INTERNAL: 'internal',
  },
}));

jest.mock('../../../lib/paystack', () => ({
  initiateTransfer: jest.fn(),
  generateReference: jest.fn(() => 'TRF_test_123'),
  createPaystackTransaction: jest.fn(),
}));

jest.mock('../../../lib/paystack/currencyConfig', () => ({
  validatePaystackAmount: jest.fn(() => ({ isValid: true })),
  formatPaystackAmount: jest.fn((amount, currency) => `${currency} ${(amount / 100).toFixed(2)}`),
  calculateTransferFee: jest.fn((amount, currency, type) => {
    // Mock fee calculation: NGN bank = 2500 kobo (₦25)
    if (currency === 'NGN') return 2500;
    if (currency === 'GHS') return type === 'mobile_money' ? 100 : 800;
    return 300; // Default fee
  }),
  validateTransferFee: jest.fn(() => ({ isValid: true })),
}));

jest.mock('../../../lib/stripe/exchangeRates', () => ({
  getStripeExchangeRate: jest.fn(() => Promise.resolve({ rate: 0.0012 })), // 1 NGN = 0.0012 USD
  convertToUSD: jest.fn((amount, rate) => amount * rate),
}));

jest.mock('../../../lib/firebase', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  runTransaction: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
}));

const { createMockRequest, createMockResponse } = require('../../factories');
const paystackMocks = require('../../../lib/paystack');
const currencyMocks = require('../../../lib/paystack/currencyConfig');
const { doc, getDoc, runTransaction } = require('firebase/firestore');
const { getStripeExchangeRate, convertToUSD } = require('../../../lib/stripe/exchangeRates');

describe('/api/paystack/transfer/initiate', () => {
  let handler;
  let mockUserDoc;
  let mockTransaction;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    // Setup mock Firestore document
    mockUserDoc = {
      exists: jest.fn(() => true),
      data: jest.fn(() => ({
        balance: 100.00, // $100.00 USD
        paystackTransferRecipients: [
          {
            code: 'RCP_test_123',
            type: 'nuban',
            currency: 'NGN',
            accountNumber: '1234567890',
            accountName: 'Test User',
            bankName: 'Test Bank',
          },
        ],
        pendingWithdrawalReference: null,
      })),
    };

    mockTransaction = {
      get: jest.fn(),
      update: jest.fn(),
    };

    getDoc.mockResolvedValue(mockUserDoc);
    doc.mockImplementation(() => ({ id: 'test-doc-ref' }));
    runTransaction.mockImplementation(async (callback) => {
      mockTransaction.get.mockResolvedValue(mockUserDoc);
      return callback(mockTransaction);
    });

    // Setup default mocks
    currencyMocks.validatePaystackAmount.mockReturnValue({ isValid: true });
    currencyMocks.calculateTransferFee.mockReturnValue(2500); // ₦25 fee
    currencyMocks.validateTransferFee.mockReturnValue({ isValid: true });
    getStripeExchangeRate.mockResolvedValue({ rate: 0.0012 }); // 1 NGN = 0.0012 USD
    convertToUSD.mockImplementation((amount, rate) => amount * rate);

    paystackMocks.initiateTransfer.mockResolvedValue({
      transferCode: 'TRF_test_456',
      reference: 'TRF_test_123',
      status: 'pending',
    });

    paystackMocks.createPaystackTransaction.mockResolvedValue({
      id: 'txn_test_123',
    });

    // Import handler after mocks are set up
    handler = require('../../../pages/api/paystack/transfer/initiate').default;
  });

  describe('Successful Transfer Initiation', () => {
    it('creates transfer when user has sufficient balance and valid recipient', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amountSmallestUnit: 500000, // ₦5,000 (500,000 kobo)
          currency: 'NGN',
          recipientCode: 'RCP_test_123',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(currencyMocks.validatePaystackAmount).toHaveBeenCalledWith(500000, 'NGN');
      expect(currencyMocks.calculateTransferFee).toHaveBeenCalledWith(500000, 'NGN', 'bank');
      expect(getStripeExchangeRate).toHaveBeenCalledWith('NGN');
      expect(paystackMocks.initiateTransfer).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: true,
        })
      );
    });

    it('handles mobile money transfers correctly', async () => {
      mockUserDoc.data.mockReturnValue({
        balance: 100.00,
        paystackTransferRecipients: [
          {
            code: 'RCP_mobile_123',
            type: 'mobile_money',
            currency: 'GHS',
            accountNumber: '1234567890',
          },
        ],
      });

      currencyMocks.calculateTransferFee.mockReturnValue(100); // GH₵1 for mobile money

      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amountSmallestUnit: 10000, // GH₵100 (10,000 pesewas)
          currency: 'GHS',
          recipientCode: 'RCP_mobile_123',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(currencyMocks.calculateTransferFee).toHaveBeenCalledWith(10000, 'GHS', 'mobile_money');
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Insufficient Balance Scenarios', () => {
    it('rejects transfer when USD balance is insufficient after currency conversion', async () => {
      mockUserDoc.data.mockReturnValue({
        balance: 1.00, // $1.00 USD
        paystackTransferRecipients: [
          {
            code: 'RCP_test_123',
            currency: 'NGN',
          },
        ],
      });

      // Mock transaction to throw insufficient balance error
      runTransaction.mockImplementation(async (callback) => {
        const error = new Error('Insufficient balance. Available: $1.00 USD, Required: $6.03 USD');
        throw error;
      });

      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amountSmallestUnit: 500000, // ₦5,000 + fee = ₦5,025 = ~$6.03 USD
          currency: 'NGN',
          recipientCode: 'RCP_test_123',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(paystackMocks.initiateTransfer).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: false,
          error: expect.objectContaining({
            code: 'insufficient_balance',
          }),
        })
      );
    });
  });

  describe('Currency Validation', () => {
    it('rejects invalid currency codes', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amountSmallestUnit: 500000,
          currency: 'USD', // Not supported by Paystack
          recipientCode: 'RCP_test_123',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(paystackMocks.initiateTransfer).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: false,
          error: expect.objectContaining({
            code: 'invalid_currency',
          }),
        })
      );
    });

    it('rejects transfer when recipient currency does not match request currency', async () => {
      mockUserDoc.data.mockReturnValue({
        balance: 100.00,
        paystackTransferRecipients: [
          {
            code: 'RCP_test_123',
            currency: 'GHS', // Recipient is for GHS
          },
        ],
      });

      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amountSmallestUnit: 500000,
          currency: 'NGN', // But requesting NGN
          recipientCode: 'RCP_test_123',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(paystackMocks.initiateTransfer).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: false,
          error: expect.objectContaining({
            code: 'currency_mismatch',
          }),
        })
      );
    });
  });

  describe('Recipient Validation', () => {
    it('rejects transfer when recipient does not exist', async () => {
      mockUserDoc.data.mockReturnValue({
        balance: 100.00,
        paystackTransferRecipients: [], // No recipients
      });

      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amountSmallestUnit: 500000,
          currency: 'NGN',
          recipientCode: 'RCP_nonexistent',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(paystackMocks.initiateTransfer).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: false,
          error: expect.objectContaining({
            code: 'recipient_not_found',
          }),
        })
      );
    });
  });

  describe('Amount Validation', () => {
    it('rejects negative amounts', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amountSmallestUnit: -1000,
          currency: 'NGN',
          recipientCode: 'RCP_test_123',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: false,
          error: expect.objectContaining({
            code: 'invalid_amount',
          }),
        })
      );
    });

    it('rejects zero amounts', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amountSmallestUnit: 0,
          currency: 'NGN',
          recipientCode: 'RCP_test_123',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('validates amount against Paystack limits', async () => {
      currencyMocks.validatePaystackAmount.mockReturnValue({
        isValid: false,
        error: 'Amount below minimum',
      });

      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amountSmallestUnit: 5000, // Below minimum
          currency: 'NGN',
          recipientCode: 'RCP_test_123',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Concurrent Withdrawal Prevention', () => {
    it('rejects transfer when another withdrawal is in progress', async () => {
      mockUserDoc.data.mockReturnValue({
        balance: 100.00,
        paystackTransferRecipients: [
          {
            code: 'RCP_test_123',
            currency: 'NGN',
          },
        ],
        pendingWithdrawalReference: 'TRF_other_123', // Another withdrawal in progress
      });

      runTransaction.mockImplementation(async (callback) => {
        const error = new Error('A withdrawal is already in progress. Please wait for it to complete.');
        throw error;
      });

      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amountSmallestUnit: 500000,
          currency: 'NGN',
          recipientCode: 'RCP_test_123',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(paystackMocks.initiateTransfer).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: false,
          error: expect.objectContaining({
            code: 'withdrawal_in_progress',
          }),
        })
      );
    });
  });

  describe('Exchange Rate Handling', () => {
    it('handles exchange rate API failures gracefully', async () => {
      getStripeExchangeRate.mockRejectedValue(new Error('Exchange rate API unavailable'));

      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amountSmallestUnit: 500000,
          currency: 'NGN',
          recipientCode: 'RCP_test_123',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(paystackMocks.initiateTransfer).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(502);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: false,
          error: expect.objectContaining({
            code: 'exchange_rate_failed',
          }),
        })
      );
    });
  });

  describe('User Not Found', () => {
    it('rejects transfer when user does not exist', async () => {
      mockUserDoc.exists.mockReturnValue(false);

      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-nonexistent',
          amountSmallestUnit: 500000,
          currency: 'NGN',
          recipientCode: 'RCP_test_123',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(paystackMocks.initiateTransfer).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: false,
          error: expect.objectContaining({
            code: 'user_not_found',
          }),
        })
      );
    });
  });

  describe('Request Validation', () => {
    it('rejects non-POST requests', async () => {
      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await expect(handler(req, res)).rejects.toThrow('Method GET not allowed');
    });

    it('validates required fields', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          // Missing amountSmallestUnit, currency, recipientCode
        },
      });
      const res = createMockResponse();

      await expect(handler(req, res)).rejects.toThrow('Missing body field');
    });
  });
});
