/**
 * PositionNeedsIndicator - Shows roster construction needs
 *
 * Displays position requirements status at a glance.
 * Compact: "NEEDS: 1 TE • 5 FLEX"
 * Expanded: Detailed breakdown with progress bars
 */

import React from 'react';

import {
  SLOW_DRAFT_COLORS,
  SLOW_DRAFT_LAYOUT,
} from '../constants';
import type { PositionNeedsIndicatorProps, PositionNeed, Position } from '../types';

import styles from './PositionNeedsIndicator.module.css';

// ============================================================================
// URGENCY HELPERS
// ============================================================================

function getUrgencyColor(urgency: PositionNeed['urgency']): string {
  switch (urgency) {
    case 'critical':
      return SLOW_DRAFT_COLORS.needs.critical;
    case 'warning':
      return SLOW_DRAFT_COLORS.needs.warning;
    case 'good':
      return SLOW_DRAFT_COLORS.needs.good;
    default:
      return SLOW_DRAFT_COLORS.needs.neutral;
  }
}

function getUrgencyIcon(urgency: PositionNeed['urgency']): string {
  switch (urgency) {
    case 'critical':
      return '';
    case 'warning':
      return '';
    case 'good':
      return '✓';
    default:
      return '';
  }
}

// ============================================================================
// COMPACT NEED PILL
// ============================================================================

interface NeedPillProps {
  need: PositionNeed;
}

function NeedPill({ need }: NeedPillProps): React.ReactElement {
  const positionColor = SLOW_DRAFT_COLORS.positions[need.position];
  const urgencyColor = getUrgencyColor(need.urgency);
  const isUrgent = need.urgency === 'critical' || need.urgency === 'warning';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 8px',
        borderRadius: 6,
        backgroundColor: isUrgent ? `${urgencyColor}20` : 'rgba(255, 255, 255, 0.06)',
        border: `1px solid ${isUrgent ? urgencyColor : 'rgba(255, 255, 255, 0.1)'}`,
      }}
    >
      {/* Position badge */}
      <span
        className={styles.positionBadge}
        style={{
          backgroundColor: positionColor,
          color: need.position === 'WR' ? '#000' : '#fff',
          padding: '1px 4px',
          borderRadius: 3,
        }}
      >
        {need.position}
      </span>

      {/* Count needed */}
      <span
        className={styles.needsText}
        style={{
          color: isUrgent ? urgencyColor : 'rgba(255, 255, 255, 0.8)',
        }}
      >
        {need.needed}
      </span>
    </span>
  );
}

// ============================================================================
// EXPANDED POSITION ROW
// ============================================================================

interface PositionRowProps {
  need: PositionNeed;
}

function PositionRow({ need }: PositionRowProps): React.ReactElement {
  const positionColor = SLOW_DRAFT_COLORS.positions[need.position];
  const urgencyColor = getUrgencyColor(need.urgency);
  const progress = Math.min(100, (need.current / need.recommended) * 100);

  return (
    <div className="flex items-center gap-3">
      {/* Position badge */}
      <div
        style={{
          width: 32,
          backgroundColor: positionColor,
          color: need.position === 'WR' ? '#000' : '#fff',
          fontSize: 11,
          fontWeight: 700,
          padding: '3px 0',
          borderRadius: 4,
          textAlign: 'center',
        }}
      >
        {need.position}
      </div>

      {/* Progress bar */}
      <div className="flex-1">
        <div
          style={{
            height: 6,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              backgroundColor: urgencyColor,
              borderRadius: 3,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Count */}
      <div
        className={styles.countText}
        style={{
          minWidth: 50,
          textAlign: 'right',
          color: urgencyColor,
        }}
      >
        {need.current}/{need.recommended}
      </div>

      {/* Status indicator */}
      <div style={{ width: 20, textAlign: 'center' }}>
        {need.urgency === 'good' && '✓'}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PositionNeedsIndicator({
  needs,
  compact = true,
}: PositionNeedsIndicatorProps): React.ReactElement | null {
  // Filter to only show positions that need more picks
  const urgentNeeds = needs.filter(
    (need) => need.urgency === 'critical' || need.urgency === 'warning'
  );

  // Calculate flex remaining (slots needed to complete roster)
  const totalPicked = needs.reduce((sum, n) => sum + n.current, 0);
  const flexRemaining = 18 - totalPicked; // ROSTER_SIZE

  if (compact) {
    // Compact mode: Removed - return null to hide needs section
    return null;
  }

  // Expanded mode: Full breakdown
  return (
    <div>
      <div className="flex flex-col gap-2">
        {needs.map((need) => (
          <PositionRow key={need.position} need={need} />
        ))}
      </div>

      {/* Flex remaining */}
      {flexRemaining > 0 && (
        <div
          className={styles.remainingText}
          style={{
            marginTop: 8,
            color: 'rgba(255, 255, 255, 0.5)',
          }}
        >
          {flexRemaining} roster slot{flexRemaining !== 1 ? 's' : ''} remaining
        </div>
      )}
    </div>
  );
}
