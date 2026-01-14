/**
 * Tests for /api/xendit/disbursement endpoint
 * 
 * Critical disbursement route that sends money out (Tier 0 - 95%+ coverage).
 * Tests focus on realistic business scenarios:
 * - Successful disbursement with saved account
 * - Successful disbursement with new account
 * - Insufficient balance scenarios
 * - Amount validation (minimum 100,000 IDR)
 * - Balance restoration on failure (critical feature)
 * - Account validation
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

jest.mock('../../../lib/xendit', () => ({
  createDisbursement: jest.fn(),
  createXenditTransaction: jest.fn(),
  getSavedDisbursementAccounts: jest.fn(),
  generateReference: jest.fn(() => 'DIS_test_123'),
}));

jest.mock('../../../lib/xendit/currencyConfig', () => ({
  validateWithdrawalAmount: jest.fn(() => ({ isValid: true })),
  formatIdrAmount: jest.fn((amount) => `Rp ${amount.toLocaleString('id-ID')}`),
}));

jest.mock('../../../lib/firebase', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
}));

const { createMockRequest, createMockResponse } = require('../../factories');
const xenditMocks = require('../../../lib/xendit');
const currencyMocks = require('../../../lib/xendit/currencyConfig');
const { doc, getDoc, setDoc, updateDoc } = require('firebase/firestore');

describe('/api/xendit/disbursement', () => {
  let handler;
  let mockUserDoc;
  let originalBalance;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    originalBalance = 1000000; // Rp 1,000,000 IDR

    // Setup mock Firestore document
    mockUserDoc = {
      exists: jest.fn(() => true),
      data: jest.fn(() => ({
        balance: originalBalance,
      })),
    };

    getDoc.mockResolvedValue(mockUserDoc);
    doc.mockImplementation(() => ({ id: 'test-doc-ref' }));
    setDoc.mockResolvedValue(undefined);
    updateDoc.mockResolvedValue(undefined);

    // Setup default mocks
    currencyMocks.validateWithdrawalAmount.mockReturnValue({ isValid: true });

    xenditMocks.getSavedDisbursementAccounts.mockResolvedValue([
      {
        id: 'account_123',
        channelCode: 'BCA',
        accountNumber: '1234567890',
        accountHolderName: 'Test User',
        accountNumberMasked: '****7890',
      },
    ]);

    xenditMocks.createDisbursement.mockResolvedValue({
      disbursementId: 'disb_test_123',
      status: 'PENDING',
    });

    xenditMocks.createXenditTransaction.mockResolvedValue({
      id: 'txn_test_123',
    });

    // Import handler after mocks are set up
    handler = require('../../../pages/api/xendit/disbursement').default;
  });

  describe('Successful Disbursement Creation', () => {
    it('creates disbursement with saved account and debits balance', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amount: 100000, // Rp 100,000 (minimum)
          accountId: 'account_123',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(xenditMocks.getSavedDisbursementAccounts).toHaveBeenCalledWith('user-123');
      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          balance: originalBalance - 100000, // Balance debited
        }),
        expect.anything()
      );
      expect(xenditMocks.createDisbursement).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          amount: 100000,
          bank_code: 'BCA',
          account_number: '1234567890',
          account_holder_name: 'Test User',
        })
      );
      expect(xenditMocks.createXenditTransaction).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          disbursementId: 'disb_test_123',
          transactionId: 'txn_test_123',
          status: 'PENDING',
        })
      );
    });

    it('creates disbursement with new account details', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amount: 200000,
          accountId: 'new',
          newAccount: {
            bankCode: 'MANDIRI',
            accountNumber: '9876543210',
            accountHolderName: 'New User',
            saveForFuture: false,
          },
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(xenditMocks.createDisbursement).toHaveBeenCalledWith(
        expect.objectContaining({
          bank_code: 'MANDIRI',
          account_number: '9876543210',
          account_holder_name: 'New User',
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Insufficient Balance Scenarios', () => {
    it('rejects disbursement when user balance is insufficient', async () => {
      mockUserDoc.data.mockReturnValue({
        balance: 50000, // Rp 50,000
      });

      currencyMocks.validateWithdrawalAmount.mockReturnValue({
        isValid: false,
        error: 'Insufficient balance. You have Rp 50,000',
      });

      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amount: 100000, // Rp 100,000 - exceeds balance
          accountId: 'account_123',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(xenditMocks.createDisbursement).not.toHaveBeenCalled();
      expect(setDoc).not.toHaveBeenCalled(); // Balance should not be debited
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Insufficient balance'),
        })
      );
    });
  });

  describe('Amount Validation', () => {
    it('rejects disbursement below minimum amount (Rp 100,000)', async () => {
      currencyMocks.validateWithdrawalAmount.mockReturnValue({
        isValid: false,
        error: 'Minimum withdrawal is Rp 100,000',
      });

      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amount: 99999, // Rp 99,999 - below minimum
          accountId: 'account_123',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(xenditMocks.createDisbursement).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('rejects negative amounts', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amount: -10000,
          accountId: 'account_123',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(xenditMocks.createDisbursement).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('accepts disbursement at minimum amount (Rp 100,000)', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amount: 100000, // Rp 100,000 - exactly minimum
          accountId: 'account_123',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(xenditMocks.createDisbursement).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Account Validation', () => {
    it('rejects disbursement when saved account does not exist', async () => {
      xenditMocks.getSavedDisbursementAccounts.mockResolvedValue([]);

      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amount: 100000,
          accountId: 'account_nonexistent',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(xenditMocks.createDisbursement).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Account not found',
        })
      );
    });

    it('rejects disbursement when new account details are missing', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amount: 100000,
          accountId: 'new',
          // Missing newAccount
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(xenditMocks.createDisbursement).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Balance Restoration on Failure', () => {
    it('restores balance when disbursement creation fails after debit', async () => {
      // Mock balance after debit
      const balanceAfterDebit = originalBalance - 100000;
      getDoc.mockResolvedValueOnce(mockUserDoc); // First call for initial balance
      getDoc.mockResolvedValueOnce({
        exists: jest.fn(() => true),
        data: jest.fn(() => ({
          balance: balanceAfterDebit, // Balance was debited
        })),
      });

      xenditMocks.createDisbursement.mockRejectedValue(new Error('Xendit API error'));

      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amount: 100000,
          accountId: 'account_123',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      // Should restore balance
      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          balance: originalBalance, // Balance restored
        }),
        expect.anything()
      );
    });

    it('does not restore balance if balance was never debited', async () => {
      // Mock that balance was never debited (transaction failed before debit)
      getDoc.mockResolvedValueOnce(mockUserDoc); // Initial balance check
      getDoc.mockResolvedValueOnce({
        exists: jest.fn(() => true),
        data: jest.fn(() => ({
          balance: originalBalance, // Balance unchanged
        })),
      });

      xenditMocks.createDisbursement.mockRejectedValue(new Error('Xendit API error'));

      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amount: 100000,
          accountId: 'account_123',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      // Should not restore (balance was never debited)
      // setDoc should only be called once for the initial debit attempt
      const setDocCalls = setDoc.mock.calls.filter(call => 
        call[1]?.balance === originalBalance
      );
      expect(setDocCalls.length).toBe(0); // No restoration call
    });
  });

  describe('Request Validation', () => {
    it('rejects requests with missing userId', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          amount: 100000,
          accountId: 'account_123',
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

  describe('User Not Found', () => {
    it('rejects disbursement when user does not exist', async () => {
      mockUserDoc.exists.mockReturnValue(false);

      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-nonexistent',
          amount: 100000,
          accountId: 'account_123',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(xenditMocks.createDisbursement).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'User not found',
        })
      );
    });
  });
});
