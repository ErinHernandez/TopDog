/**
 * Tests for /api/xendit/webhook endpoint
 * 
 * Critical webhook handler that processes Xendit payment events.
 * Tests cover:
 * - Token verification
 * - Event processing (disbursement.completed, VA payment, e-wallet capture)
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
    UNAUTHORIZED: 'unauthorized',
    INTERNAL: 'internal',
  },
}));

jest.mock('../../../lib/xendit', () => ({
  verifyWebhookToken: jest.fn(),
  handleVAPayment: jest.fn(),
  handleEWalletCapture: jest.fn(),
  handleDisbursementCallback: jest.fn(),
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

describe('/api/xendit/webhook', () => {
  let handler;
  let originalEnv;
  let xenditMocks;

  beforeAll(() => {
    originalEnv = {
      XENDIT_WEBHOOK_TOKEN: process.env.XENDIT_WEBHOOK_TOKEN,
    };
  });

  afterAll(() => {
    process.env.XENDIT_WEBHOOK_TOKEN = originalEnv.XENDIT_WEBHOOK_TOKEN;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    // Set up environment
    process.env.XENDIT_WEBHOOK_TOKEN = 'test_webhook_token';

    xenditMocks = require('../../../lib/xendit');

    // Import handler after mocks are set up
    handler = require('../../../pages/api/xendit/webhook').default;
  });

  describe('Request Validation', () => {
    it('should reject non-POST requests', async () => {
      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await expect(handler(req, res)).rejects.toThrow('Method GET not allowed');
    });

    it('should reject requests without callback token', async () => {
      const payload = webhookMocks.createXenditDisbursementCompletedEvent();
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
          error: expect.stringContaining('token'),
        })
      );
    });
  });

  describe('Token Verification', () => {
    it('should verify valid Xendit webhook token', async () => {
      const payload = webhookMocks.createXenditDisbursementCompletedEvent();
      const payloadString = JSON.stringify(payload);
      buffer.mockResolvedValue(Buffer.from(payloadString));
      
      xenditMocks.verifyWebhookToken.mockReturnValue(true);
      xenditMocks.handleDisbursementCallback.mockResolvedValue({
        success: true,
        actions: ['transaction_updated'],
      });

      const req = createMockRequest({
        method: 'POST',
        headers: { 'x-callback-token': process.env.XENDIT_WEBHOOK_TOKEN },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(xenditMocks.verifyWebhookToken).toHaveBeenCalledWith(
        process.env.XENDIT_WEBHOOK_TOKEN
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should reject invalid token', async () => {
      const payload = webhookMocks.createXenditDisbursementCompletedEvent();
      const payloadString = JSON.stringify(payload);
      buffer.mockResolvedValue(Buffer.from(payloadString));
      
      xenditMocks.verifyWebhookToken.mockReturnValue(false);

      const req = createMockRequest({
        method: 'POST',
        headers: { 'x-callback-token': 'invalid_token' },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('token'),
        })
      );
    });
  });

  describe('Event Processing', () => {
    it('should process disbursement.completed event', async () => {
      const payload = webhookMocks.createXenditDisbursementCompletedEvent({
        disbursement: {
          id: 'disb_test_123',
          external_id: 'txn_123',
          amount: 100000, // 1000 IDR
          status: 'COMPLETED',
          bank_code: 'BCA',
        },
      });
      const payloadString = JSON.stringify(payload);
      buffer.mockResolvedValue(Buffer.from(payloadString));
      
      xenditMocks.verifyWebhookToken.mockReturnValue(true);
      xenditMocks.handleDisbursementCallback.mockResolvedValue({
        success: true,
        actions: ['transaction_updated', 'balance_debited'],
      });

      const req = createMockRequest({
        method: 'POST',
        headers: { 'x-callback-token': process.env.XENDIT_WEBHOOK_TOKEN },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(xenditMocks.handleDisbursementCallback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          received: true,
          success: true,
        })
      );
    });

    it('should process disbursement.failed event', async () => {
      const payload = webhookMocks.createXenditDisbursementFailedEvent({
        disbursement: {
          id: 'disb_test_123',
          external_id: 'txn_123',
          amount: 100000,
          status: 'FAILED',
          failure_code: 'INSUFFICIENT_BALANCE',
        },
      });
      const payloadString = JSON.stringify(payload);
      buffer.mockResolvedValue(Buffer.from(payloadString));
      
      xenditMocks.verifyWebhookToken.mockReturnValue(true);
      xenditMocks.handleDisbursementCallback.mockResolvedValue({
        success: true,
        actions: ['balance_restored', 'transaction_failed'],
      });

      const req = createMockRequest({
        method: 'POST',
        headers: { 'x-callback-token': process.env.XENDIT_WEBHOOK_TOKEN },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(xenditMocks.handleDisbursementCallback).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should process Virtual Account payment', async () => {
      const payload = {
        payment_id: 'va_payment_123',
        callback_virtual_account_id: 'va_123',
        amount: 50000,
        status: 'PAID',
      };
      const payloadString = JSON.stringify(payload);
      buffer.mockResolvedValue(Buffer.from(payloadString));
      
      xenditMocks.verifyWebhookToken.mockReturnValue(true);
      xenditMocks.handleVAPayment.mockResolvedValue({
        success: true,
        actions: ['balance_updated', 'transaction_created'],
      });

      const req = createMockRequest({
        method: 'POST',
        headers: { 'x-callback-token': process.env.XENDIT_WEBHOOK_TOKEN },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(xenditMocks.handleVAPayment).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should process e-wallet capture', async () => {
      const payload = {
        id: 'ewallet_charge_123',
        business_id: 'business_123',
        channel_code: 'OVO',
        status: 'SUCCEEDED',
        amount: 50000,
      };
      const payloadString = JSON.stringify(payload);
      buffer.mockResolvedValue(Buffer.from(payloadString));
      
      xenditMocks.verifyWebhookToken.mockReturnValue(true);
      xenditMocks.handleEWalletCapture.mockResolvedValue({
        success: true,
        actions: ['balance_updated', 'transaction_created'],
      });

      const req = createMockRequest({
        method: 'POST',
        headers: { 'x-callback-token': process.env.XENDIT_WEBHOOK_TOKEN },
      });
      const res = createMockResponse();

      await handler(req, res);

      expect(xenditMocks.handleEWalletCapture).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle unknown event types gracefully', async () => {
      const payload = { unknown: 'event', data: 'test' };
      const payloadString = JSON.stringify(payload);
      buffer.mockResolvedValue(Buffer.from(payloadString));
      
      xenditMocks.verifyWebhookToken.mockReturnValue(true);

      const req = createMockRequest({
        method: 'POST',
        headers: { 'x-callback-token': process.env.XENDIT_WEBHOOK_TOKEN },
      });
      const res = createMockResponse();

      await handler(req, res);

      // Should still return 200 for unknown events
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          received: true,
          success: true,
          actions: ['unknown_event_type'],
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle webhook processing errors gracefully', async () => {
      const payload = webhookMocks.createXenditDisbursementCompletedEvent();
      const payloadString = JSON.stringify(payload);
      buffer.mockResolvedValue(Buffer.from(payloadString));
      
      xenditMocks.verifyWebhookToken.mockReturnValue(true);
      xenditMocks.handleDisbursementCallback.mockRejectedValue(new Error('Processing error'));

      const req = createMockRequest({
        method: 'POST',
        headers: { 'x-callback-token': process.env.XENDIT_WEBHOOK_TOKEN },
      });
      const res = createMockResponse();

      await handler(req, res);

      // Webhooks should always return 200 even on errors
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
