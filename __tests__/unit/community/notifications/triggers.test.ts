/**
 * Notification Triggers — Unit Tests
 *
 * Validates that trigger functions:
 * - Call NotificationService.create with correct inputs
 * - Never throw even when create fails
 * - Truncate comment previews to 120 chars
 *
 * @phase 37
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the NotificationService.create method
const mockCreate = vi.fn();

vi.mock('@/lib/studio/community/notifications/notificationService', () => ({
  NotificationService: {
    create: (...args: unknown[]) => mockCreate(...args),
  },
}));

import {
  notifyFollow,
  notifyLike,
  notifyComment,
  notifyRemix,
} from '@/lib/studio/community/notifications/triggers';

beforeEach(() => {
  vi.clearAllMocks();
  mockCreate.mockResolvedValue({ id: 'notif-1' });
});

describe('notifyFollow', () => {
  it('calls NotificationService.create with follow type', async () => {
    await notifyFollow({
      actorId: 'user-1',
      actorUsername: 'alice',
      actorAvatar: 'https://example.com/alice.png',
      recipientId: 'user-2',
    });

    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientId: 'user-2',
        actorId: 'user-1',
        actorUsername: 'alice',
        actorAvatar: 'https://example.com/alice.png',
        type: 'follow',
        resourceId: 'user-2',
      }),
    );
  });

  it('does not throw when create fails', async () => {
    mockCreate.mockRejectedValueOnce(new Error('Firestore unavailable'));

    await expect(
      notifyFollow({
        actorId: 'user-1',
        actorUsername: 'alice',
        recipientId: 'user-2',
      }),
    ).resolves.toBeUndefined();
  });
});

describe('notifyLike', () => {
  it('calls NotificationService.create with like type and post data', async () => {
    await notifyLike({
      actorId: 'user-1',
      actorUsername: 'alice',
      postOwnerId: 'user-2',
      postId: 'post-1',
      postTitle: 'My Design',
      postThumbnail: 'https://example.com/thumb.png',
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientId: 'user-2',
        actorId: 'user-1',
        type: 'like',
        resourceId: 'post-1',
        resourceTitle: 'My Design',
        resourceThumbnail: 'https://example.com/thumb.png',
      }),
    );
  });

  it('does not throw when create fails', async () => {
    mockCreate.mockRejectedValueOnce(new Error('network error'));

    await expect(
      notifyLike({
        actorId: 'user-1',
        actorUsername: 'alice',
        postOwnerId: 'user-2',
        postId: 'post-1',
      }),
    ).resolves.toBeUndefined();
  });
});

describe('notifyComment', () => {
  it('calls NotificationService.create with comment type and preview', async () => {
    await notifyComment({
      actorId: 'user-1',
      actorUsername: 'alice',
      postOwnerId: 'user-2',
      postId: 'post-1',
      postTitle: 'My Design',
      commentText: 'Great work on this piece!',
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'comment',
        commentPreview: 'Great work on this piece!',
      }),
    );
  });

  it('truncates comment preview to 120 characters', async () => {
    const longComment = 'A'.repeat(200);

    await notifyComment({
      actorId: 'user-1',
      actorUsername: 'alice',
      postOwnerId: 'user-2',
      postId: 'post-1',
      commentText: longComment,
    });

    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.commentPreview).toHaveLength(120);
    expect(callArgs.commentPreview).toBe('A'.repeat(120));
  });

  it('does not throw when create fails', async () => {
    mockCreate.mockRejectedValueOnce(new Error('permission denied'));

    await expect(
      notifyComment({
        actorId: 'user-1',
        actorUsername: 'alice',
        postOwnerId: 'user-2',
        postId: 'post-1',
        commentText: 'Oops',
      }),
    ).resolves.toBeUndefined();
  });
});

describe('notifyRemix', () => {
  it('calls NotificationService.create with remix type', async () => {
    await notifyRemix({
      actorId: 'user-1',
      actorUsername: 'alice',
      originalPostOwnerId: 'user-2',
      originalPostId: 'post-1',
      originalPostTitle: 'Original Design',
      newPostId: 'post-2',
      newPostTitle: 'My Remix',
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientId: 'user-2',
        actorId: 'user-1',
        type: 'remix',
        resourceId: 'post-2',
        resourceTitle: 'My Remix',
      }),
    );
  });

  it('falls back to original title when new title is not provided', async () => {
    await notifyRemix({
      actorId: 'user-1',
      actorUsername: 'alice',
      originalPostOwnerId: 'user-2',
      originalPostId: 'post-1',
      originalPostTitle: 'Original Design',
      newPostId: 'post-2',
    });

    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.resourceTitle).toBe('Original Design');
  });

  it('does not throw when create fails', async () => {
    mockCreate.mockRejectedValueOnce(new Error('quota exceeded'));

    await expect(
      notifyRemix({
        actorId: 'user-1',
        actorUsername: 'alice',
        originalPostOwnerId: 'user-2',
        originalPostId: 'post-1',
        newPostId: 'post-2',
      }),
    ).resolves.toBeUndefined();
  });
});
