/**
 * PositionNeedsIndicator - Shows roster construction needs
 *
 * Displays position requirements status at a glance.
 * Compact: "NEEDS: 1 TE • 5 FLEX"
 * Expanded: Detailed breakdown with progress bars
 */

import React from 'react';
import type { PositionNeedsIndicatorProps, PositionNeed, Position } from '../types';
import {
  SLOW_DRAFT_COLORS,
  SLOW_DRAFT_TYPOGRAPHY,
  SLOW_DRAFT_LAYOUT,
} from '../constants';
import { TEXT_COLORS } from '../../../core/constants/colors';

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
        style={{
          backgroundColor: positionColor,
          color: need.position === 'WR' ? '#000' : '#fff',
          fontSize: 9,
          fontWeight: 700,
          padding: '1px 4px',
          borderRadius: 3,
        }}
      >
        {need.position}
      </span>

      {/* Count needed */}
      <span
        style={{
          ...SLOW_DRAFT_TYPOGRAPHY.needsText,
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
        style={{
          minWidth: 50,
          textAlign: 'right',
          fontSize: 12,
          fontWeight: 600,
          color: urgencyColor,
        }}
      >
        {need.current}/{need.recommended}
      </div>
      {/* No status indicator - checkmarks removed */}
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

  // Expanded mode: Show position rows without checkmarks
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: TEXT_COLORS.secondary,
          marginBottom: 4,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        POSITION NEEDS
      </div>
      {needs.map((need) => (
        <PositionRow key={need.position} need={need} />
      ))}
    </div>
  );
}
