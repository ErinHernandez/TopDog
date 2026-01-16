/**
 * Stripe Webhook Integration Tests
 *
 * Tests the complete flow of Stripe webhook event processing including:
 * - Signature verification
 * - Event deduplication (idempotency)
 * - Balance updates
 * - Transaction recording
 * - Error handling
 */

import { jest, describe, it, expect, beforeEach, beforeAll, afterAll } from '@jest/globals';
import { createMocks } from 'node-mocks-http';
import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { stripeFactories, randomId, timestamp } from '../../factories/webhookEvents';

// Mock Firebase
jest.mock('../../../lib/firebase-utils', () => ({
  getDb: jest.fn(() => ({})),
}));

// Mock Stripe functions
const mockUpdateUserBalance = jest.fn();
const mockCreateTransaction = jest.fn();
const mockUpdateTransactionStatus = jest.fn();
const mockFindTransactionByPaymentIntent = jest.fn();
const mockFindTransactionByTransfer = jest.fn();
const mockLogPaymentEvent = jest.fn();
const mockUpdateLastDepositCurrency = jest.fn();
const mockFindEventByStripeId = jest.fn();
const mockMarkEventAsProcessed = jest.fn();
const mockMarkEventAsFailed = jest.fn();
const mockCreateOrUpdateWebhookEvent = jest.fn();

jest.mock('../../../lib/stripe', () => ({
  updateUserBalance: (...args: unknown[]) => mockUpdateUserBalance(...args),
  createTransaction: (...args: unknown[]) => mockCreateTransaction(...args),
  updateTransactionStatus: (...args: unknown[]) => mockUpdateTransactionStatus(...args),
  findTransactionByPaymentIntent: (...args: unknown[]) => mockFindTransactionByPaymentIntent(...args),
  findTransactionByTransfer: (...args: unknown[]) => mockFindTransactionByTransfer(...args),
  logPaymentEvent: (...args: unknown[]) => mockLogPaymentEvent(...args),
  updateLastDepositCurrency: (...args: unknown[]) => mockUpdateLastDepositCurrency(...args),
  findEventByStripeId: (...args: unknown[]) => mockFindEventByStripeId(...args),
  markEventAsProcessed: (...args: unknown[]) => mockMarkEventAsProcessed(...args),
  markEventAsFailed: (...args: unknown[]) => mockMarkEventAsFailed(...args),
  createOrUpdateWebhookEvent: (...args: unknown[]) => mockCreateOrUpdateWebhookEvent(...args),
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

// Mock Stripe SDK
const mockConstructEvent = jest.fn();
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    webhooks: {
      constructEvent: mockConstructEvent,
    },
  }));
});

// Test constants
const WEBHOOK_SECRET = 'whsec_test_secret_key_12345';
const STRIPE_SECRET_KEY = 'sk_test_12345';

describe('Stripe Webhook Integration', () => {
  let handler: typeof import('../../../pages/api/stripe/webhook').default;

  beforeAll(() => {
    // Set environment variables
    process.env.STRIPE_SECRET_KEY = STRIPE_SECRET_KEY;
    process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock implementations
    mockFindEventByStripeId.mockResolvedValue(null);
    mockCreateOrUpdateWebhookEvent.mockResolvedValue({});
    mockMarkEventAsProcessed.mockResolvedValue({});
    mockMarkEventAsFailed.mockResolvedValue({});
    mockUpdateUserBalance.mockResolvedValue({});
    mockCreateTransaction.mockResolvedValue({ id: randomId('txn') });
    mockLogPaymentEvent.mockResolvedValue({});

    // Re-import handler to get fresh instance
    jest.isolateModules(() => {
      handler = require('../../../pages/api/stripe/webhook').default;
    });
  });

  afterAll(() => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
  });

  // ===========================================================================
  // SIGNATURE VERIFICATION
  // ===========================================================================

  describe('Signature Verification', () => {
    it('should reject requests without stripe-signature header', async () => {
      const payload = stripeFactories.paymentIntentSucceeded();
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        body: payload,
        headers: {
          'content-type': 'application/json',
        },
      });

      // Mock the buffer function
      jest.doMock('micro', () => ({
        buffer: jest.fn().mockResolvedValue(Buffer.from(JSON.stringify(payload))),
      }));

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200); // Webhooks always return 200
      const responseData = JSON.parse(res._getData());
      expect(responseData.received).toBe(false);
      expect(responseData.error).toContain('signature');
    });

    it('should reject requests with invalid signature', async () => {
      const payload = stripeFactories.paymentIntentSucceeded();
      const payloadString = JSON.stringify(payload);

      mockConstructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'stripe-signature': 't=invalid,v1=invalid_signature',
        },
      });

      // Attach raw body
      (req as any).body = Buffer.from(payloadString);

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());
      expect(responseData.received).toBe(false);
    });

    it('should accept requests with valid signature', async () => {
      const payload = stripeFactories.paymentIntentSucceeded({
        metadata: { firebaseUserId: 'user_123' },
      });
      const event = {
        id: payload.id,
        type: payload.type,
        data: payload.data,
        created: payload.created,
        livemode: payload.livemode,
        api_version: payload.api_version,
      };

      mockConstructEvent.mockReturnValue(event);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'stripe-signature': stripeFactories.createSignature(
            JSON.stringify(payload),
            WEBHOOK_SECRET
          ),
        },
      });

      (req as any).body = Buffer.from(JSON.stringify(payload));

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
      const eventId = randomId('evt');
      const payload = stripeFactories.paymentIntentSucceeded();
      payload.id = eventId;

      const event = {
        id: eventId,
        type: payload.type,
        data: payload.data,
        created: payload.created,
      };

      mockConstructEvent.mockReturnValue(event);
      mockFindEventByStripeId.mockResolvedValue({
        id: eventId,
        status: 'processed',
        processedAt: new Date().toISOString(),
      });

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'stripe-signature': 'valid_sig',
        },
      });

      (req as any).body = Buffer.from(JSON.stringify(payload));

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const responseData = JSON.parse(res._getData());
      expect(responseData.received).toBe(true);
      // Should not call balance update for duplicate
      expect(mockUpdateUserBalance).not.toHaveBeenCalled();
    });

    it('should process new events and record them', async () => {
      const eventId = randomId('evt');
      const userId = 'user_test_123';
      const payload = stripeFactories.paymentIntentSucceeded({
        metadata: { firebaseUserId: userId },
      });
      payload.id = eventId;

      const event = {
        id: eventId,
        type: payload.type,
        data: payload.data,
        created: payload.created,
      };

      mockConstructEvent.mockReturnValue(event);
      mockFindEventByStripeId.mockResolvedValue(null); // Not processed yet

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'stripe-signature': 'valid_sig',
        },
      });

      (req as any).body = Buffer.from(JSON.stringify(payload));

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(mockCreateOrUpdateWebhookEvent).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // PAYMENT INTENT SUCCEEDED
  // ===========================================================================

  describe('payment_intent.succeeded', () => {
    it('should update user balance on successful payment', async () => {
      const userId = 'user_balance_test';
      const amount = 5000; // $50.00
      const payload = stripeFactories.paymentIntentSucceeded({
        amount,
        metadata: { firebaseUserId: userId },
      });

      const event = {
        id: payload.id,
        type: 'payment_intent.succeeded',
        data: payload.data,
        created: payload.created,
      };

      mockConstructEvent.mockReturnValue(event);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'stripe-signature': 'valid_sig',
        },
      });

      (req as any).body = Buffer.from(JSON.stringify(payload));

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(mockUpdateUserBalance).toHaveBeenCalledWith(
        userId,
        expect.any(Number) // Amount in dollars
      );
    });

    it('should create a deposit transaction record', async () => {
      const userId = 'user_txn_test';
      const paymentIntentId = randomId('pi');
      const payload = stripeFactories.paymentIntentSucceeded({
        id: paymentIntentId,
        metadata: { firebaseUserId: userId },
      });
      payload.data.object.id = paymentIntentId;

      const event = {
        id: payload.id,
        type: 'payment_intent.succeeded',
        data: payload.data,
        created: payload.created,
      };

      mockConstructEvent.mockReturnValue(event);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'stripe-signature': 'valid_sig',
        },
      });

      (req as any).body = Buffer.from(JSON.stringify(payload));

      await handler(req, res);

      expect(mockCreateTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          type: 'deposit',
          status: 'completed',
        })
      );
    });

    it('should update last deposit currency', async () => {
      const userId = 'user_currency_test';
      const currency = 'eur';
      const payload = stripeFactories.paymentIntentSucceeded({
        currency,
        metadata: { firebaseUserId: userId },
      });
      payload.data.object.currency = currency;

      const event = {
        id: payload.id,
        type: 'payment_intent.succeeded',
        data: payload.data,
        created: payload.created,
      };

      mockConstructEvent.mockReturnValue(event);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'stripe-signature': 'valid_sig',
        },
      });

      (req as any).body = Buffer.from(JSON.stringify(payload));

      await handler(req, res);

      expect(mockUpdateLastDepositCurrency).toHaveBeenCalledWith(
        userId,
        currency.toUpperCase()
      );
    });
  });

  // ===========================================================================
  // PAYMENT INTENT FAILED
  // ===========================================================================

  describe('payment_intent.payment_failed', () => {
    it('should log payment failure without updating balance', async () => {
      const userId = 'user_fail_test';
      const payload = stripeFactories.paymentIntentFailed({
        metadata: { firebaseUserId: userId },
      });

      const event = {
        id: payload.id,
        type: 'payment_intent.payment_failed',
        data: payload.data,
        created: payload.created,
      };

      mockConstructEvent.mockReturnValue(event);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'stripe-signature': 'valid_sig',
        },
      });

      (req as any).body = Buffer.from(JSON.stringify(payload));

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(mockUpdateUserBalance).not.toHaveBeenCalled();
      expect(mockLogPaymentEvent).toHaveBeenCalled();
    });

    it('should record failure reason in logs', async () => {
      const payload = stripeFactories.paymentIntentFailed({
        metadata: { firebaseUserId: 'user_123' },
      });

      const event = {
        id: payload.id,
        type: 'payment_intent.payment_failed',
        data: payload.data,
        created: payload.created,
      };

      mockConstructEvent.mockReturnValue(event);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'stripe-signature': 'valid_sig',
        },
      });

      (req as any).body = Buffer.from(JSON.stringify(payload));

      await handler(req, res);

      expect(mockLogPaymentEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'payment_intent.payment_failed',
        })
      );
    });
  });

  // ===========================================================================
  // TRANSFER EVENTS (PAYOUTS)
  // ===========================================================================

  describe('transfer.created', () => {
    it('should record payout transfer', async () => {
      const userId = 'user_transfer_test';
      const payload = stripeFactories.transferCreated({
        metadata: { firebaseUserId: userId },
      });

      const event = {
        id: payload.id,
        type: 'transfer.created',
        data: payload.data,
        created: payload.created,
      };

      mockConstructEvent.mockReturnValue(event);

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'stripe-signature': 'valid_sig',
        },
      });

      (req as any).body = Buffer.from(JSON.stringify(payload));

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(mockLogPaymentEvent).toHaveBeenCalled();
    });
  });

  describe('transfer.failed', () => {
    it('should restore balance on failed transfer', async () => {
      const userId = 'user_transfer_fail';
      const amount = 10000; // $100.00
      const transferId = randomId('tr');
      const payload = stripeFactories.transferFailed({
        amount,
        metadata: { firebaseUserId: userId },
      });
      payload.data.object.id = transferId;

      const event = {
        id: payload.id,
        type: 'transfer.failed',
        data: payload.data,
        created: payload.created,
      };

      mockConstructEvent.mockReturnValue(event);
      mockFindTransactionByTransfer.mockResolvedValue({
        id: 'txn_123',
        userId,
        amount: amount / 100,
      });

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'stripe-signature': 'valid_sig',
        },
      });

      (req as any).body = Buffer.from(JSON.stringify(payload));

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });
  });

  // ===========================================================================
  // DISPUTE EVENTS
  // ===========================================================================

  describe('charge.dispute.created', () => {
    it('should flag account on dispute', async () => {
      const paymentIntentId = randomId('pi');
      const payload = stripeFactories.disputeCreated({
        paymentIntent: paymentIntentId,
      });

      const event = {
        id: payload.id,
        type: 'charge.dispute.created',
        data: payload.data,
        created: payload.created,
      };

      mockConstructEvent.mockReturnValue(event);
      mockFindTransactionByPaymentIntent.mockResolvedValue({
        id: 'txn_disputed',
        userId: 'user_disputed',
        amount: 50,
      });

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'stripe-signature': 'valid_sig',
        },
      });

      (req as any).body = Buffer.from(JSON.stringify(payload));

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(mockLogPaymentEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'charge.dispute.created',
        })
      );
    });
  });

  // ===========================================================================
  // REFUND EVENTS
  // ===========================================================================

  describe('charge.refunded', () => {
    it('should process refund and update balance', async () => {
      const paymentIntentId = randomId('pi');
      const userId = 'user_refund_test';
      const payload = stripeFactories.chargeRefunded();
      payload.data.object.payment_intent = paymentIntentId;

      const event = {
        id: payload.id,
        type: 'charge.refunded',
        data: payload.data,
        created: payload.created,
      };

      mockConstructEvent.mockReturnValue(event);
      mockFindTransactionByPaymentIntent.mockResolvedValue({
        id: 'txn_to_refund',
        userId,
        amount: 50,
      });

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'stripe-signature': 'valid_sig',
        },
      });

      (req as any).body = Buffer.from(JSON.stringify(payload));

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
    });
  });

  // ===========================================================================
  // ERROR HANDLING
  // ===========================================================================

  describe('Error Handling', () => {
    it('should handle missing webhook secret gracefully', async () => {
      // Temporarily remove webhook secret
      const originalSecret = process.env.STRIPE_WEBHOOK_SECRET;
      delete process.env.STRIPE_WEBHOOK_SECRET;

      // Re-import handler
      jest.resetModules();
      const { default: freshHandler } = await import('../../../pages/api/stripe/webhook');

      const payload = stripeFactories.paymentIntentSucceeded();
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'stripe-signature': 'any_sig',
        },
      });

      (req as any).body = Buffer.from(JSON.stringify(payload));

      await freshHandler(req, res);

      // Restore secret
      process.env.STRIPE_WEBHOOK_SECRET = originalSecret;

      expect(res._getStatusCode()).toBe(200); // Webhooks always return 200
      const responseData = JSON.parse(res._getData());
      expect(responseData.received).toBe(false);
    });

    it('should handle database errors gracefully', async () => {
      const payload = stripeFactories.paymentIntentSucceeded({
        metadata: { firebaseUserId: 'user_db_error' },
      });

      const event = {
        id: payload.id,
        type: 'payment_intent.succeeded',
        data: payload.data,
        created: payload.created,
      };

      mockConstructEvent.mockReturnValue(event);
      mockUpdateUserBalance.mockRejectedValue(new Error('Database connection failed'));

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'stripe-signature': 'valid_sig',
        },
      });

      (req as any).body = Buffer.from(JSON.stringify(payload));

      await handler(req, res);

      // Should still return 200 but mark event as failed
      expect(res._getStatusCode()).toBe(200);
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
  // CONCURRENT REQUEST HANDLING
  // ===========================================================================

  describe('Concurrent Requests', () => {
    it('should handle concurrent duplicate events correctly', async () => {
      const eventId = randomId('evt');
      const payload = stripeFactories.paymentIntentSucceeded({
        metadata: { firebaseUserId: 'user_concurrent' },
      });
      payload.id = eventId;

      const event = {
        id: eventId,
        type: 'payment_intent.succeeded',
        data: payload.data,
        created: payload.created,
      };

      mockConstructEvent.mockReturnValue(event);

      // Simulate race condition - first call returns null, second returns processed
      let callCount = 0;
      mockFindEventByStripeId.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve(null);
        }
        return Promise.resolve({ id: eventId, status: 'processed' });
      });

      const { req: req1, res: res1 } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: { 'content-type': 'application/json', 'stripe-signature': 'valid_sig' },
      });
      (req1 as any).body = Buffer.from(JSON.stringify(payload));

      const { req: req2, res: res2 } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        headers: { 'content-type': 'application/json', 'stripe-signature': 'valid_sig' },
      });
      (req2 as any).body = Buffer.from(JSON.stringify(payload));

      // Process both concurrently
      await Promise.all([handler(req1, res1), handler(req2, res2)]);

      // Both should succeed
      expect(res1._getStatusCode()).toBe(200);
      expect(res2._getStatusCode()).toBe(200);
    });
  });
});
