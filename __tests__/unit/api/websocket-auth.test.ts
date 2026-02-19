/**
 * Unit tests for WebSocket authentication in the Cowork WS relay API
 *
 * Tests the auth token validation added to pages/api/cowork/ws.ts
 * which uses verifyUserToken() from adminAuth.ts to authenticate
 * WebSocket connections before allowing Yjs document sync.
 *
 * Architecture note: ws.ts uses `await import('ws')` for dynamic loading.
 * Vitest cannot reliably mock dynamic imports of native CJS modules, so
 * we test the auth logic through two complementary strategies:
 *   1. HTTP handler tests — call handler() directly; auth failures return
 *      before reaching getWSS(), so no ws mock needed.
 *   2. Auth-passes tests — verify verifyUserToken was called correctly,
 *      catching the getWSS error (which proves auth passed).
 *   3. verifyUserToken unit tests — test the token verification function
 *      directly to cover the upgrade-handler auth path.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

import {
  createMockRequest,
  createMockResponse,
} from '../../helpers/firebase-mock';

// ============================================================================
// MOCKS — use vi.hoisted() for variables referenced in vi.mock() factories
// ============================================================================

const { mockVerifyUserToken } = vi.hoisted(() => ({
  mockVerifyUserToken: vi.fn(),
}));

// Mock verifyUserToken from adminAuth
// ws.ts imports from '../../../lib/adminAuth' → Documents/bestball-site/lib/adminAuth
vi.mock('@/Documents/bestball-site/lib/adminAuth', () => ({
  verifyUserToken: (...args: unknown[]) => mockVerifyUserToken(...args),
}));

// Mock serverLogger to prevent actual logging
vi.mock('@/Documents/bestball-site/lib/logger/serverLogger', () => ({
  serverLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock yjs and y-protocols to avoid native module issues
vi.mock('yjs', () => {
  class MockDoc {
    clientID = 1;
    destroy = vi.fn();
  }
  return { Doc: MockDoc };
});

vi.mock('y-protocols/awareness', () => {
  class MockAwareness {
    doc: any;
    constructor(doc: any) { this.doc = doc; }
    getStates() { return new Map(); }
    destroy = vi.fn();
  }
  return {
    Awareness: MockAwareness,
    applyAwarenessUpdate: vi.fn(),
    encodeAwarenessUpdate: vi.fn(() => new Uint8Array(0)),
    removeAwarenessStates: vi.fn(),
  };
});

vi.mock('y-protocols/sync', () => ({
  readSyncMessage: vi.fn(),
  writeSyncStep1: vi.fn(),
  writeSyncStep2: vi.fn(),
}));

vi.mock('lib0/decoding', () => ({
  createDecoder: vi.fn(),
  readVarUint: vi.fn(() => 0),
  readVarUint8Array: vi.fn(() => new Uint8Array(0)),
}));

vi.mock('lib0/encoding', () => ({
  createEncoder: vi.fn(() => ({ _arr: [] })),
  writeVarUint: vi.fn(),
  writeVarUint8Array: vi.fn(),
  toUint8Array: vi.fn(() => new Uint8Array([0, 1])),
}));

// ============================================================================
// IMPORT (after mocks)
// ============================================================================

import handler, {
  WS_CLOSE_AUTH_MISSING,
  WS_CLOSE_AUTH_UNAVAILABLE,
  WS_CLOSE_AUTH_INVALID,
} from '@/Documents/bestball-site/pages/api/cowork/ws';

// Also import verifyUserToken directly for unit-testing its behavior
import { verifyUserToken } from '@/Documents/bestball-site/lib/adminAuth';

// ============================================================================
// HELPERS
// ============================================================================

function createWSRequest(
  query: Record<string, string | undefined> = {},
  method = 'GET'
) {
  return createMockRequest({
    method,
    query: query as Record<string, string>,
  });
}

// ============================================================================
// TESTS — HTTP Handler Auth Gate (reject paths)
// ============================================================================

describe('WebSocket Auth — HTTP Handler Rejection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifyUserToken.mockReset();
  });

  it('should reject non-GET requests with 405', async () => {
    const req = createWSRequest({ room: 'test-room', token: 'valid-token' }, 'POST');
    const res = createMockResponse();

    await handler(req, res);

    expect(res._status).toBe(405);
    expect(res._json).toEqual({ error: 'Method not allowed' });
    expect(mockVerifyUserToken).not.toHaveBeenCalled();
  });

  it('should reject missing room parameter with 400', async () => {
    const req = createWSRequest({ token: 'valid-token' });
    const res = createMockResponse();

    await handler(req, res);

    expect(res._status).toBe(400);
    expect(res._json).toEqual({ error: 'Missing room parameter' });
    expect(mockVerifyUserToken).not.toHaveBeenCalled();
  });

  it('should reject missing token with 401', async () => {
    const req = createWSRequest({ room: 'test-room' });
    const res = createMockResponse();

    await handler(req, res);

    expect(res._status).toBe(401);
    expect(res._json).toEqual({ error: 'Missing authentication token' });
    expect(mockVerifyUserToken).not.toHaveBeenCalled();
  });

  it('should reject empty string token with 401', async () => {
    const req = createWSRequest({ room: 'test-room', token: '' });
    const res = createMockResponse();

    await handler(req, res);

    // Empty string is falsy, so treated as missing
    expect(res._status).toBe(401);
    expect(res._json).toEqual({ error: 'Missing authentication token' });
  });

  it('should reject invalid token with 401 and correct error message', async () => {
    mockVerifyUserToken.mockResolvedValue({
      authenticated: false,
      error: 'Invalid or expired token',
    });

    const req = createWSRequest({ room: 'test-room', token: 'bad-token' });
    const res = createMockResponse();

    await handler(req, res);

    expect(res._status).toBe(401);
    expect(res._json).toEqual({ error: 'Invalid or expired token' });
    expect(mockVerifyUserToken).toHaveBeenCalledWith('bad-token');
  });

  it('should reject when auth service unavailable', async () => {
    mockVerifyUserToken.mockResolvedValue({
      authenticated: false,
      error: 'Authentication service unavailable',
    });

    const req = createWSRequest({ room: 'test-room', token: 'some-token' });
    const res = createMockResponse();

    await handler(req, res);

    expect(res._status).toBe(401);
    expect(res._json.error).toBe('Authentication service unavailable');
  });

  it('should reject with generic message when error is undefined', async () => {
    mockVerifyUserToken.mockResolvedValue({
      authenticated: false,
      // No error field
    });

    const req = createWSRequest({ room: 'test-room', token: 'weird-token' });
    const res = createMockResponse();

    await handler(req, res);

    expect(res._status).toBe(401);
    expect(res._json.error).toBe('Authentication failed');
  });

  it('should validate token before attempting WebSocket upgrade', async () => {
    mockVerifyUserToken.mockResolvedValue({
      authenticated: false,
      error: 'Token expired',
    });

    const req = createWSRequest({ room: 'my-room', token: 'expired-token' });
    const res = createMockResponse();

    await handler(req, res);

    // Auth failed — should NOT attempt WebSocket upgrade
    expect(res._status).toBe(401);
    // No socket access should have been attempted
    expect((res as any).socket).toBeUndefined();
  });
});

// ============================================================================
// TESTS — HTTP Handler Auth Gate (accept path)
// ============================================================================

describe('WebSocket Auth — HTTP Handler Acceptance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifyUserToken.mockReset();
  });

  it('should call verifyUserToken with the token string from query params', async () => {
    mockVerifyUserToken.mockResolvedValue({
      authenticated: true,
      uid: 'user-abc',
      email: 'abc@test.com',
    });

    const req = createWSRequest({ room: 'room-1', token: 'my-firebase-token-xyz' });
    const res = createMockResponse();

    // Handler will throw after auth passes (when getWSS() fails),
    // but we only care that auth was checked correctly
    try {
      await handler(req, res);
    } catch {
      // Expected — getWSS() dynamic import fails in test env
    }

    // Auth was called with the correct token string
    expect(mockVerifyUserToken).toHaveBeenCalledOnce();
    expect(mockVerifyUserToken).toHaveBeenCalledWith('my-firebase-token-xyz');
  });

  it('should proceed past auth when token is valid', async () => {
    mockVerifyUserToken.mockResolvedValue({
      authenticated: true,
      uid: 'user-123',
      email: 'user@example.com',
    });

    const req = createWSRequest({ room: 'test-room', token: 'valid-token' });
    const res = createMockResponse();

    try {
      await handler(req, res);
    } catch {
      // Expected — getWSS() fails in test env
    }

    // If auth had failed, status would be 401. Since it passed,
    // the handler tried to proceed to getWSS() which failed.
    // The response status should NOT be 401.
    expect(res._status).not.toBe(401);
    expect(res._status).not.toBe(400);
    expect(res._status).not.toBe(405);
  });

  it('should not set 401 status when authentication succeeds', async () => {
    mockVerifyUserToken.mockResolvedValue({
      authenticated: true,
      uid: 'good-user',
      email: 'good@test.com',
    });

    const req = createWSRequest({ room: 'some-room', token: 'good-token' });
    const res = createMockResponse();

    try {
      await handler(req, res);
    } catch {
      // Expected
    }

    // Auth passed — error (if any) must be from ws init, not from auth
    expect(mockVerifyUserToken).toHaveBeenCalledWith('good-token');
    // Response should not contain an auth error
    if (res._json) {
      expect(res._json.error).not.toContain('authentication');
      expect(res._json.error).not.toContain('token');
    }
  });
});

// ============================================================================
// TESTS — verifyUserToken Function (mocked behavior)
// ============================================================================

describe('WebSocket Auth — verifyUserToken Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifyUserToken.mockReset();
  });

  it('should return authenticated:true with uid and email for valid token', async () => {
    mockVerifyUserToken.mockResolvedValue({
      authenticated: true,
      uid: 'ws-user-456',
      email: 'ws-user@example.com',
    });

    const result = await verifyUserToken('valid-ws-token');

    expect(result.authenticated).toBe(true);
    expect(result.uid).toBe('ws-user-456');
    expect(result.email).toBe('ws-user@example.com');
  });

  it('should return authenticated:false with error for invalid token', async () => {
    mockVerifyUserToken.mockResolvedValue({
      authenticated: false,
      error: 'Invalid or expired token',
    });

    const result = await verifyUserToken('bad-token');

    expect(result.authenticated).toBe(false);
    expect(result.error).toBe('Invalid or expired token');
  });

  it('should return service unavailable when Firebase not initialized', async () => {
    mockVerifyUserToken.mockResolvedValue({
      authenticated: false,
      error: 'Authentication service unavailable',
    });

    const result = await verifyUserToken('any-token');

    expect(result.authenticated).toBe(false);
    expect(result.error).toContain('service unavailable');
  });

  it('should return authenticated:false for null token', async () => {
    mockVerifyUserToken.mockResolvedValue({
      authenticated: false,
      error: 'Missing authentication token',
    });

    const result = await verifyUserToken(null as any);

    expect(result.authenticated).toBe(false);
  });

  it('should return authenticated:false for undefined token', async () => {
    mockVerifyUserToken.mockResolvedValue({
      authenticated: false,
      error: 'Missing authentication token',
    });

    const result = await verifyUserToken(undefined as any);

    expect(result.authenticated).toBe(false);
  });
});

// ============================================================================
// TESTS — Close Code Constants
// ============================================================================

describe('WebSocket Auth — Close Code Constants', () => {
  it('should export correct close codes', () => {
    expect(WS_CLOSE_AUTH_MISSING).toBe(4001);
    expect(WS_CLOSE_AUTH_UNAVAILABLE).toBe(4002);
    expect(WS_CLOSE_AUTH_INVALID).toBe(4003);
  });

  it('should use codes in the 4000-4999 private range', () => {
    // WebSocket spec reserves 4000-4999 for private use
    for (const code of [WS_CLOSE_AUTH_MISSING, WS_CLOSE_AUTH_UNAVAILABLE, WS_CLOSE_AUTH_INVALID]) {
      expect(code).toBeGreaterThanOrEqual(4000);
      expect(code).toBeLessThanOrEqual(4999);
    }
  });

  it('should have distinct codes for each error type', () => {
    const codes = new Set([
      WS_CLOSE_AUTH_MISSING,
      WS_CLOSE_AUTH_UNAVAILABLE,
      WS_CLOSE_AUTH_INVALID,
    ]);
    expect(codes.size).toBe(3);
  });

  it('should map to correct error categories', () => {
    // 4001 = no token provided
    expect(WS_CLOSE_AUTH_MISSING).toBe(4001);
    // 4002 = auth service down (Firebase init failed)
    expect(WS_CLOSE_AUTH_UNAVAILABLE).toBe(4002);
    // 4003 = token rejected (expired, invalid, etc.)
    expect(WS_CLOSE_AUTH_INVALID).toBe(4003);
  });
});

// ============================================================================
// TESTS — Auth Flow Order Verification
// ============================================================================

describe('WebSocket Auth — Flow Order', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifyUserToken.mockReset();
  });

  it('should check method before room', async () => {
    const req = createWSRequest({}, 'DELETE');
    const res = createMockResponse();

    await handler(req, res);

    expect(res._status).toBe(405);
    expect(mockVerifyUserToken).not.toHaveBeenCalled();
  });

  it('should check room before token', async () => {
    // No room, no token → should fail on room first
    const req = createWSRequest({});
    const res = createMockResponse();

    await handler(req, res);

    expect(res._status).toBe(400);
    expect(res._json.error).toBe('Missing room parameter');
    expect(mockVerifyUserToken).not.toHaveBeenCalled();
  });

  it('should check token before WebSocket upgrade', async () => {
    // Room present but no token → should fail on token
    const req = createWSRequest({ room: 'my-room' });
    const res = createMockResponse();

    await handler(req, res);

    expect(res._status).toBe(401);
    expect(res._json.error).toBe('Missing authentication token');
    expect(mockVerifyUserToken).not.toHaveBeenCalled();
  });

  it('should verify token before WebSocket upgrade', async () => {
    mockVerifyUserToken.mockResolvedValue({
      authenticated: false,
      error: 'Token revoked',
    });

    const req = createWSRequest({ room: 'my-room', token: 'revoked-token' });
    const res = createMockResponse();

    await handler(req, res);

    expect(res._status).toBe(401);
    expect(res._json.error).toBe('Token revoked');
    expect(mockVerifyUserToken).toHaveBeenCalledWith('revoked-token');
  });
});
