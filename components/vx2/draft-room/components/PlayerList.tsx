/**
 * PlayerList - Available players list (VX2)
 * 
 * Pixel-matched to VX PlayerListVX.tsx styling:
 * - Position filter buttons with colored borders and count
 * - Search bar with Clear button
 * - Column headers: RANK | (player info) | PROJ | ADP
 * - Player rows with expandable details
 * 
 * A-Grade Requirements:
 * - TypeScript: Full type coverage
 * - Constants: Pixel-perfect values from VX
 * - Accessibility: ARIA labels, keyboard navigation
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { VariableSizeList as List } from 'react-window';

import { cn } from '@/lib/utils';

import { TOUCH_TARGETS, TYPOGRAPHY } from '../../core/constants/sizes';
import type { DraftPlayer, Position, PlayerSortOption } from '../types';

import PlayerExpandedCard from './PlayerExpandedCard';
import styles from './PlayerList.module.css';

// ============================================================================
// PIXEL-PERFECT CONSTANTS (matched from VX PlayerListVX.tsx)
// ============================================================================

const PLAYER_LIST_PX = {
  // Filter buttons (matched from VX)
  filterMarginTop: 4,
  filterHeight: 44,
  filterBorderWidth: 3,
  filterMargin: 2,
  filterFontSize: 14,
  filterCountFontSize: 13,
  
  // Search bar (matched from VX: mx-2 mt-3 mb-1)
  searchMarginTop: 12,
  searchMarginX: 8,
  searchHeight: 44,
  searchFontSize: 14,
  clearButtonWidth: 'calc(22.5% - 6px)',
  
  // Column headers (matched from VX: px-3 py-2)
  headerPaddingX: 12,
  headerPaddingY: 8,
  headerFontSize: 13,        // VX: FONT_SIZE.columnHeader = '13px'
  headerFontSizeActive: 16,
  rankColumnWidth: 48,
  projColumnWidth: 48,
  adpColumnWidth: 48,
  
  // Player rows (matched from VX: MOBILE.playerCard.height = '40px')
  rowHeight: 40,             // VX: 40px (was 56px)
  rowPaddingX: 12,           // VX: px-3 = 12px
  playerNameFontSize: 13,    // VX: FONT_SIZE.playerName = '13px'
  playerTeamFontSize: 11,    // VX: FONT_SIZE.playerTeam = '11px'
  playerRankFontSize: 13,    // VX: FONT_SIZE.playerRank = '13px'
  queueButtonContainerWidth: 36,  // Narrower to shift button left
  queueButtonSize: 28,       // VX: width/height: '28px'
  statFontSize: 13,
} as const;

// Search/row/queue colors come from global tokens (--search-bg, --row-bg, etc.) in styles/tokens.css.
// See DRAFT_LIST_THEME in core/constants/colors.ts for the same palette in JS.

const POSITIONS: Position[] = ['QB', 'RB', 'WR', 'TE'];

// ============================================================================
// TYPES
// ============================================================================

export interface PlayerListProps {
  /** Available players */
  players: DraftPlayer[];
  /** Total available count before filters */
  totalCount: number;
  /** Loading state */
  isLoading: boolean;
  /** Whether it's the user's turn */
  isMyTurn: boolean;
  /** Drafted position counts */
  draftedCounts: Record<Position, number>;
  
  /** Active position filters */
  positionFilters: Position[];
  /** Toggle position filter */
  onToggleFilter: (position: Position) => void;
  
  /** Current search query */
  searchQuery: string;
  /** Update search query */
  onSearchChange: (query: string) => void;
  
  /** Clear all filters */
  onClearAll: () => void;
  
  /** Current sort option */
  sortOption: PlayerSortOption;
  /** Update sort option */
  onSortChange: (option: PlayerSortOption) => void;
  
  /** Draft a player */
  onDraft: (player: DraftPlayer) => void;
  /** Add/remove player from queue */
  onToggleQueue: (player: DraftPlayer) => void;
  /** Check if player is queued */
  isQueued: (playerId: string) => boolean;
  
  /** Initial scroll position to restore */
  initialScrollPosition?: number;
  /** Callback when scroll position changes */
  onScrollPositionChange?: (position: number) => void;
}

type SortMode = 'adp' | 'rank' | 'proj';

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

// --- Position Filter Button ---
interface FilterButtonProps {
  position: Position;
  count: number;
  isActive: boolean;
  onToggle: () => void;
}

const FilterButton = React.memo(function FilterButton({ position, count, isActive, onToggle }: FilterButtonProps): React.ReactElement {
  return (
    <button
      onClick={onToggle}
      aria-label={`Filter by ${position}, ${count} drafted`}
      aria-pressed={isActive}
      className={cn(
        styles.filterButton,
        isActive ? styles.filterButtonActive : styles.filterButtonInactive
      )}
      data-position={position.toLowerCase()}
    >
      <span>{position}</span>
      <span className={styles.filterCount}>{count}</span>
    </button>
  );
});

// --- Search Bar ---
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
}

const SearchBar = React.memo(function SearchBar({ value, onChange, onClear }: SearchBarProps): React.ReactElement {
  return (
    <div className={styles.searchContainer}>
      {/* Search Input */}
      <div className={styles.searchInputWrapper}>
        {/* Search Icon */}
        <svg
          className={styles.searchIcon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>

        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search..."
          aria-label="Search players"
          className={styles.searchInput}
        />
      </div>

      {/* Clear Button */}
      <button
        onClick={onClear}
        className={styles.clearButton}
      >
        Clear
      </button>
    </div>
  );
});

// --- Column Headers ---
// Table-based layout for guaranteed column alignment
// Headers are integrated into the table structure

// --- Virtualized Player List ---
// PERFORMANCE: Uses react-window to only render visible rows
// This dramatically reduces render time for 400+ player lists

const EXPANDED_ROW_HEIGHT = 180; // Approximate height of expanded card

interface VirtualizedPlayerListProps {
  players: DraftPlayer[];
  expandedPlayerId: string | null;
  isQueued: (playerId: string) => boolean;
  isMyTurn: boolean;
  sortMode: SortMode;
  onToggleQueue: (player: DraftPlayer) => void;
  onRowClick: (playerId: string) => void;
  onDraft: (player: DraftPlayer) => void;
  onSortAdp: () => void;
  onSortProj: () => void;
  onSortRank: () => void;
  onExpandedClose: () => void;
  initialScrollOffset?: number;
  onScroll?: (position: number) => void;
}

const VirtualizedPlayerList = React.memo(function VirtualizedPlayerList({
  players,
  expandedPlayerId,
  isQueued,
  isMyTurn,
  sortMode,
  onToggleQueue,
  onRowClick,
  onDraft,
  onSortAdp,
  onSortProj,
  onSortRank,
  onExpandedClose,
  initialScrollOffset = 0,
  onScroll,
}: VirtualizedPlayerListProps): React.ReactElement {
  const listRef = useRef<List>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(400);

  // Measure container height
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight - 40); // Subtract header height
      }
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Reset list when expanded player changes (to recalculate row sizes)
  useEffect(() => {
    if (listRef.current) {
      listRef.current.resetAfterIndex(0);
    }
  }, [expandedPlayerId]);

  // Calculate row height - variable based on expanded state
  const getItemSize = useCallback((index: number) => {
    const player = players[index];
    if (player && player.id === expandedPlayerId) {
      return PLAYER_LIST_PX.rowHeight + EXPANDED_ROW_HEIGHT;
    }
    return PLAYER_LIST_PX.rowHeight;
  }, [players, expandedPlayerId]);

  // Handle scroll events
  const handleScroll = useCallback(({ scrollOffset }: { scrollOffset: number }) => {
    if (onScroll) {
      onScroll(scrollOffset);
    }
  }, [onScroll]);

  // Row renderer for react-window
  const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const player = players[index];
    if (!player) return null;
    const isExpanded = player.id === expandedPlayerId;

    return (
      <div style={style}>
        <PlayerRowDiv
          player={player}
          rank={player.rank ?? null}
          isQueued={isQueued(player.id)}
          onToggleQueue={() => onToggleQueue(player)}
          onRowClick={() => onRowClick(player.id)}
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
                onExpandedClose();
              }}
              onClose={onExpandedClose}
            />
          </div>
        )}
      </div>
    );
  }, [players, expandedPlayerId, isQueued, isMyTurn, onToggleQueue, onRowClick, onDraft, onExpandedClose]);

  return (
    <div ref={containerRef} className={styles.listContainer}>
      {/* Sticky Header */}
      <div className={styles.headerRow}>
        <div
          onClick={onSortAdp}
          className={cn(
            styles.headerColumn,
            styles.adpColumn,
            sortMode === 'adp' && styles.headerColumnActive
          )}
        >
          <span className={sortMode === 'adp' ? styles.headerColumnSortIndicator : undefined}>
            ADP
          </span>
        </div>
        <div className={styles.playerInfoColumn} />
        <div className={styles.queueButtonColumn} />
        <div
          onClick={onSortProj}
          className={cn(
            styles.headerColumn,
            styles.projColumn,
            sortMode === 'proj' && styles.headerColumnActive
          )}
        >
          <span className={sortMode === 'proj' ? styles.headerColumnSortIndicator : undefined}>
            PROJ
          </span>
        </div>
        <div
          onClick={onSortRank}
          className={cn(
            styles.headerColumn,
            styles.rankColumn,
            sortMode === 'rank' && styles.headerColumnActive
          )}
        >
          <span className={sortMode === 'rank' ? styles.headerColumnSortIndicator : undefined}>
            RANK
          </span>
        </div>
      </div>

      {/* Virtualized List */}
      <List
        ref={listRef}
        height={containerHeight}
        itemCount={players.length}
        itemSize={getItemSize}
        width="100%"
        initialScrollOffset={initialScrollOffset}
        onScroll={handleScroll}
        overscanCount={5}
        className={styles.virtualizedList}
      >
        {Row}
      </List>
    </div>
  );
});

// --- Player Row (Div-based for virtualization) ---
interface PlayerRowDivProps {
  player: DraftPlayer;
  rank: number | null;
  isQueued: boolean;
  onToggleQueue: () => void;
  onRowClick: () => void;
}

const PlayerRowDiv = React.memo(function PlayerRowDiv({
  player,
  rank,
  isQueued,
  onToggleQueue,
  onRowClick,
}: PlayerRowDivProps): React.ReactElement {
  return (
    <div
      onClick={onRowClick}
      className={styles.playerRow}
    >
      {/* ADP Column */}
      <div className={cn(styles.playerAdpValue, styles.adpColumn)}>
        {player.adp?.toFixed(1) || '-'}
      </div>

      {/* Player Info */}
      <div className={styles.playerInfoContainer}>
        <div className={styles.playerNameContainer}>
          <div className={styles.playerName}>
            {player.name}
          </div>
          <div className={styles.playerPositionTeam}>
            <span className={styles.playerPosition} data-position={player.position.toLowerCase()}>
              {player.position}
            </span>
            <span>{player.team}</span>
          </div>
        </div>
      </div>

      {/* Queue Button */}
      <div className={styles.queueButtonContainer}>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleQueue(); }}
          aria-label={isQueued ? 'Remove from queue' : 'Add to queue'}
          className={cn(
            styles.queueButton,
            isQueued ? styles.queueButtonActive : styles.queueButtonInactive
          )}
        >
          {isQueued ? '✓' : '+'}
        </button>
      </div>

      {/* PROJ Column */}
      <div className={cn(styles.playerProjValue, styles.projColumn)}>
        {player.projectedPoints?.toFixed(1) || '-'}
      </div>

      {/* RANK Column */}
      <div className={cn(styles.playerRankValue, styles.rankColumn)}>
        {rank || '-'}
      </div>
    </div>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const PlayerList = React.memo(function PlayerList({
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
}: PlayerListProps): React.ReactElement {
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Restore scroll position on mount
  useEffect(() => {
    if (scrollContainerRef.current && initialScrollPosition > 0) {
      scrollContainerRef.current.scrollTop = initialScrollPosition;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Save scroll position on scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (onScrollPositionChange) {
      onScrollPositionChange(e.currentTarget.scrollTop);
    }
  }, [onScrollPositionChange]);
  
  // Determine current sort mode and direction
  const sortMode: SortMode = useMemo(() => {
    if (sortOption.startsWith('adp')) return 'adp';
    if (sortOption.startsWith('proj')) return 'proj';
    if (sortOption.startsWith('rank')) return 'rank';
    return 'adp';
  }, [sortOption]);
  
  const sortDirection = sortOption.endsWith('desc') ? 'desc' : 'asc';
  
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
  
  return (
    <div className={styles.mainContainer}>
      {/* Position Filter Buttons */}
      <div className={styles.filterContainer}>
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
      <div className={styles.searchBarWrapper}>
        <SearchBar
          value={searchQuery}
          onChange={onSearchChange}
          onClear={onClearAll}
        />
      </div>

      {/* Player Table with integrated headers */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className={styles.listContainer}
      >
        {isLoading ? (
          <div className={styles.emptyState}>
            Loading players...
          </div>
        ) : players.length === 0 ? (
          <div className={styles.emptyState}>
            No players found
          </div>
        ) : (
          <VirtualizedPlayerList
            players={players}
            expandedPlayerId={expandedPlayerId}
            isQueued={isQueued}
            isMyTurn={isMyTurn}
            sortMode={sortMode}
            onToggleQueue={onToggleQueue}
            onRowClick={handleRowClick}
            onDraft={onDraft}
            onSortAdp={handleSortAdp}
            onSortProj={handleSortProj}
            onSortRank={handleSortRank}
            onExpandedClose={() => setExpandedPlayerId(null)}
            initialScrollOffset={initialScrollPosition}
            onScroll={onScrollPositionChange}
          />
        )}
      </div>
    </div>
  );
});

export default PlayerList;
