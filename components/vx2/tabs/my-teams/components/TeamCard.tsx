/**
 * TeamCard Component
 *
 * Displays a single team in the team list with ranking, name, and points info.
 * Supports drag-and-drop for custom ordering.
 *
 * @module components/vx2/tabs/my-teams/components/TeamCard
 */

import React, { useMemo, useCallback } from 'react';
import type { MyTeam } from '../../../hooks/data';
import { BG_COLORS, TEXT_COLORS } from '../../../core/constants/colors';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../../core/constants/sizes';
import { ChevronRight } from '../../../components/icons';
import { Skeleton } from '../../../../ui';
import { isNFLSeasonActive } from '../../../../../lib/tournament/seasonUtils';

// ============================================================================
// CONSTANTS
// ============================================================================

const MYTEAMS_PX = {
  cardPadding: SPACING.sm,
} as const;

// ============================================================================
// TYPES
// ============================================================================

export interface TeamCardProps {
  team: MyTeam;
  onSelect: () => void;
  pointsBack?: number | null;
  pointsAhead?: number | null;
  showPointsDiff?: boolean;
  sortMethod?: 'rank' | 'projectedPoints' | 'pointsScored' | 'pointsBackOfFirst' | 'pointsBackOfPlayoffs' | 'draftedAt';
  isCustomSort?: boolean;
  index?: number;
  totalTeams?: number;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  isDragging?: boolean;
  isDragOver?: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format rank with ordinal suffix (1st, 2nd, 3rd, etc.)
 */
function formatRank(rank: number): string {
  const lastDigit = rank % 10;
  const lastTwoDigits = rank % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    return `${rank}th`;
  }

  switch (lastDigit) {
    case 1:
      return `${rank}st`;
    case 2:
      return `${rank}nd`;
    case 3:
      return `${rank}rd`;
    default:
      return `${rank}th`;
  }
}

/**
 * Format draft date to "MMM D, YYYY" format
 */
function formatDraftDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
  } catch {
    return '';
  }
}

// ============================================================================
// TEAM CARD COMPONENT
// ============================================================================

export function TeamCard({
  team,
  onSelect,
  pointsBack,
  pointsAhead,
  showPointsDiff,
  sortMethod,
  isCustomSort = false,
  index = 0,
  totalTeams = 0,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  isDragging = false,
  isDragOver = false,
}: TeamCardProps): React.ReactElement {
  const seasonStarted = isNFLSeasonActive();

  // Format team name: "The TopDog International X" -> "THE INTERNATIONAL - X"
  const formattedName = useMemo(() => {
    const name = team.name;
    const match = name.match(/^The TopDog International (.+)$/);
    if (match) {
      return `THE INTERNATIONAL ${match[1]}`;
    }
    return name;
  }, [team.name]);

  const handleClick = useCallback(() => {
    onSelect();
  }, [onSelect]);

  return (
    <div
      onClick={handleClick}
      draggable={isCustomSort}
      onDragStart={isCustomSort ? onDragStart : undefined}
      onDragOver={isCustomSort ? onDragOver : undefined}
      onDragEnd={isCustomSort ? onDragEnd : undefined}
      onDrop={isCustomSort ? onDrop : undefined}
      className="w-full flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer"
      style={{
        paddingTop: `${MYTEAMS_PX.cardPadding + 6}px`,
        paddingBottom: `${MYTEAMS_PX.cardPadding + 6}px`,
        paddingLeft: `${MYTEAMS_PX.cardPadding + 4}px`,
        paddingRight: `${MYTEAMS_PX.cardPadding + 4}px`,
        backgroundColor: BG_COLORS.secondary,
        borderRadius: `${RADIUS.lg}px`,
        border: '1px solid rgba(255,255,255,0.1)',
        opacity: isDragging ? 0.5 : 1,
        borderTop: isDragOver ? '2px solid rgba(59, 130, 246, 0.6)' : '1px solid rgba(255,255,255,0.1)',
        cursor: isCustomSort ? 'move' : 'pointer',
        minHeight: '54px',
        height: '54px',
      }}
      aria-label={`View ${team.name}`}
    >
      <div className="flex items-center flex-1 min-w-0">
        {/* Standing - only shown when season has started and rank is available */}
        {seasonStarted && team.rank && team.rank >= 1 && team.rank <= 12 && (
          <div
            className="p-1 mr-2 flex items-center justify-center"
            style={{
              borderRadius: `${RADIUS.md}px`,
              minWidth: '28px',
              height: '28px',
            }}
          >
            <span
              style={{
                fontSize: `${TYPOGRAPHY.fontSize.xs}px`,
                color: TEXT_COLORS.primary,
                fontWeight: 600,
              }}
            >
              {formatRank(team.rank)}
            </span>
          </div>
        )}
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-3" style={{ minWidth: 0, flex: 1 }}>
            <h3
              className="font-medium flex-shrink-0"
              style={{
                color: TEXT_COLORS.primary,
                fontSize: `${TYPOGRAPHY.fontSize.sm}px`,
              }}
            >
              {formattedName}
            </h3>
            {sortMethod === 'draftedAt' && team.draftedAt && (
              <span
                style={{
                  fontSize: `${TYPOGRAPHY.fontSize.xs}px`,
                  color: TEXT_COLORS.muted,
                  marginLeft: 'auto',
                  whiteSpace: 'nowrap',
                }}
              >
                {formatDraftDate(team.draftedAt)}
              </span>
            )}
            {showPointsDiff && ((pointsBack ?? null) !== null || (pointsAhead ?? null) !== null) && (
              <div
                className="flex flex-col"
                style={{
                  fontSize: `${TYPOGRAPHY.fontSize.xs}px`,
                  color: TEXT_COLORS.muted,
                  marginLeft: 'auto',
                  textAlign: 'right',
                }}
              >
                {(pointsBack ?? null) !== null && (pointsBack ?? 0) > 0 && (
                  <span style={{ whiteSpace: 'nowrap' }}>{(pointsBack ?? 0).toFixed(1)} pts back</span>
                )}
                {(pointsAhead ?? null) !== null && (pointsAhead ?? 0) > 0 && (
                  <span style={{ whiteSpace: 'nowrap' }}>{(pointsAhead ?? 0).toFixed(1)} pts ahead</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {isCustomSort ? (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {index > 0 && onMoveUp && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp();
              }}
              className="p-1 flex items-center justify-center transition-all active:scale-95"
              aria-label="Move up"
              style={{
                borderRadius: `${RADIUS.sm}px`,
                backgroundColor: 'rgba(255,255,255,0.05)',
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke={TEXT_COLORS.muted}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="18 15 12 9 6 15" />
              </svg>
            </button>
          )}
          {index < totalTeams - 1 && onMoveDown && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown();
              }}
              className="p-1 flex items-center justify-center transition-all active:scale-95"
              aria-label="Move down"
              style={{
                borderRadius: `${RADIUS.sm}px`,
                backgroundColor: 'rgba(255,255,255,0.05)',
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke={TEXT_COLORS.muted}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          )}
        </div>
      ) : (
        <div style={{ paddingLeft: `${SPACING.sm}px` }}>
          <ChevronRight size={20} color={TEXT_COLORS.muted} />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SKELETON
// ============================================================================

export function TeamCardSkeleton(): React.ReactElement {
  return (
    <div
      style={{
        paddingTop: `${MYTEAMS_PX.cardPadding + 6}px`,
        paddingBottom: `${MYTEAMS_PX.cardPadding + 6}px`,
        paddingLeft: `${MYTEAMS_PX.cardPadding + 4}px`,
        paddingRight: `${MYTEAMS_PX.cardPadding + 4}px`,
        backgroundColor: BG_COLORS.secondary,
        borderRadius: `${RADIUS.lg}px`,
      }}
    >
      <Skeleton width={150} height={18} />
    </div>
  );
}

export default TeamCard;
