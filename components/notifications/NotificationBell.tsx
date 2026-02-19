/**
 * NotificationBell — Header icon with unread count badge and dropdown.
 *
 * Shows a bell icon in the header. Unread count is displayed as a
 * badge. Clicking opens a dropdown with recent notifications.
 *
 * @module components/notifications/NotificationBell
 * @phase 37
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNotifications } from './NotificationProvider';
import { NotificationDropdown } from './NotificationDropdown';
import styles from './NotificationBell.module.css';

export function NotificationBell(): React.ReactElement {
  const { unreadCount, refresh } = useNotifications();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch notifications when dropdown opens
  const handleToggle = useCallback(() => {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen) {
      refresh();
    }
  }, [open, refresh]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;

    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  return (
    <div ref={containerRef} className={styles.container}>
      <button
        className={styles.bellButton}
        onClick={handleToggle}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className={styles.badge} aria-hidden="true">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <NotificationDropdown onClose={() => setOpen(false)} />
      )}
    </div>
  );
}

// ─── Bell SVG Icon ───────────────────────────────────────────────────────────

function BellIcon(): React.ReactElement {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
