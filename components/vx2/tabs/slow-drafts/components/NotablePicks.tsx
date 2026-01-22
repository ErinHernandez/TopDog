/**
 * NotablePicks - Activity feed showing reaches, steals, and alerts
 *
 * Surfaces interesting draft activity so users don't miss key moments.
 */

import React, { useState, useEffect } from 'react';
import type { NotablePicksProps, NotableEvent, NotableEventType } from '../types';
import {
  SLOW_DRAFT_COLORS,
  SLOW_DRAFT_TYPOGRAPHY,
  SLOW_DRAFT_LAYOUT,
  SLOW_DRAFT_THRESHOLDS,
} from '../constants';

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
      className="w-full text-left transition-all active:scale-[0.99]"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '10px 12px',
        borderRadius: 10,
        backgroundColor: style.bgColor,
        border: `1px solid ${style.color}30`,
      }}
    >
      {/* Pick number column */}
      <div
        style={{
          minWidth: 36,
          fontSize: 11,
          fontWeight: 600,
          color: 'rgba(255, 255, 255, 0.5)',
          paddingTop: 2,
        }}
      >
        {formatPickNumber(event.pickNumber)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Main line: Drafter took Player (Position) */}
        <div style={{ marginBottom: 4 }}>
          <span
            style={{
              ...SLOW_DRAFT_TYPOGRAPHY.eventDescription,
              color: 'rgba(255, 255, 255, 0.7)',
            }}
          >
            {event.drafter?.name || 'Someone'}
          </span>
          <span
            style={{
              ...SLOW_DRAFT_TYPOGRAPHY.eventDescription,
              color: 'rgba(255, 255, 255, 0.5)',
            }}
          >
            {' '}took{' '}
          </span>
          <span
            style={{
              ...SLOW_DRAFT_TYPOGRAPHY.eventHighlight,
              color: 'rgba(255, 255, 255, 0.95)',
            }}
          >
            {event.player?.name || 'Unknown'}
          </span>
          {event.player && (
            <span
              style={{
                fontSize: 11,
                color: SLOW_DRAFT_COLORS.positions[event.player.position],
                fontWeight: 600,
                marginLeft: 4,
              }}
            >
              ({event.player.position})
            </span>
          )}
        </div>

        {/* Event type badge and ADP info */}
        <div className="flex items-center gap-2">
          {/* Type badge */}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              fontSize: 10,
              fontWeight: 700,
              color: style.color,
              backgroundColor: `${style.color}20`,
              padding: '2px 6px',
              borderRadius: 4,
            }}
          >
            {style.icon} {style.label}
          </span>

          {/* ADP delta */}
          {event.adpDelta !== undefined && Math.abs(event.adpDelta) > 0 && (
            <span
              style={{
                fontSize: 11,
                color: style.color,
                fontWeight: 500,
              }}
            >
              {formatAdpDelta(event.adpDelta)}
            </span>
          )}
        </div>
      </div>

      {/* Timestamp */}
      <div
        style={{
          fontSize: 10,
          color: 'rgba(255, 255, 255, 0.35)',
          paddingTop: 2,
        }}
      >
        {formatTimestamp(event.timestamp, isMounted)}
      </div>
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
      <div>
        <div
          style={{
            ...SLOW_DRAFT_TYPOGRAPHY.sectionLabel,
            marginBottom: SLOW_DRAFT_LAYOUT.sectionLabelMarginBottom,
          }}
        >
          NOTABLE ACTIVITY
        </div>
        <div
          style={{
            color: 'rgba(255, 255, 255, 0.4)',
            fontSize: 13,
            fontStyle: 'italic',
            padding: '8px 0',
          }}
        >
          No notable picks yet
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          ...SLOW_DRAFT_TYPOGRAPHY.sectionLabel,
          marginBottom: SLOW_DRAFT_LAYOUT.sectionLabelMarginBottom,
        }}
      >
        NOTABLE ACTIVITY
      </div>

      <div className="flex flex-col gap-2">
        {visibleEvents.map((event) => (
          <EventItem
            key={event.id}
            event={event}
            onTap={() => onEventTap?.(event)}
          />
        ))}
      </div>

      {/* Show more indicator */}
      {hiddenCount > 0 && (
        <button
          className="w-full mt-2 py-2 text-center transition-all active:opacity-70"
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: 'rgba(255, 255, 255, 0.5)',
          }}
        >
          +{hiddenCount} more event{hiddenCount !== 1 ? 's' : ''}
        </button>
      )}
    </div>
  );
}
