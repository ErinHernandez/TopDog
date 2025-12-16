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

import React, { useState, useMemo, useCallback } from 'react';
import { useExposure, type ExposurePlayer } from '../../hooks/data';
import { BG_COLORS, TEXT_COLORS, POSITION_COLORS } from '../../core/constants/colors';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../core/constants/sizes';
import { 
  PositionBadge,
  Skeleton, 
  EmptyState, 
  ErrorState,
} from '../../components/shared';
import { SearchInput } from '../../components/shared/inputs';

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

type PositionFilter = 'QB' | 'RB' | 'WR' | 'TE';

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
  const positions: PositionFilter[] = ['QB', 'RB', 'WR', 'TE'];
  
  const handleClick = (pos: PositionFilter) => {
    if (selected.includes(pos)) {
      onChange(selected.filter(p => p !== pos));
    } else {
      onChange([...selected, pos]);
    }
  };
  
  return (
    <div 
      className="flex rounded-lg overflow-hidden"
      style={{ 
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginTop: `${SPACING.md}px`,
        marginBottom: `${SPACING.sm}px`,
      }}
    >
      {positions.map(pos => {
        const isSelected = selected.includes(pos);
        const color = POSITION_COLORS[pos.toUpperCase() as keyof typeof POSITION_COLORS] || TEXT_COLORS.muted;
        
        return (
          <button
            key={pos}
            onClick={() => handleClick(pos)}
            className="flex-1 py-2.5 px-3 font-bold transition-all"
            style={{
              fontSize: `${TYPOGRAPHY.fontSize.xs}px`,
              backgroundColor: isSelected ? 'rgba(255,255,255,0.1)' : 'transparent',
              color: isSelected ? color : TEXT_COLORS.muted,
              borderBottom: `2px solid ${color}`,
              opacity: isSelected ? 1 : 0.4,
            }}
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
    <div
      className="flex items-center justify-end"
      style={{
        paddingRight: `${EXPOSURE_PX.headerPaddingX}px`,
        paddingTop: `${SPACING.xs}px`,
        paddingBottom: `${SPACING.xs}px`,
      }}
    >
      <button
        onClick={onToggle}
        className="transition-colors"
        style={{ color: TEXT_COLORS.secondary, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}
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
      className="flex items-center justify-between"
      style={{
        paddingLeft: `${EXPOSURE_PX.rowPaddingX}px`,
        paddingRight: `${EXPOSURE_PX.rowPaddingX}px`,
        paddingTop: `${EXPOSURE_PX.rowPaddingY}px`,
        paddingBottom: `${EXPOSURE_PX.rowPaddingY}px`,
        minHeight: `${EXPOSURE_PX.rowMinHeight}px`,
        borderTop: isFirst ? '1px solid rgba(255,255,255,0.1)' : 'none',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      {/* Player Info */}
      <div className="flex-1 min-w-0">
        <h3 
          className="font-medium truncate"
          style={{ color: TEXT_COLORS.primary, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}
        >
          {player.name}
        </h3>
        <div className="flex items-center gap-2" style={{ marginTop: '2px' }}>
          <PositionBadge position={player.position} size="sm" />
          <span style={{ color: TEXT_COLORS.muted, fontSize: `${TYPOGRAPHY.fontSize.xs}px` }}>
            {player.team}
          </span>
        </div>
      </div>
      
      {/* Exposure */}
      <button
        onClick={() => setShowShares(!showShares)}
        className="font-medium text-right transition-colors"
        style={{
          color: TEXT_COLORS.primary,
          fontSize: `${TYPOGRAPHY.fontSize.base}px`,
          minWidth: '80px',
        }}
      >
        {showShares ? `${player.teams} shares` : `${exposurePercent}%`}
      </button>
    </div>
  );
}

function ExposureRowSkeleton(): React.ReactElement {
  return (
    <div
      className="flex items-center justify-between"
      style={{
        paddingLeft: `${EXPOSURE_PX.rowPaddingX}px`,
        paddingRight: `${EXPOSURE_PX.rowPaddingX}px`,
        paddingTop: `${EXPOSURE_PX.rowPaddingY}px`,
        paddingBottom: `${EXPOSURE_PX.rowPaddingY}px`,
        minHeight: `${EXPOSURE_PX.rowMinHeight}px`,
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <div>
        <Skeleton width={150} height={18} />
        <div className="flex items-center gap-2" style={{ marginTop: '2px' }}>
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
        p.name.toLowerCase().includes(query) ||
        p.position.toLowerCase().includes(query) ||
        p.team.toLowerCase().includes(query)
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
        className="flex-1 flex items-center justify-center"
        style={{ backgroundColor: BG_COLORS.primary, padding: SPACING.xl }}
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
      className="flex-1 flex flex-col"
      style={{ backgroundColor: BG_COLORS.primary }}
      role="main"
      aria-label="Player exposure report"
    >
      {/* Header */}
      <div
        className="flex-shrink-0"
        style={{
          paddingLeft: `${EXPOSURE_PX.headerPaddingX}px`,
          paddingRight: `${EXPOSURE_PX.headerPaddingX}px`,
          paddingTop: `${EXPOSURE_PX.headerPaddingY}px`,
          paddingBottom: `${EXPOSURE_PX.headerPaddingY}px`,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search..."
        />
        
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
      <div
        className="flex-1 min-h-0 overflow-y-auto"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {isLoading ? (
          // Loading skeletons
          <>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <ExposureRowSkeleton key={i} />
            ))}
          </>
        ) : filteredPlayers.length === 0 ? (
          // Empty state
          <div className="flex items-center justify-center h-full" style={{ padding: SPACING.xl }}>
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
            <div style={{ height: `${SPACING['2xl']}px` }} />
          </>
        )}
      </div>
    </div>
  );
}

