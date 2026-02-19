/**
 * Audit Helpers — Unit Tests
 *
 * Tests request context extraction, actor info extraction,
 * and fire-and-forget audit functions.
 *
 * @phase 38
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextApiRequest } from 'next';

// ─── Mocks ──────────────────────────────────────────────────────────────────

const mockRecord = vi.fn().mockResolvedValue(null);

vi.mock('@/lib/studio/audit/auditService', () => ({
  AuditService: {
    record: (...args: unknown[]) => mockRecord(...args),
  },
}));

// Import after mocks
import {
  extractRequestContext,
  extractActorInfo,
  audit,
  auditAdmin,
  auditSecurity,
  auditContent,
  auditSystem,
} from '@/lib/studio/audit/auditHelpers';

// ─── Helpers ────────────────────────────────────────────────────────────────

function createMockReq(overrides: Partial<NextApiRequest> = {}): NextApiRequest {
  return {
    headers: {
      'x-forwarded-for': '1.2.3.4, 5.6.7.8',
      'user-agent': 'Mozilla/5.0 TestAgent',
      ...((overrides as any).headers || {}),
    },
    socket: { remoteAddress: '127.0.0.1' },
    uid: 'user-123',
    email: 'test@example.com',
    customClaims: { admin: false },
    ...overrides,
  } as unknown as NextApiRequest;
}

// ─── Tests ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

describe('extractRequestContext', () => {
  it('extracts IP from x-forwarded-for header (first entry)', () => {
    const req = createMockReq();
    const ctx = extractRequestContext(req);
    expect(ctx.ipAddress).toBe('1.2.3.4');
  });

  it('falls back to socket.remoteAddress when no forwarded header', () => {
    const req = createMockReq({
      headers: { 'user-agent': 'TestAgent' },
    } as any);
    const ctx = extractRequestContext(req);
    expect(ctx.ipAddress).toBe('127.0.0.1');
  });

  it('extracts user agent string', () => {
    const req = createMockReq();
    const ctx = extractRequestContext(req);
    expect(ctx.userAgent).toBe('Mozilla/5.0 TestAgent');
  });

  it('returns undefined userAgent when header is missing', () => {
    const req = createMockReq({
      headers: { 'x-forwarded-for': '1.2.3.4' },
    } as any);
    const ctx = extractRequestContext(req);
    expect(ctx.userAgent).toBeUndefined();
  });
});

describe('extractActorInfo', () => {
  it('extracts actorId from authenticated request', () => {
    const req = createMockReq();
    const info = extractActorInfo(req);
    expect(info.actorId).toBe('user-123');
  });

  it('extracts actorEmail from authenticated request', () => {
    const req = createMockReq();
    const info = extractActorInfo(req);
    expect(info.actorEmail).toBe('test@example.com');
  });

  it('extracts actorIsAdmin flag', () => {
    const req = createMockReq({
      customClaims: { admin: true },
    } as any);
    const info = extractActorInfo(req);
    expect(info.actorIsAdmin).toBe(true);
  });

  it('defaults actorId to "unknown" when uid is missing', () => {
    const req = createMockReq({ uid: undefined } as any);
    const info = extractActorInfo(req);
    expect(info.actorId).toBe('unknown');
  });
});

describe('audit', () => {
  it('records an audit event with request context', async () => {
    const req = createMockReq();

    await audit(req, {
      category: 'auth',
      action: 'auth.login',
      description: 'User logged in',
    });

    expect(mockRecord).toHaveBeenCalledTimes(1);
    expect(mockRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'auth',
        action: 'auth.login',
        actorId: 'user-123',
        actorEmail: 'test@example.com',
        ipAddress: '1.2.3.4',
        success: true,
      }),
    );
  });

  it('defaults severity to info', async () => {
    const req = createMockReq();

    await audit(req, {
      category: 'auth',
      action: 'auth.login',
      description: 'User logged in',
    });

    expect(mockRecord).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'info' }),
    );
  });

  it('passes success=false when specified', async () => {
    const req = createMockReq();

    await audit(req, {
      category: 'auth',
      action: 'auth.login_failed',
      description: 'Login failed',
      success: false,
      errorMessage: 'Invalid credentials',
    });

    expect(mockRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        errorMessage: 'Invalid credentials',
      }),
    );
  });

  it('never throws on AuditService failure', async () => {
    mockRecord.mockRejectedValueOnce(new Error('Firestore down'));

    const req = createMockReq();

    // Should not throw
    await expect(
      audit(req, {
        category: 'auth',
        action: 'auth.login',
        description: 'User logged in',
      }),
    ).resolves.toBeUndefined();
  });
});

describe('auditAdmin', () => {
  it('sets category to admin', async () => {
    const req = createMockReq();

    await auditAdmin(req, {
      action: 'admin.update.feature_flag',
      description: 'Updated flag',
    });

    expect(mockRecord).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'admin' }),
    );
  });

  it('sets severity to critical for grant actions', async () => {
    const req = createMockReq();

    await auditAdmin(req, {
      action: 'admin.grant.role',
      description: 'Granted admin role',
    });

    expect(mockRecord).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'critical' }),
    );
  });

  it('sets severity to critical for revoke actions', async () => {
    const req = createMockReq();

    await auditAdmin(req, {
      action: 'admin.revoke.role',
      description: 'Revoked admin role',
    });

    expect(mockRecord).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'critical' }),
    );
  });

  it('sets severity to info for regular admin actions', async () => {
    const req = createMockReq();

    await auditAdmin(req, {
      action: 'admin.view.analytics',
      description: 'Viewed analytics',
    });

    expect(mockRecord).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'info' }),
    );
  });
});

describe('auditSecurity', () => {
  it('sets category to security with default warning severity', async () => {
    const req = createMockReq();

    await auditSecurity(req, {
      action: 'security.suspicious_activity',
      description: 'Suspicious login detected',
    });

    expect(mockRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'security',
        severity: 'warning',
      }),
    );
  });

  it('allows severity override', async () => {
    const req = createMockReq();

    await auditSecurity(req, {
      action: 'security.password_change',
      description: 'Password changed',
      severity: 'info',
    });

    expect(mockRecord).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'info' }),
    );
  });
});

describe('auditContent', () => {
  it('sets category to content', async () => {
    const req = createMockReq();

    await auditContent(req, {
      action: 'content.create.post',
      description: 'Created post',
      targetId: 'post-1',
      targetType: 'post',
    });

    expect(mockRecord).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'content' }),
    );
  });

  it('sets severity to warning for delete actions', async () => {
    const req = createMockReq();

    await auditContent(req, {
      action: 'content.delete.post',
      description: 'Deleted post',
    });

    expect(mockRecord).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'warning' }),
    );
  });

  it('sets severity to warning for moderate actions', async () => {
    const req = createMockReq();

    await auditContent(req, {
      action: 'content.moderate.post',
      description: 'Moderated post',
    });

    expect(mockRecord).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'warning' }),
    );
  });
});

describe('auditSystem', () => {
  it('records a system event without request context', async () => {
    await auditSystem({
      action: 'system.cron_run',
      description: 'Cron job completed',
    });

    expect(mockRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'system',
        actorId: 'system',
        actorIsAdmin: false,
        severity: 'info',
      }),
    );
  });

  it('never throws on failure', async () => {
    mockRecord.mockRejectedValueOnce(new Error('DB error'));

    await expect(
      auditSystem({
        action: 'system.cron_run',
        description: 'Cron failed',
        success: false,
      }),
    ).resolves.toBeUndefined();
  });
});
