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
import type { SlowDraftsTabProps, SlowDraft } from './types';
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
      style={{
        padding: SLOW_DRAFT_LAYOUT.cardPaddingX,
        borderRadius: SLOW_DRAFT_LAYOUT.cardBorderRadius,
        backgroundColor: BG_COLORS.secondary,
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
    <div
      style={{
        padding: SPACING.lg,
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <button
        onClick={onClick}
        className="w-full font-semibold transition-all active:scale-[0.98]"
        style={{
          height: 48,
          borderRadius: RADIUS.lg,
          backgroundColor: STATE_COLORS.active,
          color: '#FFFFFF',
          fontSize: 15,
        }}
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
      console.log('[SlowDraftsTabVX2] Counts updated:', counts, {
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
        console.error('Quick pick failed:', err);
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
        className="flex-1 flex flex-col items-center justify-center"
        style={{ backgroundColor: BG_COLORS.primary, padding: SPACING.xl }}
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
        className="flex-1 flex flex-col"
        style={{ backgroundColor: BG_COLORS.primary }}
      >
        {/* Filter/Sort bar skeleton */}
        <div
          style={{
            padding: `${SPACING.sm}px ${SLOW_DRAFT_LAYOUT.listPaddingX}px`,
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div className="flex gap-2">
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
        className="flex-1 flex flex-col"
        style={{ backgroundColor: BG_COLORS.primary }}
      >
        {/* Filter/Sort bar */}
        <FilterSortBar
          sortBy={sortBy}
          filterBy={filterBy}
          onSortChange={setSortBy}
          onFilterChange={setFilterBy}
          counts={counts}
        />

        <div
          className="flex-1 flex items-center justify-center"
          style={{ padding: SPACING.xl }}
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
      className="flex-1 flex flex-col"
      style={{ backgroundColor: BG_COLORS.primary }}
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
        className="flex-1 min-h-0 overflow-y-auto"
        style={{
          paddingLeft: SLOW_DRAFT_LAYOUT.listPaddingX,
          paddingRight: SLOW_DRAFT_LAYOUT.listPaddingX,
          paddingTop: SLOW_DRAFT_LAYOUT.listPaddingY,
          paddingBottom: SLOW_DRAFT_LAYOUT.listPaddingY,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
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
                (externalQuickPick || userId)
                  ? (playerId) => handleQuickPick(draft.id, playerId)
                  : undefined
              }
            />
          ))}
        </div>

        {/* Bottom padding */}
        <div style={{ height: SPACING['2xl'], flexShrink: 0 }} />
      </div>

      {/* Join button */}
      {onJoinDraft && <JoinDraftButton onClick={handleJoinDraft} />}
    </div>
  );
}
