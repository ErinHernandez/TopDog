/**
 * Notification Types — Unit Tests
 *
 * Validates type definitions, default preferences, and type constraints.
 *
 * @phase 37
 */

import { describe, it, expect } from 'vitest';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationType,
  type Notification,
  type NotificationPreferences,
  type CreateNotificationInput,
  type NotificationQuery,
  type NotificationQueryResult,
} from '@/lib/studio/community/notifications/types';

describe('DEFAULT_NOTIFICATION_PREFERENCES', () => {
  it('has master switch enabled', () => {
    expect(DEFAULT_NOTIFICATION_PREFERENCES.enabled).toBe(true);
  });

  it('enables all in-app notification types by default', () => {
    const { inApp } = DEFAULT_NOTIFICATION_PREFERENCES;
    expect(inApp.follow).toBe(true);
    expect(inApp.like).toBe(true);
    expect(inApp.comment).toBe(true);
    expect(inApp.remix).toBe(true);
  });

  it('disables all email notification types by default (opt-in only)', () => {
    const { email } = DEFAULT_NOTIFICATION_PREFERENCES;
    expect(email.follow).toBe(false);
    expect(email.like).toBe(false);
    expect(email.comment).toBe(false);
    expect(email.remix).toBe(false);
  });

  it('contains exactly the four user-to-user notification types', () => {
    const inAppKeys = Object.keys(DEFAULT_NOTIFICATION_PREFERENCES.inApp).sort();
    const emailKeys = Object.keys(DEFAULT_NOTIFICATION_PREFERENCES.email).sort();
    const expected = ['comment', 'follow', 'like', 'remix'];

    expect(inAppKeys).toEqual(expected);
    expect(emailKeys).toEqual(expected);
  });
});

describe('Notification type shape', () => {
  it('accepts a valid notification object', () => {
    const notification: Notification = {
      id: 'notif-001',
      recipientId: 'user-123',
      actorId: 'user-456',
      actorUsername: 'janedoe',
      type: 'like',
      resourceId: 'post-789',
      read: false,
      createdAt: Date.now(),
    };

    expect(notification.id).toBe('notif-001');
    expect(notification.read).toBe(false);
  });

  it('allows optional fields', () => {
    const notification: Notification = {
      id: 'notif-002',
      recipientId: 'user-123',
      actorId: 'user-456',
      actorUsername: 'janedoe',
      actorAvatar: 'https://example.com/avatar.png',
      type: 'comment',
      resourceId: 'post-789',
      resourceTitle: 'My awesome post',
      resourceThumbnail: 'https://example.com/thumb.png',
      commentPreview: 'Great work on this design!',
      read: true,
      createdAt: Date.now(),
    };

    expect(notification.actorAvatar).toBe('https://example.com/avatar.png');
    expect(notification.commentPreview).toBe('Great work on this design!');
  });
});

describe('CreateNotificationInput type shape', () => {
  it('omits id, createdAt, and read from Notification', () => {
    const input: CreateNotificationInput = {
      recipientId: 'user-123',
      actorId: 'user-456',
      actorUsername: 'janedoe',
      type: 'follow',
      resourceId: 'user-123',
    };

    // Should not have id, createdAt, read
    expect(input).not.toHaveProperty('id');
    expect(input).not.toHaveProperty('createdAt');
    expect(input).not.toHaveProperty('read');
  });
});

describe('NotificationQuery type shape', () => {
  it('requires userId, allows optional filters', () => {
    const query: NotificationQuery = {
      userId: 'user-123',
      type: 'comment',
      unreadOnly: true,
      limit: 10,
      afterId: 'notif-050',
    };

    expect(query.userId).toBe('user-123');
    expect(query.limit).toBe(10);
  });

  it('works with only required field', () => {
    const query: NotificationQuery = {
      userId: 'user-123',
    };

    expect(query.userId).toBe('user-123');
    expect(query.type).toBeUndefined();
  });
});

describe('NotificationQueryResult type shape', () => {
  it('contains notifications array, unreadCount, hasMore, optional nextCursor', () => {
    const result: NotificationQueryResult = {
      notifications: [],
      unreadCount: 5,
      hasMore: true,
      nextCursor: 'notif-030',
    };

    expect(result.notifications).toEqual([]);
    expect(result.unreadCount).toBe(5);
    expect(result.hasMore).toBe(true);
    expect(result.nextCursor).toBe('notif-030');
  });
});
