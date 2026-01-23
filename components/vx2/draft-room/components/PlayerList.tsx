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
import type { DraftPlayer, Position, PlayerSortOption } from '../types';
import { POSITION_COLORS } from '../constants';
import { BG_COLORS, TEXT_COLORS } from '../../core/constants/colors';
import { TOUCH_TARGETS, SPACING, RADIUS, TYPOGRAPHY } from '../../core/constants/sizes';
import PlayerExpandedCard from './PlayerExpandedCard';

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

const PLAYER_LIST_COLORS = {
  filterBg: 'transparent',
  filterActiveBg: 'currentColor',
  searchBg: '#1F2937',
  searchPlaceholder: '#6B7280',
  rowBg: '#1f2833',           // VX: BG_COLORS.card for player rows
  rowBorder: 'rgba(255, 255, 255, 0.1)',
  queueButtonBorder: '#6B7280',
  queueButtonActiveBorder: '#3B82F6',
  queueButtonActiveBg: 'rgba(59, 130, 246, 0.2)',
} as const;

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

function FilterButton({ position, count, isActive, onToggle }: FilterButtonProps): React.ReactElement {
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
        minWidth: 0,
        flex: 1,
      }}
    >
      {position} {count}
    </button>
  );
}

// --- Search Bar ---
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
}

function SearchBar({ value, onChange, onClear }: SearchBarProps): React.ReactElement {
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
      {/* Search Input */}
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
        {/* Search Icon */}
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
      
      {/* Clear Button */}
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
}

// --- Column Headers ---
// Table-based layout for guaranteed column alignment
// Headers are integrated into the table structure

// --- Player Row ---
interface PlayerRowProps {
  player: DraftPlayer;
  rank: number | null;
  isQueued: boolean;
  onToggleQueue: () => void;
  onRowClick: () => void;
}

function PlayerRow({ 
  player, 
  rank, 
  isQueued, 
  onToggleQueue,
  onRowClick,
}: PlayerRowProps): React.ReactElement {
  const positionColor = POSITION_COLORS[player.position];
  
  const cellStyle: React.CSSProperties = {
    padding: '0 4px',
    verticalAlign: 'middle',
  };
  
  return (
    <tr
      onClick={onRowClick}
      style={{
        height: PLAYER_LIST_PX.rowHeight,
        backgroundColor: PLAYER_LIST_COLORS.rowBg,
        cursor: 'pointer',
        borderBottom: `1px solid ${PLAYER_LIST_COLORS.rowBorder}`,
      }}
    >
      {/* ADP Column */}
      <td style={{ ...cellStyle, textAlign: 'center', padding: '0 4px', fontSize: PLAYER_LIST_PX.statFontSize, color: '#9CA3AF', fontVariantNumeric: 'tabular-nums' }}>
        {player.adp?.toFixed(1) || '-'}
      </td>
      
      {/* Player Info */}
      <td style={{ ...cellStyle, paddingLeft: 10, paddingRight: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
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
        </div>
      </td>
      
      {/* Queue Action */}
      <td>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
          }}
        >
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
              marginLeft: -10, // Moved right 4px (was -14)
              marginRight: 14,
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
      </td>
      
      {/* PROJ Column */}
      <td style={{ ...cellStyle, textAlign: 'right', paddingRight: 12, fontSize: PLAYER_LIST_PX.statFontSize, color: TEXT_COLORS.secondary, fontVariantNumeric: 'tabular-nums' }}>
        {player.projectedPoints ? Math.round(player.projectedPoints) : '-'}
      </td>
      
      {/* RANK Column */}
      <td style={{ ...cellStyle, textAlign: 'center', padding: '0 4px', fontSize: PLAYER_LIST_PX.playerRankFontSize, color: TEXT_COLORS.secondary, fontVariantNumeric: 'tabular-nums' }}>
        {rank || '-'}
      </td>
    </tr>
  );
}

// ============================================================================
// MAIN COMPONENT  
// ============================================================================

export default function PlayerList({
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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        backgroundColor: BG_COLORS.primary,
        paddingTop: 0,
        paddingLeft: `${SPACING.xs}px`,
        paddingRight: `${SPACING.xs}px`,
      }}
    >
      {/* Position Filter Buttons */}
      <div 
        className="flex rounded-lg overflow-hidden"
        style={{ 
          backgroundColor: 'rgba(255,255,255,0.05)',
          position: 'relative',
          top: '0px',
          marginTop: 0,
          marginBottom: `${SPACING.xs}px`,
          width: '100%',
          overflow: 'hidden',
          flexShrink: 0,
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
      <div style={{ flexShrink: 0 }}>
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
        style={{
          flex: '1 1 0',
          minHeight: 0,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          paddingBottom: 24,
        }}
      >
        <style>{`
          .player-table-container::-webkit-scrollbar {
            display: none !important;
          }
        `}</style>
        
        {isLoading ? (
          <div style={{ padding: 24, textAlign: 'center', color: TEXT_COLORS.secondary }}>
            Loading players...
          </div>
        ) : players.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: TEXT_COLORS.secondary }}>
            No players found
          </div>
        ) : (
          <table
            style={{
              width: 'calc(100% - 8px)',
              marginLeft: 4,
              marginRight: 4,
              borderCollapse: 'collapse',
              tableLayout: 'fixed',
            }}
          >
            <colgroup>
              <col style={{ width: PLAYER_LIST_PX.adpColumnWidth }} />
              <col style={{ width: 'auto' }} />
              <col style={{ width: PLAYER_LIST_PX.queueButtonContainerWidth }} />
              <col style={{ width: PLAYER_LIST_PX.projColumnWidth }} />
              <col style={{ width: PLAYER_LIST_PX.rankColumnWidth }} />
            </colgroup>
            <thead
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 10,
                backgroundColor: BG_COLORS.primary,
              }}
            >
              <tr style={{ borderBottom: `1px solid ${PLAYER_LIST_COLORS.rowBorder}` }}>
                <th
                  onClick={handleSortAdp}
                  style={{
                    padding: `${PLAYER_LIST_PX.headerPaddingY}px 4px`,
                    textAlign: 'center',
                    fontSize: 14,
                    fontWeight: 500,
                    color: sortMode === 'adp' ? TEXT_COLORS.primary : TEXT_COLORS.secondary,
                    cursor: 'pointer',
                    background: 'transparent',
                    border: 'none',
                  }}
                >
                  <span style={{
                    borderBottom: sortMode === 'adp' ? '2px solid #6B7280' : '2px solid transparent',
                    paddingBottom: 2,
                  }}>
                    ADP
                  </span>
                </th>
                <th style={{ padding: `${PLAYER_LIST_PX.headerPaddingY}px 4px`, background: 'transparent' }} />
                <th style={{ padding: `${PLAYER_LIST_PX.headerPaddingY}px 4px`, background: 'transparent' }} />
                <th
                  onClick={handleSortProj}
                  style={{
                    padding: `${PLAYER_LIST_PX.headerPaddingY}px 4px`,
                    textAlign: 'center',
                    fontSize: 13,
                    fontWeight: 500,
                    color: sortMode === 'proj' ? TEXT_COLORS.primary : TEXT_COLORS.secondary,
                    cursor: 'pointer',
                    background: 'transparent',
                    border: 'none',
                  }}
                >
                  <span style={{
                    borderBottom: sortMode === 'proj' ? '2px solid #6B7280' : '2px solid transparent',
                    paddingBottom: 2,
                  }}>
                    PROJ
                  </span>
                </th>
                <th
                  onClick={handleSortRank}
                  style={{
                    padding: `${PLAYER_LIST_PX.headerPaddingY}px 4px`,
                    textAlign: 'center',
                    fontSize: 13,
                    fontWeight: 500,
                    color: sortMode === 'rank' ? TEXT_COLORS.primary : TEXT_COLORS.secondary,
                    cursor: 'pointer',
                    background: 'transparent',
                    border: 'none',
                  }}
                >
                  <span style={{
                    borderBottom: sortMode === 'rank' ? '2px solid #6B7280' : '2px solid transparent',
                    paddingBottom: 2,
                  }}>
                    RANK
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => (
                <React.Fragment key={player.id}>
                  <PlayerRow
                    player={player}
                    rank={player.rank ?? null}
                    isQueued={isQueued(player.id)}
                    onToggleQueue={() => onToggleQueue(player)}
                    onRowClick={() => handleRowClick(player.id)}
                  />
                  {/* Expanded Card */}
                  {expandedPlayerId === player.id && (
                    <tr>
                      <td colSpan={5} style={{ padding: '8px 4px' }}>
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
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
