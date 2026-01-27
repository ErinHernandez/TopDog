/**
 * CSRF Protection Unit Tests
 *
 * Tests for CSRF token generation and validation including:
 * - Token generation randomness
 * - Constant-time comparison (timing attack prevention)
 * - Double-submit cookie pattern validation
 * - Middleware behavior
 *
 * @module __tests__/lib/csrfProtection
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import type { NextApiRequest, NextApiResponse } from 'next';
import {
  generateCSRFToken,
  validateCSRFToken,
  withCSRFProtection,
  setCSRFTokenCookie,
  getCSRFTokenFromCookie,
  verifyCsrfToken,
  getCSRFTokenHandler,
  CSRF_TOKEN_COOKIE,
  CSRF_TOKEN_HEADER,
} from '../../lib/csrfProtection';

// Helper to create mock request
function createMockRequest(overrides: Partial<NextApiRequest> = {}): NextApiRequest {
  return {
    method: 'POST',
    headers: {},
    cookies: {},
    ...overrides,
  } as unknown as NextApiRequest;
}

// Helper to create mock response
function createMockResponse(): NextApiResponse & {
  _status: number;
  _json: unknown;
  _headers: Record<string, string | string[]>;
  _ended: boolean;
} {
  const res = {
    _status: 200,
    _json: null,
    _headers: {} as Record<string, string | string[]>,
    _ended: false,
    status(code: number) {
      this._status = code;
      return this;
    },
    json(data: unknown) {
      this._json = data;
      this._ended = true;
      return this;
    },
    setHeader(name: string, value: string | string[]) {
      this._headers[name] = value;
      return this;
    },
  };
  return res as NextApiResponse & {
    _status: number;
    _json: unknown;
    _headers: Record<string, string | string[]>;
    _ended: boolean;
  };
}

describe('CSRF Protection', () => {
  // ===========================================================================
  // TOKEN GENERATION
  // ===========================================================================

  describe('generateCSRFToken', () => {
    it('should generate a 64-character hex string', () => {
      const token = generateCSRFToken();

      expect(token).toHaveLength(64); // 32 bytes = 64 hex chars
      expect(token).toMatch(/^[0-9a-f]+$/);
    });

    it('should generate unique tokens', () => {
      const tokens = new Set<string>();

      for (let i = 0; i < 100; i++) {
        tokens.add(generateCSRFToken());
      }

      expect(tokens.size).toBe(100);
    });

    it('should generate cryptographically random tokens', () => {
      const token1 = generateCSRFToken();
      const token2 = generateCSRFToken();

      expect(token1).not.toBe(token2);
    });
  });

  // ===========================================================================
  // TOKEN VALIDATION
  // ===========================================================================

  describe('validateCSRFToken', () => {
    it('should return true when header and cookie match', () => {
      const token = generateCSRFToken();

      const req = createMockRequest({
        headers: { [CSRF_TOKEN_HEADER]: token },
        cookies: { [CSRF_TOKEN_COOKIE]: token },
      });

      expect(validateCSRFToken(req)).toBe(true);
    });

    it('should return false when tokens do not match', () => {
      const req = createMockRequest({
        headers: { [CSRF_TOKEN_HEADER]: 'token-from-header' },
        cookies: { [CSRF_TOKEN_COOKIE]: 'different-token-in-cookie' },
      });

      expect(validateCSRFToken(req)).toBe(false);
    });

    it('should return false when header token is missing', () => {
      const token = generateCSRFToken();

      const req = createMockRequest({
        cookies: { [CSRF_TOKEN_COOKIE]: token },
      });

      expect(validateCSRFToken(req)).toBe(false);
    });

    it('should return false when cookie token is missing', () => {
      const token = generateCSRFToken();

      const req = createMockRequest({
        headers: { [CSRF_TOKEN_HEADER]: token },
      });

      expect(validateCSRFToken(req)).toBe(false);
    });

    it('should return false when both tokens are missing', () => {
      const req = createMockRequest();

      expect(validateCSRFToken(req)).toBe(false);
    });

    it('should return false when header token is empty', () => {
      const token = generateCSRFToken();

      const req = createMockRequest({
        headers: { [CSRF_TOKEN_HEADER]: '' },
        cookies: { [CSRF_TOKEN_COOKIE]: token },
      });

      expect(validateCSRFToken(req)).toBe(false);
    });

    it('should return false when cookie token is empty', () => {
      const token = generateCSRFToken();

      const req = createMockRequest({
        headers: { [CSRF_TOKEN_HEADER]: token },
        cookies: { [CSRF_TOKEN_COOKIE]: '' },
      });

      expect(validateCSRFToken(req)).toBe(false);
    });

    it('should handle tokens of different lengths', () => {
      const req = createMockRequest({
        headers: { [CSRF_TOKEN_HEADER]: 'short' },
        cookies: { [CSRF_TOKEN_COOKIE]: 'much-longer-token-value' },
      });

      expect(validateCSRFToken(req)).toBe(false);
    });

    it('should be constant-time (no timing leak)', () => {
      const validToken = generateCSRFToken();
      const invalidToken = generateCSRFToken();

      const validReq = createMockRequest({
        headers: { [CSRF_TOKEN_HEADER]: validToken },
        cookies: { [CSRF_TOKEN_COOKIE]: validToken },
      });

      const invalidReq = createMockRequest({
        headers: { [CSRF_TOKEN_HEADER]: invalidToken },
        cookies: { [CSRF_TOKEN_COOKIE]: validToken },
      });

      // Run multiple iterations to measure timing
      const iterations = 100;
      const validTimes: number[] = [];
      const invalidTimes: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startValid = process.hrtime.bigint();
        validateCSRFToken(validReq);
        validTimes.push(Number(process.hrtime.bigint() - startValid));

        const startInvalid = process.hrtime.bigint();
        validateCSRFToken(invalidReq);
        invalidTimes.push(Number(process.hrtime.bigint() - startInvalid));
      }

      // Calculate average times
      const avgValid = validTimes.reduce((a, b) => a + b, 0) / validTimes.length;
      const avgInvalid = invalidTimes.reduce((a, b) => a + b, 0) / invalidTimes.length;

      // The difference should be small (within 100% - allowing for noise)
      const ratio = Math.max(avgValid, avgInvalid) / Math.min(avgValid, avgInvalid);
      expect(ratio).toBeLessThan(2.0);
    });
  });

  // ===========================================================================
  // MIDDLEWARE
  // ===========================================================================

  describe('withCSRFProtection', () => {
    it('should skip validation for GET requests', async () => {
      const handler = jest.fn<(req: NextApiRequest, res: NextApiResponse) => void>();
      const protectedHandler = withCSRFProtection(handler);

      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await protectedHandler(req, res);

      expect(handler).toHaveBeenCalled();
    });

    it('should skip validation for HEAD requests', async () => {
      const handler = jest.fn<(req: NextApiRequest, res: NextApiResponse) => void>();
      const protectedHandler = withCSRFProtection(handler);

      const req = createMockRequest({ method: 'HEAD' });
      const res = createMockResponse();

      await protectedHandler(req, res);

      expect(handler).toHaveBeenCalled();
    });

    it('should skip validation for OPTIONS requests', async () => {
      const handler = jest.fn<(req: NextApiRequest, res: NextApiResponse) => void>();
      const protectedHandler = withCSRFProtection(handler);

      const req = createMockRequest({ method: 'OPTIONS' });
      const res = createMockResponse();

      await protectedHandler(req, res);

      expect(handler).toHaveBeenCalled();
    });

    it('should validate CSRF token for POST requests', async () => {
      const handler = jest.fn<(req: NextApiRequest, res: NextApiResponse) => void>();
      const protectedHandler = withCSRFProtection(handler);

      const token = generateCSRFToken();
      const req = createMockRequest({
        method: 'POST',
        headers: { [CSRF_TOKEN_HEADER]: token },
        cookies: { [CSRF_TOKEN_COOKIE]: token },
      });
      const res = createMockResponse();

      await protectedHandler(req, res);

      expect(handler).toHaveBeenCalled();
    });

    it('should validate CSRF token for PUT requests', async () => {
      const handler = jest.fn<(req: NextApiRequest, res: NextApiResponse) => void>();
      const protectedHandler = withCSRFProtection(handler);

      const token = generateCSRFToken();
      const req = createMockRequest({
        method: 'PUT',
        headers: { [CSRF_TOKEN_HEADER]: token },
        cookies: { [CSRF_TOKEN_COOKIE]: token },
      });
      const res = createMockResponse();

      await protectedHandler(req, res);

      expect(handler).toHaveBeenCalled();
    });

    it('should validate CSRF token for DELETE requests', async () => {
      const handler = jest.fn<(req: NextApiRequest, res: NextApiResponse) => void>();
      const protectedHandler = withCSRFProtection(handler);

      const token = generateCSRFToken();
      const req = createMockRequest({
        method: 'DELETE',
        headers: { [CSRF_TOKEN_HEADER]: token },
        cookies: { [CSRF_TOKEN_COOKIE]: token },
      });
      const res = createMockResponse();

      await protectedHandler(req, res);

      expect(handler).toHaveBeenCalled();
    });

    it('should return 403 for invalid CSRF token', async () => {
      const handler = jest.fn<(req: NextApiRequest, res: NextApiResponse) => void>();
      const protectedHandler = withCSRFProtection(handler);

      const req = createMockRequest({
        method: 'POST',
        headers: { [CSRF_TOKEN_HEADER]: 'invalid-token' },
        cookies: { [CSRF_TOKEN_COOKIE]: 'different-token' },
      });
      const res = createMockResponse();

      await protectedHandler(req, res);

      expect(res._status).toBe(403);
      expect((res._json as Record<string, unknown>).error).toBe('CSRF_TOKEN_INVALID');
      expect(handler).not.toHaveBeenCalled();
    });

    it('should return 403 for missing CSRF token', async () => {
      const handler = jest.fn<(req: NextApiRequest, res: NextApiResponse) => void>();
      const protectedHandler = withCSRFProtection(handler);

      const req = createMockRequest({ method: 'POST' });
      const res = createMockResponse();

      await protectedHandler(req, res);

      expect(res._status).toBe(403);
      expect(handler).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // COOKIE MANAGEMENT
  // ===========================================================================

  describe('setCSRFTokenCookie', () => {
    it('should set cookie with correct attributes', () => {
      const res = createMockResponse();
      const token = generateCSRFToken();

      setCSRFTokenCookie(res, token);

      const cookieHeader = res._headers['Set-Cookie'] as string[];
      expect(cookieHeader).toBeDefined();
      expect(cookieHeader[0]).toContain(`${CSRF_TOKEN_COOKIE}=${token}`);
      expect(cookieHeader[0]).toContain('HttpOnly');
      expect(cookieHeader[0]).toContain('Secure');
      expect(cookieHeader[0]).toContain('SameSite=Strict');
      expect(cookieHeader[0]).toContain('Path=/');
      expect(cookieHeader[0]).toContain('Max-Age=3600');
    });
  });

  describe('getCSRFTokenFromCookie', () => {
    it('should return token from cookie', () => {
      const token = generateCSRFToken();
      const req = createMockRequest({
        cookies: { [CSRF_TOKEN_COOKIE]: token },
      });

      expect(getCSRFTokenFromCookie(req)).toBe(token);
    });

    it('should return undefined when cookie is missing', () => {
      const req = createMockRequest();

      expect(getCSRFTokenFromCookie(req)).toBeUndefined();
    });
  });

  // ===========================================================================
  // ALIAS FUNCTION
  // ===========================================================================

  describe('verifyCsrfToken', () => {
    it('should be an alias for validateCSRFToken', () => {
      const token = generateCSRFToken();

      const validReq = createMockRequest({
        headers: { [CSRF_TOKEN_HEADER]: token },
        cookies: { [CSRF_TOKEN_COOKIE]: token },
      });

      const invalidReq = createMockRequest({
        headers: { [CSRF_TOKEN_HEADER]: 'invalid' },
        cookies: { [CSRF_TOKEN_COOKIE]: token },
      });

      expect(verifyCsrfToken(validReq)).toBe(validateCSRFToken(validReq));
      expect(verifyCsrfToken(invalidReq)).toBe(validateCSRFToken(invalidReq));
    });
  });

  // ===========================================================================
  // TOKEN ENDPOINT HANDLER
  // ===========================================================================

  describe('getCSRFTokenHandler', () => {
    it('should return 405 for non-GET requests', async () => {
      const req = createMockRequest({ method: 'POST' });
      const res = createMockResponse();

      await getCSRFTokenHandler(req, res);

      expect(res._status).toBe(405);
      expect((res._json as Record<string, unknown>).error).toBe('Method not allowed');
    });

    it('should generate and return token for GET requests', async () => {
      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await getCSRFTokenHandler(req, res);

      expect(res._status).toBe(200);
      expect((res._json as Record<string, string>).csrfToken).toBeDefined();
      expect((res._json as Record<string, string>).csrfToken).toHaveLength(64);
    });

    it('should set cookie when returning token', async () => {
      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await getCSRFTokenHandler(req, res);

      const cookieHeader = res._headers['Set-Cookie'] as string[];
      expect(cookieHeader).toBeDefined();
      expect(cookieHeader[0]).toContain(CSRF_TOKEN_COOKIE);
    });

    it('should return same token in response and cookie', async () => {
      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await getCSRFTokenHandler(req, res);

      const responseToken = (res._json as Record<string, string>).csrfToken;
      const cookieHeader = res._headers['Set-Cookie'] as string[];

      expect(cookieHeader[0]).toContain(responseToken);
    });
  });
});
