/**
 * NotificationDropdown — Dropdown panel showing recent notifications.
 *
 * Renders inside the NotificationBell when open. Shows a scrollable
 * list of notifications with mark-all-read and load-more actions.
 *
 * @module components/notifications/NotificationDropdown
 * @phase 37
 */

import React from 'react';
import Link from 'next/link';
import { useNotifications } from './NotificationProvider';
// Local type stubs (studio backend removed)
type NotificationType = 'follow' | 'like' | 'comment' | 'remix';

interface Notification {
  id: string;
  read: boolean;
  type: NotificationType;
  actorUsername: string;
  actorId: string;
  resourceId?: string;
  resourceTitle?: string;
  commentPreview?: string;
  createdAt: number;
  [key: string]: unknown;
}
import styles from './NotificationDropdown.module.css';

interface NotificationDropdownProps {
  onClose: () => void;
}

export function NotificationDropdown({ onClose }: NotificationDropdownProps): React.ReactElement {
  const { notifications, loading, unreadCount, markRead, markAllRead, loadMore, hasMore } =
    useNotifications();

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markRead(notification.id);
    }
    onClose();
  };

  return (
    <div className={styles.dropdown} role="dialog" aria-label="Notifications">
      {/* Header */}
      <div className={styles.header}>
        <span className={styles.title}>Notifications</span>
        {unreadCount > 0 && (
          <button className={styles.markAllRead} onClick={markAllRead}>
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className={styles.list}>
        {loading && notifications.length === 0 ? (
          <div className={styles.empty}>Loading...</div>
        ) : notifications.length === 0 ? (
          <div className={styles.empty}>No notifications yet</div>
        ) : (
          <>
            {notifications.map(n => (
              <NotificationItem
                key={n.id}
                notification={n}
                onClick={() => handleNotificationClick(n)}
              />
            ))}
            {hasMore && (
              <button className={styles.loadMore} onClick={loadMore} disabled={loading}>
                {loading ? 'Loading...' : 'Load more'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Single Notification Item ────────────────────────────────────────────────

interface NotificationItemProps {
  notification: Notification;
  onClick: () => void;
}

function NotificationItem({ notification, onClick }: NotificationItemProps): React.ReactElement {
  const { type, actorUsername, resourceTitle, commentPreview, read, createdAt } = notification;

  const message = getNotificationMessage(type, actorUsername, resourceTitle, commentPreview);
  const href = getNotificationLink(notification);
  const timeAgo = formatTimeAgo(createdAt);

  const content = (
    <div
      className={`${styles.item} ${read ? '' : styles.unread}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className={styles.iconWrapper}>
        <TypeIcon type={type} />
      </div>
      <div className={styles.content}>
        <p className={styles.message}>{message}</p>
        <span className={styles.time}>{timeAgo}</span>
      </div>
      {!read && <span className={styles.dot} aria-label="Unread" />}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className={styles.link}>
        {content}
      </Link>
    );
  }

  return content;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getNotificationMessage(
  type: NotificationType,
  actor: string,
  title?: string,
  comment?: string,
): string {
  switch (type) {
    case 'follow':
      return `${actor} started following you`;
    case 'like':
      return title
        ? `${actor} liked your post "${truncate(title, 40)}"`
        : `${actor} liked your post`;
    case 'comment':
      return comment
        ? `${actor} commented: "${truncate(comment, 60)}"`
        : `${actor} commented on your post`;
    case 'remix':
      return title
        ? `${actor} remixed your post "${truncate(title, 40)}"`
        : `${actor} remixed your post`;
    default:
      return `${actor} interacted with your content`;
  }
}

function getNotificationLink(notification: Notification): string | null {
  switch (notification.type) {
    case 'follow':
      return `/profile/${notification.actorId}`;
    case 'like':
    case 'comment':
      return `/gallery/${notification.resourceId}`;
    case 'remix':
      return `/gallery/${notification.resourceId}`;
    default:
      return null;
  }
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

// ─── Type Icons ──────────────────────────────────────────────────────────────

function TypeIcon({ type }: { type: NotificationType }): React.ReactElement {
  const iconProps = {
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (type) {
    case 'follow':
      return (
        <svg {...iconProps} aria-hidden="true">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <line x1="19" y1="8" x2="19" y2="14" />
          <line x1="22" y1="11" x2="16" y2="11" />
        </svg>
      );
    case 'like':
      return (
        <svg {...iconProps} aria-hidden="true">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      );
    case 'comment':
      return (
        <svg {...iconProps} aria-hidden="true">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      );
    case 'remix':
      return (
        <svg {...iconProps} aria-hidden="true">
          <polyline points="17 1 21 5 17 9" />
          <path d="M3 11V9a4 4 0 0 1 4-4h14" />
          <polyline points="7 23 3 19 7 15" />
          <path d="M21 13v2a4 4 0 0 1-4 4H3" />
        </svg>
      );
    default:
      return (
        <svg {...iconProps} aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
  }
}
