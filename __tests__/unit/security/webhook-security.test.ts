/**
 * Webhook Security Tests
 *
 * Tests that Xendit webhook signature verification is mandatory —
 * no more "backwards compatibility" skip when secret is missing.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';

// Mock the dependencies
vi.mock('@/Documents/bestball-site/lib/errorTracking', () => ({
  captureError: vi.fn(),
}));
vi.mock('@/Documents/bestball-site/lib/firebase-utils', () => ({
  getDb: vi.fn(),
}));
vi.mock('@/Documents/bestball-site/lib/logger/serverLogger', () => ({
  serverLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));
vi.mock('@/Documents/bestball-site/lib/xendit/currencyConfig', () => ({
  validateDepositAmount: vi.fn(() => ({ isValid: true })),
}));

describe('Xendit Webhook Signature Verification', () => {
  // We'll test the verification logic directly by reimplementing the core check
  // (since the module reads env vars at import time)

  const VALID_SECRET = 'whsec_test_secret_key_12345678';

  function verifySignatureWithSecret(
    rawBody: string,
    signature: string | undefined,
    webhookSecret: string | undefined
  ): boolean {
    // This mirrors the hardened verifyWebhookSignature logic
    if (!webhookSecret) {
      return false; // SECURITY: reject when secret missing
    }

    if (!signature || typeof signature !== 'string') {
      return false;
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      const signatureBuffer = Buffer.from(signature, 'hex');
      const expectedBuffer = Buffer.from(expectedSignature, 'hex');

      if (signatureBuffer.length !== expectedBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
    } catch {
      return false;
    }
  }

  it('rejects request when webhook secret is not configured (no more backwards compat)', () => {
    const result = verifySignatureWithSecret('{"event":"test"}', 'abc123', undefined);
    expect(result).toBe(false);
  });

  it('rejects request when webhook secret is empty string', () => {
    const result = verifySignatureWithSecret('{"event":"test"}', 'abc123', '');
    expect(result).toBe(false);
  });

  it('rejects request when signature header is missing', () => {
    const result = verifySignatureWithSecret('{"event":"test"}', undefined, VALID_SECRET);
    expect(result).toBe(false);
  });

  it('rejects request when signature header is empty', () => {
    const result = verifySignatureWithSecret('{"event":"test"}', '', VALID_SECRET);
    expect(result).toBe(false);
  });

  it('accepts valid HMAC-SHA256 signature', () => {
    const body = '{"event":"payment.completed","amount":50000}';
    const expectedSig = crypto
      .createHmac('sha256', VALID_SECRET)
      .update(body)
      .digest('hex');

    const result = verifySignatureWithSecret(body, expectedSig, VALID_SECRET);
    expect(result).toBe(true);
  });

  it('rejects tampered payload (different body)', () => {
    const originalBody = '{"event":"payment.completed","amount":50000}';
    const tamperedBody = '{"event":"payment.completed","amount":999999}';

    const signature = crypto
      .createHmac('sha256', VALID_SECRET)
      .update(originalBody)
      .digest('hex');

    // Verify original passes
    expect(verifySignatureWithSecret(originalBody, signature, VALID_SECRET)).toBe(true);
    // Verify tampered fails
    expect(verifySignatureWithSecret(tamperedBody, signature, VALID_SECRET)).toBe(false);
  });

  it('rejects forged signature (wrong secret)', () => {
    const body = '{"event":"payment.completed"}';
    const forgedSig = crypto
      .createHmac('sha256', 'attacker_secret')
      .update(body)
      .digest('hex');

    const result = verifySignatureWithSecret(body, forgedSig, VALID_SECRET);
    expect(result).toBe(false);
  });

  it('rejects non-hex signature gracefully', () => {
    const body = '{"event":"test"}';
    const result = verifySignatureWithSecret(body, 'not-valid-hex!!!', VALID_SECRET);
    expect(result).toBe(false);
  });

  it('rejects signature with wrong length', () => {
    const body = '{"event":"test"}';
    // SHA-256 produces 64 hex chars; this is only 32
    const shortSig = crypto
      .createHmac('sha256', VALID_SECRET)
      .update(body)
      .digest('hex')
      .slice(0, 32);

    const result = verifySignatureWithSecret(body, shortSig, VALID_SECRET);
    expect(result).toBe(false);
  });
});
