/**
 * Draft API Authentication Tests
 *
 * Validates that /api/draft/submit-pick and /api/draft/validate-pick
 * require Firebase auth tokens and enforce IDOR protection.
 *
 * @module __tests__/unit/api/draft-auth
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================================
// HOISTED MOCKS
// ============================================================================

const { mockVerifyUserToken } = vi.hoisted(() => ({
  mockVerifyUserToken: vi.fn(),
}));

vi.mock('@/Documents/bestball-site/lib/adminAuth', () => ({
  verifyUserToken: (...args: unknown[]) => mockVerifyUserToken(...args),
}));

vi.mock('@/Documents/bestball-site/lib/logger/serverLogger', () => ({
  serverLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@/Documents/bestball-site/lib/firebase', () => ({
  db: null,
}));

vi.mock('@/Documents/bestball-site/lib/integrity', () => ({
  locationIntegrityService: {
    recordPickLocation: vi.fn(),
    cleanupDraftState: vi.fn(),
  },
}));

vi.mock('@/Documents/bestball-site/lib/rateLimiter', () => ({
  RateLimiter: class {
    check() {
      return { allowed: true, remaining: 99, resetAt: Date.now() + 60000 };
    }
  },
}));

vi.mock('@/Documents/bestball-site/lib/validation/draft', () => ({
  submitPickRequestSchema: {
    parse: (body: Record<string, unknown>) => body,
  },
  validatePickRequestSchema: {
    parse: (body: Record<string, unknown>) => body,
  },
}));

vi.mock('@/Documents/bestball-site/lib/apiErrorHandler', () => ({
  withErrorHandling: (_req: unknown, _res: unknown, fn: Function) =>
    fn(_req, _res, {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    }),
  validateMethod: vi.fn(),
  createSuccessResponse: vi.fn((body: unknown, status: number) => ({ statusCode: status, body })),
  createErrorResponse: vi.fn(
    (_type: string, msg: string, _ctx: unknown, _rid: string) => ({
      statusCode: 500,
      body: { error: msg },
    })
  ),
  ErrorType: { CONFIGURATION: 'CONFIGURATION' },
}));

vi.mock('@/Documents/bestball-site/lib/utils/errorSanitizer', () => ({
  sanitizeErrorMessage: (err: unknown) =>
    err instanceof Error ? err.message : String(err),
}));

// ============================================================================
// HELPERS
// ============================================================================

function createMockReq(overrides: Partial<{
  method: string;
  headers: Record<string, string>;
  body: Record<string, unknown>;
  query: Record<string, string>;
  socket: { remoteAddress: string };
}> = {}) {
  return {
    method: 'POST',
    headers: {},
    body: {},
    query: {},
    socket: { remoteAddress: '127.0.0.1' },
    ...overrides,
  } as any;
}

function createMockRes() {
  const res: any = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    setHeader: vi.fn().mockReturnThis(),
    getHeader: vi.fn().mockReturnValue('test-request-id'),
  };
  return res;
}

// ============================================================================
// TESTS — submit-pick
// ============================================================================

describe('Draft Submit-Pick Auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should reject request with no Authorization header', async () => {
    const { default: handler } = await import(
      '@/Documents/bestball-site/pages/api/draft/submit-pick'
    );

    const req = createMockReq({ method: 'POST', body: { roomId: 'r1', userId: 'u1', playerId: 'p1' } });
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'AUTH_REQUIRED' }),
      })
    );
    expect(mockVerifyUserToken).not.toHaveBeenCalled();
  });

  it('should reject request with invalid token', async () => {
    mockVerifyUserToken.mockResolvedValue({
      authenticated: false,
      error: 'Invalid or expired token',
    });

    const { default: handler } = await import(
      '@/Documents/bestball-site/pages/api/draft/submit-pick'
    );

    const req = createMockReq({
      method: 'POST',
      headers: { authorization: 'Bearer bad-token' },
      body: { roomId: 'r1', userId: 'u1', playerId: 'p1' },
    });
    const res = createMockRes();

    await handler(req, res);

    expect(mockVerifyUserToken).toHaveBeenCalledWith('bad-token');
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'AUTH_FAILED' }),
      })
    );
  });

  it('should reject when authenticated uid does not match body userId (IDOR)', async () => {
    mockVerifyUserToken.mockResolvedValue({
      authenticated: true,
      uid: 'real-user-123',
      email: 'real@test.com',
    });

    const { default: handler } = await import(
      '@/Documents/bestball-site/pages/api/draft/submit-pick'
    );

    const req = createMockReq({
      method: 'POST',
      headers: { authorization: 'Bearer valid-token' },
      body: { roomId: 'r1', userId: 'victim-user-456', playerId: 'p1' },
    });
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'FORBIDDEN' }),
      })
    );
  });

  it('should pass auth when token is valid and uid matches userId', async () => {
    mockVerifyUserToken.mockResolvedValue({
      authenticated: true,
      uid: 'user-123',
      email: 'user@test.com',
    });

    const { default: handler } = await import(
      '@/Documents/bestball-site/pages/api/draft/submit-pick'
    );

    const req = createMockReq({
      method: 'POST',
      headers: { authorization: 'Bearer valid-token' },
      body: { roomId: 'r1', userId: 'user-123', playerId: 'p1' },
    });
    const res = createMockRes();

    await handler(req, res);

    // Auth passes — handler proceeds to DB check (which fails since db is null)
    // The key assertion: it did NOT return 401 or 403
    expect(res.status).not.toHaveBeenCalledWith(401);
    expect(res.status).not.toHaveBeenCalledWith(403);
  });

  it('should reject Bearer token with missing scheme', async () => {
    const { default: handler } = await import(
      '@/Documents/bestball-site/pages/api/draft/submit-pick'
    );

    const req = createMockReq({
      method: 'POST',
      headers: { authorization: 'just-a-raw-token' },
      body: { roomId: 'r1', userId: 'u1', playerId: 'p1' },
    });
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockVerifyUserToken).not.toHaveBeenCalled();
  });
});

// ============================================================================
// TESTS — validate-pick
// ============================================================================

describe('Draft Validate-Pick Auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should reject request with no Authorization header', async () => {
    const { default: handler } = await import(
      '@/Documents/bestball-site/pages/api/draft/validate-pick'
    );

    const req = createMockReq({
      method: 'POST',
      body: { roomId: 'r1', userId: 'u1', playerId: 'p1', pickNumber: 1 },
    });
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        valid: false,
        errorCode: 'AUTH_REQUIRED',
      })
    );
  });

  it('should reject request with invalid token', async () => {
    mockVerifyUserToken.mockResolvedValue({
      authenticated: false,
      error: 'Invalid or expired token',
    });

    const { default: handler } = await import(
      '@/Documents/bestball-site/pages/api/draft/validate-pick'
    );

    const req = createMockReq({
      method: 'POST',
      headers: { authorization: 'Bearer expired-token' },
      body: { roomId: 'r1', userId: 'u1', playerId: 'p1', pickNumber: 1 },
    });
    const res = createMockRes();

    await handler(req, res);

    expect(mockVerifyUserToken).toHaveBeenCalledWith('expired-token');
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        valid: false,
        errorCode: 'AUTH_FAILED',
      })
    );
  });

  it('should reject when authenticated uid does not match body userId (IDOR)', async () => {
    mockVerifyUserToken.mockResolvedValue({
      authenticated: true,
      uid: 'attacker-999',
      email: 'attacker@evil.com',
    });

    const { default: handler } = await import(
      '@/Documents/bestball-site/pages/api/draft/validate-pick'
    );

    const req = createMockReq({
      method: 'POST',
      headers: { authorization: 'Bearer valid-token' },
      body: { roomId: 'r1', userId: 'victim-user-456', playerId: 'p1', pickNumber: 1 },
    });
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        valid: false,
        errorCode: 'FORBIDDEN',
      })
    );
  });

  it('should pass auth when token is valid and uid matches userId', async () => {
    mockVerifyUserToken.mockResolvedValue({
      authenticated: true,
      uid: 'user-123',
      email: 'user@test.com',
    });

    const { default: handler } = await import(
      '@/Documents/bestball-site/pages/api/draft/validate-pick'
    );

    const req = createMockReq({
      method: 'POST',
      headers: { authorization: 'Bearer valid-token' },
      body: { roomId: 'r1', userId: 'user-123', playerId: 'p1', pickNumber: 1 },
    });
    const res = createMockRes();

    await handler(req, res);

    // Auth passes — handler proceeds to DB check (fails since db is null)
    expect(res.status).not.toHaveBeenCalledWith(401);
    expect(res.status).not.toHaveBeenCalledWith(403);
  });

  it('should reject empty Bearer token', async () => {
    const { default: handler } = await import(
      '@/Documents/bestball-site/pages/api/draft/validate-pick'
    );

    const req = createMockReq({
      method: 'POST',
      headers: { authorization: 'Bearer ' },
      body: { roomId: 'r1', userId: 'u1', playerId: 'p1', pickNumber: 1 },
    });
    const res = createMockRes();

    await handler(req, res);

    // Empty string after "Bearer " — verifyUserToken should handle this
    // Either 401 for empty token or verifyUserToken returns not authenticated
    const statusCall = res.status.mock.calls[0]?.[0];
    expect([401, 500]).toContain(statusCall);
  });
});

// ============================================================================
// TESTS — auth flow ordering
// ============================================================================

describe('Draft Auth Flow Ordering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submit-pick: checks auth before database access', async () => {
    const { default: handler } = await import(
      '@/Documents/bestball-site/pages/api/draft/submit-pick'
    );

    const req = createMockReq({
      method: 'POST',
      body: { roomId: 'r1', userId: 'u1', playerId: 'p1' },
    });
    const res = createMockRes();

    await handler(req, res);

    // Should fail at auth (401) before ever touching db
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('validate-pick: checks auth before database access', async () => {
    const { default: handler } = await import(
      '@/Documents/bestball-site/pages/api/draft/validate-pick'
    );

    const req = createMockReq({
      method: 'POST',
      body: { roomId: 'r1', userId: 'u1', playerId: 'p1', pickNumber: 1 },
    });
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('submit-pick: IDOR check happens after auth but before business logic', async () => {
    mockVerifyUserToken.mockResolvedValue({
      authenticated: true,
      uid: 'real-user',
      email: 'real@test.com',
    });

    const { default: handler } = await import(
      '@/Documents/bestball-site/pages/api/draft/submit-pick'
    );

    const req = createMockReq({
      method: 'POST',
      headers: { authorization: 'Bearer valid-token' },
      body: { roomId: 'r1', userId: 'different-user', playerId: 'p1' },
    });
    const res = createMockRes();

    await handler(req, res);

    // Should fail at IDOR (403) — not reach DB
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('validate-pick: IDOR check happens after auth but before business logic', async () => {
    mockVerifyUserToken.mockResolvedValue({
      authenticated: true,
      uid: 'real-user',
      email: 'real@test.com',
    });

    const { default: handler } = await import(
      '@/Documents/bestball-site/pages/api/draft/validate-pick'
    );

    const req = createMockReq({
      method: 'POST',
      headers: { authorization: 'Bearer valid-token' },
      body: { roomId: 'r1', userId: 'different-user', playerId: 'p1', pickNumber: 1 },
    });
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});
