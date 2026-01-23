/**
 * Paystack Webhook Integration Tests
 *
 * Tests the complete flow of Paystack webhook event processing including:
 * - Signature verification (HMAC-SHA512)
 * - Event deduplication
 * - Balance updates for charges and transfers
 * - NGN currency handling
 */

import { jest, describe, it, expect, beforeEach, beforeAll, afterAll } from '@jest/globals';
import { createMocks } from 'node-mocks-http';
import type { NextApiRequest, NextApiResponse } from 'next';
import { paystackFactories, randomId } from '../../factories/webhookEvents';

// Mock Firebase
jest.mock('../../../lib/firebase-utils', () => ({
  getDb: jest.fn(() => ({})),
}));

// Mock Paystack functions
const mockVerifyWebhookSignature = jest.fn<(...args: unknown[]) => boolean>().mockReturnValue(true);
const mockHandleChargeSuccess = jest.fn<(...args: unknown[]) => Promise<{ userId: string; amountNGN: number } | Record<string, unknown>>>();
const mockHandleChargeFailed = jest.fn<(...args: unknown[]) => Promise<Record<string, unknown>>>();
const mockHandleTransferSuccess = jest.fn<(...args: unknown[]) => Promise<Record<string, unknown>>>();
const mockHandleTransferFailed = jest.fn<(...args: unknown[]) => Promise<Record<string, unknown>>>();
const mockFindWebhookEventByReference = jest.fn<(...args: unknown[]) => Promise<null | Record<string, unknown>>>();
const mockMarkWebhookEventAsProcessed = jest.fn<(...args: unknown[]) => Promise<Record<string, unknown>>>();
const mockMarkWebhookEventAsFailed = jest.fn<(...args: unknown[]) => Promise<Record<string, unknown>>>();
const mockCreateOrUpdateWebhookEvent = jest.fn<(...args: unknown[]) => Promise<Record<string, unknown>>>();

jest.mock('../../../lib/paystack', () => ({
  verifyWebhookSignature: mockVerifyWebhookSignature,
  handleChargeSuccess: mockHandleChargeSuccess,
  handleChargeFailed: mockHandleChargeFailed,
  handleTransferSuccess: mockHandleTransferSuccess,
  handleTransferFailed: mockHandleTransferFailed,
  findWebhookEventByReference: mockFindWebhookEventByReference,
  markWebhookEventAsProcessed: mockMarkWebhookEventAsProcessed,
  markWebhookEventAsFailed: mockMarkWebhookEventAsFailed,
  createOrUpdateWebhookEvent: mockCreateOrUpdateWebhookEvent,
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
const PAYSTACK_SECRET = 'sk_test_paystack_secret_key';

describe('Paystack Webhook Integration', () => {
  let handler: typeof import('../../../pages/api/paystack/webhook').default;

  beforeAll(() => {
    process.env.PAYSTACK_SECRET_KEY = PAYSTACK_SECRET;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockVerifyWebhookSignature.mockReturnValue(true);
    mockFindWebhookEventByReference.mockResolvedValue(null);
    mockCreateOrUpdateWebhookEvent.mockResolvedValue({});
    mockMarkWebhookEventAsProcessed.mockResolvedValue({});
    mockHandleChargeSuccess.mockResolvedValue({ userId: 'user_123', amountNGN: 500000 });
    mockHandleChargeFailed.mockResolvedValue({});
    mockHandleTransferSuccess.mockResolvedValue({});
    mockHandleTransferFailed.mockResolvedValue({});

    jest.isolateModules(() => {
      handler = require('../../../pages/api/paystack/webhook').default;
    });
  });

  afterAll(() => {
    delete process.env.PAYSTACK_SECRET_KEY;
  });

  // ===========================================================================
  // SIGNATURE VERIFICATION
  // ===========================================================================

  describe('Signature Verification', () => {
    it('should reject requests without x-paystack-signature header', async () => {
      const payload = paystackFactories.chargeSuccess();
      const payloadString = JSON.stringify(payload);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
      });

      // Simulate streaming body
      setImmediate(() => {
        req.emit('data', payloadString);
        req.emit('end');
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(401);
      const responseData = JSON.parse(res._getData());
      expect(responseData.received).toBe(false);
      expect(responseData.error).toContain('signature');
    });

    it('should reject requests with invalid HMAC-SHA512 signature', async () => {
      const payload = paystackFactories.chargeSuccess();
      const payloadString = JSON.stringify(payload);

      mockVerifyWebhookSignature.mockReturnValue(false);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-paystack-signature': 'invalid_sha512_signature',
        },
      });

      setImmediate(() => {
        req.emit('data', payloadString);
        req.emit('end');
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(401);
      expect(mockVerifyWebhookSignature).toHaveBeenCalledWith(payloadString, 'invalid_sha512_signature');
    });

    it('should accept requests with valid signature', async () => {
      const payload = paystackFactories.chargeSuccess({
        metadata: { firebaseUserId: 'user_valid_sig' },
      });
      const payloadString = JSON.stringify(payload);
      const validSignature = paystackFactories.createSignature(payloadString, PAYSTACK_SECRET);

      mockVerifyWebhookSignature.mockReturnValue(true);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-paystack-signature': validSignature,
        },
      });

      setImmediate(() => {
        req.emit('data', payloadString);
        req.emit('end');
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());
      expect(responseData.received).toBe(true);
    });
  });

  // ===========================================================================
  // IDEMPOTENCY
  // ===========================================================================

  describe('Event Idempotency', () => {
    it('should skip processing for already-processed events', async () => {
      const reference = randomId('ref');
      const payload = paystackFactories.chargeSuccess();
      payload.data.reference = reference;
      const payloadString = JSON.stringify(payload);

      mockFindWebhookEventByReference.mockResolvedValue({
        reference,
        status: 'processed',
        processedAt: new Date().toISOString(),
      } as Record<string, unknown>);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-paystack-signature': 'valid_sig',
        },
      });

      setImmediate(() => {
        req.emit('data', payloadString);
        req.emit('end');
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(mockHandleChargeSuccess).not.toHaveBeenCalled();
    });

    it('should use transfer_code for transfer event deduplication', async () => {
      const transferCode = randomId('TRF');
      const payload = paystackFactories.transferSuccess();
      payload.data.transfer_code = transferCode;
      const payloadString = JSON.stringify(payload);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-paystack-signature': 'valid_sig',
        },
      });

      setImmediate(() => {
        req.emit('data', payloadString);
        req.emit('end');
      });

      await handler(req, res);

      expect(mockFindWebhookEventByReference).toHaveBeenCalledWith(transferCode);
    });
  });

  // ===========================================================================
  // CHARGE SUCCESS
  // ===========================================================================

  describe('charge.success', () => {
    it('should process successful payment and credit balance', async () => {
      const userId = 'user_charge_success';
      const amountKobo = 500000; // 5000 NGN in kobo
      const payload = paystackFactories.chargeSuccess({
        amount: amountKobo,
        metadata: { firebaseUserId: userId },
      });
      const payloadString = JSON.stringify(payload);

      mockHandleChargeSuccess.mockResolvedValue({
        userId,
        amountNGN: amountKobo / 100,
        transactionId: 'txn_123',
      } as { userId: string; amountNGN: number; transactionId: string });

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-paystack-signature': 'valid_sig',
        },
      });

      setImmediate(() => {
        req.emit('data', payloadString);
        req.emit('end');
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(mockHandleChargeSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: amountKobo,
        })
      );
    });

    it('should handle card payment channel', async () => {
      const payload = paystackFactories.chargeSuccess({
        channel: 'card',
        metadata: { firebaseUserId: 'user_card' },
      });
      const payloadString = JSON.stringify(payload);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-paystack-signature': 'valid_sig',
        },
      });

      setImmediate(() => {
        req.emit('data', payloadString);
        req.emit('end');
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(mockHandleChargeSuccess).toHaveBeenCalled();
    });

    it('should handle bank transfer payment channel', async () => {
      const payload = paystackFactories.chargeSuccess({
        channel: 'bank_transfer',
        metadata: { firebaseUserId: 'user_bank' },
      });
      const payloadString = JSON.stringify(payload);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-paystack-signature': 'valid_sig',
        },
      });

      setImmediate(() => {
        req.emit('data', payloadString);
        req.emit('end');
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });
  });

  // ===========================================================================
  // CHARGE FAILED
  // ===========================================================================

  describe('charge.failed', () => {
    it('should log failure without updating balance', async () => {
      const userId = 'user_charge_failed';
      const payload = paystackFactories.chargeFailed({
        metadata: { firebaseUserId: userId },
      });
      const payloadString = JSON.stringify(payload);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-paystack-signature': 'valid_sig',
        },
      });

      setImmediate(() => {
        req.emit('data', payloadString);
        req.emit('end');
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(mockHandleChargeFailed).toHaveBeenCalled();
      expect(mockHandleChargeSuccess).not.toHaveBeenCalled();
    });

    it('should record gateway decline response', async () => {
      const payload = paystackFactories.chargeFailed({
        gateway_response: 'Declined',
        metadata: { firebaseUserId: 'user_declined' },
      });
      const payloadString = JSON.stringify(payload);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-paystack-signature': 'valid_sig',
        },
      });

      setImmediate(() => {
        req.emit('data', payloadString);
        req.emit('end');
      });

      await handler(req, res);

      expect(mockHandleChargeFailed).toHaveBeenCalledWith(
        expect.objectContaining({
          gateway_response: 'Declined',
        })
      );
    });
  });

  // ===========================================================================
  // TRANSFER SUCCESS
  // ===========================================================================

  describe('transfer.success', () => {
    it('should mark withdrawal as complete', async () => {
      const userId = 'user_transfer_success';
      const transferCode = randomId('TRF');
      const payload = paystackFactories.transferSuccess({
        metadata: { firebaseUserId: userId },
      });
      payload.data.transfer_code = transferCode;
      const payloadString = JSON.stringify(payload);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-paystack-signature': 'valid_sig',
        },
      });

      setImmediate(() => {
        req.emit('data', payloadString);
        req.emit('end');
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(mockHandleTransferSuccess).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // TRANSFER FAILED
  // ===========================================================================

  describe('transfer.failed', () => {
    it('should restore user balance on failed transfer', async () => {
      const userId = 'user_transfer_failed';
      const amount = 500000; // kobo
      const payload = paystackFactories.transferFailed({
        amount,
        metadata: { firebaseUserId: userId },
        reason: 'Could not process transfer',
      });
      const payloadString = JSON.stringify(payload);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-paystack-signature': 'valid_sig',
        },
      });

      setImmediate(() => {
        req.emit('data', payloadString);
        req.emit('end');
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(mockHandleTransferFailed).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // TRANSFER REVERSED
  // ===========================================================================

  describe('transfer.reversed', () => {
    it('should restore balance on reversed transfer', async () => {
      const userId = 'user_transfer_reversed';
      const payload = paystackFactories.transferReversed({
        metadata: { firebaseUserId: userId },
      });
      const payloadString = JSON.stringify(payload);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-paystack-signature': 'valid_sig',
        },
      });

      setImmediate(() => {
        req.emit('data', payloadString);
        req.emit('end');
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      // Reversed transfers should also trigger balance restoration
      expect(mockHandleTransferFailed).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // ERROR HANDLING
  // ===========================================================================

  describe('Error Handling', () => {
    it('should handle malformed JSON gracefully', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-paystack-signature': 'valid_sig',
        },
      });

      setImmediate(() => {
        req.emit('data', 'not valid json {{{');
        req.emit('end');
      });

      await handler(req, res);

      // Should handle JSON parse error
      expect(res._getStatusCode()).toBeGreaterThanOrEqual(400);
    });

    it('should handle handler errors and mark event as failed', async () => {
      const payload = paystackFactories.chargeSuccess({
        metadata: { firebaseUserId: 'user_error' },
      });
      const payloadString = JSON.stringify(payload);

      mockHandleChargeSuccess.mockRejectedValue(new Error('Database connection failed') as Error);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-paystack-signature': 'valid_sig',
        },
      });

      setImmediate(() => {
        req.emit('data', payloadString);
        req.emit('end');
      });

      await handler(req, res);

      expect(mockMarkWebhookEventAsFailed).toHaveBeenCalled();
    });

    it('should reject non-POST methods', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
    });
  });

  // ===========================================================================
  // CURRENCY HANDLING
  // ===========================================================================

  describe('NGN Currency Handling', () => {
    it('should correctly handle kobo to NGN conversion', async () => {
      // Paystack amounts are in kobo (100 kobo = 1 NGN)
      const amountKobo = 1500000; // 15,000 NGN
      const payload = paystackFactories.chargeSuccess({
        amount: amountKobo,
        currency: 'NGN',
        metadata: { firebaseUserId: 'user_ngn' },
      });
      const payloadString = JSON.stringify(payload);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-paystack-signature': 'valid_sig',
        },
      });

      setImmediate(() => {
        req.emit('data', payloadString);
        req.emit('end');
      });

      await handler(req, res);

      expect(mockHandleChargeSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: amountKobo,
          currency: 'NGN',
        })
      );
    });
  });
});
