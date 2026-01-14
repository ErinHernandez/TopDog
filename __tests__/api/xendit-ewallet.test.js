/**
 * Tests for /api/xendit/ewallet endpoint
 * 
 * Important payment route (P1 - 85%+ coverage).
 * Tests focus on realistic business scenarios:
 * - Creating e-wallet charges for different channels (OVO, GoPay, DANA, ShopeePay)
 * - Mobile number formatting for OVO
 * - Amount validation
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
  createEWalletCharge: jest.fn(),
  createXenditTransaction: jest.fn(),
  generateReference: jest.fn(() => 'EW_test_123'),
}));

jest.mock('../../../lib/xendit/currencyConfig', () => ({
  validateDepositAmount: jest.fn(() => ({ isValid: true })),
}));

jest.mock('../../../lib/envHelpers', () => ({
  requireBaseUrl: jest.fn(() => 'https://example.com'),
}));

const { createMockRequest, createMockResponse } = require('../../factories');
const xenditMocks = require('../../../lib/xendit');
const currencyMocks = require('../../../lib/xendit/currencyConfig');

describe('/api/xendit/ewallet', () => {
  let handler;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    currencyMocks.validateDepositAmount.mockReturnValue({ isValid: true });

    xenditMocks.createEWalletCharge.mockResolvedValue({
      chargeId: 'ewallet_charge_123',
      status: 'PENDING',
      checkoutUrl: 'https://checkout.xendit.co/test',
      mobileDeeplink: 'gopay://payment',
      qrString: 'QR_CODE_STRING',
    });

    xenditMocks.createXenditTransaction.mockResolvedValue({
      id: 'txn_test_123',
    });

    handler = require('../../../pages/api/xendit/ewallet').default;
  });

  describe('Successful E-Wallet Charge Creation', () => {
    it('creates GoPay charge successfully', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amount: 100000, // Rp 100,000
          channelCode: 'ID_GOPAY',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(xenditMocks.createEWalletCharge).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          channel_code: 'ID_GOPAY',
          amount: 100000,
          currency: 'IDR',
          checkout_method: 'ONE_TIME_PAYMENT',
        })
      );
      expect(xenditMocks.createXenditTransaction).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          chargeId: 'ewallet_charge_123',
          transactionId: 'txn_test_123',
        })
      );
    });

    it('creates OVO charge with mobile number', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amount: 50000,
          channelCode: 'ID_OVO',
          mobileNumber: '081234567890',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(xenditMocks.createEWalletCharge).toHaveBeenCalledWith(
        expect.objectContaining({
          channel_code: 'ID_OVO',
          channel_properties: expect.objectContaining({
            mobile_number: '+6281234567890',
          }),
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('formats mobile number correctly (starts with 0)', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amount: 50000,
          channelCode: 'ID_OVO',
          mobileNumber: '081234567890',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      const callArgs = xenditMocks.createEWalletCharge.mock.calls[0][0];
      expect(callArgs.channel_properties.mobile_number).toBe('+6281234567890');
    });

    it('formats mobile number correctly (no prefix)', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amount: 50000,
          channelCode: 'ID_OVO',
          mobileNumber: '81234567890',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      const callArgs = xenditMocks.createEWalletCharge.mock.calls[0][0];
      expect(callArgs.channel_properties.mobile_number).toBe('+6281234567890');
    });

    it('uses custom redirect URLs when provided', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amount: 100000,
          channelCode: 'ID_DANA',
          successUrl: 'https://custom.com/success',
          failureUrl: 'https://custom.com/failure',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      const callArgs = xenditMocks.createEWalletCharge.mock.calls[0][0];
      expect(callArgs.channel_properties.success_redirect_url).toBe('https://custom.com/success');
      expect(callArgs.channel_properties.failure_redirect_url).toBe('https://custom.com/failure');
    });
  });

  describe('Channel Validation', () => {
    it('requires mobile number for OVO', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amount: 50000,
          channelCode: 'ID_OVO',
          // Missing mobileNumber
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(xenditMocks.createEWalletCharge).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Mobile number is required for OVO'),
        })
      );
    });

    it('rejects invalid channel codes', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amount: 100000,
          channelCode: 'INVALID_CHANNEL',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(xenditMocks.createEWalletCharge).not.toHaveBeenCalled();
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
          channelCode: 'ID_GOPAY',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(xenditMocks.createEWalletCharge).not.toHaveBeenCalled();
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
          channelCode: 'ID_GOPAY',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(xenditMocks.createEWalletCharge).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('rejects zero amounts', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amount: 0,
          channelCode: 'ID_GOPAY',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Request Validation', () => {
    it('requires amount, channelCode, and userId', async () => {
      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          // Missing amount and channelCode
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
    it('handles e-wallet charge creation failures', async () => {
      xenditMocks.createEWalletCharge.mockRejectedValue(new Error('Xendit API error'));

      const req = createMockRequest({
        method: 'POST',
        body: {
          userId: 'user-123',
          amount: 100000,
          channelCode: 'ID_GOPAY',
        },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
