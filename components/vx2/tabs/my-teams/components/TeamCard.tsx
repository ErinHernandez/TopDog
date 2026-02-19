/**
 * TeamCard Component
 *
 * Displays a single team in the team list with ranking, name, and points info.
 * Supports drag-and-drop for custom ordering.
 *
 * @module components/vx2/tabs/my-teams/components/TeamCard
 */

import React, { useMemo, useCallback } from 'react';

import { cn } from '@/lib/styles';

import { isNFLSeasonActive } from '../../../../../lib/tournament/seasonUtils';
import { Skeleton } from '../../../../ui';
import { ChevronRight } from '../../../components/icons';
import type { MyTeam } from '../../../hooks/data';


import styles from './TeamCard.module.css';

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
      className={cn(styles.cardContainer, isCustomSort && styles.customSort, isDragging && styles.isDragging, isDragOver && styles.isDragOver)}
      aria-label={`View ${team.name}`}
    >
      <div className={styles.contentArea}>
        {/* Standing - only shown when season has started and rank is available */}
        {seasonStarted && team.rank && team.rank >= 1 && team.rank <= 12 && (
          <div className={styles.rankBadge}>
            <span className={styles.rankText}>
              {formatRank(team.rank)}
            </span>
          </div>
        )}
        <div className={styles.textContent}>
          <div className={styles.teamNameRow}>
            <h3 className={styles.teamName}>
              {formattedName}
            </h3>
            {sortMethod === 'draftedAt' && team.draftedAt && (
              <span className={styles.draftDateText}>
                {formatDraftDate(team.draftedAt)}
              </span>
            )}
            {showPointsDiff && ((pointsBack ?? null) !== null || (pointsAhead ?? null) !== null) && (
              <div className={styles.pointsDiffContainer}>
                {(pointsBack ?? null) !== null && (pointsBack ?? 0) > 0 && (
                  <span className={styles.pointsDiffText}>{(pointsBack ?? 0).toFixed(1)} pts back</span>
                )}
                {(pointsAhead ?? null) !== null && (pointsAhead ?? 0) > 0 && (
                  <span className={styles.pointsDiffText}>{(pointsAhead ?? 0).toFixed(1)} pts ahead</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {isCustomSort ? (
        <div className={styles.controlsContainer} onClick={(e) => e.stopPropagation()}>
          {index > 0 && onMoveUp && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp();
              }}
              className={styles.moveButton}
              aria-label="Move up"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
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
              className={styles.moveButton}
              aria-label="Move down"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
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
        <div className={`${styles.controlsContainer  } ${  styles.noCustomSort}`}>
          <ChevronRight size={20} />
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
    <div className={styles.skeletonContainer}>
      <Skeleton width={150} height={18} />
    </div>
  );
}

export default TeamCard;
