/**
 * Audit Types — Unit Tests
 *
 * Validates type definitions, constants, and type shapes.
 *
 * @phase 38
 */

import { describe, it, expect } from 'vitest';
import {
  AUDIT_ACTIONS,
  type AuditCategory,
  type AuditSeverity,
  type AuditEntry,
  type CreateAuditInput,
  type AuditQuery,
  type AuditQueryResult,
} from '@/lib/studio/audit/types';

describe('AUDIT_ACTIONS', () => {
  it('contains auth actions', () => {
    expect(AUDIT_ACTIONS.AUTH_LOGIN).toBe('auth.login');
    expect(AUDIT_ACTIONS.AUTH_LOGOUT).toBe('auth.logout');
    expect(AUDIT_ACTIONS.AUTH_LOGIN_FAILED).toBe('auth.login_failed');
  });

  it('contains admin actions', () => {
    expect(AUDIT_ACTIONS.ADMIN_GRANT_ROLE).toBe('admin.grant.role');
    expect(AUDIT_ACTIONS.ADMIN_REVOKE_ROLE).toBe('admin.revoke.role');
    expect(AUDIT_ACTIONS.ADMIN_UPDATE_FEATURE_FLAG).toBe('admin.update.feature_flag');
    expect(AUDIT_ACTIONS.ADMIN_VIEW_ACCESS_LOGS).toBe('admin.view.access_logs');
    expect(AUDIT_ACTIONS.ADMIN_VIEW_ANALYTICS).toBe('admin.view.analytics');
    expect(AUDIT_ACTIONS.ADMIN_MANAGE_BUYER).toBe('admin.manage.buyer');
    expect(AUDIT_ACTIONS.ADMIN_ROTATE_API_KEY).toBe('admin.rotate.api_key');
  });

  it('contains content actions', () => {
    expect(AUDIT_ACTIONS.CONTENT_CREATE_POST).toBe('content.create.post');
    expect(AUDIT_ACTIONS.CONTENT_DELETE_POST).toBe('content.delete.post');
    expect(AUDIT_ACTIONS.CONTENT_MODERATE_POST).toBe('content.moderate.post');
    expect(AUDIT_ACTIONS.CONTENT_REPORT_POST).toBe('content.report.post');
  });

  it('contains community actions', () => {
    expect(AUDIT_ACTIONS.COMMUNITY_FOLLOW).toBe('community.follow');
    expect(AUDIT_ACTIONS.COMMUNITY_UNFOLLOW).toBe('community.unfollow');
    expect(AUDIT_ACTIONS.COMMUNITY_LIKE).toBe('community.like');
    expect(AUDIT_ACTIONS.COMMUNITY_UNLIKE).toBe('community.unlike');
    expect(AUDIT_ACTIONS.COMMUNITY_COMMENT).toBe('community.comment');
    expect(AUDIT_ACTIONS.COMMUNITY_DELETE_COMMENT).toBe('community.delete.comment');
    expect(AUDIT_ACTIONS.COMMUNITY_REMIX).toBe('community.remix');
  });

  it('contains security actions', () => {
    expect(AUDIT_ACTIONS.SECURITY_PASSWORD_CHANGE).toBe('security.password_change');
    expect(AUDIT_ACTIONS.SECURITY_2FA_ENABLE).toBe('security.2fa_enable');
    expect(AUDIT_ACTIONS.SECURITY_2FA_DISABLE).toBe('security.2fa_disable');
    expect(AUDIT_ACTIONS.SECURITY_SUSPICIOUS_ACTIVITY).toBe('security.suspicious_activity');
  });

  it('contains system actions', () => {
    expect(AUDIT_ACTIONS.SYSTEM_DEPLOYMENT).toBe('system.deployment');
    expect(AUDIT_ACTIONS.SYSTEM_CRON_RUN).toBe('system.cron_run');
    expect(AUDIT_ACTIONS.SYSTEM_MAINTENANCE).toBe('system.maintenance');
  });

  it('follows the category.verb.target convention', () => {
    const values = Object.values(AUDIT_ACTIONS);
    for (const val of values) {
      expect(val).toMatch(/^[a-z]+\.[a-z0-9_]+/);
    }
  });
});

describe('AuditEntry type shape', () => {
  it('accepts a valid audit entry', () => {
    const entry: AuditEntry = {
      id: 'audit_1234_abc',
      timestamp: Date.now(),
      category: 'admin',
      action: 'admin.update.feature_flag',
      severity: 'info',
      actorId: 'admin-001',
      actorEmail: 'admin@example.com',
      actorIsAdmin: true,
      description: 'Updated feature flag "dark-mode"',
      targetId: 'dark-mode',
      targetType: 'feature_flag',
      success: true,
    };

    expect(entry.id).toBe('audit_1234_abc');
    expect(entry.actorIsAdmin).toBe(true);
    expect(entry.success).toBe(true);
  });

  it('allows optional fields to be omitted', () => {
    const entry: AuditEntry = {
      id: 'audit_5678_def',
      timestamp: Date.now(),
      category: 'auth',
      action: 'auth.login',
      severity: 'info',
      actorId: 'user-123',
      actorIsAdmin: false,
      description: 'User logged in',
      success: true,
    };

    expect(entry.actorEmail).toBeUndefined();
    expect(entry.targetId).toBeUndefined();
    expect(entry.metadata).toBeUndefined();
    expect(entry.ipAddress).toBeUndefined();
  });

  it('accepts metadata as Record<string, unknown>', () => {
    const entry: AuditEntry = {
      id: 'audit_9999_ghi',
      timestamp: Date.now(),
      category: 'content',
      action: 'content.moderate.post',
      severity: 'warning',
      actorId: 'admin-001',
      actorIsAdmin: true,
      description: 'Moderated post',
      targetId: 'post-123',
      targetType: 'post',
      metadata: { reason: 'spam', flagCount: 5, automated: false },
      success: true,
    };

    expect(entry.metadata).toEqual({
      reason: 'spam',
      flagCount: 5,
      automated: false,
    });
  });
});

describe('CreateAuditInput type shape', () => {
  it('omits id and timestamp from AuditEntry', () => {
    const input: CreateAuditInput = {
      category: 'security',
      action: 'security.password_change',
      severity: 'info',
      actorId: 'user-456',
      actorIsAdmin: false,
      description: 'Password changed',
      success: true,
    };

    expect(input).not.toHaveProperty('id');
    expect(input).not.toHaveProperty('timestamp');
  });
});

describe('AuditQuery type shape', () => {
  it('accepts all optional filters', () => {
    const query: AuditQuery = {
      category: 'admin',
      action: 'admin.update.feature_flag',
      severity: 'info',
      actorId: 'admin-001',
      targetId: 'dark-mode',
      targetType: 'feature_flag',
      failedOnly: false,
      startTime: Date.now() - 86400000,
      endTime: Date.now(),
      limit: 50,
      afterId: 'audit_prev_cursor',
    };

    expect(query.category).toBe('admin');
    expect(query.limit).toBe(50);
  });

  it('works with no filters', () => {
    const query: AuditQuery = {};
    expect(query.category).toBeUndefined();
  });
});

describe('AuditQueryResult type shape', () => {
  it('contains entries, hasMore, optional nextCursor and total', () => {
    const result: AuditQueryResult = {
      entries: [],
      hasMore: false,
      nextCursor: undefined,
      total: 0,
    };

    expect(result.entries).toEqual([]);
    expect(result.hasMore).toBe(false);
  });
});
