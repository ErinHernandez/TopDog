/**
 * Tests for /api/paystack/webhook endpoint
 * 
 * Critical webhook handler that processes Paystack payment events.
 * Tests cover:
 * - Signature verification
 * - Event processing (charge.success, transfer.success, etc.)
 * - Balance updates
 * - Transaction recording
 * - Error handling
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
  createSuccessResponse: jest.fn((data, statusCode, logger) => ({
    statusCode,
    body: data,
  })),
  createErrorResponse: jest.fn((type, message, details, requestId) => ({
    statusCode: 400,
    body: { message, error: type },
  })),
  ErrorType: {
    UNAUTHORIZED: 'unauthorized',
    INTERNAL: 'internal',
  },
}));

jest.mock('../../../lib/paystack', () => ({
  verifyWebhookSignature: jest.fn(),
  handleChargeSuccess: jest.fn(),
  handleChargeFailed: jest.fn(),
  handleTransferSuccess: jest.fn(),
  handleTransferFailed: jest.fn(),
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

// Mock readRawBody function
const mockReadRawBody = jest.fn();
jest.mock('../../../pages/api/paystack/webhook', () => {
  const originalModule = jest.requireActual('../../../pages/api/paystack/webhook');
  return {
    ...originalModule,
    readRawBody: mockReadRawBody,
  };
});

const webhookMocks = require('../../__mocks__/webhooks');
const { createMockRequest, createMockResponse } = require('../../factories');

describe('/api/paystack/webhook', () => {
  let handler;
  let originalEnv;
  let paystackMocks;

  beforeAll(() => {
    originalEnv = {
      PAYSTACK_WEBHOOK_SECRET: process.env.PAYSTACK_WEBHOOK_SECRET,
    };
  });

  afterAll(() => {
    process.env.PAYSTACK_WEBHOOK_SECRET = originalEnv.PAYSTACK_WEBHOOK_SECRET;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    // Set up environment
    process.env.PAYSTACK_WEBHOOK_SECRET = 'whsec_test_secret';

    paystackMocks = require('../../../lib/paystack');

    // Import handler after mocks are set up
    handler = require('../../../pages/api/paystack/webhook').default;
  });

  describe('Request Validation', () => {
    it('should reject non-POST requests', async () => {
      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await expect(handler(req, res)).rejects.toThrow('Method GET not allowed');
    });

    it('should reject requests without signature header', async () => {
      const payload = webhookMocks.createPaystackChargeSuccessEvent();
      const payloadString = JSON.stringify(payload);
      mockReadRawBody.mockResolvedValue(payloadString);

      const req = createMockRequest({
        method: 'POST',
        headers: {},
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          received: false,
          error: expect.stringContaining('signature'),
        })
      );
    });
  });

  describe('Signature Verification', () => {
    it('should verify valid Paystack webhook signature', async () => {
      const payload = webhookMocks.createPaystackChargeSuccessEvent();
      const payloadString = JSON.stringify(payload);
      const signature = webhookMocks.createPaystackSignature(
        payloadString,
        process.env.PAYSTACK_WEBHOOK_SECRET
      );

      mockReadRawBody.mockResolvedValue(payloadString);
      paystackMocks.verifyWebhookSignature.mockReturnValue(true);
      paystackMocks.handleChargeSuccess.mockResolvedValue({
        success: true,
        actions: ['balance_updated', 'transaction_created'],
      });

      const req = createMockRequest({
        method: 'POST',
        headers: { 'x-paystack-signature': signature },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(paystackMocks.verifyWebhookSignature).toHaveBeenCalledWith(
        payloadString,
        signature
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should reject invalid signature', async () => {
      const payload = webhookMocks.createPaystackChargeSuccessEvent();
      const payloadString = JSON.stringify(payload);
      const invalidSignature = 'invalid_signature';

      mockReadRawBody.mockResolvedValue(payloadString);
      paystackMocks.verifyWebhookSignature.mockReturnValue(false);

      const req = createMockRequest({
        method: 'POST',
        headers: { 'x-paystack-signature': invalidSignature },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          received: false,
          error: expect.stringContaining('signature'),
        })
      );
    });
  });

  describe('Event Processing', () => {
    it('should process charge.success event', async () => {
      const payload = webhookMocks.createPaystackChargeSuccessEvent({
        transaction: {
          id: 123456789,
          reference: 'ref_test_123',
          amount: 500000, // 5000 NGN in kobo
          currency: 'NGN',
          status: 'success',
          metadata: { userId: 'user-123' },
        },
      });
      const payloadString = JSON.stringify(payload);
      const signature = webhookMocks.createPaystackSignature(
        payloadString,
        process.env.PAYSTACK_WEBHOOK_SECRET
      );

      mockReadRawBody.mockResolvedValue(payloadString);
      paystackMocks.verifyWebhookSignature.mockReturnValue(true);
      paystackMocks.handleChargeSuccess.mockResolvedValue({
        success: true,
        actions: ['balance_updated', 'transaction_created'],
      });

      const req = createMockRequest({
        method: 'POST',
        headers: { 'x-paystack-signature': signature },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(paystackMocks.handleChargeSuccess).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          received: true,
          event: 'charge.success',
        })
      );
    });

    it('should process transfer.success event', async () => {
      const payload = webhookMocks.createPaystackTransferSuccessEvent({
        transfer: {
          id: 987654321,
          reference: 'ref_transfer_123',
          amount: 100000, // 1000 NGN in kobo
          status: 'success',
          metadata: { userId: 'user-123', transactionId: 'txn_123' },
        },
      });
      const payloadString = JSON.stringify(payload);
      const signature = webhookMocks.createPaystackSignature(
        payloadString,
        process.env.PAYSTACK_WEBHOOK_SECRET
      );

      mockReadRawBody.mockResolvedValue(payloadString);
      paystackMocks.verifyWebhookSignature.mockReturnValue(true);
      paystackMocks.handleTransferSuccess.mockResolvedValue({
        success: true,
        actions: ['transaction_updated'],
      });

      const req = createMockRequest({
        method: 'POST',
        headers: { 'x-paystack-signature': signature },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(paystackMocks.handleTransferSuccess).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should process charge.failed event', async () => {
      const payload = webhookMocks.createPaystackWebhookPayload('charge.failed', {
        id: 123456789,
        reference: 'ref_test_123',
        status: 'failed',
      });
      const payloadString = JSON.stringify(payload);
      const signature = webhookMocks.createPaystackSignature(
        payloadString,
        process.env.PAYSTACK_WEBHOOK_SECRET
      );

      mockReadRawBody.mockResolvedValue(payloadString);
      paystackMocks.verifyWebhookSignature.mockReturnValue(true);
      paystackMocks.handleChargeFailed.mockResolvedValue({
        success: true,
        actions: ['failure_logged'],
      });

      const req = createMockRequest({
        method: 'POST',
        headers: { 'x-paystack-signature': signature },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(paystackMocks.handleChargeFailed).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle unknown event types gracefully', async () => {
      const payload = webhookMocks.createPaystackWebhookPayload('unknown.event', {});
      const payloadString = JSON.stringify(payload);
      const signature = webhookMocks.createPaystackSignature(
        payloadString,
        process.env.PAYSTACK_WEBHOOK_SECRET
      );

      mockReadRawBody.mockResolvedValue(payloadString);
      paystackMocks.verifyWebhookSignature.mockReturnValue(true);

      const req = createMockRequest({
        method: 'POST',
        headers: { 'x-paystack-signature': signature },
      });
      const res = createMockResponse();

      await handler(req, res);

      // Should still return 200 for unknown events
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          received: true,
          event: 'unknown.event',
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle webhook processing errors gracefully', async () => {
      const payload = webhookMocks.createPaystackChargeSuccessEvent();
      const payloadString = JSON.stringify(payload);
      const signature = webhookMocks.createPaystackSignature(
        payloadString,
        process.env.PAYSTACK_WEBHOOK_SECRET
      );

      mockReadRawBody.mockResolvedValue(payloadString);
      paystackMocks.verifyWebhookSignature.mockReturnValue(true);
      paystackMocks.handleChargeSuccess.mockRejectedValue(new Error('Processing error'));

      const req = createMockRequest({
        method: 'POST',
        headers: { 'x-paystack-signature': signature },
      });
      const res = createMockResponse();

      await handler(req, res);

      // Webhooks should always return 200 even on errors
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
