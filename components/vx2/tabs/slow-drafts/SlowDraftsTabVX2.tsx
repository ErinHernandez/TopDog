/**
 * SlowDraftsTabVX2 - Premium slow drafts experience
 *
 * A completely reimagined slow drafts interface designed for users
 * managing 50+ simultaneous drafts over multiple weeks.
 *
 * Key Features:
 * - Rich mini-dashboard cards with roster visualization
 * - Position needs at a glance
 * - Notable events feed (reaches, steals, alerts)
 * - Smart sorting and filtering
 * - Quick actions without entering draft room
 *
 * @example
 * ```tsx
 * <SlowDraftsTabVX2
 *   onEnterDraft={(draft) => router.push(`/draft/${draft.id}`)}
 *   onJoinDraft={() => setShowLobby(true)}
 * />
 * ```
 */

import React, { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/styles';
import { createScopedLogger } from '@/lib/clientLogger';
import type { SlowDraftsTabProps, SlowDraft } from './types';
import styles from './SlowDraftsTabVX2.module.css';

const logger = createScopedLogger('[SlowDraftsTabVX2]');
import { SLOW_DRAFT_LAYOUT } from './constants';
import { BG_COLORS, TEXT_COLORS, STATE_COLORS } from '../../core/constants/colors';
import { SPACING, RADIUS } from '../../core/constants/sizes';
import { Skeleton, EmptyState, ErrorState } from '../../../ui';

import {
  SlowDraftCard,
  FilterSortBar,
} from './components';
import { useSlowDrafts } from './hooks';

// ============================================================================
// LOADING SKELETON
// ============================================================================

function CardSkeleton(): React.ReactElement {
  return (
    <div
      className={styles.cardSkeletonContainer}
      style={
        {
          '--card-padding-x': SLOW_DRAFT_LAYOUT.cardPaddingX,
          '--card-border-radius': SLOW_DRAFT_LAYOUT.cardBorderRadius,
          '--bg-color-secondary': BG_COLORS.secondary,
        } as React.CSSProperties
      }
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <Skeleton width={180} height={18} />
          <div className={styles.skeletonHeaderMargin}>
            <Skeleton width={120} height={14} />
          </div>
        </div>
        <Skeleton width={80} height={36} borderRadius={8} />
      </div>

      {/* Roster strip */}
      <div className={styles.skeletonRosterMargin}>
        <Skeleton width={60} height={10} />
        <div className={cn('flex gap-1 mt-2', styles.skeletonRosterFlex)}>
          {Array.from({ length: 12 }, (_, i) => (
            <Skeleton key={i} width={20} height={20} borderRadius={4} />
          ))}
        </div>
      </div>

      {/* Position needs */}
      <Skeleton width={200} height={14} />

      {/* Progress */}
      <div className={styles.skeletonProgressMargin}>
        <Skeleton width="100%" height={4} borderRadius={2} />
        <div className={cn('flex justify-between mt-2', styles.skeletonProgressFlex)}>
          <Skeleton width={80} height={12} />
          <Skeleton width={60} height={12} />
        </div>
      </div>
    </div>
  );
}

function LoadingState(): React.ReactElement {
  return (
    <div
      className={styles.loadingStateContainer}
      style={
        {
          '--list-padding-y': SLOW_DRAFT_LAYOUT.listPaddingY,
          '--list-padding-x': SLOW_DRAFT_LAYOUT.listPaddingX,
          '--card-gap': SLOW_DRAFT_LAYOUT.cardGap,
        } as React.CSSProperties
      }
    >
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  );
}

// ============================================================================
// JOIN DRAFT BUTTON
// ============================================================================

interface JoinDraftButtonProps {
  onClick: () => void;
}

function JoinDraftButton({ onClick }: JoinDraftButtonProps): React.ReactElement {
  return (
    <div
      className={styles.joinDraftContainer}
      style={
        {
          '--spacing-lg': SPACING.lg,
        } as React.CSSProperties
      }
    >
      <button
        onClick={onClick}
        className={cn(styles.joinDraftButton, 'w-full font-semibold')}
        style={
          {
            '--radius-lg': RADIUS.lg,
            '--state-color-active': STATE_COLORS.active,
          } as React.CSSProperties
        }
      >
        Join New Slow Draft
      </button>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SlowDraftsTabVX2({
  onEnterDraft,
  onJoinDraft,
  onQuickPick: externalQuickPick,
  userId,
}: SlowDraftsTabProps): React.ReactElement {
  // Data hook with optional userId for real API data
  const {
    isLoading,
    error,
    refetch,
    sortBy,
    filterBy,
    setSortBy,
    setFilterBy,
    counts,
    sortedFilteredDrafts,
    quickPick: hookQuickPick,
  } = useSlowDrafts({ userId });

  // Debug: Log counts when they change
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Counts updated', {
        ...counts,
        sortedFilteredDraftsCount: sortedFilteredDrafts.length,
      });
    }
  }, [counts, sortedFilteredDrafts.length]);

  // Track expanded card
  const [expandedDraftId, setExpandedDraftId] = useState<string | null>(null);

  // Handlers
  const handleToggleExpand = useCallback((draftId: string) => {
    setExpandedDraftId((current) => (current === draftId ? null : draftId));
  }, []);

  const handleEnterDraft = useCallback(
    (draft: SlowDraft) => {
      onEnterDraft?.(draft);
    },
    [onEnterDraft]
  );

  const handleJoinDraft = useCallback(() => {
    onJoinDraft?.();
  }, [onJoinDraft]);

  const handleQuickPick = useCallback(
    async (draftId: string, playerId: string) => {
      try {
        // Use external handler if provided, otherwise use hook's quickPick
        if (externalQuickPick) {
          await externalQuickPick(draftId, playerId);
        } else if (userId) {
          await hookQuickPick(draftId, playerId);
        }
      } catch (err) {
        logger.error('Quick pick failed', err instanceof Error ? err : new Error(String(err)));
      }
    },
    [externalQuickPick, hookQuickPick, userId]
  );

  // ============================================================
  // ERROR STATE
  // ============================================================
  if (error) {
    return (
      <div
        className={cn(styles.errorStateContainer, 'flex-1 flex flex-col items-center justify-center')}
        style={
          {
            '--bg-color-primary': BG_COLORS.primary,
            '--spacing-xl': SPACING.xl,
          } as React.CSSProperties
        }
      >
        <ErrorState
          title="Failed to load drafts"
          description={error}
          onRetry={refetch}
        />
      </div>
    );
  }

  // ============================================================
  // LOADING STATE
  // ============================================================
  if (isLoading && sortedFilteredDrafts.length === 0) {
    return (
      <div
        className={cn(styles.emptyStateWrapper, 'flex-1 flex flex-col')}
        style={
          {
            '--bg-color-primary': BG_COLORS.primary,
          } as React.CSSProperties
        }
      >
        {/* Filter/Sort bar skeleton */}
        <div
          className={styles.filterSortAreaSkeleton}
          style={
            {
              '--spacing-sm': SPACING.sm,
              '--list-padding-x': SLOW_DRAFT_LAYOUT.listPaddingX,
            } as React.CSSProperties
          }
        >
          <div className={cn('flex gap-2', styles.filterSortSkeletonFlex)}>
            <Skeleton width={60} height={32} borderRadius={12} />
            <Skeleton width={80} height={32} borderRadius={12} />
            <Skeleton width={120} height={32} borderRadius={12} />
          </div>
        </div>

        <LoadingState />
      </div>
    );
  }

  // ============================================================
  // EMPTY STATE
  // ============================================================
  if (sortedFilteredDrafts.length === 0 && !isLoading) {
    const isFiltered = filterBy !== 'all';

    return (
      <div
        className={cn(styles.emptyStateWrapper, 'flex-1 flex flex-col')}
        style={
          {
            '--bg-color-primary': BG_COLORS.primary,
          } as React.CSSProperties
        }
      >
        {/* Filter/Sort bar */}
        <FilterSortBar sortBy={sortBy} onSortChange={setSortBy} />

        <div
          className={cn(styles.emptyStateContent, 'flex-1 flex items-center justify-center')}
          style={
            {
              '--spacing-xl': SPACING.xl,
            } as React.CSSProperties
          }
        >
          <EmptyState
            title={isFiltered ? 'No Matching Drafts' : 'No Active Slow Drafts'}
            description={
              isFiltered
                ? 'Try changing your filters to see more drafts.'
                : 'Join a slow draft tournament to get started!'
            }
            action={
              isFiltered
                ? {
                    label: 'Clear Filters',
                    onClick: () => setFilterBy('all'),
                  }
                : onJoinDraft
                ? {
                    label: 'Join Slow Draft',
                    onClick: handleJoinDraft,
                  }
                : undefined
            }
          />
        </div>
      </div>
    );
  }

  // ============================================================
  // MAIN CONTENT
  // ============================================================
  return (
    <div
      className={cn(styles.mainContainer, 'flex-1 flex flex-col')}
      style={
        {
          '--bg-color-primary': BG_COLORS.primary,
        } as React.CSSProperties
      }
      role="main"
      aria-label="Slow drafts"
    >
      {/* Filter/Sort bar */}
      <FilterSortBar sortBy={sortBy} onSortChange={setSortBy} />

      {/* Drafts list */}
      <div
        className={cn(styles.draftsList, 'flex-1 min-h-0 overflow-y-auto')}
        style={
          {
            '--list-padding-x': SLOW_DRAFT_LAYOUT.listPaddingX,
            '--list-padding-y': SLOW_DRAFT_LAYOUT.listPaddingY,
          } as React.CSSProperties
        }
      >
        <div className={styles.draftsListInner}>
          {sortedFilteredDrafts.map((draft) => (
            <SlowDraftCard
              key={draft.id}
              draft={draft}
              isExpanded={expandedDraftId === draft.id}
              onToggleExpand={() => handleToggleExpand(draft.id)}
              onEnterDraft={() => handleEnterDraft(draft)}
              onQuickPick={
                (externalQuickPick || userId)
                  ? (playerId) => handleQuickPick(draft.id, playerId)
                  : undefined
              }
            />
          ))}
        </div>

        {/* Bottom padding */}
        <div
          className={styles.bottomPadding}
          style={
            {
              '--spacing-2xl': SPACING['2xl'],
            } as React.CSSProperties
          }
        />
      </div>

      {/* Join button */}
      {onJoinDraft && <JoinDraftButton onClick={handleJoinDraft} />}
    </div>
  );
}
