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
      className={styles.pill}
      style={{
        '--pill-bg': isUrgent ? `${urgencyColor}20` : 'rgba(255, 255, 255, 0.06)',
        '--pill-border': isUrgent ? urgencyColor : 'rgba(255, 255, 255, 0.1)',
        '--position-color': positionColor,
        '--position-text-color': need.position === 'WR' ? '#000' : '#fff',
        '--count-color': isUrgent ? urgencyColor : 'rgba(255, 255, 255, 0.8)',
        '--needs-text-font-size': `${SLOW_DRAFT_TYPOGRAPHY.needsText.fontSize}px`,
        '--needs-text-font-weight': SLOW_DRAFT_TYPOGRAPHY.needsText.fontWeight,
      } as React.CSSProperties}
    >
      {/* Position badge */}
      <span className={styles.pillBadge}>
        {need.position}
      </span>

      {/* Count needed */}
      <span className={styles.pillCount}>
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
    <div
      className={styles.row}
      style={{
        '--position-color': positionColor,
        '--position-text-color': need.position === 'WR' ? '#000' : '#fff',
        '--urgency-color': urgencyColor,
        '--progress-width': `${progress}%`,
      } as React.CSSProperties}
    >
      {/* Position badge */}
      <div className={styles.rowBadge}>
        {need.position}
      </div>

      {/* Progress bar */}
      <div className={styles.progressContainer}>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} />
        </div>
      </div>

      {/* Count */}
      <div className={styles.rowCount}>
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
      className={styles.container}
      style={{
        '--header-color': TEXT_COLORS.secondary,
      } as React.CSSProperties}
    >
      <div className={styles.header}>
        POSITION NEEDS
      </div>
      {needs.map((need) => (
        <PositionRow key={need.position} need={need} />
      ))}
    </div>
  );
}
