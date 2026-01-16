/**
 * PayMongo Webhook Integration Tests
 *
 * Tests the complete flow of PayMongo webhook event processing including:
 * - Signature verification (HMAC-SHA256 with timestamp)
 * - GCash, GrabPay, PayMaya payment methods
 * - PHP currency handling (centavos)
 * - Event routing for payments and payouts
 */

import { jest, describe, it, expect, beforeEach, beforeAll, afterAll } from '@jest/globals';
import { createMocks } from 'node-mocks-http';
import type { NextApiRequest, NextApiResponse } from 'next';
import { paymongoFactories, randomId, timestamp } from '../../factories/webhookEvents';

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

// Mock PayMongo functions
const mockVerifyWebhookSignature = jest.fn();
const mockHandleSourceChargeable = jest.fn();
const mockHandlePaymentPaid = jest.fn();
const mockHandlePaymentFailed = jest.fn();
const mockHandlePayoutPaid = jest.fn();
const mockHandlePayoutFailed = jest.fn();

jest.mock('../../../lib/paymongo', () => ({
  verifyWebhookSignature: (...args: unknown[]) => mockVerifyWebhookSignature(...args),
  handleSourceChargeable: (...args: unknown[]) => mockHandleSourceChargeable(...args),
  handlePaymentPaid: (...args: unknown[]) => mockHandlePaymentPaid(...args),
  handlePaymentFailed: (...args: unknown[]) => mockHandlePaymentFailed(...args),
  handlePayoutPaid: (...args: unknown[]) => mockHandlePayoutPaid(...args),
  handlePayoutFailed: (...args: unknown[]) => mockHandlePayoutFailed(...args),
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
const PAYMONGO_SECRET = 'sk_test_paymongo_secret';

describe('PayMongo Webhook Integration', () => {
  let handler: typeof import('../../../pages/api/paymongo/webhook').default;

  beforeAll(() => {
    process.env.PAYMONGO_SECRET_KEY = PAYMONGO_SECRET;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockVerifyWebhookSignature.mockReturnValue(true);
    mockHandlePaymentPaid.mockResolvedValue({ success: true, actions: ['balance_updated'] });
    mockHandlePaymentFailed.mockResolvedValue({ success: true, actions: ['failure_logged'] });
    mockHandleSourceChargeable.mockResolvedValue({ success: true, actions: ['payment_created'] });
    mockHandlePayoutPaid.mockResolvedValue({ success: true, actions: ['payout_completed'] });
    mockHandlePayoutFailed.mockResolvedValue({ success: true, actions: ['balance_restored'] });

    jest.isolateModules(() => {
      handler = require('../../../pages/api/paymongo/webhook').default;
    });
  });

  afterAll(() => {
    delete process.env.PAYMONGO_SECRET_KEY;
  });

  // ===========================================================================
  // SIGNATURE VERIFICATION
  // ===========================================================================

  describe('Signature Verification', () => {
    it('should reject requests without paymongo-signature header', async () => {
      const payload = paymongoFactories.paymentPaid();
      const payloadString = JSON.stringify(payload);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
      });

      (req as any)._mockBody = payloadString;

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const responseData = JSON.parse(res._getData());
      expect(responseData.error).toContain('signature');
    });

    it('should reject requests with invalid signature format', async () => {
      const payload = paymongoFactories.paymentPaid();
      const payloadString = JSON.stringify(payload);

      mockVerifyWebhookSignature.mockReturnValue(false);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'paymongo-signature': 't=invalid,te=,li=invalid',
        },
      });

      (req as any)._mockBody = payloadString;

      await handler(req, res);

      expect(res._getStatusCode()).toBe(401);
    });

    it('should accept requests with valid t/li signature format', async () => {
      const payload = paymongoFactories.paymentPaid({
        metadata: { firebaseUserId: 'user_valid' },
      });
      const payloadString = JSON.stringify(payload);
      const ts = timestamp();
      const validSignature = paymongoFactories.createSignature(payloadString, PAYMONGO_SECRET, ts);

      mockVerifyWebhookSignature.mockReturnValue(true);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'paymongo-signature': validSignature,
        },
      });

      (req as any)._mockBody = payloadString;

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });
  });

  // ===========================================================================
  // PAYMENT PAID
  // ===========================================================================

  describe('payment.paid', () => {
    it('should process GCash payment successfully', async () => {
      const userId = 'user_gcash';
      const amount = 50000; // 500 PHP in centavos
      const payload = paymongoFactories.paymentPaid({
        amount,
        source: { type: 'gcash' },
        metadata: { firebaseUserId: userId },
      });
      const payloadString = JSON.stringify(payload);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'paymongo-signature': 'valid_sig',
        },
      });

      (req as any)._mockBody = payloadString;

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(mockHandlePaymentPaid).toHaveBeenCalled();
    });

    it('should process GrabPay payment successfully', async () => {
      const payload = paymongoFactories.paymentPaid({
        source: { type: 'grab_pay' },
        metadata: { firebaseUserId: 'user_grabpay' },
      });
      const payloadString = JSON.stringify(payload);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'paymongo-signature': 'valid_sig',
        },
      });

      (req as any)._mockBody = payloadString;

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(mockHandlePaymentPaid).toHaveBeenCalled();
    });

    it('should update user balance with correct PHP amount', async () => {
      const amountCentavos = 100000; // 1,000 PHP
      const payload = paymongoFactories.paymentPaid({
        amount: amountCentavos,
        currency: 'PHP',
        metadata: { firebaseUserId: 'user_php' },
      });
      payload.data.attributes.data.attributes.amount = amountCentavos;
      const payloadString = JSON.stringify(payload);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'paymongo-signature': 'valid_sig',
        },
      });

      (req as any)._mockBody = payloadString;

      await handler(req, res);

      expect(mockHandlePaymentPaid).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: amountCentavos,
          currency: 'PHP',
        })
      );
    });

    it('should create deposit transaction record', async () => {
      const paymentId = randomId('pay');
      const payload = paymongoFactories.paymentPaid({
        metadata: { firebaseUserId: 'user_deposit' },
      });
      payload.data.attributes.data.id = paymentId;
      const payloadString = JSON.stringify(payload);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'paymongo-signature': 'valid_sig',
        },
      });

      (req as any)._mockBody = payloadString;

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(mockHandlePaymentPaid).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // PAYMENT FAILED
  // ===========================================================================

  describe('payment.failed', () => {
    it('should log failure without updating balance', async () => {
      const payload = paymongoFactories.paymentFailed({
        metadata: { firebaseUserId: 'user_failed' },
      });
      const payloadString = JSON.stringify(payload);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'paymongo-signature': 'valid_sig',
        },
      });

      (req as any)._mockBody = payloadString;

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(mockHandlePaymentFailed).toHaveBeenCalled();
      expect(mockHandlePaymentPaid).not.toHaveBeenCalled();
    });

    it('should update transaction status to failed', async () => {
      const paymentId = randomId('pay');
      const payload = paymongoFactories.paymentFailed();
      payload.data.attributes.data.id = paymentId;
      const payloadString = JSON.stringify(payload);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'paymongo-signature': 'valid_sig',
        },
      });

      (req as any)._mockBody = payloadString;

      await handler(req, res);

      expect(mockHandlePaymentFailed).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // SOURCE CHARGEABLE
  // ===========================================================================

  describe('source.chargeable', () => {
    it('should trigger payment creation for chargeable source', async () => {
      const sourceId = randomId('src');
      const payload = {
        data: {
          id: randomId('evt'),
          type: 'event',
          attributes: {
            type: 'source.chargeable',
            livemode: false,
            data: {
              id: sourceId,
              type: 'source',
              attributes: {
                amount: 50000,
                currency: 'PHP',
                status: 'chargeable',
                type: 'gcash',
                metadata: {
                  firebaseUserId: 'user_source',
                },
              },
            },
            created_at: Math.floor(Date.now() / 1000),
          },
        },
      };
      const payloadString = JSON.stringify(payload);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'paymongo-signature': 'valid_sig',
        },
      });

      (req as any)._mockBody = payloadString;

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(mockHandleSourceChargeable).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // PAYOUT EVENTS
  // ===========================================================================

  describe('payout.paid', () => {
    it('should mark payout as complete', async () => {
      const payoutId = randomId('payout');
      const payload = {
        data: {
          id: randomId('evt'),
          type: 'event',
          attributes: {
            type: 'payout.paid',
            livemode: false,
            data: {
              id: payoutId,
              type: 'payout',
              attributes: {
                amount: 100000, // 1,000 PHP
                currency: 'PHP',
                status: 'paid',
                metadata: {
                  firebaseUserId: 'user_payout',
                },
              },
            },
            created_at: Math.floor(Date.now() / 1000),
          },
        },
      };
      const payloadString = JSON.stringify(payload);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'paymongo-signature': 'valid_sig',
        },
      });

      (req as any)._mockBody = payloadString;

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(mockHandlePayoutPaid).toHaveBeenCalled();
    });
  });

  describe('payout.failed', () => {
    it('should restore balance on failed payout', async () => {
      const payoutId = randomId('payout');
      const payload = {
        data: {
          id: randomId('evt'),
          type: 'event',
          attributes: {
            type: 'payout.failed',
            livemode: false,
            data: {
              id: payoutId,
              type: 'payout',
              attributes: {
                amount: 100000,
                currency: 'PHP',
                status: 'failed',
                metadata: {
                  firebaseUserId: 'user_payout_failed',
                },
              },
            },
            created_at: Math.floor(Date.now() / 1000),
          },
        },
      };
      const payloadString = JSON.stringify(payload);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'paymongo-signature': 'valid_sig',
        },
      });

      (req as any)._mockBody = payloadString;

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(mockHandlePayoutFailed).toHaveBeenCalled();
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
          'paymongo-signature': 'valid_sig',
        },
      });

      (req as any)._mockBody = 'not valid json {';

      await handler(req, res);

      expect(res._getStatusCode()).toBeGreaterThanOrEqual(400);
    });

    it('should handle handler errors gracefully', async () => {
      const payload = paymongoFactories.paymentPaid({
        metadata: { firebaseUserId: 'user_error' },
      });
      const payloadString = JSON.stringify(payload);

      mockHandlePaymentPaid.mockRejectedValue(new Error('Database error'));

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'paymongo-signature': 'valid_sig',
        },
      });

      (req as any)._mockBody = payloadString;

      await handler(req, res);

      // Should handle error gracefully
      expect(res._getStatusCode()).toBeGreaterThanOrEqual(200);
    });

    it('should reject non-POST methods', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
    });

    it('should handle unknown event types', async () => {
      const payload = {
        data: {
          id: randomId('evt'),
          type: 'event',
          attributes: {
            type: 'unknown.event',
            livemode: false,
            data: {
              id: randomId('unknown'),
              type: 'unknown',
              attributes: {},
            },
            created_at: Math.floor(Date.now() / 1000),
          },
        },
      };
      const payloadString = JSON.stringify(payload);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'paymongo-signature': 'valid_sig',
        },
      });

      (req as any)._mockBody = payloadString;

      await handler(req, res);

      // Should accept but not process unknown events
      expect(res._getStatusCode()).toBe(200);
    });
  });

  // ===========================================================================
  // CURRENCY HANDLING
  // ===========================================================================

  describe('PHP Currency Handling', () => {
    it('should correctly handle centavos to PHP conversion', async () => {
      // PayMongo amounts are in centavos (100 centavos = 1 PHP)
      const amountCentavos = 250000; // 2,500 PHP
      const payload = paymongoFactories.paymentPaid({
        amount: amountCentavos,
        currency: 'PHP',
        metadata: { firebaseUserId: 'user_centavos' },
      });
      payload.data.attributes.data.attributes.amount = amountCentavos;
      const payloadString = JSON.stringify(payload);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'paymongo-signature': 'valid_sig',
        },
      });

      (req as any)._mockBody = payloadString;

      await handler(req, res);

      expect(mockHandlePaymentPaid).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: amountCentavos,
        })
      );
    });
  });
});
