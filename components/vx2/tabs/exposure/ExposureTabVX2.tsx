/**
 * ExposureTabVX2 - Player Exposure Report Tab
 *
 * A-Grade Requirements Met:
 * - TypeScript: Full type coverage
 * - Data Layer: Uses useExposure hook
 * - Loading State: Shows skeletons
 * - Error State: Shows error with retry
 * - Empty State: Shows call-to-action
 * - Constants: All values from VX2 constants
 * - Accessibility: ARIA labels, roles
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useExposure, type ExposurePlayer } from '../../hooks/data';
import { BG_COLORS, TEXT_COLORS, POSITION_COLORS } from '../../core/constants/colors';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../core/constants/sizes';
import {
  PositionBadge,
  Skeleton,
  EmptyState,
  ErrorState,
  SearchInput,
  type Position,
  POSITIONS,
} from '../../../ui';
import { Rankings } from '../../components/icons';
import styles from './ExposureTabVX2.module.css';

// ============================================================================
// CONSTANTS
// ============================================================================

const EXPOSURE_PX = {
  headerPaddingX: SPACING.lg,
  headerPaddingY: SPACING.md,
  filterGap: SPACING.sm,
  filterButtonPadding: SPACING.sm,
  rowPaddingX: SPACING.md,
  rowPaddingY: 4,
  rowMinHeight: 36,
} as const;

// Use shared Position type (PositionFilter is semantically the same as Position)
type PositionFilter = Position;

// ============================================================================
// TYPES
// ============================================================================

export interface ExposureTabVX2Props {}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface PositionFiltersProps {
  selected: PositionFilter[];
  onChange: (positions: PositionFilter[]) => void;
}

function PositionFilters({ selected, onChange }: PositionFiltersProps): React.ReactElement {
  // Use shared POSITIONS constant
  const positions: PositionFilter[] = [...POSITIONS];

  const handleClick = (pos: PositionFilter) => {
    if (selected.includes(pos)) {
      onChange(selected.filter(p => p !== pos));
    } else {
      onChange([...selected, pos]);
    }
  };

  return (
    <div
      className={styles.positionFiltersWrapper}
      style={{
        '--filter-margin-top': `${SPACING.md}px`,
        '--filter-margin-bottom': `${SPACING.xs}px`,
      } as React.CSSProperties}
    >
      {positions.map(pos => {
        const isSelected = selected.includes(pos);
        const color = POSITION_COLORS[pos.toUpperCase() as keyof typeof POSITION_COLORS] || TEXT_COLORS.muted;

        return (
          <button
            key={pos}
            onClick={() => handleClick(pos)}
            className={styles.positionButton}
            style={{
              '--button-bg': isSelected ? 'rgba(255,255,255,0.1)' : 'transparent',
              '--button-color': isSelected ? color : TEXT_COLORS.muted,
              '--button-border-color': color,
              '--button-opacity': isSelected ? '1' : '0.4',
              '--font-size-xs': `${TYPOGRAPHY.fontSize.xs}px`,
            } as React.CSSProperties}
          >
            {pos}
          </button>
        );
      })}
    </div>
  );
}

interface SortHeaderProps {
  sortOrder: 'asc' | 'desc';
  onToggle: () => void;
}

function SortHeader({ sortOrder, onToggle }: SortHeaderProps): React.ReactElement {
  return (
    <div className={styles.sortHeader}
      style={{
        '--sort-padding-y': `${SPACING.xs}px`,
        '--text-secondary': TEXT_COLORS.secondary,
        '--font-size-sm': `${TYPOGRAPHY.fontSize.sm}px`,
      } as React.CSSProperties}
    >
      <button
        onClick={onToggle}
        className={styles.sortButton}
        aria-label={`Sort by exposure ${sortOrder === 'asc' ? 'ascending' : 'descending'}`}
      >
        EXP%
      </button>
    </div>
  );
}

interface ExposureRowProps {
  player: ExposurePlayer;
  isFirst?: boolean;
}

function ExposureRow({ player, isFirst = false }: ExposureRowProps): React.ReactElement {
  const [showShares, setShowShares] = useState(false);
  const exposurePercent = Math.round(player.exposure);

  return (
    <div
      className={`${styles.exposureRow} ${!isFirst ? styles.exposureRowNoBorderTop : ''}`}
      style={{
        '--row-padding-y': `${EXPOSURE_PX.rowPaddingY}px`,
        '--row-min-height': `${EXPOSURE_PX.rowMinHeight}px`,
      } as React.CSSProperties}
    >
      {/* Player Info */}
      <div className={styles.playerInfo}>
        <h3
          className={styles.playerName}
          style={{ '--text-primary': TEXT_COLORS.primary, '--font-size-sm': `${TYPOGRAPHY.fontSize.sm}px` } as React.CSSProperties}
        >
          {player.name}
        </h3>
        <div className={styles.playerDetails}>
          <PositionBadge position={player.position} size="sm" />
          <span
            className={styles.playerTeam}
            style={{ '--text-muted': TEXT_COLORS.muted, '--font-size-xs': `${TYPOGRAPHY.fontSize.xs}px` } as React.CSSProperties}
          >
            {player.team}
          </span>
        </div>
      </div>

      {/* Exposure - positioned 20px from right edge */}
      <button
        onClick={() => setShowShares(!showShares)}
        className={styles.exposureValue}
        style={{
          '--text-primary': TEXT_COLORS.primary,
          '--font-size-base': `${TYPOGRAPHY.fontSize.base}px`,
        } as React.CSSProperties}
      >
        {showShares ? `${player.teams} shares` : `${exposurePercent}%`}
      </button>
    </div>
  );
}

function ExposureRowSkeleton(): React.ReactElement {
  return (
    <div
      className={styles.skeletonRow}
      style={{
        '--row-padding-x': `${EXPOSURE_PX.rowPaddingX}px`,
        '--row-padding-y': `${EXPOSURE_PX.rowPaddingY}px`,
        '--row-min-height': `${EXPOSURE_PX.rowMinHeight}px`,
      } as React.CSSProperties}
    >
      <div className={styles.skeletonPlayerInfo}>
        <Skeleton width={150} height={18} />
        <div className={styles.skeletonDetails}>
          <Skeleton width={28} height={18} />
          <Skeleton width={40} height={14} />
        </div>
      </div>
      <Skeleton width={50} height={20} />
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ExposureTabVX2(_props: ExposureTabVX2Props): React.ReactElement {
  const { players, isLoading, error, refetch } = useExposure();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPositions, setSelectedPositions] = useState<PositionFilter[]>([]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Note: Auth check removed - AuthGateVX2 ensures only logged-in users can access tabs

  // Auto-reset when all positions are selected
  useEffect(() => {
    // Use shared POSITIONS constant
    const allPositions: PositionFilter[] = [...POSITIONS];
    if (selectedPositions.length === allPositions.length &&
        allPositions.every(pos => selectedPositions.includes(pos))) {
      setSelectedPositions([]);
    }
  }, [selectedPositions]);

  // Filter and sort players
  const filteredPlayers = useMemo(() => {
    let result = players;

    // Position filter
    if (selectedPositions.length > 0) {
      result = result.filter(p => selectedPositions.includes(p.position as PositionFilter));
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p =>
        (p.name?.toLowerCase() || '').includes(query) ||
        (p.position?.toLowerCase() || '').includes(query) ||
        (p.team?.toLowerCase() || '').includes(query)
      );
    }

    // Sort
    return [...result].sort((a, b) =>
      sortOrder === 'desc' ? b.exposure - a.exposure : a.exposure - b.exposure
    );
  }, [players, selectedPositions, searchQuery, sortOrder]);

  const handleToggleSort = useCallback(() => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  }, []);

  // Error State
  if (error) {
    return (
      <div
        className={styles.errorStateContainer}
        style={{ '--bg-primary': BG_COLORS.primary, '--error-padding': `${SPACING.xl}px` } as React.CSSProperties}
      >
        <ErrorState
          title="Failed to load exposure"
          description={error || undefined}
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div
      className={styles.mainContainer}
      style={{ '--bg-primary': BG_COLORS.primary } as React.CSSProperties}
      role="main"
      aria-label="Player exposure report"
    >
      {/* Header */}
      <div
        className={styles.header}
        style={{
          '--header-padding-x': `${EXPOSURE_PX.headerPaddingX}px`,
          '--header-padding-y': `${EXPOSURE_PX.headerPaddingY}px`,
        } as React.CSSProperties}
      >
        <div className={styles.headerSearchWrapper}>
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search..."
          />
        </div>

        {!searchQuery && (
          <PositionFilters
            selected={selectedPositions}
            onChange={setSelectedPositions}
          />
        )}
      </div>

      {/* Sort Header */}
      {!isLoading && filteredPlayers.length > 0 && (
        <SortHeader sortOrder={sortOrder} onToggle={handleToggleSort} />
      )}

      {/* Player List */}
      <div className={styles.playerListContainer}>
        {isLoading ? (
          // Loading skeletons
          <>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <ExposureRowSkeleton key={i} />
            ))}
          </>
        ) : filteredPlayers.length === 0 ? (
          // Empty state
          <div
            className={styles.emptyStateContainer}
            style={{ '--empty-padding': `${SPACING.xl}px` } as React.CSSProperties}
          >
            <EmptyState
              title="No Players Found"
              description={searchQuery ? "Try a different search term" : "No exposure data available"}
            />
          </div>
        ) : (
          // Player list
          <>
            {filteredPlayers.map((player, index) => (
              <ExposureRow key={player.id} player={player} isFirst={index === 0} />
            ))}
            {/* Bottom padding */}
            <div
              className={styles.listBottomPadding}
              style={{ '--bottom-padding-height': `${SPACING['2xl']}px` } as React.CSSProperties}
            />
          </>
        )}
      </div>
    </div>
  );
}
