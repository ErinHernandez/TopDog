/**
 * NotificationProvider — Stub provider (studio backend removed).
 *
 * Provides the same context shape so consuming components don't break,
 * but all operations are no-ops until a TopDog-native notification
 * backend is wired up.
 *
 * @module components/notifications/NotificationProvider
 */

import React, { createContext, useContext, useMemo } from 'react';

// ─── Stub Types ─────────────────────────────────────────────────────────────

interface Notification {
  id: string;
  read: boolean;
  [key: string]: unknown;
}

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  markRead: (notificationId: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);
NotificationContext.displayName = 'NotificationContext';

// ─── Provider ────────────────────────────────────────────────────────────────

interface NotificationProviderProps {
  children: React.ReactNode;
}

const noop = async () => {};

export function NotificationProvider({ children }: NotificationProviderProps) {
  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications: [],
      unreadCount: 0,
      loading: false,
      refresh: noop,
      markRead: noop,
      markAllRead: noop,
      loadMore: noop,
      hasMore: false,
    }),
    [],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within a <NotificationProvider>.');
  }
  return ctx;
}
