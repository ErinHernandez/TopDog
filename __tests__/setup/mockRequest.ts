/**
 * Mock Request Types and Helpers
 *
 * Provides type-safe mock request creation for API integration tests.
 * Eliminates the need for `as any` casting when setting request body/headers.
 */

import { createMocks, RequestMethod } from 'node-mocks-http';
import type { NextApiRequest, NextApiResponse } from 'next';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Extended mock request type that includes webhook-specific properties.
 * Use this instead of casting to `any` when setting body for webhooks.
 */
export interface MockWebhookRequest extends NextApiRequest {
  /**
   * Raw body buffer for webhook signature verification.
   * Used by Stripe, PayMongo, Xendit webhooks.
   */
  body: Buffer | string | Record<string, unknown>;

  /**
   * Internal mock body property used by some test patterns.
   * Prefer using `body` directly instead.
   */
  _mockBody?: string;
}

export interface MockWebhookResponse extends NextApiResponse {
  _getStatusCode(): number;
  _getData(): string;
  _getHeaders(): Record<string, string | string[] | undefined>;
}

export interface MockRequestOptions {
  method?: RequestMethod;
  headers?: Record<string, string>;
  query?: Record<string, string | string[]>;
  body?: unknown;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a type-safe mock request/response pair for webhook testing.
 *
 * @example
 * ```typescript
 * const { req, res } = createWebhookMocks({
 *   method: 'POST',
 *   headers: { 'stripe-signature': 't=123,v1=abc' },
 * });
 *
 * // Type-safe body assignment (no `as any` needed)
 * req.body = Buffer.from(JSON.stringify(payload));
 *
 * await handler(req, res);
 * expect(res._getStatusCode()).toBe(200);
 * ```
 */
export function createWebhookMocks(options: MockRequestOptions = {}): {
  req: MockWebhookRequest;
  res: MockWebhookResponse;
} {
  const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
    method: options.method ?? 'POST',
    headers: {
      'content-type': 'application/json',
      ...options.headers,
    },
    query: options.query,
    body: options.body,
  });

  return {
    req: req as MockWebhookRequest,
    res: res as MockWebhookResponse,
  };
}

/**
 * Create mock request with raw body buffer for signature verification.
 *
 * @example
 * ```typescript
 * const payload = { type: 'payment_intent.succeeded', ... };
 * const { req, res } = createWebhookMocksWithBody(payload, {
 *   headers: { 'stripe-signature': signature },
 * });
 * ```
 */
export function createWebhookMocksWithBody(
  payload: unknown,
  options: Omit<MockRequestOptions, 'body'> = {}
): {
  req: MockWebhookRequest;
  res: MockWebhookResponse;
  payloadString: string;
} {
  const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);

  const { req, res } = createWebhookMocks(options);
  req.body = Buffer.from(payloadString);

  return { req, res, payloadString };
}

/**
 * Set the mock body on a request (for tests that create req separately).
 * This is the type-safe replacement for `(req as any)._mockBody = ...`
 */
export function setMockBody(req: MockWebhookRequest, body: string | Buffer): void {
  if (typeof body === 'string') {
    req._mockBody = body;
    req.body = Buffer.from(body);
  } else {
    req._mockBody = body.toString();
    req.body = body;
  }
}

export default {
  createWebhookMocks,
  createWebhookMocksWithBody,
  setMockBody,
};
