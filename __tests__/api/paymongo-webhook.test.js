/**
 * Tests for /api/paymongo/webhook endpoint
 * 
 * Critical webhook handler that processes PayMongo payment events.
 * Tests cover:
 * - Signature verification
 * - Event processing (source.chargeable, payment.paid, etc.)
 * - Balance updates
 * - Transaction recording
 * - Error handling
 */

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
    UNAUTHORIZED: 'unauthorized',
    INTERNAL: 'internal',
  },
}));

jest.mock('../../../lib/paymongo', () => ({
  verifyWebhookSignature: jest.fn(),
  handleSourceChargeable: jest.fn(),
  handlePaymentPaid: jest.fn(),
  handlePaymentFailed: jest.fn(),
  handlePayoutPaid: jest.fn(),
  handlePayoutFailed: jest.fn(),
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

const { buffer } = require('micro');
const webhookMocks = require('../../__mocks__/webhooks');
const { createMockRequest, createMockResponse } = require('../../factories');

describe('/api/paymongo/webhook', () => {
  let handler;
  let originalEnv;
  let paymongoMocks;

  beforeAll(() => {
    originalEnv = {
      PAYMONGO_WEBHOOK_SECRET: process.env.PAYMONGO_WEBHOOK_SECRET,
    };
  });

  afterAll(() => {
    process.env.PAYMONGO_WEBHOOK_SECRET = originalEnv.PAYMONGO_WEBHOOK_SECRET;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    // Set up environment
    process.env.PAYMONGO_WEBHOOK_SECRET = 'whsec_test_secret';

    paymongoMocks = require('../../../lib/paymongo');

    // Import handler after mocks are set up
    handler = require('../../../pages/api/paymongo/webhook').default;
  });

  describe('Request Validation', () => {
    it('should reject non-POST requests', async () => {
      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await expect(handler(req, res)).rejects.toThrow('Method GET not allowed');
    });

    it('should reject requests without signature header', async () => {
      const payload = webhookMocks.createPayMongoSourceChargeableEvent();
      const payloadString = JSON.stringify(payload);
      buffer.mockResolvedValue(Buffer.from(payloadString));

      const req = createMockRequest({
        method: 'POST',
        headers: {},
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('signature'),
        })
      );
    });
  });

  describe('Signature Verification', () => {
    it('should verify valid PayMongo webhook signature', async () => {
      const payload = webhookMocks.createPayMongoSourceChargeableEvent();
      const payloadString = JSON.stringify(payload);
      const signature = webhookMocks.createPayMongoSignature(
        payloadString,
        process.env.PAYMONGO_WEBHOOK_SECRET
      );

      buffer.mockResolvedValue(Buffer.from(payloadString));
      paymongoMocks.verifyWebhookSignature.mockReturnValue(true);
      paymongoMocks.handleSourceChargeable.mockResolvedValue({
        success: true,
        actions: ['source_processed'],
      });

      const req = createMockRequest({
        method: 'POST',
        headers: { 'paymongo-signature': signature },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(paymongoMocks.verifyWebhookSignature).toHaveBeenCalledWith(
        Buffer.from(payloadString),
        signature
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should reject invalid signature', async () => {
      const payload = webhookMocks.createPayMongoSourceChargeableEvent();
      const payloadString = JSON.stringify(payload);
      const invalidSignature = 'invalid_signature';

      buffer.mockResolvedValue(Buffer.from(payloadString));
      paymongoMocks.verifyWebhookSignature.mockReturnValue(false);

      const req = createMockRequest({
        method: 'POST',
        headers: { 'paymongo-signature': invalidSignature },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('signature'),
        })
      );
    });
  });

  describe('Event Processing', () => {
    it('should process source.chargeable event', async () => {
      const payload = webhookMocks.createPayMongoSourceChargeableEvent({
        source: {
          id: 'src_test_123',
          type: 'gcash',
          amount: 5000,
          currency: 'PHP',
          status: 'chargeable',
        },
      });
      const payloadString = JSON.stringify(payload);
      const signature = webhookMocks.createPayMongoSignature(
        payloadString,
        process.env.PAYMONGO_WEBHOOK_SECRET
      );

      buffer.mockResolvedValue(Buffer.from(payloadString));
      paymongoMocks.verifyWebhookSignature.mockReturnValue(true);
      paymongoMocks.handleSourceChargeable.mockResolvedValue({
        success: true,
        actions: ['source_processed'],
      });

      const req = createMockRequest({
        method: 'POST',
        headers: { 'paymongo-signature': signature },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(paymongoMocks.handleSourceChargeable).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should process payment.paid event', async () => {
      const payload = webhookMocks.createPayMongoPaymentPaidEvent({
        payment: {
          id: 'pay_test_123',
          amount: 5000,
          currency: 'PHP',
          status: 'paid',
        },
      });
      const payloadString = JSON.stringify(payload);
      const signature = webhookMocks.createPayMongoSignature(
        payloadString,
        process.env.PAYMONGO_WEBHOOK_SECRET
      );

      buffer.mockResolvedValue(Buffer.from(payloadString));
      paymongoMocks.verifyWebhookSignature.mockReturnValue(true);
      paymongoMocks.handlePaymentPaid.mockResolvedValue({
        success: true,
        actions: ['balance_updated', 'transaction_created'],
      });

      const req = createMockRequest({
        method: 'POST',
        headers: { 'paymongo-signature': signature },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(paymongoMocks.handlePaymentPaid).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should process payment.failed event', async () => {
      const payload = webhookMocks.createPayMongoWebhookPayload('payment.failed', {
        id: 'pay_test_123',
        attributes: {
          amount: 5000,
          status: 'failed',
        },
      });
      const payloadString = JSON.stringify(payload);
      const signature = webhookMocks.createPayMongoSignature(
        payloadString,
        process.env.PAYMONGO_WEBHOOK_SECRET
      );

      buffer.mockResolvedValue(Buffer.from(payloadString));
      paymongoMocks.verifyWebhookSignature.mockReturnValue(true);
      paymongoMocks.handlePaymentFailed.mockResolvedValue({
        success: true,
        actions: ['failure_logged'],
      });

      const req = createMockRequest({
        method: 'POST',
        headers: { 'paymongo-signature': signature },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(paymongoMocks.handlePaymentFailed).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle unknown event types gracefully', async () => {
      const payload = webhookMocks.createPayMongoWebhookPayload('unknown.event', {});
      const payloadString = JSON.stringify(payload);
      const signature = webhookMocks.createPayMongoSignature(
        payloadString,
        process.env.PAYMONGO_WEBHOOK_SECRET
      );

      buffer.mockResolvedValue(Buffer.from(payloadString));
      paymongoMocks.verifyWebhookSignature.mockReturnValue(true);

      const req = createMockRequest({
        method: 'POST',
        headers: { 'paymongo-signature': signature },
      });
      const res = createMockResponse();

      await handler(req, res);

      // Should still return 200 for unknown events
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle webhook processing errors gracefully', async () => {
      const payload = webhookMocks.createPayMongoSourceChargeableEvent();
      const payloadString = JSON.stringify(payload);
      const signature = webhookMocks.createPayMongoSignature(
        payloadString,
        process.env.PAYMONGO_WEBHOOK_SECRET
      );

      buffer.mockResolvedValue(Buffer.from(payloadString));
      paymongoMocks.verifyWebhookSignature.mockReturnValue(true);
      paymongoMocks.handleSourceChargeable.mockRejectedValue(new Error('Processing error'));

      const req = createMockRequest({
        method: 'POST',
        headers: { 'paymongo-signature': signature },
      });
      const res = createMockResponse();

      await handler(req, res);

      // Should handle error and return appropriate response
      expect(res.status).toHaveBeenCalled();
    });
  });
});
