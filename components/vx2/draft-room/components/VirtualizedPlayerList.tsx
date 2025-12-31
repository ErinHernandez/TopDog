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
import type { DraftPlayer, Position, PlayerSortOption } from '../types';
import { POSITION_COLORS } from '../constants';
import { BG_COLORS, TEXT_COLORS } from '../../core/constants/colors';
import { SPACING, TYPOGRAPHY } from '../../core/constants/sizes';
import { useDeviceCapabilities, useBatchSize } from '../../hooks/ui/useDeviceCapabilities';
import PlayerExpandedCard from './PlayerExpandedCard';

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

const PLAYER_LIST_COLORS = {
  searchBg: '#1F2937',
  searchPlaceholder: '#6B7280',
  rowBg: '#1f2833',
  rowBorder: 'rgba(255, 255, 255, 0.1)',
} as const;

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
  const color = POSITION_COLORS[position];
  
  return (
    <button
      onClick={onToggle}
      aria-label={`Filter by ${position}, ${count} drafted`}
      aria-pressed={isActive}
      className="flex-1 py-2.5 px-3 font-bold transition-all"
      style={{
        fontSize: `${TYPOGRAPHY.fontSize.xs}px`,
        backgroundColor: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
        color: isActive ? color : TEXT_COLORS.muted,
        borderBottom: `2px solid ${color}`,
        opacity: isActive ? 1 : 0.4,
        cursor: 'pointer',
      }}
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
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginTop: PLAYER_LIST_PX.searchMarginTop,
        marginLeft: PLAYER_LIST_PX.searchMarginX,
        marginRight: PLAYER_LIST_PX.searchMarginX,
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          height: PLAYER_LIST_PX.searchHeight,
          backgroundColor: PLAYER_LIST_COLORS.searchBg,
          borderRadius: 8,
          paddingLeft: 12,
          paddingRight: 12,
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke={PLAYER_LIST_COLORS.searchPlaceholder}
          strokeWidth="2"
          style={{ marginRight: 8, flexShrink: 0 }}
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
          style={{
            flex: 1,
            border: 'none',
            background: 'transparent',
            color: TEXT_COLORS.primary,
            fontSize: PLAYER_LIST_PX.searchFontSize,
            outline: 'none',
          }}
        />
      </div>
      
      <button
        onClick={onClear}
        style={{
          width: PLAYER_LIST_PX.clearButtonWidth,
          height: PLAYER_LIST_PX.searchHeight,
          backgroundColor: PLAYER_LIST_COLORS.searchBg,
          border: 'none',
          borderRadius: 8,
          color: TEXT_COLORS.primary,
          fontSize: 14,
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
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
  style: React.CSSProperties;
}

const VirtualPlayerRow = React.memo(function VirtualPlayerRow({ 
  player, 
  rank, 
  isQueued, 
  onToggleQueue,
  onRowClick,
  style,
}: VirtualPlayerRowProps): React.ReactElement {
  const positionColor = POSITION_COLORS[player.position];
  
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
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        height: ROW_HEIGHT,
        backgroundColor: PLAYER_LIST_COLORS.rowBg,
        cursor: 'pointer',
        borderBottom: `1px solid ${PLAYER_LIST_COLORS.rowBorder}`,
      }}
    >
      {/* ADP Column */}
      <div style={{ 
        width: PLAYER_LIST_PX.adpColumnWidth, 
        textAlign: 'center', 
        fontSize: PLAYER_LIST_PX.statFontSize, 
        color: '#9CA3AF', 
        fontVariantNumeric: 'tabular-nums',
        flexShrink: 0,
      }}>
        {player.adp?.toFixed(1) || '-'}
      </div>
      
      {/* Player Info */}
      <div style={{ flex: 1, paddingLeft: 10, paddingRight: 8, minWidth: 0 }}>
        <div
          style={{
            fontSize: PLAYER_LIST_PX.playerNameFontSize,
            fontWeight: 500,
            color: TEXT_COLORS.primary,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {player.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1px 5px',
              borderRadius: 3,
              backgroundColor: positionColor,
              color: '#000000',
              fontSize: 10,
              fontWeight: 700,
            }}
          >
            {player.position}
          </span>
          <span style={{ fontSize: PLAYER_LIST_PX.playerTeamFontSize, color: TEXT_COLORS.secondary }}>
            {player.team} ({player.byeWeek || 'TBD'})
          </span>
        </div>
      </div>
      
      {/* Queue Button */}
      <div style={{ width: PLAYER_LIST_PX.queueButtonContainerWidth, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleQueue();
          }}
          aria-label={isQueued ? `Remove ${player.name} from queue` : `Add ${player.name} to queue`}
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            border: `2px solid ${isQueued ? '#60A5FA' : '#6B7280'}`,
            backgroundColor: isQueued ? 'rgba(96, 165, 250, 0.2)' : 'transparent',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 0,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            {isQueued ? (
              <rect x="1" y="5" width="10" height="2" rx="1" fill="#FFFFFF" />
            ) : (
              <>
                <rect x="5" y="1" width="2" height="10" rx="1" fill="#FFFFFF" />
                <rect x="1" y="5" width="10" height="2" rx="1" fill="#FFFFFF" />
              </>
            )}
          </svg>
        </button>
      </div>
      
      {/* PROJ Column */}
      <div style={{ 
        width: PLAYER_LIST_PX.projColumnWidth, 
        textAlign: 'right', 
        paddingRight: 8,
        fontSize: PLAYER_LIST_PX.statFontSize, 
        color: TEXT_COLORS.secondary, 
        fontVariantNumeric: 'tabular-nums',
        flexShrink: 0,
      }}>
        {player.projectedPoints ? Math.round(player.projectedPoints) : '-'}
      </div>
      
      {/* RANK Column */}
      <div style={{ 
        width: PLAYER_LIST_PX.rankColumnWidth, 
        textAlign: 'center', 
        paddingRight: 4,
        fontSize: PLAYER_LIST_PX.playerRankFontSize, 
        color: TEXT_COLORS.secondary, 
        fontVariantNumeric: 'tabular-nums',
        flexShrink: 0,
      }}>
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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: BG_COLORS.primary,
      }}
    >
      {/* Position Filter Buttons */}
      <div 
        className="flex rounded-lg overflow-hidden"
        style={{ 
          backgroundColor: 'rgba(255,255,255,0.05)',
          marginTop: `${SPACING.md}px`,
          marginBottom: `${SPACING.xs}px`,
        }}
      >
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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: `${PLAYER_LIST_PX.headerPaddingY}px 4px`,
          borderBottom: `1px solid ${PLAYER_LIST_COLORS.rowBorder}`,
          backgroundColor: BG_COLORS.primary,
        }}
      >
        <div
          onClick={handleSortAdp}
          style={{
            width: PLAYER_LIST_PX.adpColumnWidth,
            textAlign: 'center',
            fontSize: 14,
            fontWeight: 500,
            color: sortMode === 'adp' ? TEXT_COLORS.primary : TEXT_COLORS.secondary,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <span style={{
            borderBottom: sortMode === 'adp' ? '2px solid #6B7280' : '2px solid transparent',
            paddingBottom: 2,
          }}>
            ADP
          </span>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ width: PLAYER_LIST_PX.queueButtonContainerWidth, flexShrink: 0 }} />
        <div
          onClick={handleSortProj}
          style={{
            width: PLAYER_LIST_PX.projColumnWidth,
            textAlign: 'center',
            fontSize: 13,
            fontWeight: 500,
            color: sortMode === 'proj' ? TEXT_COLORS.primary : TEXT_COLORS.secondary,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <span style={{
            borderBottom: sortMode === 'proj' ? '2px solid #6B7280' : '2px solid transparent',
            paddingBottom: 2,
          }}>
            PROJ
          </span>
        </div>
        <div
          onClick={handleSortRank}
          style={{
            width: PLAYER_LIST_PX.rankColumnWidth,
            textAlign: 'center',
            fontSize: 13,
            fontWeight: 500,
            color: sortMode === 'rank' ? TEXT_COLORS.primary : TEXT_COLORS.secondary,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <span style={{
            borderBottom: sortMode === 'rank' ? '2px solid #6B7280' : '2px solid transparent',
            paddingBottom: 2,
          }}>
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
        style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          position: 'relative',
        }}
        className="hide-scrollbar"
      >
        {isLoading ? (
          <div style={{ padding: 24, textAlign: 'center', color: TEXT_COLORS.secondary }}>
            Loading players...
          </div>
        ) : players.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: TEXT_COLORS.secondary }}>
            No players found
          </div>
        ) : shouldVirtualize ? (
          // Virtualized rendering
          <div
            style={{
              height: totalHeight,
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: offsetY,
                left: 0,
                right: 0,
              }}
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
                      style={{}}
                    />
                    {isExpanded && (
                      <div style={{ padding: '8px 4px' }}>
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
          <div style={{ paddingBottom: 24 }}>
            {players.map((player) => (
              <React.Fragment key={player.id}>
                <VirtualPlayerRow
                  player={player}
                  rank={player.rank ?? null}
                  isQueued={isQueued(player.id)}
                  onToggleQueue={() => onToggleQueue(player)}
                  onRowClick={() => handleRowClick(player.id)}
                  style={{}}
                />
                {expandedPlayerId === player.id && (
                  <div style={{ padding: '8px 4px' }}>
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
        <div style={{ 
          position: 'absolute', 
          bottom: 4, 
          right: 4, 
          fontSize: 10, 
          color: '#666',
          background: 'rgba(0,0,0,0.5)',
          padding: '2px 4px',
          borderRadius: 2,
        }}>
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

