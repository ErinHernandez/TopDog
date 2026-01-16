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
import { SPACING } from '../../../core/constants/sizes';

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
// EXPANDED PLAYER CARD (matches DraftBoard PickCell style)
// ============================================================================

// Pixel values matched from DraftBoard.tsx
const CARD_PX = {
  cellWidth: 92,
  cellHeight: 62,
  cellBorderWidth: 4,
  cellBorderRadius: 6,
  pickNumberFontSize: 8,
  playerFirstNameFontSize: 10,
  playerLastNameFontSize: 11,
  playerPosTeamFontSize: 9,
  playerPosTeamMarginTop: 6,
} as const;

interface PlayerMiniCardProps {
  pick: MyPick;
  onTap?: () => void;
}

function PlayerMiniCard({ pick, onTap }: PlayerMiniCardProps): React.ReactElement {
  const positionColor = SLOW_DRAFT_COLORS.positions[pick.player.position];

  // Split name into first and last
  const nameParts = pick.player.name.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || pick.player.name;

  // Format pick number as round.pick (e.g., "1.01") using actual round/pickInRound data
  const formattedPickNumber = `${pick.round}.${String(pick.pickInRound).padStart(2, '0')}`;

  return (
    <button
      onClick={onTap}
      className="flex flex-col transition-transform active:scale-95"
      style={{
        width: CARD_PX.cellWidth,
        height: CARD_PX.cellHeight,
        borderRadius: CARD_PX.cellBorderRadius,
        border: `${CARD_PX.cellBorderWidth}px solid ${positionColor}`,
        backgroundColor: `${positionColor}20`, // 20% opacity tint
        padding: '2px 3px',
        flexShrink: 0,
      }}
    >
      {/* Pick number - top left */}
      <div
        style={{
          fontSize: CARD_PX.pickNumberFontSize,
          fontWeight: 500,
          color: '#FFFFFF',
          lineHeight: 1,
          marginTop: 2,
          marginLeft: 1,
          textAlign: 'left',
        }}
      >
        {formattedPickNumber}
      </div>

      {/* Content area - centered */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* First name */}
        <div
          style={{
            fontWeight: 700,
            color: '#FFFFFF',
            textAlign: 'center',
            width: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: CARD_PX.playerFirstNameFontSize,
            lineHeight: 1.2,
            marginTop: -1,
          }}
        >
          {firstName}
        </div>

        {/* Last name */}
        <div
          style={{
            fontWeight: 700,
            color: '#FFFFFF',
            textAlign: 'center',
            width: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: CARD_PX.playerLastNameFontSize,
            lineHeight: 1.2,
          }}
        >
          {lastName}
        </div>

        {/* POS-TEAM */}
        <div
          style={{
            color: '#FFFFFF',
            textAlign: 'center',
            fontSize: CARD_PX.playerPosTeamFontSize,
            lineHeight: 1.2,
            marginTop: CARD_PX.playerPosTeamMarginTop,
          }}
        >
          {pick.player.position}-{pick.player.team}
        </div>
      </div>
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
        width: CARD_PX.cellWidth,
        height: CARD_PX.cellHeight,
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderRadius: CARD_PX.cellBorderRadius,
        border: '1px dashed rgba(255, 255, 255, 0.2)',
        flexShrink: 0,
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
