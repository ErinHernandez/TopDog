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
import type { MyRosterStripProps, MyPick, Position } from '../types';
import {
  SLOW_DRAFT_LAYOUT,
  SLOW_DRAFT_COLORS,
  SLOW_DRAFT_TYPOGRAPHY,
  SLOW_DRAFT_THRESHOLDS,
  ROSTER_SIZE,
} from '../constants';
import { SPACING } from '../deps/core/constants/sizes';

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
      style={{
        width: size,
        height: size,
        borderRadius: SLOW_DRAFT_LAYOUT.rosterSquareBorderRadius,
        backgroundColor: bgColor,
        border: isEmpty
          ? `1px solid ${SLOW_DRAFT_COLORS.positions.emptyBorder}`
          : 'none',
        transition: 'transform 0.15s ease, background-color 0.15s ease',
        flexShrink: 0,
      }}
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
  const positionColor = SLOW_DRAFT_COLORS.positions[pick.player.position];

  // Get first initial and last name
  const nameParts = pick.player.name.split(' ');
  const displayName = nameParts.length > 1
    ? `${nameParts[0][0]}. ${nameParts.slice(1).join(' ')}`
    : pick.player.name;

  // Truncate if too long
  const truncatedName = displayName.length > 10
    ? displayName.substring(0, 9) + '…'
    : displayName;

  return (
    <button
      onClick={onTap}
      className="flex flex-col items-center transition-transform active:scale-95"
      style={{
        width: SLOW_DRAFT_LAYOUT.expandedPlayerCardWidth,
        height: SLOW_DRAFT_LAYOUT.expandedPlayerCardHeight,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderRadius: 8,
        padding: 6,
        border: `2px solid ${positionColor}`,
      }}
    >
      {/* Position badge */}
      <div
        style={{
          backgroundColor: positionColor,
          color: pick.player.position === 'WR' ? '#000' : '#fff',
          fontSize: 10,
          fontWeight: 700,
          padding: '2px 6px',
          borderRadius: 4,
          marginBottom: 4,
        }}
      >
        {pick.player.position}
      </div>

      {/* Player name */}
      <span
        style={{
          ...SLOW_DRAFT_TYPOGRAPHY.playerName,
          textAlign: 'center',
          lineHeight: 1.2,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {truncatedName}
      </span>

      {/* Team */}
      <span
        style={{
          ...SLOW_DRAFT_TYPOGRAPHY.playerPosition,
          marginTop: 'auto',
        }}
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
      className="flex items-center justify-center transition-transform active:scale-95"
      style={{
        width: SLOW_DRAFT_LAYOUT.expandedPlayerCardWidth,
        height: SLOW_DRAFT_LAYOUT.expandedPlayerCardHeight,
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderRadius: 8,
        border: '1px dashed rgba(255, 255, 255, 0.2)',
      }}
    >
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: 'rgba(255, 255, 255, 0.6)',
        }}
      >
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
        className="flex flex-wrap"
        style={{
          gap: SLOW_DRAFT_LAYOUT.rosterSquareGap,
        }}
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
    <div>
      {/* Section label */}
      <div
        style={{
          ...SLOW_DRAFT_TYPOGRAPHY.sectionLabel,
          marginBottom: SLOW_DRAFT_LAYOUT.sectionLabelMarginBottom,
        }}
      >
        MY ROSTER ({picks.length} picks)
      </div>

      {/* Player cards row */}
      <div
        className="flex overflow-x-auto"
        style={{
          gap: SLOW_DRAFT_LAYOUT.expandedPlayerCardGap,
          paddingBottom: 4, // For scroll indicator
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
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
          <div
            style={{
              color: 'rgba(255, 255, 255, 0.4)',
              fontSize: 13,
              fontStyle: 'italic',
            }}
          >
            No picks yet
          </div>
        )}
      </div>
    </div>
  );
}
