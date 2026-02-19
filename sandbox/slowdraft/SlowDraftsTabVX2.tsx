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

import {
  SlowDraftCard,
  FilterSortBar,
} from './components';
import { SLOW_DRAFT_LAYOUT } from './constants';
import { Skeleton, EmptyState, ErrorState } from './deps/components/shared';
import { SPACING, RADIUS } from './deps/core/constants/sizes';
import { useSlowDrafts } from './hooks';
import styles from './SlowDraftsTabVX2.module.css';
import type { SlowDraftsTabProps, SlowDraft } from './types';

// ============================================================================
// LOADING SKELETON
// ============================================================================

function CardSkeleton(): React.ReactElement {
  return (
    <div
      style={{
        padding: SLOW_DRAFT_LAYOUT.cardPaddingX,
        borderRadius: SLOW_DRAFT_LAYOUT.cardBorderRadius,
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <Skeleton width={180} height={18} />
          <div style={{ marginTop: 6 }}>
            <Skeleton width={120} height={14} />
          </div>
        </div>
        <Skeleton width={80} height={36} borderRadius={8} />
      </div>

      {/* Roster strip */}
      <div style={{ marginBottom: 12 }}>
        <Skeleton width={60} height={10} />
        <div className="flex gap-1 mt-2">
          {Array.from({ length: 12 }, (_, i) => (
            <Skeleton key={i} width={20} height={20} borderRadius={4} />
          ))}
        </div>
      </div>

      {/* Position needs */}
      <Skeleton width={200} height={14} />

      {/* Progress */}
      <div style={{ marginTop: 12 }}>
        <Skeleton width="100%" height={4} borderRadius={2} />
        <div className="flex justify-between mt-2">
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
      style={{
        padding: `${SLOW_DRAFT_LAYOUT.listPaddingY}px ${SLOW_DRAFT_LAYOUT.listPaddingX}px`,
        display: 'flex',
        flexDirection: 'column',
        gap: SLOW_DRAFT_LAYOUT.cardGap,
      }}
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
    <div className={styles.joinDraftButtonContainer}>
      <button
        onClick={onClick}
        className={styles.joinDraftButton}
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
  onQuickPick,
}: SlowDraftsTabProps): React.ReactElement {
  // Data hook
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
  } = useSlowDrafts();

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
        await onQuickPick?.(draftId, playerId);
        // Could refresh data here
      } catch (err) {
        console.error('Quick pick failed:', err);
      }
    },
    [onQuickPick]
  );

  // ============================================================
  // ERROR STATE
  // ============================================================
  if (error) {
    return (
      <div className={styles.errorContainer}>
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
      <div className={styles.loadingContainer}>
        {/* Filter/Sort bar skeleton */}
        <div className={styles.skeletonBar}>
          <div className={styles.skeletonBarContent}>
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
      <div className={styles.emptyContainer}>
        {/* Filter/Sort bar */}
        <FilterSortBar sortBy={sortBy} onSortChange={setSortBy} />

        <div className={styles.emptyContentWrapper}>
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
      className={styles.mainContainer}
      role="main"
      aria-label="Slow drafts"
    >
      {/* Filter/Sort bar */}
      <FilterSortBar
        sortBy={sortBy}
        filterBy={filterBy}
        onSortChange={setSortBy}
        onFilterChange={setFilterBy}
        counts={counts}
      />

      {/* Drafts list */}
      <div
        className={styles.draftsList}
        style={{
          paddingLeft: SLOW_DRAFT_LAYOUT.listPaddingX,
          paddingRight: SLOW_DRAFT_LAYOUT.listPaddingX,
          paddingTop: SLOW_DRAFT_LAYOUT.listPaddingY,
          paddingBottom: SLOW_DRAFT_LAYOUT.listPaddingY,
        }}
      >
        <div
          className={styles.draftsListContent}
          style={{
            gap: SLOW_DRAFT_LAYOUT.cardGap,
          }}
        >
          {sortedFilteredDrafts.map((draft) => (
            <SlowDraftCard
              key={draft.id}
              draft={draft}
              isExpanded={expandedDraftId === draft.id}
              onToggleExpand={() => handleToggleExpand(draft.id)}
              onEnterDraft={() => handleEnterDraft(draft)}
              onQuickPick={
                onQuickPick
                  ? (playerId) => handleQuickPick(draft.id, playerId)
                  : undefined
              }
            />
          ))}
        </div>

        {/* Bottom padding */}
        <div className={styles.bottomPadding} />
      </div>

      {/* Join button */}
      {onJoinDraft && <JoinDraftButton onClick={handleJoinDraft} />}
    </div>
  );
}
