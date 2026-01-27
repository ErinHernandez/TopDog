/**
 * Paystack Service Unit Tests
 *
 * Tests for the Paystack service layer including:
 * - Webhook signature verification (timing-safe)
 * - Transaction operations
 * - Currency validation
 * - Error handling
 *
 * @module __tests__/lib/paystack/paystackService
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import crypto from 'crypto';

// Store original env
const originalEnv = process.env;

// Mock Firebase
jest.mock('../../../lib/firebase-utils', () => ({
  getDb: jest.fn(() => ({})),
}));

// Mock Firestore functions
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  collection: jest.fn(),
  addDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  serverTimestamp: jest.fn(),
  runTransaction: jest.fn(),
}));

// Mock error tracking
jest.mock('../../../lib/errorTracking', () => ({
  captureError: jest.fn(),
}));

// Mock logger
jest.mock('../../../lib/logger/serverLogger', () => ({
  serverLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock retry utils
jest.mock('../../../lib/paystack/retryUtils', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  withPaystackRetry: jest.fn((fn: () => any) => fn()),
}));

// Mock exchange rates
jest.mock('../../../lib/stripe/exchangeRates', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getStripeExchangeRate: (jest.fn() as jest.Mock<any>).mockResolvedValue({ rate: 1550, timestamp: Date.now() }),
  convertToUSD: jest.fn((amount: number, rate: number) => amount / rate),
}));

describe('PaystackService', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    process.env.PAYSTACK_SECRET_KEY = 'sk_test_secret_key';
    process.env.PAYSTACK_PUBLIC_KEY = 'pk_test_public_key';
    process.env.PAYSTACK_WEBHOOK_SECRET = 'whsec_test_webhook_secret';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // ===========================================================================
  // WEBHOOK SIGNATURE VERIFICATION
  // ===========================================================================

  describe('verifyWebhookSignature', () => {
    let verifyWebhookSignature: (payload: string | Buffer, signature: string) => boolean;

    beforeEach(() => {
      jest.isolateModules(() => {
        const paystackService = require('../../../lib/paystack/paystackService');
        verifyWebhookSignature = paystackService.verifyWebhookSignature;
      });
    });

    it('should verify valid signature', () => {
      const payload = JSON.stringify({ event: 'charge.success', data: { id: '123' } });
      const secret = 'whsec_test_webhook_secret';
      const signature = crypto.createHmac('sha512', secret).update(payload).digest('hex');

      const result = verifyWebhookSignature(payload, signature);

      expect(result).toBe(true);
    });

    it('should reject invalid signature', () => {
      const payload = JSON.stringify({ event: 'charge.success', data: { id: '123' } });
      const invalidSignature = 'invalid_signature_that_is_not_a_valid_hex_hmac_sha512';

      const result = verifyWebhookSignature(payload, invalidSignature);

      expect(result).toBe(false);
    });

    it('should reject signature with wrong secret', () => {
      const payload = JSON.stringify({ event: 'charge.success', data: { id: '123' } });
      const wrongSecret = 'wrong_secret';
      const signature = crypto.createHmac('sha512', wrongSecret).update(payload).digest('hex');

      const result = verifyWebhookSignature(payload, signature);

      expect(result).toBe(false);
    });

    it('should reject empty signature', () => {
      const payload = JSON.stringify({ event: 'charge.success', data: { id: '123' } });

      const result = verifyWebhookSignature(payload, '');

      expect(result).toBe(false);
    });

    it('should reject null/undefined signature', () => {
      const payload = JSON.stringify({ event: 'charge.success', data: { id: '123' } });

      // @ts-expect-error - Testing invalid input
      expect(verifyWebhookSignature(payload, null)).toBe(false);
      // @ts-expect-error - Testing invalid input
      expect(verifyWebhookSignature(payload, undefined)).toBe(false);
    });

    it('should handle Buffer payload', () => {
      const payload = Buffer.from(JSON.stringify({ event: 'charge.success', data: { id: '123' } }));
      const secret = 'whsec_test_webhook_secret';
      const signature = crypto.createHmac('sha512', secret).update(payload.toString()).digest('hex');

      const result = verifyWebhookSignature(payload, signature);

      expect(result).toBe(true);
    });

    it('should reject signature with invalid hex characters', () => {
      const payload = JSON.stringify({ event: 'charge.success', data: { id: '123' } });
      const invalidHexSignature = 'ghijklmnop123456'; // Contains non-hex chars

      const result = verifyWebhookSignature(payload, invalidHexSignature);

      expect(result).toBe(false);
    });

    it('should reject signature with wrong length', () => {
      const payload = JSON.stringify({ event: 'charge.success', data: { id: '123' } });
      // SHA512 hex is 128 chars, this is shorter
      const shortSignature = 'abc123def456';

      const result = verifyWebhookSignature(payload, shortSignature);

      expect(result).toBe(false);
    });

    it('should be constant-time (no timing leak)', () => {
      const payload = JSON.stringify({ event: 'charge.success', data: { id: '123' } });
      const secret = 'whsec_test_webhook_secret';
      const validSignature = crypto.createHmac('sha512', secret).update(payload).digest('hex');
      const invalidSignature = crypto.createHmac('sha512', 'wrong').update(payload).digest('hex');

      // Run multiple iterations to measure timing consistency
      const iterations = 100;
      const validTimes: number[] = [];
      const invalidTimes: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startValid = process.hrtime.bigint();
        verifyWebhookSignature(payload, validSignature);
        validTimes.push(Number(process.hrtime.bigint() - startValid));

        const startInvalid = process.hrtime.bigint();
        verifyWebhookSignature(payload, invalidSignature);
        invalidTimes.push(Number(process.hrtime.bigint() - startInvalid));
      }

      // Calculate average times
      const avgValid = validTimes.reduce((a, b) => a + b, 0) / validTimes.length;
      const avgInvalid = invalidTimes.reduce((a, b) => a + b, 0) / invalidTimes.length;

      // The difference should be small (within 50% - allowing for noise)
      // This is a basic check - true timing attack resistance requires statistical analysis
      const ratio = Math.max(avgValid, avgInvalid) / Math.min(avgValid, avgInvalid);
      expect(ratio).toBeLessThan(2.0);
    });

    it('should return false when webhook secret is not configured', () => {
      // Remove the webhook secret
      delete process.env.PAYSTACK_WEBHOOK_SECRET;

      // Need to re-import after env change
      jest.isolateModules(() => {
        const { verifyWebhookSignature: verify } = require('../../../lib/paystack/paystackService');
        const payload = JSON.stringify({ event: 'test' });
        const signature = 'any_signature';

        expect(verify(payload, signature)).toBe(false);
      });
    });
  });

  // ===========================================================================
  // REFERENCE GENERATION
  // ===========================================================================

  describe('generateReference', () => {
    let generateReference: (prefix?: string) => string;

    beforeEach(() => {
      jest.isolateModules(() => {
        const paystackService = require('../../../lib/paystack/paystackService');
        generateReference = paystackService.generateReference;
      });
    });

    it('should generate unique references', () => {
      const ref1 = generateReference();
      const ref2 = generateReference();

      expect(ref1).not.toBe(ref2);
    });

    it('should use default prefix TD', () => {
      const ref = generateReference();

      expect(ref.startsWith('TD_')).toBe(true);
    });

    it('should use custom prefix', () => {
      const ref = generateReference('CUSTOM');

      expect(ref.startsWith('CUSTOM_')).toBe(true);
    });

    it('should generate uppercase references', () => {
      const ref = generateReference();

      expect(ref).toBe(ref.toUpperCase());
    });

    it('should have consistent format', () => {
      const ref = generateReference();
      // Format: PREFIX_TIMESTAMP_RANDOM
      const parts = ref.split('_');

      expect(parts.length).toBe(3);
      expect(parts[0]).toBe('TD');
      expect(parts[1].length).toBeGreaterThan(0);
      expect(parts[2].length).toBe(6); // 6 random chars
    });
  });

  // ===========================================================================
  // STATUS MAPPING
  // ===========================================================================

  describe('mapPaystackStatus', () => {
    let mapPaystackStatus: (status: string) => string;

    beforeEach(() => {
      jest.isolateModules(() => {
        const paystackService = require('../../../lib/paystack/paystackService');
        mapPaystackStatus = paystackService.mapPaystackStatus;
      });
    });

    it('should map success to completed', () => {
      expect(mapPaystackStatus('success')).toBe('completed');
    });

    it('should map failed to failed', () => {
      expect(mapPaystackStatus('failed')).toBe('failed');
    });

    it('should map abandoned to failed', () => {
      expect(mapPaystackStatus('abandoned')).toBe('failed');
    });

    it('should map reversed to failed', () => {
      expect(mapPaystackStatus('reversed')).toBe('failed');
    });

    it('should map pending to pending', () => {
      expect(mapPaystackStatus('pending')).toBe('pending');
    });

    it('should map queued to pending', () => {
      expect(mapPaystackStatus('queued')).toBe('pending');
    });

    it('should map processing to processing', () => {
      expect(mapPaystackStatus('processing')).toBe('processing');
    });

    it('should map unknown status to pending', () => {
      expect(mapPaystackStatus('unknown_status')).toBe('pending');
    });
  });
});

// ===========================================================================
// WEBHOOK HANDLER TESTS
// ===========================================================================

describe('Webhook Handlers', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    process.env.PAYSTACK_SECRET_KEY = 'sk_test_secret_key';
    process.env.PAYSTACK_WEBHOOK_SECRET = 'whsec_test_webhook_secret';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('handleChargeSuccess', () => {
    it('should return missing_user_id when no userId in metadata', async () => {
      jest.isolateModules(async () => {
        const { handleChargeSuccess } = require('../../../lib/paystack/paystackService');

        const data = {
          reference: 'ref_123',
          amount: 100000,
          currency: 'NGN',
          metadata: {},
        };

        const result = await handleChargeSuccess(data);

        expect(result.success).toBe(false);
        expect(result.actions).toContain('missing_user_id');
      });
    });
  });

  describe('handleChargeFailed', () => {
    it('should return missing_user_id when no userId in metadata', async () => {
      jest.isolateModules(async () => {
        const { handleChargeFailed } = require('../../../lib/paystack/paystackService');

        const data = {
          reference: 'ref_123',
          amount: 100000,
          currency: 'NGN',
          metadata: {},
          gateway_response: 'Declined',
        };

        const result = await handleChargeFailed(data);

        expect(result.success).toBe(false);
        expect(result.actions).toContain('missing_user_id');
      });
    });
  });
});
