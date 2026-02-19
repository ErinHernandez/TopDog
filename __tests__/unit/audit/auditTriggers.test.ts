/**
 * Audit Triggers — Unit Tests
 *
 * Tests the fire-and-forget trigger functions for admin,
 * auth, content, security, and system events.
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
  auditFeatureFlagUpdate,
  auditRoleChange,
  auditAccessLogView,
  auditAnalyticsView,
  auditBuyerManagement,
  auditLogin,
  auditLogout,
  auditPostCreated,
  auditPostDeleted,
  auditPostModerated,
  auditPasswordChange,
  auditSuspiciousActivity,
  auditCronRun,
  auditDeployment,
} from '@/lib/studio/audit/auditTriggers';

// ─── Helpers ────────────────────────────────────────────────────────────────

function createMockReq(): NextApiRequest {
  return {
    headers: {
      'x-forwarded-for': '10.0.0.1',
      'user-agent': 'TestAgent/1.0',
    },
    socket: { remoteAddress: '127.0.0.1' },
    uid: 'admin-001',
    email: 'admin@idesaign.com',
    customClaims: { admin: true },
  } as unknown as NextApiRequest;
}

// ─── Tests ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Admin triggers', () => {
  it('auditFeatureFlagUpdate records with correct metadata', async () => {
    const req = createMockReq();
    auditFeatureFlagUpdate(req, 'dark-mode', { enabled: true });

    // Allow microtask queue to flush
    await vi.waitFor(() => {
      expect(mockRecord).toHaveBeenCalledTimes(1);
    });

    expect(mockRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'admin',
        action: 'admin.update.feature_flag',
        targetId: 'dark-mode',
        targetType: 'feature_flag',
        metadata: { updates: { enabled: true } },
      }),
    );
  });

  it('auditRoleChange records grant action', async () => {
    const req = createMockReq();
    auditRoleChange(req, 'user-999', 'admin', true);

    await vi.waitFor(() => {
      expect(mockRecord).toHaveBeenCalledTimes(1);
    });

    expect(mockRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'admin.grant.role',
        targetId: 'user-999',
        metadata: { role: 'admin', granted: true },
      }),
    );
  });

  it('auditRoleChange records revoke action', async () => {
    const req = createMockReq();
    auditRoleChange(req, 'user-999', 'admin', false);

    await vi.waitFor(() => {
      expect(mockRecord).toHaveBeenCalledTimes(1);
    });

    expect(mockRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'admin.revoke.role',
      }),
    );
  });

  it('auditAccessLogView records without filters', async () => {
    const req = createMockReq();
    auditAccessLogView(req);

    await vi.waitFor(() => {
      expect(mockRecord).toHaveBeenCalledTimes(1);
    });

    expect(mockRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'admin.view.access_logs',
      }),
    );
  });

  it('auditAnalyticsView records section metadata', async () => {
    const req = createMockReq();
    auditAnalyticsView(req, 'revenue');

    await vi.waitFor(() => {
      expect(mockRecord).toHaveBeenCalledTimes(1);
    });

    expect(mockRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: { section: 'revenue' },
      }),
    );
  });

  it('auditBuyerManagement records buyer action', async () => {
    const req = createMockReq();
    auditBuyerManagement(req, 'buyer-1', 'Approved', { tier: 'pro' });

    await vi.waitFor(() => {
      expect(mockRecord).toHaveBeenCalledTimes(1);
    });

    expect(mockRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        targetId: 'buyer-1',
        targetType: 'buyer',
        metadata: { tier: 'pro' },
      }),
    );
  });
});

describe('Auth triggers', () => {
  it('auditLogin records successful login', async () => {
    const req = createMockReq();
    auditLogin(req, true);

    await vi.waitFor(() => {
      expect(mockRecord).toHaveBeenCalledTimes(1);
    });

    expect(mockRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'auth',
        action: 'auth.login',
        severity: 'info',
        success: true,
      }),
    );
  });

  it('auditLogin records failed login with warning severity', async () => {
    const req = createMockReq();
    auditLogin(req, false, 'Invalid password');

    await vi.waitFor(() => {
      expect(mockRecord).toHaveBeenCalledTimes(1);
    });

    expect(mockRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'auth.login_failed',
        severity: 'warning',
        success: false,
        errorMessage: 'Invalid password',
      }),
    );
  });

  it('auditLogout records logout', async () => {
    const req = createMockReq();
    auditLogout(req);

    await vi.waitFor(() => {
      expect(mockRecord).toHaveBeenCalledTimes(1);
    });

    expect(mockRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'auth.logout',
      }),
    );
  });
});

describe('Content triggers', () => {
  it('auditPostCreated records post creation', async () => {
    const req = createMockReq();
    auditPostCreated(req, 'post-1', 'My Design');

    await vi.waitFor(() => {
      expect(mockRecord).toHaveBeenCalledTimes(1);
    });

    expect(mockRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'content',
        action: 'content.create.post',
        targetId: 'post-1',
        targetType: 'post',
      }),
    );
  });

  it('auditPostDeleted records with warning severity', async () => {
    const req = createMockReq();
    auditPostDeleted(req, 'post-1', 'Inappropriate content');

    await vi.waitFor(() => {
      expect(mockRecord).toHaveBeenCalledTimes(1);
    });

    expect(mockRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'content.delete.post',
        severity: 'warning',
        metadata: { reason: 'Inappropriate content' },
      }),
    );
  });

  it('auditPostModerated records moderation details', async () => {
    const req = createMockReq();
    auditPostModerated(req, 'post-1', 'hidden', 'Spam');

    await vi.waitFor(() => {
      expect(mockRecord).toHaveBeenCalledTimes(1);
    });

    expect(mockRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'content.moderate.post',
        metadata: { moderationAction: 'hidden', reason: 'Spam' },
      }),
    );
  });
});

describe('Security triggers', () => {
  it('auditPasswordChange records successful change', async () => {
    const req = createMockReq();
    auditPasswordChange(req, true);

    await vi.waitFor(() => {
      expect(mockRecord).toHaveBeenCalledTimes(1);
    });

    expect(mockRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'security',
        action: 'security.password_change',
      }),
    );
  });

  it('auditSuspiciousActivity records with critical severity', async () => {
    const req = createMockReq();
    auditSuspiciousActivity(req, 'Multiple failed logins from new IP', {
      failedAttempts: 5,
    });

    await vi.waitFor(() => {
      expect(mockRecord).toHaveBeenCalledTimes(1);
    });

    expect(mockRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'critical',
        action: 'security.suspicious_activity',
        metadata: { failedAttempts: 5 },
      }),
    );
  });
});

describe('System triggers', () => {
  it('auditCronRun records cron execution', async () => {
    auditCronRun('cleanup-old-files', true, { deletedCount: 42 });

    await vi.waitFor(() => {
      expect(mockRecord).toHaveBeenCalledTimes(1);
    });

    expect(mockRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'system',
        action: 'system.cron_run',
        actorId: 'system',
        metadata: expect.objectContaining({
          jobName: 'cleanup-old-files',
          deletedCount: 42,
        }),
      }),
    );
  });

  it('auditDeployment records deployment event', async () => {
    auditDeployment('v2.1.0', 'production', { commit: 'abc123' });

    await vi.waitFor(() => {
      expect(mockRecord).toHaveBeenCalledTimes(1);
    });

    expect(mockRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'system.deployment',
        metadata: expect.objectContaining({
          version: 'v2.1.0',
          environment: 'production',
          commit: 'abc123',
        }),
      }),
    );
  });
});
