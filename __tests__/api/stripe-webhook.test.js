/**
 * Tests for /api/stripe/webhook endpoint
 * 
 * Critical webhook handler that processes Stripe payment events.
 * Tests cover:
 * - Signature verification
 * - Event processing (payment_intent.succeeded, payment_failed, etc.)
 * - Balance updates
 * - Transaction recording
 * - Error handling
 * - Idempotency
 */

// Mock dependencies
jest.mock('stripe');
jest.mock('micro', () => ({
  buffer: jest.fn(),
}));

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
  createSuccessResponse: jest.fn((data, statusCode, logger) => ({
    statusCode,
    body: data,
  })),
  createErrorResponse: jest.fn((type, message, details, requestId) => ({
    statusCode: 400,
    body: { message, error: type },
  })),
  ErrorType: {
    VALIDATION: 'validation',
    CONFIGURATION: 'configuration',
    INTERNAL: 'internal',
  },
}));

jest.mock('../../../lib/stripe', () => ({
  updateUserBalance: jest.fn(),
  createTransaction: jest.fn(),
  updateTransactionStatus: jest.fn(),
  findTransactionByPaymentIntent: jest.fn(),
  findTransactionByTransfer: jest.fn(),
  logPaymentEvent: jest.fn(),
  updateLastDepositCurrency: jest.fn(),
  findEventByStripeId: jest.fn(),
  markEventAsProcessed: jest.fn(),
  markEventAsFailed: jest.fn(),
  createOrUpdateWebhookEvent: jest.fn(),
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

jest.mock('../../../lib/firebase-utils', () => ({
  getDb: jest.fn(() => ({
    collection: jest.fn(),
  })),
}));

const { buffer } = require('micro');
const Stripe = require('stripe');
const webhookMocks = require('../../__mocks__/webhooks');
const { createMockRequest, createMockResponse } = require('../../factories');

describe('/api/stripe/webhook', () => {
  let handler;
  let mockStripe;
  let originalEnv;

  beforeAll(() => {
    originalEnv = {
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    };
  });

  afterAll(() => {
    process.env.STRIPE_SECRET_KEY = originalEnv.STRIPE_SECRET_KEY;
    process.env.STRIPE_WEBHOOK_SECRET = originalEnv.STRIPE_WEBHOOK_SECRET;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    // Set up environment
    process.env.STRIPE_SECRET_KEY = 'sk_test_12345';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';

    // Create mock Stripe instance
    mockStripe = {
      webhooks: {
        constructEvent: jest.fn(),
      },
    };

    Stripe.mockImplementation(() => mockStripe);

    // Import handler after mocks are set up
    handler = require('../../../pages/api/stripe/webhook').default;
  });

  describe('Request Validation', () => {
    it('should reject non-POST requests', async () => {
      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await expect(handler(req, res)).rejects.toThrow('Method GET not allowed');
    });

    it('should require STRIPE_WEBHOOK_SECRET environment variable', async () => {
      delete process.env.STRIPE_WEBHOOK_SECRET;
      jest.resetModules();
      handler = require('../../../pages/api/stripe/webhook').default;

      const event = webhookMocks.createStripePaymentIntentSucceededEvent();
      const payload = JSON.stringify(event);
      const signature = webhookMocks.createStripeSignature(payload, 'whsec_test_secret');

      buffer.mockResolvedValue(Buffer.from(payload));

      const req = createMockRequest({
        method: 'POST',
        headers: { 'stripe-signature': signature },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          received: false,
          error: expect.stringContaining('not configured'),
        })
      );
    });

    it('should reject requests without signature header', async () => {
      const payload = JSON.stringify(webhookMocks.createStripePaymentIntentSucceededEvent());
      buffer.mockResolvedValue(Buffer.from(payload));

      const req = createMockRequest({
        method: 'POST',
        headers: {},
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          received: false,
          error: expect.stringContaining('signature'),
        })
      );
    });
  });

  describe('Signature Verification', () => {
    it('should verify valid Stripe webhook signature', async () => {
      const event = webhookMocks.createStripePaymentIntentSucceededEvent();
      const payload = JSON.stringify(event);
      const signature = webhookMocks.createStripeSignature(payload, process.env.STRIPE_WEBHOOK_SECRET);

      buffer.mockResolvedValue(Buffer.from(payload));
      mockStripe.webhooks.constructEvent.mockReturnValue(event);

      const req = createMockRequest({
        method: 'POST',
        headers: { 'stripe-signature': signature },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
        Buffer.from(payload),
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    });

    it('should reject invalid signature', async () => {
      const event = webhookMocks.createStripePaymentIntentSucceededEvent();
      const payload = JSON.stringify(event);
      const invalidSignature = 'invalid_signature';

      buffer.mockResolvedValue(Buffer.from(payload));
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const req = createMockRequest({
        method: 'POST',
        headers: { 'stripe-signature': invalidSignature },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          received: false,
        })
      );
    });
  });

  describe('Payment Intent Events', () => {
    it('should process payment_intent.succeeded event', async () => {
      const { updateUserBalance, createTransaction, findEventByStripeId } = require('../../../lib/stripe');
      
      findEventByStripeId.mockResolvedValue(null); // Not processed yet
      
      const event = webhookMocks.createStripePaymentIntentSucceededEvent({
        paymentIntent: {
          id: 'pi_test_123',
          amount: 5000,
          currency: 'usd',
          status: 'succeeded',
          metadata: { userId: 'user-123' },
        },
      });
      
      const payload = JSON.stringify(event);
      const signature = webhookMocks.createStripeSignature(payload, process.env.STRIPE_WEBHOOK_SECRET);

      buffer.mockResolvedValue(Buffer.from(payload));
      mockStripe.webhooks.constructEvent.mockReturnValue(event);

      const req = createMockRequest({
        method: 'POST',
        headers: { 'stripe-signature': signature },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(findEventByStripeId).toHaveBeenCalledWith(event.id);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ received: true });
    });

    it('should handle payment_intent.payment_failed event', async () => {
      const { findEventByStripeId, logPaymentEvent } = require('../../../lib/stripe');
      
      findEventByStripeId.mockResolvedValue(null);
      
      const event = webhookMocks.createStripePaymentFailedEvent();
      const payload = JSON.stringify(event);
      const signature = webhookMocks.createStripeSignature(payload, process.env.STRIPE_WEBHOOK_SECRET);

      buffer.mockResolvedValue(Buffer.from(payload));
      mockStripe.webhooks.constructEvent.mockReturnValue(event);

      const req = createMockRequest({
        method: 'POST',
        headers: { 'stripe-signature': signature },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(logPaymentEvent).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should skip already processed events (idempotency)', async () => {
      const { findEventByStripeId, updateUserBalance } = require('../../../lib/stripe');
      
      findEventByStripeId.mockResolvedValue({ processed: true }); // Already processed
      
      const event = webhookMocks.createStripePaymentIntentSucceededEvent();
      const payload = JSON.stringify(event);
      const signature = webhookMocks.createStripeSignature(payload, process.env.STRIPE_WEBHOOK_SECRET);

      buffer.mockResolvedValue(Buffer.from(payload));
      mockStripe.webhooks.constructEvent.mockReturnValue(event);

      const req = createMockRequest({
        method: 'POST',
        headers: { 'stripe-signature': signature },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(updateUserBalance).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Payout Events', () => {
    it('should process payout.paid event', async () => {
      const { findEventByStripeId, updateTransactionStatus } = require('../../../lib/stripe');
      
      findEventByStripeId.mockResolvedValue(null);
      
      const event = webhookMocks.createStripePayoutPaidEvent({
        payout: {
          id: 'po_test_123',
          amount: 10000,
          metadata: {
            userId: 'user-123',
            transactionId: 'txn_123',
          },
        },
      });
      
      const payload = JSON.stringify(event);
      const signature = webhookMocks.createStripeSignature(payload, process.env.STRIPE_WEBHOOK_SECRET);

      buffer.mockResolvedValue(Buffer.from(payload));
      mockStripe.webhooks.constructEvent.mockReturnValue(event);

      const req = createMockRequest({
        method: 'POST',
        headers: { 'stripe-signature': signature },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(updateTransactionStatus).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle webhook processing errors gracefully', async () => {
      const event = webhookMocks.createStripePaymentIntentSucceededEvent();
      const payload = JSON.stringify(event);
      const signature = webhookMocks.createStripeSignature(payload, process.env.STRIPE_WEBHOOK_SECRET);

      buffer.mockResolvedValue(Buffer.from(payload));
      mockStripe.webhooks.constructEvent.mockReturnValue(event);
      
      const { findEventByStripeId } = require('../../../lib/stripe');
      findEventByStripeId.mockRejectedValue(new Error('Database error'));

      const req = createMockRequest({
        method: 'POST',
        headers: { 'stripe-signature': signature },
      });
      const res = createMockResponse();

      await handler(req, res);

      // Webhooks should always return 200 even on errors
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle unknown event types', async () => {
      const event = webhookMocks.createStripeEvent('unknown.event.type', {});
      const payload = JSON.stringify(event);
      const signature = webhookMocks.createStripeSignature(payload, process.env.STRIPE_WEBHOOK_SECRET);

      buffer.mockResolvedValue(Buffer.from(payload));
      mockStripe.webhooks.constructEvent.mockReturnValue(event);

      const req = createMockRequest({
        method: 'POST',
        headers: { 'stripe-signature': signature },
      });
      const res = createMockResponse();

      await handler(req, res);

      // Should still return 200 for unknown events
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
