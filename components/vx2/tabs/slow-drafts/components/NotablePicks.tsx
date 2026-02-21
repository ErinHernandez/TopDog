/**
 * NotablePicks - Activity feed showing reaches, steals, and alerts
 *
 * Surfaces interesting draft activity so users don't miss key moments.
 */

import React, { useState, useEffect } from 'react';

import { cn } from '@/lib/styles';

import { SLOW_DRAFT_COLORS, SLOW_DRAFT_LAYOUT, SLOW_DRAFT_THRESHOLDS } from '../constants';
import type { NotablePicksProps, NotableEvent, NotableEventType } from '../types';

import styles from './NotablePicks.module.css';

// ============================================================================
// EVENT STYLING
// ============================================================================

interface EventStyle {
  icon: string;
  label: string;
  color: string;
  bgColor: string;
}

function getEventStyle(type: NotableEventType): EventStyle {
  switch (type) {
    case 'reach':
      return {
        icon: '📈',
        label: 'REACH',
        color: SLOW_DRAFT_COLORS.events.reach,
        bgColor: SLOW_DRAFT_COLORS.events.reachBg,
      };
    case 'steal':
      return {
        icon: '💎',
        label: 'STEAL',
        color: SLOW_DRAFT_COLORS.events.steal,
        bgColor: SLOW_DRAFT_COLORS.events.stealBg,
      };
    case 'queue_alert':
      return {
        icon: '🚨',
        label: 'TAKEN',
        color: SLOW_DRAFT_COLORS.events.alert,
        bgColor: SLOW_DRAFT_COLORS.events.alertBg,
      };
    case 'position_run':
      return {
        icon: '🏃',
        label: 'RUN',
        color: SLOW_DRAFT_COLORS.events.positionRun,
        bgColor: SLOW_DRAFT_COLORS.events.positionRunBg,
      };
    case 'competitor_alert':
      return {
        icon: '👀',
        label: 'WATCH',
        color: SLOW_DRAFT_COLORS.events.reach,
        bgColor: SLOW_DRAFT_COLORS.events.reachBg,
      };
    default:
      return {
        icon: 'ℹ️',
        label: 'INFO',
        color: SLOW_DRAFT_COLORS.events.info,
        bgColor: 'rgba(255, 255, 255, 0.05)',
      };
  }
}

// ============================================================================
// FORMAT HELPERS
// ============================================================================

function formatPickNumber(pickNumber: number, teamCount: number = 12): string {
  const round = Math.ceil(pickNumber / teamCount);
  const pickInRound = ((pickNumber - 1) % teamCount) + 1;
  return `${round}.${pickInRound.toString().padStart(2, '0')}`;
}

// Format timestamp with SSR-safe defaults to prevent hydration mismatch
// Returns a placeholder during initial render, then updates after mount
function formatTimestamp(timestamp: number, isMounted: boolean): string {
  // During SSR and initial client render, return a safe placeholder
  if (!isMounted) {
    return '—'; // Placeholder that matches on server and client
  }

  const now = Date.now();
  const diffMs = now - timestamp;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function formatAdpDelta(delta: number): string {
  if (delta > 0) {
    return `${delta} picks early`;
  } else {
    return `${Math.abs(delta)} picks late`;
  }
}

// ============================================================================
// EVENT ITEM
// ============================================================================

interface EventItemProps {
  event: NotableEvent;
  onTap?: () => void;
}

function EventItem({ event, onTap }: EventItemProps): React.ReactElement {
  const style = getEventStyle(event.type);
  const [isMounted, setIsMounted] = useState(false);

  // Track mount state to prevent hydration mismatch with Date.now()
  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <button
      onClick={onTap}
      className={cn(styles.eventButton, 'w-full')}
      style={
        {
          '--event-bg-color': style.bgColor,
          '--event-border-color': `${style.color}30`,
        } as React.CSSProperties
      }
    >
      {/* Pick number column */}
      <div className={styles.pickNumber}>{formatPickNumber(event.pickNumber)}</div>

      {/* Content */}
      <div className={cn(styles.content, 'flex-1 min-w-0')}>
        {/* Main line: Drafter took Player (Position) */}
        <div className={styles.mainLine}>
          <span className={styles.drafterName}>{event.drafter?.name || 'Someone'}</span>
          <span className={styles.actionText}> took </span>
          <span className={styles.playerName}>{event.player?.name || 'Unknown'}</span>
          {event.player && (
            <span
              className={styles.playerPosition}
              style={
                {
                  '--position-color': SLOW_DRAFT_COLORS.positions[event.player.position],
                } as React.CSSProperties
              }
            >
              ({event.player.position})
            </span>
          )}
        </div>

        {/* Event type badge and ADP info */}
        <div className={cn(styles.badgeRow, 'flex items-center gap-2')}>
          {/* Type badge */}
          <span
            className={styles.typeBadge}
            style={
              {
                '--event-color': style.color,
                '--event-badge-bg': `${style.color}20`,
              } as React.CSSProperties
            }
          >
            {style.icon} {style.label}
          </span>

          {/* ADP delta */}
          {event.adpDelta !== undefined && Math.abs(event.adpDelta) > 0 && (
            <span
              className={styles.adpDelta}
              style={
                {
                  '--event-color': style.color,
                } as React.CSSProperties
              }
            >
              {formatAdpDelta(event.adpDelta)}
            </span>
          )}
        </div>
      </div>

      {/* Timestamp */}
      <div className={styles.timestamp}>{formatTimestamp(event.timestamp, isMounted)}</div>
    </button>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function NotablePicks({
  events,
  maxVisible = SLOW_DRAFT_THRESHOLDS.maxNotableEvents,
  onEventTap,
}: NotablePicksProps): React.ReactElement {
  // Sort by most recent first
  const sortedEvents = [...events].sort((a, b) => b.timestamp - a.timestamp);
  const visibleEvents = sortedEvents.slice(0, maxVisible);
  const hiddenCount = sortedEvents.length - visibleEvents.length;

  if (events.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <div className={styles.sectionLabel}>NOTABLE ACTIVITY</div>
        <div className={styles.emptyMessage}>No notable picks yet</div>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.sectionLabel}>NOTABLE ACTIVITY</div>

      <div className="flex flex-col gap-2">
        {visibleEvents.map(event => (
          <EventItem key={event.id} event={event} onTap={() => onEventTap?.(event)} />
        ))}
      </div>

      {/* Show more indicator */}
      {hiddenCount > 0 && (
        <button className={styles.showMoreButton}>
          +{hiddenCount} more event{hiddenCount !== 1 ? 's' : ''}
        </button>
      )}
    </div>
  );
}
