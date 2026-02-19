/**
 * NotificationService — Unit Tests
 *
 * Tests CRUD operations, preference checks, self-notification suppression,
 * and batch operations. All Firestore interactions are mocked.
 *
 * @phase 37
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock Firestore primitives ──────────────────────────────────────────────

const mockSetDoc = vi.fn().mockResolvedValue(undefined);
const mockGetDoc = vi.fn();
const mockGetDocs = vi.fn();
const mockUpdateDoc = vi.fn().mockResolvedValue(undefined);
const mockDeleteDoc = vi.fn().mockResolvedValue(undefined);
const mockBatchUpdate = vi.fn();
const mockBatchDelete = vi.fn();
const mockBatchCommit = vi.fn().mockResolvedValue(undefined);
const mockGetCountFromServer = vi.fn();

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((_db: unknown, name: string) => ({ _name: name })),
  doc: vi.fn((...args: unknown[]) => {
    if (args.length === 3) return { id: args[2], path: `${(args[1] as { _name: string })._name}/${args[2]}` };
    return { id: `auto-${Date.now()}`, path: 'user_notifications/auto' };
  }),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  deleteDoc: (...args: unknown[]) => mockDeleteDoc(...args),
  query: vi.fn((_col: unknown, ..._constraints: unknown[]) => ({ _query: true })),
  where: vi.fn((field: string, op: string, val: unknown) => ({ field, op, val })),
  orderBy: vi.fn((field: string, dir: string) => ({ field, dir })),
  limit: vi.fn((n: number) => ({ limit: n })),
  startAfter: vi.fn((snap: unknown) => ({ startAfter: snap })),
  writeBatch: vi.fn(() => ({
    update: mockBatchUpdate,
    delete: mockBatchDelete,
    commit: mockBatchCommit,
  })),
  getCountFromServer: (...args: unknown[]) => mockGetCountFromServer(...args),
}));

vi.mock('@/lib/firebase/client', () => ({
  getFirebaseDb: vi.fn(() => ({})),
}));

// Import AFTER mocks are set up
import { NotificationService } from '@/lib/studio/community/notifications/notificationService';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '@/lib/studio/community/notifications/types';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makePrefsDoc(prefs = DEFAULT_NOTIFICATION_PREFERENCES) {
  return {
    exists: () => true,
    data: () => prefs,
  };
}

function makeNoDoc() {
  return {
    exists: () => false,
    data: () => undefined,
  };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

describe('NotificationService.create', () => {
  it('returns null when actorId equals recipientId (self-notification)', async () => {
    const result = await NotificationService.create({
      recipientId: 'user-1',
      actorId: 'user-1',
      actorUsername: 'me',
      type: 'like',
      resourceId: 'post-1',
    });

    expect(result).toBeNull();
    expect(mockSetDoc).not.toHaveBeenCalled();
  });

  it('returns null when recipient has disabled notifications globally', async () => {
    mockGetDoc.mockResolvedValueOnce(
      makePrefsDoc({ ...DEFAULT_NOTIFICATION_PREFERENCES, enabled: false }),
    );

    const result = await NotificationService.create({
      recipientId: 'user-2',
      actorId: 'user-1',
      actorUsername: 'alice',
      type: 'follow',
      resourceId: 'user-2',
    });

    expect(result).toBeNull();
    expect(mockSetDoc).not.toHaveBeenCalled();
  });

  it('returns null when recipient has disabled this notification type', async () => {
    mockGetDoc.mockResolvedValueOnce(
      makePrefsDoc({
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        inApp: { ...DEFAULT_NOTIFICATION_PREFERENCES.inApp, like: false },
      }),
    );

    const result = await NotificationService.create({
      recipientId: 'user-2',
      actorId: 'user-1',
      actorUsername: 'alice',
      type: 'like',
      resourceId: 'post-1',
    });

    expect(result).toBeNull();
    expect(mockSetDoc).not.toHaveBeenCalled();
  });

  it('creates a notification when preferences allow it', async () => {
    // Return default prefs (all inApp enabled)
    mockGetDoc.mockResolvedValueOnce(makePrefsDoc());

    const result = await NotificationService.create({
      recipientId: 'user-2',
      actorId: 'user-1',
      actorUsername: 'alice',
      type: 'comment',
      resourceId: 'post-1',
      commentPreview: 'Looks great!',
    });

    expect(result).not.toBeNull();
    expect(result!.recipientId).toBe('user-2');
    expect(result!.actorId).toBe('user-1');
    expect(result!.type).toBe('comment');
    expect(result!.read).toBe(false);
    expect(result!.createdAt).toBeGreaterThan(0);
    expect(mockSetDoc).toHaveBeenCalledTimes(1);
  });

  it('creates a notification when no preferences doc exists (defaults apply)', async () => {
    mockGetDoc.mockResolvedValueOnce(makeNoDoc());

    const result = await NotificationService.create({
      recipientId: 'user-2',
      actorId: 'user-1',
      actorUsername: 'alice',
      type: 'follow',
      resourceId: 'user-2',
    });

    expect(result).not.toBeNull();
    expect(result!.type).toBe('follow');
    expect(mockSetDoc).toHaveBeenCalledTimes(1);
  });
});

describe('NotificationService.query', () => {
  it('returns empty result when no notifications exist', async () => {
    mockGetDocs.mockResolvedValueOnce({ docs: [] });
    mockGetCountFromServer.mockResolvedValueOnce({ data: () => ({ count: 0 }) });

    const result = await NotificationService.query({ userId: 'user-1' });

    expect(result.notifications).toEqual([]);
    expect(result.hasMore).toBe(false);
    expect(result.unreadCount).toBe(0);
  });

  it('returns paginated results with hasMore flag', async () => {
    const docs = Array.from({ length: 31 }, (_, i) => ({
      data: () => ({
        id: `notif-${i}`,
        recipientId: 'user-1',
        actorId: 'user-2',
        actorUsername: 'bob',
        type: 'like',
        resourceId: `post-${i}`,
        read: false,
        createdAt: Date.now() - i * 1000,
      }),
    }));

    mockGetDocs.mockResolvedValueOnce({ docs });
    mockGetCountFromServer.mockResolvedValueOnce({ data: () => ({ count: 5 }) });

    const result = await NotificationService.query({ userId: 'user-1', limit: 30 });

    expect(result.notifications).toHaveLength(30);
    expect(result.hasMore).toBe(true);
    expect(result.nextCursor).toBeDefined();
    expect(result.unreadCount).toBe(5);
  });
});

describe('NotificationService.getUnreadCount', () => {
  it('returns the count from Firestore', async () => {
    mockGetCountFromServer.mockResolvedValueOnce({ data: () => ({ count: 7 }) });

    const count = await NotificationService.getUnreadCount('user-1');
    expect(count).toBe(7);
  });

  it('returns 0 when no unread notifications', async () => {
    mockGetCountFromServer.mockResolvedValueOnce({ data: () => ({ count: 0 }) });

    const count = await NotificationService.getUnreadCount('user-1');
    expect(count).toBe(0);
  });
});

describe('NotificationService.markRead', () => {
  it('updates the read field on a single notification', async () => {
    await NotificationService.markRead('notif-1');

    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'notif-1' }),
      { read: true },
    );
  });
});

describe('NotificationService.markAllRead', () => {
  it('batch-updates all unread notifications', async () => {
    const docs = Array.from({ length: 3 }, (_, i) => ({
      ref: { id: `notif-${i}` },
    }));

    mockGetDocs.mockResolvedValueOnce({ docs });

    await NotificationService.markAllRead('user-1');

    expect(mockBatchUpdate).toHaveBeenCalledTimes(3);
    expect(mockBatchCommit).toHaveBeenCalledTimes(1);
  });

  it('handles empty unread set gracefully', async () => {
    mockGetDocs.mockResolvedValueOnce({ docs: [] });

    await NotificationService.markAllRead('user-1');

    expect(mockBatchUpdate).not.toHaveBeenCalled();
    expect(mockBatchCommit).not.toHaveBeenCalled();
  });
});

describe('NotificationService.delete', () => {
  it('deletes a notification by ID', async () => {
    await NotificationService.delete('notif-1');

    expect(mockDeleteDoc).toHaveBeenCalledTimes(1);
    expect(mockDeleteDoc).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'notif-1' }),
    );
  });
});

describe('NotificationService.deleteOlderThan', () => {
  it('deletes old notifications and returns count', async () => {
    const docs = Array.from({ length: 5 }, (_, i) => ({
      ref: { id: `old-notif-${i}` },
    }));

    mockGetDocs.mockResolvedValueOnce({ docs });

    const count = await NotificationService.deleteOlderThan('user-1', 30 * 24 * 60 * 60 * 1000);

    expect(count).toBe(5);
    expect(mockBatchDelete).toHaveBeenCalledTimes(5);
    expect(mockBatchCommit).toHaveBeenCalledTimes(1);
  });

  it('returns 0 when nothing to delete', async () => {
    mockGetDocs.mockResolvedValueOnce({ docs: [] });

    const count = await NotificationService.deleteOlderThan('user-1', 30 * 24 * 60 * 60 * 1000);

    expect(count).toBe(0);
    expect(mockBatchCommit).not.toHaveBeenCalled();
  });
});

describe('NotificationService.getPreferences', () => {
  it('returns saved preferences when they exist', async () => {
    const savedPrefs = {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      email: { ...DEFAULT_NOTIFICATION_PREFERENCES.email, follow: true },
    };

    mockGetDoc.mockResolvedValueOnce(makePrefsDoc(savedPrefs));

    const prefs = await NotificationService.getPreferences('user-1');

    expect(prefs.email.follow).toBe(true);
    expect(prefs.email.like).toBe(false);
  });

  it('returns defaults when no preferences doc exists', async () => {
    mockGetDoc.mockResolvedValueOnce(makeNoDoc());

    const prefs = await NotificationService.getPreferences('user-1');

    expect(prefs).toEqual(DEFAULT_NOTIFICATION_PREFERENCES);
  });
});

describe('NotificationService.setPreferences', () => {
  it('writes preferences to Firestore', async () => {
    await NotificationService.setPreferences('user-1', DEFAULT_NOTIFICATION_PREFERENCES);

    expect(mockSetDoc).toHaveBeenCalledTimes(1);
  });
});

describe('NotificationService.updatePreferences', () => {
  it('merges partial updates with existing preferences', async () => {
    // getPreferences call inside updatePreferences
    mockGetDoc.mockResolvedValueOnce(makePrefsDoc());

    const merged = await NotificationService.updatePreferences('user-1', {
      email: { follow: true, like: false, comment: false, remix: false },
    });

    expect(merged.email.follow).toBe(true);
    expect(merged.inApp.follow).toBe(true); // unchanged
    expect(mockSetDoc).toHaveBeenCalledTimes(1);
  });

  it('can disable master switch', async () => {
    mockGetDoc.mockResolvedValueOnce(makePrefsDoc());

    const merged = await NotificationService.updatePreferences('user-1', {
      enabled: false,
    });

    expect(merged.enabled).toBe(false);
    expect(merged.inApp).toEqual(DEFAULT_NOTIFICATION_PREFERENCES.inApp); // unchanged
  });
});
