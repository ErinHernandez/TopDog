/**
 * NotificationProvider — React context for real-time notifications.
 *
 * Wraps children with a context that provides:
 * - `notifications` — current page of notifications
 * - `unreadCount` — badge count
 * - `markRead` / `markAllRead` — mark as read
 * - `refresh` — manual refetch
 *
 * Uses Firestore onSnapshot for real-time unread count updates.
 * Full notification list is fetched on demand (when dropdown opens).
 *
 * @module components/notifications/NotificationProvider
 * @phase 37
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { NotificationService } from '@/lib/studio/community/notifications';
import type {
  Notification,
  NotificationQueryResult,
} from '@/lib/studio/community/notifications/types';

// ─── Context Shape ───────────────────────────────────────────────────────────

interface NotificationContextValue {
  /** Current notifications (loaded on demand) */
  notifications: Notification[];

  /** Number of unread notifications */
  unreadCount: number;

  /** Whether notifications are being fetched */
  loading: boolean;

  /** Fetch/refresh the notification list */
  refresh: () => Promise<void>;

  /** Mark a single notification as read */
  markRead: (notificationId: string) => Promise<void>;

  /** Mark all notifications as read */
  markAllRead: () => Promise<void>;

  /** Load more (pagination) */
  loadMore: () => Promise<void>;

  /** Whether there are more notifications to load */
  hasMore: boolean;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);
NotificationContext.displayName = 'NotificationContext';

// ─── Provider ────────────────────────────────────────────────────────────────

interface NotificationProviderProps {
  children: React.ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>();

  // Poll unread count periodically (every 30s when user is active)
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      setNotifications([]);
      return;
    }

    let mounted = true;

    async function fetchUnreadCount() {
      try {
        const count = await NotificationService.getUnreadCount(user!.uid);
        if (mounted) {
          setUnreadCount(count);
        }
      } catch {
        // Silently fail — unread count is non-critical
      }
    }

    // Initial fetch
    fetchUnreadCount();

    // Poll every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30_000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [user]);

  const refresh = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const result: NotificationQueryResult = await NotificationService.query({
        userId: user.uid,
        limit: 30,
      });

      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
      setHasMore(result.hasMore);
      setNextCursor(result.nextCursor);
    } catch (err) {
      console.error('[NotificationProvider] Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadMore = useCallback(async () => {
    if (!user || !hasMore || !nextCursor) return;

    setLoading(true);
    try {
      const result = await NotificationService.query({
        userId: user.uid,
        limit: 30,
        afterId: nextCursor,
      });

      setNotifications((prev) => [...prev, ...result.notifications]);
      setHasMore(result.hasMore);
      setNextCursor(result.nextCursor);
    } catch (err) {
      console.error('[NotificationProvider] Failed to load more notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [user, hasMore, nextCursor]);

  const markRead = useCallback(async (notificationId: string) => {
    try {
      await NotificationService.markRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('[NotificationProvider] Failed to mark read:', err);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    if (!user) return;

    try {
      await NotificationService.markAllRead(user.uid);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('[NotificationProvider] Failed to mark all read:', err);
    }
  }, [user]);

  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications,
      unreadCount,
      loading,
      refresh,
      markRead,
      markAllRead,
      loadMore,
      hasMore,
    }),
    [notifications, unreadCount, loading, refresh, markRead, markAllRead, loadMore, hasMore],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within a <NotificationProvider>.');
  }
  return ctx;
}
