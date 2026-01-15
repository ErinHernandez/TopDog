/**
 * Xendit Webhook Integration Tests
 *
 * Tests the complete flow of Xendit webhook event processing including:
 * - Callback token verification
 * - Virtual Account payments
 * - E-wallet captures (OVO, DANA, GoPay)
 * - Disbursement callbacks
 * - IDR currency handling
 */

import { createMocks } from 'node-mocks-http';
import type { NextApiRequest, NextApiResponse } from 'next';
import { xenditFactories, randomId, isoTimestamp } from '../../factories/webhookEvents';

// Mock Firebase
jest.mock('../../../lib/firebase-utils', () => ({
  getDb: jest.fn(() => ({})),
}));

// Mock micro buffer
jest.mock('micro', () => ({
  buffer: jest.fn().mockImplementation((req) => {
    return Promise.resolve(Buffer.from((req as any)._mockBody || '{}'));
  }),
}));

// Mock Xendit functions
const mockVerifyWebhookToken = jest.fn();
const mockHandleVAPayment = jest.fn();
const mockHandleEWalletCapture = jest.fn();
const mockHandleDisbursementCallback = jest.fn();

jest.mock('../../../lib/xendit', () => ({
  verifyWebhookToken: (...args: unknown[]) => mockVerifyWebhookToken(...args),
  handleVAPayment: (...args: unknown[]) => mockHandleVAPayment(...args),
  handleEWalletCapture: (...args: unknown[]) => mockHandleEWalletCapture(...args),
  handleDisbursementCallback: (...args: unknown[]) => mockHandleDisbursementCallback(...args),
}));

// Mock error tracking
jest.mock('../../../lib/errorTracking', () => ({
  captureError: jest.fn(),
}));

// Mock structured logger
jest.mock('../../../lib/structuredLogger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Test constants
const XENDIT_CALLBACK_TOKEN = 'xnd_callback_token_test_12345';

describe('Xendit Webhook Integration', () => {
  let handler: typeof import('../../../pages/api/xendit/webhook').default;

  beforeAll(() => {
    process.env.XENDIT_CALLBACK_TOKEN = XENDIT_CALLBACK_TOKEN;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockVerifyWebhookToken.mockReturnValue(true);
    mockHandleVAPayment.mockResolvedValue({ success: true, actions: ['balance_updated'] });
    mockHandleEWalletCapture.mockResolvedValue({ success: true, actions: ['balance_updated'] });
    mockHandleDisbursementCallback.mockResolvedValue({ success: true, actions: ['disbursement_completed'] });

    jest.isolateModules(() => {
      handler = require('../../../pages/api/xendit/webhook').default;
    });
  });

  afterAll(() => {
    delete process.env.XENDIT_CALLBACK_TOKEN;
  });

  // ===========================================================================
  // TOKEN VERIFICATION
  // ===========================================================================

  describe('Callback Token Verification', () => {
    it('should reject requests without x-callback-token header', async () => {
      const payload = xenditFactories.virtualAccountPaid();
      const payloadString = JSON.stringify(payload);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
      });

      (req as any)._mockBody = payloadString;

      await handler(req, res);

      expect(res._getStatusCode()).toBe(401);
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toContain('token');
    });

    it('should reject requests with invalid callback token', async () => {
      const payload = xenditFactories.virtualAccountPaid();
      const payloadString = JSON.stringify(payload);

      mockVerifyWebhookToken.mockReturnValue(false);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-callback-token': 'invalid_token',
        },
      });

      (req as any)._mockBody = payloadString;

      await handler(req, res);

      expect(res._getStatusCode()).toBe(401);
      expect(mockVerifyWebhookToken).toHaveBeenCalledWith('invalid_token');
    });

    it('should accept requests with valid callback token', async () => {
      const payload = xenditFactories.virtualAccountPaid({
        metadata: { firebaseUserId: 'user_valid' },
      });
      const payloadString = JSON.stringify(payload);

      mockVerifyWebhookToken.mockReturnValue(true);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-callback-token': XENDIT_CALLBACK_TOKEN,
        },
      });

      (req as any)._mockBody = payloadString;

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });
  });

  // ===========================================================================
  // VIRTUAL ACCOUNT PAYMENTS
  // ===========================================================================

  describe('Virtual Account Payments', () => {
    it('should process BCA virtual account payment', async () => {
      const userId = 'user_va_bca';
      const amount = 500000; // IDR
      const payload = xenditFactories.virtualAccountPaid({
        amount,
        bank_code: 'BCA',
        metadata: { firebaseUserId: userId },
      });
      // Add required fields for VA detection
      payload.callback_virtual_account_id = randomId('va');
      const payloadString = JSON.stringify(payload);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-callback-token': XENDIT_CALLBACK_TOKEN,
        },
      });

      (req as any)._mockBody = payloadString;

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(mockHandleVAPayment).toHaveBeenCalled();
    });

    it('should process Mandiri virtual account payment', async () => {
      const payload = xenditFactories.virtualAccountPaid({
        bank_code: 'MANDIRI',
        metadata: { firebaseUserId: 'user_va_mandiri' },
      });
      payload.callback_virtual_account_id = randomId('va');
      const payloadString = JSON.stringify(payload);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-callback-token': XENDIT_CALLBACK_TOKEN,
        },
      });

      (req as any)._mockBody = payloadString;

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(mockHandleVAPayment).toHaveBeenCalled();
    });

    it('should update user balance with correct IDR amount', async () => {
      const amountIDR = 1500000; // 1.5 million IDR
      const payload = xenditFactories.virtualAccountPaid({
        amount: amountIDR,
        currency: 'IDR',
        metadata: { firebaseUserId: 'user_idr' },
      });
      payload.callback_virtual_account_id = randomId('va');
      const payloadString = JSON.stringify(payload);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-callback-token': XENDIT_CALLBACK_TOKEN,
        },
      });

      (req as any)._mockBody = payloadString;

      await handler(req, res);

      expect(mockHandleVAPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: amountIDR,
        })
      );
    });
  });

  // ===========================================================================
  // E-WALLET PAYMENTS
  // ===========================================================================

  describe('E-Wallet Captures', () => {
    it('should process OVO payment', async () => {
      const userId = 'user_ovo';
      const payload = xenditFactories.ewalletCompleted({
        channel_code: 'ID_OVO',
        metadata: { firebaseUserId: userId },
      });
      payload.data.business_id = randomId('biz');
      const payloadString = JSON.stringify(payload.data);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-callback-token': XENDIT_CALLBACK_TOKEN,
        },
      });

      (req as any)._mockBody = payloadString;

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(mockHandleEWalletCapture).toHaveBeenCalled();
    });

    it('should process DANA payment', async () => {
      const payload = xenditFactories.ewalletCompleted({
        channel_code: 'ID_DANA',
        metadata: { firebaseUserId: 'user_dana' },
      });
      payload.data.business_id = randomId('biz');
      payload.data.channel_code = 'ID_DANA';
      const payloadString = JSON.stringify(payload.data);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-callback-token': XENDIT_CALLBACK_TOKEN,
        },
      });

      (req as any)._mockBody = payloadString;

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(mockHandleEWalletCapture).toHaveBeenCalled();
    });

    it('should process GoPay payment', async () => {
      const payload = xenditFactories.ewalletCompleted({
        channel_code: 'ID_GOPAY',
        metadata: { firebaseUserId: 'user_gopay' },
      });
      payload.data.business_id = randomId('biz');
      payload.data.channel_code = 'ID_GOPAY';
      const payloadString = JSON.stringify(payload.data);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-callback-token': XENDIT_CALLBACK_TOKEN,
        },
      });

      (req as any)._mockBody = payloadString;

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(mockHandleEWalletCapture).toHaveBeenCalled();
    });

    it('should process ShopeePay payment', async () => {
      const payload = xenditFactories.ewalletCompleted({
        channel_code: 'ID_SHOPEEPAY',
        metadata: { firebaseUserId: 'user_shopeepay' },
      });
      payload.data.business_id = randomId('biz');
      payload.data.channel_code = 'ID_SHOPEEPAY';
      const payloadString = JSON.stringify(payload.data);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-callback-token': XENDIT_CALLBACK_TOKEN,
        },
      });

      (req as any)._mockBody = payloadString;

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });

    it('should handle failed e-wallet capture', async () => {
      const payload = xenditFactories.ewalletCompleted({
        status: 'FAILED',
        metadata: { firebaseUserId: 'user_ewallet_fail' },
      });
      payload.data.business_id = randomId('biz');
      payload.data.status = 'FAILED';
      const payloadString = JSON.stringify(payload.data);

      mockHandleEWalletCapture.mockResolvedValue({ success: true, actions: ['failure_logged'] });

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-callback-token': XENDIT_CALLBACK_TOKEN,
        },
      });

      (req as any)._mockBody = payloadString;

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(mockHandleEWalletCapture).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // DISBURSEMENT CALLBACKS
  // ===========================================================================

  describe('Disbursement Callbacks', () => {
    it('should process successful disbursement', async () => {
      const userId = 'user_disb_success';
      const payload = xenditFactories.disbursementCompleted({
        metadata: { firebaseUserId: userId },
      });
      const payloadString = JSON.stringify(payload);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-callback-token': XENDIT_CALLBACK_TOKEN,
        },
      });

      (req as any)._mockBody = payloadString;

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(mockHandleDisbursementCallback).toHaveBeenCalled();
    });

    it('should restore balance on failed disbursement', async () => {
      const userId = 'user_disb_failed';
      const amount = 500000;
      const payload = xenditFactories.disbursementFailed({
        amount,
        metadata: { firebaseUserId: userId },
        failure_code: 'INVALID_DESTINATION',
      });
      const payloadString = JSON.stringify(payload);

      mockHandleDisbursementCallback.mockResolvedValue({
        success: true,
        actions: ['balance_restored', 'failure_logged'],
      });

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-callback-token': XENDIT_CALLBACK_TOKEN,
        },
      });

      (req as any)._mockBody = payloadString;

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(mockHandleDisbursementCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'FAILED',
          failure_code: 'INVALID_DESTINATION',
        })
      );
    });

    it('should handle different bank codes', async () => {
      const banks = ['BCA', 'MANDIRI', 'BNI', 'BRI', 'CIMB'];

      for (const bankCode of banks) {
        jest.clearAllMocks();
        mockVerifyWebhookToken.mockReturnValue(true);
        mockHandleDisbursementCallback.mockResolvedValue({ success: true, actions: ['completed'] });

        const payload = xenditFactories.disbursementCompleted({
          bank_code: bankCode,
          metadata: { firebaseUserId: `user_${bankCode.toLowerCase()}` },
        });
        const payloadString = JSON.stringify(payload);

        const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-callback-token': XENDIT_CALLBACK_TOKEN,
          },
        });

        (req as any)._mockBody = payloadString;

        await handler(req, res);

        expect(res._getStatusCode()).toBe(200);
        expect(mockHandleDisbursementCallback).toHaveBeenCalledWith(
          expect.objectContaining({
            bank_code: bankCode,
          })
        );
      }
    });
  });

  // ===========================================================================
  // ERROR HANDLING
  // ===========================================================================

  describe('Error Handling', () => {
    it('should handle malformed JSON payload', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-callback-token': XENDIT_CALLBACK_TOKEN,
        },
      });

      (req as any)._mockBody = 'not valid json {{{';

      await handler(req, res);

      // Xendit webhooks should return 200 to prevent retries
      expect(res._getStatusCode()).toBe(200);
    });

    it('should handle handler errors gracefully', async () => {
      const payload = xenditFactories.virtualAccountPaid({
        metadata: { firebaseUserId: 'user_error' },
      });
      payload.callback_virtual_account_id = randomId('va');
      const payloadString = JSON.stringify(payload);

      mockHandleVAPayment.mockRejectedValue(new Error('Database connection failed'));

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-callback-token': XENDIT_CALLBACK_TOKEN,
        },
      });

      (req as any)._mockBody = payloadString;

      await handler(req, res);

      // Should return 200 to prevent retries even on error
      expect(res._getStatusCode()).toBe(200);
    });

    it('should reject non-POST methods', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
    });

    it('should handle unknown event structure gracefully', async () => {
      const payload = {
        id: randomId('unknown'),
        unknown_field: 'unknown_value',
        status: 'unknown',
      };
      const payloadString = JSON.stringify(payload);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-callback-token': XENDIT_CALLBACK_TOKEN,
        },
      });

      (req as any)._mockBody = payloadString;

      await handler(req, res);

      // Should accept but handle gracefully
      expect(res._getStatusCode()).toBe(200);
      // Should not call any specific handlers
      expect(mockHandleVAPayment).not.toHaveBeenCalled();
      expect(mockHandleEWalletCapture).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // CURRENCY HANDLING
  // ===========================================================================

  describe('IDR Currency Handling', () => {
    it('should correctly handle IDR amounts without conversion', async () => {
      // Xendit IDR amounts are in full IDR (no cents)
      const amountIDR = 2500000; // 2.5 million IDR
      const payload = xenditFactories.virtualAccountPaid({
        amount: amountIDR,
        currency: 'IDR',
        metadata: { firebaseUserId: 'user_idr_full' },
      });
      payload.callback_virtual_account_id = randomId('va');
      const payloadString = JSON.stringify(payload);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-callback-token': XENDIT_CALLBACK_TOKEN,
        },
      });

      (req as any)._mockBody = payloadString;

      await handler(req, res);

      expect(mockHandleVAPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: amountIDR,
          currency: 'IDR',
        })
      );
    });
  });

  // ===========================================================================
  // EVENT TYPE DETECTION
  // ===========================================================================

  describe('Event Type Detection', () => {
    it('should correctly identify VA payment by callback_virtual_account_id', async () => {
      const payload = {
        id: randomId('va'),
        payment_id: randomId('pay'),
        callback_virtual_account_id: randomId('cva'),
        amount: 500000,
        bank_code: 'BCA',
        status: 'COMPLETED',
        metadata: { firebaseUserId: 'user_va_detect' },
      };
      const payloadString = JSON.stringify(payload);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-callback-token': XENDIT_CALLBACK_TOKEN,
        },
      });

      (req as any)._mockBody = payloadString;

      await handler(req, res);

      expect(mockHandleVAPayment).toHaveBeenCalled();
      expect(mockHandleEWalletCapture).not.toHaveBeenCalled();
      expect(mockHandleDisbursementCallback).not.toHaveBeenCalled();
    });

    it('should correctly identify e-wallet by business_id and channel_code', async () => {
      const payload = {
        id: randomId('ewc'),
        business_id: randomId('biz'),
        channel_code: 'ID_OVO',
        status: 'SUCCEEDED',
        charge_amount: 500000,
        currency: 'IDR',
        metadata: { firebaseUserId: 'user_ewallet_detect' },
      };
      const payloadString = JSON.stringify(payload);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-callback-token': XENDIT_CALLBACK_TOKEN,
        },
      });

      (req as any)._mockBody = payloadString;

      await handler(req, res);

      expect(mockHandleEWalletCapture).toHaveBeenCalled();
      expect(mockHandleVAPayment).not.toHaveBeenCalled();
    });

    it('should correctly identify disbursement by bank_code and status', async () => {
      const payload = {
        id: randomId('disb'),
        external_id: randomId('ext'),
        user_id: randomId('user'),
        bank_code: 'BCA',
        status: 'COMPLETED',
        amount: 500000,
        account_holder_name: 'Test User',
        metadata: { firebaseUserId: 'user_disb_detect' },
      };
      const payloadString = JSON.stringify(payload);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-callback-token': XENDIT_CALLBACK_TOKEN,
        },
      });

      (req as any)._mockBody = payloadString;

      await handler(req, res);

      expect(mockHandleDisbursementCallback).toHaveBeenCalled();
      expect(mockHandleVAPayment).not.toHaveBeenCalled();
      expect(mockHandleEWalletCapture).not.toHaveBeenCalled();
    });
  });
});
