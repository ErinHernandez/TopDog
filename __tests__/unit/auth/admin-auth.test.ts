/**
 * Admin Authentication & Middleware Tests
 *
 * Tests for verifyAdminAccess, withAdminAuth, verifyUserToken.
 * Covers: custom claims, UID fallback, deprecation logic, error handling.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================================
// MOCKS
// ============================================================================

const { mockLoggerObj } = vi.hoisted(() => ({
  mockLoggerObj: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/Documents/bestball-site/lib/logger/serverLogger', () => ({
  serverLogger: mockLoggerObj,
}));

// Mock firebase-admin
const mockVerifyIdToken = vi.fn();
const mockAuth = vi.fn(() => ({ verifyIdToken: mockVerifyIdToken }));

vi.mock('firebase-admin', () => ({
  default: {
    apps: [{}], // Already initialized
    auth: mockAuth,
    credential: { cert: vi.fn() },
    initializeApp: vi.fn(),
  },
}));

// Mock apiErrorHandler for middleware tests
const mockCreateErrorResponse = vi.fn();
const mockWithErrorHandling = vi.fn();

vi.mock('@/Documents/bestball-site/lib/apiErrorHandler', () => ({
  createErrorResponse: mockCreateErrorResponse,
  ErrorType: { FORBIDDEN: 'FORBIDDEN' },
  withErrorHandling: mockWithErrorHandling,
}));

// ============================================================================
// IMPORTS
// ============================================================================

import { verifyAdminAccess } from '@/Documents/bestball-site/lib/adminAuth';

// ============================================================================
// verifyAdminAccess
// ============================================================================

describe('verifyAdminAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset env vars
    delete process.env.ADMIN_UIDS;
  });

  it('should reject missing authorization header', async () => {
    const result = await verifyAdminAccess(undefined);
    expect(result.isAdmin).toBe(false);
    expect(result.error).toContain('Missing authorization header');
  });

  it('should reject non-Bearer authorization header', async () => {
    const result = await verifyAdminAccess('Basic abc123');
    expect(result.isAdmin).toBe(false);
    expect(result.error).toContain('Missing authorization header');
  });

  it('should reject empty Bearer token', async () => {
    const result = await verifyAdminAccess('Bearer ');
    expect(result.isAdmin).toBe(false);
    expect(result.error).toContain('Invalid authorization header format');
  });

  it('should approve user with admin custom claim', async () => {
    mockVerifyIdToken.mockResolvedValue({
      uid: 'admin_uid_1',
      email: 'admin@topdog.studio',
      admin: true,
    });

    const result = await verifyAdminAccess('Bearer valid_admin_token');
    expect(result.isAdmin).toBe(true);
    expect(result.uid).toBe('admin_uid_1');
    expect(result.email).toBe('admin@topdog.studio');
  });

  it('should reject user without admin claim', async () => {
    mockVerifyIdToken.mockResolvedValue({
      uid: 'regular_user',
      email: 'user@example.com',
    });

    const result = await verifyAdminAccess('Bearer valid_user_token');
    expect(result.isAdmin).toBe(false);
    expect(result.error).toContain('not an admin');
  });

  it('should reject user with admin: false', async () => {
    mockVerifyIdToken.mockResolvedValue({
      uid: 'regular_user',
      email: 'user@example.com',
      admin: false,
    });

    const result = await verifyAdminAccess('Bearer valid_token');
    expect(result.isAdmin).toBe(false);
  });

  it('should handle token verification errors', async () => {
    mockVerifyIdToken.mockRejectedValue(new Error('Token expired'));

    const result = await verifyAdminAccess('Bearer expired_token');
    expect(result.isAdmin).toBe(false);
    expect(result.error).toContain('Invalid or expired token');
  });

  describe('ADMIN_UIDS fallback (deprecated)', () => {
    it('should reject UID-based admin after deprecation date (2026-02-15)', async () => {
      process.env.ADMIN_UIDS = 'uid_fallback_1,uid_fallback_2';
      mockVerifyIdToken.mockResolvedValue({
        uid: 'uid_fallback_1',
        email: 'old-admin@example.com',
        // No admin claim
      });

      const result = await verifyAdminAccess('Bearer valid_token');
      // The deprecation date is 2026-02-15, and we're past it (2026-02-21)
      expect(result.isAdmin).toBe(false);
      expect(result.error).toContain('deprecated');
    });

    it('should reject UID not in ADMIN_UIDS list', async () => {
      process.env.ADMIN_UIDS = 'uid_other';
      mockVerifyIdToken.mockResolvedValue({
        uid: 'uid_not_in_list',
        email: 'user@example.com',
      });

      const result = await verifyAdminAccess('Bearer valid_token');
      expect(result.isAdmin).toBe(false);
    });
  });
});

// ============================================================================
// withAdminAuth middleware
// ============================================================================

describe('withAdminAuth', () => {
  // The middleware wraps withErrorHandling, so we test at the integration boundary
  it('should export withAdminAuth as a function', async () => {
    const { withAdminAuth } = await import('@/Documents/bestball-site/lib/adminMiddleware');
    expect(typeof withAdminAuth).toBe('function');
  });

  it('should return a function when called with a handler', async () => {
    const { withAdminAuth } = await import('@/Documents/bestball-site/lib/adminMiddleware');
    const handler = vi.fn();
    const middleware = withAdminAuth(handler);
    expect(typeof middleware).toBe('function');
  });
});
