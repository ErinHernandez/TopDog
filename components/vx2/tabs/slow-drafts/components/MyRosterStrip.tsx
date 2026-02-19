/**
 * MyRosterStrip - Visual roster representation
 *
 * Shows the user's drafted players as position-colored squares.
 * Acts as a visual fingerprint for quick draft identification.
 *
 * Compact mode: Small colored squares (collapsed card)
 * Expanded mode: Player cards with names (expanded card)
 */

import React from 'react';

import {
  SLOW_DRAFT_LAYOUT,
  SLOW_DRAFT_COLORS,
  SLOW_DRAFT_THRESHOLDS,
  ROSTER_SIZE,
} from '../constants';
import type { MyRosterStripProps, MyPick, Position } from '../types';

import styles from './MyRosterStrip.module.css';

// ============================================================================
// COMPACT ROSTER SQUARE
// ============================================================================

interface RosterSquareProps {
  pick?: MyPick;
  index: number;
  size: number;
}

function RosterSquare({ pick, index, size }: RosterSquareProps): React.ReactElement {
  const isEmpty = !pick;
  const bgColor = isEmpty
    ? SLOW_DRAFT_COLORS.positions.empty
    : SLOW_DRAFT_COLORS.positions[pick.player.position];

  return (
    <div
      className={styles.rosterSquare}
      style={{
        '--roster-square-size': `${size}px`,
        '--roster-square-bg-color': bgColor,
        '--roster-square-border': isEmpty
          ? `1px solid ${SLOW_DRAFT_COLORS.positions.emptyBorder}`
          : 'none',
      } as React.CSSProperties}
      title={pick ? `${pick.player.name} (${pick.player.position})` : `Slot ${index + 1}`}
    />
  );
}

// ============================================================================
// EXPANDED PLAYER CARD
// ============================================================================

interface PlayerMiniCardProps {
  pick: MyPick;
  onTap?: () => void;
}

function PlayerMiniCard({ pick, onTap }: PlayerMiniCardProps): React.ReactElement {
  const positionColor = SLOW_DRAFT_COLORS.positions[pick.player.position]!;

  // Get first initial and last name
  const nameParts = pick.player.name.split(' ');
  const displayName = nameParts.length > 1
    ? `${nameParts[0]![0]!}. ${nameParts.slice(1).join(' ')}`
    : pick.player.name;

  // Truncate if too long
  const truncatedName = displayName.length > 10
    ? `${displayName.substring(0, 9)  }…`
    : displayName;

  return (
    <button
      onClick={onTap}
      className={styles.playerMiniCard}
      style={{
        '--player-card-border-color': positionColor,
      } as React.CSSProperties}
    >
      {/* Position badge */}
      <div
        className={styles.positionBadge}
        style={{
          '--position-color': positionColor,
          '--position-text-color': pick.player.position === 'WR' ? '#000' : '#fff',
        } as React.CSSProperties}
      >
        {pick.player.position}
      </div>

      {/* Player name */}
      <span
        className={styles.playerName}
      >
        {truncatedName}
      </span>

      {/* Team */}
      <span
        className={styles.playerTeam}
      >
        {pick.player.team}
      </span>
    </button>
  );
}

// ============================================================================
// MORE INDICATOR
// ============================================================================

interface MoreIndicatorProps {
  count: number;
  onTap?: () => void;
}

function MoreIndicator({ count, onTap }: MoreIndicatorProps): React.ReactElement {
  return (
    <button
      onClick={onTap}
      className={styles.moreIndicator}
    >
      <span className={styles.moreIndicatorText}>
        +{count} more
      </span>
    </button>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function MyRosterStrip({
  picks,
  rosterSize = ROSTER_SIZE,
  compact = true,
  onSlotTap,
}: MyRosterStripProps): React.ReactElement {
  // Create a slot map for quick lookup
  const slotMap = new Map<number, MyPick>();
  picks.forEach((pick) => {
    slotMap.set(pick.slotIndex, pick);
  });

  // Sort picks by slot index for expanded view
  const sortedPicks = [...picks].sort((a, b) => a.slotIndex - b.slotIndex);

  if (compact) {
    // Compact mode: Show all 18 slots as small squares
    return (
      <div
        className={styles.compactContainer}
      >
        {Array.from({ length: rosterSize }, (_, index) => (
          <RosterSquare
            key={index}
            pick={slotMap.get(index)}
            index={index}
            size={SLOW_DRAFT_LAYOUT.rosterSquareSize}
          />
        ))}
      </div>
    );
  }

  // Expanded mode: Show player cards with names
  const visiblePicks = sortedPicks.slice(0, SLOW_DRAFT_THRESHOLDS.maxVisibleRosterExpanded);
  const remainingCount = sortedPicks.length - visiblePicks.length;

  return (
    <div className={styles.expandedContainer}>
      {/* Section label */}
      <div
        className={styles.sectionLabel}
      >
        MY ROSTER ({picks.length} picks)
      </div>

      {/* Player cards row */}
      <div
        className={styles.expandedCardsRow}
      >
        {visiblePicks.map((pick) => (
          <PlayerMiniCard
            key={pick.slotIndex}
            pick={pick}
            onTap={() => onSlotTap?.(pick.slotIndex)}
          />
        ))}

        {remainingCount > 0 && (
          <MoreIndicator
            count={remainingCount}
            onTap={() => onSlotTap?.(-1)} // -1 signals "view all"
          />
        )}

        {/* Empty state */}
        {picks.length === 0 && (
          <div className={styles.emptyState}>
            No picks yet
          </div>
        )}
      </div>
    </div>
  );
}
