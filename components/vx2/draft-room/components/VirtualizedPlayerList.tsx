/**
 * VirtualizedPlayerList - Performance-optimized player list
 * 
 * Uses windowed rendering to only render visible rows, significantly
 * improving performance on legacy devices with 500+ players.
 * 
 * Falls back to standard rendering on very small lists or when
 * virtual scrolling is disabled.
 * 
 * A-Grade Requirements:
 * - TypeScript: Full type coverage
 * - Performance: Only renders visible rows
 * - Accessibility: Maintains ARIA labels and keyboard navigation
 * - Legacy Support: Adapts to device capabilities
 * 
 * Created: December 30, 2024
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';

import { cn } from '@/lib/styles';

import { TEXT_COLORS } from '../../core/constants/colors';
import { TYPOGRAPHY } from '../../core/constants/sizes';
import { useDeviceCapabilities, useBatchSize } from '../../hooks/ui/useDeviceCapabilities';
import type { DraftPlayer, Position, PlayerSortOption } from '../types';


import PlayerExpandedCard from './PlayerExpandedCard';
import styles from './VirtualizedPlayerList.module.css';

// ============================================================================
// CONSTANTS
// ============================================================================

const ROW_HEIGHT = 40;
const EXPANDED_CARD_HEIGHT = 280; // Approximate height of expanded card
const OVERSCAN_COUNT = 5; // Rows to render outside visible area
const MIN_VIRTUALIZATION_THRESHOLD = 50; // Don't virtualize small lists

const PLAYER_LIST_PX = {
  searchMarginTop: 12,
  searchMarginX: 8,
  searchHeight: 44,
  searchFontSize: 14,
  clearButtonWidth: 'calc(22.5% - 6px)',
  headerPaddingY: 8,
  adpColumnWidth: 48,
  projColumnWidth: 48,
  rankColumnWidth: 48,
  queueButtonContainerWidth: 36,
  playerNameFontSize: 13,
  playerTeamFontSize: 11,
  playerRankFontSize: 13,
  statFontSize: 13,
} as const;

// Search/row colors come from global tokens (--search-bg, --row-bg) in styles/tokens.css.
// See DRAFT_LIST_THEME in core/constants/colors.ts for the same palette in JS.

const POSITIONS: Position[] = ['QB', 'RB', 'WR', 'TE'];

// ============================================================================
// TYPES
// ============================================================================

export interface VirtualizedPlayerListProps {
  players: DraftPlayer[];
  totalCount: number;
  isLoading: boolean;
  isMyTurn: boolean;
  draftedCounts: Record<Position, number>;
  positionFilters: Position[];
  onToggleFilter: (position: Position) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClearAll: () => void;
  sortOption: PlayerSortOption;
  onSortChange: (option: PlayerSortOption) => void;
  onDraft: (player: DraftPlayer) => void;
  onToggleQueue: (player: DraftPlayer) => void;
  isQueued: (playerId: string) => boolean;
  initialScrollPosition?: number;
  onScrollPositionChange?: (position: number) => void;
  /** Force virtualization on/off (default: auto based on list size) */
  forceVirtualization?: boolean;
}

interface VirtualRowData {
  player: DraftPlayer;
  index: number;
  isExpanded: boolean;
}

// ============================================================================
// VIRTUALIZATION HOOK
// ============================================================================

interface UseVirtualScrollResult {
  visibleRange: { start: number; end: number };
  totalHeight: number;
  offsetY: number;
  handleScroll: (scrollTop: number) => void;
}

function useVirtualScroll(
  itemCount: number,
  containerHeight: number,
  expandedIndex: number | null,
): UseVirtualScrollResult {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleRange = useMemo(() => {
    // Calculate item heights considering expanded row
    const getItemTop = (index: number): number => {
      if (expandedIndex === null || index <= expandedIndex) {
        return index * ROW_HEIGHT;
      }
      // After expanded row, add extra height
      return index * ROW_HEIGHT + EXPANDED_CARD_HEIGHT;
    };
    
    // Find first visible item
    let start = 0;
    for (let i = 0; i < itemCount; i++) {
      if (getItemTop(i + 1) > scrollTop) {
        start = Math.max(0, i - OVERSCAN_COUNT);
        break;
      }
    }
    
    // Find last visible item
    let end = itemCount;
    const visibleBottom = scrollTop + containerHeight;
    for (let i = start; i < itemCount; i++) {
      if (getItemTop(i) > visibleBottom + OVERSCAN_COUNT * ROW_HEIGHT) {
        end = i;
        break;
      }
    }
    
    return { start, end };
  }, [scrollTop, containerHeight, itemCount, expandedIndex]);
  
  const totalHeight = useMemo(() => {
    const baseHeight = itemCount * ROW_HEIGHT;
    return expandedIndex !== null ? baseHeight + EXPANDED_CARD_HEIGHT : baseHeight;
  }, [itemCount, expandedIndex]);
  
  const offsetY = useMemo(() => {
    if (expandedIndex !== null && visibleRange.start > expandedIndex) {
      return visibleRange.start * ROW_HEIGHT + EXPANDED_CARD_HEIGHT;
    }
    return visibleRange.start * ROW_HEIGHT;
  }, [visibleRange.start, expandedIndex]);
  
  const handleScroll = useCallback((newScrollTop: number) => {
    setScrollTop(newScrollTop);
  }, []);
  
  return { visibleRange, totalHeight, offsetY, handleScroll };
}

// ============================================================================
// SUB-COMPONENTS (Memoized for performance)
// ============================================================================

interface FilterButtonProps {
  position: Position;
  count: number;
  isActive: boolean;
  onToggle: () => void;
}

const FilterButton = React.memo(function FilterButton({
  position,
  count,
  isActive,
  onToggle
}: FilterButtonProps): React.ReactElement {
  return (
    <button
      onClick={onToggle}
      aria-label={`Filter by ${position}, ${count} drafted`}
      aria-pressed={isActive}
      className={cn(styles.filterButton, isActive && styles.active)}
      data-position={position.toLowerCase()}
    >
      {position} {count}
    </button>
  );
});

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
}

const SearchBar = React.memo(function SearchBar({
  value,
  onChange,
  onClear
}: SearchBarProps): React.ReactElement {
  return (
    <div className={styles.searchContainer}>
      <div className={styles.searchInputWrapper}>
        <svg
          className={styles.searchInputIcon}
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>

        <input
          type="text"
          className={styles.searchInput}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search..."
          aria-label="Search players"
        />
      </div>

      <button onClick={onClear} className={styles.clearButton}>
        Clear
      </button>
    </div>
  );
});

interface VirtualPlayerRowProps {
  player: DraftPlayer;
  rank: number | null;
  isQueued: boolean;
  onToggleQueue: () => void;
  onRowClick: () => void;
  style?: React.CSSProperties;
}

const VirtualPlayerRow = React.memo(function VirtualPlayerRow({
  player,
  rank,
  isQueued,
  onToggleQueue,
  onRowClick,
  style,
}: VirtualPlayerRowProps): React.ReactElement {
  return (
    <div
      onClick={onRowClick}
      role="row"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onRowClick();
        }
      }}
      className={styles.playerRow}
      style={style}
    >
      {/* ADP Column */}
      <div className={styles.adpColumn}>
        {player.adp?.toFixed(1) || '-'}
      </div>

      {/* Player Info */}
      <div className={styles.playerInfo}>
        <div className={styles.playerName}>
          {player.name}
        </div>
        <div className={styles.playerMetadata}>
          <span
            className={styles.positionBadge}
            data-position={player.position.toLowerCase()}
          >
            {player.position}
          </span>
          <span className={styles.playerTeam}>
            {player.team} ({player.byeWeek || 'TBD'})
          </span>
        </div>
      </div>

      {/* Queue Button */}
      <div className={styles.queueButtonContainer}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleQueue();
          }}
          aria-label={isQueued ? `Remove ${player.name} from queue` : `Add ${player.name} to queue`}
          className={cn(styles.queueButton, isQueued && styles.active)}
        >
          <svg className={styles.queueButtonSvg} viewBox="0 0 12 12">
            {isQueued ? (
              <rect x="1" y="5" width="10" height="2" rx="1" fill={TEXT_COLORS.primary} />
            ) : (
              <>
                <rect x="5" y="1" width="2" height="10" rx="1" fill={TEXT_COLORS.primary} />
                <rect x="1" y="5" width="10" height="2" rx="1" fill={TEXT_COLORS.primary} />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* PROJ Column */}
      <div className={styles.projColumn}>
        {player.projectedPoints ? Math.round(player.projectedPoints) : '-'}
      </div>

      {/* RANK Column */}
      <div className={styles.rankColumn}>
        {rank || '-'}
      </div>
    </div>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function VirtualizedPlayerList({
  players,
  totalCount,
  isLoading,
  isMyTurn,
  draftedCounts,
  positionFilters,
  onToggleFilter,
  searchQuery,
  onSearchChange,
  onClearAll,
  sortOption,
  onSortChange,
  onDraft,
  onToggleQueue,
  isQueued,
  initialScrollPosition = 0,
  onScrollPositionChange,
  forceVirtualization,
}: VirtualizedPlayerListProps): React.ReactElement {
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);
  const [containerHeight, setContainerHeight] = useState(600);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { isLegacyDevice, supportTier } = useDeviceCapabilities();
  const batchSize = useBatchSize();
  
  // Determine if we should virtualize
  const shouldVirtualize = useMemo(() => {
    if (forceVirtualization !== undefined) return forceVirtualization;
    // Always virtualize on legacy devices with large lists
    if (isLegacyDevice && players.length > 30) return true;
    // Virtualize large lists on any device
    return players.length > MIN_VIRTUALIZATION_THRESHOLD;
  }, [forceVirtualization, isLegacyDevice, players.length]);
  
  // Get expanded player index
  const expandedIndex = useMemo(() => {
    if (!expandedPlayerId) return null;
    return players.findIndex(p => p.id === expandedPlayerId);
  }, [expandedPlayerId, players]);
  
  // Virtual scroll state
  const { visibleRange, totalHeight, offsetY, handleScroll } = useVirtualScroll(
    players.length,
    containerHeight,
    expandedIndex,
  );
  
  // Measure container on mount and resize
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const updateHeight = () => {
      setContainerHeight(container.clientHeight);
    };
    
    updateHeight();
    
    // Use ResizeObserver if available
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(updateHeight);
      observer.observe(container);
      return () => observer.disconnect();
    }
    
    // Fallback to window resize
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);
  
  // Restore scroll position on mount
  useEffect(() => {
    if (scrollContainerRef.current && initialScrollPosition > 0) {
      scrollContainerRef.current.scrollTop = initialScrollPosition;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Handle scroll events
  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    handleScroll(scrollTop);
    onScrollPositionChange?.(scrollTop);
  }, [handleScroll, onScrollPositionChange]);
  
  // Sort mode
  type SortMode = 'adp' | 'rank' | 'proj';
  const sortMode: SortMode = useMemo(() => {
    if (sortOption.startsWith('adp')) return 'adp';
    if (sortOption.startsWith('proj')) return 'proj';
    if (sortOption.startsWith('rank')) return 'rank';
    return 'adp';
  }, [sortOption]);
  
  // Sort handlers
  const handleSortRank = useCallback(() => {
    onSortChange(sortOption === 'rank-asc' ? 'rank-desc' : 'rank-asc');
  }, [sortOption, onSortChange]);
  
  const handleSortProj = useCallback(() => {
    onSortChange(sortOption === 'proj-desc' ? 'proj-asc' : 'proj-desc');
  }, [sortOption, onSortChange]);
  
  const handleSortAdp = useCallback(() => {
    onSortChange(sortOption === 'adp-asc' ? 'adp-desc' : 'adp-asc');
  }, [sortOption, onSortChange]);
  
  const handleRowClick = useCallback((playerId: string) => {
    setExpandedPlayerId(prev => prev === playerId ? null : playerId);
  }, []);
  
  // Get visible players
  const visiblePlayers = useMemo(() => {
    if (!shouldVirtualize) return players;
    return players.slice(visibleRange.start, visibleRange.end);
  }, [shouldVirtualize, players, visibleRange]);
  
  return (
    <div className={styles.container}>
      {/* Position Filter Buttons */}
      <div className={styles.filterButtonGroup}>
        {POSITIONS.map(position => (
          <FilterButton
            key={position}
            position={position}
            count={draftedCounts[position] || 0}
            isActive={positionFilters.includes(position)}
            onToggle={() => onToggleFilter(position)}
          />
        ))}
      </div>
      
      {/* Search Bar */}
      <SearchBar
        value={searchQuery}
        onChange={onSearchChange}
        onClear={onClearAll}
      />
      
      {/* Column Headers */}
      <div className={styles.header}>
        <div
          onClick={handleSortAdp}
          className={cn(styles.headerColumn, styles.headerColumnAdp, sortMode === 'adp' && styles.active)}
        >
          <span className={styles.headerColumnLabel}>
            ADP
          </span>
        </div>
        <div className={styles.headerColumnSpacer} />
        <div className={styles.headerColumnQueueSpacer} />
        <div
          onClick={handleSortProj}
          className={cn(styles.headerColumn, styles.headerColumnProj, sortMode === 'proj' && styles.active)}
        >
          <span className={styles.headerColumnLabel}>
            PROJ
          </span>
        </div>
        <div
          onClick={handleSortRank}
          className={cn(styles.headerColumn, styles.headerColumnRank, sortMode === 'rank' && styles.active)}
        >
          <span className={styles.headerColumnLabel}>
            RANK
          </span>
        </div>
      </div>
      
      {/* Virtualized List */}
      <div
        ref={scrollContainerRef}
        onScroll={onScroll}
        role="grid"
        aria-label="Available players"
        aria-rowcount={players.length}
        className={styles.scrollContainer}
      >
        {isLoading ? (
          <div className={styles.emptyState}>
            Loading players...
          </div>
        ) : players.length === 0 ? (
          <div className={styles.emptyState}>
            No players found
          </div>
        ) : shouldVirtualize ? (
          // Virtualized rendering
          <div
            className={styles.virtualizedContent}
            style={{
              '--virtualized-height': `${totalHeight}px`,
            } as React.CSSProperties & { '--virtualized-height': string }}
          >
            <div
              className={styles.virtualizedViewport}
              style={{
                '--viewport-offset': `${offsetY}px`,
              } as React.CSSProperties & { '--viewport-offset': string }}
            >
              {visiblePlayers.map((player, idx) => {
                const actualIndex = visibleRange.start + idx;
                const isExpanded = expandedPlayerId === player.id;
                
                return (
                  <React.Fragment key={player.id}>
                    <VirtualPlayerRow
                      player={player}
                      rank={player.rank ?? null}
                      isQueued={isQueued(player.id)}
                      onToggleQueue={() => onToggleQueue(player)}
                      onRowClick={() => handleRowClick(player.id)}
                    />
                    {isExpanded && (
                      <div className={styles.expandedCardContainer}>
                        <PlayerExpandedCard
                          player={{
                            id: player.id,
                            name: player.name,
                            team: player.team,
                            position: player.position,
                            adp: player.adp,
                            projectedPoints: player.projectedPoints,
                          }}
                          isMyTurn={isMyTurn}
                          onDraft={() => {
                            onDraft(player);
                            setExpandedPlayerId(null);
                          }}
                          onClose={() => setExpandedPlayerId(null)}
                        />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        ) : (
          // Non-virtualized rendering for small lists
          <div className={styles.nonVirtualizedContent}>
            {players.map((player) => (
              <React.Fragment key={player.id}>
                <VirtualPlayerRow
                  player={player}
                  rank={player.rank ?? null}
                  isQueued={isQueued(player.id)}
                  onToggleQueue={() => onToggleQueue(player)}
                  onRowClick={() => handleRowClick(player.id)}
                />
                {expandedPlayerId === player.id && (
                  <div className={styles.expandedCardContainer}>
                    <PlayerExpandedCard
                      player={{
                        id: player.id,
                        name: player.name,
                        team: player.team,
                        position: player.position,
                        adp: player.adp,
                        projectedPoints: player.projectedPoints,
                      }}
                      isMyTurn={isMyTurn}
                      onDraft={() => {
                        onDraft(player);
                        setExpandedPlayerId(null);
                      }}
                      onClose={() => setExpandedPlayerId(null)}
                    />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
      
      {/* Debug info for development */}
      {process.env.NODE_ENV === 'development' && shouldVirtualize && (
        <div className={styles.debugInfo}>
          {visibleRange.start}-{visibleRange.end} / {players.length}
          {isLegacyDevice && ' (legacy)'}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default VirtualizedPlayerList;


