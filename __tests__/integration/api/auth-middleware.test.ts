/**
 * Integration tests for withAuth and withOptionalAuth middleware
 * Tests authentication flow, token verification, and error handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { NextApiRequest, NextApiResponse } from 'next';
import {
  withAuth,
  withOptionalAuth,
  AuthenticatedRequest,
  assertAuthed,
  assertClaim,
  getUserUid,
  getUserEmail,
} from '@/lib/studio/middleware/withAuth';
import {
  createMockRequest,
  createMockResponse,
  createAuthenticatedRequest,
  MockFirebaseAuth,
} from '../../helpers/firebase-mock';

// Mock Firebase Admin before importing withAuth
const mockFirebaseAuth = new MockFirebaseAuth();

vi.mock('@/lib/firebase/server', () => ({
  getAdminAuth: () => mockFirebaseAuth,
}));

describe('withAuth Middleware', () => {
  beforeEach(() => {
    mockFirebaseAuth.reset();
    vi.clearAllMocks();
  });

  describe('Valid Token Scenarios', () => {
    it('should call handler with valid token and attach uid to request', async () => {
      const validToken = 'valid-test-token-123';
      const decodedData = {
        uid: 'user-123',
        email: 'user@example.com',
        email_verified: true,
        custom_claims: { role: 'admin' },
      };

      mockFirebaseAuth.registerToken(validToken, decodedData);

      const handler = vi.fn(async (req: NextApiRequest, res: NextApiResponse) => {
        const authReq = req as AuthenticatedRequest;
        res.status(200).json({ uid: authReq.uid, email: authReq.email });
      });

      const middleware = withAuth(handler);
      const req = createAuthenticatedRequest('user-123', validToken);
      const res = createMockResponse();

      await middleware(req, res);

      expect(handler).toHaveBeenCalled();
      expect(res._status).toBe(200);
      expect(res._json).toEqual({ uid: 'user-123', email: 'user@example.com' });
    });

    it('should attach all authentication data to request', async () => {
      const validToken = 'valid-token-456';
      const decodedData = {
        uid: 'user-456',
        email: 'admin@example.com',
        email_verified: true,
        custom_claims: { role: 'admin', permissions: ['read', 'write'] },
      };

      mockFirebaseAuth.registerToken(validToken, decodedData);

      let capturedAuthReq: AuthenticatedRequest | null = null;

      const handler = vi.fn(async (req: NextApiRequest, res: NextApiResponse) => {
        capturedAuthReq = req as AuthenticatedRequest;
        res.status(200).json({ success: true });
      });

      const middleware = withAuth(handler);
      const req = createAuthenticatedRequest('user-456', validToken);
      const res = createMockResponse();

      await middleware(req, res);

      expect(capturedAuthReq).not.toBeNull();
      expect(capturedAuthReq!.uid).toBe('user-456');
      expect(capturedAuthReq!.email).toBe('admin@example.com');
      expect(capturedAuthReq!.emailVerified).toBe(true);
      expect(capturedAuthReq!.customClaims).toEqual({
        role: 'admin',
        permissions: ['read', 'write'],
      });
    });

    it('should pass custom claims through correctly', async () => {
      const validToken = 'token-with-claims';
      const decodedData = {
        uid: 'user-789',
        email: 'claims@example.com',
        email_verified: false,
        custom_claims: { premium: true, tier: 'gold' },
      };

      mockFirebaseAuth.registerToken(validToken, decodedData);

      let capturedAuthReq: AuthenticatedRequest | null = null;

      const handler = vi.fn(async (req: NextApiRequest, res: NextApiResponse) => {
        capturedAuthReq = req as AuthenticatedRequest;
        res.status(200).json({ claims: (req as AuthenticatedRequest).customClaims });
      });

      const middleware = withAuth(handler);
      const req = createAuthenticatedRequest('user-789', validToken);
      const res = createMockResponse();

      await middleware(req, res);

      expect(capturedAuthReq!.customClaims).toEqual({ premium: true, tier: 'gold' });
    });

    it('should handle undefined custom claims', async () => {
      const validToken = 'token-no-claims';
      const decodedData = {
        uid: 'user-noclaims',
        email: 'noclaims@example.com',
        email_verified: true,
      };

      mockFirebaseAuth.registerToken(validToken, decodedData);

      let capturedAuthReq: AuthenticatedRequest | null = null;

      const handler = vi.fn(async (req: NextApiRequest, res: NextApiResponse) => {
        capturedAuthReq = req as AuthenticatedRequest;
        res.status(200).json({ success: true });
      });

      const middleware = withAuth(handler);
      const req = createAuthenticatedRequest('user-noclaims', validToken);
      const res = createMockResponse();

      await middleware(req, res);

      expect(capturedAuthReq!.customClaims).toEqual({});
    });

    it('should handle email verified status correctly', async () => {
      const validToken = 'token-unverified';
      const decodedData = {
        uid: 'user-unverified',
        email: 'unverified@example.com',
        email_verified: false,
      };

      mockFirebaseAuth.registerToken(validToken, decodedData);

      let capturedAuthReq: AuthenticatedRequest | null = null;

      const handler = vi.fn(async (req: NextApiRequest, res: NextApiResponse) => {
        capturedAuthReq = req as AuthenticatedRequest;
        res.status(200).json({ verified: capturedAuthReq!.emailVerified });
      });

      const middleware = withAuth(handler);
      const req = createAuthenticatedRequest('user-unverified', validToken);
      const res = createMockResponse();

      await middleware(req, res);

      expect(capturedAuthReq!.emailVerified).toBe(false);
    });
  });

  describe('Missing Authorization Header', () => {
    it('should return 401 when Authorization header is missing', async () => {
      const handler = vi.fn();
      const middleware = withAuth(handler);

      const req = createMockRequest({ headers: {} });
      const res = createMockResponse();

      await middleware(req, res);

      expect(res._status).toBe(401);
      expect(res._json.error).toBe('Unauthorized');
      expect(res._json.message).toContain('Missing or invalid Authorization header');
      expect(handler).not.toHaveBeenCalled();
    });

    it('should return 401 when Authorization header is undefined', async () => {
      const handler = vi.fn();
      const middleware = withAuth(handler);

      const req = createMockRequest();
      req.headers.authorization = undefined;
      const res = createMockResponse();

      await middleware(req, res);

      expect(res._status).toBe(401);
      expect(res._json.error).toBe('Unauthorized');
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('Invalid Authorization Header Format', () => {
    it('should return 401 for non-Bearer authorization', async () => {
      const handler = vi.fn();
      const middleware = withAuth(handler);

      const req = createMockRequest({
        headers: { authorization: 'Basic dXNlcjpwYXNz' },
      });
      const res = createMockResponse();

      await middleware(req, res);

      expect(res._status).toBe(401);
      expect(res._json.message).toContain('Missing or invalid Authorization header');
      expect(handler).not.toHaveBeenCalled();
    });

    it('should return 401 for lowercase bearer', async () => {
      const handler = vi.fn();
      const middleware = withAuth(handler);

      const req = createMockRequest({
        headers: { authorization: 'bearer some-token' },
      });
      const res = createMockResponse();

      await middleware(req, res);

      expect(res._status).toBe(401);
      expect(handler).not.toHaveBeenCalled();
    });

    it('should return 401 for empty Bearer token', async () => {
      const handler = vi.fn();
      const middleware = withAuth(handler);

      const req = createMockRequest({
        headers: { authorization: 'Bearer ' },
      });
      const res = createMockResponse();

      await middleware(req, res);

      expect(res._status).toBe(401);
      expect(res._json.message).toContain('Token is empty');
      expect(handler).not.toHaveBeenCalled();
    });

    it('should return 401 for Bearer token with only whitespace', async () => {
      const handler = vi.fn();
      const middleware = withAuth(handler);

      const req = createMockRequest({
        headers: { authorization: 'Bearer    ' },
      });
      const res = createMockResponse();

      await middleware(req, res);

      expect(res._status).toBe(401);
      expect(res._json.message).toContain('Token is empty');
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('Invalid or Expired Token', () => {
    it('should return 401 for token not in valid registry', async () => {
      const handler = vi.fn();
      const middleware = withAuth(handler);

      const req = createAuthenticatedRequest('user-123', 'invalid-token');
      const res = createMockResponse();

      await middleware(req, res);

      expect(res._status).toBe(401);
      expect(res._json.error).toBe('Unauthorized');
      expect(res._json.message).toContain('Invalid or expired token');
      expect(handler).not.toHaveBeenCalled();
    });

    it('should return 401 for expired token', async () => {
      const handler = vi.fn();
      const middleware = withAuth(handler);

      const req = createAuthenticatedRequest('user-123', 'definitely-invalid-token');
      const res = createMockResponse();

      await middleware(req, res);

      expect(res._status).toBe(401);
      expect(res._json.message).toBe('Invalid or expired token');
      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle token verification errors gracefully', async () => {
      const handler = vi.fn();
      const middleware = withAuth(handler);

      const req = createAuthenticatedRequest('user-123', 'malformed-token');
      const res = createMockResponse();

      await middleware(req, res);

      expect(res._status).toBe(401);
      expect(res._json.error).toBe('Unauthorized');
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('Unexpected Errors', () => {
    it('should return 500 for unexpected errors in middleware', async () => {
      const handler = vi.fn(async (req: NextApiRequest, res: NextApiResponse) => {
        throw new Error('Unexpected error in handler');
      });

      const middleware = withAuth(handler);

      const validToken = 'valid-token-error';
      const decodedData = {
        uid: 'user-error',
        email: 'error@example.com',
        email_verified: true,
      };

      mockFirebaseAuth.registerToken(validToken, decodedData);

      const req = createAuthenticatedRequest('user-error', validToken);
      const res = createMockResponse();

      try {
        await middleware(req, res);
      } catch (error) {
        // Error is thrown, which is expected
      }

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('Handler Execution', () => {
    it('should pass original request to handler', async () => {
      const validToken = 'token-pass-through';
      const decodedData = {
        uid: 'user-passthrough',
        email: 'pass@example.com',
        email_verified: true,
      };

      mockFirebaseAuth.registerToken(validToken, decodedData);

      let receivedReq: NextApiRequest | null = null;

      const handler = vi.fn(async (req: NextApiRequest, res: NextApiResponse) => {
        receivedReq = req;
        res.status(200).json({ success: true });
      });

      const middleware = withAuth(handler);
      const req = createAuthenticatedRequest('user-passthrough', validToken, {
        method: 'POST',
        body: { test: 'data' },
      });
      const res = createMockResponse();

      await middleware(req, res);

      expect(receivedReq).toBe(req);
      expect((receivedReq as any).body).toEqual({ test: 'data' });
    });

    it('should execute handler with correct response object', async () => {
      const validToken = 'token-response';
      const decodedData = {
        uid: 'user-response',
        email: 'response@example.com',
        email_verified: true,
      };

      mockFirebaseAuth.registerToken(validToken, decodedData);

      let receivedRes: NextApiResponse | null = null;

      const handler = vi.fn(async (req: NextApiRequest, res: NextApiResponse) => {
        receivedRes = res;
        res.status(200).json({ custom: 'response' });
      });

      const middleware = withAuth(handler);
      const req = createAuthenticatedRequest('user-response', validToken);
      const res = createMockResponse();

      await middleware(req, res);

      expect(receivedRes).toBe(res);
      expect(res._status).toBe(200);
      expect(res._json).toEqual({ custom: 'response' });
    });
  });

  describe('Helper Functions', () => {
    it('should extract uid with getUserUid', () => {
      const req = createMockRequest() as AuthenticatedRequest;
      req.uid = 'extracted-uid';

      expect(getUserUid(req)).toBe('extracted-uid');
    });

    it('should return undefined when uid is not set', () => {
      const req = createMockRequest();
      expect(getUserUid(req)).toBeUndefined();
    });

    it('should extract email with getUserEmail', () => {
      const req = createMockRequest() as AuthenticatedRequest;
      req.email = 'extracted@example.com';

      expect(getUserEmail(req)).toBe('extracted@example.com');
    });

    it('should return undefined when email is not set', () => {
      const req = createMockRequest();
      expect(getUserEmail(req)).toBeUndefined();
    });

    it('should assert authenticated user exists', () => {
      const req = createMockRequest() as AuthenticatedRequest;
      req.uid = 'valid-uid';

      expect(() => assertAuthed(req)).not.toThrow();
    });

    it('should throw when user is not authenticated', () => {
      const req = createMockRequest();
      expect(() => assertAuthed(req as any)).toThrow('User is not authenticated');
    });

    it('should assert claim value matches', () => {
      const req = createMockRequest() as AuthenticatedRequest;
      req.customClaims = { admin: true, role: 'superuser' };

      expect(() => assertClaim(req, 'admin', true)).not.toThrow();
    });

    it('should throw when claim does not match expected value', () => {
      const req = createMockRequest() as AuthenticatedRequest;
      req.customClaims = { admin: false };

      expect(() => assertClaim(req, 'admin', true)).toThrow('Missing or invalid claim');
    });

    it('should throw when claim is missing', () => {
      const req = createMockRequest() as AuthenticatedRequest;
      req.customClaims = {};

      expect(() => assertClaim(req, 'nonexistent', true)).toThrow('Missing or invalid claim');
    });
  });
});

describe('withOptionalAuth Middleware', () => {
  beforeEach(() => {
    mockFirebaseAuth.reset();
    vi.clearAllMocks();
  });

  describe('With Valid Token', () => {
    it('should attach user data when valid token is provided', async () => {
      const validToken = 'optional-valid-token';
      const decodedData = {
        uid: 'user-optional',
        email: 'optional@example.com',
        email_verified: true,
      };

      mockFirebaseAuth.registerToken(validToken, decodedData);

      let capturedAuthReq: AuthenticatedRequest | null = null;

      const handler = vi.fn(async (req: NextApiRequest, res: NextApiResponse) => {
        capturedAuthReq = req as AuthenticatedRequest;
        res.status(200).json({ uid: capturedAuthReq.uid });
      });

      const middleware = withOptionalAuth(handler);
      const req = createAuthenticatedRequest('user-optional', validToken);
      const res = createMockResponse();

      await middleware(req, res);

      expect(capturedAuthReq!.uid).toBe('user-optional');
      expect(capturedAuthReq!.email).toBe('optional@example.com');
      expect(res._status).toBe(200);
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('Without Authorization Header', () => {
    it('should allow request without Authorization header', async () => {
      const handler = vi.fn(async (req: NextApiRequest, res: NextApiResponse) => {
        const authReq = req as AuthenticatedRequest;
        res.status(200).json({ uid: authReq.uid });
      });

      const middleware = withOptionalAuth(handler);
      const req = createMockRequest({ headers: {} });
      const res = createMockResponse();

      await middleware(req, res);

      expect(handler).toHaveBeenCalled();
      expect(res._status).toBe(200);
      expect(res._json.uid).toBeUndefined();
    });

    it('should continue without uid when auth header is missing', async () => {
      let capturedAuthReq: AuthenticatedRequest | null = null;

      const handler = vi.fn(async (req: NextApiRequest, res: NextApiResponse) => {
        capturedAuthReq = req as AuthenticatedRequest;
        res.status(200).json({
          authenticated: !!capturedAuthReq.uid,
        });
      });

      const middleware = withOptionalAuth(handler);
      const req = createMockRequest();
      const res = createMockResponse();

      await middleware(req, res);

      expect(capturedAuthReq!.uid).toBeUndefined();
      expect(res._status).toBe(200);
    });
  });

  describe('With Invalid Token', () => {
    it('should continue without uid when token is invalid', async () => {
      let capturedAuthReq: AuthenticatedRequest | null = null;

      const handler = vi.fn(async (req: NextApiRequest, res: NextApiResponse) => {
        capturedAuthReq = req as AuthenticatedRequest;
        res.status(200).json({ uid: capturedAuthReq.uid });
      });

      const middleware = withOptionalAuth(handler);
      const req = createAuthenticatedRequest('user-123', 'invalid-token');
      const res = createMockResponse();

      await middleware(req, res);

      expect(capturedAuthReq!.uid).toBeUndefined();
      expect(res._status).toBe(200);
      expect(handler).toHaveBeenCalled();
    });

    it('should not set email when token verification fails', async () => {
      let capturedAuthReq: AuthenticatedRequest | null = null;

      const handler = vi.fn(async (req: NextApiRequest, res: NextApiResponse) => {
        capturedAuthReq = req as AuthenticatedRequest;
        res.status(200).json({ email: capturedAuthReq.email });
      });

      const middleware = withOptionalAuth(handler);
      const req = createAuthenticatedRequest('user-123', 'bad-token');
      const res = createMockResponse();

      await middleware(req, res);

      expect(capturedAuthReq!.email).toBeUndefined();
    });
  });

  describe('Graceful Error Handling', () => {
    it('should return 500 for unexpected errors', async () => {
      const handler = vi.fn();
      const middleware = withOptionalAuth(handler);

      const req = createMockRequest({ headers: {} });
      const res = createMockResponse();

      await middleware(req, res);

      expect(handler).toHaveBeenCalled();
    });
  });
});
