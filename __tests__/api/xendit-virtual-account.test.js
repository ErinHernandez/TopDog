/**
 * Tests for /api/xendit/virtual-account endpoint
 * 
 * Important payment route (P1 - 85%+ coverage).
 * Tests focus on realistic business scenarios:
 * - Creating virtual accounts for different banks (BCA, MANDIRI, BNI, BRI, PERMATA)
 * - Amount validation
 * - Expiration date calculation
 * - Transaction creation
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
    statusCode: type === 'validation' ? 400 : 500,
    body: { message, error: type },
  })),
  ErrorType: {
    VALIDATION: 'validation',
    INTERNAL: 'internal',
  },
}));

jest.mock('../../../lib/xendit', () => ({
  createVirtualAccount: jest.fn(),
  createXenditTransaction: jest.fn(),
  generateReference: jest.fn(() => 'VA_test_123'),
}));

jest.mock('../../../lib/xendit/currencyConfig', () => ({
  validateDepositAmount: jest.fn(() => ({ isValid: true })),
  formatIdrAmount: jest.fn((amount) => `Rp ${amount.toLocaleString('id-ID')}`),
}));

const { createMockRequest, createMockResponse } = require('../../factories');
const xenditMocks = require('../../../lib/xendit');
const currencyMocks = require('../../../lib/xendit/currencyConfig');

describe('/api/xendit/virtual-account', () => {
  let handler;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    currencyMocks.validateDepositAmount.mockReturnValue({ isValid: true });

    xenditMocks.createVirtualAccount.mockResolvedValue({
      virtualAccountId: 'va_test_123',
      accountNumber: '1234567890',
      bankCode: 'BCA',
      expirationDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });

    xenditMocks.createXenditTransaction.mockResolvedValue({
      id: 'txn_test_123',
    });

    handler = require('../../../pages/api/xendit/virtual-account').default;
  });

  describe('Successful Virtual Account Creation', () => {
    it('creates BCA virtual account successfully', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amount: 100000, // Rp 100,000
          bankCode: 'BCA',
          name: 'John Doe',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(xenditMocks.createVirtualAccount).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          bank_code: 'BCA',
          expected_amount: 100000,
          name: 'John Doe',
          is_single_use: true,
          is_closed: true,
        })
      );
      expect(xenditMocks.createXenditTransaction).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          virtualAccountId: 'va_test_123',
          accountNumber: '1234567890',
          bankCode: 'BCA',
          transactionId: 'txn_test_123',
        })
      );
    });

    it('uses default expiration of 24 hours', async () => {
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now);

      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amount: 100000,
          bankCode: 'MANDIRI',
          name: 'Jane Doe',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      const callArgs = xenditMocks.createVirtualAccount.mock.calls[0][0];
      const expirationDate = new Date(callArgs.expiration_date);
      const expectedExpiration = new Date(now + 24 * 60 * 60 * 1000);
      
      // Allow 1 second difference for test execution
      expect(Math.abs(expirationDate.getTime() - expectedExpiration.getTime())).toBeLessThan(1000);
      
      Date.now.mockRestore();
    });

    it('uses custom expiration hours when provided', async () => {
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now);

      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amount: 100000,
          bankCode: 'BNI',
          name: 'Test User',
          expirationHours: 48,
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      const callArgs = xenditMocks.createVirtualAccount.mock.calls[0][0];
      const expirationDate = new Date(callArgs.expiration_date);
      const expectedExpiration = new Date(now + 48 * 60 * 60 * 1000);
      
      expect(Math.abs(expirationDate.getTime() - expectedExpiration.getTime())).toBeLessThan(1000);
      
      Date.now.mockRestore();
    });
  });

  describe('Bank Code Validation', () => {
    const validBanks = ['BCA', 'MANDIRI', 'BNI', 'BRI', 'PERMATA'];
    
    validBanks.forEach(bankCode => {
      it(`accepts ${bankCode} bank code`, async () => {
        const req = createMockRequest({
          method: 'POST',
          body: {
            userId: 'user-123',
            amount: 100000,
            bankCode,
            name: 'Test User',
          },
        });
        const res = createMockResponse();

        await handler(req, res);

        expect(xenditMocks.createVirtualAccount).toHaveBeenCalledWith(
          expect.objectContaining({
            bank_code: bankCode,
          })
        );
        expect(res.status).toHaveBeenCalledWith(200);
      });
    });

    it('rejects invalid bank codes', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amount: 100000,
          bankCode: 'INVALID_BANK',
          name: 'Test User',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(xenditMocks.createVirtualAccount).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Amount Validation', () => {
    it('rejects amounts below minimum', async () => {
      currencyMocks.validateDepositAmount.mockReturnValue({
        isValid: false,
        error: 'Minimum deposit is Rp 50,000',
      });

      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amount: 10000, // Below minimum
          bankCode: 'BCA',
          name: 'Test User',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(xenditMocks.createVirtualAccount).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Minimum deposit'),
        })
      );
    });

    it('rejects negative amounts', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amount: -1000,
          bankCode: 'BCA',
          name: 'Test User',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(xenditMocks.createVirtualAccount).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('rejects zero amounts', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amount: 0,
          bankCode: 'BCA',
          name: 'Test User',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Name Validation', () => {
    it('requires name field', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amount: 100000,
          bankCode: 'BCA',
          // Missing name
        },
      });
      const res = createMockResponse();

      await expect(handler(req, res)).rejects.toThrow('Missing body field: name');
    });

    it('rejects names shorter than 2 characters', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amount: 100000,
          bankCode: 'BCA',
          name: 'A', // Too short
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(xenditMocks.createVirtualAccount).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Request Validation', () => {
    it('requires amount, bankCode, userId, and name', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          // Missing other fields
        },
      });
      const res = createMockResponse();

      await expect(handler(req, res)).rejects.toThrow('Missing body field');
    });

    it('rejects non-POST requests', async () => {
      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await expect(handler(req, res)).rejects.toThrow('Method GET not allowed');
    });
  });

  describe('Error Handling', () => {
    it('handles virtual account creation failures', async () => {
      xenditMocks.createVirtualAccount.mockRejectedValue(new Error('Xendit API error'));

      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amount: 100000,
          bankCode: 'BCA',
          name: 'Test User',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
